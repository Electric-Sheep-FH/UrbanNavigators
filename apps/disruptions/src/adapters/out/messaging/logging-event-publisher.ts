import { Logger } from '@nestjs/common';
import type { DomainEvent, EventPublisher } from '../../../application/ports/event-publisher.port';

/** Adapter de sortie de repli, sans broker (poste local) : les événements sont seulement journalisés. */
export class LoggingEventPublisher implements EventPublisher {
  private readonly logger = new Logger('DomainEvents');

  async publish(event: DomainEvent): Promise<void> {
    this.logger.log(`${event.type} ${JSON.stringify(event)}`);
  }
}
