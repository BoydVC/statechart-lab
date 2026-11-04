# oauth-stale-write

Machine `school-pulse/oauth`. Invariant `NoStaleClobber`. TLC states on the full graph: 112.

Confirmed: yes.

## What breaks

Two sign-ins share one token file. The one that started first can finish last and replace the newer refresh token. writeToken has no generation check.

A sign-in that started earlier does not overwrite a token written after it started.

## Trace

0. Init
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="empty", usedExpired=false, fileAccount="none", fileGen=0
1. StartDesk [object Object]
   pending={"desk":0,"phone":-1}, clobbered=false, filePhase="empty", usedExpired=false, fileAccount="none", fileGen=0
2. StartPhone [object Object]
   pending={"desk":0,"phone":0}, clobbered=false, filePhase="empty", usedExpired=false, fileAccount="none", fileGen=0
3. FinishDesk [object Object]
   pending={"desk":-1,"phone":0}, clobbered=false, filePhase="fresh", usedExpired=false, fileAccount="desk", fileGen=1
4. FinishPhone [object Object]
   pending={"desk":-1,"phone":-1}, clobbered=true, filePhase="fresh", usedExpired=false, fileAccount="phone", fileGen=2

## Code

BoydVC/school-pulse@3b76b08 src/auth/oauth.ts:118 and the call at line 199.

## Failing test

Runner: `Same school-pulse node --test run as oauth-expired-use.`

Test name: an earlier sign-in does not overwrite a token written by a later sign-in. Sign-in A waits inside the token HTTP call, B finishes, then A is released. The file holds refresh-a.

Observed: AssertionError: 'refresh-a' !== 'refresh-b'

This lab did not open a pull request on the target repo.

## Fix

Stamp a generation when the flow starts and write the file only if that generation is still current.
