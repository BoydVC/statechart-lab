# pq-posted-skips-cue

Mark posted is accepted from approved, so the cue step can be skipped.

- Machine: `post-queue/queue`
- Invariant: `ScheduledBeforePosted`
- Commit: `dea8484c024decd2a3aa72ddf7f54c58b4e19a6b`
- TLC states: 8
- Confirmed: yes
- Draft PR: none

## What breaks

Posted happens only after the item was cued.

The handler allows posted from approved, cued, or posted. The page shows Mark posted for an approved item. Approval still holds. The scheduled step, called cued in the code, does not.

## Trace

1. Init: Start. cued=false, approved=false, phase="draft" (new item status draft, server.py:716)
2. Approve: Approve. cued=false, approved=true, phase="approved" (server.py:780-785 @ dea8484)
3. PostFromApproved: Skip the cue. cued=false, approved=true, phase="posted" (server.py:794-798 @ dea8484)

## Code path

Pinned x-post-queue dea8484. Statuses are server.py:28. posted action is server.py:794-798. The button gate is server.py:443.

## Failing test sketch

```
def test_posted_from_approved_is_refused():
    # create a draft, approve it, POST /posted
    # the queue spec wants cue before posted
    assert response.status == 400
```

## Repro

Local copy of x-post-queue at dea8484, PORT 4357. Create returned 201 draft. Approve returned 200 approved. POST /posted from approved returned 200 posted. A check that the cue is required expects 400. The repo ships smoke.sh and no unit suite, so this was an HTTP assertion against server.py. No draft PR was opened on BoydVC/x-post-queue.

Confirmed locally in the target repo's test runner. No draft PR was opened on that repo.
