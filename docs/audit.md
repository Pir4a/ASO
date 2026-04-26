# Audit de conformité — Cahier des Charges Althea Systems 2025-2026

**Date** : 2026-04-26
**Branche auditée** : `prod` (HEAD `3bc46a9`)
**Référence** : `docs/Cahier-des-charges-Projet-Etude-2025-2026.pdf`
**Méthode** : Lecture intégrale du CDC (29 pages) + revue exhaustive du code (`apps/web`, `apps/api`, `docs/`).

## Légende

| Statut | Signification |
|---|---|
| ✅ | Implémenté conforme au CDC |
| 🟡 | Partiellement implémenté ou divergent (détails dans la colonne Notes) |
| ❌ | Non implémenté |
| ⚠️ | Implémenté mais comporte un risque (placeholder, sécurité, etc.) |

---

## Synthèse exécutive

| Domaine | Implémenté | Partiel | Manquant | Total |
|---|---:|---:|---:|---:|
| V — Page d'accueil | 5 | 0 | 0 | 5 |
| VI — Page catalogue/catégorie | 5 | 0 | 0 | 5 |
| VII — Page produit | 4 | 0 | 0 | 4 |
| VIII — Page de recherche | 3 | 2 | 0 | 5 |
| IX — Panier | 6 | 0 | 0 | 6 |
| X — Checkout | 6 | 1 | 0 | 7 |
| XI — Inscription | 6 | 2 | 1 | 9 |
| XII — Connexion | 8 | 0 | 0 | 8 |
| XIII — Modification compte | 8 | 1 | 0 | 9 |
| XIV — Historique commandes | 6 | 0 | 0 | 6 |
| XV — Contact + Chatbot | 8 | 1 | 0 | 9 |
| XVI — Backoffice | 16 | 7 | 0 | 23 |
| XVII — En complément | 4 | 4 | 0 | 8 |
| XVIII — Livrables | 7 | 4 | 0 | 11 |
| **TOTAL** | **92** | **22** | **1** | **115** |

**Taux de conformité globale** : **80 %** intégralement conformes, **19 %** partiels (généralement à 80-95 % du besoin), **1 %** absents.

### Top 5 des écarts critiques

1. ⚠️ **Webhook Stripe non sécurisé** — `apps/api/src/infrastructure/controllers/payment.controller.ts:80-89` est un placeholder qui ignore la signature `stripe-signature`. Bloquant pour la prod.
2. ⚠️ **Rate limiting non activé** — `@nestjs/throttler` est dans `package.json` mais aucun `ThrottlerModule` n'est wiré dans `AppModule`. Aucune protection brute-force.
3. ❌ **Pas d'auto-login après vérification d'email** (XI.7) — l'utilisateur est renvoyé vers `/login` au lieu d'être connecté automatiquement.
4. 🟡 **Force du mot de passe (XI.2)** — seul `MinLength(8)` est appliqué ; aucune règle CNIL (majuscule, chiffre, spécial).
5. 🟡 **Tests automatisés** — un seul fichier `.spec.ts` source (`app.controller.spec.ts`), aucun test front, pas de CI (`.github/` absent).

---

## V. Page d'accueil

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| V.1 | Carrousel 3 sections (image + texte + lien promo) | ✅ | `apps/web/src/components/home/Carousel.tsx:1-265`, `apps/web/src/app/page.tsx:18-21` | Carrousel intégré sur l'accueil |
| V.2 | Carrousel modifiable BO (images, texte, ordre, ajout/suppression) | ✅ | `apps/web/src/components/backoffice/ContentManager.tsx:99-150`, `apps/api/src/infrastructure/controllers/content/content.controller.ts:26-87` | Drag & drop reorder, max 3 slides enforced en backend |
| V.3 | Texte fixe sous le carrousel, modifiable BO | ✅ | `apps/web/src/app/page.tsx:23-66`, `ContentManager.tsx:62-82`, `content.controller.ts:53-59` | Bloc unique `homepage_text` |
| V.4 | Grille catégories visuelles (image + nom), ordre BO | ✅ | `apps/web/src/components/home/CategoryGrid.tsx:5-47`, `apps/api/src/domain/entities/category.entity.ts` (`order`) | |
| V.5 | « Top Produits du moment » (image + nom, sélection BO) | ✅ | `apps/web/src/components/home/TopProducts.tsx:1-66`, flag `featured` côté entité Product | Le CDC §V précise « image et nom » seulement — conforme. |
| V.6 | Footer (CGU, mentions, contact, réseaux sociaux) | ✅ | `apps/web/src/components/layout/Footer.tsx:27-44`, `SocialLinks.tsx:15-21` | Visible desktop, dans menu burger sur mobile |

