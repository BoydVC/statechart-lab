# SPEC: Statechart Lab

## One line
This repo models the state machines in Boyd's shipped projects, checks them for bugs, draws the charts, and turns every confirmed bug into a failing test plus a fix proposal. Fixes are only proposed as draft PRs.

## Why
- @poteto's inverse pyramid says to catch problems with static analysis or verification before human review. Boyd's builds have stateful flows that unit tests cover thinly: OAuth refresh and re-auth, retries, and idempotent ingest.
- pstack v0.15.36 shipped a stable /statechart and /create-formal-verification-skill, and poteto asked people to show their charts and bugs. A gallery of real bugs makes a credible X post for @X Growth, using synthetic and public code only.

## Users and outcome
Boyd opens one page and sees:
- a card per modeled machine with its chart, its invariants, and its PASS or VIOLATION status
- a counterexample trace for each violation
- a link to the draft PR that adds the failing test

## Scope (v1)
Model these targets, all public BoydVC code or generic patterns:
1. **school-pulse:** the OAuth token lifecycle (fresh → expiring → refreshing → re-auth-needed, per student/account), ingest idempotency on (source, sourceId), and the SSE client reconnect.
2. **Draft Day pipeline:** idea → spec → seats → judge → graft → physical → draft PR. Invariants: no merge without approval, and each seat is judged exactly once.
3. **Generic household session-owner pattern:** a single session owner with keep-alive, resume vs re-auth, and a freshness check before messaging. This is a generic model with no PowerSchool data or names.
4. **X Post Queue:** draft → approved → scheduled → posted. Invariant: nothing reaches posted without approved.

Out of scope: anything KPD or collections, private repos, live accounts, and auto-merge.

## Architecture
- `models/<target>/*.tla` + `*.cfg`: TLA+ specs written from the code. Each one has a `SOURCE.md` mapping every action to file:line at a pinned commit.
- `tools/check`: runs TLC (Java jar, pinned version) and emits `results/<target>.json` with `{machine, invariants[], status, states, trace[]}`.
- `tools/chart`: TLA+ state graph or /statechart IR → Mermaid → SVG, with two themes ("blueprint", "field guide").
- `tools/bugs`: for each violation, writes `bugs/<id>.md` (trace, the real-code path, and a failing-test sketch). A bug only counts as confirmed when a failing test reproduces it in the target repo's test runner.
- `web/`: a static gallery (Vite + TS, or plain HTML) built from `results/*.json`, with 375px phone layout support.
- CI: `npm run check` runs typecheck, unit tests on the tools, and TLC on every model, which must finish in under 5 minutes. A violation the model expects to find is marked `expected:` so CI stays green while the bug is still open.

## Types (core)
```ts
type MachineId = `${'school-pulse'|'draft-day'|'session-owner'|'post-queue'}/${string}`;
type Status = 'pass' | 'violation' | 'error';
interface Invariant { name: string; kind: 'safety'|'liveness'; text: string; holds: boolean }
interface TraceStep { state: Record<string, unknown>; action: string; sourceRef?: string }
interface MachineResult { id: MachineId; commit: string; states: number; invariants: Invariant[]; status: Status; trace?: TraceStep[]; chartSvg: string }
interface Bug { id: string; machine: MachineId; invariant: string; confirmed: boolean; failingTest?: string; draftPr?: string }
```

## Acceptance
- At least 4 machines are modeled, each with at least 2 invariants, and TLC runs green in CI.
- Every model has a SOURCE.md with code refs pinned to a commit.
- Every violation is either confirmed by a failing test in the target repo (draft PR only) or marked a model error with an explanation.
- The gallery has a demo.gif built from synthetic data at a public raw URL. It contains no kid names, PII, or account ids.
- The README has a 10-second quickstart and a link to poteto's pstack.

## Rules
Draft PRs only. Commit as BoydVC <BoydVC@users.noreply.github.com>. No merge or deploy without Boyd's words. Synthetic data only. Never touch KPD repos.
