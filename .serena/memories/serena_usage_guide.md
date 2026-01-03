# Guide de Recherche et Modification - ShelfSpot avec Serena

## Comment Trouver des Symboles

### 1. Recherche par Nom de Symbole

#### Trouver une méthode/classe spécifique
```
Outil: find_symbol
Paramètres:
  - name_path_pattern: "ItemsService/update" (pour une méthode)
  - name_path_pattern: "ItemsService" (pour une classe)
  - relative_path: "backend/src/items/items.service.ts"
  - include_body: true (si vous voulez le code)
```

**Exemples de name_path:**
- Méthode: `AuthService/login`
- Constructeur: `AuthService/constructor`
- Fonction: `bootstrap`
- Classe: `AppModule`
- Interface: `JwtPayload`

#### Recherche floue
```
Paramètres:
  - name_path_pattern: "login" (trouve tous les symboles nommés "login")
  - substring_matching: true (trouve "getLogin", "loginUser", etc.)
```

### 2. Explorer un Fichier

#### Vue d'ensemble sans charger tout le code
```
Outil: get_symbols_overview
Paramètres:
  - relative_path: "backend/src/items/items.service.ts"
  - depth: 1 (pour voir les méthodes d'une classe)
```

**Résultat typique:**
```json
{
  "Class": [{
    "ItemsService": {
      "Method": ["create", "update", "findAll", "remove"],
      "Property": ["prisma", "alertsService"]
    }
  }]
}
```

### 3. Trouver les Références

#### Qui utilise cette méthode?
```
Outil: find_referencing_symbols
Paramètres:
  - name_path: "ItemsService/update"
  - relative_path: "backend/src/items/items.service.ts"
```

**Résultat:** Liste tous les endroits où cette méthode est appelée avec contexte de code.

### 4. Recherche par Pattern Texte

#### Chercher un pattern dans le code
```
Outil: search_for_pattern
Paramètres:
  - substring_pattern: "checkItemAlerts" (regex possible)
  - relative_path: "backend/src" (restreindre la recherche)
  - restrict_search_to_code_files: true
```

## Cas d'Usage Pratiques

### Cas 1: Modifier la Logique d'Alerte

**Objectif:** Changer le seuil de 24h pour les alertes

1. **Trouver le symbole:**
```
find_symbol(
  name_path_pattern="AlertsService/checkAlerts",
  relative_path="backend/src/alerts/alerts.service.ts",
  include_body=true
)
```

2. **Identifier la ligne:** Ligne 218-352
3. **Localiser le code:** Ligne 256 contient `hoursSinceLastSent >= 24`

4. **Modifier:**
```
replace_symbol_body(
  name_path="AlertsService/checkAlerts",
  relative_path="backend/src/alerts/alerts.service.ts",
  body="<nouveau code avec 12h au lieu de 24h>"
)
```

### Cas 2: Ajouter un Champ à un Item

**Objectif:** Ajouter un champ "warranty_date" aux items

1. **Modifier le schéma Prisma:**
```
Localisation: backend/prisma/schema.prisma (ligne 44-70)
Ajouter: warrantyDate DateTime?
```

2. **Trouver les DTOs:**
```
search_for_pattern(
  substring_pattern="class.*ItemDto",
  relative_path="backend/src/items/dto"
)
```

3. **Trouver les transformations:**
```
find_symbol(
  name_path_pattern="ItemsService/transformItem",
  relative_path="backend/src/items/items.service.ts",
  include_body=true
)
```

4. **Modifier le frontend:**
```
find_symbol(
  name_path_pattern="ItemsTable",
  relative_path="frontend/src/components/ItemsTable.tsx"
)
```

### Cas 3: Changer la Logique de Scoring

**Objectif:** Modifier le calcul du score d'importance

1. **Explorer le service:**
```
get_symbols_overview(
  relative_path="backend/src/scoring/scoring.service.ts",
  depth=1
)
```

2. **Analyser la méthode:**
```
find_symbol(
  name_path_pattern="ScoringService/computeScore",
  relative_path="backend/src/scoring/scoring.service.ts",
  include_body=true
)
```

3. **Trouver où c'est appelé:**
```
find_referencing_symbols(
  name_path="ScoringService/computeScore",
  relative_path="backend/src/scoring/scoring.service.ts"
)
```

### Cas 4: Ajouter un Endpoint API

**Objectif:** Ajouter GET /items/:id/history

1. **Analyser le controller existant:**
```
get_symbols_overview(
  relative_path="backend/src/items/items.controller.ts",
  depth=1
)
```

2. **Voir comment les routes sont définies:**
```
find_symbol(
  name_path_pattern="ItemsController/findOne",
  relative_path="backend/src/items/items.controller.ts",
  include_body=true
)
```

3. **Ajouter la méthode au service d'abord:**
```
insert_after_symbol(
  name_path="ItemsService/findOne",
  relative_path="backend/src/items/items.service.ts",
  new_code="async getHistory(id: number) { ... }"
)
```

4. **Ajouter la route au controller:**
```
insert_after_symbol(
  name_path="ItemsController/findOne",
  relative_path="backend/src/items/items.controller.ts",
  new_code="@Get(':id/history') getHistory(@Param('id') id: string) { ... }"
)
```

5. **Ajouter la méthode au frontend:**
```
find_symbol(
  name_path_pattern="BackendApiService/getItem",
  relative_path="frontend/src/lib/backend-api.ts",
  include_body=true
)
```

### Cas 5: Débugger un Bug

**Problème:** Les alertes ne se déclenchent pas

1. **Trouver où sont créées les alertes:**
```
search_for_pattern(
  substring_pattern="checkItemAlerts",
  restrict_search_to_code_files=true
)
```

2. **Analyser chaque appel:**
```
find_referencing_symbols(
  name_path="AlertsService/checkItemAlerts",
  relative_path="backend/src/alerts/alerts.service.ts"
)
```

3. **Vérifier la méthode elle-même:**
```
find_symbol(
  name_path_pattern="AlertsService/checkItemAlerts",
  relative_path="backend/src/alerts/alerts.service.ts",
  include_body=true
)
```

## Stratégies de Navigation

### Approche Top-Down (du général au spécifique)
1. `get_symbols_overview` sur le fichier
2. Identifier le symbole d'intérêt
3. `find_symbol` avec `include_body=true`
4. `find_referencing_symbols` pour comprendre l'usage

### Approche Bottom-Up (d'un détail à la vue d'ensemble)
1. `search_for_pattern` pour trouver un texte spécifique
2. `find_symbol` pour récupérer le symbole complet
3. `find_referencing_symbols` pour voir les dépendances
4. Remonter vers les controllers/composants appelants

### Approche par Relations
1. Partir d'une entité Prisma (schema.prisma)
2. Chercher les services qui l'utilisent: `search_for_pattern("prisma.item")`
3. Analyser les méthodes CRUD
4. Remonter aux controllers puis au frontend