# oauth-expired-use

Machine `school-pulse/oauth`. Invariant `NotExpiredUse`. TLC states on the full graph: 112.

Confirmed: yes.

## What breaks

readToken returns access_token and never reads expires_at. A sync can run on an expired token. Nothing in this commit moves the account to re-auth-needed.

A sync does not read an access token after it has expired.

## Trace

0. Init
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="empty", usedExpired=false, fileAccount="none", fileGen=0
1. StartDesk https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/auth/oauth.ts#L127
   pending={"desk":0,"phone":-1}, clobbered=false, filePhase="empty", usedExpired=false, fileAccount="none", fileGen=0
2. FinishDesk https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/auth/oauth.ts#L118
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="fresh", usedExpired=false, fileAccount="desk", fileGen=1
3. Tick https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/main.ts#L155
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="expiring", usedExpired=false, fileAccount="desk", fileGen=1
4. Tick https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/main.ts#L155
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="expired", usedExpired=false, fileAccount="desk", fileGen=1
5. UseDesk https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/main.ts#L155
   pending={"desk":-1,"phone":-1}, clobbered=false, filePhase="expired", usedExpired=true, fileAccount="desk", fileGen=1

## Code

BoydVC/school-pulse@3b76b08fad2780bf7a760ea65dae619d3a5f628b src/main.ts:150. expires_at is stored in src/auth/oauth.ts:114.

## Failing test

Runner: `node --test dist/tests/oauth-race.test.js`

The test transpiles the real readToken, writes a token with expires_at in 2000, and expects null. The function returns synthetic-access.

Observed: AssertionError: 'synthetic-access' !== null

This lab did not open a pull request on the target repo.

## Fix

If expires_at is missing or in the past, return null and print the auth command. A later change can use the stored refresh token. This commit does not send a refresh grant.
