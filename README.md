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
- Front Next.js (App Router) avec pages : accueil, catégories (+ détail), produits, recherche, panier, checkout, compte (login/signup/orders/settings), chatbot/contact, CGU/mentions, backoffice complet.
- Thème charte (#00a8b5, #d4f4f7, #33bfc9, #003d5c), polices Poppins/Inter, i18n + RTL (locale cookie), sitemap/robots.
- API NestJS : modules auth (JWT), users, categories, products, content (GridFS schema), cart, orders, health, admin. Sécurité de base (helmet, CORS, rate-limit, ValidationPipe).
- Modèles Postgres (TypeORM) + migration initiale + seed (catégories, produits, contenu, admin). Mongo connecté pour médias.
- Docker Compose pour Postgres + pgAdmin, Mongo + mongo-express.
- **Paiement Stripe intégré** : webhooks, intent, refund, idempotence, gestion des méthodes de paiement.
- **Facturation PDF** : génération automatique, modification, suppression avec avoirs, stockage sécurisé.
- **Emails transactionnels** : confirmation de commande avec PDF, vérification email.
- **Backoffice complet** : gestion catégories (CRUD, drag&drop, upload images, bulk actions), produits (CRUD, bulk updates), utilisateurs (gestion rôles/statuts, reset password), contenu homepage (carrousel, hero, features, CTA, produits/catégories vedettes).
- Paiement Stripe complet (intent, webhook sécurisé, idempotence, remboursement) + suivi paiement en BDD.
- Facturation PDF (génération/édition/suppression + avoirs) avec stockage local.
- Email de confirmation de commande avec recap et lien facture.
- Messages de contact persistés via `/api/contact`.

## Scripts utiles
- Racine : `npm run dev|build|lint`, `npm run docker:up`, `npm run docker:down`
- Web : `npm run dev --workspace web`, `npm run lint --workspace web`
- API : `npm run start:dev --workspace api`, `npm run lint --workspace api`, `npm run db:migrate`, `npm run db:revert`, `npm run seed`

## Backoffice
- `/backoffice` : tableau de bord avec statistiques
- `/backoffice/categories` : gestion complète des catégories (CRUD, drag&drop, bulk actions, upload images)
- `/backoffice/products` : gestion complète des produits (CRUD, bulk updates, images)
- `/backoffice/users` : gestion des utilisateurs (rôles, statuts, reset password)
- `/backoffice/homepage` : gestion du contenu de la page d'accueil (carrousel, hero, features, CTA, produits/catégories vedettes)
- `/backoffice/faq` : gestion des questions fréquemment posées (CRUD, réorganisation)
- `/backoffice/chatbot` : supervision des conversations chatbot (actives/escaladées)
- `/backoffice/contact-messages` : gestion des messages de contact (réponses, statut)

## Chatbot IA
- Widget flottant disponible sur toutes les pages
- Base de connaissances FAQ intégrée
- Reconnaissance des demandes d'escalade ("parler à un humain")
- Historique des conversations stocké
- Interface d'administration pour supervision
- Support des sessions anonymes et utilisateurs connectés

## Paiement Stripe (env)
- `STRIPE_SECRET_KEY` : clé secrète Stripe (mode test recommandé en local).
- `STRIPE_WEBHOOK_SECRET` : secret de signature des webhooks Stripe.
- Webhook Stripe : `POST /api/payment/webhooks/stripe`.
 - Remboursement : `POST /api/payment/refund/:orderId`.
 - Idempotence : header `idempotency-key` sur `POST /api/payment/intent`.

## Facturation (env)
- `COMPANY_NAME`, `COMPANY_ADDRESS_LINE1`, `COMPANY_ADDRESS_LINE2`
- `COMPANY_EMAIL`, `COMPANY_PHONE`
- `COMPANY_VAT_NUMBER`, `COMPANY_SIRET`, `COMPANY_RCS`
- `COMPANY_LEGAL_MENTIONS`, `INVOICE_NOTES`

## Factures (endpoints)
- `GET /api/orders/:orderId/invoice` : telechargement PDF.
- `PUT /api/orders/:orderId/invoice` : mise a jour (regeneration PDF).
- `DELETE /api/orders/:orderId/invoice` : annulation + creation d'avoir.

## Sécurité / Perf / SEO
- SSR/ISR prêt, images optimisées (remote patterns), sitemap/robots, hreflang via i18n.
- Sécurité API : helmet, CORS configurable, throttling, validation DTO, JWT, cookies côté front.
- A11y : contrastes, focus states, lang/dir sur `<html>`, composants formulaires basiques.

# ASO
