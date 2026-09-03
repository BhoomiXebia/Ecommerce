import { User } from '../types/User';

/**
 * Repository interface for User persistence.
 * Implements Repository Pattern for testability and persistence abstraction.
 */
export interface IUserRepository {
  /**
   * Create a new user.
   */
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;

  /**
   * Find user by ID.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Update user details.
   */
  update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User>;

  /**
   * Lock user account after failed login attempts.
   */
  lockAccount(id: string): Promise<void>;

  /**
   * Unlock user account.
   */
  unlockAccount(id: string): Promise<void>;

  /**
   * Update failed login attempts counter.
   */
  incrementFailedLoginAttempts(id: string): Promise<void>;

  /**
   * Reset failed login attempts counter.
   */
  resetFailedLoginAttempts(id: string): Promise<void>;

  /**
   * Update last login timestamp.
   */
  updateLastLoginAt(id: string): Promise<void>;
}
