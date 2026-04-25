# Document de Conception Technique (DCT) — Althea Systems

Ce DCT décrit l'architecture technique de la plateforme **Althea Systems B2B E-Commerce** : interactions des composants, choix technologiques, sécurité, maintenance et évolutivité.

---

## 1. Architecture du système

### 1.1. Vue d'ensemble

La plateforme est un **système distribué** composé de :
- Un **front-end web** (Next.js 16, App Router) responsive desktop & mobile.
- Une **API REST** (NestJS 11) en clean architecture.
- Une base **PostgreSQL** pour le transactionnel (users, products, carts, orders…).
- Une base **MongoDB** pour les médias / GridFS (**TODO** : pas encore branchée).
- Des **services externes** : Stripe (paiement), SMTP (emails), Ollama LLM (chatbot).
- Un **backoffice** intégré au front (`/backoffice`) protégé par rôle `admin`.
- (**TODO**) Une future **application mobile native** (Expo/React Native).

### 1.2. Diagramme d'architecture globale

```
                          ┌──────────────────────────────┐
                          │     Utilisateurs / Admin     │
                          │  (Desktop, Mobile responsive,│
                          │      Mobile native TODO)     │
                          └──────────────┬───────────────┘
                                         │ HTTPS
                                         ▼
                          ┌──────────────────────────────┐
                          │  Reverse Proxy (TODO en prod)│
                          │  Nginx / Traefik / Vercel    │
                          └──────────────┬───────────────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  ▼                      ▼                      ▼
        ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
        │   Web (Next.js)  │   │   API (NestJS)   │   │  Backoffice      │
        │  port 3000       │◀─▶│  port 3001/api   │   │  (route /backoffice
        │  SSR + CSR       │   │  Helmet, CORS,   │   │   du même Next)  │
        │  i18n fr/en/ar   │   │  JWT, Throttler  │   └──────────────────┘
        └────────┬─────────┘   └────────┬─────────┘
                 │ fetch                │
                 │                      │
                 │              ┌───────┼─────────────────────────┐
                 │              ▼       ▼                         ▼
                 │      ┌──────────┐  ┌──────────┐         ┌──────────┐
                 │      │ Postgres │  │  Mongo   │         │  Ollama  │
                 │      │ TypeORM  │  │ GridFS   │         │  LLM     │
                 │      │ users,   │  │ medias   │         │  llama3  │
                 │      │ orders…  │  │  (TODO)  │         │          │
                 │      └──────────┘  └──────────┘         └──────────┘
                 │
                 │              ┌──────────────────────────┐
                 └─────────────▶│   Stripe (paiement)      │
                                │   SMTP (Ethereal/Gmail)  │
                                └──────────────────────────┘
```

### 1.3. Composants principaux

| Composant | Tech | Rôle |
|---|---|---|
| **Web** | Next.js 16 (App Router) | Pages publiques + compte + checkout, responsive desktop/mobile, i18n RTL |
| **Backoffice** | Next.js (route protégée `/backoffice`) | Gestion produits, catégories, commandes, utilisateurs, contenu CMS |
| **API** | NestJS 11 + TypeORM | Endpoints REST, business logic, sécurité |
| **DB Postgres** | PostgreSQL 16 | Données transactionnelles ACID |
| **DB Mongo** | MongoDB + Mongoose | Médias (TODO) |
| **Stripe** | API externe | PaymentIntent, SetupIntent, webhooks |
| **Ollama** | Container LLM local | Chatbot (modèle `llama3.2:3b`) |
| **SMTP** | Nodemailer (Ethereal en dev, Gmail/SMTP en prod) | Emails transactionnels (vérif compte, factures) |

---

## 2. Diagrammes techniques

### 2.1. Diagramme de flux de données — Cycle de commande

