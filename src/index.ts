import { trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

import {
  cloudflareWorkerTracer,
  shutdownExporter,
  Telemetry,
} from "./telemetry/cloudflare-worker-tracer";

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const environment = env.ENVIRONMENT;
    const tracingExporter: OTLPTraceExporter = cloudflareWorkerTracer({
      environment,
      serviceName: env.SERVICE_NAME,
    });

    const tracer = trace.getTracer(`${env.SERVICE_NAME}-tracer`);
    const parentSpan = tracer.startSpan("Start scheduled event processing");
    const telemetry: Telemetry = {
      parentSpan,
      tracer,
    };

    parentSpan.end();

    // Wait 3 seconds until shutting down the tracing exporter. There is a 1 second
    // delay on sending batches to the collector.
    const exporterShutdownDelay = 3000;
    ctx.waitUntil(shutdownExporter(tracingExporter, exporterShutdownDelay));
  },
};
