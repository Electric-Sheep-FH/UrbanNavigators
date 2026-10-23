import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateFavoriteDto } from './dto/create-favorite.dto';
import type { Favorite } from './favorite.model';
import { FavoritesRepository } from './favorites.repository';

/** Logique métier des favoris. */
@Injectable()
export class FavoritesService {
  constructor(private readonly repository: FavoritesRepository) {}

  list(userId: string): Promise<Favorite[]> {
    return this.repository.findByUser(userId);
  }

  async add(userId: string, dto: CreateFavoriteDto): Promise<Favorite> {
    const existing = await this.repository.findByUser(userId);
    if (existing.some((f) => f.kind === dto.kind && f.targetId === dto.targetId)) {
      throw new ConflictException('Ce favori existe déjà.');
    }
    return this.repository.create({ id: randomUUID(), userId, ...dto, createdAt: new Date() });
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!(await this.repository.delete(userId, id))) {
      throw new NotFoundException('Favori introuvable.');
    }
  }
}
