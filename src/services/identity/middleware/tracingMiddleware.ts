import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('identity-service');

/**
 * OpenTelemetry plugin for distributed tracing.
 * Instruments HTTP requests and services.
 */
export async function setupTracingPlugin(
  fastify: FastifyInstance
): Promise<void> {
  /**
   * Hook to trace incoming requests.
   */
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    const span = tracer.startSpan(`${request.method} ${request.url}`);
    request.span = span;
  });

  /**
   * Hook to end trace after request.
   */
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.span) {
      request.span.setAttributes({
        'http.method': request.method,
        'http.url': request.url,
        'http.status_code': reply.statusCode,
      });
      request.span.end();
    }
  });
}

/**
 * Extend Fastify request type.
 */
declare global {
  namespace Express {
    interface Request {
      span?: ReturnType<typeof tracer.startSpan>;
    }
  }
}
