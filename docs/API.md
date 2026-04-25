# Documentation API — Althea Systems

Tous les endpoints sont préfixés par `/api` (cf. `apps/api/src/main.ts` → `app.setGlobalPrefix('api')`).
Base URL en dev : `http://localhost:3001/api`

## Conventions générales

- **Authentification** : JWT en header `Authorization: Bearer <token>`. Le token est obtenu via `POST /api/auth/login`.
- **Format** : JSON en entrée et en sortie. Validation par `class-validator` + `ValidationPipe` (whitelist + forbidNonWhitelisted).
- **Rôles** : `customer` (par défaut) ou `admin`. Les routes BO exigent `@Roles('admin')`.
- **Codes HTTP** :
  - `200` succès lecture, `201` création.
  - `400` validation / payload invalide, `401` non authentifié, `403` rôle insuffisant, `404` introuvable.
  - `500` erreur serveur.
- **Panier invité** : header `x-guest-cart-id: <uuid>` pour les utilisateurs non connectés (cf. `cart.controller.ts`).

> **TODO** : Aucun outil interactif (Swagger / Postman) n'est encore branché. Recommandation : intégrer `@nestjs/swagger` (décorateurs `@ApiTags`, `@ApiOperation`, etc.) pour générer une UI à `/api/docs`. Cf. section [Outillage Swagger](#outillage-swagger-todo).

---

## Health

### `GET /api/health`
Ping. Public.

**Réponse 200**
```json
{ "status": "ok" }
```

---

## Authentification — `/api/auth`

### `POST /api/auth/register`
Crée un compte client.

**Politique mot de passe** : 12 caractères minimum, une majuscule, un chiffre et un symbole (ex. `! ? @ # *`). Plafond technique 128 caractères côté serveur.

**Body** (`RegisterDto`)
```json
{
  "email": "user@example.com",
  "password": "AltheaDemo2026!",
  "firstName": "Alice",
  "lastName": "Martin"
}
```
**Réponse 201** : utilisateur créé + (selon implémentation) email de vérification envoyé.

### `POST /api/auth/login`
Authentifie un utilisateur.

**Body** (`LoginDto`)
```json
{ "email": "admin@althea.local", "password": "AltheaDemo2026!" }
```
**Réponse 200**
```json
{
  "accessToken": "<jwt>",
  "user": { "id": "uuid", "email": "...", "role": "admin" }
}
```

### `GET /api/auth/verify?token=<emailToken>`
Vérifie l'email après inscription.

### `PATCH /api/auth/user/:id/role` *(admin)*
Change le rôle d'un utilisateur.

**Body**
```json
{ "role": "admin" }
```

---

## Profil utilisateur — `/api/profile` (auth requise)

### `GET /api/profile/me`
Retourne l'utilisateur courant.

```json
{ "id": "uuid", "email": "...", "firstName": "...", "lastName": "...", "role": "customer", "isVerified": true }
```

### `PATCH /api/profile/me`
Met à jour `firstName`, `lastName`, `email`. Validation : email unique, formats stricts.

### `PATCH /api/profile/me/password`
**Body**
```json
{ "currentPassword": "...", "newPassword": "..." }
```
Renvoie `{ "success": true }`. `newPassword` doit respecter la même politique de force que à l'inscription.

### Adresses
- `GET /api/profile/addresses` — liste des adresses de l'utilisateur.
- `POST /api/profile/addresses` — crée une adresse.
- `PUT /api/profile/addresses/:id` — met à jour.
- `DELETE /api/profile/addresses/:id` — supprime.

**Schéma adresse**
```json
{
  "firstName": "string?",
  "lastName": "string?",
  "street": "string",
  "address2": "string?",
  "city": "string",
  "region": "string?",
  "postalCode": "string",
  "country": "string",
  "phone": "string?"
}
```

---

## Catégories — `/api/categories`

### `GET /api/categories?includeInactive=true|false`
Liste publique. Par défaut filtre les catégories désactivées.

### `POST /api/categories` *(admin)*
**Body** (`CreateCategoryDto`)
```json
{ "name": "Imagerie", "slug": "imagerie", "description": "…", "imageUrl": "…", "order": 0 }
```

