import { WorkOS } from "@workos-inc/node";

import { WORKOS_API_KEY } from "../miniflare";

// Test events setup
// Create 3 of each entity. One for create/update/delete
// Delete entity 1 of each type
// Leave entity 2 as is
// Update entity 3

// Run test events within a timeframe and then consume those events during
// the executed timeframe.
export async function emitTestingEvents() {
  const workos = new WorkOS(WORKOS_API_KEY);

  // Create organization 1
  const { id: organization1Id } = await workos.organizations.createOrganization({
    name: "TestOrganization1",
  });

  // Create organization 2
  const { id: organization2Id } = await workos.organizations.createOrganization({
    name: "TestOrganization2",
  });

  // Create organization 3
  const { id: organization3Id } = await workos.organizations.createOrganization({
    name: "TestOrganization3",
  });

  // Update organization 3
  await workos.organizations.updateOrganization({
    name: "TestOrganization3-updated",
    organization: organization3Id,
  });

  // Create user 1
  const { id: user1Id } = await workos.userManagement.createUser({
    firstName: "Test",
    lastName: "User1",
    email: "hello+test_user1@kustom.dev",
    emailVerified: true,
  });

  // Create user 2
  const { id: user2Id } = await workos.userManagement.createUser({
    firstName: "Test",
    lastName: "User2",
    email: "hello+test_user2@kustom.dev",
    emailVerified: true,
  });

  // Create user 3
  const { id: user3Id } = await workos.userManagement.createUser({
    firstName: "Test",
    lastName: "User3",
    email: "hello+test_user3@kustom.dev",
    emailVerified: true,
  });

  // Update user 3
  await workos.userManagement.updateUser({ userId: user3Id, firstName: "Test Updated" });

  // Create organization membership 1
  const { id: organizationMembership1Id } =
    await workos.userManagement.createOrganizationMembership({
      userId: user1Id,
      organizationId: organization1Id,
      roleSlug: "admin",
    });

  // Create organization membership 2
  await workos.userManagement.createOrganizationMembership({
    userId: user2Id,
    organizationId: organization2Id,
    roleSlug: "admin",
  });

  // Create organization membership 3
  const { id: organizationMembership3Id } =
    await workos.userManagement.createOrganizationMembership({
      userId: user3Id,
      organizationId: organization3Id,
      roleSlug: "admin",
    });

  // Update organization membership 3
  await workos.userManagement.updateOrganizationMembership(organizationMembership3Id, {
    roleSlug: "member",
  });

  // Delete organization membership
  await workos.userManagement.deleteOrganizationMembership(organizationMembership1Id);

  // Delete user
  await workos.userManagement.deleteUser(user1Id);

  // Delete organization 1
  await workos.organizations.deleteOrganization(organization1Id);
}
