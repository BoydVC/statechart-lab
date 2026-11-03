import {
  MACHINE_SLUGS,
  ParseError,
  type Bug,
  type HoldingInvariant,
  type Invariant,
  type InvariantKind,
  type MachineId,
  type MachineResult,
  type SourceRef,
  type TraceStep,
} from "./types.ts";

const SLUG = MACHINE_SLUGS.join("|");
const MACHINE_ID = new RegExp(`^(?:${SLUG})/[a-z][a-z0-9-]*$`);
const COMMIT = /^[0-9a-f]{40}$/;
const NAME = /^[A-Za-z][A-Za-z0-9_]*$/;

export function parseMachineId(raw: string): MachineId {
  if (!MACHINE_ID.test(raw)) {
    throw new ParseError(`machine id must be <slug>/<name>, got ${JSON.stringify(raw)}`);
  }
  return raw as MachineId;
}

export function parseSourceRefValue(input: unknown): SourceRef {
  if (typeof input === "string") return parseSourceRef(input);
  const row = object(input, "sourceRef");
  const file = string(row.file, "sourceRef.file");
  const line = whole(row.line, "sourceRef.line");
  const commit = parseCommit(string(row.commit, "sourceRef.commit"));
  if (!file || file.includes(":") || file.startsWith("/") || line < 1) {
    throw new ParseError("source ref object is invalid");
  }
  return { file, line, commit };
}

export function parseSourceRef(raw: string): SourceRef {
  const match = /^(.+):(\d+):([0-9a-f]{40})$/.exec(raw);
  if (!match) {
    throw new ParseError(`source ref must be file:line:commit, got ${JSON.stringify(raw)}`);
  }
  const file = match[1] ?? "";
  const line = Number(match[2]);
  const commit = match[3] ?? "";
  if (!file || file.includes(":") || file.startsWith("/") || line < 1) {
    throw new ParseError(`source ref must be file:line:commit, got ${JSON.stringify(raw)}`);
  }
  return { file, line, commit };
}

export function parseCommit(raw: string): string {
  if (!COMMIT.test(raw)) throw new ParseError(`commit must be 40 hex chars, got ${JSON.stringify(raw)}`);
  return raw;
}

export function parseMachineResult(input: unknown): MachineResult {
  const row = object(input, "result");
  const id = parseMachineId(string(row.id, "id"));
  const commit = parseCommit(string(row.commit, "commit"));
  const states = whole(row.states, "states");
  const chartSvg = string(row.chartSvg, "chartSvg");
  if (!chartSvg.includes("<svg")) throw new ParseError("chartSvg must be an svg");
  const status = string(row.status, "status");
  const invariants = invariantList(row.invariants);
  const core = { id, commit, states, chartSvg };

  if (status === "pass") {
    if ("trace" in row && row.trace !== undefined) throw new ParseError("a pass result has no trace");
    if ("message" in row && row.message !== undefined) throw new ParseError("a pass result has no message");
    if (invariants.some((item) => !item.holds)) throw new ParseError("a pass result only holds invariants");
    return { ...core, status, invariants: invariants as HoldingInvariant[] };
  }

  if (status === "violation") {
    if (!invariants.some((item) => !item.holds)) {
      throw new ParseError("a violation names at least one broken invariant");
    }
    const trace = traceList(row.trace);
    return { ...core, status, invariants, trace };
  }

  if (status === "error") {
    const message = string(row.message, "message");
    if (!message) throw new ParseError("an error result needs a message");
    return { ...core, status, invariants, message };
  }

  throw new ParseError(`status must be pass, violation, or error, got ${JSON.stringify(status)}`);
}

