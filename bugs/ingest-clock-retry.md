# ingest-clock-retry

Machine `school-pulse/ingest-retry`. Invariant `AtMostOneRow`. TLC states on the full graph: 6.

Confirmed: yes.

## What breaks

The watcher retries inside the same try that already committed. Each attempt expands {{SP:NOW}} with a new Date. A source id that depends on that clock becomes a second row. A stable source id stays one row.

One inbox file ends as one assignment row, including a retry.

## Trace

0. Init
   changes=0, rows=0, attempt=0, phase="ready", threw=false
1. Commit [object Object]
   changes=1, rows=1, attempt=1, phase="callback", threw=false
2. CallbackThrows [object Object]
   changes=1, rows=1, attempt=1, phase="ready", threw=true
3. Commit [object Object]
   changes=2, rows=2, attempt=2, phase="callback", threw=true

## Code

BoydVC/school-pulse@3b76b08 src/ingest/watch.ts:56-67, src/model/tokens.ts:12, src/main.ts:70. ingestSnapshot commits in src/ingest/ingest.ts:61 before the callback.

## Failing test

Runner: `Same school-pulse node --test run as oauth-expired-use.`

Test name: a watcher retry of {{SP:NOW}} does not insert a second row or a second change. startWatcher onResult throws once. The clock id stored 2 rows and 2 changes.

Observed: AssertionError: { rows: 2, changes: 2 } !== { rows: 1, changes: 1 }. The stable source id test in the same file passed with 1 row.

This lab did not open a pull request on the target repo.

## Fix

Treat a successful ingestSnapshot as committed even if the callback throws. Expand clock tokens once per file bytes.
