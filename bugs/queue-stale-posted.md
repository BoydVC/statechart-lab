# queue-stale-posted

Machine `post-queue/approval`. Invariant `RevokeSticks`. TLC states on the full graph: 115.

Confirmed: yes.

## What breaks

load_queue and save_queue each take the lock, and the handler mutates the copy in between. A mark-posted that read an approved item can save after an edit has already cleared approval. The item ends posted with the old text. A draft that was never approved still cannot be marked posted in one request.

An edit that cleared approval is not overwritten by an older mark-posted.

## Trace

0. Init
   snapText="t1", revoked=false, text="t1", approvedText="", loaded=false, status="draft"
1. Approve [object Object]
   snapText="t1", revoked=false, text="t1", approvedText="t1", loaded=false, status="approved"
2. Load [object Object]
   snapText="t1", revoked=false, text="t1", approvedText="t1", loaded=true, status="approved"
3. Edit [object Object]
   snapText="t1", revoked=true, text="t2", approvedText="", loaded=true, status="draft"
4. Arm [object Object]
   snapText="t1", revoked=true, text="t2", approvedText="", loaded=true, status="draft"
5. CommitSnap [object Object]
   snapText="t1", revoked=true, text="t1", approvedText="t1", loaded=false, status="posted"

## Code

BoydVC/x-post-queue@dea8484 server.py:134, server.py:144, server.py:762, server.py:794.

## Failing test

Runner: `python3 verify/queue_repro.py /path/to/x-post-queue at dea8484`

The script blocks inside save when the copy is already marked posted, lets an edit revert the item to draft, then lets the posted save finish. The stored status is posted, not draft. The draft-to-posted request in the same script returned HTTP 400.

Observed: FAIL edit that cleared approval is not overwritten by an older mark-posted. status=posted text=synthetic draft race. The edit response was draft, then the blocked mark-posted save finished.

This lab did not open a pull request on the target repo.

## Fix

Hold the lock across load, the status check, and save. Reject the save when approved_at no longer matches the copy that was checked.
