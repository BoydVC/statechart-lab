# Statechart Lab

TLA+ models of the stateful flows in Boyd's public projects, checked with TLC. Open the gallery to see each machine, its chart, and a replay when an invariant fails.

The checks follow [pstack](https://github.com/cursor/plugins/blob/main/pstack/README.md).

## Quickstart

```
npm install
npm run check
npm run dev
```

Open http://127.0.0.1:4173. `npm run check` needs Java 11 or newer. TLC is 1.7.4, downloaded on first run and checked against the checksum in `models/registry.json`.

The phone layout is the Lab tab at 375px. Storybook is the other tab. Blueprint and Field guide switch the chart colors.

## What you are looking at

Fourteen machines. A violation marked expected stays red in the gallery and keeps the check green while the product bug is open. `bugs/*.md` names the failing test that reproduced it. Those tests ran against local checkouts of the pinned commits. This repo does not push to those projects.

Synthetic labels only. No student names and no account ids.
