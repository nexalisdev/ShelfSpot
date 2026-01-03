# Map Architecturale Complète - ShelfSpot

## Vue d'Ensemble du Projet

ShelfSpot est une application full-stack de gestion d'inventaire avec système de projets, alertes de stock, et scoring d'importance des items.

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Pages (App  │  │  Components  │  │  Hooks & Context │  │
│  │    Router)   │  │   (shadcn)   │  │  (State Mgmt)    │  │
│  └──────┬───────┘  └──────────────┘  └────────┬─────────┘  │
│         │                                       │             │
│         └───────────────────┬───────────────────┘             │
│                             │                                 │
│                    ┌────────▼─────────┐                       │
│                    │ BackendApiService│                       │
│                    └────────┬─────────┘                       │
└─────────────────────────────┼─────────────────────────────────┘
                              │ HTTP/REST + JWT
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                      BACKEND (NestJS)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Controllers  │→ │   Services   │→ │  PrismaService   │    │
│  │  (Routes)    │  │ (Bus. Logic) │  │   (ORM Layer)    │    │
│  └──────────────┘  └──────┬───────┘  └────────┬─────────┘    │
│                            │                    │               │
│         ┌──────────────────┼────────────────────┘               │
│         │                  │                                    │
│  ┌──────▼────────┐  ┌──────▼────────┐  ┌──────────────────┐  │
│  │ AuthService   │  │ AlertsService │  │ ScoringService   │  │
│  │ + JWT/Bcrypt  │  │ + EmailService│  │ (Importance)     │  │
│  └───────────────┘  └───────────────┘  └──────────────────┘  │
└─────────────────────────────┬─────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  MySQL Database    │
                    │  (Prisma Schema)   │
                    └────────────────────┘
```

## Modules Backend (Ordre d'Importance)

### 1. Core System
- **PrismaModule** - Accès DB (injecté partout)
- **AuthModule** - JWT Auth, Guards, Strategies
- **ConfigModule** - Variables d'environnement

### 2. Domain Logic
- **ItemsModule** - CŒUR: Gestion des items (inventory)
- **ProjectsModule** - Projets avec items associés
- **AlertsModule** - Surveillance de stock + notifications
- **ScoringModule** - Calcul d'importance des items

### 3. Organization Entities
- **RoomsModule** - Pièces
- **PlacesModule** - Lieux dans les pièces
- **ContainersModule** - Conteneurs
- **TagsModule** - Étiquettes

### 4. User Features
- **FavouritesModule** - Favoris utilisateurs
- **ConsumablesModule** - Sous-ensemble d'items (consumable=true)
- **PreferencesModule** - Préférences UI utilisateur

### 5. Infrastructure
- **EmailModule** - Envoi d'emails (alertes)
- **NotificationsModule** - Push notifications

## Entités Prisma & Relations

### Hiérarchie de Localisation
```
Room (pièce)
  └── Place (lieu)
       └── Container (conteneur)
            └── Item
```

### Relations Item (Centre du système)
```
Item ───── Room (N:1)
     ───── Place (N:1)
     ───── Container (N:1)
     ───── ItemTag (1:N) ───── Tag (N:1)
     ───── Alert (1:N)
     ───── Favourite (1:N) ───── User (N:1)
     ───── ProjectItem (1:N) ───── Project (N:1)
```

### Système Utilisateur
```
User ───── Favourite (1:N)
     ───── UserPreferences (1:1)
```

## Flux Métier Principaux

### Flux 1: Création d'Item
```
Frontend: ItemsTable → backendApi.createItem()
  ↓
Backend: ItemsController.create()
  → ItemsService.create()
    → Prisma.item.create()
    → AlertsService.checkItemAlerts() [ASYNC]
  ← TransformedItem
```

### Flux 2: Mise à Jour d'Item avec Quantité
```
Frontend: ItemsTable → backendApi.updateItem()
  ↓
Backend: ItemsController.update()
  → ItemsService.update()
    → Prisma.item.update()
    → Gestion des tags (delete + create ItemTag)
    → SI quantity changée:
       → AlertsService.checkItemAlerts() [ASYNC]
  ← TransformedItem
```

### Flux 3: Vérification d'Alertes Globale
```
Backend: AlertsService.checkAlerts() [CRON ou manuel]
  → Récupère toutes alertes actives
  → Filtre: item.quantity <= threshold
  → Filtre: lastSent > 24h
  → EmailService.sendAlertEmail()
  → PushNotificationService.sendPushNotifications()
  → Update lastSent
```

### Flux 4: Ajout d'Item à Projet
```
Frontend: ProjectDetailsModal → backendApi.addItemToProject()
  ↓
Backend: ProjectsController.addItemToProject()
  → ProjectsService.addItemToProject()
    → Prisma.projectItem.create()
    → ScoringService.recalculateProjectItemsScores()
       → Met à jour importanceScore de tous les items du projet
```

### Flux 5: Authentification
```
Frontend: LoginForm → backendApi.login()
  ↓
Backend: AuthController.login()
  → LocalAuthGuard → LocalStrategy
    → AuthService.validateUser() (bcrypt)
  → AuthService.login()
    → jwtService.sign(payload)
  ← {access_token, user}
  ↓
Frontend: Stocke token dans localStorage
         → AuthContext met à jour user state
```

### Flux 6: Requête Protégée
```
Frontend: useGetItems() → backendApi.getItems()
  Header: Authorization: Bearer <token>
  ↓
Backend: ItemsController.findAll()
  ← JwtAuthGuard
    → JwtStrategy.validate()
      → Vérifie token + user exists
      → Injecte req.user
  → ItemsService.findAll()
    → Prisma.item.findMany()
  ← Item[]
```

## Points d'Extension Identifiés

### Backend
- **AlertsService.checkItemAlerts()** - Appelé par ItemsService, ConsumablesService
- **ScoringService** - Calcul du importanceScore basé sur projets
- **Cascade Deletes** - Configurés dans Prisma schema
- **Validation** - ValidationPipe global (whitelist, transform)

### Frontend
- **Custom Hooks Pattern** - Tous les hooks suivent la même structure
- **BackendApiService** - Point central pour toutes les requêtes API
- **AuthContext** - Gestion globale de l'authentification
- **ProtectedRoute** - Wrapper pour routes nécessitant auth

## Fichiers de Configuration Clés

### Backend
- `backend/prisma/schema.prisma` - Schéma DB complet
- `backend/src/main.ts` - Bootstrap (CORS, Swagger, Validation)
- `backend/src/app.module.ts` - Configuration des modules
- `backend/.env` - DATABASE_URL, JWT_SECRET, PORT, ALERT_EMAIL_RECIPIENT

### Frontend
- `frontend/src/lib/backend-api.ts` - Service API
- `frontend/src/lib/auth-context.tsx` - Context d'auth
- `frontend/src/middleware.ts` - Protection des routes
- `frontend/tailwind.config.ts` - Configuration TailwindCSS