# Urban Navigators

Plateforme de mobilité urbaine : monorepo des microservices, du front et du déploiement Kubernetes.
Choix d'architecture : [ADR-008 Kubernetes](docs/adr/ADR-008-deploiement-kubernetes.md),
[ADR-009 Monorepo](docs/adr/ADR-009-monorepo.md).

## Structure

```
apps/                      un dossier = un service déployable = une image Docker
  gateway-bff/             point d'entrée unique (REST, puis SSE), agrège les services
  identity/  mobility-data/  realtime/  journey-planner/  disruptions/  notifications/
  web/                     front React (PWA à venir)
libs/
  contracts/               types partagés : santé, événements RabbitMQ, liste des services
  observability/           initialisation OpenTelemetry commune
docker/                    Dockerfile commun aux services NestJS + Dockerfile du front
compose.yaml               environnement de développement complet
infra/                     PostgreSQL, Redis, RabbitMQ, observabilité pour Kubernetes (kustomize)
deploy/helm/urbannavigators/  chart Helm unique pour tous les services
deploy/k3d/                cluster Kubernetes local
tools/templates/           gabarit de service (pnpm new-service <nom>)
.github/workflows/         CI (ci.yml), release production (release.yml), SAST (codeql.yml)
```

## Architecture interne des services

Voir [ADR-010](docs/adr/ADR-010-architecture-interne-des-services.md).

| Service | Architecture | Ressource d'exemple |
|---|---|---|
| disruptions | **hexagonale** ([détails](apps/disruptions/README.md)) | `POST /disruptions`, `POST /disruptions/:id/publication`, `GET /disruptions/active` |
| identity | MVC | `GET/POST/DELETE /users/:userId/favorites` |
| mobility-data | MVC | `GET /stops?q=`, `GET /stops/:id` |
| realtime | MVC | `GET /vehicle-positions?routeId=` (avec fraîcheur du flux) |
| journey-planner | MVC | `POST /journeys` (503 tant qu'OTP n'est pas branché) |
| notifications | MVC | `GET/POST/DELETE /users/:userId/subscriptions` |
| gateway-bff | MVC | `GET /api/status` |

Chaque service expose aussi ses sondes `/health/live` et `/health/ready`. La gateway
expose `GET /api/status`, qui interroge tous les services, et le front affiche le résultat. Ce
premier parcours complet traverse toute la chaîne : front, Ingress, gateway, services.

## Prérequis

