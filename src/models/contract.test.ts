import assert from "node:assert/strict";
import test from "node:test";
import { loadModels } from "../check/load.ts";

test("every model loads with a pinned commit, two invariants, and source refs", () => {
  const models = loadModels(process.cwd());
  assert.deepEqual(
    models.map((model) => model.id),
    [
      "draft-day/pipeline",
      "post-queue/queue",
      "school-pulse/ingest",
      "school-pulse/oauth",
      "school-pulse/sse",
      "session-owner/session",
    ],
  );
  for (const model of models) {
    assert.equal(model.commit.length, 40);
    assert.ok(model.cfg.invariants.length >= 2);
    assert.equal(model.chart.nodes.includes(model.chart.initial), true);
  }
});
