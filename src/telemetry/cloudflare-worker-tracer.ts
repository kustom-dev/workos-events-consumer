import { Span, Tracer } from "@opentelemetry/api";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor, WebTracerProvider } from "@opentelemetry/sdk-trace-web";

const DEV_TRACES_URL = "http://localhost:4318/v1/traces";
const TEST_TRACES_URL = "http://localhost:4319/v1/traces";

export type Telemetry = {
  parentSpan: Span;
  tracer: Tracer;
};

export type CloudflareWorkerEnvironment = {
  environment: string;
  serviceName: string;
};

export function cloudflareWorkerTracer(env: CloudflareWorkerEnvironment): OTLPTraceExporter {
  const environment = env.environment;
  const localTracesUrl =
    environment === "dev" ? DEV_TRACES_URL : environment === "test" ? TEST_TRACES_URL : "";
  const exporter = new OTLPTraceExporter({
    url: localTracesUrl,
  });
  const resource = new Resource({
    "app.environment": env.environment,
    "service.name": env.serviceName,
  });

  const provider = new WebTracerProvider({ resource });
  // Wait for 1 second until exporting spans in batches.
  const scheduledDelayMillis = 1000;

  provider.addSpanProcessor(new BatchSpanProcessor(exporter, { scheduledDelayMillis }));

  const contextManager = new ZoneContextManager();
  provider.register({
    contextManager,
    propagator: new CompositePropagator({
      propagators: [new W3CBaggagePropagator(), new W3CTraceContextPropagator()],
    }),
  });

  registerInstrumentations({
    tracerProvider: provider,
  });

  return exporter;
}

// Without this, the BatchSpanProcessor doesn't work for Cloudflare workers.
// Need to wait until spans are exported before shutting down.
// Tried using the forceFlush() method on the OTLPTraceExporter but didn't work.
export async function shutdownExporter(tracingExporter: OTLPTraceExporter, ms: number) {
  await new Promise((r) => setTimeout(r, ms));

  await tracingExporter.shutdown();
}
