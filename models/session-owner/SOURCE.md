# session-owner

No pinned file. `school-pulse`, `draft-day`, and `x-post-queue` do not implement a household session owner. This machine is the pattern in SPEC.md, with no school data and no names.

Assumptions, each one visible in `Session.tla`:

- One owner, `home`.
- A send and the freshness check are one step. `BeginSend` requires `lease = "fresh"`.
- `Age` cannot run while a send is in flight.
- A stale lease cannot `KeepAlive` its way back. `Reauth` then `Resume` is the only way to an active fresh session after `Age`.
- `KeepAlive` on a fresh lease changes nothing. The chart hides it, and hides `Done`.

| Action | Code |
| --- | --- |
| Age, Reauth, Resume, KeepAlive, BeginSend, EndSend, Done | No source file |

`NoSendOnStaleLease` and `StaleSessionMustReauth` hold. TLC reaches 7 states.

The check is able to fail. Dropping `lease = "fresh"` from `BeginSend` and allowing `Age` while `sending` makes `NoSendOnStaleLease` fail. There is no target test, because there is no target function.
