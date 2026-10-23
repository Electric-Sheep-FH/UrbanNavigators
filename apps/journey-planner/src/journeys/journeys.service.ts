import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { PlanJourneyDto } from './dto/plan-journey.dto';
import type { Journey } from './journey.model';
import { OtpClient } from './otp.client';

/** Logique métier du calcul d'itinéraire. */
@Injectable()
export class JourneysService {
  private readonly logger = new Logger(JourneysService.name);

  constructor(private readonly otp: OtpClient) {}

  async plan(dto: PlanJourneyDto): Promise<Journey[]> {
    if (dto.from.lat === dto.to.lat && dto.from.lon === dto.to.lon) {
      throw new BadRequestException('Le départ et l’arrivée sont identiques.');
    }

    try {
      return await this.otp.plan({
        from: dto.from,
        to: dto.to,
        departAt: dto.departAt ? new Date(dto.departAt) : new Date(),
      });
    } catch (error) {
      // Dégradation contrôlée (ARC-003) : une panne d'OTP n'affecte que le calcul d'itinéraire.
      this.logger.error(`Calcul d'itinéraire impossible : ${error instanceof Error ? error.message : error}`);
      throw new ServiceUnavailableException("Le calcul d'itinéraire est momentanément indisponible.");
    }
  }
}
