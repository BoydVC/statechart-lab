# post-queue-queue-skip-only-before-post

Machine `post-queue/queue` breaks `SkipOnlyBeforePost` at `dea8484c024decd2a3aa72ddf7f54c58b4e19a6b`.

Confirmed: no. TLC found this counterexample in the model. The sketch was not run in the target repo. This seat does not push to other repositories, so the finding stays unconfirmed.

## Trace

| Action | State | Source |
| --- | --- | --- |
| Init | `{"seenApproved":false,"seenPosted":false,"status":"draft"}` | server.py:28 |
| Approve | `{"seenApproved":true,"seenPosted":false,"status":"approved"}` | server.py:780 |
| Post | `{"seenApproved":true,"seenPosted":true,"status":"posted"}` | server.py:794 |
| Skip | `{"seenApproved":true,"seenPosted":true,"status":"skipped"}` | server.py:786 |

## Failing test sketch

```
def test_skip_after_post_is_refused():
    item = {"status": "posted", "text": "synthetic draft"}
    status, body = act(item, "skip")
    assert status == 400
    assert item["status"] == "posted"
```

No draft pull request was opened on the target repository.
