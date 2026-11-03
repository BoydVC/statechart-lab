import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { BugNote, LabFile, MachineResult, TraceStep } from "../../shared/types.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function writeBugs(lab: LabFile): string[] {
  const written: string[] = [];
  mkdirSync(join(ROOT, "bugs"), { recursive: true });
  for (const machine of lab.machines) {
    const failing = machine.invariants.find((item) => !item.holds);
    if (!failing || !machine.bugId || !machine.trace) continue;
    const note = loadNote(machine, failing.name);
    if (!note) continue;
    const path = join(ROOT, "bugs", `${note.id}.md`);
    writeFileSync(path, renderBug(machine, failing.name, failing.text, note));
    written.push(path);
  }
  return written;
}

function loadNote(machine: MachineResult, invariant: string): BugNote | null {
  const target = machine.id.split("/")[0];
  const moduleName = moduleFromId(machine.id);
  const path = join(ROOT, "models", target ?? "", `${moduleName}.bugs.json`);
  try {
    const notes = JSON.parse(readFileSync(path, "utf8")) as Record<string, BugNote>;
    return notes[invariant] ?? null;
  } catch {
    return null;
  }
}

function moduleFromId(id: string): string {
  const slug = id.split("/")[1] ?? "";
  const known: Record<string, string> = {
    oauth: "Oauth",
    ingest: "Ingest",
    sse: "Sse",
    assignment: "Assignment",
    pipeline: "Pipeline",
    household: "Household",
    queue: "Queue",
    "play-clock": "PlayClock",
    replay: "Replay",
    bus: "Bus",
    booster: "Booster",
  };
  return known[slug] ?? slug;
}

function renderBug(machine: MachineResult, invariant: string, text: string, note: BugNote): string {
  const trace = (machine.trace ?? []).map((step, index) => formatStep(step, index)).join("\n");
  const confirmed = note.confirmed
    ? "Confirmed locally in the target repo's test runner. No draft PR was opened on that repo."
    : "Not confirmed in the target test runner. See the repro note.";
  return `# ${note.id}

${note.summary}

- Machine: \`${machine.id}\`
- Invariant: \`${invariant}\`
- Commit: \`${machine.commit}\`
- TLC states: ${machine.states}
- Confirmed: ${note.confirmed ? "yes" : "no"}
- Draft PR: ${note.draftPr ?? "none"}

## What breaks

${text}

${note.why}

## Trace

${trace}

## Code path

${note.codePath}

## Failing test sketch

\`\`\`
${note.sketch.trim()}
\`\`\`

## Repro

${note.repro}

${confirmed}
`;
}

function formatStep(step: TraceStep, index: number): string {
  const state = Object.entries(step.state)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(", ");
  const source = step.sourceRef ? ` (${step.sourceRef})` : "";
  return `${index + 1}. ${step.action}: ${step.label}. ${state}${source}`;
}
