import { IUserRepository } from '../repositories/IUserRepository';
import { ITokenRepository } from '../repositories/ITokenRepository';
import { IEventRepository } from '../repositories/IEventRepository';
import { PasswordHashingService } from './PasswordHashingService';
import { TokenGeneratorService } from './TokenGeneratorService';
import { EmailValidator } from '../validators/EmailValidator';
import { PasswordValidator } from '../validators/PasswordValidator';
import { PasswordResetToken } from '../types/Token';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business logic for password reset flow.
 * Handles reset token generation, validation, and password update with transparent re-hashing.
 */
export class PasswordResetService {
  private userRepository: IUserRepository;
  private tokenRepository: ITokenRepository;
  private eventRepository: IEventRepository;
  private passwordHashingService: PasswordHashingService;
  private tokenGeneratorService: TokenGeneratorService;
  private resetTokenTTL = 20 * 60; // 20 minutes in seconds

  constructor(
    userRepository: IUserRepository,
    tokenRepository: ITokenRepository,
    eventRepository: IEventRepository
  ) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    this.eventRepository = eventRepository;
    this.passwordHashingService = new PasswordHashingService();
    this.tokenGeneratorService = new TokenGeneratorService();
  }

  /**
   * Request password reset for an email.
   * Generates cryptographically secure, one-time-use reset token.
   */
  async requestPasswordReset(email: string): Promise<string> {
    const normalizedEmail = EmailValidator.normalize(email);

    // Find user by email
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      // Don't reveal if email exists (security best practice)
      // Still generate event for audit trail if needed
      await this.eventRepository.emitAuditLog({
        eventId: uuidv4(),
        action: 'PASSWORD_RESET_REQUESTED',
        email: normalizedEmail,
        result: 'failure',
        details: { reason: 'User not found' },
        timestamp: Date.now(),
      });
      return ''; // Return empty token for non-existent user
    }

    // Generate reset token
    const resetToken = await this.tokenGeneratorService.generateResetToken();
    const expiresAt = Math.floor(Date.now() / 1000) + this.resetTokenTTL;

    // Store reset token in Redis with TTL
    const resetTokenRecord: PasswordResetToken = {
      userId: user.id,
      token: resetToken,
      expiresAt,
      createdAt: Date.now(),
      used: false,
    };
    await this.tokenRepository.storePasswordResetToken(resetTokenRecord);

    // Publish PasswordResetRequested domain event
    await this.eventRepository.publishDomainEvent({
      eventId: uuidv4(),
      eventType: 'PasswordResetRequested',
      aggregateId: user.id,
      email: user.email,
      timestamp: Date.now(),
      version: 1,
    });

    // Emit audit log
    await this.eventRepository.emitAuditLog({
      eventId: uuidv4(),
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      email: user.email,
      result: 'success',
      timestamp: Date.now(),
    });

    return resetToken;
  }

  /**
   * Validate password reset token.
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    const resetTokenRecord = await this.tokenRepository.getPasswordResetToken(
      token
    );
    if (!resetTokenRecord) {
      return { valid: false };
    }

    // Check expiration
    if (resetTokenRecord.expiresAt * 1000 < Date.now()) {
      return { valid: false };
    }

    // Check if already used
    if (resetTokenRecord.used) {
      return { valid: false };
    }

    return { valid: true, userId: resetTokenRecord.userId };
  }

  /**
   * Confirm password reset and update password.
   * @throws Error if token is invalid or password is weak
   */
  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<void> {
    // Validate reset token
    const validation = await this.validateResetToken(token);
    if (!validation.valid || !validation.userId) {
      throw new Error('Invalid or expired reset token');
    }

    // Validate new password
    const passwordValidation = PasswordValidator.validate(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(
        `Weak password: ${passwordValidation.errors.join(', ')}`
      );
    }

    // Find user
    const user = await this.userRepository.findById(validation.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const newPasswordHash = await this.passwordHashingService.hashPassword(
      newPassword
    );

    // Update user password
    await this.userRepository.update(user.id, {
      passwordHash: newPasswordHash,
    });

    // Check if password hash needs re-hashing (transparent re-hashing)
    const needsRehash = await this.passwordHashingService.needsRehash(
      newPasswordHash
    );
    if (needsRehash) {
      const rehashedPassword = await this.passwordHashingService.hashPassword(
        newPassword
      );
      await this.userRepository.update(user.id, {
        passwordHash: rehashedPassword,
      });
    }

    // Mark reset token as used
    await this.tokenRepository.markPasswordResetTokenAsUsed(token);

    // Emit audit log
    await this.eventRepository.emitAuditLog({
      eventId: uuidv4(),
      userId: user.id,
      action: 'PASSWORD_RESET_CONFIRMED',
      email: user.email,
      result: 'success',
      timestamp: Date.now(),
    });
  }
}
