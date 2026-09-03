import { AccountLockoutConfig } from '../types/Auth';

/**
 * Default account lockout configuration.
 */
export const DEFAULT_LOCKOUT_CONFIG: AccountLockoutConfig = {
  maxFailedAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  progressiveDelayMs: 500, // 500ms delay multiplier per failed attempt
};

/**
 * Get account lockout configuration from environment or defaults.
 */
export function getLockoutConfig(): AccountLockoutConfig {
  return {
    maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10),
    lockoutDurationMs: parseInt(
      process.env.LOCKOUT_DURATION_MS || String(15 * 60 * 1000),
      10
    ),
    progressiveDelayMs: parseInt(
      process.env.PROGRESSIVE_DELAY_MS || '500',
      10
    ),
  };
}
