/**
 * Domain event base type.
 */
export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string; // User ID
  timestamp: number;
  version: number;
}

/**
 * User registered domain event.
 */
export interface UserRegisteredEvent extends DomainEvent {
  eventType: 'UserRegistered';
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Password reset requested domain event.
 */
export interface PasswordResetRequestedEvent extends DomainEvent {
  eventType: 'PasswordResetRequested';
  email: string;
}

/**
 * Audit log event for tracking authentication actions.
 */
export interface AuditLogEvent {
  eventId: string;
  userId?: string;
  action: 'USER_REGISTERED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_RESET_REQUESTED' | 'PASSWORD_RESET_CONFIRMED' | 'TOKEN_REFRESHED' | 'PROFILE_UPDATED';
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  details?: Record<string, unknown>;
  timestamp: number;
}
