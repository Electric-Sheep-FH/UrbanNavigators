# ADR-008 (révision 2) — Déploiement sur Kubernetes dès le MVP

- **Statut** : accepté — remplace la version initiale d'ADR-008
- **Date** : 2026-10-22
- **Décideurs** : Quentin Engelmann, Fabien Haselmann, Alex Marcon

## Contexte

La version initiale d'ADR-008 prévoyait Docker Compose pour le développement, une plateforme managée
ensuite, et Kubernetes « sous conditions » (charge mesurée, SLO). Le cahier des charges technique
plaçait d'ailleurs « Kubernetes obligatoire sans charge démontrée » hors périmètre du MVP (§3.3).

Deux éléments nouveaux remettent cette décision en cause :

1. le référentiel d'évaluation attend une orchestration de conteneurs démontrée ;
2. les exigences du CDC se traduisent directement en objets Kubernetes : disponibilité et
   dégradation contrôlée (ARC-003) → sondes et réplicas ; montée en charge → HPA ;
   infrastructure reproductible (CICD-001) → manifestes versionnés ; rollback testé → `helm rollback`.

## Décision

- Les services applicatifs sont déployés sur **Kubernetes** dans tous les environnements hors poste
  de développement, au moyen d'**un chart Helm unique** (`deploy/helm/urbannavigators`) qui itère
  sur l'inventaire des services.
- **Poste local** : Docker Compose reste l'outil du quotidien ; un cluster **k3d** (k3s dans Docker,
  Traefik intégré) permet de tester les manifestes à l'identique.
- **Staging / production** : cluster Kubernetes managé. Le même chart est utilisé avec un fichier de
  valeurs par environnement ; seule la version d'image (SHA du commit) change entre staging et production.
- **Dépendances d'infrastructure** : manifestes simples (`infra/`) pour le local et le staging d'école ;
  en production, services managés ou opérateurs (CloudNativePG, RabbitMQ Cluster Operator).

## Conséquences

- **Positives** : environnements identiques du staging à la production, rollback en une commande,
  autoscaling et auto-réparation natifs, démonstration directe des exigences de disponibilité.
- **Négatives** : complexité opérationnelle accrue pour une équipe de trois personnes, et coût d'un
  cluster managé. Mesures de maîtrise :
  - un seul chart générique, pas de manifeste écrit à la main par service ;
  - pas de service mesh ni d'opérateur maison au MVP ;
  - autoscaling activé seulement sur les services exposés au trafic voyageur.
- **À mettre à jour** : CDC technique §3.3 (hors périmètre), §15.1 (environnements) et tableau de
  synthèse du §1 ; registre des risques (nouveau risque « compétence Kubernetes »).

## Conditions de réexamen

Si le coût du cluster managé dépasse le budget du projet, ou si l'exploitation consomme plus de 20 %
de la capacité de l'équipe sur deux sprints consécutifs, réévaluer une plateforme de conteneurs
managée sans Kubernetes.
