# ADR-010 — Architecture interne des services : hexagonale pour disruptions, MVC pour les autres

- **Statut** : accepté
- **Date** : 2026-10-23
- **Décideurs** : Quentin Engelmann, Fabien Haselmann, Alex Marcon

## Contexte

Les sept services n'ont pas la même complexité métier. Certains exposent surtout des données :
recherche d'arrêts, favoris, abonnements. D'autres portent de vraies règles :
- cycle de vie d'une perturbation ;
- cohérence temporelle ;
- audit ;
- propagation d'événements en moins de 30 s.

Appliquer partout la même architecture serait soit trop lourd pour les services simples,
soit trop pauvre pour les services riches.

## Décision

### `disruptions` : architecture hexagonale (ports & adapters)

```
            adapters/in/http ──► application (cas d'utilisation) ──► domain
                                         │
                                         ▼ ports (interfaces)
      adapters/out/persistence (PostgreSQL | mémoire)   adapters/out/messaging (RabbitMQ | journal)
```

- **domain/** : l'agrégat `Disruption` et ses règles, en TypeScript pur, sans framework.
- **application/** : les cas d'utilisation, qui servent de ports d'entrée, et les ports de sortie
  (`DisruptionRepository`, `EventPublisher`, `Clock`).
- **adapters/** : HTTP en entrée ; PostgreSQL, mémoire, RabbitMQ et horloge en sortie.
- **disruptions.module.ts** : la racine de composition, seul endroit qui associe un adapter à chaque port.

Pourquoi ce service : c'est lui qui a le plus de règles métier, et il dépend de deux technologies
d'infrastructure (PostgreSQL, RabbitMQ). Ce sont précisément les situations où l'isolement du domaine rapporte.

### Les autres services : MVC à la manière NestJS

| Couche | Fichier | Rôle |
|---|---|---|
| Contrôleur | `*.controller.ts` | routes, codes HTTP |
| Vue | DTO (`dto/`) et réponse JSON | validation des entrées (`class-validator`), forme des sorties |
| Modèle | `*.model.ts` et `*.repository.ts` | données et accès aux données |
| Service | `*.service.ts` | logique métier |

Un module par ressource : `favorites` (identity), `stops` (mobility-data), `vehicle-positions`
(realtime), `journeys` (journey-planner), `subscriptions` (notifications), `status` (gateway-bff).

## Comparaison assumée

| Critère | Hexagonale (disruptions) | MVC (autres) |
|---|---|---|
| Domaine indépendant du framework | oui, vérifié par ESLint | non : les services utilisent `@Injectable` et les exceptions HTTP |
| Changer de base ou de broker | un nouvel adapter, rien d'autre ne bouge | modifier le repository et parfois le service |
| Tests métier | sans Nest, ni base, ni broker | via le module de test Nest |
| Nombre de fichiers par fonctionnalité | élevé (≈ 15) | faible (≈ 6) |
| Courbe d'apprentissage | plus raide | standard NestJS |

## Règles vérifiées automatiquement

Dans `eslint.config.mjs`, `no-restricted-imports` interdit :
- au **domaine** d'importer NestJS, `pg`, `amqplib`, `@un/*`, ainsi que les couches application et adapters ;
- à l'**application** d'importer NestJS, `pg`, `amqplib` et les adapters.

Toute violation fait échouer le lint, donc la CI.

## Conséquences

- La règle de dépendance de l'hexagonale est garantie dans la durée, pas seulement en revue de code.
- `PublishDisruptionUseCase` enregistre puis publie sans transaction commune : un événement peut se
  perdre si RabbitMQ tombe entre les deux. Une outbox transactionnelle (ADR-005) est à prévoir.
- Les repositories MVC sont en mémoire dans le squelette. Le choix d'un ORM pour les services MVC
  fera l'objet d'un ADR dédié.

## Conditions de réexamen

Si un autre service accumule des règles métier (par exemple l'import et le versionnement GTFS de
mobility-data, DATA-001 à 003), le migrer vers la même structure hexagonale.
