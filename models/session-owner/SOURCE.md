# session-owner

There is no household session-owner repository. The pattern is the sentence in this repo's SPEC.md at `e9dc9170ac71e833d3c44f69c2c3c40c32e68af5`, line 20.

One owner. Keep-alive resets age. Resume is allowed only while the lease is still fresh. A stale lease goes to re-auth. Send runs only while the phase is live and the age is below the freshness limit.

The state uses the labels `holder` and `signed-out`. It has no names, school records, or account ids.

| Action | Source |
| --- | --- |
| Claim, KeepAlive, Tick, GoStale, Resume, NeedReauth, FinishReauth, Send | `SPEC.md:20` |

Both invariants hold in this model.
