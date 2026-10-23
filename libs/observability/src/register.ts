// À importer en toute première ligne du main.ts : l'instrumentation doit précéder le chargement d'Express.
import { startTelemetry } from './index';

startTelemetry();
