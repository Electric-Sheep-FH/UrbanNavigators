/** Modèle : dernière position connue d'un véhicule (GTFS-RT VehiclePositions). */
export interface VehiclePosition {
  vehicleId: string;
  tripId: string | null;
  routeId: string;
  lat: number;
  lon: number;
  recordedAt: Date;
}

export type FeedState = 'fresh' | 'stale' | 'unavailable';

/** Fraîcheur du flux temps réel, exposée dans chaque réponse (RT-002). */
export interface FeedFreshness {
  state: FeedState;
  sourceTimestamp: Date | null;
  ageSeconds: number | null;
}

export interface VehiclePositionsResponse {
  feed: FeedFreshness;
  positions: VehiclePosition[];
}
