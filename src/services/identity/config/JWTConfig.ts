/**
 * JWT configuration constants.
 */
export const JWT_CONFIG = {
  ALGORITHM: 'RS256',
  ACCESS_TOKEN_TTL_SECONDS: 15 * 60, // 15 minutes
  REFRESH_TOKEN_TTL_SECONDS: 7 * 24 * 60 * 60, // 7 days
  ISSUER: 'identity-service',
  SUBJECT: 'user-auth',
};

/**
 * Get JWT configuration from environment or defaults.
 */
export function getJWTConfig() {
  return {
    algorithm: process.env.JWT_ALGORITHM || JWT_CONFIG.ALGORITHM,
    accessTokenTTL: parseInt(
      process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ||
        String(JWT_CONFIG.ACCESS_TOKEN_TTL_SECONDS),
      10
    ),
    refreshTokenTTL: parseInt(
      process.env.JWT_REFRESH_TOKEN_TTL_SECONDS ||
        String(JWT_CONFIG.REFRESH_TOKEN_TTL_SECONDS),
      10
    ),
    issuer: process.env.JWT_ISSUER || JWT_CONFIG.ISSUER,
    subject: process.env.JWT_SUBJECT || JWT_CONFIG.SUBJECT,
  };
}
