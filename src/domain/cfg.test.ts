import assert from "node:assert/strict";
import test from "node:test";
import { ParseError } from "./types.ts";
import { parseCfg } from "./parse.ts";

test("cfg marks an expected violation by name", () => {
  const cfg = parseCfg(`SPECIFICATION Spec
INVARIANT Holds
\\* expected: Breaks
INVARIANT Breaks
`);
  assert.deepEqual(cfg.invariants, ["Holds", "Breaks"]);
  assert.deepEqual(cfg.expected, ["Breaks"]);
});

test("cfg rejects an expected name that is not an invariant", () => {
  assert.throws(
    () => parseCfg("SPECIFICATION Spec\nINVARIANT A\nINVARIANT B\n\\* expected: Missing\n"),
    ParseError,
  );
});
