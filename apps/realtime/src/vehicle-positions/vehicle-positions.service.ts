import { Injectable } from '@nestjs/common';
import type { FeedFreshness, VehiclePosition, VehiclePositionsResponse } from './vehicle-position.model';
import { VehiclePositionsRepository } from './vehicle-positions.repository';

/** Au-delà de ce délai, le flux est signalé comme périmé et une alerte se déclenche (RT-002). */
export const STALE_AFTER_SECONDS = 60;

/** Logique métier des positions de véhicules. */
@Injectable()
export class VehiclePositionsService {
  constructor(private readonly repository: VehiclePositionsRepository) {}

  /** Appelé par le futur collecteur GTFS-RT à chaque lecture du flux opérateur. */
  ingest(positions: VehiclePosition[], feedTimestamp: Date): Promise<void> {
    return this.repository.replaceSnapshot(positions, feedTimestamp);
  }

  async list(routeId?: string): Promise<VehiclePositionsResponse> {
    const [positions, sourceTimestamp] = await Promise.all([
      this.repository.findAll(routeId),
      this.repository.lastFeedTimestamp(),
    ]);
    return { feed: freshnessOf(sourceTimestamp), positions };
  }
}

function freshnessOf(sourceTimestamp: Date | null): FeedFreshness {
  if (!sourceTimestamp) return { state: 'unavailable', sourceTimestamp: null, ageSeconds: null };

  const ageSeconds = Math.max(0, Math.round((Date.now() - sourceTimestamp.getTime()) / 1000));
  return { state: ageSeconds <= STALE_AFTER_SECONDS ? 'fresh' : 'stale', sourceTimestamp, ageSeconds };
}
