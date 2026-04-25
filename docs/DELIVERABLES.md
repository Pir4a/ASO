# Suivi de l'évolution des livrables

Ce document récapitule la progression du projet **Althea Systems B2B E-Commerce** par sprint, en s'appuyant sur l'historique Git du repository.

> **TODO** : ce document est à mettre à jour à la clôture de chaque sprint. Les revues de code (Pull Requests) servent de checkpoint formel.

---

## 1. Méthodologie

- **Versioning** : Git, branches feature → `prod` → `main` (release).
- **Cadence** : sprints courts (~2 semaines), commits atomiques préfixés par convention :
  - `feat(scope): …` — nouvelle fonctionnalité.
  - `fix(scope): …` — correction.
  - `chore/refactor/docs/test(scope): …`
- **Revue** : Pull Requests obligatoires avant merge sur `main` (**TODO** : activer la branch protection rule).
- **Documentation** : tout livrable significatif est accompagné d'une mise à jour de `docs/`.

---

## 2. Récapitulatif des sprints (basé sur l'historique Git)

> Les sprints sont reconstruits a posteriori à partir des commits. À partir du sprint courant, fournir des plannings prévisionnels en début de sprint.

### Sprint 1 — Bootstrap monorepo & infrastructure
**Livrables**
- Mise en place monorepo npm workspaces + Turborepo.
- Choix de la stack : Next.js 16 / NestJS 11 / Postgres / Mongo.
- Squelette Docker Compose (Postgres, pgAdmin, Mongo).
- Migration TypeORM initiale + script seed.
- Configuration ESLint / Prettier / TypeScript.

**Revues de code** : commits initiaux d'architecture.

---

### Sprint 2 — Modèles de domaine & API CRUD
**Livrables**
- Entités domaine : `User`, `Category`, `Product`, `Order`, `Cart`, `Address`, `Promotion`.
- Repositories TypeORM + mappers.
- Modules NestJS : `UsersModule`, `AuthModule`, `ProductsModule`, `CategoriesModule`.
- Endpoints publics : `/categories`, `/products`, `/products/:slug`.
- Authentification JWT (`/auth/register`, `/auth/login`).
- Seed démo : admin + catégories + 3 produits.

**Commits significatifs**
- `feat(login): mot de passe oublié`
- `feat(seed): add better db seed for demo`
- `feat(categories,product): rework entities`

---

### Sprint 3 — Front-end Next.js (homepage, catalogue, fiche produit)
**Livrables**
- App Router : routes `/`, `/categories`, `/products/[slug]`, `/search`.
- Layout global, Header, Footer, navigation responsive.
- Charte graphique (Tailwind v4 + couleurs charte).
- Carrousel homepage (autoplay, a11y, click-zones).
- Grille catégories, fiche catégorie, fiche produit.
- i18n fr/en/ar + RTL pour l'arabe.
- SEO : `sitemap.ts`, `robots.ts`, OpenGraph metadata.

**Commits significatifs**
- `feat(home): real carousel with click-zone nav, autoplay, a11y`
- `feat(homepage): category grid`
- `feat(category,layout): layout max width, category fixes`
- `feat(product): product page rework`
- `feat(ui): compact locale switcher with language code`

---

### Sprint 4 — Comptes utilisateurs & profil
**Livrables**
- Pages compte : `/login`, `/signup`, `/forgot-password`, `/verify`, `/profile`, `/settings`, `/orders`.
- AuthContext côté front (token storage + interceptor).
- Endpoints `/profile/me` (GET, PATCH, password change).
- Module emails : vérification compte (Ethereal en dev).
- Module addresses : CRUD `/profile/addresses`.

**Commits significatifs**
- `feat(mail): first email verification implem`
- `feat(profile): profile page ui`
- `feat(user): entity address`
- `feat(user): controller and implem for address`
- `feat(user): create address use clean clean archi lets go`
- `feat(user): commands, commands details, mv commands in user page`

---

### Sprint 5 — Panier & checkout
**Livrables**
- Module `CartModule` : items, merge guest cart, promotions.
- Header `x-guest-cart-id` pour les paniers anonymes.
- Module `OrdersModule` : création commande, génération PDF facture (`pdfkit`).
- Page `/checkout` avec étapes adresse + paiement.

**Commits significatifs**
- `feat(product): add products increments, decrements, stock linked`

---

