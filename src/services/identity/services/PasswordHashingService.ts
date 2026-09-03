import * as argon2 from 'argon2';
import { getArgon2Config } from '../config/PasswordHashingConfig';

/**
 * Service for secure password hashing and verification.
 * Uses Argon2id algorithm per OWASP recommendations.
 */
export class PasswordHashingService {
  private config = getArgon2Config();

  /**
   * Hash a plaintext password using Argon2id.
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await argon2.hash(password, {
        type: this.config.type,
        memoryCost: this.config.memoryCost,
        timeCost: this.config.timeCost,
        parallelism: this.config.parallelism,
        saltLength: this.config.saltLength,
      });
      return hash;
    } catch (error) {
      throw new Error(`Password hashing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Verify a plaintext password against a hash.
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      throw new Error(`Password verification failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a password hash needs to be re-hashed (for upgrading hashing parameters).
   */
  async needsRehash(hash: string): Promise<boolean> {
    try {
      return await argon2.needsRehash(hash, {
        type: this.config.type,
        memoryCost: this.config.memoryCost,
        timeCost: this.config.timeCost,
        parallelism: this.config.parallelism,
      });
    } catch (error) {
      throw new Error(`Rehash check failed: ${(error as Error).message}`);
    }
  }
}
