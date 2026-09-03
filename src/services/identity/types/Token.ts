/**
 * JWT token payload structure.
 */
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  iat: number; // Issued at
  exp: number; // Expiration time
  type: 'access'; // Token type
}

/**
 * Refresh token record stored in Redis.
 */
export interface RefreshToken {
  userId: string;
  token: string;
  expiresAt: number;
  createdAt: number;
  rotationCount: number;
}

/**
 * Token response from authentication.
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access token TTL in seconds
  tokenType: 'Bearer';
}

/**
 * Password reset token record stored in Redis.
 */
export interface PasswordResetToken {
  userId: string;
  token: string;
  expiresAt: number;
  createdAt: number;
  used: boolean;
}

/**
 * Token refresh request.
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}
