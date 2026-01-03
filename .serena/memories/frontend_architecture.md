# Architecture Frontend - ShelfSpot

## Structure Globale

### Frameworks & Technologies
- **Framework:** Next.js 14+ (App Router)
- **Styling:** TailwindCSS + shadcn/ui components
- **State Management:** React hooks (useState, useEffect)
- **API Communication:** Custom BackendApiService

## Structure des Dossiers

### src/app/
**Layout avec groupes de routes:**

#### (auth)/ - Routes publiques
- `/login` - Page de connexion
- `/register` - Page d'inscription
- `/forgot-password` - Réinitialisation mot de passe
- **Layout:** `src/app/(auth)/layout.tsx`

#### (pages)/ - Routes protégées
- `/dashboard` - Tableau de bord principal
- `/inventory` - Gestion des items
- `/consumables` - Consommables
- `/favourites` - Favoris
- `/projects` - Gestion des projets
- `/manage` - Gestion des entités (rooms, places, containers, tags)
- `/manage/[id]` - Détails d'une entité
- `/settings` - Paramètres utilisateur
- **Layout:** `src/app/(pages)/layout.tsx` (avec ProtectedRoute)

### src/components/
**Composants réutilisables:**
- **forms/** - LoginForm, SignUpForm, ForgotPasswordForm
- **modals/** - ObjectForms, ObjectTypeSelector
- **ui/** - Composants shadcn (button, card, table, select, etc.)
- **magicui/** - dock.tsx
- Composants métier: ItemsTable, DashboardCharts, Sidebar, AlertsManager

### src/lib/
**Utilitaires & Services:**
- `backend-api.ts` - Service API principal
- `auth-context.tsx` - Context d'authentification
- `constants.ts` - Constantes de l'app
- `utils.ts` - Fonctions utilitaires

### src/app/hooks/
**Custom Hooks:** useGetItems, useGetRooms, useGetProjects, useGetTags, useInventoryValue, useStatusStatistics, etc.

## Middleware & Protection

### middleware.ts (src/middleware.ts)
- Vérifie l'authentification sur les routes protégées
- Redirige vers /login si non authentifié

### ProtectedRoute (src/components/ProtectedRoute.tsx)
- Wrapper de protection côté client
- Utilise AuthContext pour vérifier l'état de connexion