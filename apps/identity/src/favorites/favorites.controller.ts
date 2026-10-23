import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import type { Favorite } from './favorite.model';
import { FavoritesService } from './favorites.service';

// TODO : l'identifiant de l'utilisateur viendra du jeton OIDC, pas de l'URL (section 10.1 du CDC).
@Controller('users/:userId/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@Param('userId') userId: string): Promise<Favorite[]> {
    return this.favoritesService.list(userId);
  }

  @Post()
  add(@Param('userId') userId: string, @Body() dto: CreateFavoriteDto): Promise<Favorite> {
    return this.favoritesService.add(userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('userId') userId: string, @Param('id') id: string): Promise<void> {
    return this.favoritesService.remove(userId, id);
  }
}
