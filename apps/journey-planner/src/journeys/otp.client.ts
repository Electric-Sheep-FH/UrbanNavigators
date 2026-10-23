import { Injectable } from '@nestjs/common';
import type { Journey, JourneyRequest } from './journey.model';

/** Accès aux données : le moteur OpenTripPlanner joue ici le rôle de source de données. */
@Injectable()
export class OtpClient {
  private readonly baseUrl = process.env.OTP_URL;

  async plan(_request: JourneyRequest): Promise<Journey[]> {
    if (!this.baseUrl) throw new Error('OTP_URL non configurée.');
    // TODO (JNY-001/002) : requête GraphQL vers l'API GTFS d'OTP (`${this.baseUrl}/otp/gtfs/v1`),
    // avec un délai maximal, puis conversion de la réponse vers le modèle Journey.
    throw new Error('Intégration OpenTripPlanner pas encore implémentée.');
  }
}
