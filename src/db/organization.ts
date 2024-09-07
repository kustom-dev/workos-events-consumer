import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  OrganizationCreatedEvent,
  OrganizationDeletedEvent,
  OrganizationUpdatedEvent,
} from "@workos-inc/node";

import { DbContext } from "./db-context";

export type Organization = {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
};

export async function createOrganization(
  { db, telemetry }: DbContext,
  event: OrganizationCreatedEvent,
): Promise<Organization | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const dbSpan = tracer.startSpan("Creating organization in DB", undefined, traceCtx);

  const { id, name, createdAt, updatedAt } = event.data;

  try {
    const organization: Organization | null = await db
      .prepare(
        `INSERT INTO organization (id, name, created_at, updated_at) 
        VALUES (?1, ?2, ?3, ?4)
        RETURNING *`,
      )
      .bind(id, name, new Date(createdAt).valueOf(), new Date(updatedAt).valueOf())
      .first<Organization>();

    if (organization) {
      dbSpan.addEvent("Successfully created organization", { id, name });
    } else {
      dbSpan.setStatus({
        code: SpanStatusCode.ERROR,
      });
      dbSpan.addEvent("Unable to create organization");
    }
    dbSpan.end();
    return organization;
  } catch (error) {
    if (error instanceof Error) {
      dbSpan.setStatus({ code: SpanStatusCode.ERROR });
      dbSpan.addEvent("Unable to create organization", { error: error.message, id });
    }

    dbSpan.end();
    return null;
  }
}

export async function updateOrganization(
  { db, telemetry }: DbContext,
  event: OrganizationUpdatedEvent,
): Promise<Organization | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const dbSpan = tracer.startSpan("Updating organization in DB", undefined, traceCtx);

  const { id, name, updatedAt } = event.data;

  try {
    const organization: Organization | null = await db
      .prepare(
        `UPDATE organization 
        SET name = ?2, updated_at = ?3
        WHERE id = ?1
        RETURNING *`,
      )
      .bind(id, name, new Date(updatedAt).valueOf())
      .first<Organization>();

    if (organization) {
      dbSpan.addEvent("Successfully updated organization", { id, name });
    } else {
      dbSpan.setStatus({
        code: SpanStatusCode.ERROR,
      });
      dbSpan.addEvent("Unable to update organization");
    }
    dbSpan.end();
    return organization;
  } catch (error) {
    if (error instanceof Error) {
      dbSpan.setStatus({ code: SpanStatusCode.ERROR });
      dbSpan.addEvent("Unable to update organization", { error: error.message, id });
    }

    dbSpan.end();
    return null;
  }
}

export async function deleteOrganization(
  { db, telemetry }: DbContext,
  event: OrganizationDeletedEvent,
): Promise<Organization | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const dbSpan = tracer.startSpan("Deleting organization in DB", undefined, traceCtx);

  const { id, name } = event.data;

  try {
    const organization: Organization | null = await db
      .prepare(
        `DELETE FROM organization 
        WHERE id = ?1
        RETURNING *`,
      )
      .bind(id)
      .first<Organization>();

    if (organization) {
      dbSpan.addEvent("Successfully deleted organization", { id, name });
    } else {
      dbSpan.setStatus({
        code: SpanStatusCode.ERROR,
      });
      dbSpan.addEvent("Unable to delete organization");
    }
    dbSpan.end();
    return organization;
  } catch (error) {
    if (error instanceof Error) {
      dbSpan.setStatus({ code: SpanStatusCode.ERROR });
      dbSpan.addEvent("Unable to delete organization", { error: error.message, id });
    }

    dbSpan.end();
    return null;
  }
}
