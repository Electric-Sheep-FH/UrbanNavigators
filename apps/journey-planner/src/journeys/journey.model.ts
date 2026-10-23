export interface Coordinates {
  lat: number;
  lon: number;
}

export interface JourneyRequest {
  from: Coordinates;
  to: Coordinates;
  departAt: Date;
}

export type LegMode = 'walk' | 'bus' | 'tram' | 'metro' | 'rail';

/** Une étape : un trajet à pied ou dans un véhicule. */
export interface Leg {
  mode: LegMode;
  routeShortName: string | null;
  fromName: string;
  toName: string;
  departureTime: Date;
  arrivalTime: Date;
}

/**
 * Modèle d'itinéraire propre à Urban Navigators. Il ne reprend pas le schéma GraphQL d'OTP :
 * les clients ne dépendent jamais d'OTP directement (JNY-002).
 */
export interface Journey {
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  transfers: number;
  legs: Leg[];
}
