import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTlc, parseValue } from "./parse.js";

const sample = `Error: Invariant NoStaleClobber is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\\ pending = [desk |-> -1, phone |-> -1]
/\\ clobbered = FALSE
/\\ fileGen = 0

State 2: <StartDesk line 19, col 3 to line 22, col 74 of module OAuth>
/\\ pending = [desk |-> 0, phone |-> -1]
/\\ clobbered = FALSE
/\\ fileGen = 0

21 states generated, 16 distinct states found, 8 states left on queue.
`;

test("a TLC record becomes an object", () => {
  assert.deepEqual(parseValue('[desk |-> -1, phone |-> 0]'), { desk: -1, phone: 0 });
  assert.equal(parseValue("FALSE"), false);
  assert.equal(parseValue('"t1"'), "t1");
});

test("a violation names the invariant and the actions in order", () => {
  const parsed = parseTlc(sample);
  assert.equal(parsed.violation, "NoStaleClobber");
  assert.equal(parsed.distinct, 16);
  assert.equal(parsed.error, undefined);
  assert.deepEqual(
    parsed.trace.map((step) => step.action),
    ["Init", "StartDesk"],
  );
  assert.equal(parsed.trace[1]?.state.fileGen, 0);
});

test("a spec error is not reported as a passing run", () => {
  const parsed = parseTlc("Error: Parsing or semantic analysis failed.\n");
  assert.equal(parsed.error, "tlc could not check the model");
  assert.equal(parsed.violation, undefined);
});
