# ingest-clock-retry

Machine `school-pulse/ingest-retry`. Invariant `AtMostOneRow`. TLC states on the full graph: 6.

Confirmed: yes.

## What breaks

The watcher retries inside the same try that already committed. Each attempt expands {{SP:NOW}} with a new Date. A source id that depends on that clock becomes a second row. A stable source id stays one row.

One inbox file ends as one assignment row, including a retry.

## Trace

0. Init
   changes=0, rows=0, attempt=0, phase="ready", threw=false
1. Commit https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/ingest/watch.ts#L60
   changes=1, rows=1, attempt=1, phase="callback", threw=false
2. CallbackThrows https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/main.ts#L70
   changes=1, rows=1, attempt=1, phase="ready", threw=true
3. Commit https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/ingest/watch.ts#L60
   changes=2, rows=2, attempt=2, phase="callback", threw=true

## Code

BoydVC/school-pulse@3b76b08fad2780bf7a760ea65dae619d3a5f628b src/ingest/watch.ts:56, src/adapters/index.ts:20, src/main.ts:70. The publish callback sits inside the retry try. ingestSnapshot commits in src/ingest/ingest.ts:61 before the callback.

## Failing test

Runner: `node --test dist/tests/ingest-retry.test.js`

startWatcher with onResult throwing once, then a generic file whose assignment sourceId is {{SP:NOW}}. listAssignments length is 2. The same test with sourceId quiz-1 stays at 1.

Observed: AssertionError: 2 !== 1. The stable-id test in the same file passed.

This lab did not open a pull request on the target repo.

## Fix

Treat a successful ingestSnapshot as committed even if the callback throws. Expand clock tokens once per file bytes, or refuse a retry when the database transaction already committed.
