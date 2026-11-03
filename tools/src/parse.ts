import type { TraceStep } from "../../shared/types.ts";

export interface ParsedTraceStep {
  action: string;
  state: Record<string, unknown>;
}

export type TlcParse =
  | { kind: "pass"; states: number }
  | { kind: "violation"; name: string; states: number; trace: ParsedTraceStep[] }
  | { kind: "error"; message: string; states: number };

export function parseTlc(output: string): TlcParse {
  const states = distinctStates(output);
  const violated = output.match(/Invariant (\w+) is violated/);
  if (violated) {
    return {
      kind: "violation",
      name: violated[1] ?? "unknown",
      states,
      trace: parseTrace(output),
    };
  }
  if (/Model checking completed\. No error has been found/.test(output)) {
    return { kind: "pass", states };
  }
  const semantic = output.match(/Semantic errors:[\s\S]*?(?=\nStarting\.\.\.|$)/);
  const message = semantic?.[0]?.trim() || output.trim().split("\n").slice(-8).join("\n");
  return { kind: "error", message, states };
}

export function distinctStates(output: string): number {
  const match = output.match(/(\d+) distinct states found/);
  return match ? Number(match[1]) : 0;
}

export function parseTrace(output: string): ParsedTraceStep[] {
  const lines = output.split("\n");
  const steps: ParsedTraceStep[] = [];
  let current: ParsedTraceStep | null = null;
  for (const line of lines) {
    const header = line.match(/^State \d+: <([^>]+)>/);
    if (header) {
      if (current) steps.push(current);
      current = { action: actionName(header[1] ?? ""), state: {} };
      continue;
    }
    if (!current) continue;
    const assignment = line.match(/^\/\\ ([A-Za-z0-9_]+) = (.*)$/);
    if (assignment) {
      current.state[assignment[1] ?? ""] = parseValue(assignment[2] ?? "");
    }
  }
  if (current) steps.push(current);
  return steps;
}

function actionName(header: string): string {
  if (header.startsWith("Initial predicate")) return "Init";
  const name = header.match(/^([A-Za-z0-9_]+)/);
  return name?.[1] ?? header;
}

function parseValue(raw: string): unknown {
  const value = raw.trim();
  if (value === "TRUE") return true;
  if (value === "FALSE") return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  return value;
}

export function toTraceSteps(
  steps: ParsedTraceStep[],
  stateKey: string,
  labelFor: (action: string, from: string, to: string) => string,
  sourceFor: (action: string) => string | undefined,
): TraceStep[] {
  return steps.map((step, index) => {
    const chartState = String(step.state[stateKey] ?? "");
    const previous = index === 0 ? "" : String(steps[index - 1]?.state[stateKey] ?? "");
    return {
      state: step.state,
      action: step.action,
      label: labelFor(step.action, previous, chartState),
      chartState,
      sourceRef: sourceFor(step.action),
    };
  });
}
