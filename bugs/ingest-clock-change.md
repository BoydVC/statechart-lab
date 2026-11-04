# ingest-clock-change

Machine `school-pulse/ingest-retry`. Invariant `NoExtraChange`. TLC states on the full graph: 6.

Confirmed: yes.

## What breaks

The second attempt does not only add a row. It also appends another change, because the new clock id looks like a new assignment. This is the same retry as ingest-clock-retry, counted on the change log.

A retry of the same file bytes does not append another change.

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

BoydVC/school-pulse@3b76b08fad2780bf7a760ea65dae619d3a5f628b src/ingest/watch.ts:60 and src/ingest/ingest.ts:241. The baseline or assignment_new draft is inserted for an id the first attempt did not use.

## Failing test

Runner: `node --test dist/tests/ingest-retry.test.js`

Same watcher test as ingest-clock-retry. A stable source id does not add a second change. A {{SP:NOW}} source id does.

Observed: The same run that stored 2 rows also stored 2 changes. TLC violates NoExtraChange on that path.

This lab did not open a pull request on the target repo.

## Fix

Same fix as ingest-clock-retry. Do not retry a file whose ingest transaction already committed.
