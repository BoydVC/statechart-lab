import assert from "node:assert/strict";
import test from "node:test";
import type { MachineId } from "./types.js";
import { ParseError } from "./types.js";
import { parseBug, parseMachineId, parseMachineResult, parseSourceRef } from "./parse.js";

const COMMIT = "3b76b08fad2780bf7a760ea65dae619d3a5f628b";

const invariants = [
  { name: "StaysFresh", kind: "safety", text: "A fresh token is the only usable token.", holds: true },
  { name: "NotExpiredUse", kind: "safety", text: "A sync does not read an expired access token.", holds: true },
];

function base() {
  return {
    id: "school-pulse/oauth",
    commit: COMMIT,
    states: 8,
    chartSvg: "charts/school-pulse-oauth-blueprint.svg",
    invariants,
  };
}

test("machine ids are branded slugs", () => {
  assert.equal(parseMachineId("school-pulse/oauth"), "school-pulse/oauth");
  assert.equal(parseMachineId("post-queue/approval"), "post-queue/approval");
  assert.equal(parseMachineId("storybook/play-clock"), "storybook/play-clock");
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
  assert.deepEqual(parseSourceRef(`src/main.ts:150:${COMMIT}`), {
    file: "src/main.ts",
    line: 150,
    commit: COMMIT,
  });
  assert.throws(() => parseSourceRef("src/main.ts:150"), ParseError);
  assert.throws(() => parseSourceRef(`src/main.ts:0:${COMMIT}`), ParseError);
});

test("a pass result has no trace and every invariant holds", () => {
  const result = parseMachineResult({ ...base(), status: "pass" });
  assert.equal(result.status, "pass");
  if (result.status !== "pass") return;
  assert.equal("trace" in result, false);
});

test("a pass result rejects a trace and a broken invariant", () => {
  assert.throws(
    () => parseMachineResult({ ...base(), status: "pass", trace: [{ action: "Sync", state: { phase: "syncing" } }] }),
    ParseError,
  );
  const broken = structuredClone(base());
  broken.invariants[1]!.holds = false;
  assert.throws(() => parseMachineResult({ ...broken, status: "pass" }), ParseError);
});

test("a violation requires a broken invariant and a parsed trace", () => {
  const broken = structuredClone(base());
  broken.invariants[1]!.holds = false;
  const result = parseMachineResult({
    ...broken,
    status: "violation",
    trace: [
      { action: "Init", state: { phase: "none" } },
      { action: "Sync", state: { phase: "syncing" }, sourceRef: { file: "src/main.ts", line: 150, commit: COMMIT } },
    ],
  });
  assert.equal(result.status, "violation");
  if (result.status !== "violation") return;
  assert.equal(result.trace[1]?.sourceRef?.line, 150);
});

test("a product machine cannot omit its commit", () => {
  assert.throws(() => parseMachineResult({ ...base(), commit: "none", status: "pass" }), ParseError);
  const session = parseMachineResult({
    ...base(),
    id: "session-owner/lease",
    commit: "none",
    status: "pass",
  });
  assert.equal(session.commit, "none");
});

test("a confirmed bug needs a failing test", () => {
  const bug = parseBug({
    id: "oauth-expired-use",
    machine: "school-pulse/oauth",
    invariant: "NotExpiredUse",
    confirmed: true,
    failingTest: "sync does not send an access token whose expires_at is in the past",
  });
  assert.equal(bug.confirmed, true);
  assert.throws(
    () =>
      parseBug({
        id: "oauth-expired-use",
        machine: "school-pulse/oauth",
        invariant: "NotExpiredUse",
        confirmed: true,
        failingTest: "",
      }),
    ParseError,
  );
  assert.throws(
    () =>
      parseBug({
        id: "made-up",
        machine: "draft-day/pipeline",
        invariant: "EachSeatOnce",
        confirmed: false,
      }),
    ParseError,
  );
});
