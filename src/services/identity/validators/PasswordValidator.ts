import { z } from 'zod';

/**
 * Password validation schema enforcing complexity rules.
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (pwd) => /[a-z]/.test(pwd),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (pwd) => /\d/.test(pwd),
    'Password must contain at least one number'
  )
  .refine(
    (pwd) => /[!@#$%^&*()_+\-=\[\]{};:'"\\|,.<>?]/.test(pwd),
    'Password must contain at least one special character'
  );

/**
 * Validates password against complexity rules.
 */
export class PasswordValidator {
  static validate(password: string): { valid: boolean; errors: string[] } {
    const result = passwordSchema.safeParse(password);
    if (result.success) {
      return { valid: true, errors: [] };
    }
    const errors = result.error.errors.map((err) => err.message);
    return { valid: false, errors };
  }
}
