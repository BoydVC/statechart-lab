# sse-silent-stream

Machine `school-pulse/silence`. Invariant `SilentStreamReconnects`. TLC states on the full graph: 4.

Confirmed: yes.

## What breaks

connect() creates one EventSource. onerror sets the pill off and the browser retries a broken socket. A stream that stays open and sends nothing has no timer, so the pill stays live.

A stream that stops sending is reconnected.

## Trace

0. Init
   phase="off", sockets=0
1. Open [object Object]
   phase="live", sockets=1
2. Silence [object Object]
   phase="silent", sockets=1

## Code

BoydVC/school-pulse@3b76b08 web/app.ts:466-479. The server writes a comment ping at src/server/server.ts:110-116. The client does not read it.

## Failing test

Runner: `Same school-pulse node --test run as oauth-expired-use.`

Test name: a silent event stream schedules a reconnect. The real connect function runs, onopen fires, and the test expects a silence timer or a second socket.

Observed: AssertionError: the silence check was falsy. connect() scheduled no timer under 60 seconds and opened one socket. The pill stayed on.

This lab did not open a pull request on the target repo.

## Fix

Start a timer in connect(). If no pulse arrives, close the EventSource and call connect() again.
