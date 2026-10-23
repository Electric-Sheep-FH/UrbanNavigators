import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { FavoritesModule } from './favorites/favorites.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [FavoritesModule],
  controllers: [HealthController],
  providers: [
    // Valide tous les DTO entrants et retire les champs non déclarés.
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, transform: true }) },
  ],
})
export class AppModule {}
