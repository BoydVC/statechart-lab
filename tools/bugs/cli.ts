import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface TraceStep {
  action: string;
  state: Record<string, unknown>;
  sourceRef?: string;
}

interface InvariantResult {
  name: string;
  text: string;
  holds: boolean;
  expected: boolean;
  trace?: TraceStep[];
}

interface MachineResult {
  id: string;
  commit: string;
  states: number;
  status: string;
  invariants: InvariantResult[];
}

interface CatalogEntry {
  id: string;
  machine: string;
  invariant: string;
  confirmed: boolean;
  runner: string;
  observed: string;
  summary: string;
  code: string;
  test: string;
  fix: string;
}

const root = process.cwd();

function stepLine(step: TraceStep, index: number): string {
  const bits = Object.entries(step.state)
    .slice(0, 6)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(", ");
  const ref = step.sourceRef ? ` ${step.sourceRef}` : "";
  return `${index}. ${step.action}${ref}\n   ${bits}`;
}

function main(): void {
  const catalog = JSON.parse(readFileSync(join(root, "tools", "bugs", "catalog.json"), "utf8")) as CatalogEntry[];
  const results = JSON.parse(readFileSync(join(root, "results", "index.json"), "utf8")) as MachineResult[];
  const byId = new Map(results.map((result) => [result.id, result]));
  mkdirSync(join(root, "bugs"), { recursive: true });
  const written: string[] = [];
  for (const entry of catalog) {
    const machine = byId.get(entry.machine);
    const invariant = machine?.invariants.find((item) => item.name === entry.invariant);
    if (!invariant) throw new Error(`no invariant ${entry.invariant} on ${entry.machine}`);
    if (invariant.holds) {
      throw new Error(`${entry.id} is catalogued as a violation but ${entry.invariant} holds`);
    }
    const trace = (invariant.trace ?? []).map(stepLine).join("\n");
    const body = `# ${entry.id}

Machine \`${entry.machine}\`. Invariant \`${entry.invariant}\`. TLC states on the full graph: ${machine?.states ?? 0}.

Confirmed: ${entry.confirmed ? "yes" : "no"}.

## What breaks

${entry.summary}

${invariant.text}

## Trace

${trace || "TLC did not return a trace."}

## Code

${entry.code}

## Failing test

Runner: \`${entry.runner}\`

${entry.test}

Observed: ${entry.observed}

This lab did not open a pull request on the target repo.

## Fix

${entry.fix}
`;
    writeFileSync(join(root, "bugs", `${entry.id}.md`), body);
    written.push(entry.id);
    console.log(`bugs/${entry.id}.md  confirmed=${entry.confirmed}`);
  }
  const extra = results.flatMap((result) =>
    result.invariants
      .filter((item) => !item.holds)
      .filter((item) => !catalog.some((entry) => entry.machine === result.id && entry.invariant === item.name))
      .map((item) => `${result.id} ${item.name}`),
  );
  if (extra.length > 0) throw new Error(`violations missing from the catalog: ${extra.join(", ")}`);
  writeFileSync(join(root, "bugs", "index.json"), `${JSON.stringify(written, null, 2)}\n`);
}

main();
