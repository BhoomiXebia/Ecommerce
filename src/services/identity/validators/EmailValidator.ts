import { z } from 'zod';

/**
 * Email validation schema.
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase();

/**
 * Validates email format.
 */
export class EmailValidator {
  static validate(email: string): { valid: boolean; error?: string } {
    const result = emailSchema.safeParse(email);
    if (result.success) {
      return { valid: true };
    }
    const error = result.error.errors[0]?.message || 'Invalid email';
    return { valid: false, error };
  }

  static normalize(email: string): string {
    return email.toLowerCase().trim();
  }
}
