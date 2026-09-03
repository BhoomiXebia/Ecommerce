import { DomainEvent, AuditLogEvent } from '../types/DomainEvent';

/**
 * Repository interface for publishing domain events and audit logs.
 */
export interface IEventRepository {
  /**
   * Publish a domain event to the message broker.
   */
  publishDomainEvent(event: DomainEvent): Promise<void>;

  /**
   * Emit an audit log event.
   */
  emitAuditLog(event: AuditLogEvent): Promise<void>;
}
