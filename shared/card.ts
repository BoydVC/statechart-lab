import { escapeXml } from "./chart.ts";
import type { ThemeName, TraceStep } from "./types.ts";

export interface CardInput {
  theme: ThemeName;
  title: string;
  machine: string;
  invariant: string;
  steps: TraceStep[];
}

export function shareCardSvg(input: CardInput): string {
  const field = input.theme === "field";
  const bg = field ? "#f4ecdc" : "#071422";
  const ink = field ? "#241c14" : "#e7f6ff";
  const muted = field ? "#5e5146" : "#9fd4ea";
  const line = field ? "#c9b89a" : "#1d4e73";
  const hot = field ? "#9c341f" : "#ff5d73";
  const chip = field ? "#fffaf1" : "#12304d";
  const steps = input.steps.slice(0, 4);
  const stepMarkup = steps
    .map((step, index) => {
      const x = 72 + index * 270;
      const name = step.label || step.action;
      return `<g>
        <circle cx="${x}" cy="420" r="16" fill="${index === steps.length - 1 ? hot : chip}" stroke="${line}"/>
        <text x="${x}" y="425" text-anchor="middle" font-size="14" font-family="Georgia, serif" fill="${index === steps.length - 1 ? "#fffaf1" : ink}">${index + 1}</text>
        <text x="${x + 28}" y="416" font-size="20" font-family="Georgia, serif" fill="${ink}">${escapeXml(step.chartState)}</text>
        <text x="${x + 28}" y="442" font-size="15" font-family="ui-sans-serif, sans-serif" fill="${muted}">${escapeXml(trim(name, 28))}</text>
      </g>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <rect width="1200" height="675" fill="${bg}"/>
  <rect x="40" y="40" width="1120" height="595" fill="none" stroke="${line}" stroke-width="2"/>
  <text x="72" y="108" font-size="18" letter-spacing="3" font-family="ui-sans-serif, sans-serif" fill="${muted}">STATECHART LAB</text>
  <text x="72" y="188" font-size="54" font-family="Georgia, serif" fill="${ink}">${escapeXml(trim(input.title, 32))}</text>
  <text x="72" y="248" font-size="24" font-family="Georgia, serif" fill="${ink}">${escapeXml(trim(input.invariant, 78))}</text>
  <rect x="72" y="292" width="168" height="40" rx="20" fill="${hot}"/>
  <text x="156" y="318" text-anchor="middle" font-size="16" font-family="ui-sans-serif, sans-serif" fill="#fffaf1">VIOLATION</text>
  ${stepMarkup}
  <text x="72" y="590" font-size="16" font-family="ui-monospace, monospace" fill="${muted}">${escapeXml(input.machine)}  ·  synthetic  ·  public code  ·  draft only</text>
</svg>`;
}

function trim(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
