import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

export type ThemeName = "blueprint" | "field";

const require = createRequire(fileURLToPath(import.meta.url));

const BLUEPRINT = `
.pele { --pele-bg:#f3f6fb; --pele-fg:#16324f; --pele-muted:#5c6b7a; --pele-line:#7f93a8; --pele-surface:#f7f9fc; --pele-surface-alt:#e7eef6; --pele-border:#c5d2e0; }
.pele .blue rect { fill:#d5e4f7; } .pele .orange rect { fill:#f3ddc8; } .pele .purple rect { fill:#e4d9f7; }
.pele .yellow rect { fill:#f3e6c4; } .pele .teal rect { fill:#d3ebe4; } .pele .tan rect { fill:#efe4d4; } .pele .pink rect { fill:#f8d5e4; }
.pele .breaks rect { fill:#ffecee !important; stroke:#e72e3b !important; stroke-width:2.5px !important; }
.pele .breaks text { fill:#cd2834 !important; }
.pele .bugPath rect { stroke:#1680f3 !important; stroke-width:2.5px !important; }
`;

const FIELD = `
.pele { --pele-bg:#f6f3ea; --pele-fg:#243024; --pele-muted:#5e6556; --pele-line:#8a8474; --pele-surface:#fbf8f1; --pele-surface-alt:#efe8d8; --pele-border:#d5ccb8; }
.pele .blue rect { fill:#d5e2d4; } .pele .orange rect { fill:#f0d7bf; } .pele .purple rect { fill:#e3dcc8; }
.pele .yellow rect { fill:#efe3b8; } .pele .teal rect { fill:#cfe3c8; } .pele .tan rect { fill:#eadfc8; } .pele .pink rect { fill:#f0d0c4; }
.pele .breaks rect { fill:#fde8df !important; stroke:#9a3412 !important; stroke-width:2.5px !important; }
.pele .breaks text { fill:#9a3412 !important; }
.pele .bugPath rect { stroke:#3f6b45 !important; stroke-width:2.5px !important; }
`;

export function mermaidBody(source: string): string {
  return source.replace(/^---[\s\S]*?---\s*/, "");
}

export async function renderChart(source: string, theme: ThemeName): Promise<string> {
  const pelePath = require.resolve("pele");
  const mod = (await import(pathToFileURL(pelePath).href)) as {
    render: (text: string, options?: { limit: number; outputLimit: number; maxEdges: number }) => { svg: string };
  };
  const { svg } = mod.render(mermaidBody(source), {
    limit: 1_000_000,
    outputLimit: 8_000_000,
    maxEdges: 10_000,
  });
  const css = theme === "blueprint" ? BLUEPRINT : FIELD;
  return svg
    .replace(/(<svg\b)/, `$1 data-theme="${theme}"`)
    .replace(/(<svg\b[^>]*>)/, `$1<style>${css}</style>`);
}
