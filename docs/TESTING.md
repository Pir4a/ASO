# Tests — Althea Systems

## 1. État actuel

| Type de test | Outillage | Status |
|---|---|---|
| Unitaires API | **Jest** + `ts-jest` | ✅ 20 suites · 83 tests verts (lib + use-cases auth, users, products, cart, contact, invoices, credit-notes). |
| Fonctionnels / smoke E2E API | **Supertest** + Jest | ✅ `apps/api/test/app.e2e-spec.ts` (3 tests : `/api`, `/api/health`, 404). |
| Unitaires Web | — | TODO : aucun framework branché côté `apps/web` (Vitest + RTL recommandé). |
| E2E Web (parcours utilisateur) | — | TODO : Playwright recommandé. |
| Tests fonctionnels manuels | Doc (§7 ci-dessous) | ⚠️ Checklist à exécuter par sprint. |

### Inventaire des specs (CDC §XVIII.3.d)

Tous lancés en parallèle par `npm test` dans `apps/api/`. Chaque spec mocke ses dépendances (repositories, email gateway) — pas de DB requise.

**Lib (purs)**
- `apps/api/src/lib/password-policy.spec.ts` — 9 tests (CDC §XI / CNIL : ≥12 car., majuscule, chiffre, symbole, plafond 128 ; constantes exportées).

**Auth (CDC §XI, §XII, §XIII)**
- `apps/api/src/application/use-cases/auth/verify-email.use-case.spec.ts` — 3 tests (token invalide / expiré / succès).
- `apps/api/src/application/use-cases/auth/request-password-reset.use-case.spec.ts` — 3 tests (anti-enumeration, token 32 octets + TTL 24h, persistance malgré échec SMTP).
- `apps/api/src/application/use-cases/auth/reset-password.use-case.spec.ts` — 4 tests (token vide, inconnu, expiré, succès bcrypt + nettoyage).
- `apps/api/src/application/use-cases/auth/resend-verification-email.use-case.spec.ts` — 4 tests (email vide, inconnu, déjà vérifié, rotation + envoi).
- `apps/api/src/application/use-cases/auth/confirm-email-change.use-case.spec.ts` — 6 tests (token vide / inconnu / expiré / collision email / succès / réutilisation idempotente).

**Users (CDC §XIII, §XVI.10)**
- `apps/api/src/application/use-cases/users/create-user.use-case.spec.ts` — 4 tests (persistance, expiry 24h, sans token, `termsAcceptedAt` CNIL).
- `apps/api/src/application/use-cases/users/request-email-change.use-case.spec.ts` — 5 tests (email mal formé, user introuvable, même email actuel, collision, succès).
- `apps/api/src/application/use-cases/users/delete-user.use-case.spec.ts` — 2 tests (RGPD droit à l'effacement, propagation d'erreur).

**Products (CDC §VII, §VIII, §XVI)**
- `apps/api/src/application/use-cases/products/create-product.use-case.spec.ts` — 4 tests (slug SEO custom, slug auto, catégorie inexistante, collision slug).
- `apps/api/src/application/use-cases/products/find-product-by-slug.use-case.spec.ts` — 3 tests (succès, absent, masquage des brouillons côté storefront).
- `apps/api/src/application/use-cases/products/subscribe-product-stock-notify.use-case.spec.ts` — 6 tests (produit absent, produit en stock rejeté, email requis, doublon, succès + email, best-effort SMTP).

**Cart (CDC §IX)**
- `apps/api/src/application/use-cases/cart/add-to-cart.use-case.spec.ts` — 5 tests (produit absent, création panier, merge quantité, dépassement stock, dépassement après merge).
- `apps/api/src/application/use-cases/cart/update-cart-item.use-case.spec.ts` — 5 tests (panier absent, ligne absente, suppression si quantité ≤ 0, dépassement stock, mise à jour + rafraîchissement prix).
- `apps/api/src/application/use-cases/cart/remove-from-cart.use-case.spec.ts` — 3 tests (panier absent, ligne absente, suppression et persistance des autres lignes).

