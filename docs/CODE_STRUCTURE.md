# Structure du code — Althea Systems

## 1. Vue d'ensemble du monorepo

Repository organisé en **monorepo npm workspaces + Turborepo** :

```
ASO/
├── apps/
│   ├── api/                 # Backend NestJS 11 (TypeScript)
│   └── web/                 # Frontend Next.js 16 (App Router) — desktop + mobile responsive
├── packages/
│   ├── config/              # Constantes partagées (couleurs, locales…)
│   ├── types/               # Types TS partagés API ↔ Web
│   └── ui/                  # Composants UI partagés (TODO : remplir si besoin)
├── docs/                    # Documentation technique (ce dossier)
├── docker-compose.yml       # Postgres + Ollama + (Mongo TODO) + API + Web
├── turbo.json               # Pipeline Turborepo (dev, build, lint)
├── tsconfig.base.json       # TS config racine
└── package.json             # Workspaces + scripts racine
```

### Pourquoi un monorepo ?
- **Partage de types** entre front et back via `@bootstrap/types` → contrat fort, refactoring sûr.
- **Build / lint / test orchestrés** par Turborepo (cache, parallélisation).
- **Une seule source de vérité** pour les conventions Prettier/ESLint.

---

## 2. Backend — `apps/api/` (NestJS)

### 2.1. Architecture en couches (Clean / Hexagonal Architecture)

Le backend suit une variante de **Clean Architecture** :

```
src/
├── domain/                  # 🟢 Cœur métier — INDÉPENDANT des frameworks
│   ├── entities/            #    Modèles de domaine purs (User, Product, Order…)
│   ├── repositories/        #    Interfaces (PRODUCT_REPOSITORY_TOKEN, OrderRepository…)
│   └── gateways/            #    Interfaces externes (Stripe, Email, LLM…)
│
├── application/             # 🟡 Use-cases — orchestration du domaine
│   └── use-cases/
│       ├── auth/            #    register, login, verifyEmail…
│       ├── products/        #    getProducts, createProduct, search…
│       ├── orders/          #    createOrder, generateInvoicePdf…
│       └── ...              #    (cart, content, payment, users, contact)
│
├── infrastructure/          # 🔴 Adaptateurs — DÉPEND du domaine, pas l'inverse
│   ├── controllers/         #    Endpoints HTTP NestJS
│   ├── persistence/typeorm/ #    Entités TypeORM + mappers (TypeORM ↔ Domain)
│   ├── services/            #    Implémentations Stripe, Email, Chat (Ollama)…
│   ├── guards/              #    JwtAuthGuard, RolesGuard, OptionalJwtAuthGuard
│   ├── decorators/          #    @Roles, @CurrentUser…
│   ├── interceptors/        #    LocalizeInterceptor (i18n réponses)
│   ├── ioc/                 #    Modules Nest (assemblage DI)
│   └── dto/                 #    Validation `class-validator`
│
├── db/                      # data-source.ts (TypeORM) + seed.ts
├── migrations/              # Migrations SQL TypeORM
├── config/                  # Lecture des variables d'environnement
├── lib/                     # Helpers transverses
├── health/                  # Module ping
└── main.ts                  # Bootstrap (helmet, cors, ValidationPipe…)
```

### 2.2. Sens des dépendances
- `domain` ne **connaît rien** d'externe (ni TypeORM, ni Nest, ni Express).
- `application` dépend uniquement de `domain` (interfaces de repositories).
- `infrastructure` dépend de `application` et `domain` — c'est elle qui implémente les interfaces.

Les **tokens d'injection** (`PRODUCT_REPOSITORY_TOKEN`, `ORDER_REPOSITORY_TOKEN`…) découplent les use-cases de TypeORM, ce qui simplifie les tests (mock facile).

### 2.3. Modules principaux (IoC)
Tous chargés depuis `apps/api/src/app.module.ts` :

