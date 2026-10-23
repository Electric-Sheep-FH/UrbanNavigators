import type { DisruptionSnapshot } from '../../domain/disruption';
import type { Clock } from '../ports/clock.port';
import type { DisruptionRepository } from '../ports/disruption-repository.port';

/** Port d'entrée : perturbations visibles des voyageurs à l'instant présent. */
export class ListActiveDisruptionsUseCase {
  constructor(
    private readonly repository: DisruptionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<DisruptionSnapshot[]> {
    const disruptions = await this.repository.findActiveAt(this.clock.now());
    return disruptions.map((disruption) => disruption.toSnapshot());
  }
}
