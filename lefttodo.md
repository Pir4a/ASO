# Plan de Développement Détaillé - Althea Systems E-commerce

**Date de création**: 2025-01-27  
**Statut**: En cours de développement  
**Basé sur**: Cahier des Charges Projet Étude 2025-2026

---

## 📋 Table des Matières

1. [Priorité P0 - Blocage Production](#priorité-p0---blocage-production)
2. [Priorité P1 - Fonctionnalités Critiques](#priorité-p1---fonctionnalités-critiques)
3. [Priorité P2 - Améliorations UX/UI](#priorité-p2---améliorations-uxui)
4. [Priorité P3 - Optimisations & Performance](#priorité-p3---optimisations--performance)
5. [Priorité P4 - Sécurité & Conformité](#priorité-p4---sécurité--conformité)
6. [Priorité P5 - Tests & Qualité](#priorité-p5---tests--qualité)

---

## 🔴 Priorité P0 - Blocage Production

### Issue #P0-001: Finalisation du Système de Paiement Stripe
**Statut**: En cours  
**Estimation**: 3 jours  
**Assigné**: Backend Developer

**Description**:
Le système de paiement Stripe est partiellement implémenté mais nécessite des améliorations critiques.

**Tâches**:
- [ ] Implémenter les webhooks Stripe pour gérer les événements de paiement
  - [ ] Créer endpoint `/api/payment/webhooks/stripe`
  - [ ] Gérer `payment_intent.succeeded`
  - [ ] Gérer `payment_intent.payment_failed`
  - [ ] Gérer `charge.refunded`
  - [ ] Implémenter vérification de signature webhook
- [ ] Ajouter gestion d'idempotence pour les paiements
  - [ ] Créer table `payment_intents` avec champ `idempotency_key`
  - [ ] Vérifier les doublons avant création d'intent
- [ ] Implémenter gestion des remboursements
  - [ ] Endpoint `POST /api/payment/refund/:orderId`
  - [ ] Création automatique d'avoir lors d'un remboursement
- [ ] Tester le flux complet de paiement en mode test Stripe
- [ ] Documenter les variables d'environnement nécessaires

**Fichiers à modifier**:
- `apps/api/src/infrastructure/services/payment/stripe.service.ts`
- `apps/api/src/infrastructure/controllers/payment.controller.ts`
- `apps/api/src/infrastructure/persistence/typeorm/entities/order.entity.ts` (ajouter champs paiement)

**Critères d'acceptation**:
- ✅ Un paiement réussi crée automatiquement une commande
- ✅ Les webhooks sont sécurisés et vérifiés
- ✅ Les remboursements fonctionnent et créent des avoirs
- ✅ Pas de doublons de paiements

---

### Issue #P0-002: Génération et Gestion des Factures PDF
**Statut**: À faire  
**Estimation**: 2 jours  
**Assigné**: Backend Developer

**Description**:
Selon le CDC (p.14), les factures doivent être générées en PDF, modifiables, et leur suppression doit créer un avoir automatique.

**Tâches**:
- [ ] Finaliser le service PDF existant (`pdf.service.ts`)
  - [ ] Créer template de facture avec logo Althea
  - [ ] Ajouter toutes les informations légales (TVA, mentions légales)
  - [ ] Générer PDF avec numéro de facture unique
- [ ] Créer endpoint `GET /api/orders/:orderId/invoice` pour télécharger la facture
- [ ] Créer endpoint `PUT /api/orders/:orderId/invoice` pour modifier une facture
- [ ] Créer endpoint `DELETE /api/orders/:orderId/invoice` pour supprimer une facture
  - [ ] Créer automatiquement un avoir (`CreditNote`) lors de la suppression
- [ ] Créer entité `Invoice` et `CreditNote` dans PostgreSQL
  - [ ] Migration TypeORM
  - [ ] Relations avec `Order`
- [ ] Stocker les PDF dans MongoDB GridFS ou système de fichiers
- [ ] Ajouter historique des modifications de facture

**Fichiers à créer/modifier**:
- `apps/api/src/infrastructure/persistence/typeorm/entities/invoice.entity.ts`
- `apps/api/src/infrastructure/persistence/typeorm/entities/credit-note.entity.ts`
- `apps/api/src/infrastructure/services/pdf.service.ts` (améliorer)
- `apps/api/src/application/use-cases/orders/generate-invoice-pdf.use-case.ts` (améliorer)
- `apps/api/src/application/use-cases/orders/modify-invoice.use-case.ts` (nouveau)
- `apps/api/src/application/use-cases/orders/delete-invoice.use-case.ts` (nouveau)

**Critères d'acceptation**:
- ✅ Les factures PDF sont générées avec toutes les informations requises
- ✅ Les factures peuvent être modifiées
- ✅ La suppression d'une facture crée automatiquement un avoir
- ✅ Les PDF sont stockés de manière sécurisée

---

### Issue #P0-003: Email de Confirmation d'Achat
**Statut**: À faire  
**Estimation**: 1 jour  
**Assigné**: Backend Developer

**Description**:
Selon le CDC (p.14), un email de confirmation doit être envoyé après chaque achat réussi.

**Tâches**:
- [ ] Créer template d'email de confirmation d'achat
  - [ ] Inclure récapitulatif de la commande
  - [ ] Inclure numéro de commande
  - [ ] Inclure lien de téléchargement de facture
- [ ] Envoyer email automatiquement après création de commande réussie
- [ ] Gérer les erreurs d'envoi d'email (queue, retry)
- [ ] Tester avec différents fournisseurs d'email (Gmail, Outlook, etc.)

**Fichiers à modifier**:
- `apps/api/src/infrastructure/services/email/nodemailer.service.ts`
- `apps/api/src/application/use-cases/orders/create-order.use-case.ts`
- Créer template: `apps/api/src/infrastructure/services/email/templates/order-confirmation.hbs`

**Critères d'acceptation**:
- ✅ Email envoyé automatiquement après chaque commande
- ✅ Email contient toutes les informations nécessaires
- ✅ Gestion des erreurs d'envoi

---

### Issue #P0-004: Remplacement des Mocks par Persistence Réelle
**Statut**: Partiellement fait  
**Estimation**: 2 jours  
**Assigné**: Backend Developer

**Description**:
Certaines fonctionnalités utilisent encore des mocks. Tout doit être persisté en base de données.

**Tâches**:
- [ ] Vérifier que `OrdersService` n'utilise plus de mocks
- [ ] Vérifier que `CartService` utilise bien la base de données (déjà fait selon todo.md)
- [ ] Implémenter persistence réelle pour les méthodes de paiement sauvegardées
- [ ] Implémenter persistence réelle pour les messages de contact
- [ ] Supprimer tous les fichiers mock restants

**Fichiers à vérifier/modifier**:
- `apps/api/src/infrastructure/services/orders.service.ts` (si existe encore)
- `apps/api/src/infrastructure/services/cart.service.ts`
- `apps/api/src/infrastructure/persistence/typeorm/entities/payment-method.entity.ts` (créer si n'existe pas)
- `apps/api/src/infrastructure/persistence/typeorm/entities/contact-message.entity.ts` (créer)

**Critères d'acceptation**:
- ✅ Aucun mock dans le code de production
- ✅ Toutes les données sont persistées en base

---

## 🟠 Priorité P1 - Fonctionnalités Critiques

### Issue #P1-001: Backoffice Complet - Gestion des Catégories
**Statut**: À faire  
**Estimation**: 3 jours  
**Assigné**: Fullstack Developer

**Description**:
Selon le CDC (p.24), le backoffice doit permettre la gestion complète des catégories.

**Tâches**:
- [ ] Créer page backoffice `/backoffice/categories`
- [ ] Implémenter CRUD complet pour les catégories
  - [ ] Créer catégorie
  - [ ] Modifier catégorie
  - [ ] Supprimer catégorie (soft delete)
  - [ ] Activer/désactiver catégorie
- [ ] Implémenter gestion de l'ordre d'affichage
  - [ ] Drag & drop pour réorganiser
  - [ ] Champ `displayOrder` dans entité Category
- [ ] Implémenter actions en masse (bulk actions)
  - [ ] Activer/désactiver plusieurs catégories
  - [ ] Supprimer plusieurs catégories
- [ ] Ajouter upload d'image pour catégorie
- [ ] Créer endpoints API protégés (admin uniquement)
  - [ ] `POST /api/admin/categories`
  - [ ] `PUT /api/admin/categories/:id`
  - [ ] `DELETE /api/admin/categories/:id`
  - [ ] `PATCH /api/admin/categories/:id/status`
  - [ ] `PATCH /api/admin/categories/reorder`

**Fichiers à créer/modifier**:
- `apps/web/src/app/backoffice/categories/page.tsx`
- `apps/web/src/components/backoffice/CategoryForm.tsx`
- `apps/web/src/components/backoffice/CategoryList.tsx`
- `apps/api/src/infrastructure/controllers/admin/categories.controller.ts`
- `apps/api/src/application/use-cases/categories/create-category.use-case.ts`
- `apps/api/src/application/use-cases/categories/update-category.use-case.ts`
- `apps/api/src/application/use-cases/categories/delete-category.use-case.ts`
- `apps/api/src/infrastructure/persistence/typeorm/entities/category.entity.ts` (ajouter champs)

**Critères d'acceptation**:
- ✅ CRUD complet fonctionnel
- ✅ Drag & drop pour réorganiser
- ✅ Actions en masse fonctionnelles
- ✅ Upload d'images fonctionnel
- ✅ Routes protégées par rôle admin

---

### Issue #P1-002: Backoffice Complet - Gestion des Produits
**Statut**: Partiellement fait  
**Estimation**: 4 jours  
**Assigné**: Fullstack Developer

**Description**:
Le backoffice doit permettre la gestion complète des produits avec toutes les fonctionnalités du CDC.

**Tâches**:
- [ ] Améliorer le formulaire de produit existant (`ProductForm.tsx`)
  - [ ] Ajouter gestion des images multiples (carrousel)
  - [ ] Ajouter gestion des caractéristiques techniques
  - [ ] Ajouter gestion du stock et disponibilité
  - [ ] Ajouter gestion de la priorité d'affichage
- [ ] Créer page liste des produits avec filtres
  - [ ] Filtres par catégorie, statut, disponibilité
  - [ ] Recherche par nom/SKU
  - [ ] Tri par prix, date, priorité
- [ ] Implémenter actions en masse
  - [ ] Modifier prix en masse
  - [ ] Modifier stock en masse
  - [ ] Activer/désactiver plusieurs produits
- [ ] Ajouter gestion des produits similaires
- [ ] Créer endpoints API manquants
  - [ ] `PUT /api/admin/products/:id`
  - [ ] `DELETE /api/admin/products/:id`
  - [ ] `PATCH /api/admin/products/bulk-update`
  - [ ] `POST /api/admin/products/:id/images` (upload images)

**Fichiers à créer/modifier**:
- `apps/web/src/app/backoffice/products/page.tsx`
- `apps/web/src/components/backoffice/ProductForm.tsx` (améliorer)
- `apps/web/src/components/backoffice/ProductList.tsx` (nouveau)
- `apps/api/src/infrastructure/controllers/admin/products.controller.ts`
- `apps/api/src/application/use-cases/products/update-product.use-case.ts`
- `apps/api/src/application/use-cases/products/delete-product.use-case.ts`
- `apps/api/src/application/use-cases/products/bulk-update-products.use-case.ts`

**Critères d'acceptation**:
- ✅ Formulaire complet avec toutes les options
- ✅ Upload d'images multiples fonctionnel
- ✅ Liste avec filtres et recherche
- ✅ Actions en masse fonctionnelles

---

### Issue #P1-003: Backoffice Complet - Gestion des Utilisateurs
**Statut**: À faire  
**Estimation**: 4 jours  
**Assigné**: Fullstack Developer

**Description**:
Selon le CDC (p.24), le backoffice doit permettre la gestion complète des utilisateurs.

**Tâches**:
- [ ] Créer page liste des utilisateurs
  - [ ] Tri par nom, email, date d'inscription, dernière connexion
  - [ ] Recherche par nom, email
  - [ ] Filtres par statut (actif/inactif/en attente), rôle
- [ ] Afficher statistiques utilisateur
  - [ ] Nombre de commandes
  - [ ] Chiffre d'affaires total
  - [ ] Dernière connexion
- [ ] Implémenter actions admin
  - [ ] Réinitialiser mot de passe
  - [ ] Activer/désactiver compte
  - [ ] Supprimer compte (RGPD)
  - [ ] Envoyer email à l'utilisateur
- [ ] Afficher détails utilisateur
  - [ ] Informations personnelles
  - [ ] Adresses enregistrées
  - [ ] Historique des commandes
  - [ ] Méthodes de paiement enregistrées
- [ ] Créer endpoints API
  - [ ] `GET /api/admin/users`
  - [ ] `GET /api/admin/users/:id`
  - [ ] `PUT /api/admin/users/:id`
  - [ ] `POST /api/admin/users/:id/reset-password`
  - [ ] `DELETE /api/admin/users/:id` (RGPD)

**Fichiers à créer/modifier**:
- `apps/web/src/app/backoffice/users/page.tsx`
- `apps/web/src/components/backoffice/UserList.tsx`
- `apps/web/src/components/backoffice/UserDetail.tsx`
- `apps/api/src/infrastructure/controllers/admin/users.controller.ts`
- `apps/api/src/application/use-cases/users/reset-user-password.use-case.ts`
- `apps/api/src/application/use-cases/users/delete-user.use-case.ts`

**Critères d'acceptation**:
- ✅ Liste complète avec filtres et recherche
- ✅ Statistiques affichées correctement
- ✅ Actions admin fonctionnelles
- ✅ Conformité RGPD pour suppression

---

### Issue #P1-004: Backoffice - Gestion du Contenu de la Page d'Accueil
**Statut**: À faire  
**Estimation**: 2 jours  
**Assigné**: Fullstack Developer

**Description**:
Selon le CDC (p.7-8), la page d'accueil doit être entièrement modifiable via le backoffice.

**Tâches**:
- [ ] Créer interface de gestion du carrousel
  - [ ] Ajouter/modifier/supprimer sections
  - [ ] Réorganiser l'ordre des sections
  - [ ] Upload d'images pour chaque section
- [ ] Créer interface de gestion du texte fixe sous le carrousel
  - [ ] Éditeur WYSIWYG ou markdown
- [ ] Créer interface de gestion de la grille de catégories
  - [ ] Sélectionner catégories à afficher
  - [ ] Réorganiser l'ordre
- [ ] Créer interface de gestion des "Top Produits du moment"
  - [ ] Sélectionner produits à mettre en avant
  - [ ] Réorganiser l'ordre
- [ ] Créer endpoints API
  - [ ] `GET /api/admin/content/homepage`
  - [ ] `PUT /api/admin/content/homepage`
  - [ ] `POST /api/admin/content/homepage/carousel`
  - [ ] `PUT /api/admin/content/homepage/carousel/:id`
  - [ ] `DELETE /api/admin/content/homepage/carousel/:id`

**Fichiers à créer/modifier**:
- `apps/web/src/app/backoffice/homepage/page.tsx`
- `apps/web/src/components/backoffice/HomepageEditor.tsx`
- `apps/web/src/components/backoffice/CarouselManager.tsx`
- `apps/api/src/infrastructure/controllers/admin/content.controller.ts` (étendre)
- `apps/api/src/application/use-cases/content/update-homepage-content.use-case.ts`

**Critères d'acceptation**:
- ✅ Tous les éléments de la page d'accueil sont modifiables
- ✅ Upload d'images fonctionnel
- ✅ Réorganisation par drag & drop

---

### Issue #P1-005: Formulaire de Contact et Stockage des Messages
**Statut**: À faire  
**Estimation**: 2 jours  
**Assigné**: Fullstack Developer

**Description**:
Selon le CDC (p.20), le formulaire de contact doit stocker les messages et les rendre consultables dans le backoffice.

**Tâches**:
- [ ] Finaliser le formulaire de contact existant (`apps/web/src/app/(misc)/contact/page.tsx`)
  - [ ] Validation côté client et serveur
  - [ ] Envoi d'email de confirmation à l'utilisateur
- [ ] Créer entité `ContactMessage` dans PostgreSQL
  - [ ] Champs: email, sujet, message, date, statut (nouveau/répondu/archivé)
- [ ] Créer endpoint `POST /api/contact`
- [ ] Créer page backoffice pour consulter les messages
  - [ ] Liste des messages avec filtres
  - [ ] Détails d'un message
  - [ ] Marquer comme lu/répondu
  - [ ] Répondre directement depuis le backoffice
- [ ] Créer endpoints API admin
  - [ ] `GET /api/admin/contact-messages`
  - [ ] `GET /api/admin/contact-messages/:id`
  - [ ] `PATCH /api/admin/contact-messages/:id/status`
  - [ ] `POST /api/admin/contact-messages/:id/reply`

**Fichiers à créer/modifier**:
- `apps/web/src/app/(misc)/contact/page.tsx` (améliorer)
- `apps/web/src/app/backoffice/contact-messages/page.tsx`
- `apps/web/src/components/backoffice/ContactMessageList.tsx`
- `apps/api/src/infrastructure/persistence/typeorm/entities/contact-message.entity.ts`
- `apps/api/src/infrastructure/controllers/contact.controller.ts`
- `apps/api/src/infrastructure/controllers/admin/contact-messages.controller.ts`

**Critères d'acceptation**:
- ✅ Formulaire fonctionnel avec validation
- ✅ Messages stockés en base de données
- ✅ Consultation dans le backoffice
- ✅ Possibilité de répondre

---

### Issue #P1-006: Chatbot avec FAQ et Escalade Humaine
**Statut**: À faire  
**Estimation**: 5 jours  
**Assigné**: Fullstack Developer + AI Integration Specialist

**Description**:
Selon le CDC (p.20), un chatbot doit être implémenté avec FAQ, escalade vers humain, et contexte des commandes.

**Tâches**:
- [ ] Implémenter système de FAQ
  - [ ] Créer entité `FAQ` dans PostgreSQL
  - [ ] Interface backoffice pour gérer les FAQ
  - [ ] Recherche sémantique dans les FAQ
- [ ] Intégrer chatbot (option: OpenAI, ou solution open-source)
  - [ ] Créer composant React pour le chatbot
  - [ ] Créer endpoint API pour les conversations
  - [ ] Stocker l'historique des conversations
- [ ] Implémenter escalade vers humain
  - [ ] Bouton "Parler à un agent"
  - [ ] Notification aux admins
  - [ ] Transfert du contexte de conversation
- [ ] Ajouter contexte des commandes
  - [ ] Le chatbot peut accéder aux commandes de l'utilisateur connecté
  - [ ] Réponses contextuelles sur le statut des commandes
- [ ] Créer endpoints API
  - [ ] `POST /api/chatbot/message`
  - [ ] `GET /api/chatbot/conversations`
  - [ ] `POST /api/chatbot/escalate`
  - [ ] `GET /api/admin/faq`
  - [ ] `POST /api/admin/faq`

**Fichiers à créer/modifier**:
- `apps/web/src/components/chatbot/ChatbotWidget.tsx`
- `apps/web/src/components/chatbot/ChatMessage.tsx`
- `apps/web/src/app/backoffice/faq/page.tsx`
- `apps/api/src/infrastructure/persistence/typeorm/entities/faq.entity.ts`
- `apps/api/src/infrastructure/persistence/typeorm/entities/chat-conversation.entity.ts`
- `apps/api/src/infrastructure/controllers/chatbot.controller.ts`
- `apps/api/src/infrastructure/services/chatbot/chatbot.service.ts`

**Critères d'acceptation**:
- ✅ Chatbot répond aux questions FAQ
- ✅ Escalade vers humain fonctionnelle
- ✅ Contexte des commandes accessible
- ✅ Historique des conversations sauvegardé

---

### Issue #P1-007: Recherche Avancée avec Facettes
**Statut**: Partiellement fait  
**Estimation**: 3 jours  
**Assigné**: Backend Developer

**Description**:
Selon le CDC (p.10-12), la recherche doit avoir des facettes et respecter des règles de priorité spécifiques.

**Tâches**:
- [ ] Améliorer la recherche existante (`search-products.use-case.ts`)
  - [ ] Implémenter facettes: titre, description, caractéristiques techniques, prix, catégories, disponibilité
  - [ ] Implémenter règles de correspondance avec priorités:
    1. Correspondance exacte
    2. Un caractère de différent
    3. Commence par
    4. Contient
  - [ ] Implémenter tri: prix (asc/desc), nouveauté (asc/desc), disponibilité
- [ ] Optimiser les performances (< 100ms selon CDC)
  - [ ] Ajouter index PostgreSQL sur colonnes de recherche
  - [ ] Utiliser full-text search si nécessaire
  - [ ] Mettre en cache les résultats fréquents
- [ ] Améliorer l'interface de recherche frontend
  - [ ] Ajouter filtres visuels (facettes)
  - [ ] Afficher nombre de résultats par facette
  - [ ] Permettre combinaison de plusieurs filtres

**Fichiers à modifier**:
- `apps/api/src/application/use-cases/products/search-products.use-case.ts`
- `apps/web/src/app/(shop)/search/page.tsx`
- `apps/web/src/components/product/ProductFilters.tsx` (améliorer)
- `apps/api/src/infrastructure/persistence/typeorm/entities/product.entity.ts` (ajouter index)

**Critères d'acceptation**:
- ✅ Toutes les facettes fonctionnent
- ✅ Règles de priorité respectées
- ✅ Performance < 100ms
- ✅ Interface utilisateur intuitive

---

### Issue #P1-008: Gestion des Promotions et Codes Promo
**Statut**: Partiellement fait  
**Estimation**: 2 jours  
**Assigné**: Backend Developer

**Description**:
Le système de promotions existe mais doit être complété avec gestion des codes promo.

**Tâches**:
- [ ] Ajouter gestion des codes promo
  - [ ] Créer entité `PromoCode` avec champs: code, réduction, date début/fin, utilisation max
  - [ ] Validation des codes promo dans le panier
  - [ ] Limiter utilisation par utilisateur
- [ ] Créer interface backoffice pour gérer les codes promo
- [ ] Améliorer l'affichage des promotions dans le panier
- [ ] Créer endpoints API
  - [ ] `POST /api/admin/promo-codes`
  - [ ] `GET /api/admin/promo-codes`
  - [ ] `POST /api/cart/apply-promo-code`

**Fichiers à créer/modifier**:
- `apps/api/src/infrastructure/persistence/typeorm/entities/promo-code.entity.ts`
- `apps/api/src/application/use-cases/cart/apply-promo-code.use-case.ts`
- `apps/web/src/app/backoffice/promo-codes/page.tsx`
- `apps/web/src/components/cart/PromoCodeInput.tsx`

**Critères d'acceptation**:
- ✅ Codes promo fonctionnels
- ✅ Validation et limites respectées
- ✅ Interface backoffice complète

---

## 🟡 Priorité P2 - Améliorations UX/UI

### Issue #P2-001: Amélioration de la Page Produit
**Statut**: À améliorer  
**Estimation**: 2 jours  
**Assigné**: Frontend Developer

**Description**:
La page produit doit être améliorée selon le CDC (p.9-10).

**Tâches**:
- [ ] Améliorer le carrousel d'images
  - [ ] Navigation fluide
  - [ ] Zoom sur images
  - [ ] Miniatures
- [ ] Améliorer l'affichage des produits similaires
  - [ ] Algorithme de sélection amélioré
  - [ ] Prioriser produits disponibles
  - [ ] Affichage en grille responsive
- [ ] Ajouter section "Caractéristiques techniques" bien structurée
- [ ] Améliorer le CTA "Ajouter au panier"
  - [ ] Animation lors de l'ajout
  - [ ] Feedback visuel
  - [ ] Gestion du stock (bouton désactivé si rupture)

**Fichiers à modifier**:
- `apps/web/src/app/(shop)/products/[slug]/page.tsx`
- `apps/web/src/components/product/ProductDetailClient.tsx`
- `apps/web/src/components/product/ProductImageCarousel.tsx` (créer/améliorer)

**Critères d'acceptation**:
- ✅ Carrousel fluide et intuitif
- ✅ Produits similaires pertinents
- ✅ CTA clair et fonctionnel

---

### Issue #P2-002: Amélioration de la Page Catalogue/Catégories
**Statut**: À améliorer  
**Estimation**: 2 jours  
**Assigné**: Frontend Developer

**Description**:
Selon le CDC (p.8-9), la page catégorie doit avoir un affichage adapté mobile/desktop.

**Tâches**:
- [ ] Améliorer l'affichage mobile (liste verticale)
- [ ] Améliorer l'affichage desktop (grille)
- [ ] Ajouter image principale de catégorie avec surimpression du nom
- [ ] Améliorer le tri des produits (priorité, puis disponibilité)
- [ ] Ajouter indicateurs visuels pour produits en rupture de stock

**Fichiers à modifier**:
- `apps/web/src/app/(shop)/categories/[slug]/page.tsx`
- `apps/web/src/components/product/ProductCard.tsx` (améliorer)

**Critères d'acceptation**:
- ✅ Affichage responsive optimal
- ✅ Tri respecté
- ✅ Indicateurs de stock clairs

---

### Issue #P2-003: Amélioration du Processus de Checkout
**Statut**: À améliorer  
**Estimation**: 3 jours  
**Assigné**: Fullstack Developer

**Description**:
Le checkout doit être amélioré selon le CDC (p.13-14).

**Tâches**:
- [ ] Améliorer l'étape de connexion/inscription
  - [ ] Permettre connexion rapide
  - [ ] Permettre inscription rapide
  - [ ] Option "Continuer en tant qu'invité"
- [ ] Améliorer la gestion des adresses
  - [ ] Formulaire d'adresse avec validation
  - [ ] Sélection parmi adresses existantes
  - [ ] Auto-complétion avec API d'adresses (optionnel)
- [ ] Améliorer la gestion des méthodes de paiement
  - [ ] Affichage sécurisé des cartes enregistrées
  - [ ] Formulaire d'ajout de carte sécurisé
  - [ ] Validation des informations de carte
- [ ] Améliorer la page de confirmation
  - [ ] Récapitulatif complet et clair
  - [ ] Lien de téléchargement de facture
  - [ ] Informations de suivi de commande

**Fichiers à modifier**:
- `apps/web/src/app/(shop)/checkout/page.tsx`
- `apps/web/src/components/checkout/CheckoutForm.tsx`
- `apps/web/src/components/account/AddressForm.tsx` (améliorer)

**Critères d'acceptation**:
- ✅ Processus fluide et intuitif
- ✅ Validation complète
- ✅ Page de confirmation informative

---

### Issue #P2-004: i18n Complet (FR/EN/AR) avec RTL
**Statut**: Partiellement fait  
**Estimation**: 3 jours  
**Assigné**: Frontend Developer

**Description**:
Selon le CDC (p.27), le site doit être multilingue avec support RTL pour l'arabe.

**Tâches**:
- [ ] Finaliser l'implémentation i18n existante
  - [ ] Traduire toutes les pages en anglais et arabe
  - [ ] Créer fichiers de traduction complets
- [ ] Implémenter support RTL robuste
  - [ ] Ajouter `dir="rtl"` sur `<html>` pour l'arabe
  - [ ] Adapter tous les composants pour RTL
  - [ ] Tester l'affichage en arabe
- [ ] Ajouter sélecteur de langue dans le header
- [ ] Persister la langue choisie (cookie)
- [ ] Adapter le backoffice pour le multilingue

**Fichiers à modifier**:
- `apps/web/src/lib/i18n.ts` (améliorer)
- `apps/web/src/app/layout.tsx` (ajouter dir conditionnel)
- `apps/web/src/components/layout/Header.tsx` (ajouter sélecteur langue)
- Créer fichiers de traduction: `apps/web/src/translations/en.json`, `ar.json`

**Critères d'acceptation**:
- ✅ Toutes les pages traduites
- ✅ RTL fonctionnel pour l'arabe
- ✅ Sélecteur de langue fonctionnel

---

### Issue #P2-005: Accessibilité (a11y) WCAG 2.1
**Statut**: À faire  
**Estimation**: 4 jours  
**Assigné**: Frontend Developer

**Description**:
Selon le CDC (p.27), le site doit être conforme WCAG 2.1.

**Tâches**:
- [ ] Audit d'accessibilité complet
  - [ ] Utiliser outils: Lighthouse, axe DevTools, WAVE
  - [ ] Tester avec lecteurs d'écran (NVDA, JAWS)
- [ ] Corriger les problèmes de contraste
- [ ] Ajouter labels ARIA manquants
- [ ] Améliorer la navigation au clavier
  - [ ] Focus visible sur tous les éléments interactifs
  - [ ] Ordre de tabulation logique
- [ ] Ajouter textes alternatifs aux images
- [ ] Tester avec différents outils d'assistance

**Fichiers à modifier**:
- Tous les composants React
- `apps/web/src/app/globals.css` (améliorer styles focus)

**Critères d'acceptation**:
- ✅ Score Lighthouse a11y > 90
- ✅ Navigation clavier complète
- ✅ Compatible avec lecteurs d'écran

---

## 🔵 Priorité P3 - Optimisations & Performance

### Issue #P3-001: Optimisation des Images et Médias
**Statut**: À faire  
**Estimation**: 2 jours  
**Assigné**: Fullstack Developer

**Description**:
Les images doivent être optimisées pour de meilleures performances.

**Tâches**:
- [ ] Configurer Next.js Image Optimization
  - [ ] Utiliser `next/image` partout
  - [ ] Configurer les domaines d'images distantes
- [ ] Implémenter upload d'images optimisé
  - [ ] Compression automatique
  - [ ] Génération de thumbnails
  - [ ] Stockage dans MongoDB GridFS ou S3
- [ ] Ajouter lazy loading pour les images
- [ ] Implémenter WebP avec fallback

**Fichiers à modifier**:
- `apps/web/next.config.ts`
- `apps/api/src/infrastructure/services/media.service.ts` (créer)
- Remplacer toutes les `<img>` par `<Image>` de Next.js

**Critères d'acceptation**:
- ✅ Images optimisées et compressées
- ✅ Lazy loading fonctionnel
- ✅ Performance améliorée

---

### Issue #P3-002: Mise en Cache et Performance API
**Statut**: À faire  
**Estimation**: 2 jours  
**Assigné**: Backend Developer

**Description**:
Optimiser les performances de l'API avec mise en cache.

**Tâches**:
- [ ] Implémenter cache Redis pour données fréquentes
  - [ ] Cache des catégories
  - [ ] Cache des produits populaires
  - [ ] Cache des résultats de recherche
- [ ] Ajouter cache HTTP headers appropriés
- [ ] Optimiser les requêtes SQL
  - [ ] Ajouter index manquants
  - [ ] Éviter N+1 queries
  - [ ] Utiliser eager loading quand nécessaire
- [ ] Implémenter pagination efficace partout

**Fichiers à modifier**:
- `apps/api/src/infrastructure/services/cache.service.ts` (créer)
- Tous les use-cases pour ajouter cache
- `apps/api/src/infrastructure/persistence/typeorm/entities/*.ts` (ajouter index)

**Critères d'acceptation**:
- ✅ Temps de réponse API < 200ms pour données en cache
- ✅ Pas de N+1 queries
- ✅ Pagination fonctionnelle partout

---

### Issue #P3-003: SEO Optimisation
**Statut**: Partiellement fait  
**Estimation**: 2 jours  
**Assigné**: Frontend Developer

**Description**:
Améliorer le SEO selon le CDC (p.12).

**Tâches**:
- [ ] Vérifier et améliorer les metadata
  - [ ] Titres uniques par page
  - [ ] Descriptions optimisées
  - [ ] Open Graph tags
  - [ ] Twitter Cards
- [ ] Améliorer le sitemap
  - [ ] Inclure toutes les pages dynamiques
  - [ ] Priorités et fréquences de mise à jour
- [ ] Améliorer robots.txt
- [ ] Ajouter structured data (JSON-LD)
  - [ ] Product schema
  - [ ] Organization schema
  - [ ] BreadcrumbList schema
- [ ] Optimiser les URLs (slugs)

**Fichiers à modifier**:
- `apps/web/src/app/**/page.tsx` (ajouter metadata)
- `apps/web/src/app/sitemap.ts` (améliorer)
- `apps/web/src/app/robots.ts` (améliorer)

**Critères d'acceptation**:
- ✅ Score Lighthouse SEO > 90
- ✅ Structured data valide
- ✅ Sitemap complet

---

## 🟢 Priorité P4 - Sécurité & Conformité

### Issue #P4-001: Sécurité Backoffice et RBAC
**Statut**: Partiellement fait  
**Estimation**: 3 jours  
**Assigné**: Backend Developer

**Description**:
Renforcer la sécurité du backoffice selon le CDC (p.24).

**Tâches**:
- [ ] Implémenter RBAC complet
  - [ ] Rôles: admin, manager, support
  - [ ] Permissions granulaires par fonctionnalité
- [ ] Ajouter 2FA pour les comptes admin
  - [ ] Utiliser TOTP (Google Authenticator, Authy)
  - [ ] Endpoint pour activer/désactiver 2FA
- [ ] Ajouter rate limiting spécifique pour backoffice
- [ ] Implémenter audit log pour actions admin
  - [ ] Créer table `audit_log`
  - [ ] Logger toutes les actions sensibles
- [ ] Ajouter session timeout pour backoffice

**Fichiers à créer/modifier**:
- `apps/api/src/infrastructure/guards/roles.guard.ts` (améliorer)
- `apps/api/src/infrastructure/persistence/typeorm/entities/audit-log.entity.ts`
- `apps/api/src/infrastructure/services/two-factor.service.ts`
- `apps/api/src/infrastructure/middleware/audit-log.middleware.ts`

**Critères d'acceptation**:
- ✅ RBAC fonctionnel
- ✅ 2FA opérationnel
- ✅ Audit log complet

---

### Issue #P4-002: Conformité RGPD
**Statut**: À faire  
**Estimation**: 3 jours  
**Assigné**: Fullstack Developer + Legal

**Description**:
Assurer la conformité RGPD selon le CDC (p.27, p.29).

**Tâches**:
- [ ] Implémenter gestion du consentement
  - [ ] Bannière de consentement cookies
  - [ ] Préférences de cookies granulaires
- [ ] Implémenter droits des utilisateurs
  - [ ] Droit à l'accès (export données)
  - [ ] Droit à la rectification
  - [ ] Droit à l'effacement (suppression compte)
  - [ ] Droit à la portabilité
- [ ] Créer page "Gestion des données personnelles"
- [ ] Implémenter suppression automatique des données après période de rétention
- [ ] Ajouter mentions légales et politique de confidentialité
- [ ] Documenter les traitements de données

**Fichiers à créer/modifier**:
- `apps/web/src/app/(misc)/legal/privacy/page.tsx`
- `apps/web/src/components/common/CookieConsent.tsx`
- `apps/api/src/application/use-cases/users/export-user-data.use-case.ts`
- `apps/api/src/application/use-cases/users/delete-user-data.use-case.ts`

**Critères d'acceptation**:
- ✅ Consentement cookies fonctionnel
- ✅ Tous les droits RGPD implémentés
- ✅ Documentation complète

---

### Issue #P4-003: Protection contre les Vulnérabilités
**Statut**: À améliorer  
**Estimation**: 2 jours  
**Assigné**: Backend Developer

**Description**:
Renforcer la protection contre les vulnérabilités courantes.

**Tâches**:
- [ ] Audit de sécurité
  - [ ] Scanner avec outils: npm audit, Snyk, OWASP ZAP
- [ ] Protection XSS
  - [ ] Sanitization des inputs
  - [ ] Headers CSP appropriés
- [ ] Protection CSRF
  - [ ] Tokens CSRF pour formulaires
- [ ] Protection SQL Injection
  - [ ] Vérifier que TypeORM utilise bien les paramètres
- [ ] Validation stricte des inputs
  - [ ] Utiliser class-validator partout
- [ ] Chiffrement des données sensibles
  - [ ] Mots de passe (déjà fait avec bcrypt)
  - [ ] Informations de paiement (ne jamais stocker CVV)

**Fichiers à modifier**:
- Tous les DTOs (ajouter validation)
- `apps/api/src/main.ts` (ajouter headers sécurité)
- `apps/api/src/infrastructure/guards/csrf.guard.ts` (créer)

**Critères d'acceptation**:
- ✅ Aucune vulnérabilité critique
- ✅ Headers sécurité configurés
- ✅ Validation complète

---

## 🟣 Priorité P5 - Tests & Qualité

### Issue #P5-001: Tests Unitaires Backend
**Statut**: À faire  
**Estimation**: 5 jours  
**Assigné**: Backend Developer

**Description**:
Ajouter des tests unitaires pour les use-cases critiques.

**Tâches**:
- [ ] Configurer Jest pour NestJS
- [ ] Tests pour use-cases auth
  - [ ] Création utilisateur
  - [ ] Vérification email
  - [ ] Login
- [ ] Tests pour use-cases cart
  - [ ] Ajout au panier
  - [ ] Application promotion
  - [ ] Fusion panier invité
- [ ] Tests pour use-cases orders
  - [ ] Création commande
  - [ ] Génération facture
- [ ] Tests pour use-cases products
  - [ ] Recherche produits
  - [ ] Filtres

**Fichiers à créer**:
- `apps/api/src/application/use-cases/**/*.spec.ts`
- `apps/api/jest.config.js`

**Critères d'acceptation**:
- ✅ Couverture > 70% pour use-cases critiques
- ✅ Tous les tests passent

---

### Issue #P5-002: Tests E2E avec Playwright
**Statut**: À faire  
**Estimation**: 5 jours  
**Assigné**: QA Engineer + Developer

**Description**:
Tests end-to-end pour les parcours critiques.

**Tâches**:
- [ ] Configurer Playwright
- [ ] Test parcours d'achat complet
  - [ ] Recherche produit
  - [ ] Ajout au panier
  - [ ] Checkout
  - [ ] Paiement
- [ ] Test parcours utilisateur
  - [ ] Inscription
  - [ ] Vérification email
  - [ ] Connexion
  - [ ] Gestion profil
- [ ] Test backoffice
  - [ ] Connexion admin
  - [ ] Création produit
  - [ ] Gestion commandes

**Fichiers à créer**:
- `apps/web/e2e/purchase-flow.spec.ts`
- `apps/web/e2e/user-flow.spec.ts`
- `apps/web/e2e/backoffice-flow.spec.ts`
- `playwright.config.ts`

**Critères d'acceptation**:
- ✅ Tous les parcours critiques testés
- ✅ Tests stables et reproductibles

---

### Issue #P5-003: Migration TypeORM en Production
**Statut**: À faire  
**Estimation**: 1 jour  
**Assigné**: Backend Developer

**Description**:
Remplacer `synchronize: true` par des migrations réelles.

**Tâches**:
- [ ] Créer migrations pour toutes les entités existantes
- [ ] Tester les migrations sur environnement de staging
- [ ] Configurer `synchronize: false` en production
- [ ] Documenter le processus de migration

**Fichiers à modifier**:
- `apps/api/src/db/data-source.ts`
- Créer toutes les migrations manquantes dans `apps/api/src/migrations/`

**Critères d'acceptation**:
- ✅ Migrations fonctionnelles
- ✅ `synchronize: false` en production
- ✅ Documentation complète

---

### Issue #P5-004: Logging Structuré et Monitoring
**Statut**: À faire  
**Estimation**: 2 jours  
**Assigné**: Backend Developer

**Description**:
Implémenter logging structuré et monitoring.

**Tâches**:
- [ ] Configurer Winston ou Pino pour logging structuré
- [ ] Ajouter logs pour actions importantes
  - [ ] Création commandes
  - [ ] Erreurs
  - [ ] Actions admin
- [ ] Configurer monitoring (optionnel: Sentry, DataDog)
- [ ] Ajouter health checks avancés
- [ ] Configurer alerting pour erreurs critiques

**Fichiers à créer/modifier**:
- `apps/api/src/infrastructure/services/logger.service.ts`
- `apps/api/src/health/health.controller.ts` (améliorer)

**Critères d'acceptation**:
- ✅ Logs structurés et lisibles
- ✅ Monitoring fonctionnel
- ✅ Alertes configurées

---

## 📊 Résumé des Estimations

| Priorité | Nombre d'Issues | Estimation Totale |
|----------|----------------|-------------------|
| P0       | 4              | 8 jours           |
| P1       | 8              | 25 jours          |
| P2       | 5              | 13 jours          |
| P3       | 3              | 6 jours           |
| P4       | 3              | 8 jours           |
| P5       | 4              | 13 jours          |
| **Total**| **27**         | **73 jours**      |

*Note: Estimations basées sur un développeur fullstack expérimenté. Ajuster selon l'équipe.*

---

## 🎯 Prochaines Étapes Recommandées

1. **Sprint 1 (2 semaines)** - P0 uniquement
   - Finaliser paiement Stripe
   - Génération factures PDF
   - Email de confirmation
   - Supprimer tous les mocks

2. **Sprint 2 (2 semaines)** - P1 partiel
   - Backoffice catégories
   - Backoffice produits (amélioration)
   - Formulaire contact

3. **Sprint 3 (2 semaines)** - P1 suite
   - Backoffice utilisateurs
   - Gestion contenu homepage
   - Recherche avancée

4. **Sprint 4 (2 semaines)** - P1 fin + P2 début
   - Chatbot
   - Codes promo
   - Améliorations UX

5. **Sprints suivants** - P2, P3, P4, P5 selon priorités business

---

## 📝 Notes Importantes

- **Architecture**: Le projet utilise Clean Architecture avec NestJS (API) et Next.js (Frontend)
- **Base de données**: PostgreSQL pour données transactionnelles, MongoDB pour médias
- **Authentification**: JWT avec cookies httpOnly
- **Paiement**: Stripe (en cours d'implémentation)
- **Déploiement**: Docker Compose pour développement local

---

## 🔗 Références

- Cahier des Charges: `docs/Cahier-des-charges-Projet-Etude-2025-2026.pdf`
- Architecture: `docs/ARCHITECTURE.md`
- Todo existant: `todo.md`

---

**Dernière mise à jour**: 2025-01-27
