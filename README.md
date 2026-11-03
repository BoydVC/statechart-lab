# Statechart Lab

Run the checker, then open the gallery.

## Quickstart

Install Node 22 and Java 21. Then:

```sh
npm install
npm run check
npm run gallery
```

`npm run check` typechecks, runs the tool tests, and runs TLC on every model. Open the URL the gallery prints. You should see one card per machine, with its chart, its invariants, and PASS or VIOLATION.

An invariant marked `expected:` in the model config may fail while the command stays green. Any other failure exits non-zero.

Cards use synthetic labels only. Notes on the pinned lines live in `models/<target>/SOURCE.md`.

[pstack](https://github.com/cursor/plugins/tree/main/pstack) is the workflow this lab follows.