### `PATCH /api/categories/:id` *(admin)*
Met à jour les champs (mêmes propriétés, toutes optionnelles).

### `DELETE /api/categories/:id` *(admin)*
### `PATCH /api/categories/reorder/list` *(admin)*
**Body** : `{ "items": [{ "id": "uuid", "order": 0 }, …] }`

### `POST /api/categories/bulk` *(admin)*
**Body** : `{ "ids": ["uuid", …], "action": "activate" | "deactivate" | "delete" }`

---

## Produits — `/api/products`

### `GET /api/products`
Sans paramètre : liste complète (rétrocompat BO/homepage).
Avec `categorySlug | categoryId | page | limit` : pagination + filtre.

**Query** : `categorySlug`, `categoryId`, `page` (≥1), `limit` (≤48, défaut 12).

**Réponse paginée**
```json
{
  "data": [ { "id": "...", "slug": "...", "name": "...", "priceCents": 12000, ... } ],
  "meta": { "total": 42, "page": 1, "pageSize": 12, "totalPages": 4 }
}
```

### `GET /api/products/search`
Recherche facettée (titre, description, specs JSON, SKU; prix; catégorie; in-stock).

**Query** : `q`, `categorySlug`, `categoryId`, `minPrice`, `maxPrice`, `inStockOnly` (`1|true|yes|on`), `sort` (`relevance|price_asc|price_desc|novelty_desc|novelty_asc|availability_asc|availability_desc`), `page`, `limit`.

**Réponse**
```json
{
  "data": [ { ...product } ],
  "meta": { "total": 12, "page": 1, "pageSize": 12, "totalPages": 1, "tookMs": 23, "relevanceRefined": true },
  "facets": { ... }
}
```

### `GET /api/products/featured?limit=8`
Top produits mis en avant (limit ≤ 20).

### `GET /api/products/:slug`
Fiche produit par slug.

### `GET /api/products/:slug/related?limit=6`
Produits similaires (limit ≤ 12).

### `POST /api/products` *(admin)* — `CreateProductDto`
### `PATCH /api/products/:id` *(admin)* — `UpdateProductDto` (vatRate ∈ {0, 5.5, 10, 20})
### `DELETE /api/products/:id` *(admin)*

---

## Contenu (homepage / carrousel) — `/api/content`

### `GET /api/content`
Tous les blocs de contenu (texte, carrousel, etc.) ordonnés.

### `POST /api/content` *(admin)*
**Body** (`CreateContentBlockDto`)
```json
{ "type": "carousel | homepage_text | …", "payload": { /* libre */ }, "order": 0 }
```
- Max **3** slides carrousel (`MAX_CAROUSEL_SLIDES`).
- Max **1** bloc `homepage_text`.

### `PATCH /api/content/:id` *(admin)*
### `PATCH /api/content/reorder/list` *(admin)* — `{ items: [{ id, order }] }`
### `DELETE /api/content/:id` *(admin)*

---

## Panier — `/api/cart`

> Auth optionnelle. Si l'utilisateur n'est pas connecté, fournir `x-guest-cart-id: <uuid>`.

### `GET /api/cart`
Renvoie le panier courant ou `{ id: null, items: [], status: 'active' }`.

### `POST /api/cart/items`
**Body** : `{ "productId": "uuid", "quantity": 1 }`

### `PUT /api/cart/items/:productId`
**Body** : `{ "quantity": 3 }`

### `DELETE /api/cart/items/:productId`

### `POST /api/cart/merge` *(auth requise)*
Fusionne un panier invité avec le panier utilisateur après login.
**Body** : `{ "guestCartId": "uuid" }`

### `POST /api/cart/promo`
Applique un code promo.
**Body** : `{ "code": "WELCOME10", "orderTotal": 12000 }`

---

## Checkout — `/api/checkout` (auth requise)

### `POST /api/checkout`
Crée une commande à partir du panier courant.
**Body** : `{ "addressId": "uuid" }`

### `POST /api/checkout/:orderId/confirm`
Confirme le paiement après succès Stripe.
**Body** : `{ "paymentIntentId": "pi_…" }` *(optionnel)*

