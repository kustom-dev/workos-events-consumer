import { execSync } from "child_process";

const skipTeardownAndMigrate = JSON.parse(process.env.SKIP_TEARDOWN_MIGRATE || "false");

// Global setup runs inside Node.js, not workerd
export default function () {
  if (skipTeardownAndMigrate) {
    console.log("Skipping teardown and migration of test DB...");
  } else {
    console.log("Tearing down test DB...");
    execSync("rm -rf .wrangler/state/test");

    console.log("Migrating worker test DB...");
    execSync("pnpm run test:init-db");
  }
  console.log("Building workos-events-consumer...");
  execSync("wrangler deploy --dry-run --outdir ./test-dist/workos-events-consumer");
}
