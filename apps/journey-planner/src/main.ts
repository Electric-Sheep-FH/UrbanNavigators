import '@un/observability/register';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // Kubernetes envoie SIGTERM avant d'arrêter le pod : on termine proprement les requêtes en cours.
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`journey-planner à l'écoute sur le port ${port}`, 'Bootstrap');
}

void bootstrap();
