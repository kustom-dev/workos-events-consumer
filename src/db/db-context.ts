import { Telemetry } from "../telemetry/cloudflare-worker-tracer";

export type DbContext = {
  db: D1Database;
  telemetry: Telemetry;
};
