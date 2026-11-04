# pq-skip-after-post

Machine `post-queue/status`. Invariant `SkipOnlyBeforePost`. TLC states on the full graph: 10.

Confirmed: yes.

## What breaks

Skip writes skipped with no status guard, including after the item is already posted.

Skip does not run after posted.

## Trace

0. Init
   cued=false, seenPosted=false, approved=false, phase="draft"
1. Approve [object Object]
   cued=false, seenPosted=false, approved=true, phase="approved"
2. PostFromApproved [object Object]
   cued=false, seenPosted=true, approved=true, phase="posted"
3. Skip [object Object]
   cued=false, seenPosted=true, approved=true, phase="skipped"

## Code

BoydVC/x-post-queue@dea8484 server.py:786-787.

## Failing test

Runner: `python3 verify/queue_repro.py /path/to/x-post-queue at dea8484`

After the posted-from-approved call, POST /skip. The test expects HTTP 400 and the stored status to stay posted. The server returned 200 and stored skipped.

Observed: FAIL skip after posted is refused. HTTP 200 and stored status skipped.

This lab did not open a pull request on the target repo.

## Fix

Refuse skip unless the status is draft, approved, or cued.
