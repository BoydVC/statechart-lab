# Statechart Lab

TLC checks the state machines in Boyd's public projects, draws each chart, and keeps a phone gallery of the results.

## Quickstart

```bash
npm install
npm run check
npm run dev
```

Open http://127.0.0.1:4173 on a phone-width window. Blueprint and Field guide are the two chart themes. Replay walks a TLC counterexample across the chart. Share card downloads a PNG for an X post.

`npm run check` typechecks, runs the tool tests, and runs TLC on every model. A violation marked `expected:` in the config keeps the run green while that bug is still open.

The checker uses the vendored TLC jar from TLA+ 1.7.4. The sha256 pin is `vendor/tla2tools.sha256`.

Charts and posters use synthetic labels only.

## pstack

The check-before-review idea comes from [poteto's pstack](https://github.com/cursor/plugins/tree/main/harness/pstack).
