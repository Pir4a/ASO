# Tickets — Backlog basé sur le diagnostic CDC

> Source : `docs/CDC-DIAGNOSTIC.md` (audit du 2026-04-25, branche `prod` commit `eb89031`).
> Convention de priorité : **P0** bloquant CDC · **P1** explicitement demandé au CDC · **P2** amélioration / mise en conformité fine · **P3** nice-to-have.

## Sommaire

- [P0 — Bloquants CDC](#p0--bloquants-cdc)
- [P1 — Explicitement requis par le CDC](#p1--explicitement-requis-par-le-cdc)
- [P2 — Mise en conformité fine](#p2--mise-en-conformité-fine)
- [P3 — Améliorations / cohérence](#p3--améliorations--cohérence)
- [Tableau de suivi](#tableau-de-suivi)

---

## P0 — Bloquants CDC

### #1 — Réinitialisation de mot de passe (flow réel)
**CDC :** §XII (Mot de passe oublié) + §XIII (renforcement sécurité MDP).
**État :** UI `/forgot-password` est un placeholder (`setSubmitted(true)` sans appel API). Endpoint `POST /users/:id/reset-password` retourne juste un message texte sans envoyer d'e-mail.

**À faire :**
- Backend : `POST /auth/forgot-password { email }` → génère token (32 bytes hex), `expiresAt` 24 h, persiste sur l'utilisateur, envoie e-mail via `EmailGateway.sendPasswordResetEmail(email, token)`.
- Backend : `POST /auth/reset-password { token, newPassword }` → vérifie token + expiry, hash bcrypt, invalide le token, retourne `{ success: true }`.
- Frontend : `/forgot-password` doit faire un vrai `fetch('/auth/forgot-password')`.
- Frontend : nouvelle page `/reset-password?token=...` avec formulaire double saisie + critères de force.
- Sécurité : réponse identique côté API que l'e-mail existe ou non (anti-énumération).

**DoD :** parcours complet testé en dev (Ethereal), e-mail reçu, token expire bien à 24 h, MDP changé, ancien refusé à la connexion.

**Fichiers :** `apps/api/src/infrastructure/services/auth.service.ts`, `apps/api/src/infrastructure/controllers/auth.controller.ts`, `apps/api/src/domain/gateways/email.gateway.ts`, `apps/web/src/app/(account)/forgot-password/page.tsx`, nouvelle route `apps/web/src/app/(account)/reset-password/page.tsx`.
 

*** DONE ***
---

### #2 — Entité Facture + génération automatique au paiement validé
**CDC :** §X.7 + §XVI.12 (n° facture auto, PDF, modification, renvoi e-mail).
**État :** PDF généré à la volée par `pdf.service.ts` mais aucune entité `Invoice` persistée, aucun numéro de facture (`facture-{orderId}.pdf` seul).

**À faire :**
- Migration TypeORM : table `invoices` (id UUID, number `INV-YYYYMMDD-XXXX` séquentiel, orderId, userId, totalHt, totalTva, totalTtc, currency, status `paid|cancelled`, issuedAt, pdfUrl?).
- Hook : à `confirmOrderPayment` réussi → créer la facture, stocker le PDF (FS local en dev, S3-compatible / Mongo GridFS en prod).
- Endpoint admin : `GET /admin/invoices` (liste paginée + filtres), `GET /admin/invoices/:id`, `GET /admin/invoices/:id/pdf`, `POST /admin/invoices/:id/email` (renvoi).
- Endpoint admin : `PATCH /admin/invoices/:id` pour modification (champs autorisés à définir).

**DoD :** une commande payée crée une ligne `invoices` avec un numéro lisible ; le BO liste / télécharge / renvoie / modifie ; la facture client (`/orders/:id`) lit ce numéro.

**Fichiers :** nouvelle migration, `apps/api/src/domain/entities/invoice.entity.ts`, `apps/api/src/infrastructure/persistence/typeorm/entities/invoice.entity.ts`, `apps/api/src/application/use-cases/orders/confirm-order-payment.use-case.ts`, `apps/api/src/infrastructure/services/pdf.service.ts`, BO.


*** DONE ***
---

### #3 — Avoirs (credit notes) + génération auto à suppression de facture
**CDC :** §X.6 + §XVI.13.
**État :** aucune entité, aucun flux. `grep -rn 'avoir' src/` retourne 0 résultat applicatif.

**À faire :**
- Migration : table `credit_notes` (id, number `AVO-YYYYMMDD-XXXX`, invoiceId FK, userId, amountTtc négatif, reason `cancellation|refund|error`, issuedAt, pdfUrl?).
- Endpoint : `DELETE /admin/invoices/:id` → soft-cancel + crée le credit note miroir.
- Endpoint : `GET /admin/credit-notes` (liste, filtres), `GET /admin/credit-notes/:id/pdf`, `POST /admin/credit-notes/:id/email`.
- BO : section "Factures & Avoirs" avec deux tableaux + actions.
- PDF : variante credit note via `pdf.service.ts`.

**DoD :** suppression d'une facture en BO génère automatiquement un avoir lié, listé, téléchargeable, renvoyable.

---

### #4 — Checkout invité réellement fonctionnel
**CDC :** §X.1 (continuer en invité, créer compte plus tard).
**État :** UI propose "Continuer en invité" mais `POST /checkout` est protégé par `JwtAuthGuard` (`apps/api/src/infrastructure/controllers/checkout.controller.ts:7`) → 401 silencieux pour invités.

**À faire :**
- Remplacer `JwtAuthGuard` par `OptionalJwtAuthGuard` sur `POST /checkout` et `POST /checkout/:orderId/confirm`.
- Étendre `CreateOrderUseCase` pour accepter un payload invité : `{ email, address, items[] }` ou `{ guestCartId, address, email }`.
- À la confirmation : si invité, créer un `User` `isVerified=false` + envoyer e-mail "Créez votre mot de passe pour suivre votre commande" (token).
- E-mail de confirmation de commande envoyé dans tous les cas (cf. ticket #5).

**DoD :** un visiteur non connecté peut payer et reçoit son n° de commande et un lien d'inscription post-achat.

---

### #5 — E-mail de confirmation de commande
**CDC :** §X.4 (« l'utilisateur recevra un e-mail de confirmation »).
**État :** confirmation visuelle UI OK, mais `EmailGateway` n'expose pas `sendOrderConfirmation` ; rien n'est envoyé.

**À faire :**
- Ajouter `sendOrderConfirmation(email, order, invoiceNumber?, pdfBuffer?)` à `EmailGateway` + implémentation Nodemailer.
- Template HTML : récap items + adresse + total TTC + lien `orders/:id` + n° facture (cf. #2).
- Hook dans `confirmOrderPayment` après succès.
- Localisation : utiliser la locale de l'utilisateur (cookie `locale` ou champ User).

**DoD :** payer une commande déclenche un e-mail reçu en < 30 s avec PDF facture en pièce jointe.

---

### #6 — Validation par e-mail lors d'un changement d'e-mail
**CDC :** §XIII (« Après la modification de l'e-mail, un e-mail de confirmation sera envoyé à la nouvelle adresse pour valider ce changement »).
**État :** `PATCH /profile/me` change l'email immédiatement (`profile.controller.ts:90-100`).

**À faire :**
- Ne plus muter `user.email` directement ; stocker dans un champ `pendingEmail` + `pendingEmailToken` + `pendingEmailExpiresAt` (24 h).
- Envoyer un e-mail à la nouvelle adresse avec lien de validation `GET /auth/confirm-email-change?token=...`.
- À validation → swap `email` ↔ `pendingEmail`, vider les pending.
- UI profil : afficher un avertissement « En attente de validation : <newemail> » avec bouton "renvoyer".

**DoD :** changer son e-mail ne se prend en compte qu'après clic sur le lien reçu à la nouvelle adresse.


*** DONE ***
---

### #7 — MFA / 2FA pour les administrateurs
**CDC :** §XVI.9 (« authentification forte sera nécessaire »).
**État :** absent.

**À faire :**
- Lib : `otplib` (TOTP) + qrcode.
- Backend : `POST /auth/mfa/setup` (génère secret + QR), `POST /auth/mfa/verify` (active), `POST /auth/mfa/challenge` (étape login).
- Adapter le flux login : si user.mfaEnabled, retour `{ mfaRequired: true, challengeToken }` ; le client poste le code → access_token.
- BO accessible uniquement si MFA activée (force la mise en place au premier login admin).
- UI : section sécurité du profil pour activer / désactiver / afficher codes de récupération.

**DoD :** un admin se connecte en 2 étapes ; impossible d'atteindre `/backoffice` sans MFA si rôle admin.

---

### #8 — Escalade chatbot vers humain + persistance BO
**CDC :** §XV (« Si le chatbot ne peut pas répondre… il proposera de transférer la demande »).
**État :** widget Ollama répond, mais aucune mécanique d'escalade ni persistance.

**À faire :**
- Migration : table `chat_sessions` + `chat_messages`.
- Persister chaque tour utilisateur ↔ assistant.
- Bouton "Parler à un humain" dans le widget → marque la session `escalated` + crée une entrée prioritaire dans la queue messages BO.
- BO : section "Chat" listant sessions (statut, dernière activité, escalated?), permettant de répondre par e-mail.
- Capture `email` / `sujet` au début de la conversation chatbot (formulaire mini avant ouverture).

**DoD :** un visiteur qui clique "Parler à un humain" génère un ticket visible en BO et reçoit une notification UI ; l'admin peut répondre et l'historique est conservé.

---

## P1 — Explicitement requis par le CDC

### #9 — Liste **factures + avoirs** dans le backoffice
**CDC :** §XVI.13.
**État :** aucune section.
**À faire :** Section BO « Facturation » avec deux tableaux (factures / avoirs), colonnes CDC, actions PDF + envoi e-mail.
**Dépend de :** #2 et #3.

---

### #10 — Page **détail commande BO** complète
**CDC :** §XVI.11 (numéro `ALT-`, mode paiement, statut paiement, date paiement, historique avec auteur).
**État :** détail partiel ; ID UUID brut, `statusHistory` sans auteur, pas de date paiement.

**À faire :**
- Affecter un `orderNumber` lisible (`ALT-YYYYMMDD-XXXX`) à la création (migration + génération).
- `statusHistory` : ajouter `byUserId` + `byEmail` + persister à chaque `updateStatus`.
- Exposer `paidAt` et `paymentBrand` / `paymentLast4` dans le détail BO.
- BO : afficher historique enrichi + paiement complet + filtre mode paiement / statut paiement.

---

### #11 — Tableau **produits BO** au standard CDC
**CDC :** §XVI.4–5.
**État :** colonnes & filtres incomplets.

**À faire :**
- Ajouter colonnes : Description (tronquée), Prix HT, Prix TTC calculé, Date de création, Statut publié/brouillon.
- Migrer le modèle Product : champ `published: boolean` (défaut true).
- Filtres dropdown : catégorie, disponibilité (en stock / faible / rupture), statut publié/brouillon, plage prix.
- Tri par chaque colonne (asc/desc).
- Pagination 10 / 25 / 50.
- Recherche globale sur la table.
- Actions groupées : supprimer (avec confirmation), modifier statut, modifier catégorie, export CSV.
- Icônes Voir / Éditer / Supprimer + page d'édition complète d'un produit existant (formulaire identique à la création).

---

### #12 — Tableau **utilisateurs BO** au standard CDC
**CDC :** §XVI.10.
**État :** seulement email + statut + last login.

**À faire :**
- Ajouter colonnes : Nom complet, Date d'inscription, Nombre de commandes, **CA total généré**, Liste des adresses (popover).
- Tri par chaque colonne, recherche par nom et email.
- Action "Envoyer un mail" fonctionnelle (formulaire sujet + corps + envoi via SMTP, log en base).
- Action "Réinitialiser mot de passe" envoie un vrai e-mail (ré-utiliser le flux du #1).
- Suppression : dialog de confirmation **avec mention RGPD explicite** ("Cette action est irréversible. Conformément au RGPD…").

---

### #13 — Drag & drop carrousel + catégories
**CDC :** §V (carrousel) + §XVI.8 (catégories) + §XVI (« Gestion du carrousel… Réorganisation par glisser-déposer »).
**État :** réordonnancement par flèches up/down (ou bouton).

**À faire :**
- Lib : `@dnd-kit/core` + `@dnd-kit/sortable`.
- BO : refondre `ContentManager` (carrousel) et table catégories pour le DnD ; à la fin du drag, `PATCH /content/reorder/list` ou `PATCH /categories/reorder/list`.

---

### #14 — Upload d'images en BO (Mongo GridFS branché)
**CDC :** §XVII (« 1 base de données NoSQL pour le stockage des images ») + §XVI.4 (upload multiple drag & drop).
**État :** Mongo en dépendance mais pas branché ; les URLs d'image sont saisies textuellement.

**À faire :**
- Brancher `MongooseModule.forRootAsync` dans `app.module.ts`.
- Service `MediaService` (upload multipart → Mongo GridFS, retourne URL signée `/media/:id`).
- Endpoint `POST /admin/media` (multipart, max 5 Mo, image/* uniquement) + `GET /media/:id` (stream).
- BO : remplacer les `<input type="url">` par un `<input type="file">` avec drag & drop pour : carrousel, image catégorie, miniature produit, galerie produit.

---

### #15 — Histogramme multi-couches paniers moyens (BO)
**CDC :** §XVI.6.b — « Total des ventes par catégories en fonction des paniers moyens sur les 7 derniers jours / 5 dernières semaines ».
**État :** absent.

**À faire :**
- Endpoint `GET /admin/dashboard/avg-cart` avec paramètre `period=7d|5w` retournant `[{ date, byCategory: { catId: avgCart } }]`.
- Composant `MultiLayerBarChart` dans `DashboardCharts.tsx` (stacked ou groupé).
- Switch de période (7j / 5sem) en haut du graphique.

---

### #16 — Camembert ventes par catégorie en CA (BO)
**CDC :** §XVI.2.
**État :** seul un `categoryDist` par **count produits** existe ; le tab "CA" est `disabled`.

**À faire :**
- Backend : `GET /admin/dashboard/sales-by-category?period=7d|5w` → `[{ categoryId, name, revenue, percentage }]`.
- Activer l'onglet "CA" dans le dashboard avec affichage € au survol.

---

### #17 — Bouton « Nouvelle commande » BO
**CDC :** §XVI.3.
**État :** bouton absent.

**À faire :**
- Modale BO : sélection client (autocomplete) → ajout produits → adresse → mode paiement (manuel / lien Stripe) → création commande `pending` ou `paid`.
- Use-case `CreateAdminOrderUseCase`.

---

### #18 — Page « À propos de Althea Systems »
**CDC :** §XVII (menu burger connecté/non connecté inclut « À propos »).
**État :** route absente.

**À faire :** créer `apps/web/src/app/(misc)/about/page.tsx` (statique, contenu fourni par l'équipe), traduit fr/en/ar/he, lien dans les menus.

---

### #19 — Pagination uniforme sur toutes les listes produits
**CDC :** §XVII.
**État :** présente sur `/categories/[slug]` et `/search`, partielle sur `/products`.

**À faire :** réutiliser `CategoryPagination` (ou la renommer en `PaginationControls`) sur la page `/products` et toute liste BO. Sélecteur taille (10/25/50).

---

## P2 — Mise en conformité fine

### #20 — Calcul TVA panier basé sur `vatRate` produit
**CDC :** §IX (« montant total inclut toutes les taxes applicables »).
**Bug :** `apps/web/src/lib/api.ts:367` calcule la TVA à 20 % en dur, ignorant `vatRate` par produit.

**À faire :** côté API, exposer `subtotalHt`, `vat` (somme `Σ qty × priceHt × vatRate/100`), `total` dans la réponse `/cart`. Côté UI, supprimer le calcul JS.

---

### #21 — Politique de force du mot de passe
**CDC :** §XI (« critères de sécurité régis par la CNIL et le RGPD »).
**État :** seul `length >= 8`.

**À faire :** Validation côté API + côté UI : 12 caractères min, au moins 1 majuscule, 1 chiffre, 1 spécial. Indicateur visuel de force (zxcvbn). Appliqué à `/signup`, `/reset-password`, `/profile` change password.

---

### #22 — `statusHistory` avec utilisateur auteur
**CDC :** §XVI.11 (« Historique des changements de statut (avec date et utilisateur) »).
**État :** date OK, auteur absent.

**À faire :** `OrderStatusEvent` ajoute `byUserId: string`, `byEmail: string`. Renseigner depuis le `req.user.sub` dans `AdminController.updateOrderStatus`. Afficher dans le BO.

---

### #23 — Token de vérification d'inscription **expirable**
**CDC :** §XI (« lien… valide pendant un temps limité (par exemple, 24 heures) »).
**État :** à vérifier dans `verify-email.use-case.ts` ; pas de champ `expiresAt` visible sur l'utilisateur.

**À faire :** ajouter `verificationTokenExpiresAt` ; rejeter les tokens expirés ; bouton "renvoyer le lien" sur la page de connexion en cas d'erreur "non vérifié".

---

### #24 — Statut paiement coloré + colonne mode paiement BO
**CDC :** §XVI.11.
**À faire :** colonnes additionnelles "Mode paiement" (Stripe / autre) et "Statut paiement" (validé/en attente/échoué/remboursé) dans la liste commandes BO + filtres associés. Icônes color-coded selon CDC.

---

### #25 — Statut produit publié/brouillon
**CDC :** §XVI.4.
**À faire :** champ `published` sur Product (migration + entité). Côté front public : ne lister que `published=true`. BO : action toggle + colonne + filtre.

---

### #26 — Export CSV/Excel sélection BO
**CDC :** §XVI.5.
**À faire :** lib `papaparse` ou export server-side `GET /admin/products/export?ids=...`. Boutons d'action groupée.

---

### #27 — URL personnalisée (slug SEO) explicite côté formulaire produit
**CDC :** §XVI.7.
**État :** champ `slug` existe mais auto-généré sans label "SEO".
**À faire :** champ "Slug SEO" séparé, validation `[a-z0-9-]+`, prévisualisation `https://althea.fr/products/<slug>`.

---

### #28 — Renouveler une commande
**CDC :** §XIII (« option pour renouveler un achat précédemment effectué »).
**À faire :** bouton "Renouveler cette commande" sur `/orders/:id` qui re-poste les items dans le panier puis redirige vers `/cart`.

---

### #29 — Détail catégorie BO (drill-down)
**CDC :** §XVI.8 (« Page de consultation avec vue sur les produits associés avec possibilité d'édition »).
**À faire :** route BO `/backoffice?section=categories&id=<id>` (ou nouvelle page dédiée) listant les produits de la catégorie + édition inline du nom/desc/image/slug.

---

### #30 — Tests automatisés (cible CDC §XVIII.4)
**CDC :** « Jest, Mocha ou similaires pour tester les différents aspects du code ».
**État :** un seul `app.controller.spec.ts`.

**À faire :**
- API : couverture min 60 % sur use-cases critiques (`auth`, `cart`, `checkout`, `orders`, `payment`, `products/search`).
- Web : Playwright e2e sur 5 parcours (signup→verify→login, browse→add to cart, checkout invité, checkout connecté, BO admin CRUD produit).
- CI : workflow GitHub Actions `lint` + `test` + `build` sur PR.

---

## P3 — Améliorations / cohérence

### #31 — Swagger / OpenAPI live
**CDC :** §XVIII.3.b (« Un outil comme Swagger ou Postman pourra être utilisé »).
**À faire :** `@nestjs/swagger` + décorateurs sur DTO + `/api/docs` exposé en dev.

---

### #32 — Rate limiting + CSRF
**Sécurité standard absente.**
**À faire :** `ThrottlerModule` (60 req/min/IP par défaut, 5 req/min sur `/auth/*`). Réflexion CSRF (cookie samesite=strict suffit pour JWT en header, mais cookies fonctionnels comme `locale` méritent un audit).

---

### #33 — Wording badge "Stock Faible"
**CDC §IV :** badge orange « ⚠ Stock Faible ».
**État :** "Stock limité — derniers exemplaires".
**À faire :** unifier le wording sur "Stock Faible" pour matcher la charte exactement.

---

### #34 — Maquettage / prototype front + BO
**CDC :** §XVIII.7.
**À faire :** captures Figma exportées dans `docs/maquettes/` + lien Figma viewer si disponible.

---

### #35 — Rapports de progression par sprint
**CDC :** §XVIII.6.
**À faire :** dossier `docs/sprints/` avec un fichier par sprint listant tickets traités, démos, blockers, prochain sprint.

---

### #36 — Stub `users.controller.ts` à nettoyer
**Tech debt.**
**État :** `POST /users/:id/reset-password` et `POST /users/:id/send-email` retournent du faux succès.
**À faire :** brancher les flux réels (cf. #1 et #12) ou supprimer si redondants avec les nouveaux endpoints.

---

### #37 — Refresh token / rotation JWT
**Sécurité.**
**État :** access_token longue durée (7 j si rememberMe), pas de refresh token.
**À faire :** access_token 15 min + refresh token 30 j en cookie httpOnly ; endpoint `/auth/refresh`.

---

### #38 — Logs structurés + corrélation
**Observabilité.**
**À faire :** `nestjs-pino`, request-id middleware, redaction PII (email/cardLast4/passwordHash).

---

### #39 — Backoffice section "Paramètres" réelle
**État :** `Settings` affiche compte/rôle/build statiques.
**À faire :** champs réellement éditables : taux TVA par défaut, devise, délai de livraison annoncé, e-mail support, paramétrage Stripe live/test.

---

## Tableau de suivi

| # | Titre | Priorité | Effort estimé | CDC |
|---|---|---|---|---|
| 1 | Reset MDP réel | P0 | M | §XII |
| 2 | Entité Facture + auto-gen | P0 | L | §X.7, §XVI.12 |
| 3 | Avoirs (credit notes) | P0 | L | §X.6, §XVI.13 |
| 4 | Checkout invité fonctionnel | P0 | M | §X.1 |
| 5 | E-mail confirmation commande | P0 | S | §X.4 |
| 6 | Validation e-mail au changement | P0 | M | §XIII |
| 7 | MFA admin | P0 | L | §XVI.9 |
| 8 | Chatbot escalade + persistance | P0 | L | §XV |
| 9 | Liste factures+avoirs BO | P1 | M | §XVI.13 |
| 10 | Détail commande BO complet | P1 | M | §XVI.11 |
| 11 | Tableau produits BO standard | P1 | L | §XVI.4-5 |
| 12 | Tableau utilisateurs BO standard | P1 | M | §XVI.10 |
| 13 | Drag & drop carrousel/catégories | P1 | M | §V, §XVI.8 |
| 14 | Upload images Mongo GridFS | P1 | L | §XVII, §XVI.4 |
| 15 | Histogramme paniers moyens | P1 | S | §XVI.6 |
| 16 | Camembert ventes/catégorie en CA | P1 | S | §XVI.2 |
| 17 | Bouton "Nouvelle commande" BO | P1 | M | §XVI.3 |
| 18 | Page À propos | P1 | XS | §XVII |
| 19 | Pagination uniforme | P1 | S | §XVII |
| 20 | TVA panier dynamique | P2 | XS | §IX |
| 21 | Politique force MDP | P2 | S | §XI |
| 22 | statusHistory avec auteur | P2 | XS | §XVI.11 |
| 23 | Token verify expirable | P2 | XS | §XI |
| 24 | Statut paiement coloré BO | P2 | S | §XVI.11 |
| 25 | Statut publié/brouillon produit | P2 | S | §XVI.4 |
| 26 | Export CSV BO | P2 | S | §XVI.5 |
| 27 | Slug SEO explicite | P2 | XS | §XVI.7 |
| 28 | Renouveler commande | P2 | XS | §XIII |
| 29 | Détail catégorie BO | P2 | S | §XVI.8 |
| 30 | Tests automatisés | P2 | L | §XVIII.4 |
| 31 | Swagger live | P3 | S | §XVIII.3 |
| 32 | Rate limit + CSRF | P3 | S | sécurité |
| 33 | Wording "Stock Faible" | P3 | XS | §IV |
| 34 | Maquettes Figma | P3 | M | §XVIII.7 |
| 35 | Rapports sprint | P3 | XS | §XVIII.6 |
| 36 | Nettoyer stubs users.controller | P3 | XS | tech debt |
| 37 | Refresh token JWT | P3 | M | sécurité |
| 38 | Logs structurés | P3 | S | observabilité |
| 39 | BO settings éditables | P3 | M | §XVIII |

**Légende effort :** XS ≈ < 2 h · S ≈ 0,5 j · M ≈ 1-2 j · L ≈ 3-5 j.

---

## Suggestion d'enchaînement (3 sprints)

**Sprint 1 — sécurité & finalisation paiement (P0)**
- #1, #5, #6, #20, #21, #22, #23 → reset MDP, e-mail commande, changement e-mail, TVA, force MDP.

**Sprint 2 — facturation & checkout invité (P0)**
- #2, #3, #4, #9, #10, #24, #28 → flow invoices/credit-notes, invité, BO commande.

**Sprint 3 — backoffice complet & UX (P1)**
- #11, #12, #13, #14, #25, #26, #27, #29, #19 → tableaux BO standard, DnD, GridFS, exports.

**Sprint 4 — sécurité avancée + chat + analytics (P0/P1)**a
- #7, #8, #15, #16, #17, #18, #30 → MFA, chatbot, dashboards, tests.

**Sprint 5 — qualité & observabilité (P2/P3)**
- #31, #32, #33, #34, #35, #36, #37, #38, #39.
