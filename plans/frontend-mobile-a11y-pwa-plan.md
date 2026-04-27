# Plan de remédiation Frontend mobile A11y + PWA

## Objectif

Rendre l’application réellement utilisable sur mobile (accessibilité et ergonomie d’abord), puis la finaliser en PWA installable.

## Contexte

Le responsive actuel présente des blocages d’usage mobile:

- La navigation basse recouvre le contenu.
- Les cibles tactiles sont trop serrées.
- La lisibilité est insuffisante sur petit écran.
- Les zones de focus et indices d’accessibilité sont incomplets.

Ce plan sert de référentiel d’exécution et de validation.

---

## Principes d’exécution

1. Mobile-first.
2. Accessibilité avant esthétique.
3. Aucun chevauchement de contenu avec la navigation fixe.
4. Critères d’acceptation testables à chaque phase.
5. PWA uniquement après validation UX mobile.

---

## Périmètre

- Frontend Next.js dans [frontend](../frontend)
- Priorité écrans:
  1. Dashboard
  2. Inventory
  3. Manage
  4. Settings
  5. Auth (login/register/forgot)

---

## Phase 0 — Audit ciblé et baseline

### Tâches

- [ ] Capturer les points de friction mobile sur les routes clés.
- [ ] Vérifier les largeurs 320, 360, 390, 414 px.
- [ ] Vérifier portrait/paysage.
- [ ] Vérifier navigation clavier et focus visible.
- [ ] Vérifier contrastes critiques (texte, boutons, états actifs).

### Fichiers de référence

- [frontend/src/app/(pages)/layout.tsx](<../frontend/src/app/(pages)/layout.tsx>)
- [frontend/src/components/Sidebar.tsx](../frontend/src/components/Sidebar.tsx)
- [frontend/src/app/(pages)/dashboard/page.tsx](<../frontend/src/app/(pages)/dashboard/page.tsx>)
- [frontend/src/app/globals.css](../frontend/src/app/globals.css)

### Critères d’acceptation

- [ ] Liste des problèmes priorisés (bloquant, majeur, mineur).
- [ ] Baseline documentée dans la PR ou le ticket.

---

## Phase 1 — Structure mobile et safe areas (bloquants)

### Tâches

- [ ] Réserver l’espace nécessaire en bas de page pour la nav mobile.
- [ ] Ajouter prise en charge safe-area iOS/Android (bas et latéraux).
- [ ] Éliminer tout chevauchement entre contenu et barre mobile.
- [ ] Vérifier le comportement sur pages longues avec scroll.
- [ ] Vérifier que les modales ne sont pas coupées par la nav.

### Fichiers probables

- [frontend/src/app/(pages)/layout.tsx](<../frontend/src/app/(pages)/layout.tsx>)
- [frontend/src/app/globals.css](../frontend/src/app/globals.css)
- [frontend/src/components/Sidebar.tsx](../frontend/src/components/Sidebar.tsx)

### Critères d’acceptation

- [ ] Aucune section masquée par la nav mobile.
- [ ] Le dernier bloc de contenu reste accessible sans zoom.
- [ ] Safe areas respectées sur mobile avec encoche.

---

## Phase 2 — Navigation mobile accessible

### Tâches

- [ ] Augmenter les cibles tactiles des actions de nav.
- [ ] Revoir spacing et densité des labels pour éviter les taps erronés.
- [ ] Garantir état actif clair (visuel + aria-current).
- [ ] Vérifier ordre de tabulation cohérent.
- [ ] Vérifier contraste des icônes/textes en clair/sombre.

### Fichiers probables

- [frontend/src/components/Sidebar.tsx](../frontend/src/components/Sidebar.tsx)
- [frontend/src/components/ThemeSwitcher.tsx](../frontend/src/components/ThemeSwitcher.tsx)
- [frontend/src/app/globals.css](../frontend/src/app/globals.css)

### Critères d’acceptation

- [ ] Navigation exploitable à une main.
- [ ] Aucun item de nav tronqué ou illisible sur 320 px.
- [ ] Focus visible sur tous les contrôles interactifs.

---

## Phase 3 — Écrans critiques: lisibilité, interaction, densité

### Dashboard

- [ ] Revoir hauteur/padding des panneaux.
- [ ] Simplifier la hiérarchie visuelle mobile.
- [ ] Rendre la recherche clairement lisible et focusable.
- [ ] Vérifier le slider horizontal et les cartes vides.

### Inventory / Manage / Settings

- [ ] Vérifier tableaux en mobile (scroll, overflow, actions).
- [ ] Vérifier menus contextuels et dropdowns (positionnement, clipping).
- [ ] Vérifier formulaires (labels, erreurs, toggles, boutons).

### Auth

- [ ] Vérifier login/register/forgot en petits écrans.
- [ ] Vérifier champs mot de passe (affichage, icône, focus, contraste).

### Fichiers probables

