import { randomBytes } from 'crypto';
import { promisify } from 'util';

const randomBytesAsync = promisify(randomBytes);

/**
 * Service for generating cryptographically secure tokens.
 */
export class TokenGeneratorService {
  /**
   * Generate a random, cryptographically secure token.
   * @param length - Token length in bytes (default: 32)
   * @returns Hex-encoded token string
   */
  async generateToken(length: number = 32): Promise<string> {
    const buffer = await randomBytesAsync(length);
    return buffer.toString('hex');
  }

  /**
   * Generate a password reset token (256-bit).
   */
  async generateResetToken(): Promise<string> {
    return this.generateToken(32);
  }

  /**
   * Generate a refresh token (256-bit).
   */
  async generateRefreshToken(): Promise<string> {
    return this.generateToken(32);
  }
}
