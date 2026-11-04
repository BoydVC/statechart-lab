import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runInstalledAppFlow } from "../src/auth/oauth.js";
import { startWatcher } from "../src/ingest/watch.js";
import { main } from "../src/main.js";
import { listAssignments, listChanges, openDatabase } from "../src/store/db.js";
import { repoRoot } from "../src/util/root.js";

test("sync does not send an access token whose expires_at is in the past", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sp-expired-"));
  mkdirSync(join(dir, "tokens"), { recursive: true });
  writeFileSync(
    join(dir, "tokens", "google-classroom.json"),
    JSON.stringify({
      access_token: "synthetic-access-token",
      refresh_token: "synthetic-refresh",
      expires_at: "2020-01-01T00:00:00.000Z",
    }),
  );
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (_input: string | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push(headers.get("authorization") ?? "");
    return Response.json({ courses: [] });
  }) as typeof fetch;
  delete process.env.SCHOOL_PULSE_CLASSROOM_TOKEN;
  delete process.env.SCHOOL_PULSE_GRAPH_TOKEN;
  try {
    await main(["sync", "--data", dir]);
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(calls.length, 0);
});

test("an earlier sign-in does not overwrite a token written by a later sign-in", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sp-clobber-"));
  const tokenPath = join(directory, "tokens", "google-classroom.json");
  let releaseA = (): void => {};
  const gate = new Promise<void>((resolve) => {
    releaseA = resolve;
  });
  let aFetching = false;
  const start = (label: string, fetchImpl: typeof fetch) =>
    runInstalledAppFlow({
      kind: "classroom",
      clientId: "desktop-client",
      tokenPath,
      tokenUrl: "http://127.0.0.1:9/unused",
      timeoutMs: 5000,
      fetchImpl,
      onAuthorizeUrl: (url) => {
        const parsed = new URL(url);
        const redirect = parsed.searchParams.get("redirect_uri");
        const state = parsed.searchParams.get("state");
        if (!redirect || !state) throw new Error("missing redirect");
        void fetch(`${redirect}?code=code-${label}&state=${state}`);
      },
    });
  const fetchA: typeof fetch = async () => {
    aFetching = true;
    await gate;
    return Response.json({
      access_token: "access-a",
      refresh_token: "refresh-a",
      expires_in: 3600,
      token_type: "Bearer",
    });
  };
  const fetchB: typeof fetch = async () =>
    Response.json({
      access_token: "access-b",
      refresh_token: "refresh-b",
      expires_in: 3600,
      token_type: "Bearer",
    });
  const pendingA = start("a", fetchA);
  const deadline = Date.now() + 3000;
  while (!aFetching && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(aFetching, true);
  const pendingB = start("b", fetchB);
  await pendingB;
  releaseA();
  await pendingA;
  const stored = JSON.parse(readFileSync(tokenPath, "utf8")) as { refresh_token: string };
  assert.equal(stored.refresh_token, "refresh-b");
});

test("a silent event stream schedules a reconnect", () => {
  const src = readFileSync(join(repoRoot(), "web/app.ts"), "utf8");
  const start = src.indexOf("function connect()");
  const end = src.indexOf("function toggleTheme()");
  const connectSrc = stripConnect(src.slice(start, end));
  assert.ok(start > 0 && end > start);
  const sockets: FakeSource[] = [];
  class FakeSource {
    url: string;
    onopen: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(url: string) {
      this.url = url;
      sockets.push(this);
    }
    addEventListener(): void {}
  }
  const pill = { state: "off" };
  const documentStub = {
    querySelector(selector: string) {
      if (selector === ".live-pill") {
        return { setAttribute: (_name: string, value: string) => { pill.state = value; } };
      }
      return null;
    },
  };
  const timers: number[] = [];
  const runner = new Function(
    "EventSource",
    "document",
    "setTimeout",
    `${connectSrc}; return connect;`,
  ) as (EventSource: typeof FakeSource, document: typeof documentStub, setTimeout: (fn: () => void, ms: number) => number) => () => void;
  const connect = runner(FakeSource, documentStub, (_fn, ms) => {
    timers.push(ms);
    return 0;
  });
  connect();
  sockets[0]?.onopen?.();
  assert.equal(pill.state, "on");
  assert.ok(timers.some((ms) => ms > 0 && ms < 60_000) || sockets.length > 1);
});

test("opening the stream refreshes before the pill is treated as caught up", () => {
  const src = readFileSync(join(repoRoot(), "web/app.ts"), "utf8");
  const start = src.indexOf("function connect()");
  const end = src.indexOf("function toggleTheme()");
  const connectSrc = stripConnect(src.slice(start, end)).replace(/\brefresh\(/g, "refreshSpy(");
  let refreshes = 0;
  const pill = { state: "off" };
  const holder: { current: { onopen: (() => void) | null } | null } = { current: null };
  class FakeSource {
    onopen: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(_url: string) {
      holder.current = this;
    }
    addEventListener(): void {}
  }
  const documentStub = {
    querySelector(selector: string) {
      if (selector === ".live-pill") {
        return { setAttribute: (_name: string, value: string) => { pill.state = value; } };
      }
      return null;
    },
  };
  const runner = new Function(
    "EventSource",
    "document",
    "refreshSpy",
    `${connectSrc}; return connect;`,
  ) as (
    EventSource: typeof FakeSource,
    document: typeof documentStub,
    refreshSpy: (pulse?: unknown) => void,
  ) => () => void;
  const connect = runner(FakeSource, documentStub, () => {
    refreshes += 1;
  });
  connect();
  holder.current?.onopen?.();
  assert.equal(pill.state, "on");
  assert.equal(refreshes, 1);
});

function stripConnect(source: string): string {
  return source
    .replace("function connect(): void", "function connect()")
    .replaceAll(" as MessageEvent", "")
    .replaceAll(" as Pulse", "");
}

function snapshot(sourceId: string): string {
  return JSON.stringify({
    students: [{ sourceId: "stu-a", name: "Student A" }],
    courses: [{ sourceId: "math", studentSourceId: "stu-a", name: "Math" }],
    assignments: [{ sourceId, studentSourceId: "stu-a", courseSourceId: "math", title: "Problem set", status: "assigned" }],
  });
}

test("a watcher retry keeps one row when the source id is stable", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sp-stable-"));
  const db = openDatabase(join(dir, "school-pulse.sqlite"));
  let threw = false;
  const watcher = startWatcher({
    dataDir: dir,
    db,
    onResult() {
      if (!threw) {
        threw = true;
        throw new Error("callback failed once");
      }
    },
  });
  try {
    writeFileSync(join(dir, "inbox", "generic", "stable.json"), snapshot("quiz-1"));
    const deadline = Date.now() + 4000;
    while (listAssignments(db).length === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert.equal(listAssignments(db).length, 1);
  } finally {
    watcher.close();
  }
});

test("a watcher retry of {{SP:NOW}} does not insert a second row or a second change", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sp-now-"));
  const db = openDatabase(join(dir, "school-pulse.sqlite"));
  let threw = false;
  const watcher = startWatcher({
    dataDir: dir,
    db,
    onResult() {
      if (!threw) {
        threw = true;
        throw new Error("callback failed once");
      }
    },
  });
  try {
    writeFileSync(join(dir, "inbox", "generic", "clock.json"), snapshot("{{SP:NOW}}"));
    const deadline = Date.now() + 4000;
    while (listChanges(db).length < 2 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    const rows = listAssignments(db).length;
    const changes = listChanges(db).length;
    assert.deepEqual({ rows, changes }, { rows: 1, changes: 1 });
  } finally {
    watcher.close();
  }
});
