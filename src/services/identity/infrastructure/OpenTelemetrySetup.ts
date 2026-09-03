import { FastifyInstance } from 'fastify';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger-basic';

/**
 * Initialize OpenTelemetry instrumentation.
 */
export function initializeOpenTelemetry(): NodeSDK {
  const sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
    traceExporter:
      process.env.JAEGER_ENABLED === 'true'
        ? new JaegerExporter({
            serviceName: 'identity-service',
            host: process.env.JAEGER_HOST || 'localhost',
            port: parseInt(process.env.JAEGER_PORT || '6831', 10),
          })
        : new ConsoleSpanExporter(),
  });

  sdk.start();
  console.log('OpenTelemetry initialized');
  return sdk;
}

/**
 * Shutdown OpenTelemetry.
 */
export async function shutdownOpenTelemetry(sdk: NodeSDK): Promise<void> {
  await sdk.shutdown();
  console.log('OpenTelemetry shut down');
}
