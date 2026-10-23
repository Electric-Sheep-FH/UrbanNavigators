/** Erreur métier. Le domaine ignore HTTP : c'est l'adapter d'entrée qui choisit le code de réponse. */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidDisruptionError extends DomainError {
  readonly code = 'INVALID_DISRUPTION';
}

export class InvalidTransitionError extends DomainError {
  readonly code = 'INVALID_TRANSITION';
}

export class DisruptionNotFoundError extends DomainError {
  readonly code = 'DISRUPTION_NOT_FOUND';

  constructor(id: string) {
    super(`Perturbation ${id} introuvable.`);
  }
}
