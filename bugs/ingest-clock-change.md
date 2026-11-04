# ingest-clock-change

Machine `school-pulse/ingest-retry`. Invariant `NoExtraChange`. TLC states on the full graph: 6.

Confirmed: yes.

## What breaks

The second attempt appends another change, because the new clock id looks like a new assignment.

A retry of the same file bytes does not append another change.

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

BoydVC/school-pulse@3b76b08 src/ingest/watch.ts:60 and src/ingest/ingest.ts:61.

## Failing test

Runner: `Same school-pulse node --test run as ingest-clock-retry.`

Same watcher test as ingest-clock-retry. A stable source id does not add a second change. A {{SP:NOW}} source id does.

Observed: The same assertion recorded changes: 2. TLC violates NoExtraChange on that path.

This lab did not open a pull request on the target repo.

## Fix

Same fix as ingest-clock-retry. Do not retry a file whose ingest transaction already committed.
