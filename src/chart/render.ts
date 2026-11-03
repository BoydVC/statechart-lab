export interface ChartEdge {
  readonly from: string;
  readonly to: string;
  readonly action: string;
}

export interface ChartIr {
  readonly initial: string;
  readonly nodes: readonly string[];
  readonly edges: readonly ChartEdge[];
}

export type ChartTheme = "blueprint" | "field-guide";

interface Palette {
  readonly bg: string;
  readonly node: string;
  readonly stroke: string;
  readonly text: string;
  readonly muted: string;
  readonly accent: string;
}

const PALETTE: Record<ChartTheme, Palette> = {
  blueprint: {
    bg: "#0e1c2f",
    node: "#16324f",
    stroke: "#8ecae6",
    text: "#e8f1f8",
    muted: "#9bb8c9",
    accent: "#e85d4c",
  },
  "field-guide": {
    bg: "#f3efe2",
    node: "#fffdf6",
    stroke: "#3f4f32",
    text: "#1d2416",
    muted: "#5c6b4e",
    accent: "#b7412c",
  },
};

export function parseChart(input: unknown): ChartIr {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("chart must be an object");
  const row = input as Record<string, unknown>;
  if (typeof row.initial !== "string" || !Array.isArray(row.nodes) || !Array.isArray(row.edges)) {
    throw new Error("chart needs initial, nodes, and edges");
  }
  const nodes = row.nodes.filter((node): node is string => typeof node === "string");
  const edges: ChartEdge[] = [];
  for (const edge of row.edges) {
    if (!edge || typeof edge !== "object") throw new Error("chart edge must be an object");
    const item = edge as Record<string, unknown>;
    if (typeof item.from !== "string" || typeof item.to !== "string" || typeof item.action !== "string") {
      throw new Error("chart edge needs from, to, and action");
    }
    edges.push({ from: item.from, to: item.to, action: item.action });
  }
  return { initial: row.initial, nodes, edges };
}

export function toMermaid(chart: ChartIr): string {
  const lines = ["stateDiagram-v2", `  [*] --> ${chart.initial}`];
  for (const edge of chart.edges) lines.push(`  ${edge.from} --> ${edge.to}: ${edge.action}`);
  return lines.join("\n");
}

export function renderSvg(chart: ChartIr, theme: ChartTheme, highlight?: string): string {
  const palette = PALETTE[theme];
  const marker = `arrow-${chart.nodes.join("-").replace(/[^a-zA-Z0-9-]/g, "")}`;
  const index = new Map(chart.nodes.map((node, place) => [node, place]));
  const width = 360;
  const row = 68;
  const height = 24 + chart.nodes.length * row;
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img">`,
    `<rect width="${width}" height="${height}" fill="${palette.bg}"/>`,
  );
  for (const edge of chart.edges) {
    const from = index.get(edge.from);
    const to = index.get(edge.to);
    if (from === undefined || to === undefined) continue;
    const hot = edge.action === highlight;
    const color = hot ? palette.accent : palette.stroke;
    const x1 = 100;
    const y1 = 40 + from * row;
    const x2 = 100;
    const y2 = 16 + to * row;
    if (to === from + 1) {
      parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${hot ? 2.5 : 1.4}" marker-end="url(#${marker})"/>`);
      parts.push(`<text x="168" y="${(y1 + y2) / 2 + 4}" fill="${hot ? palette.accent : palette.muted}" font-size="11">${escapeXml(edge.action)}</text>`);
    } else {
      const lane = 300 - Math.min(40, Math.abs(to - from) * 8);
      const mid = (y1 + y2) / 2;
      parts.push(
        `<path d="M ${x1 + 70} ${y1 - 12} C ${lane} ${y1 - 12}, ${lane} ${y2 + 12}, ${x2 + 70} ${y2 + 12}" fill="none" stroke="${color}" stroke-width="${hot ? 2.5 : 1.4}"/>`,
      );
      parts.push(`<text x="${lane - 8}" y="${mid}" fill="${hot ? palette.accent : palette.muted}" font-size="11">${escapeXml(edge.action)}</text>`);
    }
  }
  chart.nodes.forEach((node, place) => {
    const y = 16 + place * row;
    const initial = node === chart.initial;
    parts.push(
      `<rect x="24" y="${y}" width="152" height="36" rx="6" fill="${palette.node}" stroke="${initial ? palette.accent : palette.stroke}" stroke-width="${initial ? 2 : 1.2}"/>`,
      `<text x="100" y="${y + 23}" text-anchor="middle" fill="${palette.text}" font-size="13" font-family="ui-sans-serif, sans-serif">${escapeXml(node)}</text>`,
    );
  });
  parts.splice(
    2,
    0,
    `<defs><marker id="${marker}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="${palette.stroke}"/></marker></defs>`,
  );
  parts.push("</svg>");
  return parts.join("");
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}
