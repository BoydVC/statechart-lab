# oauth-expired-use

Machine `school-pulse/oauth`. Invariant `NotExpiredUse`. Original write-up: [`bugs/oauth-expired-use.md`](../../bugs/oauth-expired-use.md).

## Bug

`readToken` in `src/main.ts` returns `access_token` without looking at `expires_at`, so a sync goes out with a token the provider already expired.

## Counterexample (TLC 2.19 on the original model)

Result: FAIL (Invariant NotExpiredUse is violated). States at stop: 113 / 48 generated / distinct.

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

State 3: <FinishDesk OAuth>
/\ pending = [desk |-> -1, phone |-> -1]
/\ clobbered = FALSE
/\ filePhase = "fresh"
/\ usedExpired = FALSE
/\ fileAccount = "desk"
/\ fileGen = 1

State 4: <Tick OAuth>
/\ pending = [desk |-> -1, phone |-> -1]
/\ clobbered = FALSE
/\ filePhase = "expiring"
/\ usedExpired = FALSE
/\ fileAccount = "desk"
/\ fileGen = 1

State 5: <Tick OAuth>
/\ pending = [desk |-> -1, phone |-> -1]
/\ clobbered = FALSE
/\ filePhase = "expired"
/\ usedExpired = FALSE
/\ fileAccount = "desk"
/\ fileGen = 1

State 6: <UseDesk OAuth>
/\ pending = [desk |-> -1, phone |-> -1]
/\ clobbered = FALSE
/\ filePhase = "expired"
/\ usedExpired = TRUE
/\ fileAccount = "desk"
/\ fileGen = 1
```

## Fixed model

[`models/fixed/OAuthFixExpiredUse.tla`](../../models/fixed/OAuthFixExpiredUse.tla) with `models/fixed/OAuthFixExpiredUse.cfg`.

`UseDesk`/`UsePhone` are enabled only while the file is `fresh` or `expiring`. On `expired` the reader returns null (the user re-runs auth).

Result: **PASS**, 265 / 70 generated / distinct states, depth 8.

## Proposed code fix

Patch: [`docs/fixes/patches/school-pulse-oauth-expired-use.patch`](patches/school-pulse-oauth-expired-use.patch). Proposal only. It is not applied to the target repo, and it was checked with `patch --dry-run` against the pinned commit but not built or tested there.

`readToken` parses `expires_at`; a missing or past value returns null and prints the re-auth hint. No refresh grant is added.
