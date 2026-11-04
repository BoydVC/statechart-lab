import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseTlc, type TraceStep } from "./parse.js";
import { ensureJar, runTlc, type TlcJar } from "./tlc.js";

interface InvariantSpec {
  name: string;
  kind: "safety" | "liveness";
  text: string;
  expected: boolean;
}

interface MachineSpec {
  id: string;
  spec: string;
  config: string;
  chart: string;
  commit: string;
  repo: string;
  invariants: InvariantSpec[];
  sources: Record<string, string>;
}

interface Registry {
  tlc: TlcJar;
  machines: MachineSpec[];
}

export interface InvariantResult extends InvariantSpec {
  holds: boolean;
  trace?: TraceStep[];
}

export interface MachineResult {
  id: string;
  commit: string;
  repo: string;
  states: number;
  invariants: InvariantResult[];
  status: "pass" | "violation" | "error";
  trace?: TraceStep[];
  chartSvg: string;
  chartField: string;
  error?: string;
}

const root = process.cwd();

function attach(trace: TraceStep[], sources: Record<string, string>, repo: string, commit: string): TraceStep[] {
  return trace.map((step) => {
    const ref = sources[step.action];
    const match = ref ? /^(.+):(\d+)$/.exec(ref) : null;
    if (!match || !repo || commit === "none") return step;
    return {
      ...step,
      sourceRef: { file: match[1] ?? ref, line: Number(match[2]), commit },
    };
  });
}

function withoutInvariant(config: string, name: string): string {
  return config
    .split("\n")
    .filter((line) => line.trim() !== `INVARIANT ${name}`)
    .join("\n");
}

export function checkMachine(jar: string, machine: MachineSpec, base: string): MachineResult {
  const spec = join(base, machine.spec);
  let configText = readFileSync(join(base, machine.config), "utf8");
  const failed = new Map<string, TraceStep[]>();
  let states = 0;
  let error: string | undefined;
  const seen = new Set<string>();
  for (let pass = 0; pass < machine.invariants.length + 1; pass += 1) {
    const run = runTlc(jar, spec, configText);
    const parsed = parseTlc(run.output);
    if (parsed.distinct !== undefined) states = Math.max(states, parsed.distinct);
    if (parsed.error) {
      error = parsed.error;
      break;
    }
    if (run.status !== 0 && !parsed.violation) {
      error = run.output.trim().split("\n").slice(-4).join(" ");
      break;
    }
    if (!parsed.violation) break;
    if (seen.has(parsed.violation)) {
      error = `TLC reported ${parsed.violation} again after it was removed`;
      break;
    }
    seen.add(parsed.violation);
    failed.set(parsed.violation, attach(parsed.trace, machine.sources, machine.repo, machine.commit));
    configText = withoutInvariant(configText, parsed.violation);
  }
  const invariants: InvariantResult[] = machine.invariants.map((specItem) => {
    const trace = failed.get(specItem.name);
    return trace
      ? { ...specItem, holds: false, trace }
      : { ...specItem, holds: true };
  });
  const unexpected = invariants.filter((item) => !item.holds && !item.expected);
  const missing = invariants.filter((item) => item.holds && item.expected);
  if (!error && missing.length > 0) {
    error = `expected violation missing: ${missing.map((item) => item.name).join(", ")}`;
  }
  const broken = invariants.some((item) => !item.holds);
  const status = error ? "error" : broken ? "violation" : "pass";
  const first = invariants.find((item) => item.trace);
  return {
    id: machine.id,
    commit: machine.commit,
    repo: machine.repo,
    states,
    invariants,
    status: unexpected.length > 0 && !error ? "violation" : status,
    trace: first?.trace,
    chartSvg: "",
    chartField: "",
    error,
  };
}

function main(): void {
  const registry = JSON.parse(readFileSync(join(root, "models", "registry.json"), "utf8")) as Registry;
  const jar = ensureJar(root, registry.tlc);
  const results: MachineResult[] = [];
  let exit = 0;
  for (const machine of registry.machines) {
    const result = checkMachine(jar, machine, root);
    results.push(result);
    const flags = result.invariants.map((item) => `${item.name}:${item.holds ? "holds" : item.expected ? "expected" : "unexpected"}`);
    console.log(`${result.id}  ${result.status}  ${result.states} states  ${flags.join("  ")}`);
    if (result.error) console.log(`  ${result.error}`);
    if (result.status === "error") exit = 1;
    if (result.invariants.some((item) => !item.holds && !item.expected)) exit = 1;
    if (result.invariants.some((item) => item.holds && item.expected)) exit = 1;
  }
  mkdirSync(join(root, "results"), { recursive: true });
  for (const result of results) {
    const file = join(root, "results", `${result.id.replace("/", "__")}.json`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`);
  }
  writeFileSync(join(root, "results", "index.json"), `${JSON.stringify(results, null, 2)}\n`);
  process.exit(exit);
}

const entry = process.argv[1] ?? "";
if (entry.endsWith(`${join("tools", "check", "cli.js")}`) || entry.endsWith(`${join("tools", "check", "cli.ts")}`)) {
  main();
}
