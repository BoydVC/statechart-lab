# draft-day

Pinned commit `7fb564d8d974db4ad3c8584a0b9b1f4e35a8ea96` on https://github.com/BoydVC/draft-day.

That tree is a visual player. `demo/app.js` `applyPhase` advances a frame. It does not store seats, judgments, or an approval bit. `demo/index.html` shows one card as "verified · merged" and another as "awaiting review" from the first paint.

`Pipeline.tla` is the protocol in SPEC.md. Idea, spec, seats, one judgment each, graft, physical check, draft, approval, merge. The line numbers below are the nearest frame in the demo, not an implementation of the action.

| Action | Nearest frame |
| --- | --- |
| ToSpec | `demo/app.js:111` the idea leaves the idea column |
| Seat | `demo/app.js:156` candidates are on screen |
| JudgeS1, JudgeS2 | `demo/app.js:15` `setCand` writes a score |
| FinishJudge | `demo/app.js:156` candidate A is marked winner |
| Graft | `demo/app.js:156` the other cards dim |
| Physical | `demo/app.js:167` the draft card is still pending |
| OpenDraft | `demo/app.js:167` |
| Approve | `demo/index.html:129` the static "awaiting review" card. The player never sets an approval flag |
| Merge | `demo/app.js:177` the animated card becomes "verified · CI green". The static card already says merged |
| Done | Stutter after merge |

`EachSeatJudgedOnce` and `NoMergeWithoutApproval` hold. TLC reaches 12 states. The chart hides `Done`.

Removing the `judged[s] = 0` guard makes `EachSeatJudgedOnce` fail. That is how the check shows it can fail. The pinned demo has no judge function to fail in a test runner, so this pass is not a product bug and not a false positive.
