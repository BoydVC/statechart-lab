import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseTlcOutput, type TlcOutcome } from "./parse-tlc.ts";

export const TLC_JAR = "vendor/tla2tools-1.8.0.jar";
export const TLC_SHA256 = "e20447644bfabd29d6bd0fc2c0eb1473fb301c1a0e4dfe1961938ce5a191edbf";

export function assertTlcJar(jarPath: string): void {
  const digest = createHash("sha256").update(readFileSync(jarPath)).digest("hex");
  if (digest !== TLC_SHA256) {
    throw new Error(`tla2tools checksum mismatch for ${jarPath}`);
  }
}

export function runTlc(options: { jar: string; modelDir: string; moduleFile: string; invariant: string }): TlcOutcome {
  const dir = mkdtempSync(path.join(tmpdir(), "tlc-"));
  const cfg = path.join(dir, "check.cfg");
  const meta = path.join(dir, "meta");
  writeFileSync(cfg, `SPECIFICATION Spec\nINVARIANT ${options.invariant}\n`);
  try {
    const stdout = execFileSync(
      "java",
      [
        "-XX:+UseParallelGC",
        "-jar",
        options.jar,
        "-workers",
        "1",
        "-nowarning",
        "-cleanup",
        "-noGenerateSpecTE",
        "-tool",
        "-metadir",
        meta,
        "-config",
        cfg,
        path.resolve(options.modelDir, options.moduleFile),
      ],
      { cwd: options.modelDir, encoding: "utf8", timeout: 60_000, maxBuffer: 8 * 1024 * 1024 },
    );
    return parseTlcOutput(stdout);
  } catch (error) {
    const stdout = stdoutOf(error);
    if (stdout.trim()) return parseTlcOutput(stdout);
    return { status: "error", message: error instanceof Error ? error.message : "TLC failed", states: 0 };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function stdoutOf(error: unknown): string {
  if (!error || typeof error !== "object" || !("stdout" in error)) return "";
  const stdout = (error as { stdout?: unknown }).stdout;
  if (typeof stdout === "string") return stdout;
  if (Buffer.isBuffer(stdout)) return stdout.toString("utf8");
  return "";
}
