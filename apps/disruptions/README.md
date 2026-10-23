# Service disruptions — architecture hexagonale

Perturbations annoncées aux voyageurs : déclaration, publication, consultation des perturbations actives.
Choix d'architecture : [ADR-010](../../docs/adr/ADR-010-architecture-interne-des-services.md).

## Organisation

```
src/
  domain/                       cœur métier, TypeScript pur
    disruption.ts               agrégat Disruption : règles, transitions, événement de domaine
    domain.errors.ts            erreurs métier (sans notion de code HTTP)
  application/
    ports/                      interfaces dont l'application a besoin (ports de sortie)
      disruption-repository.port.ts
      event-publisher.port.ts
      clock.port.ts
    use-cases/                  ports d'entrée : un fichier par intention utilisateur
      declare-disruption.use-case.ts
      publish-disruption.use-case.ts
      list-active-disruptions.use-case.ts
  adapters/
    in/http/                    contrôleur REST, présentation, traduction des erreurs en HTTP
    out/persistence/            PostgreSQL ou mémoire
    out/messaging/              RabbitMQ (publisher confirms) ou simple journal
    out/clock/                  horloge système
  disruptions.module.ts         racine de composition : choisit l'adapter de chaque port
```

**Règle de dépendance** : `adapters → application → domain`, jamais l'inverse. ESLint la fait respecter :
un `import '@nestjs/common'` dans `domain/` fait échouer la CI.

## Choix des adapters

| Variable d'environnement | Présente | Absente |
|---|---|---|
| `DATABASE_URL` | `PostgresDisruptionRepository` | `InMemoryDisruptionRepository` |
| `AMQP_URL` | `RabbitMqEventPublisher` | `LoggingEventPublisher` |

Le même code métier tourne donc sur un poste sans aucune infrastructure (`pnpm dev`) comme en production.

## API

| Méthode | Route | Effet |
|---|---|---|
| `POST` | `/disruptions` | déclare une perturbation (brouillon) |
| `POST` | `/disruptions/:id/publication` | publie, puis émet `disruptions.disruption.published.v1` |
| `GET` | `/disruptions/active` | perturbations visibles maintenant |

Exemple :

```json
POST /disruptions
{ "lineIds": ["L1"], "severity": "severe", "message": "Ligne 1 interrompue : bus de substitution.",
  "startsAt": "2026-11-02T07:00:00Z", "endsAt": "2026-11-02T12:00:00Z" }
```

Correspondance des erreurs : règle non respectée → 400, transition interdite → 409, perturbation inconnue → 404.

## Tests

- `domain/disruption.spec.ts` : règles métier, sans aucune dépendance.
- `application/use-cases/*.spec.ts` : cas d'utilisation, avec des doublures à la place des ports.
