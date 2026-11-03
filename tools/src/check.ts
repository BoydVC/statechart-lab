import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chartSvg, mermaid } from "../../shared/chart.ts";
import type { BugNote, ChartFile, Invariant, LabFile, MachineResult, Status } from "../../shared/types.ts";
import { parseTlc, toTraceSteps } from "./parse.ts";
import { writeBugs } from "./bugs.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const JAR = join(ROOT, "vendor/tla2tools.jar");
const PIN = "936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88";

interface InvariantRef {
  name: string;
  expected: boolean;
}

export function assertJar(): void {
  const digest = createHash("sha256").update(readFileSync(JAR)).digest("hex");
  if (digest !== PIN) {
    throw new Error(`tla2tools.jar sha256 ${digest} does not match the pin ${PIN}`);
  }
}

export function findModels(): string[] {
  const found: string[] = [];
  for (const target of readdirSync(join(ROOT, "models"))) {
    const dir = join(ROOT, "models", target);
    for (const file of readdirSync(dir)) {
      if (file.endsWith(".tla")) found.push(join(dir, file));
    }
  }
  return found.sort();
}

export function readInvariantRefs(cfg: string): InvariantRef[] {
  const expected = new Set<string>();
  for (const line of cfg.split("\n")) {
    const mark = line.match(/expected:\s*([A-Za-z0-9_]+)/);
    if (mark?.[1]) expected.add(mark[1]);
  }
  const refs: InvariantRef[] = [];
  for (const line of cfg.split("\n")) {
    const inv = line.match(/^\s*INVARIANT\s+([A-Za-z0-9_]+)/);
    if (inv?.[1]) refs.push({ name: inv[1], expected: expected.has(inv[1]) });
  }
  return refs;
}

export function cfgKeeping(cfg: string, keep: Set<string>): string {
  return cfg
    .split("\n")
    .map((line) => {
      const inv = line.match(/^\s*INVARIANT\s+([A-Za-z0-9_]+)/);
      if (!inv?.[1]) return line;
      if (keep.has(inv[1])) return line;
      return `\\* ${line}`;
    })
    .join("\n");
}

