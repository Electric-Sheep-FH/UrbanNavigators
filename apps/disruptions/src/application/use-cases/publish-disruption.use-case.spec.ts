import { InMemoryDisruptionRepository } from '../../adapters/out/persistence/in-memory-disruption.repository';
import { DisruptionNotFoundError } from '../../domain/domain.errors';
import type { Clock } from '../ports/clock.port';
import type { DomainEvent, EventPublisher } from '../ports/event-publisher.port';
import { DeclareDisruptionUseCase } from './declare-disruption.use-case';
import { ListActiveDisruptionsUseCase } from './list-active-disruptions.use-case';
import { PublishDisruptionUseCase } from './publish-disruption.use-case';

/** Les ports sont remplacés par des doublures : aucun framework, aucune base, aucun broker. */
class RecordingPublisher implements EventPublisher {
  readonly events: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.events.push(event);
  }
}

const clock: Clock = { now: () => new Date('2026-11-02T08:00:00Z') };

describe('Publication d’une perturbation', () => {
  let repository: InMemoryDisruptionRepository;
  let publisher: RecordingPublisher;
  let publish: PublishDisruptionUseCase;

  beforeEach(() => {
    repository = new InMemoryDisruptionRepository();
    publisher = new RecordingPublisher();
    publish = new PublishDisruptionUseCase(repository, publisher, clock);
  });

  async function declareDraft(): Promise<string> {
    const draft = await new DeclareDisruptionUseCase(repository, clock).execute({
      lineIds: ['L1'],
      severity: 'severe',
      message: 'Ligne 1 interrompue : bus de substitution.',
      startsAt: new Date('2026-11-02T07:00:00Z'),
    });
    return draft.id;
  }

  it('enregistre la publication et émet l’événement', async () => {
    const id = await declareDraft();

    const published = await publish.execute(id);

    expect(published.status).toBe('published');
    expect(publisher.events).toEqual([expect.objectContaining({ type: 'DisruptionPublished', disruptionId: id })]);
    expect(await new ListActiveDisruptionsUseCase(repository, clock).execute()).toHaveLength(1);
  });

  it('signale une perturbation inconnue sans rien émettre', async () => {
    await expect(publish.execute('inconnue')).rejects.toThrow(DisruptionNotFoundError);
    expect(publisher.events).toHaveLength(0);
  });
});
