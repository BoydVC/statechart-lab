import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface SourceRef {
  file: string;
  line: number;
  commit: string;
}

interface TraceStep {
  action: string;
  state: Record<string, unknown>;
  sourceRef?: SourceRef | string;
}

interface InvariantResult {
  name: string;
  kind: "safety" | "liveness";
  text: string;
  holds: boolean;
  expected?: boolean;
}

interface MachineResult {
  id: string;
  commit: string;
  states: number;
  status: "pass" | "violation" | "error";
  invariants: InvariantResult[];
  trace?: TraceStep[];
  message?: string;
}

interface ChartNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface ChartEdge {
  from: string;
  to: string;
  label: string;
  action?: string;
  tone?: "danger" | "normal";
}

interface StoryStep {
  phase: string;
  label: string;
}

interface ViewChart {
  id: string;
  title: string;
  blurb: string;
  group: "lab" | "story";
  order: number;
  stateKey: string;
  actionNode?: Record<string, string>;
  nodes: ChartNode[];
  edges: ChartEdge[];
  story: StoryStep[];
  poster?: {
    kicker: string;
    title: string;
    caption: string;
    scene: "play-clock" | "replay" | "bus" | "booster" | "assignment";
  };
  invariantText?: Record<string, string>;
}

interface RegistryMachine {
  id: string;
  view: string;
}

interface CatalogEntry {
  id: string;
  machine: string;
  invariant: string;
}

const root = process.cwd();

function refText(ref: SourceRef | string | undefined): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === "string") return ref;
  return `${ref.file}:${ref.line}`;
}

function chartState(chart: ViewChart, step: TraceStep): string {
  const mapped = chart.actionNode?.[step.action];
  if (mapped) return mapped;
  const raw = step.state[chart.stateKey];
  if (typeof raw === "string") return raw;
  throw new Error(`${chart.id} step ${step.action} has no chart node`);
}

function labelFor(chart: ViewChart, action: string, from: string, to: string): string {
  const match =
    chart.edges.find((edge) => edge.action === action && edge.from === from && edge.to === to) ??
    chart.edges.find((edge) => edge.action === action);
  return match?.label ?? action;
}

function main(): void {
  const registry = JSON.parse(readFileSync(join(root, "models", "registry.json"), "utf8")) as {
    tlc: { version: string };
    machines: RegistryMachine[];
  };
  const results = JSON.parse(readFileSync(join(root, "results", "index.json"), "utf8")) as MachineResult[];
  const catalog = JSON.parse(readFileSync(join(root, "tools", "bugs", "catalog.json"), "utf8")) as CatalogEntry[];
  const byId = new Map(results.map((result) => [result.id, result]));
  const machines = registry.machines.map((spec) => {
    const result = byId.get(spec.id);
    if (!result) throw new Error(`no TLC result for ${spec.id}`);
    const chart = JSON.parse(readFileSync(join(root, spec.view), "utf8")) as ViewChart;
    if (chart.id !== spec.id) throw new Error(`${spec.view} is ${chart.id}, expected ${spec.id}`);
    for (const step of chart.story) {
      if (!chart.nodes.some((node) => node.id === step.phase)) {
        throw new Error(`${spec.id} story phase ${step.phase} is not a node`);
      }
    }
    const trace = result.status === "violation" ? result.trace ?? [] : undefined;
    if (result.status === "violation" && (!trace || trace.length === 0)) {
      throw new Error(`${spec.id} violation has no trace`);
    }
    const beats = (trace ?? []).map((step, index) => {
      const previous = index === 0 ? chart.story[0]?.phase ?? chart.nodes[0]?.id ?? "" : "";
      const stateId = chartState(chart, step);
      if (!chart.nodes.some((node) => node.id === stateId)) {
        throw new Error(`${spec.id} action ${step.action} maps to missing node ${stateId}`);
      }
      const from = index === 0 ? stateId : chartState(chart, trace![index - 1]!);
      return {
        action: step.action,
        state: step.state,
        chartState: stateId,
        label: index === 0 ? "Start" : labelFor(chart, step.action, from || previous, stateId),
        sourceRef: refText(step.sourceRef),
      };
    });
    const broken = result.invariants.find((item) => !item.holds);
    const bug = broken ? catalog.find((entry) => entry.machine === spec.id && entry.invariant === broken.name) : undefined;
    return {
      id: result.id,
      machine: result.id,
      title: chart.title,
      blurb: result.message ? `${chart.blurb} ${result.message}` : chart.blurb,
      commit: result.commit,
      group: chart.group,
      order: chart.order,
      states: result.states,
      status: result.status,
      invariants: result.invariants.map((item) => ({
        name: item.name,
        kind: item.kind,
        text: item.text,
        holds: item.holds,
        expected: Boolean(item.expected),
      })),
      trace: beats.length > 0 ? beats : undefined,
      story: chart.story,
      chart: { nodes: chart.nodes, edges: chart.edges },
      poster: chart.poster,
      bugId: bug?.id,
    };
  });
  const lab = {
    generatedAt: new Date().toISOString(),
    tlaVersion: registry.tlc.version,
    machines,
  };
  writeFileSync(join(root, "web", "public", "lab.json"), `${JSON.stringify(lab, null, 2)}\n`);
  console.log(`gallery ${machines.length} machines`);
}

main();
