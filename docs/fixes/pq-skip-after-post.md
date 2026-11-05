# pq-skip-after-post

Machine `post-queue/status`. Invariant `SkipOnlyBeforePost`. Original write-up: [`bugs/pq-skip-after-post.md`](../../bugs/pq-skip-after-post.md).

## Bug

The `skip` action has no status check, so a posted item can be marked skipped and its posted history is lost.

## Counterexample (TLC 2.19 on the original model)

Result: FAIL (Invariant SkipOnlyBeforePost is violated). States at stop: 12 / 9 generated / distinct.

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

State 4: <Skip Status>
/\ cued = FALSE
/\ seenPosted = TRUE
/\ approved = TRUE
/\ phase = "skipped"
```

## Fixed model

[`models/fixed/StatusFixSkipAfterPost.tla`](../../models/fixed/StatusFixSkipAfterPost.tla) with `models/fixed/StatusFixSkipAfterPost.cfg`.

`Skip` is enabled only from `draft`, `approved`, or `cued`.

Result: **PASS**, 15 / 8 generated / distinct states, depth 4.

## Proposed code fix

Patch: [`docs/fixes/patches/x-post-queue-status-gates-and-lock.patch`](patches/x-post-queue-status-gates-and-lock.patch). Proposal only. It is not applied to the target repo, and it was checked with `patch --dry-run` against the pinned commit but not built or tested there.

`skip` returns 400 unless the status is draft, approved, or cued (matching the UI `canSkip`).
