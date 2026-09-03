import { FastifyInstance, FastifyRequest } from 'fastify';
import { JWTService } from '../services/JWTService';
import { JWTPayload } from '../types/Token';

/**
 * Fastify plugin for JWT authentication.
 * Validates Bearer tokens in Authorization header and decorates request with user info.
 */
export async function setupAuthPlugin(
  fastify: FastifyInstance,
  jwtService: JWTService
): Promise<void> {
  /**
   * Custom authentication decorator.
   */
  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const payload = jwtService.verifyToken(token);
    if (!payload) {
      throw new Error('Invalid or expired token');
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
    };
  });

  /**
   * Register fastify-jwt plugin for automatic Bearer token verification.
   */
  fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_PUBLIC_KEY || 'your-public-key',
    sign: {
      algorithm: 'RS256',
    },
  });
}

/**
 * Extend Fastify User type.
 */
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
    }
  }
}
