import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseTlc } from "../src/parse.ts";
import { cfgKeeping, readInvariantRefs } from "../src/check.ts";

const here = dirname(fileURLToPath(import.meta.url));

const oauthOut = `Error: Invariant ExpiredTokenNotUsed is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\\ hasToken = FALSE
/\\ expired = FALSE
/\\ phase = "none"

State 2: <Exchange line 15, col 3 to line 18, col 21 of module Oauth>
/\\ hasToken = TRUE
/\\ expired = FALSE
/\\ phase = "fresh"

State 3: <Age line 21, col 3 to line 25, col 23 of module Oauth>
/\\ hasToken = TRUE
/\\ expired = TRUE
/\\ phase = "expired"

State 4: <Sync line 28, col 3 to line 31, col 36 of module Oauth>
/\\ hasToken = TRUE
/\\ expired = TRUE
/\\ phase = "syncing"

8 states generated, 7 distinct states found, 2 states left on queue.
`;

test("a violation trace names the invariant, the action, and the phase", () => {
  const parsed = parseTlc(oauthOut);
  assert.equal(parsed.kind, "violation");
  if (parsed.kind !== "violation") return;
  assert.equal(parsed.name, "ExpiredTokenNotUsed");
  assert.equal(parsed.states, 7);
  assert.equal(parsed.trace.length, 4);
  assert.equal(parsed.trace[1]?.action, "Exchange");
  assert.equal(parsed.trace[3]?.action, "Sync");
  assert.equal(parsed.trace[3]?.state.phase, "syncing");
  assert.equal(parsed.trace[3]?.state.expired, true);
});

test("a finished run reports the distinct state count", () => {
  const parsed = parseTlc("Model checking completed. No error has been found.\n3 states generated, 2 distinct states found, 0 states left on queue.\n");
  assert.equal(parsed.kind, "pass");
  if (parsed.kind !== "pass") return;
  assert.equal(parsed.states, 2);
});

test("expected markers stay attached to the invariant they name", () => {
  const cfg = readFileSync(join(here, "../../models/school-pulse/Oauth.cfg"), "utf8");
  const refs = readInvariantRefs(cfg);
  assert.deepEqual(
    refs.map((ref) => [ref.name, ref.expected]),
    [
      ["ExpiredTokenNotUsed", true],
      ["NoSyncWithoutToken", false],
    ],
  );
  const kept = cfgKeeping(cfg, new Set(["NoSyncWithoutToken"]));
  assert.match(kept, /^INVARIANT NoSyncWithoutToken/m);
  assert.match(kept, /^\\\* INVARIANT ExpiredTokenNotUsed/m);
});
