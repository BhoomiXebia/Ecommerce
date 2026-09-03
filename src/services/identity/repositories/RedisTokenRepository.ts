import Redis from 'ioredis';
import { ITokenRepository } from '../repositories/ITokenRepository';
import { RefreshToken, PasswordResetToken } from '../types/Token';

/**
 * Redis-based implementation of ITokenRepository.
 * Provides token storage with automatic TTL/expiration.
 */
export class RedisTokenRepository implements ITokenRepository {
  private refreshTokenPrefix = 'refresh_token:';
  private passwordResetTokenPrefix = 'password_reset_token:';
  private userRefreshTokensSetPrefix = 'user_refresh_tokens:';

  constructor(private redis: Redis) {}

  async storeRefreshToken(token: RefreshToken): Promise<void> {
    const key = this.refreshTokenPrefix + token.token;
    const ttlSeconds = Math.max(0, token.expiresAt - Math.floor(Date.now() / 1000));

    // Store token with automatic expiration
    await this.redis.setex(
      key,
      ttlSeconds,
      JSON.stringify(token)
    );

    // Also store in user's token set for bulk operations
    await this.redis.sadd(
      this.userRefreshTokensSetPrefix + token.userId,
      token.token
    );
  }

  async getRefreshToken(token: string): Promise<RefreshToken | null> {
    const key = this.refreshTokenPrefix + token;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    const key = this.refreshTokenPrefix + token;
    const tokenData = await this.redis.get(key);
    if (tokenData) {
      const parsed = JSON.parse(tokenData) as RefreshToken;
      // Remove from user's token set
      await this.redis.srem(
        this.userRefreshTokensSetPrefix + parsed.userId,
        token
      );
    }
    await this.redis.del(key);
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    const setKey = this.userRefreshTokensSetPrefix + userId;
    const tokens = await this.redis.smembers(setKey);
    for (const token of tokens) {
      await this.deleteRefreshToken(token);
    }
    await this.redis.del(setKey);
  }

  async storePasswordResetToken(token: PasswordResetToken): Promise<void> {
    const key = this.passwordResetTokenPrefix + token.token;
    const ttlSeconds = Math.max(0, token.expiresAt - Math.floor(Date.now() / 1000));

    // Store token with automatic expiration
    await this.redis.setex(
      key,
      ttlSeconds,
      JSON.stringify(token)
    );
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const key = this.passwordResetTokenPrefix + token;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    const key = this.passwordResetTokenPrefix + token;
    const data = await this.redis.get(key);
    if (data) {
      const parsed = JSON.parse(data) as PasswordResetToken;
      parsed.used = true;
      await this.redis.setex(
        key,
        3600, // Keep marked token for 1 hour
        JSON.stringify(parsed)
      );
    }
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    const key = this.passwordResetTokenPrefix + token;
    await this.redis.del(key);
  }
}
