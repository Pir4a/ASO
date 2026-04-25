# Guide d'installation — Althea Systems (ASO)

Ce document décrit comment installer, configurer et déployer la plateforme **Althea Systems B2B E-Commerce** dans ses trois cibles :
- Site web (desktop & mobile, responsive Next.js).
- API (NestJS).
- Application mobile native — **TODO : non livrée pour l'instant** (voir [Mobile native (à venir)](#mobile-native-todo)).

---

## 1. Dépendances nécessaires

### Logicielles
| Dépendance | Version | Usage |
|---|---|---|
| Node.js | ≥ 20.x | Front (Next.js 16) + API (NestJS 11) |
| npm | ≥ 10.x | Gestionnaire de paquets (workspaces) |
| Docker | ≥ 24.x | Bases de données + déploiement |
| Docker Compose | v2 | Orchestration locale |
| Git | ≥ 2.40 | Versioning |

### Services tiers (optionnels en dev, requis en prod)
| Service | Usage |
|---|---|
| PostgreSQL 16 | Données transactionnelles (users, products, orders…) |
| MongoDB (TODO) | Médias / GridFS — schema Mongoose présent, brancher quand le module media sera activé |
| Stripe | Paiement (clé test fournie dans `.env.example`) |
| Ollama (`llama3.2:3b`) | Chatbot — auto-pull via docker-compose |
| SMTP (Gmail / Ethereal) | Envoi d'emails (vérification compte, factures) |

### Variables d'environnement (résumé)
Trois fichiers `.env.example` sont fournis :
- `/.env.example` — racine, lu par `docker-compose`.
- `apps/api/.env.example` — configuration de l'API en local hors-Docker.
- `apps/web/.env.example` — configuration du front en local hors-Docker.

Les principales variables :

| Variable | Where | Défaut / Exemple | Description |
|---|---|---|---|
| `DATABASE_URL` | api | `postgres://postgres:postgres@localhost:5432/althea` | Connexion Postgres |
| `MONGODB_URI` | api | `mongodb://mongo:mongo@localhost:27017/althea?authSource=admin` | Mongo (médias — TODO) |
| `JWT_SECRET` | api | `super-secret-key` | À CHANGER en prod |
| `JWT_EXPIRES_IN` | api | `1d` | Durée du token JWT |
| `CORS_ORIGIN` | api | `http://localhost:3000` | Origine autorisée |
| `STRIPE_SECRET_KEY` | api | `sk_test_…` | Clé serveur Stripe |
| `STRIPE_WEBHOOK_SECRET` | api | `whsec_…` | Secret webhook Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | web | `pk_test_…` | Inlinée dans le bundle navigateur |
| `NEXT_PUBLIC_API_URL` | web | `http://localhost:3001/api` | URL publique de l'API |
| `INTERNAL_API_URL` | web (Docker) | `http://api:3001/api` | URL serveur-à-serveur (SSR) |
| `OLLAMA_URL` | api | `http://ollama:11434` | Endpoint LLM |
| `OLLAMA_MODEL` | api | `llama3.2:3b` | Modèle chatbot |
| `SMTP_*` | api | (vide en dev → Ethereal) | Envoi d'emails |
| `FRONTEND_URL` | api | `http://localhost:3000` | Liens dans les emails |

---

## 2. Configuration de l'environnement de développement

### 2.1. Cloner et installer

```bash
git clone <repo-url> aso
cd aso
npm install
```

### 2.2. Copier les fichiers d'environnement

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
# apps/web/.env n'est pas requis : les NEXT_PUBLIC_* sont lus depuis l'env shell
```

### 2.3. Lancer les bases (Docker)

```bash
npm run docker:up
```

Cela démarre :
- `postgres` (port 5432) + `pgadmin` (port 5050).
- `ollama` (port 11435) + auto-pull du modèle `llama3.2:3b`.
- *(MongoDB est commenté pour l'instant — réactiver dans `docker-compose.yml` quand le module médias sera branché. **TODO**)*

### 2.4. Migrer + seed la base

```bash
cd apps/api
npm run db:migrate    # exécute les migrations TypeORM
npm run seed          # crée admin, catégories, produits, contenus de démo
```

> Note : `synchronize: true` est activé en dev (`apps/api/src/db/data-source.ts`), donc les entités sont auto-synchronisées au boot. Pour la prod, **TODO** : passer à `synchronize: false` et ne s'appuyer que sur les migrations.

### 2.5. Démarrer en mode dev (avec hot-reload)

Depuis la racine du monorepo :

```bash
# Tout en parallèle (Turborepo)
npm run dev

# OU app par app
npm run start:dev --workspace api      # API : http://localhost:3001/api
npm run dev --workspace web            # Web : http://localhost:3000
```

### 2.6. Comptes de démo (après `seed`)
- **Admin** : `admin@althea.local` / `AltheaDemo2026!` (rôle `admin`, accès backoffice ; mêmes identifiants seed pour les autres comptes démo).
- **Stripe test cards** : voir `CARDNUMBERTESTSTRIPE.md` à la racine.

---

## 3. Déploiement

### 3.1. Déploiement local complet via Docker Compose

Le `docker-compose.yml` à la racine contient tout (Postgres + Ollama + API + Web) :

```bash
# Build + lancement de la stack complète
docker compose up -d --build

