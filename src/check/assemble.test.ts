import assert from "node:assert/strict";
import test from "node:test";
import { assembleMachine } from "./assemble.ts";
import type { TlcOutcome } from "../tlc/parse-tlc.ts";

const COMMIT = "3b76b08fad2780bf7a760ea65dae619d3a5f628b";
const chartSvg = "<svg></svg>";
const sourceLines = {
  Init: "src/auth/oauth.ts:79",
  Expire: "src/auth/oauth.ts:111",
};

const pass: TlcOutcome = { status: "pass", states: 7 };
const violation: TlcOutcome = {
  status: "violation",
  invariant: "RefreshBeforeReauth",
  states: 7,
  trace: [
    { action: "Init", state: { phase: "none" } },
    { action: "Expire", state: { phase: "reauth", hasRefresh: true } },
  ],
};

test("an expected violation keeps the trace and exits clean", () => {
  const assembled = assembleMachine({
    id: "school-pulse/oauth",
    commit: COMMIT,
    chartSvg,
    sourceLines,
    runs: [
      { name: "NoRefreshBeforeExchange", kind: "safety", text: "No refresh token exists before exchange.", expectedViolation: false, outcome: pass },
      { name: "RefreshBeforeReauth", kind: "safety", text: "Refresh runs before re-auth.", expectedViolation: true, outcome: violation },
    ],
  });
  assert.equal(assembled.exitCode, 0);
  assert.equal(assembled.result.status, "violation");
  if (assembled.result.status !== "violation") return;
  assert.equal(assembled.result.trace[1]?.sourceRef?.line, 111);
  assert.equal(assembled.result.invariants[1]?.holds, false);
  assert.equal(assembled.result.states, 7);
});

test("a clean model is a pass with no trace", () => {
  const assembled = assembleMachine({
    id: "school-pulse/ingest",
    commit: COMMIT,
    chartSvg,
    sourceLines,
    runs: [
      { name: "OneRowPerKey", kind: "safety", text: "One row per key.", expectedViolation: false, outcome: { status: "pass", states: 9 } },
      { name: "NoRowWithoutDelivery", kind: "safety", text: "A row follows a delivery.", expectedViolation: false, outcome: pass },
    ],
  });
  assert.equal(assembled.exitCode, 0);
  assert.equal(assembled.result.status, "pass");
  assert.equal("trace" in assembled.result, false);
});

test("a missing expected violation is an error and fails the run", () => {
  const assembled = assembleMachine({
    id: "school-pulse/oauth",
    commit: COMMIT,
    chartSvg,
    sourceLines,
    runs: [
      { name: "NoRefreshBeforeExchange", kind: "safety", text: "No refresh token exists before exchange.", expectedViolation: false, outcome: pass },
      { name: "RefreshBeforeReauth", kind: "safety", text: "Refresh runs before re-auth.", expectedViolation: true, outcome: pass },
    ],
  });
  assert.equal(assembled.exitCode, 1);
  assert.equal(assembled.result.status, "error");
});
