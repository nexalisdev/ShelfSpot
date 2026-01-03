# Architecture Backend - ShelfSpot

## Structure des Modules (AppModule)

### Module Principal (app.module.ts)
**Symbole clé:** `AppModule` (ligne 20-45)
- **Localisation:** `backend/src/app.module.ts`
- **Type:** Class (NestJS Module)

### Modules importés (ordre de dépendance):
1. **ConfigModule** - Configuration globale (.env)
2. **PrismaModule** - ORM Database
3. **AuthModule** - Authentification & Autorisation
4. **ItemsModule** - Gestion des items
5. **RoomsModule** - Gestion des pièces
6. **PlacesModule** - Gestion des lieux
7. **FavouritesModule** - Favoris utilisateurs
8. **ConsumablesModule** - Consommables
9. **TagsModule** - Système d'étiquettes
10. **ContainersModule** - Conteneurs
11. **AlertsModule** - Alertes de stock
12. **EmailModule** - Service email
13. **ScoringModule** - Système de notation
14. **ProjectsModule** - Gestion de projets
15. **NotificationsModule** - Notifications push
16. **PreferencesModule** - Préférences utilisateurs

### Point d'entrée (main.ts)
**Symbole clé:** `bootstrap()` (ligne 8-58)
- **Localisation:** `backend/src/main.ts`
- **Configuration:**
  - Port: 3001 (configurable via PORT env)
  - ValidationPipe global activé
  - CORS: localhost:3000, localhost:3001, frontend:3000
  - Swagger UI: /api/swagger
  - JWT Bearer Auth configuré

## Architecture Modulaire

### Pattern NestJS Standard:
Chaque module suit la structure:
- **Controller** - Endpoints API (décorateurs REST)
- **Service** - Logique métier
- **Module** - Configuration du module
- **DTO** (Data Transfer Objects) - Validation des données
- **Spec** - Tests unitaires (pour certains modules)

## Dépendances entre modules

### Services injectés:
- `PrismaService` - Utilisé par tous les services pour accéder à la DB
- `AlertsService` - Injecté dans `ItemsService` et `ConsumablesService`
- `ScoringService` - Injecté dans `ItemsService` et `ProjectsService`
- `EmailService` - Injecté dans `AlertsService`
- `PushNotificationService` - Injecté dans `AlertsService`