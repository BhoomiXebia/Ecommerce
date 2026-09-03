import { IUserRepository } from '../repositories/IUserRepository';
import { ITokenRepository } from '../repositories/ITokenRepository';
import { IEventRepository } from '../repositories/IEventRepository';
import { PasswordHashingService } from './PasswordHashingService';
import { JWTService } from './JWTService';
import { TokenGeneratorService } from './TokenGeneratorService';
import { EmailValidator } from '../validators/EmailValidator';
import { TokenResponse, RefreshToken } from '../types/Token';
import { AccountLockoutConfig } from '../types/Auth';
import { getLockoutConfig } from '../config/AccountLockoutConfig';
import { getJWTConfig } from '../config/JWTConfig';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business logic for user authentication.
 * Handles login with email/password and enforces account lockout policy.
 */
export class AuthenticationService {
  private userRepository: IUserRepository;
  private tokenRepository: ITokenRepository;
  private eventRepository: IEventRepository;
  private passwordHashingService: PasswordHashingService;
  private jwtService: JWTService;
  private tokenGeneratorService: TokenGeneratorService;
  private lockoutConfig: AccountLockoutConfig;
  private jwtConfig: ReturnType<typeof getJWTConfig>;

  constructor(
    userRepository: IUserRepository,
    tokenRepository: ITokenRepository,
    eventRepository: IEventRepository,
    jwtService: JWTService
  ) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    this.eventRepository = eventRepository;
    this.passwordHashingService = new PasswordHashingService();
    this.jwtService = jwtService;
    this.tokenGeneratorService = new TokenGeneratorService();
    this.lockoutConfig = getLockoutConfig();
    this.jwtConfig = getJWTConfig();
  }

  /**
   * Authenticate user with email and password.
   * @throws Error if credentials are invalid or account is locked
   */
  async authenticate(email: string, password: string): Promise<TokenResponse> {
    const normalizedEmail = EmailValidator.normalize(email);

    // Find user by email
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      await this.eventRepository.emitAuditLog({
        eventId: uuidv4(),
        action: 'LOGIN_FAILED',
        email: normalizedEmail,
        result: 'failure',
        details: { reason: 'User not found' },
        timestamp: Date.now(),
      });
      throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked) {
      const timeSinceLastFail = user.lastFailedLoginAt
        ? Date.now() - user.lastFailedLoginAt.getTime()
        : 0;
      if (timeSinceLastFail < this.lockoutConfig.lockoutDurationMs) {
        await this.eventRepository.emitAuditLog({
          eventId: uuidv4(),
          userId: user.id,
          action: 'LOGIN_FAILED',
          email: user.email,
          result: 'failure',
          details: { reason: 'Account locked' },
          timestamp: Date.now(),
        });
        throw new Error('Account is locked. Please try again later.');
      }
      // Unlock account if lockout duration has passed
      await this.userRepository.unlockAccount(user.id);
      await this.userRepository.resetFailedLoginAttempts(user.id);
    }

    // Verify password
    const passwordValid = await this.passwordHashingService.verifyPassword(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      // Increment failed login attempts
      await this.userRepository.incrementFailedLoginAttempts(user.id);
      const updatedUser = await this.userRepository.findById(user.id);

      // Lock account if max attempts reached
      if (
        updatedUser &&
        updatedUser.failedLoginAttempts >= this.lockoutConfig.maxFailedAttempts
      ) {
        await this.userRepository.lockAccount(user.id);
      }

      await this.eventRepository.emitAuditLog({
        eventId: uuidv4(),
        userId: user.id,
        action: 'LOGIN_FAILED',
        email: user.email,
        result: 'failure',
        details: { reason: 'Invalid password' },
        timestamp: Date.now(),
      });
      throw new Error('Invalid email or password');
    }

    // Reset failed login attempts on successful authentication
    await this.userRepository.resetFailedLoginAttempts(user.id);
    await this.userRepository.updateLastLoginAt(user.id);

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(
      user.id,
      user.email
    );
    const refreshToken = await this.tokenGeneratorService.generateRefreshToken();
    const expiresAt =
      Math.floor(Date.now() / 1000) + this.jwtConfig.refreshTokenTTL;

    // Store refresh token in Redis
    const refreshTokenRecord: RefreshToken = {
      userId: user.id,
      token: refreshToken,
      expiresAt,
      createdAt: Date.now(),
      rotationCount: 0,
    };
    await this.tokenRepository.storeRefreshToken(refreshTokenRecord);

    // Emit audit log
    await this.eventRepository.emitAuditLog({
      eventId: uuidv4(),
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      email: user.email,
      result: 'success',
      timestamp: Date.now(),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtConfig.accessTokenTTL,
      tokenType: 'Bearer',
    };
  }

  /**
   * Calculate progressive delay for failed login attempts.
   */
  calculateProgressiveDelay(failedAttempts: number): number {
    return failedAttempts * this.lockoutConfig.progressiveDelayMs;
  }
}
