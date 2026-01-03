# Commandes Essentielles - ShelfSpot

## Backend (backend/)

### Installation & Setup
```powershell
cd backend
yarn install
cp .env.example .env  # Puis configurer DATABASE_URL, JWT_SECRET
```

### Prisma (Base de données)
```powershell
# Générer le client Prisma
yarn prisma generate

# Créer et appliquer une migration
yarn prisma migrate dev --name nom_migration

# Appliquer les migrations existantes
yarn prisma migrate deploy

# Ouvrir Prisma Studio (GUI DB)
yarn prisma studio

# Réinitialiser la DB (ATTENTION: supprime les données)
yarn prisma migrate reset
```

### Développement
```powershell
# Mode développement avec hot-reload
yarn start:dev

# Mode production
yarn build
yarn start:prod

# Tests
yarn test              # Tests unitaires
yarn test:watch        # Tests en mode watch
yarn test:cov          # Tests avec couverture

# Linting & Formatting
yarn lint              # ESLint check
yarn lint:fix          # ESLint auto-fix
yarn format            # Prettier format
```

### Debugging
```powershell
# Vérifier les types TypeScript
yarn tsc --noEmit

# Logs de l'application
# Les logs console.log() apparaissent dans le terminal où tourne yarn start:dev
```

## Frontend (frontend/)

### Installation & Setup
```powershell
cd frontend
yarn install
```

### Développement
```powershell
# Mode développement (port 3000 par défaut)
yarn dev

# Build de production
yarn build

# Démarrer le build de production
yarn start

# Linting & Formatting
yarn lint
yarn lint:fix
```

### Next.js Spécifique
```powershell
# Nettoyer le cache Next.js
Remove-Item -Recurse -Force .next

# Analyser le bundle
yarn build
# Ajouter ANALYZE=true dans package.json script si configuré
```

## Docker (Racine du projet)

### Build & Run
```powershell
# Build l'image complète
docker build -t shelfspot .

# Démarrer avec docker-compose
docker-compose -f docker-compose.unified.yml up -d

# Arrêter les conteneurs
docker-compose -f docker-compose.unified.yml down

# Voir les logs
docker-compose -f docker-compose.unified.yml logs -f

# Rebuild après changements
docker-compose -f docker-compose.unified.yml up --build
```

### Gestion des conteneurs
```powershell
# Lister les conteneurs actifs
docker ps

# Entrer dans un conteneur
docker exec -it <container_name> sh

# Supprimer les volumes (ATTENTION: supprime les données)
docker-compose -f docker-compose.unified.yml down -v
```

## Git (Racine du projet)

```powershell
# Status et branches
git status
git branch

# Commit standard
git add .
git commit -m "type(scope): message"
# Types: feat, fix, docs, style, refactor, test, chore

# Push et pull
git push origin main
git pull origin main

# Voir l'historique
git log --oneline --graph
```

## Utilitaires Windows PowerShell

```powershell
# Navigation
cd chemin\vers\dossier
Get-Location              # pwd équivalent
Set-Location path         # cd équivalent

# Fichiers et dossiers
Get-ChildItem            # ls équivalent
Get-ChildItem -Recurse   # ls -R équivalent
Get-Content fichier.txt  # cat équivalent
Select-String "pattern" fichier.txt  # grep équivalent

# Recherche de fichiers
Get-ChildItem -Recurse -Filter "*.ts"
Get-ChildItem -Recurse | Select-String "pattern"

# Processus
Get-Process              # ps équivalent
Stop-Process -Id <PID>   # kill équivalent
```

## Variables d'Environnement (.env Backend)

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/shelfspot"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="3600s"

# Server
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Email (pour les alertes)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
ALERT_EMAIL_RECIPIENT="recipient@example.com"
```

## Workflows Communs

### Démarrage Complet (Développement)
```powershell
# Terminal 1 - Backend
cd backend
yarn install
yarn prisma generate
yarn start:dev

# Terminal 2 - Frontend
cd frontend
yarn install
yarn dev
```

### Après Modification du Schema Prisma
```powershell
cd backend
yarn prisma migrate dev --name descriptive_name
yarn prisma generate
# Redémarrer yarn start:dev si nécessaire
```

### Création d'un Nouveau Module Backend
```powershell
cd backend
# NestJS CLI (si installé globalement)
nest generate module nom-module
nest generate controller nom-module
nest generate service nom-module
```