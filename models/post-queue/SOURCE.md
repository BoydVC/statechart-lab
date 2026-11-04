# post-queue

Pinned commit `dea8484c024decd2a3aa72ddf7f54c58b4e19a6b` on https://github.com/BoydVC/x-post-queue.

The item texts in the model are `t1` and `t2`. They stand for two synthetic drafts.

| Action | Code |
| --- | --- |
| Approve | `server.py:780` from `draft` or `approved` |
| Edit | `server.py:762` sets `draft` and clears `approved_at_et` |
| Cue | `server.py:788` from `approved` or `cued` |
| PostedFresh | `server.py:794` one request, status already `approved`, `cued`, or `posted` |
| Load | `server.py:775` `load_queue`, lock released before the edit |
| Arm | `server.py:794` the in-memory status becomes `posted` before `save_queue` |
| CommitSnap | `server.py:799` `save_queue` replaces the whole file |
| Discard | The request returns before saving. Not a named branch in the file |
| Done | Stutter at `posted`, or after the version bound |

`load_queue` takes the lock at `server.py:134` and drops it before the handler returns. `save_queue` takes it again at `server.py:144`.

`RevokeSticks` fails. `NeverPostedUnapproved` holds. A single request still cannot mark a draft posted. That check is the `if it["status"] not in ("approved", "cued", "posted")` branch at line 795.

TLC reaches 115 states. The chart hides `Discard` and `Done`. It draws the read, the in-memory mark, the edit, and the late save as different labels.

Out of the model: skip, the intent URL, and the clock that decides `/api/due`.
