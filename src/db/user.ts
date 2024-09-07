import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { UserCreatedEvent, UserDeletedEvent, UserUpdatedEvent } from "@workos-inc/node";

import { DbContext } from "./db-context";

export type User = {
  id: string;
  email: string;
  email_verified: number; // boolean (0 or 1)
  first_name: string;
  last_name: string;
  profile_picture_url: string;
  created_at: number;
  updated_at: number;
};

export async function createUser(
  { db, telemetry }: DbContext,
  event: UserCreatedEvent,
): Promise<User | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const dbSpan = tracer.startSpan("Creating user in DB", undefined, traceCtx);

  const { id, email, emailVerified, firstName, lastName, profilePictureUrl, createdAt, updatedAt } =
    event.data;

  try {
    const user: User | null = await db
      .prepare(
        `INSERT INTO user (id, email, email_verified, first_name, last_name, profile_picture_url, created_at, updated_at) 
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        RETURNING *`,
      )
      .bind(
        id,
        email,
        emailVerified,
        firstName,
        lastName,
        profilePictureUrl,
        new Date(createdAt).valueOf(),
        new Date(updatedAt).valueOf(),
      )
      .first<User>();

    if (user) {
      dbSpan.addEvent("Successfully created user", { id, email });
    } else {
      dbSpan.setStatus({
        code: SpanStatusCode.ERROR,
      });
      dbSpan.addEvent("Unable to create user");
    }
    dbSpan.end();
    return user;
  } catch (error) {
    if (error instanceof Error) {
      dbSpan.setStatus({ code: SpanStatusCode.ERROR });
      dbSpan.addEvent("Unable to create user", { error: error.message, id });
    }

    dbSpan.end();
    return null;
  }
}

export async function updateUser(
  { db, telemetry }: DbContext,
  event: UserUpdatedEvent,
): Promise<User | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const dbSpan = tracer.startSpan("Updating user in DB", undefined, traceCtx);

  const { id, email, firstName, lastName, emailVerified, updatedAt } = event.data;

  try {
    const user: User | null = await db
      .prepare(
        `UPDATE user
        SET email_verified = ?2, first_name = ?3, last_name = ?4, updated_at = ?5
        WHERE id = ?1
        RETURNING *`,
      )
      .bind(id, emailVerified, firstName, lastName, new Date(updatedAt).valueOf())
      .first<User>();

    if (user) {
      dbSpan.addEvent("Successfully updated user", { id, email });
    } else {
      dbSpan.setStatus({
        code: SpanStatusCode.ERROR,
      });
      dbSpan.addEvent("Unable to update user");
    }
    dbSpan.end();
    return user;
  } catch (error) {
    if (error instanceof Error) {
      dbSpan.setStatus({ code: SpanStatusCode.ERROR });
      dbSpan.addEvent("Unable to update user", { error: error.message, id });
    }

    dbSpan.end();
    return null;
  }
}

export async function deleteUser(
  { db, telemetry }: DbContext,
  event: UserDeletedEvent,
): Promise<User | null> {
  const { parentSpan, tracer } = telemetry;
  const traceCtx = trace.setSpan(context.active(), parentSpan);
  const dbSpan = tracer.startSpan("Deleting user in DB", undefined, traceCtx);

  const { id, email } = event.data;

  try {
    const user: User | null = await db
      .prepare(
        `DELETE FROM user
        WHERE id = ?1
        RETURNING *`,
      )
      .bind(id)
      .first<User>();

    if (user) {
      dbSpan.addEvent("Successfully deleted user", { id, email });
    } else {
      dbSpan.setStatus({
        code: SpanStatusCode.ERROR,
      });
      dbSpan.addEvent("Unable to delete user");
    }
    dbSpan.end();
    return user;
  } catch (error) {
    if (error instanceof Error) {
      dbSpan.setStatus({ code: SpanStatusCode.ERROR });
      dbSpan.addEvent("Unable to delete user", { error: error.message, id });
    }

    dbSpan.end();
    return null;
  }
}
