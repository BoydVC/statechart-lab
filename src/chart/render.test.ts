import assert from "node:assert/strict";
import test from "node:test";
import { renderSvg, toMermaid } from "./render.ts";

const chart = {
  initial: "none",
  nodes: ["none", "fresh", "reauth"],
  edges: [
    { from: "none", to: "fresh", action: "Exchange" },
    { from: "fresh", to: "reauth", action: "Expire" },
  ],
};

test("mermaid lists the initial state and each action", () => {
  const text = toMermaid(chart);
  assert.match(text, /stateDiagram-v2/);
  assert.match(text, /\[\*\] --> none/);
  assert.match(text, /fresh --> reauth: Expire/);
});

test("the two themes draw the same states in different colors", () => {
  const blueprint = renderSvg(chart, "blueprint", "Expire");
  const field = renderSvg(chart, "field-guide", "Expire");
  assert.match(blueprint, /<svg/);
  assert.match(blueprint, />none</);
  assert.match(blueprint, />Expire</);
  assert.notEqual(blueprint.includes("#0e1c2f"), field.includes("#0e1c2f"));
  assert.match(field, /#f3efe2/);
});
