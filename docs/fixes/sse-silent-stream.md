# sse-silent-stream

Machine `school-pulse/silence`. Invariant `SilentStreamReconnects`. Original write-up: [`bugs/sse-silent-stream.md`](../../bugs/sse-silent-stream.md).

## Bug

If the stream goes quiet without an error, the client never notices: the server's heartbeat is an SSE comment, which EventSource never surfaces, and the client has no timer. The page parks in a silent state forever.

## Counterexample (TLC 2.19 on the original model)

Result: FAIL (Invariant SilentStreamReconnects is violated). States at stop: 3 / 3 generated / distinct.

```
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\ phase = "off"
/\ sockets = 0

State 2: <Open Silence>
/\ phase = "live"
/\ sockets = 1

State 3: <Silence Silence>
/\ phase = "silent"
/\ sockets = 1
```

Liveness check on the original actions (`models/fixed/SilenceLive.tla`): FAIL (Temporal properties were violated), 6 / 4 generated/distinct.

```
Error: The following behavior constitutes a counter-example:

State 1: <Initial predicate>
/\ phase = "off"
/\ sockets = 0

State 2: <Open SilenceLive>
/\ phase = "live"
/\ sockets = 1

State 3: <Silence SilenceLive>
/\ phase = "silent"
/\ sockets = 1

State 4: Stuttering
```


## Fixed model

[`models/fixed/SilenceFixed.tla`](../../models/fixed/SilenceFixed.tla) with `models/fixed/SilenceFixed.cfg`.

`Park` (stutter forever) is replaced by `Watchdog` (close and reopen, back to `live`), with weak fairness. A state invariant `phase # "silent"` can never hold in a model where silence happens at all, so the fixed model checks the liveness form `SilentLeadsToLive == (phase = "silent") ~> (phase = "live")`. The same property run on the original actions (`models/fixed/SilenceLive.tla`) fails with a stuttering counterexample, so the property really separates bug from fix.

Result: **PASS**, 6 / 4 generated / distinct states, depth 3.

## Proposed code fix

Patch: [`docs/fixes/patches/school-pulse-sse-catch-up-and-watchdog.patch`](patches/school-pulse-sse-catch-up-and-watchdog.patch). Proposal only. It is not applied to the target repo, and it was checked with `patch --dry-run` against the pinned commit but not built or tested there.

The server sends a named `ping` event instead of a comment. `connect()` arms an 80 s watchdog that is re-armed on every `pulse`, `ping`, and `onopen`; when it fires it closes the EventSource and calls `connect()` again.
