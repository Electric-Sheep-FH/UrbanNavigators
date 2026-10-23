import { Injectable } from '@nestjs/common';
import type { Subscription } from './subscription.model';

/** Accès aux données. En mémoire pour le squelette ; à remplacer par l'ORM sur la base "notifications". */
@Injectable()
export class SubscriptionsRepository {
  private readonly subscriptions = new Map<string, Subscription>();

  async findByUser(userId: string): Promise<Subscription[]> {
    return [...this.subscriptions.values()].filter((s) => s.userId === userId);
  }

  async findByLine(lineId: string): Promise<Subscription[]> {
    return [...this.subscriptions.values()].filter((s) => s.lineId === lineId);
  }

  async create(subscription: Subscription): Promise<Subscription> {
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const subscription = this.subscriptions.get(id);
    if (!subscription || subscription.userId !== userId) return false;
    return this.subscriptions.delete(id);
  }
}
