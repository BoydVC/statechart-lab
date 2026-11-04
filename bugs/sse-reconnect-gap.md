# sse-reconnect-gap

Machine `school-pulse/sse`. Invariant `LiveMeansCaughtUp`. TLC states on the full graph: 4.

Confirmed: yes.

## What breaks

onopen turns the live pill on and does not refresh. The hub does not buffer a pulse published while the stream is down. The page can look live and miss that pulse until the 60 second poll.

The live pill is on only after the page has caught up with pulses it missed.

## Trace

0. Init
   pending=false, view="current", pill="on", link="up"
1. Drop https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/web/app.ts#L476
   pending=false, view="current", pill="off", link="down"
2. Publish https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/src/server/hub.ts#L26
   pending=true, view="stale", pill="off", link="down"
3. Connect https://github.com/BoydVC/school-pulse/blob/3b76b08fad2780bf7a760ea65dae619d3a5f628b/web/app.ts#L472
   pending=true, view="stale", pill="on", link="up"

## Code

BoydVC/school-pulse@3b76b08fad2780bf7a760ea65dae619d3a5f628b web/app.ts:466 and web/app.ts:100. src/server/hub.ts:26 writes only to current clients. src/server/server.ts:102 does not send an id the client can resume from.

## Failing test

Runner: `node --test dist/tests/sse-reconnect.test.js`

The test loads the real connect function, fires onerror then onopen, and expects a refresh before the pill is treated as caught up. refresh runs 0 times. The pill still switches to on.

Observed: AssertionError: 0 !== 1

This lab did not open a pull request on the target repo.

## Fix

Call the same refresh used at startup from onopen, and keep the pill off until that refresh resolves. Buffer the latest pulse on the hub if a client is gone.
