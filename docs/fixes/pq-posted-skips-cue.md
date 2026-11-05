# pq-posted-skips-cue

Machine `post-queue/status`. Invariant `ScheduledBeforePosted`. Original write-up: [`bugs/pq-posted-skips-cue.md`](../../bugs/pq-posted-skips-cue.md).

## Bug

The `posted` action accepts `approved`, so an item can be marked posted without ever being cued. The UI button allows the same.

## Counterexample (TLC 2.19 on the original model)

Result: FAIL (Invariant ScheduledBeforePosted is violated). States at stop: 5 / 5 generated / distinct.

```
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\ cued = FALSE
/\ seenPosted = FALSE
/\ approved = FALSE
/\ phase = "draft"

State 2: <Approve Status>
/\ cued = FALSE
/\ seenPosted = FALSE
/\ approved = TRUE
/\ phase = "approved"

State 3: <PostFromApproved Status>
/\ cued = FALSE
/\ seenPosted = TRUE
/\ approved = TRUE
/\ phase = "posted"
```

## Fixed model

[`models/fixed/StatusFixPostedSkipsCue.tla`](../../models/fixed/StatusFixPostedSkipsCue.tla) with `models/fixed/StatusFixPostedSkipsCue.cfg`.

The `PostFromApproved` action is removed from `Next`.

Result: **PASS**, 15 / 8 generated / distinct states, depth 5.

## Proposed code fix

Patch: [`docs/fixes/patches/x-post-queue-status-gates-and-lock.patch`](patches/x-post-queue-status-gates-and-lock.patch). Proposal only. It is not applied to the target repo, and it was checked with `patch --dry-run` against the pinned commit but not built or tested there.

The `posted` gate accepts only `cued` or `posted`; the UI `canPosted` is `cued` only.
