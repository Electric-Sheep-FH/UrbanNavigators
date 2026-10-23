import { Injectable } from '@nestjs/common';
import type { VehiclePosition } from './vehicle-position.model';

/**
 * Accès aux données : dernier instantané du flux, compacté par véhicule (RT-003).
 * En mémoire pour le squelette ; à remplacer par Redis avec TTL (ADR-006).
 */
@Injectable()
export class VehiclePositionsRepository {
  private positions = new Map<string, VehiclePosition>();
  private feedTimestamp: Date | null = null;

  async replaceSnapshot(positions: VehiclePosition[], feedTimestamp: Date): Promise<void> {
    this.positions = new Map(positions.map((position) => [position.vehicleId, position]));
    this.feedTimestamp = feedTimestamp;
  }

  async findAll(routeId?: string): Promise<VehiclePosition[]> {
    const all = [...this.positions.values()];
    return routeId ? all.filter((position) => position.routeId === routeId) : all;
  }

  async lastFeedTimestamp(): Promise<Date | null> {
    return this.feedTimestamp;
  }
}
