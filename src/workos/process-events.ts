import { context, Span, SpanStatusCode, trace, Tracer } from "@opentelemetry/api";
import { Event, List } from "@workos-inc/node";

import { DbContext } from "../db/db-context";
import { persistEventIdCursor } from "../db/events-cursor";
import { createOrganization, deleteOrganization, updateOrganization } from "../db/organization";
import {
  createOrganizationMembership,
  deleteOrganizationMembership,
  updateOrganizationMembership,
} from "../db/organization-membership";
import { createUser, deleteUser, updateUser } from "../db/user";
import { Telemetry } from "../telemetry/cloudflare-worker-tracer";

type HandleEventArgs = {
  dbCtx: DbContext;
  event: Event;
  processEventsSpan: Span;
  tracer: Tracer;
};

export async function handleEvent({ dbCtx, event, processEventsSpan, tracer }: HandleEventArgs) {
  const { id: eventId } = event;
  const eventCtx = trace.setSpan(context.active(), processEventsSpan);
  const eventSpan = tracer.startSpan(
    `Handling ${event.event}`,
    {
      attributes: {
        eventId,
      },
    },
    eventCtx,
  );
  const updatedDbCtx: DbContext = { db: dbCtx.db, telemetry: { parentSpan: eventSpan, tracer } };

  try {
    switch (event.event) {
      // Organization
      case "organization.created":
        await createOrganization(updatedDbCtx, event);
        break;
      case "organization.updated":
        await updateOrganization(updatedDbCtx, event);
        break;
      case "organization.deleted":
        await deleteOrganization(updatedDbCtx, event);
        break;

      // Organization Membership
      case "organization_membership.created":
        await createOrganizationMembership(updatedDbCtx, event);
        break;
      case "organization_membership.updated":
        await updateOrganizationMembership(updatedDbCtx, event);
        break;
      case "organization_membership.deleted":
        await deleteOrganizationMembership(updatedDbCtx, event);
        break;

      // User
      case "user.created":
        await createUser(updatedDbCtx, event);
        break;
      case "user.updated":
        await updateUser(updatedDbCtx, event);
        break;
      case "user.deleted":
        await deleteUser(updatedDbCtx, event);
        break;
      default:
        eventSpan.addEvent("Skipping unhandled event");
    }
  } catch (error) {
    eventSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: "Unable to process event. Pausing event processing.",
    });
    if (error instanceof Error) {
      eventSpan.addEvent("Error processing event", {
        error: error.message,
        event: JSON.stringify(event),
      });
    }

    await persistEventIdCursor(updatedDbCtx, event);

    return;
  }
  await persistEventIdCursor(updatedDbCtx, event);

  eventSpan.end();
}

type ProcessEventsArgs = {
  env: Env;
  eventsResponse: List<Event> | null;
  telemetry: Telemetry;
};

export async function processEvents({ env, eventsResponse, telemetry }: ProcessEventsArgs) {
  const { parentSpan, tracer } = telemetry;
  const db = env.APP_DB;
  if (eventsResponse) {
    const { data: events } = eventsResponse;
    const eventsLength = events.length;

    if (eventsLength === 0) {
      const traceCtx = trace.setSpan(context.active(), parentSpan);
      const processEventsSpan = tracer.startSpan(
        "No events to process. Waiting until next scheduled invocation.",
        undefined,
        traceCtx,
      );
      processEventsSpan.end();
    } else {
      const traceCtx = trace.setSpan(context.active(), parentSpan);
      const processEventsSpan = tracer.startSpan(
        "Processing events",
        {
          attributes: {
            eventsLength,
          },
        },
        traceCtx,
      );

      for (const event of events) {
        const dbCtx = { db, telemetry: { parentSpan: processEventsSpan, tracer } };
        await handleEvent({ dbCtx, event, processEventsSpan, tracer });
      }
      processEventsSpan.end();
    }
  }
}
