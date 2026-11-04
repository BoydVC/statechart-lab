# oauth-stale-write

Machine `school-pulse/oauth`. Invariant `NoStaleClobber`. TLC states on the full graph: 112.

Confirmed: yes.

## What breaks

Two sign-ins share one token file. The one that started first can finish last and replace the newer refresh token. writeToken has no generation check.

A sign-in that started earlier does not overwrite a token written after it started.

## Trace

0. Init
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="empty", usedExpired=false, fileAccount="none", fileGen=0
1. StartDesk https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/auth/oauth.ts#L127
   pending={"desk":0,"phone":-1}, clobbered=false, filePhase="empty", usedExpired=false, fileAccount="none", fileGen=0
2. StartPhone https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/auth/oauth.ts#L127
   pending={"desk":0,"phone":0}, clobbered=false, filePhase="empty", usedExpired=false, fileAccount="none", fileGen=0
3. FinishDesk https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/auth/oauth.ts#L118
   pending={"desk":-1,"phone":0}, clobbered=false, filePhase="fresh", usedExpired=false, fileAccount="desk", fileGen=1
4. FinishPhone https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/auth/oauth.ts#L118
   pending={"desk":-1,"phone":-1}, clobbered=true, filePhase="fresh", usedExpired=false, fileAccount="phone", fileGen=2

## Code

BoydVC/school-pulse@3b76b08fad2780bf7a760ea65dae619d3a5f628b src/auth/oauth.ts:118 and the call at line 199. There is no refresh-token grant in this commit. The race is two installed-app flows writing the same path.

## Failing test

Runner: `node --test dist/tests/oauth-race.test.js`

tests/oauth-race.test.ts holds sign-in A inside the token HTTP call, lets sign-in B finish, then releases A. The file should still hold B. It holds A.

Observed: AssertionError: 'refresh-a' !== 'refresh-b'

This lab did not open a pull request on the target repo.

## Fix

Stamp a generation when the flow starts and write the file only if that generation is still current. Return the stored token to the flow that lost, and ask that account to sign in again.
