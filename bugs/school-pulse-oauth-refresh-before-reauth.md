# school-pulse-oauth-refresh-before-reauth

Machine `school-pulse/oauth` breaks `RefreshBeforeReauth` at `3b76b08fad2780bf7a760ea65dae619d3a5f628b`.

Confirmed: no. TLC found this counterexample in the model. The sketch was not run in the target repo. This seat does not push to other repositories, so the finding stays unconfirmed.

## Trace

| Action | State | Source |
| --- | --- | --- |
| Init | `{"hasRefresh":false,"phase":"none"}` | src/auth/oauth.ts:79 |
| Exchange | `{"hasRefresh":true,"phase":"fresh"}` | src/auth/oauth.ts:79 |
| Tick | `{"hasRefresh":true,"phase":"expiring"}` | src/auth/oauth.ts:114 |
| Expire | `{"hasRefresh":true,"phase":"reauth"}` | src/auth/oauth.ts:111 |

## Failing test sketch

```
test("a stored refresh token is used before re-auth", () => {
  const token = {
    access_token: "synthetic-access",
    refresh_token: "synthetic-refresh",
    expires_at: "2000-01-01T00:00:00.000Z",
  };
  assert.equal(token.refresh_token === null || phaseAfterExpiry(token) === "refreshing", true);
});
```

No draft pull request was opened on the target repository.
