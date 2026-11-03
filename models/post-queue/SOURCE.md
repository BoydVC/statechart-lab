# post-queue

Pinned commit `dea8484c024decd2a3aa72ddf7f54c58b4e19a6b` on BoydVC/x-post-queue.

The model uses the status names in `server.py`. `cued` is the scheduled step. No account handle or post text is in the state.

| Action | Source | What the code does |
| --- | --- | --- |
| Approve | `server.py:780` | Approve is allowed from draft or approved. |
| Cue | `server.py:788` | Cue is allowed from approved or cued. |
| Post | `server.py:794` | Posted is refused unless the loaded status is approved, cued, or posted. |
| Skip | `server.py:786` | Skip writes `skipped` with no status guard. |
| Edit | `server.py:763` | An edit sets the item back to draft and clears the timestamps. |

`PostedRequiresApproval` holds. `SkipOnlyBeforePost` is marked `expected:` because skip from posted is accepted.
