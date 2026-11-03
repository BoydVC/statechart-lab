# school-pulse-sse-reconnect-scheduled

Machine `school-pulse/sse` breaks `ReconnectScheduled` at `3b76b08fad2780bf7a760ea65dae619d3a5f628b`.

Confirmed: no. TLC found this counterexample in the model. The sketch was not run in the target repo. This seat does not push to other repositories, so the finding stays unconfirmed.

## Trace

| Action | State | Source |
| --- | --- | --- |
| Init | `{}` | web/app.ts:99 |
| Connect | `{}` | web/app.ts:466 |
| Drop | `{}` | web/app.ts:476 |

## Failing test sketch

```
test("a closed event source is opened again", () => {
  let opened = 0;
  onError({ readyState: 2 }, () => { opened += 1; });
  assert.equal(opened, 1);
});
```

No draft pull request was opened on the target repository.
