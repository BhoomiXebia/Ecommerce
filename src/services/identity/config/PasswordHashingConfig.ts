/**
 * Argon2id password hashing configuration.
 * Follows OWASP recommendations.
 */
export const ARGON2_CONFIG = {
  MEMORY_COST: 64 * 1024, // 64 MB (m parameter)
  TIME_COST: 3, // 3 iterations (t parameter)
  PARALLELISM: 4, // 4 parallelism factor (p parameter)
  TYPE: 2, // Argon2id
  SALT_LENGTH: 16,
};

/**
 * Get Argon2 configuration from environment or defaults.
 */
export function getArgon2Config() {
  return {
    memoryCost: parseInt(
      process.env.ARGON2_MEMORY_COST || String(ARGON2_CONFIG.MEMORY_COST),
      10
    ),
    timeCost: parseInt(
      process.env.ARGON2_TIME_COST || String(ARGON2_CONFIG.TIME_COST),
      10
    ),
    parallelism: parseInt(
      process.env.ARGON2_PARALLELISM || String(ARGON2_CONFIG.PARALLELISM),
      10
    ),
    type: parseInt(
      process.env.ARGON2_TYPE || String(ARGON2_CONFIG.TYPE),
      10
    ),
    saltLength: parseInt(
      process.env.ARGON2_SALT_LENGTH || String(ARGON2_CONFIG.SALT_LENGTH),
      10
    ),
  };
}
