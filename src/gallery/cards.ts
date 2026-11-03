import type { MachineResult } from "../domain/types.ts";

export interface CardView {
  readonly id: string;
  readonly badge: "PASS" | "VIOLATION" | "ERROR";
  readonly states: number;
  readonly commit: string;
  readonly chartSvg: string;
  readonly invariants: readonly { readonly name: string; readonly text: string; readonly holds: boolean }[];
  readonly trace: readonly { readonly action: string; readonly state: string; readonly source: string }[];
  readonly message: string | null;
}

export function toCard(result: MachineResult): CardView {
  const shared = {
    id: result.id,
    states: result.states,
    commit: result.commit.slice(0, 7),
    chartSvg: result.chartSvg,
    invariants: result.invariants.map((item) => ({ name: item.name, text: item.text, holds: item.holds })),
  };
  switch (result.status) {
    case "pass":
      return { ...shared, badge: "PASS", trace: [], message: null };
    case "violation":
      return {
        ...shared,
        badge: "VIOLATION",
        message: null,
        trace: result.trace.map((step) => ({
          action: step.action,
          state: Object.entries(step.state)
            .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
            .join(" "),
          source: step.sourceRef ? `${step.sourceRef.file}:${step.sourceRef.line}` : "",
        })),
      };
    case "error":
      return { ...shared, badge: "ERROR", trace: [], message: result.message };
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}
