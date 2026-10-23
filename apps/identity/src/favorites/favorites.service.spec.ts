import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FavoritesRepository } from './favorites.repository';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [FavoritesService, FavoritesRepository],
    }).compile();
    service = moduleRef.get(FavoritesService);
  });

  it('ajoute un favori et le liste pour son seul propriétaire', async () => {
    await service.add('u1', { kind: 'stop', targetId: 'S1', label: 'Maison' });

    expect(await service.list('u1')).toEqual([expect.objectContaining({ targetId: 'S1' })]);
    expect(await service.list('u2')).toEqual([]);
  });

  it('refuse un doublon', async () => {
    await service.add('u1', { kind: 'line', targetId: 'L1', label: 'Ligne 1' });

    await expect(service.add('u1', { kind: 'line', targetId: 'L1', label: 'Encore' })).rejects.toThrow(
      ConflictException,
    );
  });

  it("ne supprime pas le favori d'un autre utilisateur", async () => {
    const favorite = await service.add('u1', { kind: 'stop', targetId: 'S1', label: 'Maison' });

    await expect(service.remove('u2', favorite.id)).rejects.toThrow(NotFoundException);
  });
});