### Sprint 6 — Paiement Stripe
**Livrables**
- Intégration Stripe SDK côté API + côté front.
- Endpoints `/payment/intent`, `/payment/intent/setup`, `/payment/methods`.
- UI : Stripe Elements, gestion des cartes enregistrées.
- Flow de confirmation : `POST /checkout/:orderId/confirm`.
- Documentation cartes de test (`CARDNUMBERTESTSTRIPE.md`).

**Commits significatifs**
- `feat(payment): full wiring of payment method from profile page stripe`
- `feat(payment): full UI UX front end for the payment wiring`
- `feat(checkout,user): adressform and address list`
- `feat(doc): stripe cards`

---

### Sprint 7 — Backoffice admin
**Livrables**
- Route `/backoffice` protégée par `@Roles('admin')`.
- Dashboard stats (commandes, CA).
- CRUD produits, catégories, contenu (blocs homepage / carrousel).
- Liste utilisateurs + actions (activate/deactivate, role, send email — MVP).
- Liste commandes + changement de statut.
- Inbox messages contact.

**Commits significatifs**
- `feat(backoffice): full UI rework, sidebar, charts, UX overhaul`
- `fix(header) admin spacings`

---

### Sprint 8 — Contenu CMS & contact
**Livrables**
- Module `ContentModule` : `homepage_text`, `carousel` (max 3 slides).
- Reorder / bulk actions admin.
- Module `ContactModule` : formulaire public `/contact` + inbox admin.

**Commits significatifs**
- `feat(contact): contact page UI overhaul, layout`

---

### Sprint 9 — Chatbot LLM
**Livrables**
- Container Ollama dans docker-compose (auto-pull `llama3.2:3b`).
- Module `ChatModule` : endpoint `POST /chat`.
- Widget chat côté front.

---

### Sprint courant — Documentation technique
**Livrables (en cours)**
- `docs/INSTALLATION.md` — Guide d'installation.
- `docs/API.md` — Documentation endpoints.
- `docs/CODE_STRUCTURE.md` — Architecture du code.
- `docs/TESTING.md` — Stratégie de tests.
- `docs/DCT.md` — Document de Conception Technique.
- `docs/DELIVERABLES.md` — Le présent fichier.

---

## 3. Sprints à venir (prévisionnel — TODO)

| Sprint | Objectif | Livrables clés |
|---|---|---|
| **S+1** | Tests automatisés | Couverture Jest ≥ 60%, Playwright sur 5 parcours |
| **S+1** | CI/CD | Pipeline GitHub Actions (lint + build + test) |
| **S+2** | Sécurité prod | Webhook Stripe signé, throttler activé, CSP stricte |
| **S+2** | Module médias | Upload images produits (GridFS ou S3) |
| **S+3** | Application mobile | Bootstrap Expo `apps/mobile/`, parcours catalogue |
| **S+3** | RGPD | Export données, suppression compte, bandeau cookies |
| **S+4** | Observabilité | Sentry, OpenTelemetry, dashboard Grafana |
| **S+4** | Optimisations | Index Postgres, cache Redis, CDN images |

---

## 4. Conventions de code review

À chaque PR (TODO : automatiser via template) :
- [ ] Le titre suit la convention `feat|fix|chore|docs(scope): description`.
- [ ] Les tests existants passent (`npm test`, `npm run lint`).
- [ ] Les nouvelles features sont couvertes par au moins un test (TODO).
- [ ] Pas de secret dans les commits (`gitleaks` — TODO).
- [ ] La doc est à jour si l'API publique change.
- [ ] L'auteur a self-reviewé avant de demander une review.

---

## 5. Accès au repository

- **Code source** : repository Git (URL à compléter).
- **Branches actives** :
  - `main` — version stable / prod.
  - `prod` — préprod / staging.
  - `feat/*`, `fix/*` — branches de travail.
- **Issues / Backlog** : TODO — à créer (GitHub Issues / Linear / Jira).
- **Pull Requests** : TODO — formaliser le template.

---

## 6. Rapports de progression

À fournir en fin de sprint :
- **Burndown** : tâches planifiées vs réalisées.
- **Démo** : capture vidéo des nouvelles features.
- **Métriques** : nombre de commits, lignes ajoutées/supprimées, tests ajoutés.
- **Risques identifiés** et mitigation prévue.
- **Backlog mis à jour** pour le sprint suivant.

> **TODO** : créer un dossier `docs/sprints/` avec un fichier `sprint-N.md` par itération une fois la cadence formalisée.
