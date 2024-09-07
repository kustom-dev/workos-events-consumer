// Test queries which don't require the entire DbContext used in workers.

import { Organization } from "../../src/db/organization";
import { OrganizationMembership } from "../../src/db/organization-membership";
import { User } from "../../src/db/user";

export async function fetchLatestEventsCursor(db: D1Database): Promise<string | null> {
  const stmt = db.prepare("SELECT event_id FROM events_cursor ORDER BY created_at DESC LIMIT 1");
  return await stmt.first<string>("event_id");
}

export async function fetchEventsCount(db: D1Database): Promise<number | null> {
  return await db.prepare("SELECT count(*) FROM events_cursor").first<number>("count(*)");
}

export async function getOrganizationMemberships(
  db: D1Database,
): Promise<OrganizationMembership[]> {
  return (
    await db
      .prepare("SELECT * FROM organization_membership ORDER BY created_at ASC")
      .all<OrganizationMembership>()
  ).results;
}

export async function getOrganizations(db: D1Database): Promise<Organization[]> {
  return (
    await db.prepare("SELECT * FROM organization ORDER BY created_at ASC").all<Organization>()
  ).results;
}

export async function getUsers(db: D1Database): Promise<User[]> {
  return (await db.prepare("SELECT * FROM user ORDER BY created_at ASC").all<User>()).results;
}