```
Utilisateur                 Web (Next.js)             API (NestJS)              DB Postgres        Stripe
     │                            │                        │                        │                  │
     │ Ajoute produit panier      │                        │                        │                  │
     ├──────────────────────────▶ │                        │                        │                  │
     │                            │ POST /cart/items       │                        │                  │
     │                            │ x-guest-cart-id        │                        │                  │
     │                            ├──────────────────────▶ │                        │                  │
     │                            │                        │ INSERT cart_items      │                  │
     │                            │                        ├──────────────────────▶ │                  │
     │                            │                        │ ◀──────────────────────┤                  │
     │                            │ ◀──────────────────────┤                        │                  │
     │ Clique « Commander »       │                        │                        │                  │
     ├──────────────────────────▶ │                        │                        │                  │
     │                            │ POST /checkout         │                        │                  │
     │                            │ Bearer <jwt>           │                        │                  │
     │                            ├──────────────────────▶ │                        │                  │
     │                            │                        │ INSERT orders + items  │                  │
     │                            │                        ├──────────────────────▶ │                  │
     │                            │                        │ ◀──────────────────────┤                  │
     │                            │                        │ POST /payment/intent   │                  │
     │                            │                        ├────────────────────────────────────────▶ │
     │                            │                        │ ◀────────────────────────────────────────┤
     │                            │ ◀──────────────────────┤  clientSecret          │                  │
     │ Saisit la carte (Stripe Elements)                   │                        │                  │
     │ ◀──────────────────────────┤                        │                        │                  │
     │                            │                                                                    │
     │                            │ Stripe.confirmPayment ─────────────────────────────────────────▶  │
     │                            │ ◀──────────────────────────────────────────────────────────────────┤  succeeded
     │                            │ POST /checkout/:id/confirm                                         │
     │                            ├──────────────────────▶ │                                          │
     │                            │                        │ UPDATE orders SET paymentStatus='paid'    │
     │                            │                        ├──────────────────────▶ │                  │
     │                            │ ◀──────────────────────┤  facture PDF générée   │                  │
     │                            │                        │ Webhook Stripe (TODO sig vérif)           │
     │                            │                        │ ◀────────────────────────────────────────┤
```

### 2.2. Diagramme de communication services (séquence Auth + parcours protégé)

```
Browser           Next.js (SSR)        API NestJS           Postgres
   │                  │                    │                   │
   │ POST /login      │                    │                   │
   ├────────────────▶ │                    │                   │
   │                  │ POST /api/auth/login                   │
   │                  ├──────────────────▶ │                   │
   │                  │                    │ SELECT user       │
   │                  │                    ├─────────────────▶ │
   │                  │                    │ ◀─────────────────┤
   │                  │                    │ bcrypt.compare    │
   │                  │                    │ JwtService.sign   │
   │                  │ { accessToken }    │                   │
   │                  │ ◀──────────────────┤                   │
   │ Set-Cookie / token stocké             │                   │
   │ ◀────────────────┤                    │                   │
   │                                                            │
   │ GET /account/profile                                       │
   ├────────────────▶ │                                         │
   │                  │ GET /api/profile/me (Bearer)            │
   │                  ├──────────────────▶ │                   │
   │                  │                    │ JwtAuthGuard      │
   │                  │                    │ → req.user.sub    │
   │                  │                    │ → FindUserById    │
   │                  │                    ├─────────────────▶ │
   │                  │                    │ ◀─────────────────┤
   │                  │ ◀──────────────────┤                   │
   │ HTML rendu       │                                         │
   │ ◀────────────────┤                                         │
```

### 2.3. Modèle de données (entités principales)

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  users      │      │  addresses   │      │  carts      │
├─────────────┤      ├──────────────┤      ├─────────────┤
│ id PK       │1───* │ id PK        │      │ id PK       │
│ email UQ    │      │ userId FK    │      │ userId FK   │
│ passwordHash│      │ street       │      │ status      │
│ role        │      │ city, ...    │      │ createdAt   │
│ isActive    │      └──────────────┘      └──────┬──────┘
│ isVerified  │                                   │1
└──────┬──────┘                                   │
       │1                                         │*
       │*                                  ┌──────────────┐
