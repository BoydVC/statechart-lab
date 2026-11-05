# queue-stale-posted

Machine `post-queue/approval`. Invariant `RevokeSticks`. Original write-up: [`bugs/queue-stale-posted.md`](../../bugs/queue-stale-posted.md).

## Bug

`load_queue` and `save_queue` each take the lock, but a handler drops it in between. A "posted" request can load an approved item, an edit revokes approval, and the "posted" save then writes back the whole stale file: the revoked draft comes back as posted with the old text.

## Counterexample (TLC 2.19 on the original model)

Result: FAIL (Invariant RevokeSticks is violated). States at stop: 137 / 77 generated / distinct.

```
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\ snapText = "t1"
/\ revoked = FALSE
/\ text = "t1"
/\ approvedText = ""
/\ loaded = FALSE
/\ status = "draft"
/\ snapApproved = ""
/\ version = 0
/\ snapStatus = "draft"

State 2: <Approve Queue>
/\ snapText = "t1"
/\ revoked = FALSE
/\ text = "t1"
/\ approvedText = "t1"
/\ loaded = FALSE
/\ status = "approved"
/\ snapApproved = ""
/\ version = 1
/\ snapStatus = "draft"

State 3: <Load Queue>
/\ snapText = "t1"
/\ revoked = FALSE
/\ text = "t1"
/\ approvedText = "t1"
/\ loaded = TRUE
/\ status = "approved"
/\ snapApproved = "t1"
/\ version = 1
/\ snapStatus = "approved"

State 4: <Edit Queue>
/\ snapText = "t1"
/\ revoked = TRUE
/\ text = "t2"
/\ approvedText = ""
/\ loaded = TRUE
/\ status = "draft"
/\ snapApproved = "t1"
/\ version = 2
/\ snapStatus = "approved"

State 5: <Arm Queue>
/\ snapText = "t1"
/\ revoked = TRUE
/\ text = "t2"
/\ approvedText = ""
/\ loaded = TRUE
/\ status = "draft"
/\ snapApproved = "t1"
/\ version = 2
/\ snapStatus = "posted"

State 6: <CommitSnap Queue>
/\ snapText = "t1"
/\ revoked = TRUE
/\ text = "t1"
/\ approvedText = "t1"
/\ loaded = FALSE
/\ status = "posted"
/\ snapApproved = "t1"
/\ version = 3
/\ snapStatus = "posted"
```

## Fixed model

[`models/fixed/QueueFixed.tla`](../../models/fixed/QueueFixed.tla) with `models/fixed/QueueFixed.cfg`.

`Approve` and `Edit` require `~loaded` (no write lands while another request holds a snapshot: the lock is held across load/check/save). `CommitSnap` also requires `approvedText = snapApproved` and `status # "draft"` (reject the save if approval changed).

Result: **PASS**, 218 / 87 generated / distinct states, depth 8.

## Proposed code fix

Patch: [`docs/fixes/patches/x-post-queue-status-gates-and-lock.patch`](patches/x-post-queue-status-gates-and-lock.patch). Proposal only. It is not applied to the target repo, and it was checked with `patch --dry-run` against the pinned commit but not built or tested there.

`do_POST` holds the re-entrant `_lock` around the whole handler (load, check, save) via `_do_post_locked`.
