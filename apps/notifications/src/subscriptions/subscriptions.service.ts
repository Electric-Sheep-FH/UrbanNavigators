import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateSubscriptionDto } from './dto/create-subscription.dto';
import type { Subscription } from './subscription.model';
import { SubscriptionsRepository } from './subscriptions.repository';

/** Logique métier des abonnements aux alertes. */
@Injectable()
export class SubscriptionsService {
  constructor(private readonly repository: SubscriptionsRepository) {}

  list(userId: string): Promise<Subscription[]> {
    return this.repository.findByUser(userId);
  }

  async subscribe(userId: string, dto: CreateSubscriptionDto): Promise<Subscription> {
    const existing = await this.repository.findByUser(userId);
    if (existing.some((s) => s.lineId === dto.lineId && s.channel === dto.channel)) {
      throw new ConflictException('Abonnement déjà existant.');
    }
    return this.repository.create({ id: randomUUID(), userId, ...dto, createdAt: new Date() });
  }

  async unsubscribe(userId: string, id: string): Promise<void> {
    if (!(await this.repository.delete(userId, id))) {
      throw new NotFoundException('Abonnement introuvable.');
    }
  }

  /** Destinataires d'une alerte. Utilisé par le futur consommateur de l'événement DisruptionPublished. */
  async subscribersOf(lineIds: string[]): Promise<Subscription[]> {
    const results = await Promise.all(lineIds.map((lineId) => this.repository.findByLine(lineId)));
    return results.flat();
  }
}
