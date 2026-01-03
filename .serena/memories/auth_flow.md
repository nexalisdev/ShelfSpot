# Flux d'Authentification - ShelfSpot Backend

## Symboles Clés

### AuthService (backend/src/auth/auth.service.ts)
**Méthodes principales:**

#### `validateUser(email, password)` - Ligne 46-74
- **Symbole:** `AuthService/validateUser`
- **Rôle:** Vérifie les credentials avec bcrypt
- **Flux:**
  1. Recherche l'utilisateur par email dans Prisma
  2. Compare le password avec bcrypt.compare()
  3. Retourne UserPayload (sans password) ou null
- **Retour:** `UserPayload | null`

#### `login(loginDto)` - Ligne 76-112
- **Symbole:** `AuthService/login`
- **Rôle:** Génère le token JWT après validation
- **Flux:**
  1. Appelle `validateUser()`
  2. Si valide, crée le payload JWT (sub, email, name, admin, notificationToken)
  3. Signe le token avec `jwtService.sign()`
  4. Retourne access_token + user info
- **Retour:** `AuthResult` (access_token, token_type, expires_in: 3600s, user)

#### `register(registerDto)` - Non exploré mais présent
- Création d'un nouvel utilisateur
- Hash du password avec bcrypt

#### `forgotPassword(email)` & `resetPassword(token, newPassword)`
- Flux de réinitialisation de mot de passe par email

### JwtStrategy (backend/src/auth/strategies/jwt.strategy.ts)

#### `validate(payload: JwtPayload)` - Ligne 25-52
- **Symbole:** `JwtStrategy/validate`
- **Rôle:** Validateur Passport pour chaque requête authentifiée
- **Flux:**
  1. Extrait userId du payload JWT (payload.sub)
  2. Vérifie que l'utilisateur existe toujours en DB
  3. Si non trouvé → UnauthorizedException
  4. Retourne UserPayload pour injection dans req.user
- **Configuration:** Passport automatique extraction du Bearer token

### AuthController (backend/src/auth/auth.controller.ts)
**Méthodes principales:**
- `login()` - POST /auth/login
- `register()` - POST /auth/register
- `getProfile()` - GET /auth/profile (nécessite JWT)
- `updateEmail()`, `updateName()` - Mise à jour profil
- `forgotPassword()`, `resetPassword()` - Reset password

### Guards Utilisés
1. **JwtAuthGuard** (`backend/src/auth/guards/jwt-auth.guard.ts`)
   - Protège les routes nécessitant authentification
   - Utilise JwtStrategy pour validation

2. **LocalAuthGuard** (`backend/src/auth/guards/local-auth.guard.ts`)
   - Utilisé pour /auth/login
   - Utilise LocalStrategy

3. **AdminGuard** (`backend/src/auth/guards/admin.guard.ts`)
   - Vérifie que user.admin === true
   - Pour routes admin uniquement

## Flux Complet d'Authentification

### 1. Login
```
Client → POST /auth/login {email, password}
  → AuthController/login()
    → AuthService/login()
      → AuthService/validateUser() 
        → Prisma.user.findUnique()
        → bcrypt.compare()
      → jwtService.sign(payload)
    ← {access_token, user}
```

### 2. Requête Authentifiée
```
Client → GET /items (avec Header: Authorization: Bearer <token>)
  → JwtAuthGuard
    → JwtStrategy/validate()
      → Prisma.user.findUnique(userId)
      → Injection de req.user
  → ItemsController/findAll()
```

### 3. Requête Admin
```
Client → POST /auth/users (avec JWT token)
  → JwtAuthGuard → user authentifié
  → AdminGuard → vérifie user.admin === true
  → AdminController/createUser()
```

## Interfaces & DTOs

### JwtPayload (backend/src/auth/interfaces/auth.interface.ts)
- `sub` (string) - userId
- `email`, `name`, `admin`, `notificationToken`

### UserPayload
- `id`, `email`, `name?`, `admin`, `notificationToken?`

### DTOs
- `LoginDto` - email, password
- `RegisterDto` - email, password, name?
- `AuthResult` - access_token, token_type, expires_in, user