---

## VI. Page d'accès au catalogue de produits

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| VI.1 | Image principale + nom catégorie en surimpression | ✅ | `apps/web/src/components/category/CategoryHero.tsx:27-83` | |
| VI.2 | Description sous l'image | ✅ | `CategoryHero.tsx:85-120` | |
| VI.3 | Liste verticale mobile / grille desktop | ✅ | `apps/web/src/components/category/CategoryCatalog.tsx:301-368` (grid), `370-442` (list) | |
| VI.4 | Nom + prix + mention « En rupture de stock » + grisé si indispo | ✅ | `CategoryCatalog.tsx:311-361` | Opacité réduite + badge rupture |
| VI.5 | Tri : priorité BO → autres → ruptures en dernier | ✅ | `CategoryCatalog.tsx:100-121`, `apps/web/src/data/api.ts:150-152` (`sortProductsForCategoryListing`) | |

---

## VII. Page produit

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| VII.1 | Carrousel d'illustrations | ✅ | `apps/web/src/components/product/ProductImageGallery.tsx:17-130` | Clavier + swipe + thumbnails |
| VII.2 | Nom (gras), description, caractéristiques, prix, disponibilité | ✅ | `apps/web/src/components/product/ProductDetailClient.tsx:87-138`, `ProductSpecs.tsx:5-37` | |
| VII.3 | 6 produits similaires (même catégorie, dispo prioritaires, aléatoire) | ✅ | `apps/web/src/components/product/RelatedProducts.tsx:59-121`, `apps/web/src/app/(shop)/products/[slug]/page.tsx:14` | |
| VII.4 | CTA « Ajouter au panier » / « Acheter maintenant », désactivé si rupture | ✅ | `ProductDetailClient.tsx:142-213` | Boutons masqués hors stock + bouton désactivé avec libellé de rupture |

---

## VIII. Page de recherche

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| VIII.1 | Facettes : titre, description, **caractéristiques techniques**, prix min/max, catégorie, dispo only | 🟡 | `apps/web/src/app/(shop)/search/page.tsx:113-225` | Facette **caractéristiques techniques absente de l'UI** ; les `specs` sont stockées et indexables côté repo (`product.repository.ts:45`) mais aucun champ filtre exposé |
| VIII.2 | Priorité : exact → 1 char diff → starts-with → contains | ✅ | `apps/api/src/infrastructure/persistence/typeorm/repositories/product.repository.ts:28-55` | Scores 1 000 000 / 850 000 / 720 000 / 680 000 / 420 000 / 400 000 |
| VIII.3 | Tri : prix ↑↓, nouveauté ↑↓, dispo ↑↓ | ✅ | `product.repository.ts:65-106`, `search/page.tsx:94-102, 196-207` | 7 modes de tri |
| VIII.4 | Mise à jour temps réel suite modifs BO | ✅ | `product.repository.ts:248, 307-333` | Pas de cache figé |
| VIII.5 | Performance < 100 ms | 🟡 | `product.repository.ts:282-407` (`tookMs`) | Instrumentation présente mais aucun SLA garanti, pas de cache, fallback Levenshtein limité aux catalogues ≤ 600 items |

---

