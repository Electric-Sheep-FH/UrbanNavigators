import type { DisruptionSnapshot } from '../../domain/disruption';
import { DisruptionNotFoundError } from '../../domain/domain.errors';
import type { Clock } from '../ports/clock.port';
import type { DisruptionRepository } from '../ports/disruption-repository.port';
import type { EventPublisher } from '../ports/event-publisher.port';

/** Port d'entrée : publication d'une perturbation aux voyageurs et aux autres services. */
export class PublishDisruptionUseCase {
  constructor(
    private readonly repository: DisruptionRepository,
    private readonly publisher: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(id: string): Promise<DisruptionSnapshot> {
    const disruption = await this.repository.findById(id);
    if (!disruption) throw new DisruptionNotFoundError(id);

    const event = disruption.publish(this.clock.now());
    await this.repository.save(disruption);
    // TODO : l'enregistrement et l'envoi ne sont pas atomiques. Si le broker est indisponible ici,
    // l'événement est perdu. Solution prévue : outbox transactionnelle (ADR-005).
    await this.publisher.publish(event);

    return disruption.toSnapshot();
  }
}
