import { parseMachineResult } from "../domain/parse.ts";
import type { Invariant, InvariantKind, MachineResult } from "../domain/types.ts";
import type { TlcOutcome, TlcStep } from "../tlc/parse-tlc.ts";

export interface InvariantRun {
  readonly name: string;
  readonly kind: InvariantKind;
  readonly text: string;
  readonly expectedViolation: boolean;
  readonly outcome: TlcOutcome;
}

export interface ViolationTrace {
  readonly invariant: string;
  readonly trace: readonly TlcStep[];
}

export interface Assembled {
  readonly result: MachineResult;
  readonly violations: readonly ViolationTrace[];
  readonly exitCode: number;
}

export function assembleMachine(input: {
  readonly id: string;
  readonly commit: string;
  readonly chartSvg: string;
  readonly sourceLines: Readonly<Record<string, string>>;
  readonly runs: readonly InvariantRun[];
}): Assembled {
  const invariants: Invariant[] = [];
  const violations: ViolationTrace[] = [];
  let states = 0;
  let fatal: string | null = null;
  let exitCode = 0;

  for (const run of input.runs) {
    states = Math.max(states, run.outcome.states);
    if (run.outcome.status === "error") {
      fatal = run.outcome.message;
      exitCode = 1;
    } else if (run.expectedViolation && run.outcome.status === "pass") {
      fatal = `expected ${run.name} to fail and TLC found no violation`;
      exitCode = 1;
    } else if (!run.expectedViolation && run.outcome.status === "violation") {
      exitCode = 1;
    } else if (run.outcome.status === "violation" && run.outcome.invariant !== run.name) {
      fatal = `TLC reported ${run.outcome.invariant} while checking ${run.name}`;
      exitCode = 1;
    }
    invariants.push({
      name: run.name,
      kind: run.kind,
      text: run.text,
      holds: run.outcome.status !== "violation",
    });
    if (run.outcome.status === "violation") {
      violations.push({ invariant: run.name, trace: run.outcome.trace });
    }
  }

  if (fatal || violations.length === 0) {
    const message = fatal ?? (invariants.length < 2 ? "a model needs two invariants" : "");
    if (fatal || invariants.length < 2) {
      return {
        result: errorResult(input, states, invariants, message || "model error"),
        violations: [],
        exitCode: 1,
      };
    }
    return {
      result: parseMachineResult({
        id: input.id,
        commit: input.commit,
        states,
        chartSvg: input.chartSvg,
        status: "pass",
        invariants,
      }),
      violations: [],
      exitCode,
    };
  }

  try {
    const trace = violations[0]?.trace.map((step) => attach(step, input)) ?? [];
    return {
      result: parseMachineResult({
        id: input.id,
        commit: input.commit,
        states,
        chartSvg: input.chartSvg,
        status: "violation",
        invariants,
        trace,
      }),
      violations,
      exitCode,
    };
  } catch (error) {
    return {
      result: errorResult(input, states, invariants, error instanceof Error ? error.message : "could not attach source refs"),
      violations: [],
      exitCode: 1,
    };
  }
}

function attach(
  step: TlcStep,
  input: { commit: string; sourceLines: Readonly<Record<string, string>> },
): { action: string; state: Record<string, unknown>; sourceRef: string } {
  const line = input.sourceLines[step.action];
  if (!line) throw new Error(`no source ref for action ${step.action}`);
  return { action: step.action, state: { ...step.state }, sourceRef: `${line}:${input.commit}` };
}

function errorResult(
  input: { id: string; commit: string; chartSvg: string },
  states: number,
  invariants: readonly Invariant[],
  message: string,
): MachineResult {
  const listed = invariants.length >= 2 ? invariants : padding(invariants);
  return parseMachineResult({
    id: input.id,
    commit: input.commit,
    states,
    chartSvg: input.chartSvg,
    status: "error",
    message,
    invariants: listed,
  });
}

function padding(invariants: readonly Invariant[]): Invariant[] {
  const copy = [...invariants];
  while (copy.length < 2) {
    copy.push({ name: `Missing${copy.length}`, kind: "safety", text: "The model did not supply this invariant.", holds: false });
  }
  return copy;
}
