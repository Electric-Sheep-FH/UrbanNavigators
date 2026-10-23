import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PlanJourneyDto } from './dto/plan-journey.dto';
import type { Journey } from './journey.model';
import { JourneysService } from './journeys.service';

@Controller('journeys')
export class JourneysController {
  constructor(private readonly journeysService: JourneysService) {}

  /** POST car la recherche transporte un corps structuré ; elle ne crée aucune ressource. */
  @Post()
  @HttpCode(200)
  plan(@Body() dto: PlanJourneyDto): Promise<Journey[]> {
    return this.journeysService.plan(dto);
  }
}
