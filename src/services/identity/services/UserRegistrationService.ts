import { IUserRepository } from '../repositories/IUserRepository';
import { ITokenRepository } from '../repositories/ITokenRepository';
import { IEventRepository } from '../repositories/IEventRepository';
import { PasswordHashingService } from './PasswordHashingService';
import { EmailValidator } from '../validators/EmailValidator';
import { PasswordValidator } from '../validators/PasswordValidator';
import { User, RegisterUserRequest, UserProfile } from '../types/User';
import { AccountLockoutConfig } from '../types/Auth';
import { getLockoutConfig } from '../config/AccountLockoutConfig';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business logic for user registration.
 * Enforces email uniqueness and password complexity rules.
 */
export class UserRegistrationService {
  private userRepository: IUserRepository;
  private eventRepository: IEventRepository;
  private passwordHashingService: PasswordHashingService;
  private lockoutConfig: AccountLockoutConfig;

  constructor(
    userRepository: IUserRepository,
    eventRepository: IEventRepository
  ) {
    this.userRepository = userRepository;
    this.eventRepository = eventRepository;
    this.passwordHashingService = new PasswordHashingService();
    this.lockoutConfig = getLockoutConfig();
  }

  /**
   * Register a new user.
   * @throws Error if email is invalid, not unique, or password is weak
   */
  async registerUser(request: RegisterUserRequest): Promise<UserProfile> {
    // Validate email format
    const emailValidation = EmailValidator.validate(request.email);
    if (!emailValidation.valid) {
      throw new Error(`Invalid email: ${emailValidation.error}`);
    }

    // Normalize email
    const normalizedEmail = EmailValidator.normalize(request.email);

    // Check email uniqueness
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Validate password complexity
    const passwordValidation = PasswordValidator.validate(request.password);
    if (!passwordValidation.valid) {
      throw new Error(
        `Weak password: ${passwordValidation.errors.join(', ')}`
      );
    }

    // Hash password
    const passwordHash = await this.passwordHashingService.hashPassword(
      request.password
    );

    // Create user
    const userId = uuidv4();
    const user = await this.userRepository.create({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      firstName: request.firstName,
      lastName: request.lastName,
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
    });

    // Publish UserRegistered domain event
    await this.eventRepository.publishDomainEvent({
      eventId: uuidv4(),
      eventType: 'UserRegistered',
      aggregateId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      timestamp: Date.now(),
      version: 1,
    });

    // Emit audit log
    await this.eventRepository.emitAuditLog({
      eventId: uuidv4(),
      userId: user.id,
      action: 'USER_REGISTERED',
      email: user.email,
      result: 'success',
      timestamp: Date.now(),
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
