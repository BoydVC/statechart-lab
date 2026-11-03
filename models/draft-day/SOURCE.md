# draft-day

Pinned commit `7fb564d8d974db4ad3c8584a0b9b1f4e35a8ea96` on BoydVC/draft-day.

The public repo at this commit is the phase animation in `demo/app.js`. It is not a merge service. The model adds the pipeline from SPEC.md and checks it against that animation.

| Action | Source | What the code does |
| --- | --- | --- |
| Advance | `demo/app.js:42` | `applyPhase` moves the demo forward on a timer. |
| Judge1, Judge2 | `demo/app.js:156` | Seats are scored for the picture. Phase 12 does not wait for every seat. |
| Approve, Merge | `demo/app.js:177` | The card flips to verified. There is no approval flag and no merge call. |

`Merge` in the model requires `approved`, so `NoMergeWithoutApproval` holds. `EachSeatOnce` is marked `expected:` because `Advance` can leave `judge` while both seat counts are still 0, which matches the timer reaching verified while a seat is unfinished.
