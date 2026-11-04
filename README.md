# Statechart Lab

TLA+ models of the stateful flows in Boyd's public projects, checked with TLC. The gallery shows each machine, its chart, and the trace when an invariant fails.

The checks follow [pstack](https://github.com/cursor/plugins/blob/main/pstack/README.md). Read a result with `/statechart`.

## Quickstart

```
npm install
npm run check
python3 -m http.server 4173 -d web
```

Open http://127.0.0.1:4173. `npm run check` needs Java 11 or newer. TLC is 1.7.4, downloaded on first run and checked against the checksum in `models/registry.json`.

## What you are looking at

Seven machines. A violation marked expected stays red in the gallery and keeps CI green until the product code changes. `bugs/*.md` has the trace, the file and line, and a failing test that was run locally. This repo does not push to those projects.

Synthetic labels only. No student names, no account ids.
