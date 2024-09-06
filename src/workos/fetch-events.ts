import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { Event, EventName, List, ListEventOptions, WorkOS } from "@workos-inc/node";

import { Telemetry } from "../telemetry/cloudflare-worker-tracer";

const eventAllowlist: EventName[] = [
  // organization
  "organization.created",
  "organization.deleted",
  "organization.updated",

  // organization membership
  "organization_membership.created",
  "organization_membership.deleted",
  "organization_membership.updated",

  // user
  "user.created",
  "user.deleted",
  "user.updated",
];

export type ListEventsRangeParams = Pick<ListEventOptions, "after" | "rangeEnd" | "rangeStart">;

type FetchEventsArgs = {
  env: Env;
  telemetry: Telemetry;
  fetchParams: ListEventsRangeParams;
};

export async function fetchEvents({
  env,
  telemetry,
  fetchParams,
}: FetchEventsArgs): Promise<List<Event> | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const span = tracer.startSpan(
    "Fetching events",
    {
      attributes: {
        fetchParams: JSON.stringify(fetchParams),
      },
    },
    traceCtx,
  );

  const workos = new WorkOS(env.WORKOS_API_KEY);

  try {
    const response = await workos.events.listEvents({
      events: eventAllowlist,
      limit: 100,
      ...fetchParams,
    });
    span.end();

    return response;
  } catch (error) {
    if (error instanceof Error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.addEvent("Unable to fetch events", {
        error: error.message,
      });
    }
    span.end();

    return null;
  }
}
