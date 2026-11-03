import assert from "node:assert/strict";
import test from "node:test";
import { buildBug, renderBugMarkdown } from "./write.ts";

test("a violation becomes an unconfirmed bug note with the counterexample", () => {
  const trace = [{ action: "Skip", state: { status: "skipped", seenPosted: true } }];
  const sourceLines = { Skip: "server.py:786" };
  const bug = buildBug({
    machine: "post-queue/queue",
    invariant: "SkipOnlyBeforePost",
    trace,
    sourceLines,
    commit: "dea8484c024decd2a3aa72ddf7f54c58b4e19a6b",
  });
  assert.equal(bug.confirmed, false);
  if (bug.confirmed) return;
  assert.match(bug.explanation, /does not push/);
  assert.match(bug.failingTest ?? "", /skip/);
  const markdown = renderBugMarkdown({
    bug,
    trace,
    sourceLines,
    commit: "dea8484c024decd2a3aa72ddf7f54c58b4e19a6b",
  });
  assert.match(markdown, /server.py:786/);
  assert.match(markdown, /SkipOnlyBeforePost/);
  assert.match(markdown, /Confirmed: no/);
});
