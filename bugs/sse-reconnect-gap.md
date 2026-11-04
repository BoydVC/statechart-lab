# sse-reconnect-gap

Machine `school-pulse/sse`. Invariant `LiveMeansCaughtUp`. TLC states on the full graph: 4.

Confirmed: yes.

## What breaks

onopen turns the live pill on and does not refresh. The hub does not buffer a pulse published while the stream is down. The page can look live and miss that pulse until the 60 second poll.

The live pill is on only after the page has caught up with pulses it missed.

## Trace

0. Init
   pending=false, view="current", pill="on", link="up"
1. Drop [object Object]
   pending=false, view="current", pill="off", link="down"
2. Publish [object Object]
   pending=true, view="stale", pill="off", link="down"
3. Connect [object Object]
   pending=true, view="stale", pill="on", link="up"

## Code

BoydVC/school-pulse@3b76b08 web/app.ts:472-475 and web/app.ts:100. src/server/hub.ts:26 writes only to current clients. src/server/server.ts:102 does not send an event id.

## Failing test

Runner: `Same school-pulse node --test run as oauth-expired-use.`

Test name: opening the stream refreshes before the pill is treated as caught up. The real connect function runs against a fake EventSource. onopen fires. refresh runs 0 times.

Observed: AssertionError: 0 !== 1. The pill state was on.

This lab did not open a pull request on the target repo.

## Fix

Call the same refresh used at startup from onopen, and keep the pill off until that refresh resolves.
