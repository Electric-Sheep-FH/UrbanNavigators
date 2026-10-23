import { randomUUID } from 'node:crypto';
import { Disruption, type DisruptionSnapshot } from '../../domain/disruption';
import type { Clock } from '../ports/clock.port';
import type { DisruptionRepository } from '../ports/disruption-repository.port';

export interface DeclareDisruptionCommand {
  lineIds: string[];
  severity: string;
  message: string;
  startsAt: Date;
  endsAt?: Date | null;
}

/** Port d'entrée : un exploitant déclare une perturbation, enregistrée en brouillon. */
export class DeclareDisruptionUseCase {
  constructor(
    private readonly repository: DisruptionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: DeclareDisruptionCommand): Promise<DisruptionSnapshot> {
    const disruption = Disruption.declare({ id: randomUUID(), ...command }, this.clock.now());
    await this.repository.save(disruption);
    return disruption.toSnapshot();
  }
}
