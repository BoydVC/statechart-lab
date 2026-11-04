import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderChart } from "./render.js";

interface MachineRef {
  id: string;
  chart: string;
}

interface MachineResult {
  id: string;
  chartSvg: string;
  chartField: string;
}

const root = process.cwd();

function slug(id: string): string {
  return id.replace("/", "-");
}

async function main(): Promise<void> {
  const registry = JSON.parse(readFileSync(join(root, "models", "registry.json"), "utf8")) as {
    machines: MachineRef[];
  };
  const results = JSON.parse(readFileSync(join(root, "results", "index.json"), "utf8")) as MachineResult[];
  const byId = new Map(results.map((result) => [result.id, result]));
  mkdirSync(join(root, "web", "public", "charts"), { recursive: true });
  for (const machine of registry.machines) {
    const source = readFileSync(join(root, machine.chart), "utf8");
    const blueprint = await renderChart(source, "blueprint");
    const field = await renderChart(source, "field");
    const base = slug(machine.id);
    const chartSvg = `charts/${base}-blueprint.svg`;
    const chartField = `charts/${base}-field.svg`;
    writeFileSync(join(root, "web", "public", chartSvg), blueprint);
    writeFileSync(join(root, "web", "public", chartField), field);
    const result = byId.get(machine.id);
    if (!result) throw new Error(`no TLC result for ${machine.id}`);
    result.chartSvg = chartSvg;
    result.chartField = chartField;
    writeFileSync(join(root, "results", `${machine.id.replace("/", "__")}.json`), `${JSON.stringify(result, null, 2)}\n`);
    console.log(`${machine.id}  chart`);
  }
  writeFileSync(join(root, "results", "index.json"), `${JSON.stringify(results, null, 2)}\n`);
}

await main();
