# Althea Systems – Monorepo e-commerce (Bootstrap)

Stack cible : Next.js (Front), NestJS (API), PostgreSQL (données transactionnelles), MongoDB/GridFS (médias). Monorepo npm workspaces + Turborepo.

## Prérequis
- Node.js 20+
- Docker + Docker Compose

## Démarrage rapide
1. Copier les variables :
   - `cp .env.example .env`
   - `cp apps/web/.env.example apps/web/.env`
   - `cp apps/api/.env.example apps/api/.env`
2. Lancer les bases :
   - `npm run docker:up`
   - PostgreSQL : `localhost:5432` / MongoDB : `localhost:27017`
3. Migrer + seed (API) :
   - `cd apps/api`
   - `npm run db:migrate`
   - `npm run seed`
4. Lancer les apps :
   - Front : `npm run dev --workspace web` (http://localhost:3000)
   - API : `npm run start:dev --workspace api` (http://localhost:3001/api)

## Points clés livrés
- Front Next.js (App Router) avec pages : accueil, catégories (+ détail), produits, recherche, panier, checkout, compte (login/signup/orders/settings), chatbot/contact, CGU/mentions, backoffice (MVP).
- Thème charte (#00a8b5, #d4f4f7, #33bfc9, #003d5c), polices Poppins/Inter, i18n + RTL (locale cookie), sitemap/robots.
- API NestJS : modules auth (JWT), users, categories, products, content (GridFS schema), cart, orders, health. Sécurité de base (helmet, CORS, rate-limit, ValidationPipe).
- Modèles Postgres (TypeORM) + migration initiale + seed (catégories, produits, contenu, admin). Mongo connecté pour médias.
- Docker Compose pour Postgres + pgAdmin, Mongo + mongo-express.

## Scripts utiles
- Racine : `npm run dev|build|lint`, `npm run docker:up`, `npm run docker:down`
- Web : `npm run dev --workspace web`, `npm run lint --workspace web`
- API : `npm run start:dev --workspace api`, `npm run lint --workspace api`, `npm run db:migrate`, `npm run db:revert`, `npm run seed`

## Sécurité / Perf / SEO
- SSR/ISR prêt, images optimisées (remote patterns), sitemap/robots, hreflang via i18n.
- Sécurité API : helmet, CORS configurable, throttling, validation DTO, JWT, cookies côté front.
- A11y : contrastes, focus states, lang/dir sur `<html>`, composants formulaires basiques.

# ASO