## IX. Page du panier

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| IX.1 | Liste produits (nom, qté, prix unitaire, total ligne) | ✅ | `apps/web/src/app/(shop)/cart/page.tsx:196-331` | |
| IX.2 | Modifier quantité / supprimer inline | ✅ | `cart/page.tsx:268-327`, `apps/web/src/hooks/useCart.ts:57-65` | Stepper +/- |
| IX.3 | Total temps réel (taxes + promos) | ✅ | `cart/page.tsx:346-410`, `cart.controller.ts:123-154` | TVA par ligne + champ promo |
| IX.4 | Accessible aux invités + rappel connexion | ✅ | `useCart.ts:8-29`, `cart/page.tsx:164-192` | `x-guest-cart-id` localStorage |
| IX.5 | CTA « Passer à la caisse » | ✅ | `cart/page.tsx:424-444` | Désactivé si articles indisponibles |
| IX.6 | Gestion produits indisponibles (badge, retrait/remplacement, blocage checkout) | ✅ | `cart/page.tsx:9-11, 197-266, 413-444` | |

---

## X. Étapes du checkout

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| X.1 | Étape 1 : connexion / inscription / invité | ✅ | `apps/web/src/app/(shop)/checkout/page.tsx:737-987`, `confirm-order-payment.use-case.ts:57-65` | Le compte invité est créé via lien post-paiement (conforme CDC) |
| X.2 | Étape 2 : adresse (9 champs) ou choix d'adresse enregistrée | ✅ | `apps/web/src/components/account/AddressForm.tsx:64-157`, `checkout/page.tsx:362-447` | prénom, nom, adr1, adr2, ville, région, CP, pays, téléphone |
| X.3 | Étape 3 : paiement (carte ou enregistrée) — **Stripe ou PayPal** | 🟡 | `checkout/page.tsx:469-478`, `CheckoutForm.tsx:51`, `PaymentMethodList.tsx` | **Stripe seul** (PaymentElement + cartes sauvegardées). PayPal absent — le CDC propose « comme Stripe ou PayPal » donc l'un suffit |
| X.4 | Étape 4 : confirmation + récap + email | ✅ | `checkout/page.tsx:208-271`, `confirm-order-payment.use-case.ts:142-150` | Email de confirmation envoyé |
| X.5 | Modification d'une facture | ✅ | `apps/api/src/application/use-cases/invoices/update-invoice.use-case.ts:22-39`, `admin/invoices.controller.ts:99-102` | Admin uniquement |
| X.6 | Création d'avoir si suppression de facture | ✅ | `apps/api/src/application/use-cases/credit-notes/cancel-invoice.use-case.ts:55-101` | Format `AVO-YYYYMMDD-XXXX`, idempotent |
| X.7 | Format PDF des factures | ✅ | `apps/api/src/application/use-cases/invoices/get-invoice-pdf.use-case.ts:21-42`, `orders/orders.controller.ts:61-77`, `admin/invoices.controller.ts:82-91` | |

---

## XI. Inscription

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XI.1 | Formulaire (nom complet, email, mot de passe) | ✅ | `apps/web/src/app/(account)/signup/page.tsx:9-14`, `apps/api/src/infrastructure/dto/auth/auth.dto.ts:3-16` | |
| XI.2 | Mot de passe conforme CNIL/RGPD | 🟡 | `auth.dto.ts:8-9` | Seulement `MinLength(8)`. Manque majuscule, minuscule, chiffre, caractère spécial, score d'entropie |
| XI.3 | Validation client + serveur | ✅ | `signup/page.tsx:22-26`, `auth.dto.ts` (class-validator) | |
| XI.4 | Email valide, nom présent, règles password | ✅ | `auth.dto.ts:4-15` | `IsEmail`, `MinLength`, `IsString` |
| XI.5 | Email de confirmation (lien unique) | ✅ | `apps/api/src/infrastructure/services/auth.service.ts:57-68` | Token `randomBytes(32)` |
| XI.6 | Lien valide 24 h | ✅ | `apps/api/src/application/use-cases/users/create-user.use-case.ts:27`, `verify-email.use-case.ts:27-29` | |
| XI.7 | Auto-login après confirmation | ❌ | `apps/web/src/app/(account)/verify/page.tsx:26` | Redirige vers `/login` ; l'utilisateur doit ressaisir ses identifiants |
| XI.8 | Avant confirmation : navigation OK, fonctionnalités gérées bridées | 🟡 | `auth.service.ts:90-92` | Connexion bloquée si `!isVerified` ; aucune restriction explicite des autres fonctionnalités au-delà du JWT guard |
| XI.9 | Données chiffrées en transit (HTTPS) | ✅ | `auth.controller.ts:59` (`secure: NODE_ENV === 'production'`) | À enforcer via reverse-proxy en prod |

