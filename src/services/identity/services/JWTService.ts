import jwt from 'jsonwebtoken';
import { JWTPayload, TokenResponse } from '../types/Token';
import { getJWTConfig } from '../config/JWTConfig';

/**
 * Service for JWT token generation and validation.
 * Uses RS256 algorithm with public/private key pairs.
 */
export class JWTService {
  private config = getJWTConfig();
  private privateKey: string;
  private publicKey: string;

  constructor(privateKey: string, publicKey: string) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  /**
   * Generate a JWT access token.
   */
  generateAccessToken(userId: string, email: string): string {
    const payload: JWTPayload = {
      sub: userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.config.accessTokenTTL,
      type: 'access',
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      issuer: this.config.issuer,
      subject: this.config.subject,
    });
  }

  /**
   * Verify and decode a JWT token.
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.config.issuer,
      }) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token expiration time from payload.
   */
  getTokenExpiration(token: string): number {
    try {
      const decoded = jwt.decode(token) as JWTPayload | null;
      return decoded?.exp || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Check if token is expired.
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    return expiration * 1000 < Date.now();
  }

  /**
   * Get remaining TTL in seconds.
   */
  getTokenTTL(token: string): number {
    const expiration = this.getTokenExpiration(token);
    return Math.max(0, expiration - Math.floor(Date.now() / 1000));
  }
}
