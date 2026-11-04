# oauth-expired-use

Machine `school-pulse/oauth`. Invariant `NotExpiredUse`. TLC states on the full graph: 112.

Confirmed: yes.

## What breaks

readToken returns access_token and never reads expires_at. school-pulse sync sends that string. Nothing in this commit moves the account to re-auth-needed.

A sync does not read an access token after it has expired.

## Trace

0. Init
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="empty", usedExpired=false, fileAccount="none", fileGen=0
1. StartDesk [object Object]
   pending={"desk":0,"phone":-1}, clobbered=false, filePhase="empty", usedExpired=false, fileAccount="none", fileGen=0
2. FinishDesk [object Object]
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="fresh", usedExpired=false, fileAccount="desk", fileGen=1
3. Tick [object Object]
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="expiring", usedExpired=false, fileAccount="desk", fileGen=1
4. Tick [object Object]
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="expired", usedExpired=false, fileAccount="desk", fileGen=1
5. UseDesk [object Object]
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="expired", usedExpired=true, fileAccount="desk", fileGen=1

## Code

BoydVC/school-pulse@3b76b08 src/main.ts:150-157. expires_at is stored in src/auth/oauth.ts:114. runSync passes the string at src/main.ts:124-132.

## Failing test

Runner: `In school-pulse at 3b76b08, copy verify/arena-repro.test.ts to tests/arena-repro.test.ts, then npx tsc --pretty false && node --test dist/tests/arena-repro.test.js`

Test name: sync does not send an access token whose expires_at is in the past. The token file has expires_at in 2020. The test expects zero fetch calls. sync made 3.

Observed: AssertionError: 3 !== 0. sync called fetch with the expired access token.

This lab did not open a pull request on the target repo.

## Fix

If expires_at is missing or in the past, return null and print the auth command. A later change can use the stored refresh token. This commit does not send a refresh grant.
