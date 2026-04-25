# Documentation technique — Althea Systems

Cette documentation accompagne le repository Git du projet **Althea Systems B2B E-Commerce** (cahier des charges — Projet d'Étude 2025-2026).

## Index

| Document | Contenu |
|---|---|
| [INSTALLATION.md](./INSTALLATION.md) | Guide d'installation : dépendances, configuration dev/prod, déploiement web (desktop + mobile responsive) et mobile native (TODO). |
| [API.md](./API.md) | Documentation de tous les endpoints : méthodes HTTP, paramètres, réponses. Plan d'intégration Swagger en TODO. |
| [CODE_STRUCTURE.md](./CODE_STRUCTURE.md) | Organisation du monorepo, architecture en couches API (clean architecture), structure du front Next.js, justification des choix technologiques. |
| [TESTING.md](./TESTING.md) | Stratégie de tests unitaires, intégration, E2E et fonctionnels (Jest, Supertest, Playwright recommandé). Couverture actuelle minimale → backlog. |
| [DCT.md](./DCT.md) | Document de Conception Technique : architecture système, diagrammes (architecture, flux de données, communication services, modèle de données), choix technologiques, plan de sécurité (RGPD inclus), plan de maintenance et d'évolutivité. |
| [DELIVERABLES.md](./DELIVERABLES.md) | Suivi des livrables par sprint reconstitué depuis l'historique Git, conventions de code review, prévisionnel des sprints à venir. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Note d'architecture initiale (bootstrap), conservée pour traçabilité. |

## Cahier des charges

`Cahier-des-charges-Projet-Etude-2025-2026.pdf` — sources et exigences fonctionnelles fournies par le commanditaire.

## Convention TODO

Toutes les zones non implémentées au moment de la rédaction sont **explicitement marquées `TODO`** dans les documents. Les principales :

- Application mobile native (Expo / React Native) — non démarrée (cf. INSTALLATION.md §5).
- Outillage Swagger / Postman pour l'API (cf. API.md).
- Couverture de tests automatisés étendue (cf. TESTING.md).
- Pipeline CI/CD (cf. TESTING.md §8 + DELIVERABLES.md S+1).
- Vérification de signature webhook Stripe (cf. DCT.md §4.3 — risque critique).
- Module médias (GridFS / S3) (cf. CODE_STRUCTURE.md §2.4).
- Activation globale du throttler NestJS (cf. DCT.md §4.3).
- Conformité RGPD complète : bandeau cookies, export données, suppression compte exposée à l'utilisateur (cf. DCT.md §4.4).
- Migration `synchronize: true` → migrations strictes pour la prod (cf. INSTALLATION.md §3.2).

## Dépôt et collaboration

- Les étapes de développement sont visibles via l'historique Git (`git log`).
- Branches : `main` (stable) ← `prod` (préprod) ← `feat/*`, `fix/*` (features).
- Conventions de commit : `feat|fix|chore|docs|refactor|test(scope): description`.
- Revues de code via Pull Requests (template à formaliser — TODO).
