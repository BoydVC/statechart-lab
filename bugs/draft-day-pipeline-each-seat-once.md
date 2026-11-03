# draft-day-pipeline-each-seat-once

Machine `draft-day/pipeline` breaks `EachSeatOnce` at `7fb564d8d974db4ad3c8584a0b9b1f4e35a8ea96`.

Confirmed: no. TLC found this counterexample in the model. The sketch was not run in the target repo. This seat does not push to other repositories, so the finding stays unconfirmed.

## Trace

| Action | State | Source |
| --- | --- | --- |
| Init | `{"merged":false,"approved":false,"j1":0,"j2":0,"phase":"idea"}` | demo/app.js:42 |
| Advance | `{"merged":false,"approved":false,"j1":0,"j2":0,"phase":"spec"}` | demo/app.js:42 |
| Advance | `{"merged":false,"approved":false,"j1":0,"j2":0,"phase":"seats"}` | demo/app.js:42 |
| Advance | `{"merged":false,"approved":false,"j1":0,"j2":0,"phase":"judge"}` | demo/app.js:42 |
| Advance | `{"merged":false,"approved":false,"j1":0,"j2":0,"phase":"graft"}` | demo/app.js:42 |

## Failing test sketch

```
test("the verified phase waits until each seat is judged once", () => {
  const view = applyPhase(12);
  assert.equal(view.seats.every((seat) => seat.judged === 1), true);
});
```

No draft pull request was opened on the target repository.