┌─────────────┐                            │  cart_items  │
│  orders     │                            ├──────────────┤
├─────────────┤        ┌──────────────┐    │ id PK        │
│ id PK       │1     * │ order_items  │    │ cartId FK    │
│ userId FK   │────────│ id PK        │    │ productId FK │
│ status      │        │ orderId FK   │    │ quantity     │
│ total       │        │ productId FK │    └──────┬───────┘
│ paymentStatus       │ quantity      │           │*
│ paymentId   │       │ unitPriceCents│           │
│ ...         │       └───────────────┘           │
└─────────────┘                                   │
                                                  │
┌─────────────┐      ┌─────────────────┐          │
│ categories  │      │   products      │          │
├─────────────┤      ├─────────────────┤*         │
│ id PK       │1───* │ id PK           │──────────┘
│ slug UQ     │      │ sku UQ          │
│ name        │      │ slug UQ         │
│ order       │      │ priceCents      │
│ isActive    │      │ vatRate         │
└─────────────┘      │ stock           │
                     │ categoryId FK   │
┌─────────────────┐  │ specs JSONB     │
│ content_blocks  │  └─────────────────┘
├─────────────────┤
│ id PK           │  ┌──────────────────┐
│ type            │  │ contact_messages │
│ payload JSONB   │  ├──────────────────┤
│ order           │  │ id PK            │
└─────────────────┘  │ email, subject   │
                     │ message          │
                     │ createdAt        │
                     └──────────────────┘
