import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

export interface TlcJar {
  version: string;
  url: string;
  sha256: string;
}

export function ensureJar(root: string, spec: TlcJar): string {
  const file = join(root, "tools", ".cache", `tla2tools-${spec.version}.jar`);
  mkdirSync(join(root, "tools", ".cache"), { recursive: true });
  if (existsGood(file, spec.sha256)) return file;
  const response = spawnSync("curl", ["-fsSL", "-o", file, spec.url], { encoding: "utf8" });
  if (response.status !== 0) {
    throw new Error(`could not download TLC ${spec.version}`);
  }
  if (!existsGood(file, spec.sha256)) {
    throw new Error(`TLC ${spec.version} checksum did not match`);
  }
  return file;
}

function existsGood(file: string, sha256: string): boolean {
  try {
    const hash = createHash("sha256").update(readFileSync(file)).digest("hex");
    return hash === sha256;
  } catch {
    return false;
  }
}

export function runTlc(jar: string, spec: string, configText: string): { status: number; output: string } {
  const dir = mkdtempSync(join(tmpdir(), "statechart-tlc-"));
  const moduleName = basename(spec, ".tla");
  const specCopy = join(dir, `${moduleName}.tla`);
  const configCopy = join(dir, `${moduleName}.cfg`);
  const meta = join(dir, "meta");
  mkdirSync(meta);
  copyFileSync(spec, specCopy);
  writeFileSync(configCopy, configText);
  try {
    const child = spawnSync(
      "java",
      ["-XX:+UseParallelGC", "-jar", jar, "-workers", "1", "-metadir", meta, "-config", configCopy, specCopy],
      { cwd: dir, encoding: "utf8", timeout: 60_000, maxBuffer: 8_000_000 },
    );
    return { status: child.status ?? 1, output: `${child.stdout ?? ""}\n${child.stderr ?? ""}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
