// Generated by Wrangler on Fri Sep 06 2024 17:17:20 GMT-0600 (Mountain Daylight Time)
// by running `wrangler types --env dev`

interface Env {
  ENVIRONMENT: string;
  // Need to mark EVENT_RANGE_* params are optional
  EVENTS_RANGE_START: string | undefined;
  EVENTS_RANGE_END: string | undefined;
  SERVICE_NAME: string;
  WORKOS_API_KEY: string;
  WORKOS_CLIENT_ID: string;
  APP_DB: D1Database;
}
