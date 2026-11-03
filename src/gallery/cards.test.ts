import assert from "node:assert/strict";
import test from "node:test";
import { parseMachineResult } from "../domain/parse.ts";
import { toCard } from "./cards.ts";

const COMMIT = "3b76b08fad2780bf7a760ea65dae619d3a5f628b";

test("a violation card shows the broken invariant and hides nothing about the trace", () => {
  const card = toCard(
    parseMachineResult({
      id: "school-pulse/oauth",
      commit: COMMIT,
      states: 7,
      chartSvg: "<svg></svg>",
      status: "violation",
      invariants: [
        { name: "NoRefreshBeforeExchange", kind: "safety", text: "Absent until exchange.", holds: true },
        { name: "RefreshBeforeReauth", kind: "safety", text: "Refresh runs first.", holds: false },
      ],
      trace: [{ action: "Expire", state: { phase: "reauth" }, sourceRef: `src/auth/oauth.ts:111:${COMMIT}` }],
    }),
  );
  assert.equal(card.badge, "VIOLATION");
  assert.equal(card.trace[0]?.action, "Expire");
  assert.equal(card.trace[0]?.source, "src/auth/oauth.ts:111");
  assert.equal(card.invariants.find((item) => item.name === "RefreshBeforeReauth")?.holds, false);
});

test("a pass card has an empty trace", () => {
  const card = toCard(
    parseMachineResult({
      id: "session-owner/session",
      commit: "e9dc9170ac71e833d3c44f69c2c3c40c32e68af5",
      states: 15,
      chartSvg: "<svg></svg>",
      status: "pass",
      invariants: [
        { name: "SingleOwner", kind: "safety", text: "One owner.", holds: true },
        { name: "FreshBeforeSend", kind: "safety", text: "Send while fresh.", holds: true },
      ],
    }),
  );
  assert.equal(card.badge, "PASS");
  assert.deepEqual(card.trace, []);
  assert.equal(card.message, null);
});
