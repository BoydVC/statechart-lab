export type LabTarget = "school-pulse" | "draft-day" | "session-owner" | "post-queue";

export type MachineId = `${LabTarget}/${string}` | `storybook/${string}`;

export type Status = "pass" | "violation" | "error";

export type ThemeName = "blueprint" | "field";

export interface Invariant {
  name: string;
  kind: "safety" | "liveness";
  text: string;
  holds: boolean;
  expected: boolean;
}

export interface TraceStep {
  state: Record<string, unknown>;
  action: string;
  label: string;
  chartState: string;
  sourceRef?: string;
}

export interface ChartNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface ChartEdge {
  from: string;
  to: string;
  label: string;
  action?: string;
  tone?: "danger" | "normal";
}

export interface StoryStep {
  phase: string;
  label: string;
}

export interface Poster {
  kicker: string;
  title: string;
  caption: string;
  scene: "play-clock" | "replay" | "bus" | "booster" | "assignment";
}

export interface ChartFile {
  id: MachineId;
  title: string;
  blurb: string;
  commit: string;
  group: "lab" | "story";
  order: number;
  stateKey: string;
  nodes: ChartNode[];
  edges: ChartEdge[];
  story: StoryStep[];
  poster?: Poster;
  invariantText: Record<string, string>;
}

export interface MachineResult {
  id: MachineId;
  machine: MachineId;
  title: string;
  blurb: string;
  commit: string;
  group: "lab" | "story";
  order: number;
  states: number;
  invariants: Invariant[];
  status: Status;
  trace?: TraceStep[];
  story: StoryStep[];
  chart: { nodes: ChartNode[]; edges: ChartEdge[] };
  chartSvg: string;
  mermaid: string;
  poster?: Poster;
  bugId?: string;
}

export interface LabFile {
  generatedAt: string;
  tlaVersion: string;
  machines: MachineResult[];
}

export interface BugNote {
  id: string;
  summary: string;
  confirmed: boolean;
  draftPr: string | null;
  why: string;
  codePath: string;
  sketch: string;
  repro: string;
  actions: Record<string, string>;
}
