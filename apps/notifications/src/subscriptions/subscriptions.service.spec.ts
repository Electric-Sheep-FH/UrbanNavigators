import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SubscriptionsRepository } from './subscriptions.repository';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [SubscriptionsService, SubscriptionsRepository],
    }).compile();
    service = moduleRef.get(SubscriptionsService);
  });

  it('retrouve les abonnés des lignes touchées par une perturbation', async () => {
    await service.subscribe('u1', { lineId: 'L1', channel: 'push' });
    await service.subscribe('u2', { lineId: 'L2', channel: 'email' });
    await service.subscribe('u3', { lineId: 'L3', channel: 'push' });

    const users = (await service.subscribersOf(['L1', 'L2'])).map((s) => s.userId);

    expect(users).toEqual(['u1', 'u2']);
  });

  it('refuse un abonnement en double', async () => {
    await service.subscribe('u1', { lineId: 'L1', channel: 'push' });

    await expect(service.subscribe('u1', { lineId: 'L1', channel: 'push' })).rejects.toThrow(ConflictException);
  });
});
