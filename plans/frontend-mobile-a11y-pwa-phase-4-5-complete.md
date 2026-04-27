## Phase 4 Complete: Accessibilité transversale

Uniformisation ARIA, focus-visible, et structure sémantique sur tous les composants communs.

**Files changed:**
- frontend/src/components/ui/select.tsx
- frontend/src/components/ui/form-field.tsx
- frontend/src/components/CreateObjectModal.tsx
- frontend/src/components/CreateMultipleModal.tsx
- frontend/src/app/(pages)/settings/page.tsx

**Corrections apportées:**

### select.tsx
- SelectScrollUpButton: `aria-label="Scroll up"` + `aria-hidden="true"` sur l'icône
- SelectScrollDownButton: `aria-label="Scroll down"` + `aria-hidden="true"` sur l'icône

### form-field.tsx
- FormField: génération automatique `id={field-{name}}` + `htmlFor={field-{name}}` sur le label
- Checkbox variant: même association label/input
- `aria-required={required}` sur les inputs
- SelectField: même pattern `id`/`htmlFor`/`aria-required`

### CreateObjectModal.tsx
- Conteneur modal: `role="dialog"` + `aria-modal="true"` + `aria-labelledby="create-object-modal-title"`
- H2 titre: `id="create-object-modal-title"`
- Bouton close: `h-11 w-11` (44px) + `focus-visible:ring-2`
- Type selector cards: `<div cursor-pointer>` → `<button type="button" focus-visible:ring-2>`
- Icônes décoratives: `aria-hidden="true"`

### CreateMultipleModal.tsx
- Conteneur modal: `role="dialog"` + `aria-modal="true"` + `aria-labelledby="create-multiple-modal-title"`
- H2 titre: `id="create-multiple-modal-title"`
- Bouton close: `h-11 w-11` + `aria-label="Close modal"` + `focus-visible:ring-2`
- Tab buttons: `role="tab"` + `aria-selected={type === '...'}` + `focus-visible:ring-2`
- Tab container: `role="tablist"` + `aria-label="Object type"`

### settings/page.tsx
- 4 boutons de section expandable: `aria-expanded` + `aria-controls="section-{id}"` + `focus-visible:ring-2 ring-inset`
- 4 divs de contenu expandable: `id="section-{id}"`
- ChevronIcons: `aria-hidden="true"` sur toutes les occurrences
- 6 toggles checkbox: `aria-label` descriptif sur chaque input (`"Toggle Welcome Header"`, `"Toggle Statistics Cards"`, etc.)

**Review Status:** PENDING

---

## Phase 5 Complete: PWA installable

L'application est désormais installable sur Android et peut être ajoutée à l'écran d'accueil iOS.

**Files created:**
- frontend/public/manifest.webmanifest
- frontend/public/icons/icon-192.png (placeholder bleu #0a5adf)
- frontend/public/icons/icon-512.png (placeholder bleu #0a5adf)
- frontend/public/icons/apple-touch-icon.png (placeholder 180px)
- frontend/public/sw.js (service worker custom)
- frontend/src/app/offline/page.tsx (page offline)
- frontend/src/components/ServiceWorkerRegistrar.tsx (client component)

**Files modified:**
- frontend/src/app/layout.tsx

**Ce qui a été ajouté dans layout.tsx:**
- `export const viewport: Viewport` avec `width`, `initialScale`, `themeColor: "#0a5adf"`
- `metadata.manifest: "/manifest.webmanifest"`
- `metadata.appleWebApp: { capable: true, statusBarStyle: "default", title: "ShelfSpot" }`
- `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />`
- `<ServiceWorkerRegistrar />` dans le body (client component qui enregistre /sw.js)

**Service Worker (sw.js) — stratégies:**
- Navigation: network-first → fallback page /offline
- Static assets (/_next/static/, /icons/, .webmanifest): cache-first avec mise à jour
- API calls (/api/*): always network, jamais mis en cache

**Note:** `next-pwa` est incompatible avec Next 15 (Turbopack). Le SW custom évite cette dépendance.

**Note icônes:** Les icônes actuelles sont des placeholders (blocs bleus unis). Pour la production, remplacer par de vraies icônes PNG dans `frontend/public/icons/`.

**Review Status:** PENDING
