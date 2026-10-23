import type { DisruptionView } from '@un/contracts';
import type { DisruptionSnapshot } from '../../../domain/disruption';

/** Convertit l'état du domaine en contrat d'API : le domaine peut évoluer sans casser les clients (ARC-002). */
export function toView(snapshot: DisruptionSnapshot): DisruptionView {
  return {
    id: snapshot.id,
    lineIds: snapshot.lineIds,
    severity: snapshot.severity,
    message: snapshot.message,
    status: snapshot.status,
    startsAt: snapshot.startsAt.toISOString(),
    endsAt: snapshot.endsAt?.toISOString() ?? null,
    publishedAt: snapshot.publishedAt?.toISOString() ?? null,
  };
}
