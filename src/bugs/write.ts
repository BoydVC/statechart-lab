import { parseBug, parseMachineId } from "../domain/parse.ts";
import type { Bug, MachineId } from "../domain/types.ts";
import type { TlcStep } from "../tlc/parse-tlc.ts";

const UNCONFIRMED =
  "TLC found this counterexample in the model. The sketch was not run in the target repo. This seat does not push to other repositories, so the finding stays unconfirmed.";

export function bugId(machine: MachineId, invariant: string): string {
  const kebab = invariant.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `${machine.replace("/", "-")}-${kebab}`;
}

export function buildBug(input: {
  machine: string;
  invariant: string;
  trace: readonly TlcStep[];
  sourceLines: Readonly<Record<string, string>>;
  commit: string;
}): Bug {
  const machine = parseMachineId(input.machine);
  return parseBug({
    id: bugId(machine, input.invariant),
    machine,
    invariant: input.invariant,
    confirmed: false,
    explanation: UNCONFIRMED,
    failingTest: sketch(machine, input.invariant),
  });
}

export function renderBugMarkdown(input: {
  bug: Bug;
  trace: readonly TlcStep[];
  sourceLines: Readonly<Record<string, string>>;
  commit: string;
}): string {
  const rows = input.trace
    .map((step) => {
      const source = input.sourceLines[step.action] ?? "unmapped";
      const state = JSON.stringify(step.state);
      return `| ${step.action} | \`${state}\` | ${source} |`;
    })
    .join("\n");
  const sketch = input.bug.confirmed ? input.bug.failingTest : (input.bug.failingTest ?? "");
  return `# ${input.bug.id}

Machine \`${input.bug.machine}\` breaks \`${input.bug.invariant}\` at \`${input.commit}\`.

Confirmed: no. ${input.bug.confirmed ? "" : input.bug.explanation}

## Trace

| Action | State | Source |
| --- | --- | --- |
${rows}

## Failing test sketch

\`\`\`
${sketch}
\`\`\`

No draft pull request was opened on the target repository.
`;
}

function sketch(machine: MachineId, invariant: string): string {
  const key = `${machine} ${invariant}`;
  return SKETCHES[key] ?? `test("${invariant} holds", () => { throw new Error("sketch"); });`;
}

const SKETCHES: Record<string, string> = {
  "school-pulse/oauth RefreshBeforeReauth": `test("a stored refresh token is used before re-auth", () => {
  const token = {
    access_token: "synthetic-access",
    refresh_token: "synthetic-refresh",
    expires_at: "2000-01-01T00:00:00.000Z",
  };
  assert.equal(token.refresh_token === null || phaseAfterExpiry(token) === "refreshing", true);
});`,
  "school-pulse/sse ReconnectScheduled": `test("a closed event source is opened again", () => {
  let opened = 0;
  onError({ readyState: 2 }, () => { opened += 1; });
  assert.equal(opened, 1);
});`,
  "draft-day/pipeline EachSeatOnce": `test("the verified phase waits until each seat is judged once", () => {
  const view = applyPhase(12);
  assert.equal(view.seats.every((seat) => seat.judged === 1), true);
});`,
  "post-queue/queue SkipOnlyBeforePost": `def test_skip_after_post_is_refused():
    item = {"status": "posted", "text": "synthetic draft"}
    status, body = act(item, "skip")
    assert status == 400
    assert item["status"] == "posted"`,
};
