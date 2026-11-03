import assert from "node:assert/strict";
import test from "node:test";
import type { MachineId, MachineResult } from "./types.ts";
import { ParseError } from "./types.ts";
import { parseBug, parseMachineId, parseMachineResult, parseSourceRef } from "./parse.ts";

const COMMIT = "3b76b08fad2780bf7a760ea65dae619d3a5f628b";

const invariants = [
  { name: "StaysFresh", kind: "safety", text: "A fresh token is the only usable token.", holds: true },
  { name: "RefreshBeforeReauth", kind: "safety", text: "Refresh runs before re-auth.", holds: true },
];

function base() {
  return {
    id: "school-pulse/oauth",
    commit: COMMIT,
    states: 7,
    chartSvg: "<svg></svg>",
    invariants,
  };
}

test("machine ids are branded slugs", () => {
  assert.equal(parseMachineId("school-pulse/oauth"), "school-pulse/oauth");
  assert.equal(parseMachineId("post-queue/queue"), "post-queue/queue");
  for (const raw of ["school-pulse", "school-pulse/", "kpd/oauth", "School-Pulse/oauth", "draft-day/Pipeline"]) {
    assert.throws(() => parseMachineId(raw), ParseError, raw);
  }
});

type PlainStringIsMachineId = "school-pulse/oauth" extends MachineId ? true : false;

test("a plain string is not a machine id", () => {
  const rejected: PlainStringIsMachineId = false;
  assert.equal(rejected, false);
});

test("source refs parse into file, line, and commit", () => {
  assert.deepEqual(parseSourceRef(`src/auth/oauth.ts:111:${COMMIT}`), {
    file: "src/auth/oauth.ts",
    line: 111,
    commit: COMMIT,
  });
  assert.throws(() => parseSourceRef("src/auth/oauth.ts:111"), ParseError);
  assert.throws(() => parseSourceRef(`src/auth/oauth.ts:0:${COMMIT}`), ParseError);
  assert.throws(() => parseSourceRef(`src/auth/oauth.ts:111:${"z".repeat(40)}`), ParseError);
});

test("a pass result has no trace and every invariant holds", () => {
  const result = parseMachineResult({ ...base(), status: "pass" });
  assert.equal(result.status, "pass");
  if (result.status !== "pass") return;
  assert.equal(result.states, 7);
  assert.equal("trace" in result, false);
});

test("a pass result rejects a trace and a broken invariant", () => {
  assert.throws(() => parseMachineResult({ ...base(), trace: [] }), ParseError);
  const broken = structuredClone(base());
  broken.invariants[1]!.holds = false;
  assert.throws(() => parseMachineResult(broken), ParseError);
});

test("a violation requires a broken invariant and a parsed trace", () => {
  const broken = structuredClone(base());
  broken.invariants[1]!.holds = false;
  const result = parseMachineResult({
    ...broken,
    status: "violation",
    trace: [
      { action: "Init", state: { phase: "none" }, sourceRef: `src/auth/oauth.ts:79:${COMMIT}` },
      { action: "Expire", state: { phase: "reauth", hasRefresh: true }, sourceRef: `src/auth/oauth.ts:111:${COMMIT}` },
    ],
  });
  assert.equal(result.status, "violation");
  if (result.status !== "violation") return;
  assert.equal(result.trace[1]?.action, "Expire");
  assert.deepEqual(result.trace[1]?.sourceRef, { file: "src/auth/oauth.ts", line: 111, commit: COMMIT });
  const fromObject = parseMachineResult({
    ...broken,
    status: "violation",
    trace: [{ action: "Expire", state: { phase: "reauth" }, sourceRef: { file: "src/auth/oauth.ts", line: 111, commit: COMMIT } }],
  });
  if (fromObject.status === "violation") assert.equal(fromObject.trace[0]?.sourceRef?.line, 111);
  assert.throws(() => parseMachineResult({ ...broken, status: "violation" }), ParseError);
  assert.throws(() => parseMachineResult({ ...base(), status: "violation", trace: [{ action: "Expire", state: {} }] }), ParseError);
});

test("an error result requires a message and is not a violation", () => {
  const result = parseMachineResult({ ...base(), status: "error", message: "TLC failed" });
  assert.equal(result.status, "error");
  if (result.status !== "error") return;
  assert.equal(result.message, "TLC failed");
  assert.throws(() => parseMachineResult({ ...base(), status: "error" }), ParseError);
});

test("a pass result cannot be given a trace field in the type", () => {
  type Pass = Extract<MachineResult, { status: "pass" }>;
  type HasTrace = "trace" extends keyof Pass ? true : false;
  const flag: HasTrace = false;
  assert.equal(flag, false);
});

test("confirmed bugs need a failing test, and unconfirmed bugs need an explanation", () => {
  assert.equal(
    parseBug({
      id: "school-pulse-oauth-refresh",
      machine: "school-pulse/oauth",
      invariant: "RefreshBeforeReauth",
      confirmed: false,
      explanation: "Not run in the target repo.",
    }).confirmed,
    false,
  );
  assert.throws(
    () =>
      parseBug({
        id: "x",
        machine: "school-pulse/oauth",
        invariant: "RefreshBeforeReauth",
        confirmed: true,
      }),
    ParseError,
  );
});
