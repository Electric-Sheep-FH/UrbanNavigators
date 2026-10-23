import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('répond "up" sur la sonde de vivacité', () => {
    expect(controller.live()).toMatchObject({ service: 'notifications', status: 'up' });
  });

  it('répond "up" sur la sonde de disponibilité', () => {
    expect(controller.ready()).toMatchObject({ service: 'notifications', status: 'up' });
  });
});
