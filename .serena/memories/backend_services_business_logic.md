# Services Métier Principaux - ShelfSpot Backend

## ItemsService (backend/src/items/items.service.ts)

### Symboles Clés

#### `create(data)` - Ligne 94-121
- **Symbole:** `ItemsService/create`
- **Flux:**
  1. Crée l'item avec Prisma (inclut room, place, container, itemTags)
  2. **Trigger asynchrone:** Appelle `alertsService.checkItemAlerts()` si quantity présente
  3. Transforme et retourne l'item
- **Dépendances:** PrismaService, AlertsService

#### `update(id, data)` - Ligne 165-276
- **Symbole:** `ItemsService/update`
- **Flux complexe:**
  1. Récupère l'ancienne quantité
  2. Sépare les tags du reste des données
  3. Update l'item
  4. Si tags fournis:
     - Supprime les anciens ItemTag
     - Crée ou récupère chaque Tag
     - Crée les nouvelles relations ItemTag
  5. **Trigger d'alerte:** Si quantity modifiée, appelle `alertsService.checkItemAlerts()`
- **Particularité:** Gestion manuelle des tags (many-to-many)
- **Références:** Appelé par `ItemsController/update` (ligne 173)

#### `findAll()`, `findOne(id)`, `search(query)`
- Récupération d'items avec relations complètes
- `transformItem()` utilisé pour formatter la réponse

#### `getInventoryValue()` - Calcul de la valeur totale
- Retourne `InventoryValueResponse`: totalValue, totalItems, itemsWithValue

#### `getStatusStatistics()` - Statistiques par status

### Dépendances injectées:
- `prisma: PrismaService`
- `alertsService: AlertsService`
- `scoringService: ScoringService`

## AlertsService (backend/src/alerts/alerts.service.ts)

### Symboles Clés

#### `checkItemAlerts(itemId, quantity)` - Non exploré mais référencé
- **Appelé par:**
  - `ItemsService/create` (ligne 111)
  - `ItemsService/update` (ligne 249, 269)
  - `ConsumablesService/create` (ligne 90)
  - `ConsumablesService/update` (ligne 139)
  - `NotificationsController/testAlertReset` (ligne 99)
- **Rôle:** Vérifie si la nouvelle quantité déclenche des alertes

#### `checkAlerts()` - Ligne 218-352
- **Symbole:** `AlertsService/checkAlerts`
- **Flux détaillé:**
  1. Récupère toutes les alertes actives avec items
  2. Filtre celles où `item.quantity <= alert.threshold`
  3. Filtre celles non envoyées depuis 24h (lastSent)
  4. **Email:** Envoie via `emailService.sendAlertEmail()`
  5. **Push Notifications:** 
     - Récupère users avec notificationToken
     - Construit le message (title + body)
     - Appelle `pushNotificationService.sendPushNotifications()`
  6. Update `lastSent` dans Prisma
- **Retour:** checkedAlerts, triggeredAlerts, sentAlerts counts

#### `create()`, `update()`, `remove()`
- CRUD standard pour les alertes

#### `getMonthlyStatistics()`
- Statistiques d'alertes par mois

### Dépendances:
- `prisma: PrismaService`
- `emailService: EmailService`
- `pushNotificationService: PushNotificationService`

## ProjectsService (backend/src/projects/projects.service.ts)

### Symboles Clés

#### `addItemToProject(projectId, itemId, quantity)`
- Crée une relation ProjectItem
- **Trigger:** Appelle `scoringService.recalculateProjectItemsScores()`

#### `removeItemFromProject(projectId, itemId)`
- Supprime la relation ProjectItem
- **Trigger:** Recalcule les scores

#### `getProjectStatistics()`
- Statistiques par status et priority

### Dépendances:
- `prisma: PrismaService`
- `scoringService: ScoringService`

## ScoringService (backend/src/scoring/scoring.service.ts)

### Symboles Clés (ligne 12-254)

#### `calculateItemScore(itemId)`
- Calcule le score d'importance d'un item
- Basé sur l'utilisation dans les projets actifs

#### `recalculateProjectItemsScores(projectId?)`
- Recalcule les scores de tous les items d'un projet
- Si projectId null: recalcule TOUS les items

#### `getCriticalItems(limit)`, `getTopImportanceItems(limit)`
- Récupère les items triés par importance

### Formule de scoring:
- Basée sur ProjectPriority et ProjectStatus
- Utilise `getPriorityMultiplier()` et `computeScore()`

## ConsumablesService (backend/src/consumables/consumables.service.ts)

Très similaire à ItemsService, mais filtre `consumable: true`
- Utilise les mêmes triggers d'alertes
- Gère la création/mise à jour d'items consommables