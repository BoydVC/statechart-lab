import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { assertTlcJar, runTlc, TLC_JAR, TLC_SHA256 } from "./run.ts";

test("the pinned TLC jar matches its checksum and finds the oauth violation", () => {
  const jar = path.join(process.cwd(), TLC_JAR);
  assertTlcJar(jar);
  assert.equal(TLC_SHA256.length, 64);
  const outcome = runTlc({
    jar,
    modelDir: path.join(process.cwd(), "models", "school-pulse"),
    moduleFile: "Oauth.tla",
    invariant: "RefreshBeforeReauth",
  });
  assert.equal(outcome.status, "violation");
  if (outcome.status !== "violation") return;
  assert.equal(outcome.invariant, "RefreshBeforeReauth");
  assert.equal(outcome.states, 7);
  assert.equal(outcome.trace.at(-1)?.state.phase, "reauth");
});
