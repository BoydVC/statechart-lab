# ingest-clock-change

Machine `school-pulse/ingest-retry`. Invariant `NoExtraChange`. Original write-up: [`bugs/ingest-clock-change.md`](../../bugs/ingest-clock-change.md).

## Bug

Same root cause as ingest-clock-retry: the retry after a committed ingest appends a second change entry for identical file bytes.

## Counterexample (TLC 2.19 on the original model)

Result: FAIL (Invariant NoExtraChange is violated). States at stop: 5 / 5 generated / distinct.

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

[`models/fixed/IngestFixed.tla`](../../models/fixed/IngestFixed.tla) with `models/fixed/IngestFixClockChange.cfg`.

Same fixed module as ingest-clock-retry, checked against `NoExtraChange`.

Result: **PASS**, 6 / 4 generated / distinct states, depth 3.

## Proposed code fix

Patch: [`docs/fixes/patches/school-pulse-ingest-no-retry-after-commit.patch`](patches/school-pulse-ingest-no-retry-after-commit.patch). Proposal only. It is not applied to the target repo, and it was checked with `patch --dry-run` against the pinned commit but not built or tested there.

Same patch as ingest-clock-retry.
