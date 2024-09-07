# @kustom/workos-events-consumer

## What does this Cloudflare Worker do?
[WorkOS](https://workos.com/) is an auth service provider with a variety of products. It has an [Events API](https://workos.com/docs/events/data-syncing/events-api) which allows customers to sync WorkOS data within their application. WorkOS also provides webhooks but the Events API is the recommended approach to syncing data.

This repository contains a Cloudflare worker which runs on a schedule (every 60 seconds) and persists WorkOS data to a [Cloudflare D1 database](https://developers.cloudflare.com/d1). You can still use this code with another SQL database by using [Hyperdrive](https://developers.cloudflare.com/hyperdrive/). As of now, this repository does not contain a Hyperdrive example.

## Getting Started
- Have `npm`, `yarn` or `pnpm` installed. Commands in this repo use `pnpm`
- Install dependencies via `pnpm i`
- Initialize the dev DB with `pnpm run dev:init-db`
- Start jaeger containers for viewing telemetry with `docker compose up -d`
- Go to http://localhost:16686 for the dev environment and http://localhost:16687 for the test environment to view traces
- Copy `sample.dev.vars` to `.dev.vars`
- Add your WorkOS credentials to the `.dev.vars` file
- Run with `pnpm run dev`
- In another terminal tab run `curl 'http://localhost:8787/__scheduled?cron=*+*+*+*+*'`
- The default behavior for the development environment is to request events in the last 60 seconds from the WorkOS Events API
- You can modify this behavior by adding `EVENTS_RANGE_START` and/or `EVENTS_RANGE_END` to `.dev.vars` to fetch events within a given time range. Both env vars need to be a Unix Timestamp in Milliseconds
- See the [Testing](#testing) section for how to generate and test events within a specific time range

### Known limitations
- This example worker does not take in event replay into account, processing the same event again will result in an error because the `event_id` and payload will already be in the database. This can be viewed as a feature or a bug depending on how you look at it
- Running newer events is considered safe but please do your own testing

## Local Database & Migrations
- Create a new migration
```
pnpm run migrations:create kustom_app_dev create_user_org_cursor_tables --env dev
```

- Apply migrations
```
pnpm run dev:init-db
```

- Reset development DB
```
pnpm run dev:destroy-db
```

## Testing
The current recommended approach for testing Cloudflare Workers is the [Vitest Integration](https://developers.cloudflare.com/workers/testing/vitest-integration/). It is in beta and I have not had a great experience with it, so far. The Vitest Integration is pinned to vitest version `1.5.0` at the time of writing (Sep 2024).

The tests in this repo DO NOT use the Vitest Integration. They run on the latest version of Vitest and Miniflare. The setup probably seems tedious but since I've invested the time and effort to get it working, I'm rolling with it until the Vitest Integration is stable.

I didn't want to create new events every time the test suite runs. To get around that, I create a set of events that are appropriate for my use case, then set the `EVENTS_RANGE_START` and `EVENTS_RANGE_END` environment variables for the `test` environment. This ensures that I'm always processing the same events but still calling out to the real WorkOS API.

Over time, when new events are added, they can be re-processed and the time interval for test events can be updated.

- To run the test suite, copy `sample.envrc` to `.envrc` if you use [direnv](https://direnv.net/) or ensure those env vars are loaded
- The test suite uses Vitest and Node's `process.env` to read environment variables
- Uncomment the test at the top of `cursor.test.ts` and run the suite with `pnpm run test`
- The tests will fail since the IDs for each entity will be different compared to the ones I've used
- You can replace the IDs or change the `emitTestingEvents()` function to match your use case
- Once you've matched the IDs, the tests should pass
- If you want to examine your test D1 database, it's in `.wrangler/state/test/v3/d1/miniflare-D1DatabaseObject`

### References

The implementation in this repo was informed by [this blog post](https://workos.com/blog/why-you-should-rethink-your-webhook-strategy) from WorkOS.

Thanks for providing an alternative to the webhook strategy and writing a detailed post about it.

### Questions/Comments

If you have questions or would like to chat about this implementation, feel free to reach out via email: `hello@kustom.dev`