---

## XII. Connexion

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XII.1 | Login email + mot de passe | ✅ | `apps/web/src/app/(account)/login/page.tsx:39-63`, `auth.service.ts:82-127` | |
| XII.2 | Connexion réservée aux comptes confirmés | ✅ | `auth.service.ts:90-92` | |
| XII.3 | Erreur identifiants + lien « Mot de passe oublié » | ✅ | `login/page.tsx:192-197`, `auth.service.ts:86-87` | |
| XII.4 | Erreur compte non confirmé | ✅ | `auth.service.ts:91` | Message dédié |
| XII.5 | Redirection page privée → login → page initiale | ✅ | `login/page.tsx:34-36` | `redirect`/`return_to` |
| XII.6 | « Se souvenir de moi » | ✅ | `login/page.tsx:233-248`, `auth.controller.ts:65-67` | maxAge cookie ajusté |
| XII.7 | Gestion expiration session | ✅ | `auth.service.ts:29-30`, `auth.controller.ts:185-202` | Access 15 min + refresh 30 j + endpoint `/auth/refresh` |
| XII.8 | Mot de passe oublié (lien sécurisé 24 h) | ✅ | `forgot-password/page.tsx`, `request-password-reset.use-case.ts:8,30`, `reset-password/page.tsx` | |

---

## XIII. Modification du compte utilisateur

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XIII.1 | Modifier nom complet | ✅ | `apps/web/src/app/(account)/profile/page.tsx:391-403`, `profile.controller.ts:83-94` | |
| XIII.2 | Changer email avec confirmation | ✅ | `request-email-change.use-case.ts`, `confirm-email-change.use-case.ts`, `confirm-email-change/page.tsx` | Token envoyé à la nouvelle adresse |
| XIII.3 | Changer mot de passe (ancien requis) | ✅ | `profile/page.tsx:1221-1265`, `profile.controller.ts:148-149` | `bcrypt.compare(current, hash)` |
| XIII.4 | Historique commandes (en cours, supprimées, terminées) | ✅ | `apps/web/src/app/(account)/orders/page.tsx:98-115`, `get-orders.use-case.ts` | |
| XIII.5 | Renouveler une commande | ✅ | `orders/[id]/page.tsx:112-131` | Bouton « Renouveler la commande » |
| XIII.6 | Carnet d'adresses (CRUD complet) | ✅ | `AddressForm.tsx:61-191`, `profile.controller.ts:158-212`, `address.entity.ts` | 9 champs |
| XIII.7 | Méthodes de paiement (ajouter, supprimer, défaut) | ✅ | `AddPaymentMethod.tsx`, `PaymentMethodList.tsx:69-144` | Last4 affichés uniquement |
| XIII.8 | Sécurité : validation email + ancien mot de passe pour modifs sensibles | 🟡 | `request-email-change.use-case.ts:22-24`, `profile.controller.ts:148-149` | Le changement d'email **ne demande pas** le mot de passe courant — léger écart |
| XIII.9 | Données paiement chiffrées PCI-DSS | ✅ | `PaymentMethodList.tsx:138-139`, `order.entity.ts:40-41` | Stripe tokenization, seulement `paymentBrand` + `paymentLast4` stockés |

---

## XIV. Historique des commandes

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XIV.1 | Groupement par année | ✅ | `apps/web/src/app/(account)/orders/page.tsx:210-222`, `get-orders.use-case.ts:20-39` | |
| XIV.2 | Entrée : nom produit, date, total, statut | ✅ | `orders/page.tsx:227-264` | |
| XIV.3 | Détail (produit, paiement last4, adresse, PDF) | ✅ | `orders/[id]/page.tsx:229-408` | |
| XIV.4 | Filtre année / type produit / actives vs résiliées | ✅ | `orders/page.tsx:68-186`, `orders.controller.ts:28-42` | |
| XIV.5 | Recherche par nom produit ou date | ✅ | `orders/page.tsx:71-141` | |
| XIV.6 | Téléchargement facture PDF | ✅ | `orders/[id]/page.tsx:280-310`, `orders.controller.ts:61-77` | |

