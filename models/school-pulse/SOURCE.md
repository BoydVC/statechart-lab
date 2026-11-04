# school-pulse

Pinned commit `3b76b08fad2780bf7a760ea65dae619d3a5f628b` on https://github.com/BoydVC/school-pulse.

The three machines share this tree. Names below are the TLC actions.

## OAuth.tla

One token file per provider. Two sign-ins, `desk` and `phone`, are two household accounts writing that file. The commit stores `refresh_token` and `expires_at` and never sends a refresh grant. `Tick` is time passing against `expires_at`. It is not a function.

| Action | Code |
| --- | --- |
| StartDesk, StartPhone | `src/auth/oauth.ts:127` `runInstalledAppFlow` |
| FinishDesk, FinishPhone | `src/auth/oauth.ts:118` `writeToken`, called at line 199 |
| UseDesk, UsePhone | `src/main.ts:150` `readToken` |
| Tick | `src/auth/oauth.ts:114` stores `expires_at`, which `readToken` ignores |
| Done | Stutter so a finished file is not a deadlock |

`NotExpiredUse` and `NoStaleClobber` fail. `TokenFileCoherent` holds.

The chart hides `Done`. It draws 9 states. TLC's full graph is 112 states.

## Ingest.tla

`Tokenized = TRUE` is a file whose source id depends on `{{SP:NOW}}`. `Tokenized = FALSE` is a stable source id. Both use the same actions.

| Action | Code |
| --- | --- |
| Commit | `src/ingest/watch.ts:56` reads the file with a new `Date`, then `ingestSnapshot` |
| CallbackThrows | `src/main.ts:70` `onResult` sits inside the retry `try` at `watch.ts:66` |
| CallbackOk | `src/ingest/watch.ts:67` |
| GiveUp | `src/ingest/watch.ts:73` after four attempts |
| Done | Stutter after the loop |

The clock-token config violates `AtMostOneRow` and `NoExtraChange`. The stable config holds both. TLC reaches 6 states either way.

The chart hides `GiveUp` and `Done`.

A transaction (`src/ingest/ingest.ts:61`) and `UNIQUE(source, source_id)` (`src/store/db.ts:58`) keep a stable id to one row. They do not help when the expanded id changes between attempts.

## Sse.tla

| Action | Code |
| --- | --- |
| Drop | `web/app.ts:476` `onerror` sets the pill off |
| Publish | `src/server/hub.ts:26` writes to current clients and does not keep the pulse |
| Connect | `web/app.ts:472` `onopen` sets the pill on and does not refresh |
| Poll | `web/app.ts:100` refreshes every 60 seconds |
| Done | Stutter once the view is current and the stream is up |

`LiveMeansCaughtUp` fails. `PillMatchesLink` holds. TLC reaches 4 states.

The chart hides `Done`. `src/server/server.ts:102` opens the stream with no event id.

Out of the model: webhook delivery, and the text of a pulse.

## Silence.tla

The open stream. `web/app.ts:466-479` creates one EventSource and has no silence timer. `onerror` at `web/app.ts:476` is a different path. The browser retries that path. `Reconnect` in the model is that browser retry. `Silence` never reaches it.

`SilentStreamReconnects` fails. `AtMostOneSocket` holds.

## Assignment.tla

| Action | Code |
| --- | --- |
| TurnIn | `src/domain/enforce.ts:33-59` builds the assignment draft |
| Attach | `src/domain/enforce.ts:70-74` will not keep a graded row that has no points |
| Grade | `src/domain/enforce.ts:68-74` sets missing earned to 0 and changes a graded row without points |

`GradedHasPoints` and `MissingIsUngraded` hold. Missing stays status missing. Graded without points does not stay graded.
