import { Module } from '@nestjs/common';
import { DisruptionsController } from './adapters/in/http/disruptions.controller';
import { SystemClock } from './adapters/out/clock/system-clock';
import { LoggingEventPublisher } from './adapters/out/messaging/logging-event-publisher';
import { RabbitMqEventPublisher } from './adapters/out/messaging/rabbitmq-event-publisher';
import { InMemoryDisruptionRepository } from './adapters/out/persistence/in-memory-disruption.repository';
import { PostgresDisruptionRepository } from './adapters/out/persistence/postgres-disruption.repository';
import { CLOCK, type Clock } from './application/ports/clock.port';
import { DISRUPTION_REPOSITORY, type DisruptionRepository } from './application/ports/disruption-repository.port';
import { EVENT_PUBLISHER, type EventPublisher } from './application/ports/event-publisher.port';
import { DeclareDisruptionUseCase } from './application/use-cases/declare-disruption.use-case';
import { ListActiveDisruptionsUseCase } from './application/use-cases/list-active-disruptions.use-case';
import { PublishDisruptionUseCase } from './application/use-cases/publish-disruption.use-case';

/**
 * Racine de composition : seul endroit où l'on choisit quel adapter branche chaque port.
 * Sans DATABASE_URL ni AMQP_URL, le service tourne entièrement en mémoire.
 */
@Module({
  controllers: [DisruptionsController],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: DISRUPTION_REPOSITORY,
      useFactory: (): DisruptionRepository =>
        process.env.DATABASE_URL
          ? new PostgresDisruptionRepository(process.env.DATABASE_URL)
          : new InMemoryDisruptionRepository(),
    },
    {
      provide: EVENT_PUBLISHER,
      useFactory: (): EventPublisher =>
        process.env.AMQP_URL ? new RabbitMqEventPublisher(process.env.AMQP_URL) : new LoggingEventPublisher(),
    },
    {
      provide: DeclareDisruptionUseCase,
      useFactory: (repository: DisruptionRepository, clock: Clock) => new DeclareDisruptionUseCase(repository, clock),
      inject: [DISRUPTION_REPOSITORY, CLOCK],
    },
    {
      provide: PublishDisruptionUseCase,
      useFactory: (repository: DisruptionRepository, publisher: EventPublisher, clock: Clock) =>
        new PublishDisruptionUseCase(repository, publisher, clock),
      inject: [DISRUPTION_REPOSITORY, EVENT_PUBLISHER, CLOCK],
    },
    {
      provide: ListActiveDisruptionsUseCase,
      useFactory: (repository: DisruptionRepository, clock: Clock) => new ListActiveDisruptionsUseCase(repository, clock),
      inject: [DISRUPTION_REPOSITORY, CLOCK],
    },
  ],
})
export class DisruptionsModule {}
