import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { StopsRepository } from './stops.repository';
import { StopsService } from './stops.service';

describe('StopsService', () => {
  let service: StopsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [StopsService, StopsRepository],
    }).compile();
    service = moduleRef.get(StopsService);
  });

  it('ignore la casse et les accents', async () => {
    expect(await service.search('HOTEL')).toEqual([expect.objectContaining({ id: 'S002' })]);
  });

  it('renvoie plusieurs arrêts correspondants', async () => {
    const names = (await service.search('gare')).map((stop) => stop.name);

    expect(names).toEqual(['Gare Centrale', 'Gare du Nord']);
  });

  it('signale un arrêt inconnu', async () => {
    await expect(service.findOne('inconnu')).rejects.toThrow(NotFoundException);
  });
});
