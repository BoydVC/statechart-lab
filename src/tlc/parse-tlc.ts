export type TlcStep = {
  readonly action: string;
  readonly state: Readonly<Record<string, unknown>>;
};

export type TlcOutcome =
  | { readonly status: "pass"; readonly states: number }
  | { readonly status: "violation"; readonly invariant: string; readonly states: number; readonly trace: readonly TlcStep[] }
  | { readonly status: "error"; readonly message: string; readonly states: number };

export function parseTlcOutput(text: string): TlcOutcome {
  const states = lastStates(text);
  if (/Parsing or semantic analysis failed|Unknown operator:|Semantic errors:/.test(text) && !/is violated/.test(text)) {
    const detail = text.split(/\r?\n/).find((line) => /Unknown operator:|Error:/.test(line));
    return { status: "error", message: (detail ?? "TLC rejected the model").trim(), states };
  }
  const violated = /Invariant ([A-Za-z][A-Za-z0-9_]*) is violated/.exec(text);
  if (violated?.[1]) {
    const trace = parseTrace(text);
    if (trace.length === 0) {
      return { status: "error", message: `TLC violated ${violated[1]} without a trace`, states };
    }
    return { status: "violation", invariant: violated[1], states, trace };
  }
  if (/No error has been found/.test(text)) {
    if (states === 0 && !/0 distinct states found/.test(text)) {
      return { status: "error", message: "TLC reported success without a state count", states: 0 };
    }
    return { status: "pass", states };
  }
  return { status: "error", message: "TLC output was not a pass, a violation, or a parse error", states };
}

function lastStates(text: string): number {
  const matches = [...text.matchAll(/(\d+) distinct states found/g)];
  const last = matches.at(-1)?.[1];
  return last ? Number(last) : 0;
}

function parseTrace(text: string): TlcStep[] {
  const steps: TlcStep[] = [];
  let current: { action: string; state: Record<string, unknown> } | null = null;
  for (const line of text.split(/\r?\n/)) {
    const head = /^(?:State\s+)?(\d+):\s+<([^>]+)>/.exec(line.trim());
    if (head?.[2]) {
      if (current) steps.push(current);
      current = { action: actionName(head[2]), state: {} };
      continue;
    }
    const assignment = /^\/\\\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line.trim());
    if (current && assignment?.[1] && assignment[2] !== undefined) {
      current.state[assignment[1]] = tlcValue(assignment[2]);
    }
  }
  if (current) steps.push(current);
  return steps;
}

function actionName(body: string): string {
  if (body.startsWith("Initial predicate")) return "Init";
  const word = /^([A-Za-z_][A-Za-z0-9_]*)/.exec(body);
  return word?.[1] ?? "Unknown";
}

function tlcValue(raw: string): unknown {
  if (raw === "TRUE") return true;
  if (raw === "FALSE") return false;
  if (/^-?\d+$/.test(raw)) return Number(raw);
  if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  return raw;
}
