import amqplib, { Channel, Connection } from 'amqplib';
import { IEventRepository } from '../repositories/IEventRepository';
import { DomainEvent, AuditLogEvent } from '../types/DomainEvent';

/**
 * RabbitMQ-based implementation of IEventRepository.
 * Publishes domain events and audit logs to message broker.
 */
export class RabbitMQEventRepository implements IEventRepository {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private domainEventExchange = 'identity-domain-events';
  private auditLogExchange = 'identity-audit-logs';

  constructor(
    private rabbitMQUrl: string = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost'
  ) {}

  /**
   * Initialize RabbitMQ connection and channels.
   */
  async initialize(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.rabbitMQUrl);
      this.channel = await this.connection.createChannel();

      // Declare exchanges
      await this.channel.assertExchange(
        this.domainEventExchange,
        'topic',
        { durable: true }
      );
      await this.channel.assertExchange(
        this.auditLogExchange,
        'topic',
        { durable: true }
      );
    } catch (error) {
      throw new Error(
        `Failed to initialize RabbitMQ: ${(error as Error).message}`
      );
    }
  }

  /**
   * Publish a domain event to the message broker.
   */
  async publishDomainEvent(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const routingKey = event.eventType.toLowerCase();
    const message = Buffer.from(JSON.stringify(event));

    this.channel.publish(
      this.domainEventExchange,
      routingKey,
      message,
      { persistent: true }
    );
  }

  /**
   * Emit an audit log event.
   */
  async emitAuditLog(event: AuditLogEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const routingKey = event.action.toLowerCase();
    const message = Buffer.from(JSON.stringify(event));

    this.channel.publish(
      this.auditLogExchange,
      routingKey,
      message,
      { persistent: true }
    );
  }

  /**
   * Close RabbitMQ connection.
   */
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
