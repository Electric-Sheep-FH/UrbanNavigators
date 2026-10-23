import { InvalidDisruptionError, InvalidTransitionError } from './domain.errors';

export type Severity = 'info' | 'warning' | 'severe';
export type DisruptionStatus = 'draft' | 'published' | 'closed';

const SEVERITIES: readonly string[] = ['info', 'warning', 'severe'];

/** Message court, lisible sur un écran d'arrêt comme par un lecteur d'écran (A11Y-002). */
const MESSAGE_MAX_LENGTH = 280;

/** État complet d'une perturbation, tel que les adapters de persistance le stockent. */
export interface DisruptionSnapshot {
  id: string;
  lineIds: string[];
  severity: Severity;
  message: string;
  status: DisruptionStatus;
  startsAt: Date;
  endsAt: Date | null;
  declaredAt: Date;
  publishedAt: Date | null;
}

export interface DeclareDisruptionInput {
  id: string;
  lineIds: string[];
  severity: string;
  message: string;
  startsAt: Date;
  endsAt?: Date | null;
}

/** Événement de domaine émis à la publication. Le domaine ignore comment il sera transporté. */
export interface DisruptionPublished {
  type: 'DisruptionPublished';
  disruptionId: string;
  lineIds: string[];
  severity: Severity;
  message: string;
  startsAt: Date;
  endsAt: Date | null;
  occurredAt: Date;
}

/**
 * Agrégat Perturbation : un incident annoncé aux voyageurs sur une ou plusieurs lignes.
 * Cycle de vie : brouillon -> publiée -> clôturée. Toutes les règles sont ici, sans framework.
 */
export class Disruption {
  private constructor(private state: DisruptionSnapshot) {}

  static declare(input: DeclareDisruptionInput, now: Date): Disruption {
    const lineIds = [...new Set(input.lineIds.map((id) => id.trim()).filter(Boolean))];
    const message = input.message.trim();
    const endsAt = input.endsAt ?? null;

    if (lineIds.length === 0) {
      throw new InvalidDisruptionError('Une perturbation concerne au moins une ligne.');
    }
    if (!isSeverity(input.severity)) {
      throw new InvalidDisruptionError(`Gravité inconnue : ${input.severity}. Valeurs : ${SEVERITIES.join(', ')}.`);
    }
    if (message.length === 0 || message.length > MESSAGE_MAX_LENGTH) {
      throw new InvalidDisruptionError(`Le message doit faire entre 1 et ${MESSAGE_MAX_LENGTH} caractères.`);
    }
    if (!isValidDate(input.startsAt) || (endsAt !== null && !isValidDate(endsAt))) {
      throw new InvalidDisruptionError('Dates de début ou de fin invalides.');
    }
    if (endsAt !== null && endsAt <= input.startsAt) {
      throw new InvalidDisruptionError('La fin doit être postérieure au début.');
    }

    return new Disruption({
      id: input.id,
      lineIds,
      severity: input.severity,
      message,
      status: 'draft',
      startsAt: input.startsAt,
      endsAt,
      declaredAt: now,
      publishedAt: null,
    });
  }

  /** Reconstruit l'agrégat depuis le stockage, sans rejouer les validations de création. */
  static restore(snapshot: DisruptionSnapshot): Disruption {
    return new Disruption({ ...snapshot, lineIds: [...snapshot.lineIds] });
  }

  get id(): string {
    return this.state.id;
  }

  publish(now: Date): DisruptionPublished {
    if (this.state.status !== 'draft') {
      throw new InvalidTransitionError(
        `Seule une perturbation en brouillon peut être publiée (statut actuel : ${this.state.status}).`,
      );
    }
    if (this.state.endsAt !== null && this.state.endsAt <= now) {
      throw new InvalidTransitionError('Cette perturbation est déjà terminée : inutile de la publier.');
    }

    this.state = { ...this.state, status: 'published', publishedAt: now };
    return {
      type: 'DisruptionPublished',
      disruptionId: this.state.id,
      lineIds: [...this.state.lineIds],
      severity: this.state.severity,
      message: this.state.message,
      startsAt: this.state.startsAt,
      endsAt: this.state.endsAt,
      occurredAt: now,
    };
  }

  /** Visible des voyageurs : publiée et dans sa période d'application. */
  isActiveAt(date: Date): boolean {
    const { status, startsAt, endsAt } = this.state;
    return status === 'published' && startsAt <= date && (endsAt === null || endsAt > date);
  }

  toSnapshot(): DisruptionSnapshot {
    return { ...this.state, lineIds: [...this.state.lineIds] };
  }
}

function isSeverity(value: string): value is Severity {
  return SEVERITIES.includes(value);
}

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
