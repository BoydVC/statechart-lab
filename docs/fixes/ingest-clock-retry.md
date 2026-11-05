# ingest-clock-retry

Machine `school-pulse/ingest-retry`. Invariant `AtMostOneRow`. Original write-up: [`bugs/ingest-clock-retry.md`](../../bugs/ingest-clock-retry.md).

## Bug

`ingestSnapshot` commits, then the `onResult` callback throws inside the same try block in `watch.ts`, so the retry loop ingests the same file again. With clock tokens expanded per attempt, the second pass writes a second row.

## Counterexample (TLC 2.19 on the original model)

Result: FAIL (Invariant AtMostOneRow is violated). States at stop: 5 / 5 generated / distinct.

```
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\ changes = 0
/\ rows = 0
/\ attempt = 0
/\ phase = "ready"
/\ threw = FALSE

State 2: <Commit Ingest>
/\ changes = 1
/\ rows = 1
/\ attempt = 1
/\ phase = "callback"
/\ threw = FALSE

State 3: <CallbackThrows Ingest>
/\ changes = 1
/\ rows = 1
/\ attempt = 1
/\ phase = "ready"
/\ threw = TRUE

State 4: <Commit Ingest>
/\ changes = 2
/\ rows = 2
/\ attempt = 2
/\ phase = "callback"
/\ threw = TRUE
```

## Fixed model

[`models/fixed/IngestFixed.tla`](../../models/fixed/IngestFixed.tla) with `models/fixed/IngestFixClockRetry.cfg`.

`CallbackThrows` ends in `done` instead of `ready`: a committed ingest is never retried.

Result: **PASS**, 6 / 4 generated / distinct states, depth 3.

## Proposed code fix

Patch: [`docs/fixes/patches/school-pulse-ingest-no-retry-after-commit.patch`](patches/school-pulse-ingest-no-retry-after-commit.patch). Proposal only. It is not applied to the target repo, and it was checked with `patch --dry-run` against the pinned commit but not built or tested there.

The callback runs in its own try/catch after the commit, so its error is logged and the loop returns. The second half of the lab's fix note (expand clock tokens once per file bytes) is not in this patch; the model shows the no-retry change alone closes both invariants.
