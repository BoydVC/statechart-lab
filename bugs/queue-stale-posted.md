# queue-stale-posted

Machine `post-queue/approval`. Invariant `RevokeSticks`. TLC states on the full graph: 115.

Confirmed: yes.

## What breaks

load_queue and save_queue each take the lock, and the handler mutates the copy in between. A mark-posted that read an approved item can save after an edit has already cleared approval. The item ends posted with the old text. A draft that was never approved still cannot be marked posted in one request.

An edit that cleared approval is not overwritten by an older mark-posted.

## Trace

0. Init
   snapText="t1", revoked=false, text="t1", approvedText="", loaded=false, status="draft"
1. Approve https://github.com/BoydVC/x-post-queue/blob/dea8484c024decd2a3aa72ddf7f54c58b4e19a6b/server.py#L780
   snapText="t1", revoked=false, text="t1", approvedText="t1", loaded=false, status="approved"
2. Load https://github.com/BoydVC/x-post-queue/blob/dea8484c024decd2a3aa72ddf7f54c58b4e19a6b/server.py#L775
   snapText="t1", revoked=false, text="t1", approvedText="t1", loaded=true, status="approved"
3. Edit https://github.com/BoydVC/x-post-queue/blob/dea8484c024decd2a3aa72ddf7f54c58b4e19a6b/server.py#L763
   snapText="t1", revoked=true, text="t2", approvedText="", loaded=true, status="draft"
4. Arm https://github.com/BoydVC/x-post-queue/blob/dea8484c024decd2a3aa72ddf7f54c58b4e19a6b/server.py#L794
   snapText="t1", revoked=true, text="t2", approvedText="", loaded=true, status="draft"
5. CommitSnap https://github.com/BoydVC/x-post-queue/blob/dea8484c024decd2a3aa72ddf7f54c58b4e19a6b/server.py#L799
   snapText="t1", revoked=true, text="t1", approvedText="t1", loaded=false, status="posted"

## Code

BoydVC/x-post-queue@dea8484c024decd2a3aa72ddf7f54c58b4e19a6b server.py:134, server.py:144, server.py:762, server.py:794.

## Failing test

Runner: `python3 -m unittest test_stale_post.py`

The unittest blocks inside save when the copy is already marked posted, lets an edit revert the item to draft, then lets the posted save finish. The stored status is posted, not draft.

Observed: AssertionError: 'posted' != 'draft'. The draft-to-posted test in the same file returned HTTP 400.

This lab did not open a pull request on the target repo.

## Fix

Hold the lock across load, the status check, and save. Reject the save when the item's version or approved_at no longer matches the copy that was checked.
