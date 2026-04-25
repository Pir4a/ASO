# Althea Systems — Plateforme e-commerce B2B

Monorepo full-stack du projet d'étude **Althea Systems** : un site e-commerce B2B responsive avec backoffice intégré, paiement Stripe et chatbot LLM local.

**Stack** : Next.js 16 (App Router) · NestJS 11 · PostgreSQL 16 · MongoDB · Stripe · Ollama · Tailwind v4 · TypeScript · Turborepo

---

## Sommaire

- [Aperçu](#aperçu)
- [Prérequis](#prérequis)
- [Démarrage rapide](#démarrage-rapide)
- [Structure du monorepo](#structure-du-monorepo)
- [Scripts](#scripts)
- [Comptes & cartes de démo](#comptes--cartes-de-démo)
- [Documentation](#documentation)
- [Stack technique](#stack-technique)

---

## Aperçu

| Domaine | Livré |
|---|---|
| **Front public** | Accueil, catalogue (catégories + fiche produit), recherche facettée, panier (invité + connecté), checkout Stripe, compte (login/signup/profil/adresses/commandes/factures PDF), contact, chatbot, pages légales |
| **i18n** | Français · Anglais · Arabe (RTL natif) — switch via cookie `locale` |
| **SEO** | metadata, OpenGraph, sitemap.xml, robots.txt, images optimisées Next/Image |
| **Backoffice** | Dashboard, CRUD produits/catégories/contenu (carrousel, texte homepage), gestion commandes, utilisateurs, inbox messages contact |
| **API** | REST NestJS clean architecture (domain / application / infrastructure), JWT, RBAC `customer`/`admin` |
| **Paiement** | Stripe PaymentIntent + SetupIntent (cartes enregistrées) |
| **Chatbot** | Ollama self-hosted (`llama3.2:3b`) en docker |
| **Emails** | Vérification compte, reset password (Ethereal en dev, SMTP/Gmail en prod) |
| **DB** | PostgreSQL (TypeORM) — Mongo prêt pour médias (à brancher) |

---

## Prérequis

- **Node.js** ≥ 20
- **npm** ≥ 10 (workspaces)
- **Docker** + **Docker Compose v2**

---

## Démarrage rapide

```bash
# 1. Cloner et installer
git clone <repo-url> aso && cd aso
npm install

# 2. Copier les variables d'environnement
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# 3. Lancer les services (Postgres, Ollama)
npm run docker:up

# 4. Migrer + seeder la base
cd apps/api && npm run db:migrate && npm run seed && cd ../..

# 5. Lancer le dev (front + API en parallèle via Turborepo)
npm run dev
```

Une fois prêt :
- **Web** → http://localhost:3000
- **API** → http://localhost:3001/api
- **pgAdmin** → http://localhost:5050 (`admin@local.test` / `admin`)

> Pour lancer **toute la stack en production via Docker Compose** (web + api + db) :
> ```bash
> docker compose up -d --build
> ```

Détails complets dans [`docs/INSTALLATION.md`](./docs/INSTALLATION.md).

---

## Structure du monorepo

```
ASO/
├── apps/
│   ├── api/                # NestJS 11 — clean architecture
│   │   ├── src/
│   │   │   ├── domain/         # Entités, repositories (interfaces)
│   │   │   ├── application/    # Use-cases
│   │   │   ├── infrastructure/ # Controllers, persistence, services
│   │   │   ├── db/             # data-source, seed
│   │   │   └── migrations/     # TypeORM
│   │   └── test/               # E2E Supertest
│   └── web/                # Next.js 16 (App Router)
│       └── src/
│           ├── app/            # Routes : (account), (shop), (misc), backoffice
│           ├── components/     # UI par domaine
│           ├── context/        # Auth, Cart, Locale
│           └── lib/            # Client API typé
├── packages/
│   ├── config/             # Constantes partagées
│   ├── types/              # Types TS API ↔ Web
│   └── ui/                 # Composants UI partagés (à étoffer)
├── docs/                   # Documentation technique
├── docker-compose.yml
└── turbo.json
```

Voir [`docs/CODE_STRUCTURE.md`](./docs/CODE_STRUCTURE.md) pour le détail.

---

## Scripts

### Racine
| Commande | Effet |
|---|---|
| `npm run dev` | Lance front + API en parallèle (Turborepo) |
| `npm run build` | Build de tous les workspaces |
| `npm run lint` | Lint global |
| `npm run docker:up` | Démarre Postgres + Ollama |
| `npm run docker:down` | Arrête les services |

### API (`apps/api`)
| Commande | Effet |
|---|---|
| `npm run start:dev` | API en watch mode (port 3001) |
| `npm run db:migrate` | Joue les migrations TypeORM |
| `npm run db:revert` | Revert la dernière migration |
| `npm run seed` | Insère admin + catégories + produits + contenu de démo |
| `npm test` | Tests unitaires Jest |
| `npm run test:e2e` | Tests E2E Supertest |
| `npm run test:cov` | Couverture |

### Web (`apps/web`)
| Commande | Effet |
|---|---|
| `npm run dev` | Next dev server (port 3000) |
| `npm run build` | Build de production |
| `npm run start` | Serveur Next en production |
| `npm run lint` | ESLint (max-warnings=0) |

---

## Comptes & cartes de démo

Après `npm run seed` :

| Compte | Email | Mot de passe | Rôle |
|---|---|---|---|
| Admin | `admin@althea.local` | `admin123` | `admin` (accès `/backoffice`) |

**Cartes de test Stripe** (mode test, voir [`CARDNUMBERTESTSTRIPE.md`](./CARDNUMBERTESTSTRIPE.md)) :
- Succès : `4242 4242 4242 4242`
- 3DS requis : `4000 0027 6000 3184`
- Refus : `4000 0000 0000 9995`

CVC, ZIP et date d'expiration : valeurs futures arbitraires.

---

## Documentation

Toute la documentation technique est dans [`docs/`](./docs) :

| Document | Contenu |
|---|---|
| [`docs/README.md`](./docs/README.md) | Index général de la documentation |
| [`docs/INSTALLATION.md`](./docs/INSTALLATION.md) | Installation, variables d'env, déploiement local & prod |
| [`docs/API.md`](./docs/API.md) | Tous les endpoints REST (méthodes, params, réponses) |
| [`docs/CODE_STRUCTURE.md`](./docs/CODE_STRUCTURE.md) | Architecture du code et choix technologiques |
| [`docs/TESTING.md`](./docs/TESTING.md) | Stratégie de tests unitaires / intégration / E2E |
| [`docs/DCT.md`](./docs/DCT.md) | Document de Conception Technique (diagrammes, sécurité, RGPD, scalabilité) |
| [`docs/DELIVERABLES.md`](./docs/DELIVERABLES.md) | Suivi des sprints et livrables |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Note d'architecture initiale |

---

## Stack technique

### Front
- **Next.js 16** (App Router, Server Components)
- **React 19** · **TypeScript** · **Tailwind CSS v4**
- **@stripe/react-stripe-js** pour le paiement
- i18n maison (cookie `locale`) avec support RTL

### Back
- **NestJS 11** (clean architecture)
- **TypeORM** (Postgres) · **Mongoose** (Mongo, schema `Media` prêt)
- **Passport JWT** · **bcryptjs** · **class-validator**
- **Helmet** · **@nestjs/throttler** · `ValidationPipe` global
- **pdfkit** (factures) · **nodemailer** · **stripe**

### Infrastructure
- **Docker Compose** : Postgres 16, pgAdmin, Ollama (`llama3.2:3b`), API, Web
- **Turborepo** pour le pipeline de build/dev/lint

---

## Licence

MIT — Projet d'étude 2025-2026.
