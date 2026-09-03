/**
 * User domain model representing an authenticated user in the system.
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  lastFailedLoginAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User registration request payload.
 */
export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * User profile response.
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User profile update request.
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
}
