# draft-day

Pinned commit `7fb564d8d974db4ad3c8584a0b9b1f4e35a8ea96` on [BoydVC/draft-day](https://github.com/BoydVC/draft-day).

The public tree is `README.md` and `demo/app.js`. There is no merge function. The model keeps Merge disabled until `approved` is true, which matches a repo that never merges on its own.

| Action | Code |
| --- | --- |
| ToSpec | `README.md:5` and the spec phase in `demo/app.js:68-78` |
| ToSeats | `README.md:5` names the arena. `demo/app.js:15-33` draws four candidates |
| ToJudge | `demo/app.js:80-166` advances the scores |
| Judge | `demo/app.js:15-33` sets one candidate's score. The demo writes the score again on later frames because it is an animation clock, not a second judgment. The model allows each seat once |
| ToGraft | No function in this commit. The lab spec names the step. The model uses it as the gate after both seats are scored |
| ToPhysical | No function in this commit. Same note as ToGraft |
| ToDraft | `demo/app.js:167-178` flips the draft PR to verified |
| Approve | No approve function in this commit. The model has a separate flag so Merge can require it |
| Merge | No merge function in this commit. Merge is enabled only when `approved` is true |
