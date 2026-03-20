## Gap analysis — Cahier des charges vs codebase (`bootstrap`)

Scope analyzed:
- **Frontend**: `apps/web` (Next.js App Router)
- **Backend**: `apps/api` (NestJS)
- **Spec**: `projet-etude/Cahier-des-charges-Projet-Etude-2025-2026.pdf`

---

## ✅ Completed Work

### Cart (Panier) (PDF p.12–13)
- [x] **Panier invité persistant** (localStorage `guestCartId`) + **fusion au login** (`MergeGuestCartUseCase`).
- [x] **Modifier quantités / supprimer** (UI + API) + recalcul dynamique (`UpdateCartItemUseCase`, `RemoveFromCartUseCase`).
- [x] **Gestion réelle des indisponibilités** (stock validation in `AddToCartUseCase` / `UpdateCartItemUseCase`).
- [x] **Promotions / taxes complètes** (`Promotion` entity, `ApplyPromotionUseCase`, TVA 20%).
- [x] **Frontend**: Interactive `CartPage` with `useCart` hook (`apps/web/src/hooks/useCart.tsx`) and real API integration.

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
- [x] Fixed `AppDataSource` entity registration and schema synchronization
- [x] Fixed guest cart UUID generation
- [x] Fixed product price display (EUR vs Cents mismatch)

---

## 🚧 Partial / In Progress

### Checkout complet (PDF p.13–14)
- [x] **Flow multi-étapes**: adresses → paiement (mock) → confirmation.
- [ ] **Paiement sécurisé** (Stripe/PayPal) – *In Progress*
  - [x] Configuration des secrets (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
  - [x] Backend implementation
  - [x] Frontend integration
- [ ] **Email de confirmation d'achat** – not implemented.
- [ ] **Factures**: modification, suppression → **avoir**, **génération PDF** – not implemented.

---

## 📝 To Do (Backlog)

### Inscription + validation email (PDF p.15–16)
- [x] **Nom complet** + validation des champs.
- [x] **Règles de mot de passe** (CNIL/RGPD) + validation client/serveur.
- [x] **Email de confirmation** avec lien unique et durée limitée (~24h).
- [x] **Restriction tant que non confirmé** + auto-login après validation.

### Gestion de compte: adresses + méthodes de paiement (PDF p.17–18)
- [x] CRUD **adresses** (ajouter/éditer/supprimer, choix pendant checkout).
- [x] Gestion **méthodes de paiement** (ajouter/supprimer carte).

### Historique des commandes (PDF p.19–20)
- [x] Commandes **regroupées par année**.
- [x] **Filtres** (année/type/statut) + **recherche**.
- [x] **Détails commande** + **téléchargement facture PDF**.
- [x] Affichage sécurisé (pas de détails carte).

### Contact + chatbot + backoffice support (PDF p.20)
- [ ] Formulaire contact: **email + sujet + message** + confirmation.
- [ ] Stockage et consultation des messages **dans le backoffice**.
- [ ] Chatbot: FAQ, escalade humain, contexte commande.

### Backoffice complet (PDF p.24)
- [ ] **Catégories**: CRUD, statut active/inactive, ordre d'affichage, bulk actions, drag & drop.
- [ ] **Utilisateurs**: tri/recherche, statut (actif/inactif/en attente), nb commandes, CA, dernière connexion, adresses.
- [ ] **Actions admin**: reset mdp, désactiver, supprimer (RGPD), envoyer mail.
- [ ] **Accès admin**: RBAC + **2FA**.

### i18n + RTL (PDF p.27)
- [ ] Multilingue réel (stratégie App Router) + RTL robuste pour `ar`.

### a11y WCAG 2.1 (PDF p.27)
- [ ] Audit et conformité (clavier, lecteurs d'écran, focus, contrastes).

### Sécurité / RGPD / pratiques (PDF p.27 + p.29)
- [ ] Chiffrement données sensibles, sessions/authZ, protections XSS/CSRF/SQLi.
- [ ] Tests sécurité réguliers.
- [ ] RGPD opérationnel (droits, suppression, gestion consentement).

---

## 🔮 New Iteration (Forgotten Specs)

> *Please list here any specific requirements from the "Cahier des charges" that are not covered above.*

- [ ] ...
- [ ] ...

---

## Optimizations / Technical Debt

### P0 — Stop mocks / make core flows real
- **Replace mocks** with persistence + real endpoints:
  - `CartService` (DONE), `OrdersService`, checkout, contact/chatbot.
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

### P1 — Production readiness
- **TypeORM**: remplacer `synchronize: true` par migrations en prod.
- Logging structuré + monitoring + alerting.

### P2 — Quality / compliance
- Tests unit + e2e sur parcours critiques (auth, panier, checkout).
- Checklist a11y/SEO (Lighthouse/WCAG) + correctifs.


## diagramme cas dutilisation / archi / sequence