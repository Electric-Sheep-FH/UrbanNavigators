# Données OpenTripPlanner

Déposer ici (fichiers ignorés par git) :

- le GTFS de l'opérateur, par exemple `reseau.gtfs.zip` (le nom doit contenir `gtfs`) ;
- un extrait OpenStreetMap de la zone, par exemple `ile-de-france.osm.pbf` (téléchargeable sur Geofabrik).

Puis lancer : `docker compose --profile otp up opentripplanner`.
La construction du graphe prend plusieurs minutes ; l'interface de debug OTP est ensuite sur http://localhost:8090.