| Module | Rôle |
|---|---|
| `UsersModule` / `AuthModule` | Inscription, login, JWT, rôles |
| `ProductsModule` | CRUD produits, recherche facettée |
| `CategoriesModule` | CRUD catégories, ordering, bulk |
| `CartModule` | Panier (utilisateur + invité via header) |
| `OrdersModule` | Commandes + génération facture PDF |
| `AddressModule` | Carnet d'adresses utilisateur |
| `ContentModule` | Contenu homepage / carrousel CMS |
| `PaymentModule` | Stripe (PaymentIntent, SetupIntent, webhook) |
| `ContactModule` | Formulaire contact + admin inbox |
| `ChatModule` | Chatbot Ollama (LLM local) |

### 2.4. Persistance

- **PostgreSQL 16 (TypeORM)** — données transactionnelles : users, products, categories, carts, orders, promotions, content_blocks, addresses, contact_messages.
- **MongoDB / Mongoose** — schema `Media` prêt pour GridFS (médias produits). **TODO** : réactiver Mongo dans `docker-compose.yml` et brancher un `UploadController`.
- **Migrations** : `apps/api/src/migrations/1700000000000-init.ts` (init) + `synchronize: true` en dev. **TODO** prod : passer en migrations strictes.
- **Seed** : `apps/api/src/db/seed.ts` (admin, catégories démo, produits, contenus).

---

## 3. Frontend — `apps/web/` (Next.js)

### 3.1. Architecture App Router

```
src/
├── app/                     # Next.js App Router (file-based routing)
│   ├── (account)/           #    Route group : login, signup, profile, orders, settings, verify, forgot-password
│   ├── (shop)/              #    Route group : categories, products, cart, checkout, search
│   ├── (misc)/              #    Route group : chatbot, contact, legal (CGU / mentions)
│   ├── backoffice/          #    Backoffice admin (gestion produits, commandes, users, content)
│   ├── layout.tsx           #    Layout racine (i18n, fonts, providers)
│   ├── page.tsx             #    Homepage
│   ├── sitemap.ts           #    SEO
│   ├── robots.ts            #    SEO
│   └── globals.css          #    Tailwind v4 + variables charte
│
├── components/              # Composants UI organisés par domaine
│   ├── home/                #    Hero, sections homepage
│   ├── category/            #    Listing, filtres, pagination
│   ├── product/             #    Fiche, gallerie, prix, stock
│   ├── cart/                #    Mini-cart, panier
│   ├── checkout/            #    Étapes paiement Stripe
│   ├── account/             #    Profil, settings, orders
│   ├── backoffice/          #    Tableaux admin, formulaires CRUD
│   ├── chat/                #    Widget chatbot
│   ├── layout/              #    Header, footer, nav, search
│   ├── guards/              #    Wrappers d'auth côté client
│   ├── common/              #    Composants génériques (modal, toast…)
│   └── ui/                  #    Primitifs (Button, Input, Select…)
│
├── context/                 # React Context : AuthContext, CartContext, LocaleContext
├── hooks/                   # Hooks personnalisés (useAuth, useCart, useT…)
├── data/                    # Mocks de fallback si API down
└── lib/
    └── api.ts               # Client API typé (fetch wrapper)
```

### 3.2. Stratégie i18n

- Locales supportées : **fr** (par défaut), **en**, **ar** (RTL).
- Cookie `locale` persistant + attribut `<html dir="rtl|ltr">`.
- Côté API : `LocalizeInterceptor` (`apps/api/src/infrastructure/interceptors/localize.interceptor.ts`) traduit les champs des réponses selon le header `Accept-Language`.

### 3.3. Stratégie de récupération des données

- **Server Components Next.js** par défaut (rendering côté serveur).
- `INTERNAL_API_URL` (Docker) pour les fetchs SSR ; `NEXT_PUBLIC_API_URL` pour les fetchs côté client (panier, checkout, recherche live).
- Fallback vers `data/` (mocks) si l'API est indisponible — utile en build statique / preview.

### 3.4. Stripe côté front
- `@stripe/react-stripe-js` + `@stripe/stripe-js` pour l'UI Elements.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` inlinée à la build → rebuild requis si changée.

---

## 4. Packages partagés — `packages/`

| Package | Contenu |
|---|---|
| `@bootstrap/config` | Constantes partagées (couleurs charte, locales, breakpoints). |
| `@bootstrap/types` | Types TS communs (Product, Category, Order, User, ApiError…). |
| `@bootstrap/ui` | (TODO) composants UI partagés API ↔ futurs apps mobile. |

