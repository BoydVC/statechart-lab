# school-pulse

Pinned commit `3b76b08fad2780bf7a760ea65dae619d3a5f628b` on [BoydVC/school-pulse](https://github.com/BoydVC/school-pulse).

## Oauth.tla

| Action | Code |
| --- | --- |
| Exchange | `src/auth/oauth.ts:79-116` stores `expires_at` and `refresh_token` |
| Age | `src/auth/oauth.ts:108-115` writes `expires_at`. No later function reads it |
| Sync | `src/main.ts:150-157` returns `access_token` only. `src/main.ts:124-132` passes that string to fetch |
| Finish | `src/main.ts:139-147` ingests the snapshot. There is no refresh branch |
| Reauth | `src/main.ts:165-186` is the separate `auth` command. Sync does not call it |
| Store | `src/auth/oauth.ts:118-121` and `src/auth/oauth.ts:199` write the token file |

## Ingest.tla

| Action | Code |
| --- | --- |
| First | `src/ingest/ingest.ts:128-149` inserts when `getAssignmentBySource` misses |
| Again | `src/ingest/ingest.ts:97` and `src/ingest/ingest.ts:151`. `src/store/db.ts:58` is `UNIQUE(source, source_id)`. `src/store/db.ts:317-318` looks up that pair |

## Sse.tla

| Action | Code |
| --- | --- |
| Open | `web/app.ts:466-467` creates one `EventSource` |
| Silence | `web/app.ts:466-479` has no timer. The server writes a comment ping at `src/server/server.ts:110-116` |
| Error | `web/app.ts:476-478` sets the pill off |
| Reconnect | `web/app.ts:472-475` runs on open. The browser retries a broken socket. The function does not call `connect()` again |
| Park | Silence never reaches `onerror`, so the pill stays live |

## Assignment.tla

| Action | Code |
| --- | --- |
| TurnIn | `src/domain/assignment.ts:36-41` and `src/domain/enforce.ts:33-59` |
| Attach | `src/domain/assignment.ts:98-102` graded work needs points. `src/domain/enforce.ts:70-74` drops a graded row that has none |
| Grade | `src/domain/enforce.ts:62-78` forces missing earned to 0 and will not keep a graded status without points |
