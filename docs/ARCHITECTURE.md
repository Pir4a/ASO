# Architecture technique (bootstrap)

## Monorepo
- Workspaces npm + Turborepo
- Apps : `apps/web` (Next.js 16, App Router), `apps/api` (NestJS 11)
- Packages partagés : `@bootstrap/config`, `@bootstrap/types`, `@bootstrap/ui`

## Front (Next.js)
- Pages clés : accueil, catégories (+ slug), produits (+ slug), recherche, panier, checkout, compte (login/signup/orders/settings), chatbot/contact, CGU, mentions, backoffice.
- i18n : locales `fr/en/ar`, support RTL (`dir` sur `<html>`), cookie `locale`.
- SEO : metadata, sitemap, robots, OpenGraph, remote images (Unsplash).
- UI : charte couleurs (#00a8b5, #d4f4f7, #33bfc9, #003d5c), polices Poppins/Inter, composants grille/hero/carrousel.
- Data : fetch API (`NEXT_PUBLIC_API_URL`, défaut `http://localhost:3001/api`) avec fallback mock.

## API (NestJS)
- Modules : auth (JWT), users, categories, products, content (content blocks + schema Mongo), cart (mock), orders (mock), health.
- Sécurité : helmet, CORS (env `CORS_ORIGIN`), throttling (100 req/min), ValidationPipe whitelist, global prefix `/api`.
- Bases :
  - PostgreSQL (TypeORM autoLoadEntities, migration `1700000000000-init.ts`, seed script).
  - MongoDB (Mongoose, schema `Media` pour GridFS/metadata).
- Scripts : `db:migrate`, `db:revert`, `seed`.

## Données initiales (seed)
- Catégories : imagerie, bloc opératoire, soins & monitoring.
- Produits : 3 références (SKU ALT-CT-500, ALT-MON-200, ALT-BLOC-900).
- Contenu : bloc texte homepage.
- Utilisateur admin : `admin@althea.local` / `admin123` (hashé, rôle admin).

## Endpoints principaux
- `GET /api/health` : ping
- `POST /api/auth/signup`, `POST /api/auth/login`
- `GET /api/categories`, `GET /api/products`, `GET /api/products/:slug`
- `GET /api/content`
- `GET /api/cart` (mock calcul totals)
- `GET /api/orders` (mock)
- `GET /api/users` (liste publique à sécuriser dans itérations suivantes)

## Déploiement local
- Docker Compose : Postgres + pgAdmin, Mongo + mongo-express.
- Apps : front 3000, API 3001 (préfixe /api). Variables dans `.env.example` (racine, web, api).

## Next steps suggérés
- Protéger les endpoints sensibles (guards JWT + rôles admin).
- Persister le panier/commandes (tables + services dédiés).
- Stocker les médias via GridFS + service upload signé.
- Ajouter tests e2e (Playwright) pour parcours panier/checkout.

