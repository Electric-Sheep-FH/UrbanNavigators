import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseFilters } from '@nestjs/common';
import type { DisruptionView } from '@un/contracts';
import { DeclareDisruptionUseCase } from '../../../application/use-cases/declare-disruption.use-case';
import { ListActiveDisruptionsUseCase } from '../../../application/use-cases/list-active-disruptions.use-case';
import { PublishDisruptionUseCase } from '../../../application/use-cases/publish-disruption.use-case';
import { DomainErrorFilter } from './domain-error.filter';
import { toView } from './disruption.presenter';

/** Corps JSON reçu : non fiable, il est converti puis validé par le domaine. */
interface DeclareDisruptionRequest {
  lineIds?: unknown;
  severity?: unknown;
  message?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
}

/** Adapter d'entrée HTTP : traduit les requêtes en appels de cas d'utilisation, sans aucune règle métier. */
@Controller('disruptions')
@UseFilters(DomainErrorFilter)
export class DisruptionsController {
  constructor(
    private readonly declareDisruption: DeclareDisruptionUseCase,
    private readonly publishDisruption: PublishDisruptionUseCase,
    private readonly listActiveDisruptions: ListActiveDisruptionsUseCase,
  ) {}

  @Post()
  async declare(@Body() body: DeclareDisruptionRequest): Promise<DisruptionView> {
    const snapshot = await this.declareDisruption.execute({
      lineIds: Array.isArray(body.lineIds) ? body.lineIds.map(String) : [],
      severity: String(body.severity ?? ''),
      message: String(body.message ?? ''),
      startsAt: toDate(body.startsAt),
      endsAt: body.endsAt == null ? null : toDate(body.endsAt),
    });
    return toView(snapshot);
  }

  @Post(':id/publication')
  @HttpCode(200)
  async publish(@Param('id', ParseUUIDPipe) id: string): Promise<DisruptionView> {
    return toView(await this.publishDisruption.execute(id));
  }

  @Get('active')
  async listActive(): Promise<DisruptionView[]> {
    return (await this.listActiveDisruptions.execute()).map(toView);
  }
}

function toDate(value: unknown): Date {
  return typeof value === 'string' || typeof value === 'number' ? new Date(value) : new Date(Number.NaN);
}