# Logs
docker compose logs -f api
docker compose logs -f web

# Arrêt
docker compose down
```

Une fois prêt :
- Front : http://localhost:3000
- API : http://localhost:3001/api
- pgAdmin : http://localhost:5050 (`admin@local.test` / `admin`)

> Important : `NEXT_PUBLIC_API_URL` est inlinée dans le bundle au build. Si vous modifiez la cible API, rebuild le web : `docker compose up -d --build web`.

### 3.2. Déploiement en production

> **TODO** : aucun pipeline CI/CD ni infrastructure cible (cloud provider, K8s, Vercel…) n'est défini à ce jour. Recommandations ci-dessous.

#### Recommandations de pile de production
| Composant | Option suggérée |
|---|---|
| Front (Next.js) | Vercel, Netlify, ou Docker derrière un reverse proxy (Nginx/Traefik) |
| API (NestJS) | Container (Docker) sur Railway/Render/Fly.io ou ECS/Cloud Run |
| Postgres | Postgres managé (Neon, Supabase, RDS, Cloud SQL) |
| Mongo (médias) | MongoDB Atlas |
| LLM Chatbot | Ollama self-hosted GPU OU bascule vers OpenAI/Claude API (**TODO** : abstraire le service `ChatService`) |
| Secrets | Vault / Doppler / variables d'environnement chiffrées du provider |
| Logs / Métriques | **TODO** — ajouter Sentry + OpenTelemetry |

#### Checklist de mise en prod (à suivre avant tout déploiement réel)
- [ ] Régénérer `JWT_SECRET` (chaîne aléatoire ≥ 32 caractères).
- [ ] Régénérer la clé Stripe en clé live et configurer le webhook.
- [ ] Mettre `synchronize: false` dans `apps/api/src/db/data-source.ts` et compléter les migrations.
- [ ] Restreindre `CORS_ORIGIN` au domaine de production.
- [ ] Activer HTTPS (TLS) côté reverse proxy.
- [ ] Configurer un backup automatique Postgres.
- [ ] Mettre en place le monitoring (uptime, erreurs).
- [ ] Configurer la rotation des logs.
- [ ] Vérifier la conformité RGPD (cookies, consentement, suppression de compte — voir `DCT.md`).

#### Build de production manuel (sans Docker)

```bash
# API
cd apps/api
npm run build
NODE_ENV=production node dist/main

# Front
cd apps/web
npm run build
npm run start         # Next.js serveur intégré (port 3000)
```

---

## 4. Site web — Desktop & Mobile

Le front Next.js est **responsive nativement** (Tailwind v4 + composants adaptatifs). Il n'y a pas de build séparé desktop/mobile : la même URL sert les deux. Une fois le déploiement effectué (cf. §3), le site est accessible :

- Desktop : `https://<domain>`
- Mobile (navigateur) : même URL — le layout s'adapte aux breakpoints (sm, md, lg, xl).

### Vérifications post-déploiement
- [ ] Charger la home, la liste catégories, la fiche produit, le panier, le checkout.
- [ ] Vérifier l'i18n (`/?locale=fr|en|ar`) et le RTL en arabe.
- [ ] Tester `/sitemap.xml` et `/robots.txt`.
- [ ] Tester un paiement Stripe en mode test.
- [ ] Vérifier que les images Unsplash distantes se chargent (config `next.config`).

---

## 5. Application mobile native (TODO)

> **TODO** — Aucune application mobile native (iOS/Android) n'est livrée à ce stade.

Pistes d'implémentation envisagées :
- **React Native (Expo)** : maximum de réutilisation du code TS/React du front.
- **Flutter** : meilleure perf graphique, mais double base de code.

Étapes suggérées :
1. Créer `apps/mobile/` dans le monorepo (Expo).
2. Réutiliser `packages/types` pour les modèles partagés.
3. Authentification via le même endpoint `/auth/login` (JWT).
4. Pousser les builds via EAS Build.
5. Soumission App Store / Play Store.

---

## 6. Dépannage rapide

| Symptôme | Solution |
|---|---|
| API : `ECONNREFUSED postgres:5432` | `npm run docker:up` non exécuté ou le conteneur s'est arrêté. |
| Web : `fetch failed` côté SSR | Vérifier `INTERNAL_API_URL` (doit pointer sur `http://api:3001/api` en Docker, `http://localhost:3001/api` en dev). |
| Stripe : `Invalid API Key` | Régénérer `STRIPE_SECRET_KEY` et reconstruire le conteneur web (la `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` est inlinée). |
| Chatbot ne répond pas | Vérifier que `ollama` est `healthy` (`docker compose ps`) et que `llama3.2:3b` a fini de pull. |
| Emails : aucun envoi visible | En dev, regarder les logs API : un lien Ethereal s'affiche pour prévisualiser. |
