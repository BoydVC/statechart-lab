import assert from "node:assert/strict";
import test from "node:test";
import { parseTlcOutput } from "./parse-tlc.ts";

const COMMIT_NOISE = `@!@!@STARTMSG 2262:0 @!@!@
TLC2 Version 2026.11.03.180953 (rev: 309e489)
@!@!@ENDMSG 2262 @!@!@
`;

test("a passing TLC run reports distinct states and no trace", () => {
  const outcome = parseTlcOutput(`${COMMIT_NOISE}
Model checking completed. No error has been found.
9 states generated, 4 distinct states found, 0 states left on queue.
`);
  assert.deepEqual(outcome, { status: "pass", states: 4 });
});

test("a violation names the invariant and keeps the counterexample", () => {
  const outcome = parseTlcOutput(`${COMMIT_NOISE}
Invariant RefreshBeforeReauth is violated.
The behavior up to this point is:
1: <Initial predicate>
/\\ hasRefresh = FALSE
/\\ phase = "none"

2: <Exchange line 16, col 3 to line 18, col 28 of module Oauth>
/\\ hasRefresh = TRUE
/\\ phase = "fresh"

3: <Tick line 21, col 3 to line 23, col 25 of module Oauth>
/\\ hasRefresh = TRUE
/\\ phase = "expiring"

4: <Expire line 26, col 3 to line 28, col 25 of module Oauth>
/\\ hasRefresh = TRUE
/\\ phase = "reauth"

11 states generated, 7 distinct states found, 1 states left on queue.
`);
  assert.equal(outcome.status, "violation");
  if (outcome.status !== "violation") return;
  assert.equal(outcome.invariant, "RefreshBeforeReauth");
  assert.equal(outcome.states, 7);
  assert.deepEqual(
    outcome.trace.map((step) => step.action),
    ["Init", "Exchange", "Tick", "Expire"],
  );
  assert.deepEqual(outcome.trace[3]?.state, { hasRefresh: true, phase: "reauth" });
});

test("a semantic error is not a violation", () => {
  const outcome = parseTlcOutput(`Unknown operator: \`vars'.
Error: Parsing or semantic analysis failed.
`);
  assert.equal(outcome.status, "error");
  if (outcome.status !== "error") return;
  assert.match(outcome.message, /Unknown operator/);
});

test("a violation without steps is an error", () => {
  const outcome = parseTlcOutput("Invariant Lost is violated.\n4 distinct states found\n");
  assert.equal(outcome.status, "error");
});
