# sse-reconnect-gap

Machine `school-pulse/sse`. Invariant `LiveMeansCaughtUp`. Original write-up: [`bugs/sse-reconnect-gap.md`](../../bugs/sse-reconnect-gap.md).

## Bug

`onopen` turns the Live pill on right away. Pulses published while the stream was down are gone (the hub writes only to current clients, no event ids), so the page shows Live over stale data until the next 60 s poll.

## Counterexample (TLC 2.19 on the original model)

Result: FAIL (Invariant LiveMeansCaughtUp is violated). States at stop: 10 / 4 generated / distinct.

```
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\ pending = FALSE
/\ view = "current"
/\ pill = "on"
/\ link = "up"

State 2: <Drop Sse>
/\ pending = FALSE
/\ view = "current"
/\ pill = "off"
/\ link = "down"

State 3: <Publish Sse>
/\ pending = TRUE
/\ view = "stale"
/\ pill = "off"
/\ link = "down"

State 4: <Connect Sse>
/\ pending = TRUE
/\ view = "stale"
/\ pill = "on"
/\ link = "up"
```

## Fixed model

[`models/fixed/SseFixed.tla`](../../models/fixed/SseFixed.tla) with `models/fixed/SseFixed.cfg`.

`Connect` goes to a new `syncing` link state with the pill still off. `RefreshDone` catches the view up, then sets link `up` and pill `on`. `PillMatchesLink` still holds.

Result: **PASS**, 19 / 5 generated / distinct states, depth 4.

## Proposed code fix

Patch: [`docs/fixes/patches/school-pulse-sse-catch-up-and-watchdog.patch`](patches/school-pulse-sse-catch-up-and-watchdog.patch). Proposal only. It is not applied to the target repo, and it was checked with `patch --dry-run` against the pinned commit but not built or tested there.

`onopen` calls `refresh()` and sets the pill on only after it resolves (and only if the socket is still open).
