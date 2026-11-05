# TLC results: original vs fixed

Run on the box on Thu Nov 5, 2026 (ET) with TLC 2.19 (tla2tools.jar rev 5a47802) on OpenJDK 21, `-deadlock -workers 1`.

Re-run from the repo root: `TLA2TOOLS=/path/to/tla2tools.jar docs/fixes/run-tlc.sh` (add `LOGDIR=docs/fixes/tlc-logs` to refresh the logs).

Each original run checks only the bug's own property, so the count is where TLC stopped at the first violation. Fixed runs explore the full state graph. Every fixed config also re-checks the machine's other invariants that held before (for example `TokenFileCoherent`, `PillMatchesLink`, `AtMostOneSocket`, `NeverPostedUnapproved`, `PostedRequiresApproval`).

| Bug | Original model | Original result | Gen / distinct states | Fixed model | Fixed result | Gen / distinct states | Depth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| oauth-expired-use | school-pulse/OAuth | FAIL (Invariant NotExpiredUse is violated) | 113 / 48 | fixed/OAuthFixExpiredUse (OAuthFixExpiredUse.cfg) | PASS | 265 / 70 | 8 |
| oauth-stale-write | school-pulse/OAuth | FAIL (Invariant NoStaleClobber is violated) | 21 / 16 | fixed/OAuthFixStaleWrite (OAuthFixStaleWrite.cfg) | PASS | 417 / 88 | 10 |
| ingest-clock-retry | school-pulse/Ingest | FAIL (Invariant AtMostOneRow is violated) | 5 / 5 | fixed/IngestFixed (IngestFixClockRetry.cfg) | PASS | 6 / 4 | 3 |
| ingest-clock-change | school-pulse/Ingest | FAIL (Invariant NoExtraChange is violated) | 5 / 5 | fixed/IngestFixed (IngestFixClockChange.cfg) | PASS | 6 / 4 | 3 |
| sse-reconnect-gap | school-pulse/Sse | FAIL (Invariant LiveMeansCaughtUp is violated) | 10 / 4 | fixed/SseFixed (SseFixed.cfg) | PASS | 19 / 5 | 4 |
| sse-silent-stream | school-pulse/Silence | FAIL (Invariant SilentStreamReconnects is violated) | 3 / 3 | fixed/SilenceFixed (SilenceFixed.cfg) | PASS | 6 / 4 | 3 |
| sse-silent-stream (liveness) | fixed/SilenceLive | FAIL (Temporal properties were violated) | 6 / 4 | fixed/SilenceFixed (SilenceFixed.cfg) | PASS | 6 / 4 | 3 |
| queue-stale-posted | post-queue/Queue | FAIL (Invariant RevokeSticks is violated) | 137 / 77 | fixed/QueueFixed (QueueFixed.cfg) | PASS | 218 / 87 | 8 |
| pq-posted-skips-cue | post-queue/Status | FAIL (Invariant ScheduledBeforePosted is violated) | 5 / 5 | fixed/StatusFixPostedSkipsCue (StatusFixPostedSkipsCue.cfg) | PASS | 15 / 8 | 5 |
| pq-skip-after-post | post-queue/Status | FAIL (Invariant SkipOnlyBeforePost is violated) | 12 / 9 | fixed/StatusFixSkipAfterPost (StatusFixSkipAfterPost.cfg) | PASS | 15 / 8 | 4 |
| combined: oauth | fixed/OAuthFixed | (n/a) | - / - | fixed/OAuthFixed (OAuthFixed.cfg) | PASS | 237 / 58 | 8 |
| combined: status | fixed/StatusFixed | (n/a) | - / - | fixed/StatusFixed (StatusFixed.cfg) | PASS | 13 / 7 | 4 |

The two `combined` rows fold every fix for a machine into one module (`OAuthFixed`, `StatusFixed`) and check all of the machine's invariants together. `IngestFixed`, `SseFixed`, `SilenceFixed`, and `QueueFixed` are already the combined model for their machine.

Raw TLC output, trimmed of timestamps: [`tlc-logs/`](tlc-logs/).

## Per-bug notes

- [oauth-expired-use](oauth-expired-use.md)
- [oauth-stale-write](oauth-stale-write.md)
- [ingest-clock-retry](ingest-clock-retry.md)
- [ingest-clock-change](ingest-clock-change.md)
- [sse-reconnect-gap](sse-reconnect-gap.md)
- [sse-silent-stream](sse-silent-stream.md)
- [queue-stale-posted](queue-stale-posted.md)
- [pq-posted-skips-cue](pq-posted-skips-cue.md)
- [pq-skip-after-post](pq-skip-after-post.md)

## Caveats

- `sse-silent-stream` is checked as liveness (`silent ~> live` under weak fairness) in the fixed model, because the original state invariant `phase # "silent"` forbids a state that real networks produce. The original fails both forms.
- The patches are proposals for BoydVC/school-pulse@3b76b08 and BoydVC/x-post-queue@dea8484. They apply cleanly (`patch --dry-run`) but were not compiled or tested in those repos, and nothing was pushed there.
