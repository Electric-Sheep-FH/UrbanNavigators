import { Test } from '@nestjs/testing';
import { VehiclePositionsRepository } from './vehicle-positions.repository';
import { VehiclePositionsService } from './vehicle-positions.service';

const FEED_TIME = new Date('2026-11-02T08:00:00Z');

describe('VehiclePositionsService', () => {
  let service: VehiclePositionsService;

  beforeEach(async () => {
    jest.useFakeTimers();
    const moduleRef = await Test.createTestingModule({
      providers: [VehiclePositionsService, VehiclePositionsRepository],
    }).compile();
    service = moduleRef.get(VehiclePositionsService);
  });

  afterEach(() => jest.useRealTimers());

  it('signale un flux indisponible tant que rien n’a été reçu', async () => {
    expect((await service.list()).feed).toEqual({ state: 'unavailable', sourceTimestamp: null, ageSeconds: null });
  });

  it('passe de "fresh" à "stale" après 60 secondes sans mise à jour', async () => {
    await service.ingest(
      [{ vehicleId: 'V1', tripId: 'T1', routeId: 'L1', lat: 48.85, lon: 2.35, recordedAt: FEED_TIME }],
      FEED_TIME,
    );

    jest.setSystemTime(new Date(FEED_TIME.getTime() + 30_000));
    expect((await service.list()).feed).toMatchObject({ state: 'fresh', ageSeconds: 30 });

    jest.setSystemTime(new Date(FEED_TIME.getTime() + 61_000));
    expect((await service.list()).feed).toMatchObject({ state: 'stale', ageSeconds: 61 });
  });

  it('filtre les positions par ligne', async () => {
    await service.ingest(
      [
        { vehicleId: 'V1', tripId: null, routeId: 'L1', lat: 48.85, lon: 2.35, recordedAt: FEED_TIME },
        { vehicleId: 'V2', tripId: null, routeId: 'L2', lat: 48.86, lon: 2.36, recordedAt: FEED_TIME },
      ],
      FEED_TIME,
    );

    expect((await service.list('L2')).positions.map((p) => p.vehicleId)).toEqual(['V2']);
  });
});
