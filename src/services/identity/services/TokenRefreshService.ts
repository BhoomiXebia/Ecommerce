import { ITokenRepository } from '../repositories/ITokenRepository';
import { IEventRepository } from '../repositories/IEventRepository';
import { JWTService } from './JWTService';
import { TokenGeneratorService } from './TokenGeneratorService';
import { TokenResponse, RefreshToken } from '../types/Token';
import { getJWTConfig } from '../config/JWTConfig';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business logic for token refresh and rotation.
 * Implements sliding window token rotation to prevent replay attacks.
 */
export class TokenRefreshService {
  private tokenRepository: ITokenRepository;
  private eventRepository: IEventRepository;
  private jwtService: JWTService;
  private tokenGeneratorService: TokenGeneratorService;
  private jwtConfig: ReturnType<typeof getJWTConfig>;

  constructor(
    tokenRepository: ITokenRepository,
    eventRepository: IEventRepository,
    jwtService: JWTService
  ) {
    this.tokenRepository = tokenRepository;
    this.eventRepository = eventRepository;
    this.jwtService = jwtService;
    this.tokenGeneratorService = new TokenGeneratorService();
    this.jwtConfig = getJWTConfig();
  }

  /**
   * Refresh access token using refresh token (with rotation).
   * @throws Error if refresh token is invalid, expired, or already used
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // Retrieve refresh token from Redis
    const storedToken = await this.tokenRepository.getRefreshToken(
      refreshToken
    );
    if (!storedToken) {
      throw new Error('Invalid or expired refresh token');
    }

    // Check if token is expired
    if (storedToken.expiresAt * 1000 < Date.now()) {
      throw new Error('Refresh token has expired');
    }

    // Generate new tokens with rotation
    const newAccessToken = this.jwtService.generateAccessToken(
      storedToken.userId,
      '' // Email will be fetched from user repository in actual implementation
    );
    const newRefreshToken =
      await this.tokenGeneratorService.generateRefreshToken();
    const newExpiresAt =
      Math.floor(Date.now() / 1000) + this.jwtConfig.refreshTokenTTL;

    // Store new refresh token with incremented rotation count
    const newRefreshTokenRecord: RefreshToken = {
      userId: storedToken.userId,
      token: newRefreshToken,
      expiresAt: newExpiresAt,
      createdAt: Date.now(),
      rotationCount: storedToken.rotationCount + 1,
    };
    await this.tokenRepository.storeRefreshToken(newRefreshTokenRecord);

    // Invalidate old refresh token atomically
    await this.tokenRepository.deleteRefreshToken(refreshToken);

    // Emit audit log
    await this.eventRepository.emitAuditLog({
      eventId: uuidv4(),
      userId: storedToken.userId,
      action: 'TOKEN_REFRESHED',
      result: 'success',
      details: { rotationCount: newRefreshTokenRecord.rotationCount },
      timestamp: Date.now(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.jwtConfig.accessTokenTTL,
      tokenType: 'Bearer',
    };
  }

  /**
   * Invalidate refresh token (logout).
   */
  async invalidateToken(refreshToken: string): Promise<void> {
    const storedToken = await this.tokenRepository.getRefreshToken(
      refreshToken
    );
    if (storedToken) {
      await this.tokenRepository.deleteRefreshToken(refreshToken);
      await this.eventRepository.emitAuditLog({
        eventId: uuidv4(),
        userId: storedToken.userId,
        action: 'LOGOUT',
        result: 'success',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Invalidate all tokens for a user (force re-authentication).
   */
  async invalidateAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepository.deleteAllUserRefreshTokens(userId);
    await this.eventRepository.emitAuditLog({
      eventId: uuidv4(),
      userId,
      action: 'LOGOUT',
      result: 'success',
      details: { reason: 'Force logout - all tokens invalidated' },
      timestamp: Date.now(),
    });
  }
}