- [frontend/src/app/(pages)/dashboard/page.tsx](<../frontend/src/app/(pages)/dashboard/page.tsx>)
- [frontend/src/components/ItemsTable.tsx](../frontend/src/components/ItemsTable.tsx)
- [frontend/src/components/forms/LoginForm.tsx](../frontend/src/components/forms/LoginForm.tsx)
- [frontend/src/components/forms/SignUpForm.tsx](../frontend/src/components/forms/SignUpForm.tsx)
- [frontend/src/components/forms/ForgotPasswordForm.tsx](../frontend/src/components/forms/ForgotPasswordForm.tsx)

### Critères d’acceptation

- [ ] Aucun composant critique inutilisable au toucher.
- [ ] Aucun texte essentiel tronqué sur mobile.
- [ ] États d’erreur/formulaire compréhensibles sans ambiguïté.

---

## Phase 4 — Accessibilité transversale (A11y)

### Tâches

- [ ] Vérifier labels explicites pour inputs et boutons icône.
- [ ] Vérifier attributs ARIA nécessaires sur composants custom.
- [ ] Uniformiser focus ring et états hover/active/focus-visible.
- [ ] Corriger contrastes insuffisants (AA minimum).
- [ ] Vérifier contenu navigable au lecteur d’écran (landmarks, titres).

### Fichiers probables

- [frontend/src/app/globals.css](../frontend/src/app/globals.css)
- [frontend/src/components/ui](../frontend/src/components/ui)
- [frontend/src/components](../frontend/src/components)

### Critères d’acceptation

- [ ] Contrastes principaux conformes AA.
- [ ] Parcours clavier possible sans perte de contexte.
- [ ] Composants interactifs annoncés correctement.

---

## Phase 5 — PWA (après UX mobile validée)

### Tâches

- [ ] Ajouter manifeste web app.
- [ ] Ajouter icônes PWA (192/512 + Apple touch).
- [ ] Ajouter métadonnées PWA dans le layout racine.
- [ ] Intégrer service worker (cache runtime + fallback offline).
- [ ] Ajouter page offline.
- [ ] Gérer UX d’installation Android.
- [ ] Ajouter guidance iOS pour ajout écran d’accueil.

### Fichiers probables

- [frontend/src/app/layout.tsx](../frontend/src/app/layout.tsx)
- [frontend/next.config.ts](../frontend/next.config.ts)
- [frontend/package.json](../frontend/package.json)
- [frontend/public](../frontend/public)
- [frontend/src/app](../frontend/src/app)

### Critères d’acceptation

- [ ] Installable Android (manifest + SW + icônes).
- [ ] Ajout écran d’accueil iOS fonctionnel.
- [ ] Mode offline: page de repli accessible.

---

## Phase 6 — Validation finale et non-régression

### Matrice de tests mobile

- [ ] iOS Safari (récent)
- [ ] Android Chrome (récent)
- [ ] 320 px largeur
- [ ] 390 px largeur
- [ ] Portrait
- [ ] Paysage

### Tests fonctionnels

- [ ] Navigation complète sans blocage.
- [ ] Auth (login/register/forgot) sur mobile.
- [ ] Dashboard lisible et actionnable.
- [ ] Inventory/Manage sans clipping d’actions.
- [ ] Settings utilisable sans recouvrement.

### Critères de fin

- [ ] Plus aucun blocant mobile ouvert.
- [ ] Checklist du plan entièrement cochée.
- [ ] Démo mobile validée par capture vidéo courte.

---

## Tableau de suivi (à maintenir pendant l’exécution)

| ID   | Tâche                            | Phase | Priorité | Statut | Owner | Preuve |
| ---- | -------------------------------- | ----- | -------- | ------ | ----- | ------ |
| M-01 | Corriger chevauchement nav basse | 1     | Critique | TODO   |       |        |
| M-02 | Safe area bottom/top             | 1     | Critique | TODO   |       |        |
| M-03 | Cibles tactiles nav mobile       | 2     | Haute    | TODO   |       |        |
| M-04 | Focus visible global             | 4     | Haute    | TODO   |       |        |
| M-05 | Lisibilité Dashboard mobile      | 3     | Haute    | TODO   |       |        |
| M-06 | Tables/actions Inventory mobile  | 3     | Haute    | TODO   |       |        |
| M-07 | Manifest + icônes PWA            | 5     | Haute    | TODO   |       |        |
| M-08 | Service worker + offline         | 5     | Haute    | TODO   |       |        |
| M-09 | Install Android + guidance iOS   | 5     | Moyenne  | TODO   |       |        |
| M-10 | Validation multi-devices         | 6     | Critique | TODO   |       |        |

---

## Définition de Done globale

- [ ] L’application est pleinement utilisable sur téléphone sans zoom.
- [ ] Les interactions critiques sont accessibles (tactile, clavier, lecteur d’écran).
- [ ] Aucune section importante n’est cachée par la navigation fixe.
- [ ] L’application peut être installée comme PWA sur Android et ajoutée à l’écran d’accueil sur iOS.
- [ ] Le plan est entièrement coché et traçable.
