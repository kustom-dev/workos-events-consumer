import { trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

import { fetchCursor } from "./db/events-cursor";
import {
  cloudflareWorkerTracer,
  shutdownExporter,
  Telemetry,
} from "./telemetry/cloudflare-worker-tracer";
import { fetchEvents, ListEventsRangeParams } from "./workos/fetch-events";
import { processEvents } from "./workos/process-events";

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

    const db = env.APP_DB;

    const currentEventIdCursor = await fetchCursor(db);

    parentSpan.addEvent("currentEventIdCursor", {
      currentEventIdCursor,
    });

    const oneMinutesMs = 1 * 60000;
    const rangeEnd = new Date();

    const rangeFetchParams: ListEventsRangeParams = {
      rangeStart: env.EVENTS_RANGE_START
        ? new Date(parseInt(env.EVENTS_RANGE_START)).toISOString()
        : undefined,
      rangeEnd: env.EVENTS_RANGE_END
        ? new Date(parseInt(env.EVENTS_RANGE_END)).toISOString()
        : undefined,
    };

    const cursorFetchParams: ListEventsRangeParams = {
      rangeStart: new Date(rangeEnd.valueOf() - oneMinutesMs).toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      ...(currentEventIdCursor !== undefined && {
        after: currentEventIdCursor,
        rangeStart: undefined,
        rangeEnd: undefined,
      }),
    };

    const fetchParams =
      env.EVENTS_RANGE_START || env.EVENTS_RANGE_END ? rangeFetchParams : cursorFetchParams;

    const eventsResponse = await fetchEvents({ env, telemetry, fetchParams });

    await processEvents({ env, eventsResponse, telemetry });

    parentSpan.end();

    // Wait 3 seconds until shutting down the tracing exporter. There is a 1 second
    // delay on sending batches to the collector.
    const exporterShutdownDelay = 3000;
    ctx.waitUntil(shutdownExporter(tracingExporter, exporterShutdownDelay));
  },
};
