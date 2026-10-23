import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | undefined;

/**
 * Démarre OpenTelemetry (traces, métriques, logs) si un collecteur est configuré.
 * Tout se règle par les variables standard : OTEL_SERVICE_NAME, OTEL_EXPORTER_OTLP_ENDPOINT, etc.
 * Sans OTEL_EXPORTER_OTLP_ENDPOINT (tests, poste local), rien n'est démarré.
 */
export function startTelemetry(): NodeSDK | undefined {
  if (sdk || !process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return sdk;

  sdk = new NodeSDK({
    instrumentations: [
      getNodeAutoInstrumentations({
        // Très bavarde et sans intérêt pour nos services.
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
  sdk.start();

  // Vide les derniers spans avant l'arrêt du pod.
  process.once('SIGTERM', () => {
    void sdk?.shutdown();
  });
  return sdk;
}
