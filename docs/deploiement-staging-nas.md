# Staging sur le NAS de l'équipe (Synology DS423+)

Objectif : un environnement de staging permanent, déployé automatiquement par la CI à chaque push sur
`main` et accessible au jury en HTTPS, sans ouvrir aucun port sur la box.

```
GitHub Actions ──(connexion sortante du runner)──┐
                                                 ▼
NAS DS423+ ── VM Ubuntu ── runner GitHub ── k3s (Traefik, Postgres, RabbitMQ, 8 services)
                              ▲
Jury ── https://<vm>.<tailnet>.ts.net ── Tailscale Funnel
```

| Choix | Raison |
|---|---|
| VM plutôt que DSM | DSM est trop modifié pour k3s ; la VM isole aussi le cluster des données personnelles du NAS. |
| k3s | Même distribution que le cluster local k3d : le chart Helm et Traefik fonctionnent sans changement. |
| Runner auto-hébergé | La CI déploie depuis l'intérieur du réseau : l'API Kubernetes n'est jamais exposée. |
| Tailscale Funnel | HTTPS public gratuit, sans nom de domaine à acheter ni redirection de port. |

## 1. Créer la VM (DSM)

1. Centre de paquets → installer **Virtual Machine Manager**.
2. Télécharger l'ISO **Ubuntu Server 24.04 LTS** depuis ubuntu.com et l'importer dans Virtual Machine Manager
   (Image → ISO).
3. Créer la VM :

   | Paramètre | Valeur |
   |---|---|
   | CPU | 4 vCPU |
   | Mémoire | 8 Go (il en reste 10 pour DSM) |
   | Disque | 60 Go |
   | Réseau | commutateur virtuel par défaut (la VM obtient une IP du réseau local) |

4. Installer Ubuntu en cochant **OpenSSH server**.
5. Dans l'interface de la box, réserver une **IP fixe** pour la VM (bail DHCP statique), par exemple `192.168.1.50`.

## 2. Installer k3s (dans la VM, en SSH)

```bash
sudo apt update && sudo apt full-upgrade -y && sudo apt install -y git curl
curl -sfL https://get.k3s.io | sh -
sudo k3s kubectl get nodes          # le nœud doit être "Ready"
```

## 3. Piloter le cluster depuis ton PC (réseau local uniquement)

Récupérer le kubeconfig en remplaçant `127.0.0.1` par l'IP de la VM :

```bash
ssh <utilisateur>@192.168.1.50 "sudo cat /etc/rancher/k3s/k3s.yaml" | sed "s/127.0.0.1/192.168.1.50/" > nas-kubeconfig.yaml
```

Ne jamais commiter ce fichier : il donne les droits administrateur sur le cluster. Ensuite, depuis le dépôt :

```bash
export KUBECONFIG=$PWD/nas-kubeconfig.yaml      # PowerShell : $env:KUBECONFIG = "$PWD\nas-kubeconfig.yaml"
kubectl get nodes
```

## 4. Installer l'infrastructure

Avant d'appliquer, **changer les mots de passe** dans une copie locale (non commitée) de
`infra/k8s/dev-secrets.yaml` et `infra/postgres/init.sql` : le staging est accessible depuis Internet.

```bash
kubectl apply -k infra
kubectl -n urbannavigators get pods           # postgres, redis, rabbitmq, observability : Running
```

Puis le secret qui permet à k3s de télécharger les images privées de GHCR. Sur GitHub, créer un jeton
**classic** (Settings → Developer settings → Personal access tokens) avec la seule portée `read:packages` :

```bash
kubectl -n urbannavigators create secret docker-registry ghcr \
  --docker-server=ghcr.io --docker-username=<compte-github> --docker-password=<jeton>
```

## 5. Installer le runner GitHub (dans la VM)

1. Sur GitHub : dépôt → Settings → Actions → Runners → **New self-hosted runner** → Linux / x64.
2. Exécuter dans la VM les commandes affichées (téléchargement, puis `./config.sh`) en ajoutant
   le label `staging` :
   ```bash
   ./config.sh --url https://github.com/<owner>/<repo> --token <jeton-affiché> --name nas-staging --labels staging
   ```
3. L'installer comme service, pour qu'il redémarre avec la VM :
   ```bash
   sudo ./svc.sh install && sudo ./svc.sh start
   ```
4. Sur GitHub, le runner apparaît « Idle ».

Seul le job `deploy-staging` demande le label `staging` : le reste de la CI continue de tourner chez GitHub.

**Le dépôt doit rester privé.** Sur un dépôt public, une pull request venant d'un inconnu pourrait
tenter d'exécuter du code sur ce runner, donc sur le NAS.

## 6. Exposer le staging en HTTPS (Tailscale Funnel)

1. Créer un compte gratuit sur tailscale.com. Dans la console d'administration, activer **HTTPS** et **Funnel**
   (DNS → HTTPS Certificates, puis Access controls → autoriser `funnel`).
2. Dans la VM :
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   sudo tailscale funnel --bg 80        # HTTPS public -> Traefik (port 80 de la VM)
   tailscale funnel status              # affiche l'adresse publique : https://<vm>.<tailnet>.ts.net
   ```

## 7. Configurer GitHub

| Nom | Type | Niveau | Valeur |
|---|---|---|---|
| `STAGING_ENABLED` | variable | dépôt | `true` |
| `STAGING_HOST` | variable | environnement `staging` | `<vm>.<tailnet>.ts.net` (sans `https://`) |
| `STAGING_KUBECONFIG` | secret | environnement `staging` | sortie de `sudo base64 -w0 /etc/rancher/k3s/k3s.yaml` dans la VM |

Pour `STAGING_KUBECONFIG`, on garde `127.0.0.1` : le runner tourne sur la même machine que k3s.

## 8. Vérifier

1. Pousser un commit sur `main` : le job « Déploiement staging » s'exécute sur `nas-staging` et se termine
   par le smoke test.
2. Ouvrir `https://<vm>.<tailnet>.ts.net` : le front affiche tous les services « Disponible ».
3. En cas d'échec, tester la route depuis la VM :
   ```bash
   curl -H "Host: <vm>.<tailnet>.ts.net" http://localhost/api/status
   ```
   Si cette commande répond mais pas l'URL publique, le problème vient du tunnel, pas du cluster.

## Exploitation

- **Ressources** : `kubectl top nodes`. Le stack consomme environ 5 Go ; ne pas descendre la VM sous 6 Go.
- **Sauvegarde** : un instantané de la VM dans Virtual Machine Manager avant chaque mise à jour d'Ubuntu ou
  de k3s, plus une tâche Hyper Backup de la VM (continuité, §17 du CDC).
- **Mise à jour de k3s** : relancer la commande d'installation ; les données des volumes sont conservées.
- **Production** : le workflow `release.yml` cible un second cluster. Sur le même NAS, il faudrait une
  seconde VM avec son propre runner (label `production`).
