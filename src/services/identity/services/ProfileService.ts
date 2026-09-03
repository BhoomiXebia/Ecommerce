import { IUserRepository } from '../repositories/IUserRepository';
import { IEventRepository } from '../repositories/IEventRepository';
import { UserProfile, UpdateProfileRequest } from '../types/User';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business logic for user profile management.
 * Handles reading and updating user profile information.
 */
export class ProfileService {
  private userRepository: IUserRepository;
  private eventRepository: IEventRepository;

  constructor(
    userRepository: IUserRepository,
    eventRepository: IEventRepository
  ) {
    this.userRepository = userRepository;
    this.eventRepository = eventRepository;
  }

  /**
   * Get user profile by ID.
   * @throws Error if user not found
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

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

  /**
   * Update user profile (name fields only).
   * @throws Error if user not found
   */
  async updateProfile(
    userId: string,
    request: UpdateProfileRequest
  ): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update profile
    const updatedUser = await this.userRepository.update(userId, {
      firstName: request.firstName ?? user.firstName,
      lastName: request.lastName ?? user.lastName,
    });

    // Emit audit log
    await this.eventRepository.emitAuditLog({
      eventId: uuidv4(),
      userId: updatedUser.id,
      action: 'PROFILE_UPDATED',
      email: updatedUser.email,
      result: 'success',
      details: { fields: Object.keys(request) },
      timestamp: Date.now(),
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
