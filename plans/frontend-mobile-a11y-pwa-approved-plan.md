## Plan: Frontend mobile A11y + PWA

Rendre l’application pleinement utilisable sur mobile d’abord (safe areas, navigation, lisibilité, accessibilité), puis la finaliser en PWA installable avec placeholders d’icônes. L’exécution suit un cycle strict par phase: implémentation, revue, tests, puis passage à la phase suivante.

**Décisions validées**

1. PWA: plugin next-pwa.
2. Icônes: placeholders dans cette passe.
3. CI/audits automatisés: non inclus dans ce lot.

**Phases**

1. **Phase 1: Structure mobile et safe areas**
   - **Objective:** Supprimer tout chevauchement contenu/navigation sur mobile et garantir l’accès au dernier contenu utile.
   - **Files/Functions:** frontend/src/app/(pages)/layout.tsx, frontend/src/components/Sidebar.tsx, frontend/src/app/globals.css
   - **Steps:** 1) Réserver la zone basse pour la nav mobile; 2) Ajouter gestion safe-area iOS/Android; 3) Vérifier scroll long et overlays.

2. **Phase 2: Navigation mobile accessible**
   - **Objective:** Rendre la nav basse exploitable à une main avec cibles tactiles, état actif clair et focus visible.
   - **Files/Functions:** frontend/src/components/Sidebar.tsx, frontend/src/components/ThemeSwitcher.tsx, frontend/src/app/globals.css
   - **Steps:** 1) Agrandir cibles tactiles; 2) Clarifier état actif visuel + aria-current; 3) Vérifier tab order et contrastes.

3. **Phase 3: Écrans critiques mobile**
   - **Objective:** Corriger densité, lisibilité et interactions sur Dashboard, Inventory, Manage, Settings et Auth.
   - **Files/Functions:** frontend/src/app/(pages)/dashboard/page.tsx, frontend/src/app/(pages)/inventory/page.tsx, frontend/src/app/(pages)/manage/page.tsx, frontend/src/app/(pages)/settings/page.tsx, frontend/src/components/ItemsTable.tsx, frontend/src/components/ui/table.tsx, frontend/src/components/forms/LoginForm.tsx, frontend/src/components/forms/SignUpForm.tsx, frontend/src/components/forms/ForgotPasswordForm.tsx
   - **Steps:** 1) Ajuster hiérarchie mobile dashboard; 2) Corriger overflow/actions tables; 3) Assainir formulaires auth sur petits écrans.

4. **Phase 4: Accessibilité transversale**
   - **Objective:** Uniformiser labels, ARIA, focus ring et contrastes AA sur les composants communs.
   - **Files/Functions:** frontend/src/app/globals.css, frontend/src/components/ui/button.tsx, frontend/src/components/ui/form-field.tsx, frontend/src/components/ui/select.tsx, frontend/src/components/ui/table.tsx, frontend/src/components/ProtectedRoute.tsx
   - **Steps:** 1) Corriger annonces et attributs ARIA; 2) Uniformiser focus-visible; 3) Ajuster contrastes insuffisants.

5. **Phase 5: PWA installable**
   - **Objective:** Activer installabilité Android et fallback offline avec next-pwa.
   - **Files/Functions:** frontend/next.config.ts, frontend/package.json, frontend/src/app/layout.tsx, frontend/public, frontend/src/app
   - **Steps:** 1) Ajouter manifest + metadata + placeholders d’icônes; 2) Intégrer service worker via next-pwa; 3) Ajouter page offline et guidance install iOS.

6. **Phase 6: Validation finale et non-régression**
   - **Objective:** Confirmer qu’aucun blocant mobile ne subsiste sur les flux critiques.
   - **Files/Functions:** plans/frontend-mobile-a11y-pwa-plan.md
   - **Steps:** 1) Vérifier matrice mobile (320/390, portrait/paysage); 2) Vérifier auth/dashboard/inventory/manage/settings; 3) Mettre à jour la checklist et produire synthèse.

**Open Questions**

1. Aucune question bloquante restante pour ce lot.
