import { Miniflare } from "miniflare";

const environment = "test";
const compatibilityDate = "2024-09-03";
const compatibilityFlags = ["nodejs_compat"];
const EVENTS_RANGE_START = "1725645780000"; // Sept. 6, 2024 12:03 PM MT
const EVENTS_RANGE_END = "1725645840000"; // Sept. 6, 2024 12:04 PM MT
export const WORKOS_API_KEY = process.env.WORKOS_API_KEY || "";
export const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID || "";

type WorkosEventsConsumerTestEnv = {
  ENVIRONMENT: string;
  EVENTS_RANGE_START: string;
  EVENTS_RANGE_END: string;
  SERVICE_NAME: string;
  WORKOS_API_KEY: string;
  WORKOS_CLIENT_ID: string;
};

const workosEventsConsumerEnv: WorkosEventsConsumerTestEnv = {
  ENVIRONMENT: environment,
  EVENTS_RANGE_START,
  EVENTS_RANGE_END,
  SERVICE_NAME: `workos-events-consumer-${environment}`,
  WORKOS_API_KEY,
  WORKOS_CLIENT_ID,
};

export const miniflareTest = new Miniflare({
  cache: true,
  cachePersist: false,
  d1Persist: ".wrangler/state/test/v3/d1",
  workers: [
    // workos-events-consumer
    {
      bindings: {
        ...workosEventsConsumerEnv,
      },
      compatibilityDate,
      compatibilityFlags,
      d1Databases: {
        // Same binding and ID as the worker's [[env.test.d1_databases]] in wrangler.toml
        APP_DB: "b34d66a0-819e-4bc9-83ca-7f11f8deaee4",
      },
      name: "workos-events-consumer",
      modules: true,
      scriptPath: "test-dist/workos-events-consumer/index.js",
    },
  ],
});
