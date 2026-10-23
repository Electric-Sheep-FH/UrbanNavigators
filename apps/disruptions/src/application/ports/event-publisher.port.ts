import type { DisruptionPublished } from '../../domain/disruption';

export type DomainEvent = DisruptionPublished;

/** Port de sortie : diffusion des événements de domaine aux autres services. */
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EventPublisher');
