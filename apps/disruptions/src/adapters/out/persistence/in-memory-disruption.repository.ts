import type { DisruptionRepository } from '../../../application/ports/disruption-repository.port';
import { Disruption, type DisruptionSnapshot } from '../../../domain/disruption';

/** Adapter de sortie en mémoire : poste local sans base, et doublure des tests. */
export class InMemoryDisruptionRepository implements DisruptionRepository {
  private readonly snapshots = new Map<string, DisruptionSnapshot>();

  async save(disruption: Disruption): Promise<void> {
    this.snapshots.set(disruption.id, disruption.toSnapshot());
  }

  async findById(id: string): Promise<Disruption | null> {
    const snapshot = this.snapshots.get(id);
    return snapshot ? Disruption.restore(snapshot) : null;
  }

  async findActiveAt(date: Date): Promise<Disruption[]> {
    return [...this.snapshots.values()]
      .map((snapshot) => Disruption.restore(snapshot))
      .filter((disruption) => disruption.isActiveAt(date));
  }
}