---

## XV. Page Outils — Formulaire de contact + Chatbot

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XV.1 | Champs (email obligatoire, sujet, message) | ✅ | `apps/web/src/app/(misc)/contact/page.tsx:394-535` | minLength/maxLength + required |
| XV.2 | Validation + confirmation visuelle | ✅ | `contact/page.tsx:402-425` | Spinner, success, errors |
| XV.3 | Messages dans inbox BO | ✅ | `apps/api/src/infrastructure/controllers/contact/contact.controller.ts:28-33`, `apps/web/src/app/backoffice/page.tsx:332-337` | |
| XV.4 | Bouton « Contact Me » → chatbot | ✅ | `apps/web/src/components/chat/ChatWidget.tsx:164-187` | Floating button global |
| XV.5 | Réponses instantanées (LLM) | ✅ | `contact/page.tsx:220-390`, `apps/api/src/infrastructure/controllers/chat/chat.controller.ts`, Ollama `llama3.2:3b` | |
| XV.6 | Escalade vers humain + notification BO | ✅ | `ChatWidget.tsx:118-139` | Bannière dédiée, email, status `escalated` |
| XV.7 | Capture infos utilisateur (email, sujet) | ✅ | `ChatWidget.tsx:63-89` | Pré-form chat |
| XV.8 | Conversations stockées + accessibles BO | ✅ | `apps/api/src/infrastructure/controllers/admin/chat.controller.ts:49-104`, `apps/web/src/components/backoffice/ChatPanel.tsx` | |
| XV.9 | Lien depuis chatbot vers formulaire | 🟡 | `contact/page.tsx:17-170` | Onglets côte à côte ; pas de lien direct depuis la conversation chat vers le formulaire |

---

## XVI. Backoffice

### Tableau de bord

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVI.1 | KPI cards : CA jour/sem/mois, nb commandes du jour, alertes stock, msgs non traités | 🟡 | `apps/web/src/app/backoffice/page.tsx:1148-1290` | CA + nb commandes + alertes stock présents ; **badge messages contact non traités absent** des KPI |
| XVI.2 | Camembert ventes par catégorie (7 j → 5 sem) | 🟡 | `apps/web/src/components/backoffice/DashboardCharts.tsx:102-135` | Implémenté en **barres horizontales empilées** sur 30 j ; toggle 7 j / 5 sem **présent dans l'API** mais **absent de l'UI** |
| XVI.3 | Actions rapides « Nouvelle commande », « Ajouter produit », « Voir messages » | 🟡 | `backoffice/page.tsx:1592-1607, 2448` | « Ajouter un produit » et « Nouvelle commande » présents ; **« Voir les messages » manquant** comme bouton rapide |

### Gestion des produits

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVI.4 | Tableau produits (12 colonnes : image, nom, desc, cat., HT, TVA, TTC, stock, statut, date, qté) | ✅ | `backoffice/page.tsx:1700-2010`, `ProductForm.tsx:270-277` | Toutes les colonnes présentes, TVA 20/10/5.5/0 |
| XVI.5 | Actions groupées (suppr, statut, catégorie, export) | 🟡 | `backoffice/page.tsx:765-810, 1626` | Suppression, publish, catégorie OK ; **export concerne tout le catalogue, pas la sélection** |
| XVI.6 | Lister / voir / créer / éditer / supprimer (avec confirmation) | ✅ | `backoffice/page.tsx:1700-2050` | Modale ProductForm |
| XVI.7 | Tri colonnes, recherche globale, pagination 25/50/10, export CSV/Excel, icônes voir/éditer/suppr | ✅ | `backoffice/page.tsx:1707-2005`, `/products/admin/export.csv` | |
| XVI.8 | Carrousel BO (3 max, drag-drop upload + reorder, image principale, suppr, lien, **texte formaté riche**) | 🟡 | `ContentManager.tsx:22-250` | 3 max enforced, drag-drop OK ; **éditeur de texte riche absent** (pas de bold/italic/liens/couleurs sous le carrousel) |
| XVI.9 | Histogramme ventes/jour (7 j → 5 sem) + multi-couches paniers moyens par catégorie | 🟡 | `DashboardCharts.tsx:137-157` | Données en backend, **toggle 7 j / 5 sem absent du UI** |
| XVI.10 | URL personnalisée (slug SEO) | ✅ | `ProductForm.tsx:113-242` | Auto-généré, éditable |

