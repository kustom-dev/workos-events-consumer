import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  OrganizationMembershipCreated,
  OrganizationMembershipDeleted,
  OrganizationMembershipUpdated,
} from "@workos-inc/node";

import { DbContext } from "./db-context";

export type OrganizationMembership = {
  id: string;
  user_id: string;
  organization_id: string;
  role_slug: string;
  status: string;
  created_at: number;
  updated_at: number;
};

export async function createOrganizationMembership(
  { db, telemetry }: DbContext,
  event: OrganizationMembershipCreated,
): Promise<OrganizationMembership | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const dbSpan = tracer.startSpan("Creating organization membership in DB", undefined, traceCtx);

  const { id, userId, organizationId, role, status, createdAt, updatedAt } = event.data;

  try {
    const organizationMembership: OrganizationMembership | null = await db
      .prepare(
        `INSERT INTO organization_membership (id, user_id, organization_id, role_slug, status, created_at, updated_at) 
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        RETURNING *`,
      )
      .bind(
        id,
        userId,
        organizationId,
        role.slug,
        status,
        new Date(createdAt).valueOf(),
        new Date(updatedAt).valueOf(),
      )
      .first<OrganizationMembership>();

    if (organizationMembership) {
      dbSpan.addEvent("Successfully created organization membership", {
        id,
        userId,
        organizationId,
      });
    } else {
      dbSpan.setStatus({
        code: SpanStatusCode.ERROR,
      });
      dbSpan.addEvent("Unable to create organization membership");
    }
    dbSpan.end();
    return organizationMembership;
  } catch (error) {
    if (error instanceof Error) {
      dbSpan.setStatus({ code: SpanStatusCode.ERROR });
      dbSpan.addEvent("Unable to create organization membership", {
        error: error.message,
        id,
        userId,
        organizationId,
      });
    }

    dbSpan.end();
    return null;
  }
}

export async function updateOrganizationMembership(
  { db, telemetry }: DbContext,
  event: OrganizationMembershipUpdated,
): Promise<OrganizationMembership | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const dbSpan = tracer.startSpan("Updating organization membership in DB", undefined, traceCtx);

  const { id, userId, organizationId, role, updatedAt } = event.data;

  try {
    const organizationMembership: OrganizationMembership | null = await db
      .prepare(
        `UPDATE organization_membership
        SET role_slug = ?2, updated_at = ?3
        WHERE id = ?1
        RETURNING *`,
      )
      .bind(id, role.slug, new Date(updatedAt).valueOf())
      .first<OrganizationMembership>();

    if (organizationMembership) {
      dbSpan.addEvent("Successfully updated organization membership", {
        id,
        userId,
        organizationId,
      });
    } else {
      dbSpan.setStatus({
        code: SpanStatusCode.ERROR,
      });
      dbSpan.addEvent("Unable to update organization membership");
    }
    dbSpan.end();
    return organizationMembership;
  } catch (error) {
    if (error instanceof Error) {
      dbSpan.setStatus({ code: SpanStatusCode.ERROR });
      dbSpan.addEvent("Unable to update organization membership", {
        error: error.message,
        id,
        userId,
        organizationId,
      });
    }

    dbSpan.end();
    return null;
  }
}

export async function deleteOrganizationMembership(
  { db, telemetry }: DbContext,
  event: OrganizationMembershipDeleted,
): Promise<OrganizationMembership | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const dbSpan = tracer.startSpan("Deleting organization membership in DB", undefined, traceCtx);

  const { id, userId, organizationId } = event.data;

  try {
    const organizationMembership: OrganizationMembership | null = await db
      .prepare(
        `DELETE FROM organization_membership
        WHERE id = ?1
        RETURNING *`,
      )
      .bind(id)
      .first<OrganizationMembership>();

    if (organizationMembership) {
      dbSpan.addEvent("Successfully deleted organization membership", {
        id,
        userId,
        organizationId,
      });
    } else {
      dbSpan.setStatus({
        code: SpanStatusCode.ERROR,
      });
      dbSpan.addEvent("Unable to delete organization membership");
    }
    dbSpan.end();
    return organizationMembership;
  } catch (error) {
    if (error instanceof Error) {
      dbSpan.setStatus({ code: SpanStatusCode.ERROR });
      dbSpan.addEvent("Unable to delete organization membership", {
        error: error.message,
        id,
        userId,
        organizationId,
      });
    }

    dbSpan.end();
    return null;
  }
}
