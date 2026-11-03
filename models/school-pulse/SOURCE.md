# school-pulse

Pinned commit `3b76b08fad2780bf7a760ea65dae619d3a5f628b` on BoydVC/school-pulse.

## Oauth

| Action | Source | What the code does |
| --- | --- | --- |
| Exchange | `src/auth/oauth.ts:79` | `exchangeAuthCode` stores the token response. |
| Tick | `src/auth/oauth.ts:114` | `expires_at` is computed. Nothing schedules a refresh. |
| Expire | `src/auth/oauth.ts:111` | `refresh_token` is stored. No later line reads it. |

`RefreshBeforeReauth` is marked `expected:` because expiry moves straight to re-auth while a refresh token may already be stored.

## Ingest

| Action | Source | What the code does |
| --- | --- | --- |
| Init | `src/store/db.ts:58` | Assignments are unique on `(source, source_id)`. |
| IngestA | `src/ingest/ingest.ts:97` | Lookup is by source and sourceId. |
| IngestB | `src/ingest/ingest.ts:151` | The same assignment is left unchanged. |

## Sse

| Action | Source | What the code does |
| --- | --- | --- |
| Init | `web/app.ts:99` | `connect()` runs once at startup. |
| Connect | `web/app.ts:466` | The function constructs one `EventSource`. |
| Drop | `web/app.ts:476` | `onerror` marks the pill off and does not call `connect()` again. |

The browser retries while the source is still connecting. The model is the closed path, which this handler does not reopen. `ReconnectScheduled` is marked `expected:`.
