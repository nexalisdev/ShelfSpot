# Communication Frontend-Backend - ShelfSpot

## BackendApiService (frontend/src/lib/backend-api.ts)

### Configuration
- **BACKEND_URL:** Constant définie (env ou localhost:3001)
- **Instance singleton:** `backendApi` exportée

### Symbole Principal: BackendApiService (Classe)

#### Méthode `request<T>(endpoint, options)` - Méthode générique
- **Rôle:** Gère toutes les requêtes HTTP vers le backend
- **Headers automatiques:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>` (via getAuthHeaders())
- **Gestion d'erreurs:** Lance BackendApiError avec status code

#### Méthodes d'Authentification

##### `login(email, password)` - Ligne 76-81
- **Symbole:** `BackendApiService/login`
- **Endpoint:** POST /auth/login
- **Retour:** {access_token, user}

##### `register(email, password, name?)`
- Endpoint: POST /auth/register

##### `forgotPassword(email)`, `resetPassword(token, password)`
- Flux de réinitialisation

##### `getProfile()`, `updateProfile()`, `updateProfileEmail()`
- Gestion du profil utilisateur

#### Méthodes Items

##### `getItems(search?)` - Ligne 123-126
- **Symbole:** `BackendApiService/getItems`
- **Endpoint:** GET /items/search?q=...
- **Utilisation:** Liste complète ou recherche

##### `getItem(id)`
- GET /items/:id

##### `createItem(data)`, `createBulkItems(items)`
- POST /items, POST /items/bulk

##### `updateItem(id, data)`, `deleteItem(id)`
- PATCH /items/:id, DELETE /items/:id

#### Autres Méthodes CRUD
- **Rooms:** getRooms, getRoom, createRoom, updateRoom, deleteRoom
- **Places:** getPlaces, getPlace, createPlace, updatePlace, deletePlace
- **Containers:** getContainers, getContainer, createContainer, updateContainer, deleteContainer
- **Tags:** getTags, createTag, updateTag, deleteTag
- **Projects:** getProjects, getProject, createProject, updateProject, deleteProject
- **Alerts:** getAlerts, createAlert, updateAlert, deleteAlert
- **Favourites:** getFavourites, createFavourite, deleteFavourite
- **Preferences:** getUserPreferences, updateUserPreferences

#### Méthodes Statistiques
- `getInventoryValue()` - Valeur totale de l'inventaire
- `getStatusStatistics()` - Stats par status
- `getAlertsStatistics()` - Stats des alertes par mois
- `getProjectStatistics()` - Stats des projets
- `getScoringStatistics()` - Stats de scoring
- `getCriticalItems()`, `getTopItems()` - Items importants

## Hooks Personnalisés

### useGetItems(id?) (frontend/src/app/hooks/useGetItems.ts)

#### Symbole: `useGetItems` - Ligne 7-41
- **Paramètre:** id optionnel
- **États:**
  - `data` (Item[] | Item | null)
  - `loading` (boolean)
  - `error` (string | null)
- **Flux:**
  1. useEffect se déclenche au montage ou changement d'id
  2. Si id: appelle `backendApi.getItem(id)`
  3. Sinon: appelle `backendApi.getItems()`
  4. Gère les erreurs avec BackendApiError
  5. Set loading states
- **Retour:** {data, loading, error}

### Pattern Similaire pour Autres Hooks
- **useGetRooms**, **useGetPlaces**, **useGetContainers**
- **useGetProjects**, **useGetTags**, **useGetConsumables**
- **useGetFavourites**
- **useInventoryValue**, **useStatusStatistics**, **useAlertsStatistics**
- **useUserPreferences**

Tous suivent le même pattern:
```typescript
function useGetX() {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const result = await backendApi.getX();
        setData(result);
      } catch (err) {
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dependencies]);
  
  return { data, loading, error };
}
```

## AuthContext (frontend/src/lib/auth-context.tsx)

### Symbole: AuthProvider & useAuth

#### Interface AuthContextType
- **user:** User | null
- **loading:** boolean
- **login(email, password):** Promise
- **register(email, password, name?):** Promise
- **logout():** void
- **refreshUser():** Promise
- **updateProfile(name):** Promise
- **updateProfileEmail(email):** Promise
- **forgotPassword(email):** Promise
- **resetPassword(token, password):** Promise

#### Flux d'Authentification Frontend
1. **AuthProvider** enveloppe l'app (dans layout)
2. Stocke le token dans localStorage
3. Vérifie l'authentification au chargement
4. Expose les méthodes via useAuth() hook

#### Utilisation dans les composants:
```typescript
const { user, login, logout } = useAuth();
```