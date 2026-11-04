---
name: verify-statechart-lab
description: Re-check the Statechart Lab models when a change touches models/, the SOURCE maps, the TLC checker, or the queue, token, ingest, and live-stream behavior those models describe. Use after editing a machine, before calling a new invariant a bug, and when TLC output disagrees with the gallery.
---

# Verify the Statechart Lab

The models live in `models/`. `models/registry.json` is the list the checker runs. `models/*/SOURCE.md` is the map from each TLC action to a file and line, plus the commit where that map was last confirmed.

Pinned commits, last confirmed while writing this skill:

- school-pulse `3b76b08fad2780bf7a760ea65dae619d3a5f628b` for `school-pulse/oauth`, `school-pulse/ingest-retry`, `school-pulse/ingest-stable`, `school-pulse/sse`
- x-post-queue `dea8484c024decd2a3aa72ddf7f54c58b4e19a6b` for `post-queue/approval`
- draft-day `7fb564d8d974db4ad3c8584a0b9b1f4e35a8ea96` for `draft-day/pipeline`. That tree is a visual player. The pipeline model is the protocol in `SPEC.md`, not a line-for-line program.
- `session-owner/lease` has no source file. The assumptions are in `models/session-owner/SOURCE.md`.

Move a commit forward only after you have read the code at the new commit and the actions in the matching `SOURCE.md` still describe it. If a mapped function changed, fix the model or the map in the same change. Do not bump the commit because the file still exists.

## When a change touches a machine

A change touches a machine when it edits that machine's `.tla`, `.cfg`, view, `SOURCE.md`, or the registry entry. Product code in another repo touches a machine when it edits a file named in that `SOURCE.md`.

## Run

From the repo root, with Java 11 or newer:

```
npm install
npm run check
```

`npm run check` typechecks, runs TLC 1.7.4 (the jar checksum is in `models/registry.json`), draws the charts, writes `bugs/*.md`, and runs the parser tests. It finishes in well under five minutes on these models.

Exit 0 means every invariant that is not marked `expected: true` holds, and every expected violation still fails. Exit 1 means a new violation, a missing expected violation, or TLC could not check.

Read every TLC result with `/statechart`. Use it to see the shortest path in plain words and, when the check passes, the chart. Do not copy its command lines from this skill. They move between releases.

## A real bug or a modeling error

- The trace's actions are in `SOURCE.md`, and a test in the target repo's runner fails the way the trace says. Confirmed. Write the sketch through `tools/bugs/catalog.json` and leave the invariant `expected: true` until the product code changes.
- The trace needs a step the code cannot take, or the test passes. Modeling error. Fix the model. Do not weaken the invariant to force a pass.
- `draft-day/pipeline` and `session-owner/lease` have no product function under test. A failure there is a protocol failure. Confirm it against code only after a `SOURCE.md` line points at a real function.
- `school-pulse/ingest-stable` is the control for the clock-token retry. It should pass. If it fails, the model no longer matches `UNIQUE(source, source_id)` plus a stable id.

## What is covered, and what is not

Covered, on the bounds inside each `.tla`: two sign-ins and a generation cap of 2 for the token file, three watcher attempts for ingest, the live pill versus one missed pulse, one queue item and a version cap of 4, two seats, one session owner.

Not covered: refresh-token grants (this school-pulse commit has none), skip on the queue, webhook delivery, the words inside a pulse, and any school record.

## Charts

`models/*/*.mmd` is the chart `/statechart` last drew. `npm run check` renders those files. It does not redraw them from TLC. After a model change, redraw with `/statechart`, replace the `.mmd`, and say which steps the view hides.

The gallery reads `web/data.js`. `python3 -m http.server 4173 -d web` serves it. Blueprint and field guide are the two themes.
