import type { ServiceName } from './services';

/** Exchange RabbitMQ (topic) sur lequel sont publiés les événements métier (ADR-005). */
export const EVENTS_EXCHANGE = 'urbannavigators.events';

/**
 * Clés de routage des événements métier. Le suffixe de version (v1, v2...) est obligatoire :
 * un changement incompatible crée une nouvelle clé (ARC-002).
 */
export const EVENTS = {
  GtfsVersionActivated: 'mobility-data.gtfs.version-activated.v1',
  RealtimeFeedStale: 'realtime.feed.stale.v1',
  DisruptionPublished: 'disruptions.disruption.published.v1',
  VehicleServiceStatusChanged: 'disruptions.vehicle.service-status-changed.v1',
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];

/** Enveloppe commune à tous les messages publiés sur le broker. */
export interface EventEnvelope<TPayload> {
  /** Identifiant unique, utilisé par les consommateurs pour l'idempotence. */
  id: string;
  type: EventType;
  occurredAt: string;
  source: ServiceName;
  correlationId?: string;
  payload: TPayload;
}
