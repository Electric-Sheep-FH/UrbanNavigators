import { Injectable } from '@nestjs/common';
import type { Favorite } from './favorite.model';

/** Accès aux données. En mémoire pour le squelette ; à remplacer par l'ORM sur la base "identity". */
@Injectable()
export class FavoritesRepository {
  private readonly favorites = new Map<string, Favorite>();

  async findByUser(userId: string): Promise<Favorite[]> {
    return [...this.favorites.values()].filter((favorite) => favorite.userId === userId);
  }

  async create(favorite: Favorite): Promise<Favorite> {
    this.favorites.set(favorite.id, favorite);
    return favorite;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const favorite = this.favorites.get(id);
    if (!favorite || favorite.userId !== userId) return false;
    return this.favorites.delete(id);
  }
}
