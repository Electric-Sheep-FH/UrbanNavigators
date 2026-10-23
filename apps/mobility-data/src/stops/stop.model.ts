/** Modèle : un arrêt du feed GTFS actif (stops.txt). */
export interface Stop {
  /** stop_id GTFS, conservé d'une version de feed à l'autre (DATA-003). */
  id: string;
  name: string;
  lat: number;
  lon: number;
  wheelchairBoarding: boolean;
}