---

## Paiement — `/api/payment`

### `POST /api/payment/intent`
Crée un PaymentIntent Stripe pour une commande. Auth optionnelle (invité possible).
**Body** : `{ "orderId": "uuid", "userId": "uuid?" }`
**Réponse** : `{ "clientSecret": "pi_..._secret_..." }`

### `POST /api/payment/intent/setup` *(auth requise)*
Crée un SetupIntent (ajout de carte enregistrée).

### `GET /api/payment/methods` *(auth requise)*
Liste les cartes enregistrées de l'utilisateur.

### `DELETE /api/payment/methods/:id` *(auth requise)*

### `PATCH /api/payment/methods/:id/default` *(auth requise)*
Définit la carte par défaut.

### `POST /api/payment/webhook`
Webhook Stripe.
> **TODO** : la vérification de signature `stripe-signature` est ébauchée mais non finalisée. À durcir avant la prod.

---

## Commandes — `/api/orders` (auth requise)

### `GET /api/orders?year=&status=&search=`
Liste les commandes de l'utilisateur courant, filtrables.

### `GET /api/orders/:id`
Détails d'une commande (uniquement si possédée par l'utilisateur).

### `GET /api/orders/:id/invoice`
Télécharge la **facture PDF** (généré via `pdfkit`).
**Réponse** : `application/pdf` (StreamableFile).

---

## Backoffice — `/api/admin` *(admin)*

### `GET /api/admin/dashboard`
Stats d'ensemble (commandes, CA, etc.).

### `GET /api/admin/orders?page=&limit=&status=`
Liste de toutes les commandes (paginées, ≤100/page).

### `GET /api/admin/orders/:id`
Détails complets (incluant `statusHistory`, items, adresses).

### `PATCH /api/admin/orders/:id/status`
**Body** : `{ "status": "pending|processing|shipped|delivered|cancelled" }`

---

## Utilisateurs (admin) — `/api/users`

### `GET /api/users?q=&status=&sort=`
Liste filtrée (`active|inactive|pending`) et triée (`email|created|lastLogin`).

### `PATCH /api/users/:id/status`
**Body** : `{ "status": "active|inactive" }`

### `DELETE /api/users/:id`
### `POST /api/users/:id/reset-password`
### `POST /api/users/:id/send-email` — `{ "subject": "…", "body": "…" }`
### `PATCH /api/users/:id/role` — `{ "role": "customer|admin" }`

---

## Contact — `/api/contact`

### `POST /api/contact`
Soumission du formulaire contact (public).
**Body** (`CreateContactMessageDto`) — `name`, `email`, `subject`, `message`, etc.

### `GET /api/contact/admin` *(admin)*
Liste tous les messages reçus.

---

## Chatbot — `/api/chat`

### `POST /api/chat`
Relais vers Ollama (LLM `llama3.2:3b`).
**Body** : `{ "message": "…", "history": [{ "role": "user|assistant", "content": "…" }] }`
**Réponse** : `{ "reply": "…" }`

> **TODO** : La gestion des prompts système / mémoire conversationnelle est minimale. Voir `apps/api/src/infrastructure/services/chat.service.ts` pour étendre.

---

## Sécurité globale

| Mesure | Implémentation |
|---|---|
| Rate-limit | Configurable via `@nestjs/throttler` (à activer globalement — **TODO** : pas encore wired dans `AppModule`). |
| CORS | `apps/api/src/main.ts` — origin whitelist. |
| Helmet | Headers de sécurité activés globalement. |
| Validation | `ValidationPipe` global (whitelist + forbidNonWhitelisted + transform). |
| JWT | `JwtAuthGuard` + `RolesGuard` + décorateur `@Roles(...)`. |
| Bcrypt | Hashing mot de passe (10 salt rounds). |

---

## Outillage Swagger (TODO)

Pour générer une UI interactive type Swagger :

```bash
cd apps/api
npm install --save @nestjs/swagger
```

Puis dans `main.ts` :
```ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Althea Systems API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

Et décorer chaque controller/DTO avec `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty`.

> Une **collection Postman** (`docs/althea-api.postman_collection.json`) reste à exporter. **TODO**.
