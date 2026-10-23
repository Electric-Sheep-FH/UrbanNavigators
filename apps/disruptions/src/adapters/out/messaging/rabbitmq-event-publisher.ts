import { Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { EVENTS, EVENTS_EXCHANGE, type DisruptionPublishedPayload, type EventEnvelope } from '@un/contracts';
import { connect, type ChannelModel, type ConfirmChannel } from 'amqplib';
import { randomUUID } from 'node:crypto';
import type { DomainEvent, EventPublisher } from '../../../application/ports/event-publisher.port';

/** Adapter de sortie RabbitMQ : traduit les événements de domaine en messages versionnés (ADR-005). */
export class RabbitMqEventPublisher implements EventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqEventPublisher.name);
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;

  constructor(private readonly url: string) {}

  async onModuleInit(): Promise<void> {
    this.connection = await connect(this.url);
    this.connection.on('error', (error: Error) => this.logger.error(`Connexion RabbitMQ : ${error.message}`));
    // Canal "confirm" : le broker accuse réception de chaque message (publisher confirms).
    this.channel = await this.connection.createConfirmChannel();
    await this.channel.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) throw new Error('Canal RabbitMQ non initialisé.');

    const envelope = toEnvelope(event);
    this.channel.publish(EVENTS_EXCHANGE, envelope.type, Buffer.from(JSON.stringify(envelope)), {
      persistent: true,
      messageId: envelope.id,
      type: envelope.type,
      contentType: 'application/json',
      timestamp: Math.floor(event.occurredAt.getTime() / 1000),
    });
    await this.channel.waitForConfirms();
  }
}

function toEnvelope(event: DomainEvent): EventEnvelope<DisruptionPublishedPayload> {
  return {
    id: randomUUID(),
    type: EVENTS.DisruptionPublished,
    occurredAt: event.occurredAt.toISOString(),
    source: 'disruptions',
    payload: {
      disruptionId: event.disruptionId,
      lineIds: event.lineIds,
      severity: event.severity,
      message: event.message,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
    },
  };
}