**Contact (CDC §XV)**
- `apps/api/src/application/use-cases/contact/create-contact-message.use-case.spec.ts` — 2 tests (normalisation trim + lowercase, retour de l'id ORM).
- `apps/api/src/application/use-cases/contact/mark-contact-message-read.use-case.spec.ts` — 3 tests (introuvable, flip false→true, idempotence sur déjà lu).

**Invoices + Credit notes (CDC §X.6, §XIV)**
- `apps/api/src/application/use-cases/invoices/update-invoice.use-case.spec.ts` — 4 tests (introuvable, statut non autorisé, mise à jour des totaux + currency uppercase, transition `paid`/`cancelled`).
- `apps/api/src/application/use-cases/credit-notes/cancel-invoice.use-case.spec.ts` — 8 tests (facture introuvable, idempotence si AVO existant, annulation + commande + AVO miroir, raison par défaut, échec de l'annulation de commande best-effort, formats `formatCreditNoteNumber` + `creditNotePrefix`).

**Smoke E2E API**
- `apps/api/test/app.e2e-spec.ts` — 3 tests (`GET /api` → hello, `GET /api/health` → `{status:"ok",date}`, route inconnue → 404). Boot trimmé (HealthController + AppController) → ne dépend pas de Postgres/Mongo.

---

## 2. Stratégie de tests cible

### Pyramide
```
                    ▲
                    │   E2E Web (Playwright)        — quelques parcours critiques
                    │   E2E API (Supertest)         — endpoints majeurs auth/cart/checkout
                    │
                    │   Intégration (use-cases + repo TypeORM in-memory ou DB de test)
                    │
                    │   Unitaires (use-cases purs, services, helpers)
                    ▼
```

- **70%** unitaires (rapides, isolés, mock des repositories).
- **20%** intégration (use-case + repo réel, parfois DB SQLite/Postgres testcontainers).
- **10%** E2E (parcours utilisateur complet).

---

## 3. Tests unitaires — API (NestJS + Jest)

### 3.1. Lancer les tests
```bash
cd apps/api
npm test              # tous les *.spec.ts
npm run test:watch    # mode watch
npm run test:cov      # avec couverture (rapport dans ../coverage)
npm run test:debug    # debug avec inspecteur Node
```

Configuration : `apps/api/package.json` → bloc `jest`.
Convention : un fichier `*.spec.ts` à côté de chaque `*.ts` testé.

### 3.2. Pattern recommandé pour un use-case
```ts
// apps/api/src/application/use-cases/products/get-products.use-case.spec.ts
import { Test } from '@nestjs/testing';
import { GetProductsUseCase } from './get-products.use-case';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../domain/repositories/product.repository.interface';

describe('GetProductsUseCase', () => {
  const repoMock = { findAll: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('renvoie la liste des produits', async () => {
    repoMock.findAll.mockResolvedValue([{ id: '1', name: 'Test' }]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetProductsUseCase,
        { provide: PRODUCT_REPOSITORY_TOKEN, useValue: repoMock },
      ],
    }).compile();

    const useCase = moduleRef.get(GetProductsUseCase);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(repoMock.findAll).toHaveBeenCalledTimes(1);
  });
});
```

### 3.3. Pattern recommandé pour un controller
- Mocker tous les use-cases injectés.
- Vérifier surtout : validation DTO, mapping de paramètres, codes HTTP.

### 3.4. Couverture cible
- **80%** sur les use-cases (`application/use-cases/`).
- **70%** sur les controllers (`infrastructure/controllers/`).
- **60%** sur l'ensemble.

---

## 4. Tests d'intégration — API

Tests qui exécutent un use-case avec un vrai repository TypeORM, contre une base éphémère.

### Stratégies
1. **SQLite in-memory** : simple, rapide. Limite : certaines features Postgres (JSONB, full-text) ne sont pas couvertes.
2. **Testcontainers Postgres** (recommandé) : un Postgres jetable par run.
   ```bash
   npm install --save-dev @testcontainers/postgresql
   ```
3. **Base de test dédiée** : `DATABASE_URL=postgres://.../althea_test`, reset entre chaque test (`TRUNCATE … RESTART IDENTITY CASCADE`).

> **TODO** : choisir la stratégie et fournir un `setup-integration.ts` global.

---

## 5. Tests E2E — API (Supertest)

Squelette présent : `apps/api/test/app.e2e-spec.ts`.

### Lancer
```bash
cd apps/api
npm run test:e2e
```

### Pattern recommandé
```ts
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('POST /api/auth/login → 200 avec credentials valides', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@althea.local', password: 'AltheaDemo2026!' })
      .expect(200)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
      });
  });
});
```

### Parcours E2E API à couvrir en priorité
- [ ] `register` → `verify` → `login`.
- [ ] Recherche produits + pagination.
- [ ] Ajout panier (invité + connecté) → merge après login.
- [ ] Checkout : création commande + confirmation paiement (mock Stripe).
- [ ] Liste commandes + téléchargement PDF facture.
- [ ] Backoffice : création produit, mise à jour statut commande.
- [ ] Throttling et CORS (vérifier les rejets attendus).

---

## 6. Tests Front-End — Next.js (TODO)

> **TODO** : aucun test n'est actuellement configuré dans `apps/web`.

### Stack recommandée
| Type | Outil |
|---|---|
| Unitaire (composants) | **Vitest** ou **Jest** + `@testing-library/react` |
| Hooks / utils | Vitest |
| E2E (parcours navigateur) | **Playwright** |

### Setup Playwright (à mettre en place)
```bash
cd apps/web
npm install --save-dev @playwright/test
npx playwright install
```
Créer `apps/web/e2e/` avec :
- `homepage.spec.ts` — chargement, hero, catégories visibles.
- `product-search.spec.ts` — recherche + filtres + pagination.
- `cart.spec.ts` — ajout, modification, suppression.
- `checkout.spec.ts` — flow Stripe en mode test.
- `auth.spec.ts` — signup, login, profile, logout.
- `i18n.spec.ts` — switch fr/en/ar + RTL en arabe.
- `responsive.spec.ts` — viewports mobile/tablet/desktop.

---

## 7. Tests fonctionnels — Checklist manuelle

Pour chaque release, exécuter au minimum :

### Public (non connecté)
- [ ] Home charge < 2s, hero visible.
- [ ] Liste catégories, fiche catégorie, fiche produit.
- [ ] Recherche : `q=`, filtres prix, in-stock, tri.
- [ ] Ajout panier en tant qu'invité (header `x-guest-cart-id` posé).
- [ ] i18n : passer FR → EN → AR (RTL).
- [ ] `/sitemap.xml` et `/robots.txt` répondent.

### Compte client
- [ ] Inscription + email de vérification reçu (Ethereal en dev).
- [ ] Login + JWT en cookie/localStorage.
- [ ] Edition profil + changement mot de passe.
- [ ] Ajout/édition/suppression adresse.
- [ ] Merge panier invité après login.
- [ ] Checkout complet avec Stripe test card `4242 4242 4242 4242`.
- [ ] Téléchargement facture PDF.
- [ ] Liste commandes filtrable par année/statut.

### Backoffice (admin)
- [ ] Login `admin@althea.local` / `AltheaDemo2026!`.
- [ ] Dashboard stats charge.
- [ ] CRUD catégories (création, modification, désactivation, reorder).
- [ ] CRUD produits + recherche admin.
- [ ] Liste commandes + changement de statut.
- [ ] Liste utilisateurs + désactivation/réactivation.
- [ ] Édition contenu homepage (texte + carrousel max 3 slides).
- [ ] Inbox messages contact.

### Sécurité
- [ ] Endpoint admin → 403 si non admin.
- [ ] Endpoint auth → 401 sans token.
- [ ] CORS depuis origine non listée → bloqué.
- [ ] Rate limit (TODO une fois activé) : 100 req/min.
- [ ] Mot de passe inscription / changement ne respectant pas la politique (12+ car., majuscule, chiffre, symbole) → rejeté.

---

## 8. Intégration continue (TODO)

> **TODO** : aucun pipeline CI n'est défini. Recommandation :

### `.github/workflows/ci.yml` (exemple à créer)
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: althea_test }
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test --workspace api
      - run: npm run test:e2e --workspace api
        env: { DATABASE_URL: postgres://postgres:postgres@localhost:5432/althea_test }
```

### Quality gates suggérés
- Build doit passer.
- Lint zéro warning (`--max-warnings=0` est déjà appliqué côté web).
- Coverage globale ≥ 60% (à activer une fois les tests écrits).
- Pas de `console.log` résiduels dans le code applicatif.

---

## 9. Tests de sécurité

| Catégorie | Outil suggéré | Status |
|---|---|---|
| Dépendances vulnérables | `npm audit`, `pnpm audit`, Snyk, Dependabot | **TODO** |
| Static Application Security Testing (SAST) | `eslint-plugin-security`, SonarQube | **TODO** |
| Dynamic (DAST) | OWASP ZAP automatisé en CI | **TODO** |
| Secret scanning | `gitleaks` en pre-commit | **TODO** |

---

## 10. Tests de performance (bonus)

- **Front** : Lighthouse CI sur la home + fiche produit (perf ≥ 80, a11y ≥ 90, SEO ≥ 95).
- **API** : `autocannon` ou `k6` sur `/api/products` et `/api/products/search`.
- **DB** : `EXPLAIN ANALYZE` sur les requêtes de recherche pour valider les index.
