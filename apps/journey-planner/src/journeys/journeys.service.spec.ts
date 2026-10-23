import { BadRequestException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Journey } from './journey.model';
import { JourneysService } from './journeys.service';
import { OtpClient } from './otp.client';

const GARE = { lat: 48.8443, lon: 2.3744 };
const UNIVERSITE = { lat: 48.8462, lon: 2.3447 };

describe('JourneysService', () => {
  const otp = { plan: jest.fn<Promise<Journey[]>, Parameters<OtpClient['plan']>>() };
  let service: JourneysService;

  beforeEach(async () => {
    otp.plan.mockReset();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [JourneysService, { provide: OtpClient, useValue: otp }],
    }).compile();
    service = moduleRef.get(JourneysService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('transmet la demande au moteur d’itinéraires', async () => {
    otp.plan.mockResolvedValue([]);

    await service.plan({ from: GARE, to: UNIVERSITE, departAt: '2026-11-02T08:00:00Z' });

    expect(otp.plan).toHaveBeenCalledWith({
      from: GARE,
      to: UNIVERSITE,
      departAt: new Date('2026-11-02T08:00:00Z'),
    });
  });

  it('répond 503 si le moteur est en panne (dégradation contrôlée)', async () => {
    otp.plan.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.plan({ from: GARE, to: UNIVERSITE })).rejects.toThrow(ServiceUnavailableException);
  });

  it('refuse un départ identique à l’arrivée', async () => {
    await expect(service.plan({ from: GARE, to: GARE })).rejects.toThrow(BadRequestException);
    expect(otp.plan).not.toHaveBeenCalled();
  });
});
