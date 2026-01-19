## Gap analysis — Cahier des charges vs codebase (`bootstrap`)

Scope analyzed:
- **Frontend**: `apps/web` (Next.js App Router)
- **Backend**: `apps/api` (NestJS)
- **Spec**: `projet-etude/Cahier-des-charges-Projet-Etude-2025-2026.pdf`

---

## ✅ Completed Work (2026-01-19)

### Clean Architecture Migration
- [x] **Domain Layer**: Created domain entities (`User`, `Product`, `Category`) and repository interfaces
- [x] **Application Layer**: Created use cases for all modules (Users, Products, Categories, Cart, Orders, Content)
- [x] **Infrastructure Layer**: 
  - Relocated all NestJS modules to `src/infrastructure/ioc/`
  - Relocated controllers to `src/infrastructure/controllers/`
  - Created TypeORM repositories with DataSource injection pattern
  - Created entity mappers (domain ↔ persistence)
- [x] **Deleted legacy feature directories**: `auth/`, `cart/`, `categories/`, `content/`, `orders/`, `products/`, `users/`

### Docker Containerization
- [x] Created `apps/api/Dockerfile` (multi-stage NestJS build)
- [x] Created `apps/web/Dockerfile` (multi-stage Next.js standalone build)
- [x] Updated `docker-compose.yml` with `api`, `web`, `postgres`, `pgadmin` services
- [x] Created `.dockerignore` for optimized builds
- [x] Fixed Next.js build issues (robots.ts, useSearchParams Suspense, Locale types)

### Bug Fixes
- [x] Fixed `TypeOrmUserRepository` dependency injection (switched to DataSource injection)
- [x] Fixed CORS configuration in `main.ts`
- [x] Fixed `cookies()` usage during static generation

---

## Missing features (spec → current state)

### Panier (PDF p.12–13) ✅ DONE
- ✅ **Panier invité persistant** (localStorage `guestCartId`) + **fusion au login** (`MergeGuestCartUseCase`).
- ✅ **Modifier quantités / supprimer** (UI + API) + recalcul dynamique (`UpdateCartItemUseCase`, `RemoveFromCartUseCase`).
- ✅ **Gestion réelle des indisponibilités** (stock validation in `AddToCartUseCase` / `UpdateCartItemUseCase`).
- ✅ **Promotions / taxes complètes** (`Promotion` entity, `ApplyPromotionUseCase`, TVA 20%).

Implemented:
- API cart endpoints: `GET/POST/PUT/DELETE /cart/*` in `cart.controller.ts`
- Use cases: `apps/api/src/application/use-cases/cart/*.ts`
- Promotion system: `apps/api/src/domain/entities/promotion.entity.ts`
- Frontend: Interactive `CartPage` with `useCart` hook (`apps/web/src/hooks/useCart.tsx`)

### Checkout complet (PDF p.13–14) ✅ PARTIAL
- ✅ **Flow multi-étapes**: adresses → paiement (mock) → confirmation.
- ⏳ **Paiement sécurisé** (Stripe/PayPal) – placeholder mock only.
- ⏳ **Email de confirmation d'achat** – not implemented.
- ⏳ **Factures**: modification, suppression → **avoir**, **génération PDF** – not implemented.

Implemented:
- Multi-step checkout: `apps/web/src/app/(shop)/checkout/page.tsx`
- Address CRUD: `ProfileController`, `CreateUserAddressUseCase`
- Order creation: `CheckoutController`, `CreateOrderUseCase`

### Inscription + validation email (PDF p.15–16)
- **Nom complet** + validation des champs.
- **Règles de mot de passe** (CNIL/RGPD) + validation client/serveur.
- **Email de confirmation** avec lien unique et durée limitée (~24h).
- **Restriction tant que non confirmé** + auto-login après validation.

Current:
- Signup/login basiques sans validation email: `apps/api/src/infrastructure/services/auth.service.ts`
- `User` ne contient pas "nom complet"/statut: `apps/api/src/domain/entities/user.entity.ts`

### Gestion de compte: adresses + méthodes de paiement (PDF p.17–18)
- CRUD **adresses** (ajouter/éditer/supprimer, choix pendant checkout).
- Gestion **méthodes de paiement** (ajouter/supprimer carte).

Current:
- Pas d'entities "Address" / "PaymentMethod" côté API.
- UI settings **mock**: `apps/web/src/app/(account)/settings/page.tsx`

### Historique des commandes (PDF p.19–20)
- Commandes **regroupées par année**.
- **Filtres** (année/type/statut) + **recherche**.
- **Détails commande** + **téléchargement facture PDF**.
- Affichage sécurisé (pas de détails carte).