### Gestion des catégories

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVI.11 | Liste hiérarchique (image, nom, desc, nb produits, ordre, statut) | 🟡 | `backoffice/page.tsx:2093-2320` | Toutes colonnes présentes, **hiérarchie parent/enfant non explicite** |
| XVI.12 | Actions catégorie (CRUD, drag-drop, activer/désactiver) | ✅ | `backoffice/page.tsx:2150-2320`, `admin.controller.ts:81-110` | |
| XVI.13 | Page de consultation catégorie avec vue produits + édition | 🟡 | `backoffice/page.tsx:2150+` | **Modale uniquement** ; pas de page dédiée affichant les produits associés avec édition |

### Sécurité backoffice

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVI.14 | Accès admin uniquement + authentification forte 2FA | 🟡 | `backoffice/page.tsx:2980` (AuthGuard), `auth.controller.ts:144-181` (MFA), `roles.guard.ts:60-61` | RBAC strict + endpoints MFA TOTP (setup/verify/challenge/disable) ; MFA **optionnelle** côté admin (pas un blocage à l'enrôlement) |

### Gestion des utilisateurs

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVI.15 | Liste utilisateurs (8 colonnes : nom, email, date, statut, nb cdes, CA, dernière conn., adresses) | ✅ | `backoffice/page.tsx:2639-2750`, `users.controller.ts:62-64` | |
| XVI.16 | Actions admin (envoyer mail, reset MdP, désactiver, supprimer + RGPD) | 🟡 | `backoffice/page.tsx:2712-2780` | Reset/désactiver/supprimer + warning RGPD OK ; **« Envoyer un mail » non implémenté en UI** |

### Gestion des commandes

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVI.17 | Liste commandes (N°, date+heure, client, TTC, statut, mode paiement, statut paiement) | ✅ | `backoffice/page.tsx:2374-2575` | |
| XVI.18 | Statuts couleur (en attente, en cours, terminée, annulée) | ✅ | `backoffice/page.tsx:917-930` | 5 badges colorés |
| XVI.19 | Détail commande (N°, date, statut modifiable, historique, paiement, badges) | ✅ | `backoffice/page.tsx:2520-2710` | Historique avec date + utilisateur |

### Factures et avoirs

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVI.20 | Gestion facture (N° auto, PDF, renvoi mail, édition, suppression → avoir) | ✅ | `admin/invoices.controller.ts:60-116`, `InvoicesPanel.tsx:39-250` | |
| XVI.21 | Liste factures (N°, date, client, N° commande cliquable, montant, statut) | ✅ | `InvoicesPanel.tsx:138-250` | |
| XVI.22 | Liste avoirs (N°, facture liée, date, client, montant négatif, motif) | ✅ | `CreditNotesPanel.tsx:42-250` | |
| XVI.23 | Actions avoir (PDF, envoi mail) | ✅ | `CreditNotesPanel.tsx:72-110` | |

---

## XVII. EN COMPLÉMENT

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVII.1 | Pagination (page suivante/précédente, jump page) | 🟡 | `apps/web/src/components/common/PaginationControls.tsx:42-148` | Prev/Next + sélecteur taille OK ; **input « jump to page » absent** |
| XVII.2 | Menu burger connecté (paramètres, commandes, CGU, mentions, contact, à propos, déconnecter) | ✅ | `apps/web/src/components/layout/MobileMenu.tsx:148-224` | « À propos » présent dans la navbar, vérifier la duplication burger |
| XVII.2bis | Menu burger non connecté (se connecter, s'inscrire, CGU, mentions, contact, à propos) | ✅ | `MobileMenu.tsx:183-224` | |
| XVII.3 | Réactif mobile/desktop | ✅ | `Header.tsx`, `MobileMenu.tsx`, breakpoints Tailwind | |
| XVII.4 | i18n multilingue + RTL (arabe/hébreu) + switch dans menu | ✅ | `apps/web/src/lib/i18n.shared.ts:1-10`, `i18n.server.ts`, `app/layout.tsx` (`dir="rtl"`), `LocaleSwitcher` | fr/en/ar/he, `translations.ts` 42 KB |
| XVII.5 | a11y WCAG 2.1 (lecteurs écran, clavier, contrastes) | 🟡 | `SkipLink.tsx`, ARIA labels Header/MobileMenu/Pagination, focus-trap, ESC | **Pas d'audit formel WCAG 2.1 AA** des contrastes |
| XVII.6 | Sécurité (chiffrement, sessions, SQLi/XSS/CSRF, SSL, tests réguliers) | 🟡 | bcryptjs + JWT + Helmet + ValidationPipe + TypeORM paramétré | **CSRF non explicite**, **rate-limiting non wiré**, **HTTPS dépend du reverse-proxy**, **pas de scans automatisés CI** |
| XVII.7 | Stack : 1 frontend + 1 backend + 1 NoSQL (images) + 1 relationnel | 🟡 | `package.json`, `docker-compose.yml`, `apps/web` (Next.js 16) + `apps/api` (NestJS 11) + Postgres 16 + MongoDB | MongoDB **provisionné** mais **pas branché** pour le stockage image (todo connu) |

---

## XVIII. Livrables — GIT, SPA et Documentation Technique

### 1. Repository Git

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVIII.1.1 | Repository GIT site + backoffice | ✅ | Monorepo, branche `prod`, ~166 commits conventionnels | `feat(scope)`, `fix(scope)`, etc. |
| XVIII.1.2 | Suivi de version + commits descriptifs | ✅ | `git log` | Style conventional commits |
| XVIII.1.3 | Code testé sans erreur avant livraison | 🟡 | Lint OK (`max-warnings=0` côté web) | **Tests automatisés quasi-inexistants** : `apps/api/src/app.controller.spec.ts` seul fichier source `.spec.ts` ; aucun test front |

### 2. Code propre et architecturé

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVIII.2.1 | Nomenclature claire | ✅ | Dossiers `domain/application/infrastructure`, components par domaine | |
| XVIII.2.2 | Architecture modulaire | ✅ | Clean architecture NestJS, modules par feature | |
| XVIII.2.3 | Principes SOLID | ✅ | Use-cases SRP, repositories interfaces, DI | |
| XVIII.2.4 | Code documenté | 🟡 | READMEs racine + `apps/api/README.md` + `apps/web/README.md` ; JSDoc ponctuels | Commentaires inline rares sur la logique métier complexe (TVA, scoring relevance) |

### 3. Documentation technique

| # | Exigence | Statut | Évidence | Notes |
|---|---|---|---|---|
| XVIII.3.1 | Guide d'installation | ✅ | `docs/INSTALLATION.md:1-224` | Deps, env, dev, prod |
| XVIII.3.2 | Documentation API (Swagger/Postman) | 🟡 | `docs/API.md`, Swagger `/api/docs` | Swagger présent mais **endpoints peu décorés** (`@ApiTags`, `@ApiOperation` partiels) |
| XVIII.3.3 | Structure du code | ✅ | `docs/CODE_STRUCTURE.md`, `docs/ARCHITECTURE.md` | |
| XVIII.3.4 | Tests (unitaires, intégration, fonctionnels, E2E ; Jest/Mocha) | 🟡 | `docs/TESTING.md:1-280` documenté | **Stratégie écrite mais quasi pas de tests réels** : 1 fichier `.spec.ts` (`app.controller.spec.ts`), aucun front, pas d'E2E Playwright |
| XVIII.3.5 | DCT — Architecture système | ✅ | `docs/DCT.md:1-378` | |
| XVIII.3.6 | DCT — Diagrammes (architecture, flux, communication services) | ✅ | `docs/DCT.md` (diagrammes ASCII) | |
| XVIII.3.7 | DCT — Justification choix techno | ✅ | `docs/DCT.md` | |
| XVIII.3.8 | DCT — Plan de sécurité (Bonus, RGPD) | 🟡 | `docs/DCT.md` section 4 | RGPD partiel, plusieurs items marqués TODO |
| XVIII.3.9 | DCT — Plan maintenance et évolutivité | ✅ | `docs/DCT.md` section scalability | |
| XVIII.3.10 | Suivi évolution livrables (sprints, rapports, code reviews) | 🟡 | `docs/DELIVERABLES.md:1-212` (9 sprints) | **Pas de PRs structurés ni d'issues / Linear / Jira** dédié |
| XVIII.3.11 | Maquettage et prototype des 2 parties | ✅ | Front fonctionnel + backoffice fonctionnel | |

---

## Risques & TODOs prioritaires

### 🔴 Critiques (à traiter avant la mise en prod)

1. **Webhook Stripe placeholder** — `apps/api/src/infrastructure/controllers/payment.controller.ts:80-89` n'effectue **aucune vérification de signature `stripe-signature`**. Tout `POST /payment/webhook` est accepté. Impact : risque d'événements falsifiés (faux paiements).
2. **Rate limiting absent** — `@nestjs/throttler` est dans `package.json` mais aucun `ThrottlerModule.forRoot(...)` dans `AppModule` ; vérifié par `grep -rn "Throttler" apps/api/src/` → **0 résultat**. Impact : aucun rempart brute-force sur `/auth/login`, `/auth/forgot-password`, etc.
3. **Tests** — un seul fichier de test source (`apps/api/src/app.controller.spec.ts`), aucun test front, **aucun pipeline CI** (`/.github/`, `.gitlab-ci.yml` absents). Impact : régressions invisibles, le CDC exige tests unitaires + intégration + fonctionnels.

### 🟡 Importants

4. **Auto-login post vérification email** (XI.7) — UX : remplacer la redirection `/login` par une session établie automatiquement.
5. **Force du mot de passe** (XI.2) — ajouter règles CNIL (uppercase, lowercase, digit, special, ≥ 12 chars recommandé).
6. **Facette « caractéristiques techniques »** (VIII.1) — ajouter UI dans `search/page.tsx`.
7. **Toggle 7 j / 5 sem** dans dashboard BO (XVI.2, XVI.9) — données déjà côté API, exposer en UI.
8. **Éditeur texte riche** sous le carrousel (XVI.8) — ajouter Tiptap / Lexical pour bold/italic/liens/couleurs.
9. **Page détail catégorie BO** (XVI.13) — créer une route dédiée avec liste produits éditable.
10. **Action « envoyer un mail »** depuis la fiche utilisateur BO (XVI.16).
11. **Badge messages contact non traités** dans les KPI (XVI.1).
12. **Quick action « Voir les messages »** (XVI.3).
13. **Audit WCAG 2.1 AA** des contrastes (XVII.5).
14. **MongoDB pour stockage images** (XVII.7) — provisionné mais non branché.
15. **Sécurité du changement d'email** (XIII.8) — exiger le mot de passe courant.

### 🟢 Mineurs

16. **Pagination jump-to-page** (XVII.1) — ajouter input numérique.
17. **Décoration Swagger complète** (XVIII.3.2) — `@ApiTags`, `@ApiOperation`, `@ApiResponse` pour 100 % des endpoints.
18. **Commentaires inline** sur la logique métier complexe (TVA, scoring relevance, génération PDF).
19. **PRs / Issues GitHub** structurés pour le suivi des livrables (XVIII.3.10).

---

## Conclusion

La plateforme couvre **80 % du CDC en intégralité** et **19 % en partiel**, avec une seule exigence formellement absente (XI.7 auto-login). L'architecture est saine (clean architecture NestJS, App Router Next.js 16, monorepo Turborepo), les fonctionnalités principales (catalogue, panier, checkout Stripe, espace compte, backoffice CRUD complet, chatbot Ollama, i18n + RTL) sont opérationnelles.

Les écarts principaux sont concentrés sur :
- **la sécurité opérationnelle** (webhook, rate-limiting, tests automatisés, CI),
- **quelques affordances UI du backoffice** (toggles de période, éditeur riche, quick actions, badge messages),
- **une exigence forte CNIL** (force du mot de passe).

La base livrée est solide ; la mise en production demande de durcir les points 🔴 ci-dessus et de combler les 🟡 selon le calendrier projet.
