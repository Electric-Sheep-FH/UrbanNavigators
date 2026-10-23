/** Port de sortie : l'heure courante. Injectée pour rendre les règles temporelles testables. */
export interface Clock {
  now(): Date;
}

export const CLOCK = Symbol('Clock');
