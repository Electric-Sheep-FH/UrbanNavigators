import type { Disruption } from '../../domain/disruption';

/** Port de sortie : ce dont l'application a besoin pour conserver les perturbations, sans dire comment. */
export interface DisruptionRepository {
  save(disruption: Disruption): Promise<void>;
  findById(id: string): Promise<Disruption | null>;
  findActiveAt(date: Date): Promise<Disruption[]>;
}

export const DISRUPTION_REPOSITORY = Symbol('DisruptionRepository');
