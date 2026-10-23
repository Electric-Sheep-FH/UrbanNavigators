import type { ServiceName } from './services';

export type HealthState = 'up' | 'down';

/** Réponse des sondes /health/live et /health/ready de chaque service. */
export interface HealthStatus {
  service: string;
  status: HealthState;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

/** Vue agrégée exposée par la gateway sur GET /api/status. */
export interface PlatformStatus {
  status: 'up' | 'degraded';
  services: Array<{
    service: ServiceName;
    status: HealthState;
    latencyMs: number | null;
  }>;
}
