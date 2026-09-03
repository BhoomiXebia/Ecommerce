import { RefreshToken, PasswordResetToken } from '../types/Token';

/**
 * Repository interface for token persistence in Redis.
 * Implements Repository Pattern for testability and persistence abstraction.
 */
export interface ITokenRepository {
  /**
   * Store refresh token in Redis with expiration.
   */
  storeRefreshToken(token: RefreshToken): Promise<void>;

  /**
   * Retrieve refresh token from Redis.
   */
  getRefreshToken(token: string): Promise<RefreshToken | null>;

  /**
   * Delete/invalidate refresh token (e.g., on logout).
   */
  deleteRefreshToken(token: string): Promise<void>;

  /**
   * Delete all refresh tokens for a user (force re-authentication).
   */
  deleteAllUserRefreshTokens(userId: string): Promise<void>;

  /**
   * Store password reset token in Redis with TTL.
   */
  storePasswordResetToken(token: PasswordResetToken): Promise<void>;

  /**
   * Retrieve password reset token from Redis.
   */
  getPasswordResetToken(token: string): Promise<PasswordResetToken | null>;

  /**
   * Mark password reset token as used.
   */
  markPasswordResetTokenAsUsed(token: string): Promise<void>;

  /**
   * Delete password reset token.
   */
  deletePasswordResetToken(token: string): Promise<void>;
}
