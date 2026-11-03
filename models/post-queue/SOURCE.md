# post-queue

Pinned commit `dea8484c024decd2a3aa72ddf7f54c58b4e19a6b` on [BoydVC/x-post-queue](https://github.com/BoydVC/x-post-queue).

The code calls the scheduled step `cued`. Status names are `server.py:28`.

| Action | Code |
| --- | --- |
| Approve | `server.py:780-785` |
| Cue | `server.py:788-793` |
| PostFromCued | `server.py:794-798` |
| PostFromApproved | `server.py:794-798` allows `approved`. The button is `server.py:443` |
| Skip | `server.py:786-787` |
| Edit | `server.py:762-766` returns the item to draft and clears the timestamps |
| Hold | Terminal `posted` and `skipped` values in `server.py:28` |
