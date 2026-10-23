import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@un/contracts';

const SERVICE_NAME = 'disruptions';

/** Sondes Kubernetes : liveness (le process tourne) et readiness (le service peut recevoir du trafic). */
@Controller('health')
export class HealthController {
  @Get('live')
  live(): HealthStatus {
    return this.status();
  }

  @Get('ready')
  ready(): HealthStatus {
    // TODO : vérifier ici les dépendances indispensables du service (base, broker...).
    return this.status();
  }

  private status(): HealthStatus {
    return {
      service: SERVICE_NAME,
      status: 'up',
      version: process.env.APP_VERSION ?? 'dev',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
