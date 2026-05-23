#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# == Helpers ==================================================================
function Write-Banner ($msg) { Write-Host "`n$msg" -ForegroundColor Cyan }
function Write-Step   ($msg) { Write-Host "`n  > $msg" -ForegroundColor Blue }
function Write-OK     ($msg) { Write-Host "    v $msg" -ForegroundColor Green }
function Write-Warn   ($msg) { Write-Host "    ! $msg" -ForegroundColor Yellow }
function Write-Fail   ($msg) { Write-Host "`n  x $msg" -ForegroundColor Red; exit 1 }

function Read-Default ($prompt, $default) {
    $answer = Read-Host "  $prompt [$default]"
    if ([string]::IsNullOrWhiteSpace($answer)) { return $default }
    return $answer
}
function Read-Required ($prompt) {
    while ($true) {
        $answer = Read-Host "  $prompt"
        if (-not [string]::IsNullOrWhiteSpace($answer)) { return $answer }
        Write-Warn "This field is required."
    }
}

function Require-Node {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Fail "Node.js is not installed. Download from https://nodejs.org (v18+)."
    }
    $v = (node -e "process.stdout.write(process.versions.node)")
    $major = [int]($v -split '\.')[0]
    if ($major -lt 18) { Write-Fail "Node.js v18+ required (found v$v). Please upgrade." }
    Write-OK "Node.js v$v"
}

function Require-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Fail "Docker is not installed. Download Docker Desktop from https://docs.docker.com/get-docker/"
    }
    try { docker info 2>&1 | Out-Null } catch { Write-Fail "Docker is not running. Start Docker Desktop and re-run." }
    $composeCheck = docker compose version 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Fail "Docker Compose v2 required. Update Docker Desktop." }
    Write-OK "Docker $(docker --version | Select-String -Pattern '\d+\.\d+\.\d+' | ForEach-Object { $_.Matches[0].Value })"
}

function New-Secret {
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
}

function New-Password {
    $bytes = New-Object byte[] 12
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
}

function Wait-Healthy ($service, $maxSeconds = 60) {
    Write-Step "Waiting for $service to be healthy..."
    $elapsed = 0
    while ($elapsed -lt $maxSeconds) {
        try {
            $status = docker inspect --format='{{.State.Health.Status}}' "shelfspot_$service" 2>$null
            if ($LASTEXITCODE -eq 0 -and $status -eq "healthy") { Write-OK "$service is healthy"; return }
        } catch {
            # Container not yet available
        }
        Start-Sleep -Seconds 3
        $elapsed += 3
    }
    Write-Warn "$service did not report healthy within ${maxSeconds}s."
}

function Wait-Backend ($url, $maxSeconds = 90) {
    Write-Step "Waiting for backend API to be ready..."
    $elapsed = 0
    while ($elapsed -lt $maxSeconds) {
        try {
            Invoke-WebRequest -Uri "$url/auth/profile" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop | Out-Null
            Write-OK "Backend is ready"; return
        } catch {
            try {
                $code = [int]$_.Exception.Response.StatusCode
                if ($code -eq 401 -or $code -eq 200) { Write-OK "Backend is ready"; return }
            } catch {
                # Connection refused or no HTTP response — keep waiting
            }
        }
        Start-Sleep -Seconds 3
        $elapsed += 3
    }
    Write-Warn "Backend did not become ready within ${maxSeconds}s. Admin account creation may fail."
}