export function parseBug(input: unknown): Bug {
  const row = object(input, "bug");
  const id = string(row.id, "bug.id");
  const machine = parseMachineId(string(row.machine, "bug.machine"));
  const invariant = string(row.invariant, "bug.invariant");
  if (!NAME.test(invariant)) throw new ParseError("bug invariant name is invalid");
  if (row.confirmed === true) {
    const failingTest = string(row.failingTest, "bug.failingTest");
    if (!failingTest) throw new ParseError("a confirmed bug needs a failing test");
    const draftPr = optionalString(row.draftPr, "bug.draftPr");
    return draftPr === undefined
      ? { id, machine, invariant, confirmed: true, failingTest }
      : { id, machine, invariant, confirmed: true, failingTest, draftPr };
  }
  if (row.confirmed === false) {
    const explanation = string(row.explanation, "bug.explanation");
    if (!explanation) throw new ParseError("an unconfirmed bug needs an explanation");
    const failingTest = optionalString(row.failingTest, "bug.failingTest");
    return failingTest === undefined
      ? { id, machine, invariant, confirmed: false, explanation }
      : { id, machine, invariant, confirmed: false, explanation, failingTest };
  }
  throw new ParseError("bug.confirmed must be boolean");
}

export function parseBugList(input: unknown): Bug[] {
  if (!Array.isArray(input)) throw new ParseError("bug list must be an array");
  return input.map((item) => parseBug(item));
}

export interface CfgFile {
  readonly invariants: readonly string[];
  readonly expected: readonly string[];
}

export function parseCfg(text: string): CfgFile {
  const invariants: string[] = [];
  const expected: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const inv = /^INVARIANT\s+([A-Za-z][A-Za-z0-9_]*)\s*$/.exec(line);
    if (inv?.[1]) invariants.push(inv[1]);
    const mark = /^\\\*\s+expected:\s+([A-Za-z][A-Za-z0-9_]*)\s*$/.exec(line);
    if (mark?.[1]) expected.push(mark[1]);
  }
  if (invariants.length < 2) throw new ParseError("a model config needs at least two invariants");
  for (const name of expected) {
    if (!invariants.includes(name)) throw new ParseError(`expected: ${name} is not an invariant`);
  }
  return { invariants, expected };
}

function invariantList(input: unknown): Invariant[] {
  if (!Array.isArray(input) || input.length < 2) {
    throw new ParseError("invariants must list at least two");
  }
  const seen = new Set<string>();
  return input.map((item) => {
    const row = object(item, "invariant");
    const name = string(row.name, "invariant.name");
    if (!NAME.test(name)) throw new ParseError(`bad invariant name ${JSON.stringify(name)}`);
    if (seen.has(name)) throw new ParseError(`duplicate invariant ${name}`);
    seen.add(name);
    const kind = string(row.kind, "invariant.kind");
    if (kind !== "safety" && kind !== "liveness") throw new ParseError(`bad invariant kind for ${name}`);
    const text = string(row.text, "invariant.text");
    if (!text) throw new ParseError(`invariant ${name} needs text`);
    if (typeof row.holds !== "boolean") throw new ParseError(`invariant ${name} needs holds`);
    const parsed: Invariant = { name, kind: kind as InvariantKind, text, holds: row.holds };
    return parsed;
  });
}

function traceList(input: unknown): readonly [TraceStep, ...TraceStep[]] {
  if (!Array.isArray(input) || input.length === 0) throw new ParseError("a violation needs a trace");
  const steps = input.map((item) => {
    const row = object(item, "trace step");
    const action = string(row.action, "trace.action");
    if (!action) throw new ParseError("trace action is empty");
    if (!isPlainObject(row.state)) throw new ParseError("trace state must be an object");
    const state = { ...row.state };
    if (!("sourceRef" in row) || row.sourceRef === undefined) return { action, state };
    const sourceRef = parseSourceRefValue(row.sourceRef);
    return { action, state, sourceRef };
  });
  return steps as unknown as readonly [TraceStep, ...TraceStep[]];
}

function object(input: unknown, label: string): Record<string, unknown> {
  if (!isPlainObject(input)) throw new ParseError(`${label} must be an object`);
  return input;
}

function isPlainObject(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function string(input: unknown, label: string): string {
  if (typeof input !== "string") throw new ParseError(`${label} must be a string`);
  return input;
}

function optionalString(input: unknown, label: string): string | undefined {
  if (input === undefined) return undefined;
  return string(input, label);
}

function whole(input: unknown, label: string): number {
  if (typeof input !== "number" || !Number.isInteger(input) || input < 0) {
    throw new ParseError(`${label} must be a non-negative integer`);
  }
  return input;
}
