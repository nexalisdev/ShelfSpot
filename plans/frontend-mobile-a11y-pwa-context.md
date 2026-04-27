# Contexte — Frontend mobile / A11y / PWA

Date: 2026-04-27
Repo: ShelfSpot — frontend (Next.js app-router)

---

## Contexte technique

- Framework: Next.js (app router, Next 15+). Code client+server under `frontend/src/app` and `frontend/src/components`.
- Styling: TailwindCSS (tailwind.config.ts, postcss.config.mjs) + custom utility classes in `src/app/globals.css` (e.g. `app-panel-elevated`, `app-input`, `app-heading`, `app-muted`, `app-kicker`).
- UI primitives: `frontend/src/components/ui/*` (table.tsx, form-field.tsx, select.tsx, DynamicSchemaForm.tsx, card.tsx, button.tsx).
- Routing groups: app router group folders present, e.g. `(pages)`, `(auth)` (client route scaffolding / grouped layouts).
- Auth: next-auth present in dependencies; local auth helpers in `frontend/src/lib/auth-context.tsx` and forms in `frontend/src/components/forms/*`.
- Tables: `@tanstack/react-table` in use and `frontend/src/components/ItemsTable.tsx` + `ui/table.tsx` primitives.
- Charts: Chart.js + react-chartjs-2 used in `components/DashboardCharts.tsx`.
- No PWA plugin or service worker detected (no `next-pwa` in deps, no manifest/webmanifest in `public/`). Only `public/app-ico.svg`, `modal_bg.png` found.
- Scripts: `dev`, `build`, `start`, `lint` in `frontend/package.json`. No test script present.

---

## Cartographie fichiers par phase

Phase 0 — Audit / baseline

- frontend/src/app/(pages)/layout.tsx
- frontend/src/app/globals.css
- frontend/src/components/Sidebar.tsx
- frontend/src/app/(pages)/dashboard/page.tsx

Phase 1 — Safe areas & spacing

- frontend/src/app/(pages)/layout.tsx
- frontend/src/app/globals.css
- frontend/src/components/Sidebar.tsx
- frontend/src/components/modals/\* (modals may be clipped)

Phase 2 — Navigation mobile accessible

- frontend/src/components/Sidebar.tsx
- frontend/src/components/ThemeSwitcher.tsx
- frontend/src/components/ui/button.tsx
- frontend/src/app/(pages)/layout.tsx

Phase 3 — Screens (Dashboard, Inventory, Manage, Settings, Auth)

- Dashboard: frontend/src/app/(pages)/dashboard/page.tsx, frontend/src/components/DashboardCharts.tsx
- Inventory: frontend/src/app/(pages)/inventory/page.tsx, frontend/src/components/ItemsTable.tsx
- Manage: frontend/src/app/(pages)/manage/page.tsx, frontend/src/components/ManageObjectClient.tsx
- Settings: frontend/src/app/(pages)/settings/page.tsx
- Auth flows: frontend/src/app/(auth)/login/page.tsx (via `(auth)` group), frontend/src/components/forms/LoginForm.tsx, SignUpForm.tsx, ForgotPasswordForm.tsx

Phase 4 — A11y cross-cutting

- frontend/src/app/globals.css (focus styles, color tokens)
- frontend/src/components/ui/\* (form-field.tsx, select.tsx, table.tsx, button.tsx)
- frontend/src/components/ProtectedRoute.tsx (auth gating behavior)

Phase 5 — PWA

- Candidate integration points: frontend/src/app/layout.tsx (meta + link tags), frontend/public (manifest + icons to add), frontend/next.config.ts (config changes)
- Note: currently no manifest or SW implementation detected.

Phase 6 — Validation / non-regression

- Tests & checks run from repo root `frontend/` (see `package.json` scripts). Use Lighthouse / pa11y / axe / responsive emulation.

---

## Patterns, CSS classes et conventions observées

- Tailwind utility classes used extensively (`flex`, `grid`, `md:grid-cols-*`, `gap-*`, `items-center`, etc.).
- App-specific utility classes: `app-panel-elevated`, `app-input`, `app-heading`, `app-muted`, `app-kicker`, `app-input` — defined in `src/app/globals.css` and used across pages.
- Component primitives in `components/ui/*` are intended as canonical building blocks.
- Layout uses app-router group layouts `(pages)` and `(auth)` which suggests central layout adjustments will affect groups.

---

## Risques techniques & dépendances

Risques

- PWA not currently configured: adding SW + manifest requires decisions on caching strategy, offline UX, and Next app-router SW integration.
- App-router + server components: service worker and client-only code interactions must be carefully scoped (SW registration in client entry / provider component).
- Tailwind version: project uses Tailwind v4 as devDependency; verify plugin compatibility for any PWA meta utilities or third-party a11y tooling.
- UI primitives: many components use custom classes — inconsistent application could require broad refactors to meet touch target and focus rules.
- No automated tests found for frontend a11y or responsive behavior — manual + CI tooling needed.

