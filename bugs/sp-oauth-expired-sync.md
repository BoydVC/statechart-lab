# sp-oauth-expired-sync

school-pulse stores expires_at, then sync ignores it and sends the access token.

- Machine: `school-pulse/oauth`
- Invariant: `ExpiredTokenNotUsed`
- Commit: `3b76b08fad2780bf7a760ea65dae619d3a5f628b`
- TLC states: 8
- Confirmed: yes
- Draft PR: none

## What breaks

An expired access token is not used to sync.

readToken returns access_token and never branches on expires_at or refresh_token. runSync passes that string straight to the Classroom and OneNote fetchers. The auth command is a separate path, so an expired file does not become re-auth-needed.

## Trace

1. Init: Start. hasToken=false, expired=false, phase="none" (no token file)
2. Exchange: Exchange code. hasToken=true, expired=false, phase="fresh" (src/auth/oauth.ts:108-115 @ 3b76b08)
3. Age: Past expires_at. hasToken=true, expired=true, phase="expired" (expires_at is stored and never read again)
4. Sync: Sync anyway. hasToken=true, expired=true, phase="syncing" (src/main.ts:150-157 @ 3b76b08)

## Code path

Pinned school-pulse 3b76b08. Exchange writes expires_at in src/auth/oauth.ts:108-115. readToken is src/main.ts:150-157. runSync uses the string at src/main.ts:124-132.

## Failing test sketch

```
test("an expired access token is not returned for sync", () => {
  const dir = mkdtempSync(join(tmpdir(), "sp-"));
  mkdirSync(join(dir, "tokens"));
  writeFileSync(join(dir, "tokens", "google-classroom.json"), JSON.stringify({
    access_token: "synthetic-access-token",
    refresh_token: "synthetic-refresh",
    expires_at: "2020-01-01T00:00:00.000Z"
  }));
  assert.equal(readToken(dir, "google-classroom.json", "SCHOOL_PULSE_CLASSROOM_TOKEN_UNSET"), null);
});
```

## Repro

Local copy of school-pulse at 3b76b08. npm test ran the new test in the repo's node:test runner. It expected readToken to return null for an expires_at in 2020. The actual value was synthetic-access-token. The other 57 tests in that run passed. No draft PR was opened on BoydVC/school-pulse.

Confirmed locally in the target repo's test runner. No draft PR was opened on that repo.