function New-AdminUser ($backendUrl, $pgUser, $pgDb) {
    Write-Banner "Admin Account Setup"
    Write-Host "  Create your administrator account for ShelfSpot."
    Write-Host ""

    $adminName = Read-Required "Admin display name (min 5 chars)"
    while ($adminName.Length -lt 5) {
        Write-Warn "Name must be at least 5 characters."
        $adminName = Read-Required "Admin display name"
    }

    $adminEmail = Read-Required "Admin email"

    while ($true) {
        $adminPass = Read-Required "Admin password (8-32 chars)"
        if ($adminPass.Length -lt 8 -or $adminPass.Length -gt 32) {
            Write-Warn "Password must be between 8 and 32 characters."; continue
        }
        $confirm = Read-Required "Confirm password"
        if ($adminPass -eq $confirm) { break }
        Write-Warn "Passwords do not match. Try again."
    }

    $body = @{ email = $adminEmail; password = $adminPass; name = $adminName } | ConvertTo-Json -Compress
    try {
        Invoke-RestMethod -Uri "$backendUrl/auth/register" -Method Post -Body $body -ContentType "application/json" | Out-Null
    } catch {
        $code = 0
        try { $code = [int]$_.Exception.Response.StatusCode } catch {}
        if ($code -eq 409) { Write-Fail "Email $adminEmail is already registered." }
        Write-Fail "Registration failed (HTTP $code). Check logs: docker logs shelfspot_backend"
    }
    Write-OK "Account registered"

    $escapedEmail = $adminEmail.Replace("'", "''")
    $sql = "UPDATE `"User`" SET admin=true WHERE email='$escapedEmail';"
    $sql | docker exec -i shelfspot_db psql -U $pgUser -d $pgDb 2>&1 | Out-Null
    Write-OK "$adminEmail is now an administrator"
}

function Write-BackendEnv ($params) {
    $file = Join-Path $PSScriptRoot "backend\.env"
    @"
DATABASE_URL="$($params.DatabaseUrl)"
JWT_SECRET="$($params.JwtSecret)"
RESEND_API_KEY="$($params.ResendKey)"
RESEND_FROM_EMAIL="$($params.ResendFrom)"
ALERT_EMAIL_RECIPIENT="$($params.AlertEmail)"
"@ | Set-Content $file -Encoding utf8
    Write-OK "backend\.env written"
}

function Write-RootEnv ($params) {
    $file = Join-Path $PSScriptRoot ".env"
    @"
POSTGRES_USER=$($params.PgUser)
POSTGRES_PASSWORD=$($params.PgPass)
POSTGRES_DB=$($params.PgDb)
DB_PORT=$($params.DbPort)
BACKEND_PORT=$($params.BackendPort)
FRONTEND_PORT=$($params.FrontendPort)
NEXT_PUBLIC_BACKEND_URL=$($params.BackendUrl)
"@ | Set-Content $file -Encoding utf8
    Write-OK ".env written"
}

function Install-Cli ($url) {
    $cliDir = Join-Path $PSScriptRoot "cli"
    if (-not (Test-Path $cliDir)) { Write-Fail "cli/ directory not found." }

    Write-Step "Building CLI..."
    Push-Location $cliDir
    try { npm install --silent; npm run build --silent } finally { Pop-Location }
    Write-OK "CLI built"

    Write-Step "Installing shelfspot command globally..."
    Push-Location $cliDir
    try {
        $tgz = (npm pack --silent 2>&1 | Select-Object -Last 1).Trim()
        npm install -g $tgz --silent
        Remove-Item $tgz -ErrorAction SilentlyContinue
    } finally { Pop-Location }
    Write-OK "shelfspot installed"

    [System.Environment]::SetEnvironmentVariable("SHELFSPOT_URL", $url, "User")
    $env:SHELFSPOT_URL = $url
    Write-OK "SHELFSPOT_URL=$url saved to user environment variables"
    Write-Warn "Open a new terminal for the environment variable to take effect."

    Write-Step "Logging in to ShelfSpot..."
    shelfspot auth login
}

# =============================================================================
Clear-Host
Write-Host ""
Write-Host "  +======================================+" -ForegroundColor Cyan
Write-Host "  |      ShelfSpot Setup Wizard          |" -ForegroundColor Cyan
Write-Host "  +======================================+" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Inventory management - setup assistant"
Write-Host ""

Write-Host "  What would you like to install?" -ForegroundColor White
Write-Host ""
Write-Host "    1)  Full suite       database + backend + frontend + CLI"
Write-Host "    2)  Backend stack    database + backend API only"
Write-Host "    3)  Frontend only    web app  (backend is hosted elsewhere)"
Write-Host "    4)  CLI only         connect to an existing ShelfSpot instance"
Write-Host "    5)  Custom           pick individual components"
Write-Host ""
$choice = Read-Host "  Choice [1-5]"

# == OPTION 1 - FULL SUITE ====================================================
if ($choice -eq "1") {
    Write-Banner "Full Suite Setup"
    Require-Docker; Require-Node

    Write-Step "Configuring ports"
    $backendPort  = Read-Default "Backend port"  "8082"
    $frontendPort = Read-Default "Frontend port" "8083"
    $dbPort       = Read-Default "Database port" "5432"

    Write-Step "Configuring database"
    $pgUser  = Read-Default "Postgres user"     "postgres"
    $genPass = New-Password
    Write-Host ""
    Write-Host "    Generated Postgres password: $genPass" -ForegroundColor Yellow
    Write-Host "    Saved to .env -- note it if you need direct DB access." -ForegroundColor DarkGray
    Write-Host ""
    $pgPass  = Read-Default "Postgres password" $genPass
    $pgDb    = Read-Default "Postgres database" "shelfspot"

    $jwtSecret   = New-Secret
    $databaseUrl = "postgresql://${pgUser}:${pgPass}@db:5432/${pgDb}"
    Write-OK "JWT secret generated"

    Write-Step "Email alerts (optional - leave blank to skip)"
    $resendKey = Read-Host "  Resend API key"
    $resendFrom = ""; $alertEmail = ""
    if (-not [string]::IsNullOrWhiteSpace($resendKey)) {
        $fromEmail  = Read-Required "From email"
        $resendFrom = "ShelfSpot <$fromEmail>"
        $alertEmail = Read-Required "Alert recipient email"
    }

    Write-BackendEnv @{ DatabaseUrl=$databaseUrl; JwtSecret=$jwtSecret; ResendKey=$resendKey; ResendFrom=$resendFrom; AlertEmail=$alertEmail }
    Write-RootEnv   @{ PgUser=$pgUser; PgPass=$pgPass; PgDb=$pgDb; DbPort=$dbPort; BackendPort=$backendPort; FrontendPort=$frontendPort; BackendUrl="http://localhost:$backendPort" }

    Write-Step "Building and starting containers (this may take a few minutes)..."
    Set-Location $PSScriptRoot
    try { docker compose --profile full down -v --remove-orphans 2>&1 | Out-Null } catch {}
    docker compose --profile full up -d --build

    Wait-Healthy "db"
    Wait-Backend "http://localhost:$backendPort"
    New-AdminUser "http://localhost:$backendPort" $pgUser $pgDb

    Write-Host ""
    Write-OK "ShelfSpot is running!"
    Write-Host "    Backend:  http://localhost:$backendPort"
    Write-Host "    Frontend: http://localhost:$frontendPort"
    Write-Host "    Swagger:  http://localhost:$backendPort/api/swagger"

    $installCli = Read-Host "`n  Install the CLI tool on this machine? [Y/n]"
    if ($installCli -notmatch "^[Nn]") {
        Install-Cli "http://localhost:$backendPort"
    }
    Write-OK "Setup complete."

# == OPTION 2 - BACKEND STACK =================================================
} elseif ($choice -eq "2") {
    Write-Banner "Backend Stack Setup"
    Require-Docker

    $backendPort = Read-Default "Backend port"  "8082"
    $dbPort      = Read-Default "Database port" "5432"

    Write-Step "Configuring database"
    $pgUser  = Read-Default "Postgres user"     "postgres"
    $genPass = New-Password
    Write-Host ""
    Write-Host "    Generated Postgres password: $genPass" -ForegroundColor Yellow
    Write-Host "    Saved to .env -- note it if you need direct DB access." -ForegroundColor DarkGray
    Write-Host ""
    $pgPass  = Read-Default "Postgres password" $genPass
    $pgDb    = Read-Default "Postgres database" "shelfspot"

    $jwtSecret   = New-Secret
    $databaseUrl = "postgresql://${pgUser}:${pgPass}@db:5432/${pgDb}"

    $resendKey = Read-Host "  Resend API key (leave blank to skip)"
    $resendFrom = ""; $alertEmail = ""
    if (-not [string]::IsNullOrWhiteSpace($resendKey)) {
        $fromEmail  = Read-Required "From email"
        $resendFrom = "ShelfSpot <$fromEmail>"
        $alertEmail = Read-Required "Alert recipient email"
    }

    Write-BackendEnv @{ DatabaseUrl=$databaseUrl; JwtSecret=$jwtSecret; ResendKey=$resendKey; ResendFrom=$resendFrom; AlertEmail=$alertEmail }
    Write-RootEnv   @{ PgUser=$pgUser; PgPass=$pgPass; PgDb=$pgDb; DbPort=$dbPort; BackendPort=$backendPort; FrontendPort="8083"; BackendUrl="" }

    Set-Location $PSScriptRoot
    try { docker compose --profile backend down -v --remove-orphans 2>&1 | Out-Null } catch {}
    docker compose --profile backend up -d --build

    Wait-Healthy "db"
    Wait-Backend "http://localhost:$backendPort"
    New-AdminUser "http://localhost:$backendPort" $pgUser $pgDb

    Write-OK "Backend running at http://localhost:$backendPort"

    $installCli = Read-Host "`n  Install the CLI tool? [Y/n]"
    if ($installCli -notmatch "^[Nn]") { Require-Node; Install-Cli "http://localhost:$backendPort" }
    Write-OK "Setup complete."

# == OPTION 3 - FRONTEND ONLY =================================================
} elseif ($choice -eq "3") {
    Write-Banner "Frontend Setup"
    Require-Docker

    $backendUrl   = (Read-Required "Backend URL (e.g. http://192.168.1.10:8082)").TrimEnd('/')
    $frontendPort = Read-Default "Frontend port" "8083"

    Write-RootEnv @{ PgUser="postgres"; PgPass=""; PgDb="shelfspot"; DbPort="5432"; BackendPort="8082"; FrontendPort=$frontendPort; BackendUrl=$backendUrl }
    "NEXT_PUBLIC_BACKEND_URL=$backendUrl" | Set-Content (Join-Path $PSScriptRoot "frontend\.env.local") -Encoding utf8
    Write-OK "frontend\.env.local written"

    Set-Location $PSScriptRoot
    docker compose --profile frontend up -d --build

    Write-OK "Frontend running at http://localhost:$frontendPort"
    Write-OK "Setup complete."

# == OPTION 4 - CLI ONLY ======================================================
} elseif ($choice -eq "4") {
    Write-Banner "CLI Setup"
    Require-Node

    Write-Host ""
    Write-Host "  Examples:  http://192.168.1.100:8082"
    Write-Host "             https://shelfspot.myhome.net"
    Write-Host ""
    $url = (Read-Required "ShelfSpot URL").TrimEnd('/')

    Write-Step "Testing connection..."
    try {
        Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Write-OK "ShelfSpot is reachable"
    } catch {
        Write-Warn "Could not reach $url. Make sure the server is running."
    }

    Install-Cli $url
    Write-OK "CLI ready. Run 'shelfspot --help' to get started."

# == OPTION 5 - CUSTOM ========================================================
} elseif ($choice -eq "5") {
    Write-Banner "Custom Setup"

    $wantsDb       = (Read-Host "  Install database (PostgreSQL via Docker)? [Y/n]") -notmatch "^[Nn]"
    $wantsBackend  = (Read-Host "  Install backend API (Docker)?             [Y/n]") -notmatch "^[Nn]"
    $wantsFrontend = (Read-Host "  Install frontend web app (Docker)?        [Y/n]") -notmatch "^[Nn]"
    $wantsCli      = (Read-Host "  Install CLI tool?                         [Y/n]") -notmatch "^[Nn]"

    $needsDocker = $wantsDb -or $wantsBackend -or $wantsFrontend
    if ($needsDocker) { Require-Docker }
    if ($wantsCli)    { Require-Node }

    $pgUser="postgres"; $pgPass=""; $pgDb="shelfspot"; $dbPort="5432"
    $backendPort="8082"; $frontendPort="8083"; $backendUrl=""
    $jwtSecret=""; $resendKey=""; $resendFrom=""; $alertEmail=""
    $databaseUrl="postgresql://postgres:@db:5432/shelfspot"

    if ($wantsDb -or $wantsBackend) {
        Write-Step "Configuring database"
        $pgUser  = Read-Default "Postgres user"     "postgres"
        $genPass = New-Password
        Write-Host ""
        Write-Host "    Generated Postgres password: $genPass" -ForegroundColor Yellow
        Write-Host "    Saved to .env -- note it if you need direct DB access." -ForegroundColor DarkGray
        Write-Host ""
        $pgPass  = Read-Default "Postgres password" $genPass
        $pgDb    = Read-Default "Postgres database" "shelfspot"
        $dbPort  = Read-Default "Database port"     "5432"
        $databaseUrl = "postgresql://${pgUser}:${pgPass}@db:5432/${pgDb}"
    }
    if ($wantsBackend) {
        $backendPort = Read-Default "Backend port" "8082"
        $jwtSecret   = New-Secret
        Write-OK "JWT secret generated"
        $resendKey   = Read-Host "  Resend API key (leave blank to skip)"
        if (-not [string]::IsNullOrWhiteSpace($resendKey)) {
            $fromEmail  = Read-Required "From email"
            $resendFrom = "ShelfSpot <$fromEmail>"
            $alertEmail = Read-Required "Alert recipient email"
        }
        Write-BackendEnv @{ DatabaseUrl=$databaseUrl; JwtSecret=$jwtSecret; ResendKey=$resendKey; ResendFrom=$resendFrom; AlertEmail=$alertEmail }
    }
    if ($wantsFrontend) {
        $frontendPort = Read-Default "Frontend port" "8083"
        if (-not $wantsBackend) {
            $backendUrl = (Read-Required "Backend URL (e.g. http://192.168.1.10:8082)").TrimEnd('/')
        } else {
            $backendUrl = "http://localhost:$backendPort"
        }
        "NEXT_PUBLIC_BACKEND_URL=$backendUrl" | Set-Content (Join-Path $PSScriptRoot "frontend\.env.local") -Encoding utf8
        Write-OK "frontend\.env.local written"
    }

    Write-RootEnv @{ PgUser=$pgUser; PgPass=$pgPass; PgDb=$pgDb; DbPort=$dbPort; BackendPort=$backendPort; FrontendPort=$frontendPort; BackendUrl=$backendUrl }

    if ($needsDocker) {
        $profileArgs = @()
        if ($wantsDb -or $wantsBackend)  { $profileArgs += "--profile"; $profileArgs += "backend" }
        if ($wantsFrontend)              { $profileArgs += "--profile"; $profileArgs += "frontend" }

        Set-Location $PSScriptRoot
        & docker compose @profileArgs up -d --build
        if ($wantsDb -or $wantsBackend) { Wait-Healthy "db" }
    }

    if ($wantsBackend) {
        Wait-Backend "http://localhost:$backendPort"
        New-AdminUser "http://localhost:$backendPort" $pgUser $pgDb
    }

    if ($wantsCli) {
        $cliUrl = if ($wantsBackend) { "http://localhost:$backendPort" }
                  else { (Read-Required "ShelfSpot URL to connect the CLI to").TrimEnd('/') }
        Install-Cli $cliUrl
    }

    Write-OK "Custom setup complete."
    if ($wantsBackend)  { Write-Host "    API:      http://localhost:$backendPort" }
    if ($wantsFrontend) { Write-Host "    Frontend: http://localhost:$frontendPort" }

} else {
    Write-Fail "Invalid choice: $choice"
}

Write-Host ""
