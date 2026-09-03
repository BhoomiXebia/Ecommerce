/**
 * Authentication strategy interface for extensible auth mechanisms.
 */
export interface IAuthStrategy {
  authenticate(credentials: Record<string, unknown>): Promise<{ userId: string; email: string }>;
}

/**
 * Email/password authentication credentials.
 */
export interface EmailPasswordCredentials {
  email: string;
  password: string;
}

/**
 * Login request payload.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Password reset request payload.
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirm payload.
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

/**
 * Account lockout configuration.
 */
export interface AccountLockoutConfig {
  maxFailedAttempts: number;
  lockoutDurationMs: number;
  progressiveDelayMs: number; // Delay multiplier for each failed attempt
}