Dependencies of note

- next (15.x), react 19
- next-auth (auth flows) + @next-auth/prisma-adapter
- @tanstack/react-table (tables)
- @headlessui/react, @radix-ui/\* (UI primitives)
- tailwindcss, postcss

---

## Commandes de vérification (dev / lint / build / audits)

- Dev server (hot reload):

```bash
cd frontend
yarn dev
```

- Build / production check:

```bash
cd frontend
yarn build
yarn start # or use Dockerfile in repo root for production image
```

- Linting:

```bash
cd frontend
yarn lint
```

- Accessibility & PWA audits (suggested):

```bash
# Lighthouse (Chrome) - interactive
# Or run headless Lighthouse for PWA + performance + a11y
npx -y lighthouse http://localhost:3000 --preset=mobile --only-categories=accessibility,pwa --output=json --output-path=report.json

# pa11y (accessibility smoke tests)
npm install -g pa11y
pa11y http://localhost:3000/login

# axe-core CLI
npx -y @axe-core/cli http://localhost:3000/login

# Manual: Chrome DevTools > Lighthouse / Responsive emulation (320/360/390/414)
```

- Offline installability check after PWA implementation: Lighthouse PWA category and `manifest.json` + service worker registration verification in DevTools Application panel.

---

## Proposition de découpage d’implémentation (ordre recommandé)

1. Phase 0 — Baseline audit (1–2 dev days): capture screenshots + device sizes; produce prioritized issue list.
2. Phase 1 — Safe areas & layout adjustments (1–2 dev days): change `app/(pages)/layout.tsx`, add CSS safe-area wrappers in `globals.css` and ensure bottom nav (Sidebar) reserves space.
3. Phase 2 — Navigation: update `Sidebar.tsx`, increase touch-targets, add `aria-current`, ensure tab order.
4. Phase 3 — Screens fixes: dashboard, inventory, manage, auth — address table scrolling (`ItemsTable.tsx` + `ui/table.tsx`), increase paddings and stack cards for mobile.
5. Phase 4 — A11y polish: update `ui/*` primitives (button, form-field) to include labels, aria, and visible focus styles.
6. Phase 5 — PWA: add `public/manifest.webmanifest`, icons (192/512 + apple-touch), register SW from a client component (e.g. providers or a small `useEffect` in `providers.tsx`), update `next.config.ts` if using a plugin like `next-pwa`.
7. Phase 6 — Validation & CI: add Lighthouse/pa11y smoke checks to CI; run final testing matrix on device sizes.

Estimate: 2–3 sprints depending on review cycle and asset creation for PWA.

---

## Critères de validation mesurables (exemples)

- No overlapping content: test pages on 320/360/390/414 widths; bottom-most interactive element must remain fully visible and tappable without zoom.
- Touch targets: all primary nav buttons >= 44px tap target (WCAG recommended) — verify via computed bounding boxes.
- Keyboard focus: tab order covers header/nav/main/controls; focus ring visible (contrast >= 3:1 on focus background).
- Contrast: text AA for body text (>= 4.5:1 small text, >= 3:1 large text) — use axe/lighthouse.
- PWA: Lighthouse PWA score >= 90 and 'Installable' checks passed (manifest, icons, service-worker registered).

---

## Questions ouvertes / blocantes

- Méthode préférée pour PWA: utiliser `next-pwa` plugin or custom SW? (impacts config and caching strategy)
- Assets: qui fournit icons (192/512 + Apple touch) and offline page design?
- CI integration: souhaitez-vous des audits Lighthouse/pa11y automatisés en CI? (runner infra/time required)
- Scope: automatiser tests vs. manual QA for first pass? (releases schedule)

---

## Références rapides — fichiers identifiés (extraits)

- frontend/src/app/(pages)/layout.tsx
- frontend/src/app/layout.tsx
- frontend/src/app/globals.css
- frontend/src/components/Sidebar.tsx
- frontend/src/components/DashboardCharts.tsx
- frontend/src/components/ItemsTable.tsx
- frontend/src/components/ui/table.tsx
- frontend/src/components/ui/form-field.tsx
- frontend/src/components/forms/LoginForm.tsx
- frontend/src/components/forms/SignUpForm.tsx
- frontend/src/components/forms/ForgotPasswordForm.tsx
- frontend/src/lib/auth-context.tsx
- frontend/src/app/(auth)/layout.tsx
- frontend/src/app/(pages)/dashboard/page.tsx

---

End of context.
