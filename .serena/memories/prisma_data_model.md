# Modèle de Données Prisma - ShelfSpot

**Localisation:** `backend/prisma/schema.prisma`

## Entités Principales

### User
**Localisation:** Ligne 11-24
- **Champs principaux:**
  - `id` (Int, PK, autoincrement)
  - `email` (String, unique, indexed)
  - `password` (String)
  - `name` (String?)
  - `admin` (Boolean, default: false)
  - `notificationToken` (String?)
  - `createdAt` (DateTime)
- **Relations:**
  - `favourites` (1:N avec Favourite)
  - `preferences` (1:1 avec UserPreferences)

### UserPreferences
**Localisation:** Ligne 26-42
- **Champs:** Flags booléens pour personnaliser le dashboard
  - `showWelcomeHeader`, `showStatsCards`, `showRecentItems`
  - `showRoomDistribution`, `showAlertsPerMonth`
  - `showInventoryValue`, `showStatusDistribution`
- **Relation:** Cascade delete avec User

### Item (Entité Centrale)
**Localisation:** Ligne 44-70
- **Champs principaux:**
  - `id`, `name`, `quantity`, `image`, `price`, `sellprice`
  - `status`, `consumable` (Boolean)
  - `itemLink` (String?) - Lien externe
  - `importanceScore` (Float, default: 0) - Score calculé
- **Relations:**
  - `place` (N:1 avec Place)
  - `room` (N:1 avec Room)
  - `container` (N:1 avec Container)
  - `alerts` (1:N avec Alert)
  - `favourites` (1:N avec Favourite)
  - `itemTags` (1:N avec ItemTag)
  - `projectItems` (1:N avec ProjectItem)
- **Indexes:** placeId, roomId, containerId, importanceScore

### Room, Place, Container (Hiérarchie de localisation)
- **Room** (ligne 79-86): Pièce principale
  - `name` (unique), `icon`
  - Relations: items, places, containers
- **Place** (ligne 72-82): Lieu dans une pièce
  - `name`, `icon`, `roomId`
  - Unique constraint: [name, roomId]
- **Container** (ligne 131-144): Conteneur
  - `name`, `icon`, `roomId`, `placeId`

### Tag & ItemTag (Système d'étiquettes)
**Localisation:** Lignes 88-110
- **Tag:** name (unique), icon
- **ItemTag:** Table de liaison many-to-many
  - Unique constraint: [itemId, tagId]
  - Cascade delete

### Favourite (Favoris utilisateurs)
**Localisation:** Ligne 112-123
- Table de liaison User-Item
- Unique constraint: [userId, itemId]
- Cascade delete

### Alert (Système d'alertes)
**Localisation:** Ligne 146-162
- **Champs:**
  - `itemId`, `threshold` (seuil), `name`
  - `isActive` (Boolean), `lastSent` (DateTime?)
- **Unique constraint:** [itemId, threshold]
- **Indexes:** itemId, isActive, threshold
- Cascade delete avec Item

### Project & ProjectItem (Gestion de projets)
**Localisation:** Lignes 164-211
- **Project:**
  - `name` (unique), `description`
  - `status` (ACTIVE/COMPLETED/PAUSED/CANCELLED)
  - `priority` (LOW/MEDIUM/HIGH/CRITICAL)
  - `startDate`, `endDate`
- **ProjectItem:** Liaison Project-Item
  - `quantity`, `isActive` (Boolean)
  - Unique constraint: [projectId, itemId]

## Enums
- **ProjectStatus:** ACTIVE, COMPLETED, PAUSED, CANCELLED
- **ProjectPriority:** LOW, MEDIUM, HIGH, CRITICAL