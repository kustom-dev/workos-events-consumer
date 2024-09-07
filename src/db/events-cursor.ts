import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { Event } from "@workos-inc/node";

import { DbContext } from "./db-context";

export type EventsCursor = {
  event_id: string;
  event_payload: string; // JSON payload
  created_at: number; // Timestamp
  processed_at: number; // Timestamp
};

export async function fetchCursor(db: D1Database): Promise<string | undefined> {
  const stmt = db.prepare("SELECT event_id FROM events_cursor ORDER BY created_at DESC LIMIT 1");
  const event_id = await stmt.first<string>("event_id");

  return event_id || undefined;
}

export async function persistEventIdCursor(
  { db, telemetry }: DbContext,
  event: Event,
): Promise<string | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const dbSpan = tracer.startSpan("Persisting events cursor", undefined, traceCtx);
  try {
    const eventId = await db
      .prepare(
        `INSERT INTO events_cursor (event_id, event_payload, created_at, processed_at) 
        VALUES (?1, ?2, ?3, ?4) RETURNING *`,
      )
      .bind(event.id, JSON.stringify(event), new Date(event.createdAt).valueOf(), Date.now())
      .first<string>("event_id");

    if (eventId) {
      dbSpan.addEvent("Completed updating event ID cursor", {
        eventId,
      });
    } else {
      dbSpan.setStatus({
        code: SpanStatusCode.ERROR,
      });
      dbSpan.addEvent("Unable to persist event ID");
    }

    dbSpan.end();
    return eventId;
  } catch (error) {
    dbSpan.setStatus({
      code: SpanStatusCode.ERROR,
    });
    if (error instanceof Error) {
      dbSpan.addEvent("Error persisting event ID cursor", {
        error: JSON.stringify(error),
      });
    }

    dbSpan.end();
    return null;
  }
}
