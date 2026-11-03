# sp-sse-silent-stream

The SSE client flips the pill off on error, and never notices a silent stream.

- Machine: `school-pulse/sse`
- Invariant: `SilentStreamReconnects`
- Commit: `3b76b08fad2780bf7a760ea65dae619d3a5f628b`
- TLC states: 4
- Confirmed: yes
- Draft PR: none

## What breaks

A stream that stops sending is reconnected.

connect() creates one EventSource. onerror sets the pill to off and relies on the browser to retry a broken socket. Comment pings from the server are not events, and the client has no timer, so a half-open stream stays Live.

## Trace

1. Init: Start. phase="off", sockets=0 (page load before connect())
2. Open: Open. phase="live", sockets=1 (web/app.ts:466-467 @ 3b76b08)
3. Silence: No ping. phase="silent", sockets=1 (web/app.ts:466-479 has no silence timer)

## Code path

Pinned school-pulse 3b76b08. Client connect is web/app.ts:466-479. Server comment ping is src/server/server.ts:110-116.

## Failing test sketch

```
test("the SSE client reconnects a silent stream", () => {
  const src = readFileSync(new URL("../../web/app.ts", import.meta.url), "utf8");
  const connect = src.slice(src.indexOf("function connect"), src.indexOf("function toggleTheme"));
  assert.match(connect, /setTimeout|lastEvent|reconnect/i);
});
```

## Repro

Same npm test run. The new test expected connect() to start a silence timer or call reconnect. The function only sets the pill off inside onerror. The assertion failed. No draft PR was opened on BoydVC/school-pulse.

Confirmed locally in the target repo's test runner. No draft PR was opened on that repo.
