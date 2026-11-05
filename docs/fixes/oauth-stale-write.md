# oauth-stale-write

Machine `school-pulse/oauth`. Invariant `NoStaleClobber`. Original write-up: [`bugs/oauth-stale-write.md`](../../bugs/oauth-stale-write.md).

## Bug

Two sign-ins share one token file. `writeToken` has no generation check, so a flow that started on an older file state can finish last and overwrite a newer refresh token.

## Counterexample (TLC 2.19 on the original model)

Result: FAIL (Invariant NoStaleClobber is violated). States at stop: 21 / 16 generated / distinct.

```
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\ pending = [desk |-> -1, phone |-> -1]
/\ clobbered = FALSE
/\ filePhase = "empty"
/\ usedExpired = FALSE
/\ fileAccount = "none"
/\ fileGen = 0

State 2: <StartDesk OAuth>
/\ pending = [desk |-> 0, phone |-> -1]
/\ clobbered = FALSE
/\ filePhase = "empty"
/\ usedExpired = FALSE
/\ fileAccount = "none"
/\ fileGen = 0

State 3: <StartPhone OAuth>
/\ pending = [desk |-> 0, phone |-> 0]
/\ clobbered = FALSE
/\ filePhase = "empty"
/\ usedExpired = FALSE
/\ fileAccount = "none"
/\ fileGen = 0

State 4: <FinishDesk OAuth>
/\ pending = [desk |-> -1, phone |-> 0]
/\ clobbered = FALSE
/\ filePhase = "fresh"
/\ usedExpired = FALSE
/\ fileAccount = "desk"
/\ fileGen = 1

State 5: <FinishPhone OAuth>
/\ pending = [desk |-> -1, phone |-> -1]
/\ clobbered = TRUE
/\ filePhase = "fresh"
/\ usedExpired = FALSE
/\ fileAccount = "phone"
/\ fileGen = 2
```

## Fixed model

[`models/fixed/OAuthFixStaleWrite.tla`](../../models/fixed/OAuthFixStaleWrite.tla) with `models/fixed/OAuthFixStaleWrite.cfg`.

`FinishX` writes only if `pending[x] = fileGen` (the generation stamped at start is still current). New `AbandonX` drops a stale flow's token without writing.

Result: **PASS**, 417 / 88 generated / distinct states, depth 10.

## Proposed code fix

Patch: [`docs/fixes/patches/school-pulse-oauth-stale-write.patch`](patches/school-pulse-oauth-stale-write.patch). Proposal only. It is not applied to the target repo, and it was checked with `patch --dry-run` against the pinned commit but not built or tested there.

`beginTokenFlow(path)` stamps a per-path generation when `runInstalledAppFlow` starts; `writeTokenIfCurrent` refuses the write and the flow throws a clear error when a newer sign-in started. Note: the code stamps every start, so the *latest-started* flow wins; the model stamps the file generation, which is weaker, and still verifies clean.
