import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBug, parseMachineResult } from "./parse.js";

const root = process.cwd();

interface CatalogEntry {
  id: string;
  machine: string;
  invariant: string;
  confirmed: boolean;
  runner: string;
  test: string;
  summary: string;
}

function main(): void {
  const results = JSON.parse(readFileSync(join(root, "results", "index.json"), "utf8")) as unknown[];
  if (!Array.isArray(results) || results.length < 4) {
    throw new Error("expected at least 4 machine results");
  }
  for (const result of results) {
    const parsed = parseMachineResult(result);
    if (parsed.chartSvg.endsWith(".svg")) {
      const svg = readFileSync(join(root, "web", "public", parsed.chartSvg), "utf8");
      if (!svg.includes("<svg")) throw new Error(`${parsed.id} chart is not an svg`);
    }
  }
  const catalog = JSON.parse(readFileSync(join(root, "tools", "bugs", "catalog.json"), "utf8")) as CatalogEntry[];
  for (const entry of catalog) {
    if (entry.confirmed) {
      parseBug({
        id: entry.id,
        machine: entry.machine,
        invariant: entry.invariant,
        confirmed: true,
        failingTest: `${entry.runner}\n${entry.test}`,
      });
    } else {
      parseBug({
        id: entry.id,
        machine: entry.machine,
        invariant: entry.invariant,
        confirmed: false,
        explanation: entry.summary,
      });
    }
  }
  console.log(`validated ${results.length} machines and ${catalog.length} bugs`);
}

main();