---

## 5. Outillage transverse

| Outil | Usage |
|---|---|
| **Turborepo** | Pipeline `dev/build/lint` orchestré, cache local. |
| **TypeScript** | Strict mode, `tsconfig.base.json` partagé. |
| **ESLint 9** | Lint front + back, plug-in NestJS / Next. |
| **Prettier 3** | Formatage uniforme. |
| **Jest** | Tests unitaires API (config dans `apps/api/package.json`). |
| **Supertest** | E2E API (`apps/api/test/app.e2e-spec.ts`). |
| **Docker Compose** | Bases + apps en local. |

---

## 6. Justification des choix technologiques

### 6.1. Next.js 16 (App Router) côté front
- **Pourquoi** : SSR/ISR natif → SEO + perf, support i18n, image optimization, routing file-based clair, app router compatible Server Components (transferts réseau réduits, cache fin).
- **Alternatives écartées** :
  - *Angular* : trop verbeux pour un site e-commerce, écosystème moins riche pour le SSR fin-tuned.
  - *Vue/Nuxt* : équivalent fonctionnel, mais l'écosystème React est plus étendu pour Stripe / outils analytics.

### 6.2. NestJS 11 côté back
- **Pourquoi** : architecture modulaire DI (similaire Spring/Angular), excellent support TypeScript, ergonomie pour clean architecture (decorators), large écosystème (TypeORM, Mongoose, Passport, Throttler).
- **Alternatives écartées** :
  - *Express nu* : pas d'opinion sur la structure → dérive vite.
  - *Fastify* : plus rapide brut, moins ergonomique côté DI/decorators.

### 6.3. PostgreSQL pour les données transactionnelles
- **Pourquoi** : transactions ACID critiques pour panier/commandes/paiements, JSONB performant pour les `specs` produits, full-text search natif (qui sert à la recherche `/products/search`).
- **TypeORM** : approchable, bonne intégration NestJS, support migrations + entités décorées.

### 6.4. MongoDB pour les médias (TODO)
- **Pourquoi** : GridFS = stockage binaire performant pour images > 16 MB, schema flexible pour métadonnées (alt, tailles, formats). En prod on basculera plutôt vers un object storage (S3/Cloud Storage) — voir `DCT.md`.

### 6.5. Stripe
- **Pourquoi** : référence du marché B2C/B2B pour le paiement européen, gère SCA/3DS, supporte les cartes enregistrées, webhooks fiables.

### 6.6. Ollama (LLM local)
- **Pourquoi** : self-hosted gratuit, réponses chatbot sans dépendre d'OpenAI, idéal en dev. **TODO prod** : ajouter un fallback vers Claude/OpenAI si Ollama indisponible (abstraire via `ChatService`).

### 6.7. Tailwind CSS v4
- **Pourquoi** : utility-first, build hyper-rapide (v4 = nouveau moteur Rust), CSS injecté minimal en prod, intégration Next.js via `@tailwindcss/postcss`.

### 6.8. Turborepo
- **Pourquoi** : cache de build par tâche (jusqu'à 10× plus rapide en CI), parallélisation native des workspaces, configuration minimale.

---

## 7. Conventions et bonnes pratiques

- **Nommage** : `*.controller.ts`, `*.service.ts`, `*.use-case.ts`, `*.entity.ts`, `*.dto.ts`, `*.mapper.ts`.
- **Imports** : absolus depuis `src/` côté API, relatifs côté front.
- **DTO** : validation systématique avec `class-validator` (`@IsString`, `@IsEmail`, `@IsIn`…).
- **Gestion d'erreurs** : exceptions Nest (`BadRequestException`, `NotFoundException`, `UnauthorizedException`) → mapping HTTP automatique.
- **Pas de logique métier dans les controllers** : ils délèguent aux use-cases.
- **Mappers** : `*.mapper.ts` convertissent entités TypeORM ↔ entités domaine pures.
- **Pas de dépendance circulaire** : domain ne doit jamais importer infrastructure.