Current:
- Orders API **mock**: `apps/api/src/infrastructure/ioc/orders.module.ts`
- UI orders sans groupement/filtre/recherche/factures: `apps/web/src/app/(account)/orders/page.tsx`

### Contact + chatbot + backoffice support (PDF p.20)
- Formulaire contact: **email + sujet + message** + confirmation.
- Stockage et consultation des messages **dans le backoffice**.
- Chatbot: FAQ, escalade humain, contexte commande.

Current:
- UI contact/chatbot **mock**: 
  - `apps/web/src/app/(misc)/contact/page.tsx`
  - `apps/web/src/app/(misc)/chatbot/page.tsx`
- Pas de module API "support/contact".

### Backoffice complet (PDF p.24)
- **Catégories**: CRUD, statut active/inactive, ordre d'affichage, bulk actions, drag & drop.
- **Utilisateurs**: tri/recherche, statut (actif/inactif/en attente), nb commandes, CA, dernière connexion, adresses.
- **Actions admin**: reset mdp, désactiver, supprimer (RGPD), envoyer mail.
- **Accès admin**: RBAC + **2FA**.

Current:
- Page backoffice = dashboard MVP non sécurisé: `apps/web/src/app/backoffice/page.tsx`
- Rôle existe côté user (`customer|admin`) mais pas de guards RBAC/2FA ni endpoints admin complets.

### i18n + RTL (PDF p.27)
- Multilingue réel (stratégie App Router) + RTL robuste pour `ar`.

Current:
- Sélecteur de langue + `dir` RTL (cookie locale), mais pas de vraie infra de traduction/routing.

### a11y WCAG 2.1 (PDF p.27)
- Audit et conformité (clavier, lecteurs d'écran, focus, contrastes).

Current:
- Partiel / non audité (ex: quelques `aria-*`).

### Sécurité / RGPD / pratiques (PDF p.27 + p.29)
- Chiffrement données sensibles, sessions/authZ, protections XSS/CSRF/SQLi.
- Tests sécurité réguliers.
- RGPD opérationnel (droits, suppression, gestion consentement).

Current:
- Bon socle: Helmet + ValidationPipe + throttling (`apps/api/src/main.ts`, `apps/api/src/app.module.ts`).
- Manquent les features qui "portent" la sécurité: paiement, email verification, 2FA, RGPD complet, etc.

---

## Optimizations / technical debt (recommended priorities)

### P0 — Stop mocks / make core flows real
- **Replace mocks** with persistence + real endpoints:
  - `CartService`, `OrdersService`, checkout, contact/chatbot.
- Introduire un **modèle e-commerce** complet (Postgres):
  - `Order`, `OrderItem`, `Invoice`, `CreditNote`, `Address`, `PaymentMethod`.

### P0 — Backoffice security and access control
- Mettre en place un **RBAC** propre (Nest guards) pour routes admin.
- Ajouter **2FA** pour les comptes admin.

### P0 — Payment + invoices
- Intégrer **Stripe/PayPal** + **webhooks** + idempotence.
- Génération **PDF invoice** + lien de téléchargement + avoir.

### P1 — Auth improvements
- Email verification flow (token + TTL) + statuts utilisateur.
- Reset password.
- Optionnel: refresh tokens.

### P1 — Next.js performance / UX
- ~~Éviter le rendu bloquant lié à `cookies()` (warning "blocking route")~~ ✅ Fixed with try-catch
- Caching et gestion propre des erreurs d'images externes.

### P1 — Production readiness
- **TypeORM**: remplacer `synchronize: true` par migrations en prod.
- Logging structuré + monitoring + alerting.
- ~~Durcir config CORS/cookies selon déploiement.~~ ✅ CORS configured

### P2 — Quality / compliance
- Tests unit + e2e sur parcours critiques (auth, panier, checkout).
- Checklist a11y/SEO (Lighthouse/WCAG) + correctifs.

---

## Quick mapping (spec → code entry points)

- **Cart**: `apps/web/src/app/(shop)/cart/page.tsx` + `apps/api/src/infrastructure/ioc/cart.module.ts`
- **Checkout**: `apps/web/src/app/(shop)/checkout/page.tsx`
- **Auth**: `apps/api/src/infrastructure/ioc/auth.module.ts` + `apps/web/src/app/(account)/*`
- **Orders**: `apps/web/src/app/(account)/orders/page.tsx` + `apps/api/src/infrastructure/ioc/orders.module.ts`
- **Backoffice**: `apps/web/src/app/backoffice/page.tsx`
- **i18n**: `apps/web/src/lib/i18n.*` + header locale switch
- **Docker**: `docker-compose.yml` + `apps/api/Dockerfile` + `apps/web/Dockerfile`
