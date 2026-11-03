# session-owner

This machine is a generic household pattern. It is not pinned to a product commit. It has no PowerSchool fields and no names.

The actions live in `Household.tla` in this directory.

| Action | Where |
| --- | --- |
| Claim | One owner moves from signed-out to fresh |
| Age | A fresh idle session becomes aging |
| Keep | Keep-alive from fresh or aging returns to fresh |
| Stale | Aging becomes stale. Sending stays closed |
| Send | Enabled only from fresh |
| Stop | Sending returns to fresh |
| Reauth | The only step out of stale |
| FinishReauth | Re-auth stores a fresh session |

Invariants in `Household.cfg` are `FreshBeforeSend` and `SignedOutIsIdle`.