- Node.js 22 ou plus (voir `.nvmrc`) et pnpm via Corepack : `corepack enable` (sous Windows, dans un terminal administrateur)
- Docker Desktop
- Pour Kubernetes en local : [k3d](https://k3d.io), `kubectl` et [Helm](https://helm.sh) 4

## Développement

```bash
pnpm install
pnpm build          # construit libs puis services, dans l'ordre des dépendances
pnpm test
pnpm lint
```

Tout lancer avec Docker Compose :

```bash
docker compose up --build
```

| URL | Contenu |
|---|---|
| http://localhost:8080 | front |
| http://localhost:3000/api/status | gateway |
| http://localhost:3001 | Grafana (traces, métriques, logs) |
| http://localhost:15672 | console RabbitMQ (urban / urban) |

Travailler sur un seul service sans conteneur : `pnpm build:libs`, puis
`pnpm --filter @un/identity dev`.

## Kubernetes en local (k3d)

```bash
k3d cluster create --config deploy/k3d/cluster.yaml
kubectl apply -k infra                       # PostgreSQL, Redis, RabbitMQ, observabilité
./scripts/build-images.sh --k3d              # construit les 8 images et les importe dans le cluster
helm upgrade --install un deploy/helm/urbannavigators -n urbannavigators \
  -f deploy/helm/urbannavigators/values-local.yaml --wait
helm test un -n urbannavigators              # smoke test : tous les services doivent être "up"
```

L'application est servie sur http://urbannavigators.localhost:8081.

Commandes utiles : `kubectl -n urbannavigators get pods`, `helm history un -n urbannavigators`,
`helm rollback un <révision> -n urbannavigators`.

`k3d cluster create` bascule `kubectl` sur le contexte `k3d-urbannavigators`
(retour : `kubectl config use-context docker-desktop`). Pour libérer la mémoire :
`k3d cluster stop urbannavigators` (puis `start`), ou `k3d cluster delete urbannavigators`.

## CI/CD

Une seule CI couvre tout le monorepo. Le nom du service est un paramètre de matrice : aucun pipeline
n'est dupliqué.

```
PR / push ─┬─ changes   : calcule les services impactés (scripts/affected-services.mjs)
           ├─ quality   : build + lint + tests de tout le monorepo
           ├─ security  : Gitleaks (secrets) + Trivy (dépendances, licences)
           ├─ helm      : helm lint + kubeconform sur chaque environnement + infra
           └─ images    : par service impacté → build, scan Trivy, SBOM
                          (push sur main) → publication GHCR, signature cosign
push main ─┬─ retag     : services non modifiés → dernière image re-taggée avec le SHA
           └─ deploy-staging : helm upgrade --rollback-on-failure + helm test
manuel    ─── release.yml : vérification des signatures → approbation → production
```

Correspondance avec le pipeline obligatoire du CDC (§15.2) :

| Étape CDC | Où | État |
|---|---|---|
| Compiler, lint, tests unitaires | `quality` | ✅ |
| SAST, SCA, secrets, SBOM, licences | `codeql.yml`, `security`, `images` | ✅ |
| Image immuable, scannée, signée, liée au commit | `images` (tag = SHA) | ✅ |
| Staging + contrat, intégration, E2E, accessibilité, smoke | `deploy-staging` | smoke ✅, autres tests à ajouter |
| Charge / résilience, approbation de recette | — / environnement `production` | à ajouter / ✅ |
| Promotion du même artefact, rollback | `release.yml`, `--rollback-on-failure` | ✅ |

### Configuration à faire une fois

Le staging tourne sur le NAS de l'équipe : procédure complète (VM, k3s, runner, tunnel HTTPS) dans
[docs/deploiement-staging-nas.md](docs/deploiement-staging-nas.md). Tant que ce n'est pas fait, laisser
`STAGING_ENABLED` à `false` : le reste de la CI fonctionne normalement.

**1. GitHub Actions** : variables et secrets lus par les workflows (`vars.X`, `secrets.X`).
Ce ne sont pas des variables d'environnement du système ni des pods.

| Nom | Type | Niveau | Où dans GitHub | Valeur |
|---|---|---|---|---|
| `STAGING_ENABLED` | variable | **dépôt** | Settings → Secrets and variables → Actions → *Variables* | `true` quand le cluster de staging existe |
| `STAGING_HOST` | variable | environnement `staging` | Settings → Environments → staging → *Environment variables* | adresse Tailscale Funnel, ex. `vm.tailnet.ts.net` |
| `STAGING_KUBECONFIG` | secret | environnement `staging` | Settings → Environments → staging → *Environment secrets* | `sudo base64 -w0 /etc/rancher/k3s/k3s.yaml` dans la VM |
| `PRODUCTION_HOST` | variable | environnement `production` | Settings → Environments → production → *Environment variables* | nom de domaine de production |
| `PRODUCTION_KUBECONFIG` | secret | environnement `production` | Settings → Environments → production → *Environment secrets* | kubeconfig encodé en base64 |

- `STAGING_ENABLED` **doit** être au niveau du dépôt. Il est lu dans le `if:` du job `deploy-staging`,
  qui est évalué avant que le job n'entre dans son environnement : une variable d'environnement GitHub
  y serait invisible, et le déploiement ne se déclencherait jamais.
- Les noms de domaine et kubeconfigs vont dans leur environnement : un secret de production n'est ainsi
  lisible que par un job qui a passé les règles de protection de l'environnement `production`.
- Sur l'environnement `production`, activer *Required reviewers* : c'est l'approbation de recette
  avant la mise en production.

**2. Cluster Kubernetes** (staging et production) : des objets `Secret` Kubernetes, pas GitHub.

| Nom | Création | Rôle |
|---|---|---|
| `ghcr` | `kubectl -n urbannavigators create secret docker-registry ghcr --docker-server=ghcr.io --docker-username=<compte> --docker-password=<jeton read:packages>` | télécharger les images privées de GHCR |
| `<service>-secrets` | un par service (modèle : `infra/k8s/dev-secrets.yaml`) | `DATABASE_URL`, `AMQP_URL`… injectés dans les pods |

## Ajouter un service

```bash
pnpm new-service <nom>
```

Puis le déclarer dans `compose.yaml`, `deploy/helm/urbannavigators/values.yaml` et
`libs/contracts/src/services.ts`. Au-delà de sept services, un ADR est obligatoire (ARC-004).

## Limites connues du squelette

- Aucune logique métier : les services ne se connectent pas encore à PostgreSQL, Redis ou RabbitMQ.
- OpenTripPlanner tourne seulement sous Docker Compose (profil `otp`), pas encore dans le cluster.
- Pas encore de NetworkPolicy ni de PodDisruptionBudget.
