# ADR-009 — Un dépôt unique (monorepo) pour tous les services

- **Statut** : accepté
- **Date** : 2026-10-22
- **Décideurs** : Quentin Engelmann, Fabien Haselmann, Alex Marcon

## Contexte

L'architecture comporte jusqu'à sept services déployables (ARC-004), un front React et des contrats
partagés (DTO, événements RabbitMQ). L'équipe compte trois personnes et une seule pile technique
(TypeScript). Il faut choisir entre un dépôt par service (polyrepo) et un dépôt unique (monorepo).

L'indépendance d'un microservice tient à son **déploiement** et à la **propriété de ses données**
(ARC-001, ARC-002), pas au découpage en dépôts.

## Décision

Un **dépôt unique** géré avec **pnpm workspaces** :

- `apps/*` : un dossier par service déployable, chacun avec son image Docker et sa version ;
- `libs/*` : code partagé (contrats, observabilité), consommé directement sans publication npm ;
- **une seule CI** paramétrée : les images ne sont reconstruites que pour les services modifiés ou
  dépendant d'une librairie modifiée (`scripts/affected-services.mjs`).

## Alternatives écartées

| Option | Raison du rejet |
|---|---|
| Un dépôt par service | 8 à 9 dépôts, CI dupliquée, contrats à publier et versionner sur npm, changements transverses répartis sur plusieurs PR. Coût disproportionné pour trois personnes. |
| Monorepo avec Nx ou Turborepo | Utile à plus grande échelle ; pnpm suffit au MVP. Réévaluable si les temps de build dépassent 10 min. |

## Conséquences

- **Positives** : un changement de contrat et ses consommateurs passent dans une seule PR atomique ;
  une seule configuration de qualité (lint, tests, sécurité) ; l'environnement de staging se
  reconstruit depuis le dépôt (CICD-001).
- **Négatives** : risque de couplage par import direct entre services. Règle : un service n'importe
  jamais le code d'un autre service, uniquement des `libs/*` ; vérifié en revue de code.
