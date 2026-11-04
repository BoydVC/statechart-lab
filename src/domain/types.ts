declare const machineIdBrand: unique symbol;

export const MACHINE_SLUGS = ["school-pulse", "draft-day", "session-owner", "post-queue", "storybook"] as const;

export type MachineSlug = (typeof MACHINE_SLUGS)[number];

export type MachineId = `${MachineSlug}/${string}` & { readonly [machineIdBrand]: true };

export type InvariantKind = "safety" | "liveness";

export interface Invariant {
  readonly name: string;
  readonly kind: InvariantKind;
  readonly text: string;
  readonly holds: boolean;
}

export type HoldingInvariant = Invariant & { readonly holds: true };

export interface SourceRef {
  readonly file: string;
  readonly line: number;
  readonly commit: string;
}

export interface TraceStep {
  readonly state: Readonly<Record<string, unknown>>;
  readonly action: string;
  readonly sourceRef?: SourceRef;
}

interface ResultCore {
  readonly id: MachineId;
  readonly commit: string;
  readonly states: number;
  readonly chartSvg: string;
}

export type MachineResult =
  | (ResultCore & {
      readonly status: "pass";
      readonly invariants: readonly HoldingInvariant[];
    })
  | (ResultCore & {
      readonly status: "violation";
      readonly invariants: readonly Invariant[];
      readonly trace: readonly [TraceStep, ...TraceStep[]];
    })
  | (ResultCore & {
      readonly status: "error";
      readonly invariants: readonly Invariant[];
      readonly message: string;
    });

export type Bug =
  | {
      readonly id: string;
      readonly machine: MachineId;
      readonly invariant: string;
      readonly confirmed: true;
      readonly failingTest: string;
      readonly draftPr?: string;
    }
  | {
      readonly id: string;
      readonly machine: MachineId;
      readonly invariant: string;
      readonly confirmed: false;
      readonly explanation: string;
      readonly failingTest?: string;
    };

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}
