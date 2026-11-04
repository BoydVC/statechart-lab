export interface SourceRef {
  file: string;
  line: number;
  commit: string;
}

export interface TraceStep {
  state: Record<string, unknown>;
  action: string;
  sourceRef?: SourceRef;
}

export interface TlcParse {
  violation?: string;
  trace: TraceStep[];
  distinct?: number;
  error?: string;
}

export function parseValue(raw: string): unknown {
  const text = raw.trim();
  if (text === "TRUE") return true;
  if (text === "FALSE") return false;
  if (/^-?\d+$/.test(text)) return Number(text);
  if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) return text.slice(1, -1);
  if (text.startsWith("[") && text.endsWith("]")) return parseRecord(text);
  return text;
}

function parseRecord(text: string): Record<string, unknown> {
  const body = text.slice(1, -1).trim();
  const record: Record<string, unknown> = {};
  if (!body) return record;
  for (const part of splitTop(body)) {
    const arrow = part.indexOf("|->");
    if (arrow === -1) continue;
    const key = part.slice(0, arrow).trim().replace(/^"|"$/g, "");
    record[key] = parseValue(part.slice(arrow + 3));
  }
  return record;
}

function splitTop(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    if (char === "[") depth += 1;
    else if (char === "]") depth -= 1;
    else if (char === "," && depth === 0) {
      parts.push(body.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(body.slice(start));
  return parts;
}

export function parseTlc(output: string): TlcParse {
  const violation = output.match(/Error: Invariant (\w+) is violated\./)?.[1];
  const distinct = output.match(/(\d+) distinct states found/);
  const trace = parseTrace(output);
  let error: string | undefined;
  if (/Parsing or semantic analysis failed|not completely specified|TLC threw an unexpected exception/.test(output)) {
    error = "tlc could not check the model";
  } else if (/Error: Deadlock reached\./.test(output) && !violation) {
    error = "deadlock";
  }
  return {
    violation,
    trace,
    distinct: distinct ? Number(distinct[1]) : undefined,
    error,
  };
}

function parseTrace(output: string): TraceStep[] {
  const steps: TraceStep[] = [];
  const chunks = output.split(/\n(?=State \d+: )/);
  for (const chunk of chunks) {
    const header = chunk.match(/^State \d+: <([^>\n]+)>/);
    if (!header) continue;
    const label = header[1];
    const action = label.startsWith("Initial") ? "Init" : (label.split(" ")[0] ?? "Next");
    const state: Record<string, unknown> = {};
    for (const line of chunk.split("\n")) {
      const assignment = line.match(/^\/\\ (.+?) = (.*)$/);
      if (!assignment) continue;
      state[assignment[1]] = parseValue(assignment[2]);
    }
    steps.push({ action, state });
  }
  return steps;
}
