import type { ChartEdge, ChartFile, ChartNode, ThemeName } from "./types.ts";

export interface PlacedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlacedEdge {
  from: string;
  to: string;
  label: string;
  action?: string;
  tone: "danger" | "normal";
  d: string;
  lx: number;
  ly: number;
}

const NODE_W = 108;
const NODE_H = 40;

export function layout(chart: Pick<ChartFile, "nodes" | "edges">): {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  viewBox: string;
} {
  const nodes: PlacedNode[] = chart.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    x: node.x,
    y: node.y,
    w: NODE_W,
    h: NODE_H,
  }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: PlacedEdge[] = [];
  chart.edges.forEach((edge, index) => {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) return;
    const placed = placeEdge(from, to, edge, index);
    edges.push(placed);
  });
  return { nodes, edges, viewBox: "0 0 520 300" };
}

function placeEdge(from: PlacedNode, to: PlacedNode, edge: ChartEdge, index: number): PlacedEdge {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const start = borderPoint(from, ux, uy);
  const end = borderPoint(to, -ux, -uy);
  const bend = index % 2 === 0 ? 26 : -26;
  const mx = (start.x + end.x) / 2 + -uy * bend;
  const my = (start.y + end.y) / 2 + ux * bend;
  return {
    from: edge.from,
    to: edge.to,
    label: edge.label,
    action: edge.action,
    tone: edge.tone ?? "normal",
    d: `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
    lx: mx,
    ly: my,
  };
}

function borderPoint(node: PlacedNode, ux: number, uy: number): { x: number; y: number } {
  const hw = node.w / 2;
  const hh = node.h / 2;
  const sx = ux === 0 ? Infinity : hw / Math.abs(ux);
  const sy = uy === 0 ? Infinity : hh / Math.abs(uy);
  const scale = Math.min(sx, sy);
  return { x: node.x + ux * scale, y: node.y + uy * scale };
}

export function mermaid(chart: Pick<ChartFile, "nodes" | "edges">): string {
  const lines = ["stateDiagram-v2"];
  for (const node of chart.nodes) {
    lines.push(`  ${mid(node.id)}: ${node.label}`);
  }
  for (const edge of chart.edges) {
    lines.push(`  ${mid(edge.from)} --> ${mid(edge.to)}: ${edge.label}`);
  }
  return lines.join("\n");
}

function mid(id: string): string {
  return id.replace(/[^A-Za-z0-9]/g, "_");
}

const PALETTE: Record<ThemeName, { bg: string; ink: string; line: string; node: string; hot: string; danger: string; muted: string }> = {
  blueprint: {
    bg: "#0d2238",
    ink: "#e7f6ff",
    line: "#7fd3ff",
    node: "#12304d",
    hot: "#f0c14a",
    danger: "#ff5d73",
    muted: "#9fd4ea",
  },
  field: {
    bg: "#f7f1e4",
    ink: "#241c14",
    line: "#3d5a45",
    node: "#fffaf1",
    hot: "#c47b2b",
    danger: "#a33b32",
    muted: "#5c5146",
  },
};

export function chartSvg(
  chart: Pick<ChartFile, "nodes" | "edges">,
  theme: ThemeName,
  marks?: { hot?: string; past?: string[]; breakId?: string; walked?: Array<{ from: string; to: string }> },
): string {
  const { nodes, edges, viewBox } = layout(chart);
  const ink = PALETTE[theme];
  const past = new Set(marks?.past ?? []);
  const walked = new Set((marks?.walked ?? []).map((edge) => `${edge.from}>${edge.to}`));
  const edgeMarkup = edges
    .map((edge) => {
      const on = walked.has(`${edge.from}>${edge.to}`);
      const danger = edge.tone === "danger";
      const color = on ? ink.hot : danger ? ink.danger : ink.line;
      return `<path d="${edge.d}" fill="none" stroke="${color}" stroke-width="${on ? 2.6 : 1.4}" stroke-linecap="round" marker-end="url(#arrow-${theme})"/>`;
    })
    .join("");
  const labelMarkup = edges
    .map((edge) => {
      return `<text x="${edge.lx.toFixed(1)}" y="${(edge.ly - 6).toFixed(1)}" text-anchor="middle" font-size="10" font-family="ui-sans-serif, sans-serif" fill="${ink.muted}">${escapeXml(edge.label)}</text>`;
    })
    .join("");
  const nodeMarkup = nodes
    .map((node) => {
      const hot = marks?.hot === node.id;
      const broke = marks?.breakId === node.id;
      const fill = broke ? ink.danger : hot ? ink.hot : ink.node;
      const text = broke || hot ? (theme === "blueprint" ? "#102033" : "#fffaf1") : ink.ink;
      const stroke = past.has(node.id) ? ink.hot : ink.line;
      return `<g><rect x="${node.x - node.w / 2}" y="${node.y - node.h / 2}" rx="10" width="${node.w}" height="${node.h}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/><text x="${node.x}" y="${node.y + 4}" text-anchor="middle" font-size="12" font-family="ui-sans-serif, sans-serif" fill="${text}">${escapeXml(node.label)}</text></g>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img">
  <defs>
    <marker id="arrow-${theme}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="${ink.line}"/>
    </marker>
  </defs>
  <rect width="520" height="300" fill="${ink.bg}"/>
  ${edgeMarkup}
  ${labelMarkup}
  ${nodeMarkup}
</svg>`;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function nodeById(nodes: ChartNode[], id: string): ChartNode | undefined {
  return nodes.find((node) => node.id === id);
}
