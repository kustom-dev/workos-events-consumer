import { describe, expect, test } from "vitest";

import {
  fetchEventsCount,
  fetchLatestEventsCursor,
  getOrganizationMemberships,
  getOrganizations,
  getUsers,
} from "../helpers/db";
import { miniflareTest } from "../miniflare";

/*
// Uncomment when new events need to be generated on WorkOS staging environment

import { emitTestingEvents } from "./events-scenario";
describe("Emit all events needed for testing", async () => {
  await emitTestingEvents();

  test("Dummy test", () => expect(1).toEqual(1));
});
 */

const organization2Id = "org_01J7482ZQG179BYR745451DF27";
const organization3Id = "org_01J748304VB0W4X4YMWDSAANNE";
const user2Id = "user_01J7483137DEVGDGJNPA6941HC";
const user3Id = "user_01J74831858SGJKWM7ES6JNWW7";
const organizationMembership2Id = "om_01J748328BZXKFPH38JXPK94T8";
const organizationMembership3Id = "om_01J74832PGC2JPP3BFEPB9Q5DC";
const finalEventId = "event_01J74834KV8Y9WAVNKPPH78XZ2";

describe("Test events cursor", async () => {
  const worker = await miniflareTest.getWorker("workos-events-consumer");
  const db = await miniflareTest.getD1Database("APP_DB");

  test("Test events cursor null at start", async () => {
    const currentEventIdCursorBefore = await fetchLatestEventsCursor(db);

    // No events should be in the DB at this point
    expect(currentEventIdCursorBefore).toBe(null);
  });

  test("Test count for all events", async () => {
    // Trigger scheduled worker invocation
    await worker.scheduled({ cron: "* * * * *" });
    const currentEventIdCursorAfter = await fetchLatestEventsCursor(db);
    const eventsCount = await fetchEventsCount(db);
    expect(currentEventIdCursorAfter).toBe(finalEventId);
    expect(eventsCount).toBe(15);
  });

  test("Organization events", async () => {
    const [organization2, organization3] = await getOrganizations(db);
    // Organization 2
    expect(organization2.id).toBe(organization2Id);
    expect(organization2.name).toBe("TestOrganization2");
    // Organization 3
    expect(organization3.id).toBe(organization3Id);
    expect(organization3.name).toBe("TestOrganization3-updated");
  });

  test("User events", async () => {
    const [user2, user3] = await getUsers(db);
    // User 2
    expect(user2.id).toBe(user2Id);
    expect(user2.email).toBe("hello+test_user2@kustom.dev");
    expect(user2.email_verified).toBe(1);
    expect(user2.first_name).toBe("Test");
    expect(user2.last_name).toBe("User2");
    // User 3
    expect(user3.id).toBe(user3Id);
    expect(user3.email).toBe("hello+test_user3@kustom.dev");
    expect(user3.email_verified).toBe(1);
    expect(user3.first_name).toBe("Test Updated");
    expect(user3.last_name).toBe("User3");
  });

  test("Organization membership events", async () => {
    const [organizationMembership2, organizationMembership3] = await getOrganizationMemberships(db);
    // Organization Membership 2
    expect(organizationMembership2.id).toBe(organizationMembership2Id);
    expect(organizationMembership2.user_id).toBe(user2Id);
    expect(organizationMembership2.organization_id).toBe(organization2Id);
    expect(organizationMembership2.role_slug).toBe("admin");

    // Organization Membership 3
    expect(organizationMembership3.id).toBe(organizationMembership3Id);
    expect(organizationMembership3.user_id).toBe(user3Id);
    expect(organizationMembership3.organization_id).toBe(organization3Id);
    expect(organizationMembership3.role_slug).toBe("member");
  });
});
