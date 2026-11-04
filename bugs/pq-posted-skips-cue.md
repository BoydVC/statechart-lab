# pq-posted-skips-cue

Machine `post-queue/status`. Invariant `ScheduledBeforePosted`. TLC states on the full graph: 10.

Confirmed: yes.

## What breaks

Mark posted is accepted from approved, so the cue step can be skipped. Approval still holds. The scheduled step, called cued in the code, does not.

Posted happens only after the item was cued.

## Trace

0. Init
   cued=false, seenPosted=false, approved=false, phase="draft"
1. Approve [object Object]
   cued=false, seenPosted=false, approved=true, phase="approved"
2. PostFromApproved [object Object]
   cued=false, seenPosted=true, approved=true, phase="posted"

## Code

BoydVC/x-post-queue@dea8484 server.py:794-798 allows approved, cued, or posted. The button gate is server.py:443.

## Failing test

Runner: `python3 verify/queue_repro.py /path/to/x-post-queue at dea8484`

Create a synthetic draft, approve it, POST /posted. The test expects HTTP 400. The server returned 200 posted.

Observed: FAIL posted from approved is refused. HTTP 200 and status posted. cued_at_et was null.

This lab did not open a pull request on the target repo.

## Fix

Accept posted only from cued or posted.
