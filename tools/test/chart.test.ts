import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { chartSvg, layout, mermaid } from "../../shared/chart.ts";
import { shareCardSvg } from "../../shared/card.ts";
import type { ChartFile } from "../../shared/types.ts";

const here = dirname(fileURLToPath(import.meta.url));

function load(name: string): ChartFile {
  return JSON.parse(readFileSync(join(here, "../../models", name), "utf8")) as ChartFile;
}

test("every story step and every edge lands on a drawn node", () => {
  const files = [
    "school-pulse/Oauth.chart.json",
    "school-pulse/Ingest.chart.json",
    "school-pulse/Sse.chart.json",
    "school-pulse/Assignment.chart.json",
    "draft-day/Pipeline.chart.json",
    "session-owner/Household.chart.json",
    "post-queue/Queue.chart.json",
    "storybook/PlayClock.chart.json",
    "storybook/Replay.chart.json",
    "storybook/Bus.chart.json",
    "storybook/Booster.chart.json",
  ];
  for (const file of files) {
    const chart = load(file);
    const ids = new Set(chart.nodes.map((node) => node.id));
    for (const edge of chart.edges) {
      assert.ok(ids.has(edge.from) && ids.has(edge.to), `${file} edge ${edge.from}->${edge.to}`);
    }
    for (const step of chart.story) {
      assert.ok(ids.has(step.phase), `${file} story ${step.phase}`);
    }
    const drawn = layout(chart);
    assert.equal(drawn.edges.length, chart.edges.length);
    assert.match(mermaid(chart), /stateDiagram-v2/);
    const svg = chartSvg(chart, "field", { hot: chart.nodes[0]?.id });
    assert.match(svg, new RegExp(chart.nodes[0]?.label ?? "missing"));
  }
});

test("a share card names the invariant and the violation", () => {
  const svg = shareCardSvg({
    theme: "blueprint",
    title: "Token lifecycle",
    machine: "school-pulse/oauth",
    invariant: "An expired access token is not used to sync.",
    steps: [
      { action: "Init", label: "Start", chartState: "none", state: {} },
      { action: "Sync", label: "Sync anyway", chartState: "syncing", state: {} },
    ],
  });
  assert.match(svg, /An expired access token/);
  assert.match(svg, /VIOLATION/);
  assert.match(svg, /school-pulse\/oauth/);
  assert.match(svg, /syncing/);
});
