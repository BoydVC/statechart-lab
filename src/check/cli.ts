import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildBug, renderBugMarkdown } from "../bugs/write.ts";
import { renderSvg } from "../chart/render.ts";
import { assembleMachine } from "./assemble.ts";
import { loadModels } from "./load.ts";
import { assertTlcJar, runTlc, TLC_JAR } from "../tlc/run.ts";

const root = process.cwd();
const jar = path.join(root, TLC_JAR);
assertTlcJar(jar);

const models = loadModels(root);
const resultsDir = path.join(root, "results");
const bugsDir = path.join(root, "bugs");
const publicDir = path.join(root, "web", "public");
for (const dir of [resultsDir, bugsDir, path.join(publicDir, "results"), path.join(publicDir, "charts"), path.join(publicDir, "bugs")]) {
  mkdirSync(dir, { recursive: true });
}

const catalog: string[] = [];
const bugRecords = [];
let exitCode = 0;

for (const model of models) {
  const runs = model.cfg.invariants.map((name) => {
    const prose = model.prose[name];
    if (!prose) throw new Error(`missing prose for ${name}`);
    return {
      name,
      kind: prose.kind,
      text: prose.text,
      expectedViolation: model.cfg.expected.includes(name),
      outcome: runTlc({ jar, modelDir: model.dir, moduleFile: model.moduleFile, invariant: name }),
    };
  });
  const broken = runs.find((run) => run.outcome.status === "violation");
  const highlight = broken?.outcome.status === "violation" ? broken.outcome.trace.at(-1)?.action : undefined;
  const chartSvg = renderSvg(model.chart, "blueprint", highlight);
  const assembled = assembleMachine({
    id: model.id,
    commit: model.commit,
    chartSvg,
    sourceLines: model.sourceLines,
    runs,
  });
  exitCode = Math.max(exitCode, assembled.exitCode);
  const file = `${model.id.replace("/", "--")}.json`;
  const body = `${JSON.stringify(assembled.result, null, 2)}\n`;
  writeFileSync(path.join(resultsDir, file), body);
  writeFileSync(path.join(publicDir, "results", file), body);
  writeFileSync(path.join(publicDir, "charts", file), `${JSON.stringify(model.chart, null, 2)}\n`);
  catalog.push(file);

  for (const violation of assembled.violations) {
    const bug = buildBug({
      machine: model.id,
      invariant: violation.invariant,
      trace: violation.trace,
      sourceLines: model.sourceLines,
      commit: model.commit,
    });
    bugRecords.push(bug);
    writeFileSync(
      path.join(bugsDir, `${bug.id}.md`),
      renderBugMarkdown({ bug, trace: violation.trace, sourceLines: model.sourceLines, commit: model.commit }),
    );
  }

  const brokenNames = assembled.result.invariants.filter((item) => !item.holds).map((item) => item.name);
  const detail = brokenNames.length ? brokenNames.join(", ") : "";
  console.log(`${assembled.result.status.padEnd(9)} ${String(assembled.result.states).padStart(3)}  ${model.id}  ${detail}`);
}

const bugBody = `${JSON.stringify(bugRecords, null, 2)}\n`;
writeFileSync(path.join(bugsDir, "index.json"), bugBody);
writeFileSync(path.join(publicDir, "bugs", "index.json"), bugBody);
const catalogBody = `${JSON.stringify(catalog, null, 2)}\n`;
writeFileSync(path.join(publicDir, "catalog.json"), catalogBody);
writeFileSync(path.join(resultsDir, "catalog.json"), catalogBody);

if (exitCode !== 0) {
  console.error("check failed");
  process.exit(exitCode);
}
