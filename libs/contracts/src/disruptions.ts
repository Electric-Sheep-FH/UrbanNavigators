export type DisruptionSeverity = 'info' | 'warning' | 'severe';
export type DisruptionStatus = 'draft' | 'published' | 'closed';

/** Représentation HTTP d'une perturbation (réponses de l'API disruptions). */
export interface DisruptionView {
  id: string;
  lineIds: string[];
  severity: DisruptionSeverity;
  message: string;
  status: DisruptionStatus;
  startsAt: string;
  endsAt: string | null;
  publishedAt: string | null;
}

/** Charge utile de l'événement disruptions.disruption.published.v1. */
export interface DisruptionPublishedPayload {
  disruptionId: string;
  lineIds: string[];
  severity: DisruptionSeverity;
  message: string;
  startsAt: string;
  endsAt: string | null;
}