```

> **TODO** : exporter ces diagrammes en PNG/SVG via Mermaid ou PlantUML pour le rapport final. Les sources actuelles sont en ASCII pour rester versionnables et lisibles dans le repo.

---

## 3. Choix technologiques

### 3.1. Front-end : Next.js 16

**Justification**
- **Performance** : SSR/ISR + Server Components → first paint rapide, hydration partielle.
- **SEO** : metadata API, sitemap.xml, robots.txt, OpenGraph natifs.
- **Scalabilité** : ISR permet de servir des millions de pages produits avec un coût compute borné.
- **Accessibilité** : i18n natif (fr/en/ar + RTL).
- **DX** : routing file-based, TypeScript strict, hot reload.

### 3.2. Back-end : NestJS 11

**Justification**
- **Architecture** : DI native facilitant la **clean architecture** (domain / application / infrastructure).
- **Sécurité** : intégration Helmet, Throttler, ValidationPipe, Passport (JWT) au cœur du framework.
- **Écosystème** : modules officiels TypeORM, Mongoose, Swagger, GraphQL — adoption sans friction.
- **Performance** : compatible avec Fastify si besoin (>40k req/s sur un endpoint simple).

### 3.3. Bases de données

| Donnée | Technologie | Justification |
|---|---|---|
| Transactions (users, orders, carts) | **PostgreSQL 16** | ACID, transactions, JSONB pour `specs` produits, full-text natif pour la recherche. |
| Médias (images produits) | **MongoDB GridFS** (TODO) ou **S3** (recommandé prod) | Volumes importants, lecture haute fréquence. |

### 3.4. Paiement : Stripe
- Standard de marché, 3DS/SCA gérés, webhooks fiables.
- Test cards documentées (`CARDNUMBERTESTSTRIPE.md`).
- SetupIntent pour les cartes enregistrées.

### 3.5. Chatbot : Ollama (local)
- Self-hosted = zéro coût récurrent, données ne sortent pas du serveur.
- **Évolution prod** : abstraction `ChatService` permettant de basculer vers OpenAI/Claude API en fallback.

### 3.6. Tailwind CSS v4
- Build avec moteur Rust → ultra-rapide.
- CSS final minimal grâce au tree-shaking utility.

### 3.7. Monorepo : Turborepo
- Cache local et distant.
- Pipelines déclaratifs (`turbo.json`).
- Parallélisation des builds.

---

## 4. Plan de sécurité (Bonus)

### 4.1. Sécurisation des transmissions
- **HTTPS / TLS 1.3** côté reverse proxy (à activer en prod — **TODO**).
- **HSTS** + redirection HTTP→HTTPS.

### 4.2. Authentification & autorisation
- **JWT** signé (`HS256` par défaut, `JWT_SECRET` ≥ 32 chars en prod) avec `JWT_EXPIRES_IN=1d`.
- **Bcrypt** (10 rounds) pour les mots de passe.
- **RBAC** : `customer` vs `admin` via `RolesGuard` + décorateur `@Roles('admin')`.
- **Mot de passe** : minimum 8 caractères (vérifié dans `ProfileController`).

### 4.3. Protection contre les attaques
| Menace | Mitigation actuelle | TODO |
|---|---|---|
| **XSS** | Next.js auto-escape JSX. Helmet ajoute `X-XSS-Protection`, CSP de base. | Définir une **CSP stricte** (nonces pour scripts inline). |
| **CSRF** | API stateless (JWT en header, pas de cookies de session par défaut). | Si on passe en cookie httpOnly : ajouter token CSRF SameSite=Strict. |
| **SQL Injection** | TypeORM utilise des requêtes paramétrées. `class-validator` filtre les payloads. | Audit des `query()` bruts (recherche full-text). |
| **NoSQL Injection** | Mongoose schemas typés. | À vérifier quand le module media sera branché. |
| **Brute force / abuse** | `@nestjs/throttler` installé. | **Activer globalement** (`ThrottlerModule.forRoot`) — pas encore wired dans `AppModule`. |
| **Mass assignment** | `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` | OK |
| **CORS** | Whitelist origin dans `main.ts`. | Mettre `CORS_ORIGIN` à la valeur prod, pas localhost. |
| **Secrets fuités** | `.env` exclus de git. | Activer `gitleaks` en pre-commit (TODO). |
| **Headers de sécurité** | Helmet par défaut. | Affiner CSP, Referrer-Policy, Permissions-Policy. |
| **DoS Stripe webhook** | `POST /payment/webhook` ouvert. | **Vérifier la signature** `stripe-signature` (actuellement non implémentée — TODO critique). |

### 4.4. Conformité RGPD
| Exigence | Status |
|---|---|
| Consentement cookies | **TODO** : pas de bandeau cookie. |
| Droit d'accès (export données) | **TODO** : ajouter `GET /api/profile/me/export`. |
| Droit à l'oubli (suppression compte) | Endpoint admin présent (`DELETE /users/:id`) — **TODO** : exposer côté utilisateur (`DELETE /profile/me`). |
| Politique de confidentialité | **TODO** : page `/legal/privacy` à compléter. |
| Conservation des données | **TODO** : politique de purge (factures = 10 ans, paniers abandonnés = X jours). |
| Chiffrement au repos | À configurer côté DB managée (Postgres natif). |
| Logs anonymisés | **TODO** : ne jamais logger email + IP simultanément en clair. |

### 4.5. Sécurité applicative
- **Validation stricte** : tous les DTO passent par `ValidationPipe` global.
- **Sanitization** : `class-transformer` `transform: true` + `whitelist`.
- **Logs** : éviter de logger `passwordHash`, `accessToken`, `clientSecret` (TODO : ajouter un logger redaction layer type Pino + redact).

---

## 5. Plan de maintenance et évolutivité

### 5.1. Maintenance continue

| Domaine | Pratique | Fréquence |
|---|---|---|
| **Mises à jour dépendances** | `npm audit fix`, Dependabot/Renovate | Hebdomadaire |
| **Sécurité (CVE)** | Suivi NVD + Snyk | Continu (alertes) |
| **Backups Postgres** | `pg_dump` automatisé + rétention 30 jours | Quotidien |
| **Backups Mongo** | `mongodump` (TODO) | Quotidien |
| **Logs** | Rotation + agrégation (ELK / Loki / Sentry — TODO) | Continu |
| **Monitoring** | Uptime + erreurs 5xx + latence p95 (TODO) | Temps réel |
| **Audits sécurité** | OWASP ZAP automatisé en CI (TODO) | Pré-release |

### 5.2. Stratégie de versioning et déploiement

- **Branches** : `main` (stable, prod) ← `prod` (préprod) ← features (`feat/*`, `fix/*`).
- **Tags** : SemVer (`v1.0.0`, `v1.1.0`, `v1.1.1`).
- **CHANGELOG** : à tenir à chaque release (TODO : auto via `release-please` ou `changesets`).
- **Releases** : déploiement automatique sur tag (TODO pipeline CI/CD).

### 5.3. Évolutivité (scalabilité)

#### Couche front
- **Next.js sur Vercel/Netlify** = scaling horizontal automatique, edge caching natif.
- **Self-hosted** : derrière un load balancer + multiples instances Node.

#### Couche API
- API **stateless** (JWT) → scaling horizontal sans session sticky.
- **Limite actuelle** : panier invité repose sur header `x-guest-cart-id` côté client → OK pour le scaling.
- **Cache** : ajouter Redis (TODO) pour les requêtes lourdes (recherche, dashboard admin).

#### Base de données
- Postgres : indexer correctement les colonnes filtrées (catégorie, slug, sku, status). **TODO** : ajouter un script `EXPLAIN ANALYZE` sur les requêtes critiques.
- **Read replicas** Postgres pour scaler les lectures (catalogue produit) à 1M+ visiteurs/mois.
- **Partitionnement** des tables `orders` / `cart_items` par date si volumétrie > 10M lignes.
- **Connection pooling** : PgBouncer en façade.

#### Médias
- Migration GridFS → **CDN + Object Storage** (Cloudflare R2, AWS S3) recommandée dès la prod.
- Génération d'images responsive via Next/Image + un service d'optimisation à la volée (Imgproxy / Cloudinary).

#### Chatbot
- Ollama monolocal → **OK pour < 50 conversations simultanées**.
- Au-delà : queue (BullMQ + Redis) ou bascule vers API managée.

### 5.4. Évolutions fonctionnelles prévues (TODO)

| Feature | Priorité | Effort |
|---|---|---|
| Module **médias** (upload, GridFS, signed URLs) | Haute | M |
| **Application mobile** (Expo/React Native) | Haute | XL |
| **Multi-devises** (EUR / USD / MAD) | Moyenne | M |
| **Multi-tenant** (plusieurs marques sur la même plateforme) | Basse | XL |
| **Reviews / notes produits** | Moyenne | M |
| **Wishlist** | Basse | S |
| **Newsletter / marketing automation** | Moyenne | M |
| **Search engine dédié** (Meilisearch / Typesense) | Moyenne | M |
| **Exports comptables** (CSV / SAP) | Haute (B2B) | M |

---

## 6. Risques techniques identifiés

| Risque | Impact | Mitigation |
|---|---|---|
| `synchronize: true` activé en prod par erreur | Perte / corruption schéma | Forcer `synchronize: false` via env var en prod, audit du startup. |
| Webhook Stripe non signé | Fausses confirmations de paiement | **TODO critique** : implémenter `stripe.webhooks.constructEvent`. |
| `JWT_SECRET` faible | Tokens forgés | Vérifier au boot que la longueur ≥ 32, rejeter `super-secret-key` en prod. |
| Pas de tests automatisés | Régressions silencieuses | Voir `TESTING.md` — backlog de couverture à étoffer. |
| Pas de CI/CD | Déploiements manuels risqués | Pipeline GitHub Actions à mettre en place. |
| Stripe publishable key inlinée à la build | Rebuild requis pour rotation | Documenter la procédure de rotation. |

---

## 7. Annexes

- [INSTALLATION.md](./INSTALLATION.md) — Guide d'installation et déploiement.
- [API.md](./API.md) — Documentation des endpoints.
- [CODE_STRUCTURE.md](./CODE_STRUCTURE.md) — Organisation détaillée du code.
- [TESTING.md](./TESTING.md) — Stratégie de tests.
- [DELIVERABLES.md](./DELIVERABLES.md) — Suivi des livrables / sprints.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Note d'architecture initiale (bootstrap).
- `Cahier-des-charges-Projet-Etude-2025-2026.pdf` — Cahier des charges officiel.
