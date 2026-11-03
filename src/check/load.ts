import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseCfg, parseCommit, parseMachineId } from "../domain/parse.ts";
import { ParseError, type InvariantKind } from "../domain/types.ts";
import { parseChart, type ChartIr } from "../chart/render.ts";
import type { CfgFile } from "../domain/parse.ts";

export interface ModelProse {
  readonly kind: InvariantKind;
  readonly text: string;
}

export interface LoadedModel {
  readonly dir: string;
  readonly moduleFile: string;
  readonly id: string;
  readonly commit: string;
  readonly cfg: CfgFile;
  readonly prose: Readonly<Record<string, ModelProse>>;
  readonly chart: ChartIr;
  readonly sourceLines: Readonly<Record<string, string>>;
}

export function loadModels(root: string): LoadedModel[] {
  const models = path.join(root, "models");
  const loaded: LoadedModel[] = [];
  for (const slug of readdirSync(models).sort()) {
    const dir = path.join(models, slug);
    const commit = parseCommit(readFileSync(path.join(dir, "COMMIT"), "utf8").trim());
    const sourceDoc = readFileSync(path.join(dir, "SOURCE.md"), "utf8");
    if (!sourceDoc.includes(commit)) {
      throw new ParseError(`${slug}/SOURCE.md does not name its commit`);
    }
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".tla") && !name.includes("_TTrace_")).sort()) {
      loaded.push(loadOne(dir, file, commit));
    }
  }
  return loaded;
}

function loadOne(dir: string, moduleFile: string, commit: string): LoadedModel {
  const base = moduleFile.replace(/\.tla$/, "");
  const cfg = parseCfg(readFileSync(path.join(dir, `${base}.cfg`), "utf8"));
  const meta = JSON.parse(readFileSync(path.join(dir, `${base}.meta.json`), "utf8")) as unknown;
  const id = parseMachineId(field(meta, "id"));
  const prose = proseMap(fieldObject(meta, "invariants"));
  const names = Object.keys(prose).sort();
  const cfgNames = [...cfg.invariants].sort();
  if (names.join() !== cfgNames.join()) {
    throw new ParseError(`${base} config and meta name different invariants`);
  }
  const chart = parseChart(JSON.parse(readFileSync(path.join(dir, `${base}.chart.json`), "utf8")));
  const sourceLines = sourceMap(JSON.parse(readFileSync(path.join(dir, `${base}.sources.json`), "utf8")));
  if (!sourceLines.Init) throw new ParseError(`${base} sources are missing Init`);
  for (const edge of chart.edges) {
    if (!sourceLines[edge.action]) throw new ParseError(`${base} has no source for ${edge.action}`);
  }
  if (!id.startsWith(`${path.basename(dir)}/`)) {
    throw new ParseError(`${id} is outside ${path.basename(dir)}`);
  }
  return { dir, moduleFile, id, commit, cfg, prose, chart, sourceLines };
}

function proseMap(input: Record<string, unknown>): Record<string, ModelProse> {
  const prose: Record<string, ModelProse> = {};
  for (const [name, value] of Object.entries(input)) {
    const row = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
    const kind = row?.kind;
    const text = row?.text;
    if ((kind !== "safety" && kind !== "liveness") || typeof text !== "string" || !text) {
      throw new ParseError(`bad prose for ${name}`);
    }
    prose[name] = { kind, text };
  }
  return prose;
}

function sourceMap(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ParseError("sources must be an object");
  const lines: Record<string, string> = {};
  for (const [action, value] of Object.entries(input)) {
    if (typeof value !== "string" || !/^[^:]+?:\d+$/.test(value)) {
      throw new ParseError(`source for ${action} must be file:line`);
    }
    lines[action] = value;
  }
  return lines;
}

function field(input: unknown, key: string): string {
  const row = fieldObject(input, key);
  const value = row[key];
  if (typeof value !== "string") throw new ParseError(`${key} must be a string`);
  return value;
}

function fieldObject(input: unknown, key: string): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ParseError("meta must be an object");
  const row = input as Record<string, unknown>;
  if (key === "invariants") {
    const value = row.invariants;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ParseError("meta.invariants must be an object");
    return value as Record<string, unknown>;
  }
  return row;
}
