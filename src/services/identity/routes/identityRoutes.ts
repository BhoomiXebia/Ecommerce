import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserRegistrationService } from '../services/UserRegistrationService';
import { AuthenticationService } from '../services/AuthenticationService';
import { TokenRefreshService } from '../services/TokenRefreshService';
import { PasswordResetService } from '../services/PasswordResetService';
import { ProfileService } from '../services/ProfileService';
import { RegisterUserRequest, UpdateProfileRequest } from '../types/User';
import { LoginRequest, PasswordResetRequest, PasswordResetConfirmRequest, RefreshTokenRequest } from '../types/Auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * HTTP routes for Identity Service.
 * Implements Fastify routes for authentication and profile management.
 */
export async function setupIdentityRoutes(
  fastify: FastifyInstance,
  userRegistrationService: UserRegistrationService,
  authenticationService: AuthenticationService,
  tokenRefreshService: TokenRefreshService,
  passwordResetService: PasswordResetService,
  profileService: ProfileService
): Promise<void> {
  /**
   * POST /auth/register - Register a new user
   */
  fastify.post<{ Body: RegisterUserRequest }>(
    '/auth/register',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const profile = await userRegistrationService.registerUser(request.body);
        return reply.code(201).send({
          status: 'success',
          data: profile,
        });
      } catch (error) {
        return reply.code(400).send({
          status: 'error',
          message: (error as Error).message,
        });
      }
    }
  );

  /**
   * POST /auth/login - Authenticate user with email/password
   */
  fastify.post<{ Body: LoginRequest }>(
    '/auth/login',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tokens = await authenticationService.authenticate(
          request.body.email,
          request.body.password
        );
        return reply.code(200).send({
          status: 'success',
          data: tokens,
        });
      } catch (error) {
        return reply.code(401).send({
          status: 'error',
          message: (error as Error).message,
        });
      }
    }
  );

  /**
   * POST /auth/refresh - Refresh access token using refresh token
   */
  fastify.post<{ Body: RefreshTokenRequest }>(
    '/auth/refresh',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tokens = await tokenRefreshService.refreshToken(
          request.body.refreshToken
        );
        return reply.code(200).send({
          status: 'success',
          data: tokens,
        });
      } catch (error) {
        return reply.code(401).send({
          status: 'error',
          message: (error as Error).message,
        });
      }
    }
  );

  /**
   * POST /auth/logout - Logout and invalidate refresh token
   */
  fastify.post<{ Body: RefreshTokenRequest }>(
    '/auth/logout',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await tokenRefreshService.invalidateToken(request.body.refreshToken);
        return reply.code(200).send({
          status: 'success',
          message: 'Logged out successfully',
        });
      } catch (error) {
        return reply.code(400).send({
          status: 'error',
          message: (error as Error).message,
        });
      }
    }
  );

  /**
   * POST /auth/password-reset/request - Request password reset
   */
  fastify.post<{ Body: PasswordResetRequest }>(
    '/auth/password-reset/request',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await passwordResetService.requestPasswordReset(request.body.email);
        return reply.code(200).send({
          status: 'success',
          message: 'Password reset email sent (if account exists)',
        });
      } catch (error) {
        return reply.code(400).send({
          status: 'error',
          message: (error as Error).message,
        });
      }
    }
  );

  /**
   * POST /auth/password-reset/confirm - Confirm password reset with token
   */
  fastify.post<{ Body: PasswordResetConfirmRequest }>(
    '/auth/password-reset/confirm',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await passwordResetService.confirmPasswordReset(
          request.body.token,
          request.body.newPassword
        );
        return reply.code(200).send({
          status: 'success',
          message: 'Password reset successfully',
        });
      } catch (error) {
        return reply.code(400).send({
          status: 'error',
          message: (error as Error).message,
        });
      }
    }
  );

  /**
   * GET /profile - Get authenticated user profile
   */
  fastify.get(
    '/profile',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.id as string;
        const profile = await profileService.getProfile(userId);
        return reply.code(200).send({
          status: 'success',
          data: profile,
        });
      } catch (error) {
        return reply.code(404).send({
          status: 'error',
          message: (error as Error).message,
        });
      }
    }
  );

  /**
   * PATCH /profile - Update authenticated user profile
   */
  fastify.patch<{ Body: UpdateProfileRequest }>(
    '/profile',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.id as string;
        const profile = await profileService.updateProfile(userId, request.body);
        return reply.code(200).send({
          status: 'success',
          data: profile,
        });
      } catch (error) {
        return reply.code(400).send({
          status: 'error',
          message: (error as Error).message,
        });
      }
    }
  );
}
