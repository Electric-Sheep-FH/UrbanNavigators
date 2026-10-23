import { Injectable } from '@nestjs/common';
import { SERVICES, type PlatformStatus, type ServiceName } from '@un/contracts';

const PROBE_TIMEOUT_MS = 2000;

/** Agrège l'état des services métier : premier parcours de bout en bout du squelette. */
@Injectable()
export class StatusService {
  async getStatus(): Promise<PlatformStatus> {
    const targets = SERVICES.filter((service) => service !== 'gateway-bff');
    const services = await Promise.all(targets.map((service) => this.probe(service)));
    return {
      status: services.every((s) => s.status === 'up') ? 'up' : 'degraded',
      services,
    };
  }

  private async probe(service: ServiceName): Promise<PlatformStatus['services'][number]> {
    const started = Date.now();
    try {
      const res = await fetch(`${serviceUrl(service)}/health/ready`, {
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });
      return { service, status: res.ok ? 'up' : 'down', latencyMs: Date.now() - started };
    } catch {
      return { service, status: 'down', latencyMs: null };
    }
  }
}

/**
 * URL interne d'un service : variable IDENTITY_URL, MOBILITY_DATA_URL...
 * Par défaut, le nom DNS du service, identique sous Docker Compose et Kubernetes.
 */
export function serviceUrl(service: ServiceName): string {
  const key = `${service.toUpperCase().replaceAll('-', '_')}_URL`;
  return process.env[key] ?? `http://${service}:3000`;
}