export function runTlc(tlaPath: string, cfgText: string): string {
  const dir = dirname(tlaPath);
  const scratch = mkdtempSync(join(tmpdir(), "tlc-"));
  const meta = join(scratch, "meta");
  mkdirSync(meta);
  const cfgPath = join(scratch, "check.cfg");
  writeFileSync(cfgPath, cfgText);
  const result = spawnSync(
    "java",
    ["-XX:+UseParallelGC", "-Xmx512m", "-cp", JAR, "tlc2.TLC", "-workers", "1", "-config", cfgPath, "-metadir", meta, basename(tlaPath)],
    { cwd: dir, encoding: "utf8" },
  );
  rmSync(scratch, { recursive: true, force: true });
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

export function checkModel(tlaPath: string): MachineResult {
  const dir = dirname(tlaPath);
  const base = tlaPath.replace(/\.tla$/, "");
  const cfg = readFileSync(`${base}.cfg`, "utf8");
  const chart = JSON.parse(readFileSync(`${base}.chart.json`, "utf8")) as ChartFile;
  const notePath = `${base}.bugs.json`;
  let notes: Record<string, BugNote> = {};
  try {
    notes = JSON.parse(readFileSync(notePath, "utf8")) as Record<string, BugNote>;
  } catch {
    notes = {};
  }
  const refs = readInvariantRefs(cfg);
  const pending = new Set(refs.map((ref) => ref.name));
  const outcomes = new Map<string, { holds: boolean; trace?: ReturnType<typeof toTraceSteps> }>();
  let states = 0;
  let errorMessage = "";
  let guard = 0;
  while (pending.size > 0 && guard < 8) {
    guard += 1;
    const output = runTlc(tlaPath, cfgKeeping(cfg, pending));
    const parsed = parseTlc(output);
    if (parsed.kind === "error") {
      errorMessage = parsed.message;
      break;
    }
    if (parsed.kind === "pass") {
      states = Math.max(states, parsed.states);
      for (const name of pending) outcomes.set(name, { holds: true });
      pending.clear();
      break;
    }
    const trace = toTraceSteps(
      parsed.trace,
      chart.stateKey,
      (action, from, to) => edgeLabel(chart, action, from, to),
      (action) => notes[parsed.name]?.actions[action],
    );
    outcomes.set(parsed.name, { holds: false, trace });
    pending.delete(parsed.name);
    if (parsed.states > states && /0 states left on queue/.test(output)) states = parsed.states;
  }
  if (states === 0 && errorMessage === "") {
    const full = parseTlc(runTlc(tlaPath, cfgKeeping(cfg, new Set())));
    states = full.states;
  }
  const invariants: Invariant[] = refs.map((ref) => {
    const outcome = outcomes.get(ref.name);
    return {
      name: ref.name,
      kind: "safety",
      text: chart.invariantText[ref.name] ?? ref.name,
      holds: outcome?.holds ?? false,
      expected: ref.expected,
    };
  });
  const broken = invariants.filter((item) => !item.holds);
  const unexpected = broken.filter((item) => !item.expected);
  const missed = invariants.filter((item) => item.expected && item.holds);
  let status: Status = "pass";
  if (errorMessage) console.error(errorMessage);
  if (errorMessage || unexpected.length > 0 || missed.length > 0) status = "error";
  else if (broken.length > 0) status = "violation";
  const failing = broken.find((item) => item.expected) ?? broken[0];
  const trace = failing ? outcomes.get(failing.name)?.trace : undefined;
  for (const step of trace ?? []) {
    if (!chart.nodes.some((node) => node.id === step.chartState)) {
      status = "error";
      errorMessage = `Trace phase ${step.chartState} is not a chart node on ${chart.id}`;
    }
  }
  const bug = failing ? notes[failing.name] : undefined;
  const result: MachineResult = {
    id: chart.id,
    machine: chart.id,
    title: chart.title,
    blurb: errorMessage ? `${chart.blurb} TLC did not finish.` : chart.blurb,
    commit: chart.commit,
    group: chart.group,
    order: chart.order,
    states,
    invariants,
    status,
    trace,
    story: chart.story,
    chart: { nodes: chart.nodes, edges: chart.edges },
    chartSvg: chartSvg(chart, "blueprint"),
    mermaid: mermaid(chart),
    poster: chart.poster,
    bugId: bug?.id,
  };
  return result;
}

function edgeLabel(chart: ChartFile, action: string, from: string, to: string): string {
  const match = chart.edges.find((edge) => edge.action === action && edge.from === from && edge.to === to);
  if (match) return match.label;
  const byAction = chart.edges.find((edge) => edge.action === action);
  if (byAction) return byAction.label;
  if (action === "Init") return "Start";
  return action;
}

export function checkAll(): { lab: LabFile; failed: string[] } {
  assertJar();
  const machines = findModels().map((path) => checkModel(path));
  const failed: string[] = [];
  for (const machine of machines) {
    if (machine.status === "error") failed.push(machine.id);
    const missed = machine.invariants.filter((item) => item.expected && item.holds);
    if (missed.length > 0) failed.push(`${machine.id} missed ${missed.map((item) => item.name).join(",")}`);
  }
  const lab: LabFile = {
    generatedAt: new Date().toISOString(),
    tlaVersion: "TLA+ 1.7.4 / TLC 2.19",
    machines,
  };
  writeResults(lab);
  writeBugs(lab);
  return { lab, failed };
}

function writeResults(lab: LabFile): void {
  const resultsDir = join(ROOT, "results");
  mkdirSync(resultsDir, { recursive: true });
  const byTarget = new Map<string, MachineResult[]>();
  for (const machine of lab.machines) {
    const target = machine.id.split("/")[0] ?? "unknown";
    const list = byTarget.get(target) ?? [];
    list.push(machine);
    byTarget.set(target, list);
  }
  for (const [target, machines] of byTarget) {
    writeFileSync(join(resultsDir, `${target}.json`), `${JSON.stringify({ target, machines }, null, 2)}\n`);
  }
  const publicLab = join(ROOT, "web/public/lab.json");
  mkdirSync(dirname(publicLab), { recursive: true });
  writeFileSync(publicLab, `${JSON.stringify(lab, null, 2)}\n`);
  writeFileSync(join(resultsDir, "lab.json"), `${JSON.stringify(lab, null, 2)}\n`);
}

if (process.argv[1] && process.argv[1].endsWith("check.ts")) {
  const { lab, failed } = checkAll();
  for (const machine of lab.machines) {
    const marks = machine.invariants.map((item) => `${item.name}:${item.holds ? "holds" : "fails"}`).join(" ");
    console.log(`${machine.status.toUpperCase()} ${machine.id} states=${machine.states} ${marks}`);
  }
  if (failed.length > 0) {
    console.error(failed.join("\n"));
    process.exit(1);
  }
}
