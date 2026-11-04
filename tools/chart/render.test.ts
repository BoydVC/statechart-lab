import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { mermaidBody, renderChart } from "./render.js";

test("front matter stays out of the diagram source", () => {
  assert.equal(mermaidBody("---\ntitle: \"Token\"\n---\nstateDiagram-v2\n"), "stateDiagram-v2\n");
});

test("a chart renders to themed svg", async () => {
  const source = readFileSync("models/school-pulse/sse.mmd", "utf8");
  const svg = await renderChart(source, "blueprint");
  assert.match(svg, /^<svg\b/);
  assert.match(svg, /data-theme="blueprint"/);
  assert.match(svg, /Pill says live/);
});
