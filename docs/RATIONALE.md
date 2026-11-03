# Statechart Lab types

## Problem

The lab checks six state machines and shows the result on one page. TLC text, result files, and source lines all arrive as untyped text. A pass that carries a trace, or a violation with no trace, would render as a normal card.

## Usage (caller's view)

The gallery loads a result file and parses it once.

```ts
const result = parseMachineResult(await response.json());
const card = toCard(result);
```

The checker does the same after TLC.

```ts
const outcome = parseTlcOutput(tlcStdout);
const assembled = assembleMachine({ id, commit, chartSvg, sourceLines, runs });
```

A source line from a model file becomes a ref at the boundary.

```ts
parseSourceRef("src/auth/oauth.ts:111:3b76b08fad2780bf7a760ea65dae619d3a5f628b");
```

## Shape

`MachineId` is a branded slug. A plain string is not one. `MachineResult` is a union on `status`. Pass has no trace. Violation has a non-empty trace and at least one broken invariant. Error has a message.

`TraceStep.sourceRef` is `{ file, line, commit }` after `parseSourceRef`. The TLC parser returns action names and state values only. `assembleMachine` joins the model's `file:line` map with the target commit and then calls `parseMachineResult`. Code after that trusts the union.

The public surface is those parsers, `assembleMachine`, `toCard`, and `renderSvg`. TLC's tool-mode text stays inside `parseTlcOutput`.

Per type-system discipline, the brand and the union make the illegal combinations unrepresentable. Per boundary discipline, the guards sit in the parsers. Per model-the-domain, each machine is a TLA+ spec with the invariants named in its config, not a pile of booleans in the gallery.

## Synthesis decision

This seat is the types-first candidate. The base is the branded id, the status union, and parsed source refs. A parallel record with optional fields was rejected because a pass could still carry a trace. Generating charts from the raw TLC state dump was rejected because the dump repeats fingerprints and the chart IR is the smaller surface.

## Tradeoffs accepted

We accept one counterexample on the result, the first broken invariant, in exchange for the schema in SPEC.md. Further broken invariants are separate bug notes.

We accept hand-written chart edges in exchange for an SVG that does not need a browser to build.

We accept `expected:` comments in the TLC config as the mark that keeps CI green. The meta file holds the prose, and a test fails if the two name lists differ.

## Alternatives considered

A single interface with `status: Status` and `trace?: TraceStep[]` lost because every caller had to re-check the combination. It hides less.

Keeping `sourceRef` as a string lost because the gallery would split file and line in more than one place.

## Open questions and risks

Should an unconfirmed TLC violation be stored as `status: "error"` until a target-repo test fails? This seat keeps `status: "violation"` and sets `confirmed: false` on the bug, because TLC did find a counterexample and this seat does not push to the other repos.

## Next implementation step

Parse TLC tool output into the union, then point the models and the gallery at that result.
