import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/source-serif-4/400.css";
import "./style.css";
import { shareCardSvg } from "../../shared/card.ts";
import { layout } from "../../shared/chart.ts";
import type { LabFile, MachineResult, ThemeName } from "../../shared/types.ts";
import { posterArt } from "./posters.ts";

interface Beat {
  chartState: string;
  label: string;
  action: string;
  sourceRef?: string;
  state: Record<string, unknown>;
}

const app = document.querySelector<HTMLElement>("#app")!;
const summary = document.querySelector<HTMLElement>("#summary")!;
const dock = document.querySelector<HTMLElement>("#dock")!;
const dockKicker = document.querySelector<HTMLElement>("#dock-kicker")!;
const dockCaption = document.querySelector<HTMLElement>("#dock-caption")!;
const scrub = document.querySelector<HTMLInputElement>("#scrub")!;
const sheet = document.querySelector<HTMLElement>("#sheet")!;
const cardPreview = document.querySelector<HTMLImageElement>("#card-preview")!;
const cardDownload = document.querySelector<HTMLAnchorElement>("#card-download")!;

let lab: LabFile | null = null;
let theme: ThemeName = "blueprint";
let tab: "lab" | "story" = "lab";
let replayId = "";
let mode: "trace" | "story" = "trace";
let step = 0;
let timer = 0;

boot().catch((error: unknown) => {
  summary.textContent = error instanceof Error ? error.message : "The lab file did not load.";
});

async function boot(): Promise<void> {
  const response = await fetch("/lab.json");
  lab = (await response.json()) as LabFile;
  const params = new URLSearchParams(location.search);
  const stored = localStorage.getItem("lab-theme");
  theme = params.get("theme") === "field" || stored === "field" ? "field" : "blueprint";
  tab = params.get("tab") === "story" ? "story" : "lab";
  replayId = params.get("replay") ?? "";
  mode = params.get("mode") === "story" ? "story" : "trace";
  step = Math.max(0, Number(params.get("step") ?? "0") || 0);
  document.body.dataset.theme = theme;
  render();
  if (params.get("card")) await openCard(params.get("card") ?? "");
  if (params.get("autoplay") === "1" && replayId) play();
}

function machines(): MachineResult[] {
  return lab?.machines ?? [];
}

function render(): void {
  paintSwitches();
  const list = machines();
  const violations = list.filter((machine) => machine.group === "lab" && machine.status === "violation");
  summary.textContent =
    tab === "lab"
      ? `${violations.length} violations in the public flows. TLC ${lab?.tlaVersion ?? ""}.`
      : "Five posters. Each chart was checked with TLC.";
  if (tab === "story") {
    const posters = list.filter((machine) => machine.poster).sort((a, b) => a.order - b.order);
    app.innerHTML = `<div class="stack">${posters.map((machine) => posterHtml(machine)).join("")}</div>`;
  } else {
    const cards = list
      .filter((machine) => machine.group === "lab")
      .sort((a, b) => a.order - b.order);
    app.innerHTML = `<div class="stack lab-grid">${cards.map((machine) => cardHtml(machine)).join("")}</div>`;
  }
  bind();
  applyReplay();
}

function cardHtml(machine: MachineResult): string {
  const chip =
    machine.status === "violation"
      ? `<span class="chip bad"><span class="dot"></span>Violation</span>`
      : machine.status === "error"
        ? `<span class="chip bad"><span class="dot"></span>Error</span>`
        : `<span class="chip ok"><span class="dot"></span>Pass</span>`;
  const primary = machine.trace?.length
    ? `<button type="button" class="primary" data-replay="${esc(machine.id)}" data-mode="trace">Replay the trace</button>`
    : `<button type="button" class="primary" data-replay="${esc(machine.id)}" data-mode="story">Walk the chart</button>`;
  const share = machine.bugId ? `<button type="button" data-share="${esc(machine.bugId)}">Share card</button>` : "";
  return `<article class="card" id="${esc(domId(machine.id))}" data-machine="${esc(machine.id)}">
    <div class="card-top">
      <div>
        <p class="machine">${esc(machine.id)}</p>
        <h2>${esc(machine.title)}</h2>
      </div>
      ${chip}
    </div>
    <p class="meta">${esc(machine.blurb)} ${machine.states} states.</p>
    ${chartHtml(machine)}
    <ul class="invariants">${machine.invariants
      .map(
        (item) =>
          `<li><span class="chip ${item.holds ? "ok" : "bad"}">${item.holds ? "Holds" : "Fails"}</span><span>${esc(item.text)}</span></li>`,
      )
      .join("")}</ul>
    <div class="card-actions">${primary}${share}</div>
  </article>`;
}

function posterHtml(machine: MachineResult): string {
  const poster = machine.poster!;
  const chip =
    machine.status === "pass"
      ? `<span class="chip ok"><span class="dot"></span>Pass</span>`
      : `<span class="chip bad"><span class="dot"></span>Violation</span>`;
  return `<article class="poster" id="${esc(domId(machine.id))}" data-machine="${esc(machine.id)}">
    ${posterArt(poster.scene)}
    <div class="copy">
      <div class="poster-top">
        <div>
          <p class="machine">${esc(poster.kicker)}</p>
          <h2>${esc(poster.title)}</h2>
        </div>
        ${chip}
      </div>
      <p class="meta">${esc(poster.caption)}</p>
      ${chartHtml(machine)}
      <p class="seal">TLC checked ${machine.states} states</p>
      <div class="card-actions">
        <button type="button" class="primary" data-replay="${esc(machine.id)}" data-mode="story">Play</button>
      </div>
    </div>
  </article>`;
}

function chartHtml(machine: MachineResult): string {
  const placed = layout(machine.chart);
  const marker = `arrow-${domId(machine.id)}`;
  const edges = placed.edges
    .map(
      (edge) =>
        `<path class="edge${edge.tone === "danger" ? " danger" : ""}" data-from="${esc(edge.from)}" data-to="${esc(edge.to)}" d="${edge.d}" marker-end="url(#${marker})"/>`,
    )
    .join("");
  const nodes = placed.nodes
    .map(
      (node) =>
        `<g class="node" data-state="${esc(node.id)}"><rect x="${node.x - node.w / 2}" y="${node.y - node.h / 2}" width="${node.w}" height="${node.h}" rx="10"/><text x="${node.x}" y="${node.y + 4}" text-anchor="middle">${esc(node.label)}</text></g>`,
    )
    .join("");
  return `<svg class="chart" viewBox="${placed.viewBox}" role="img" aria-label="${esc(machine.title)} chart">
    <defs><marker id="${marker}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/></marker></defs>
    ${edges}${nodes}
    <circle class="token" r="5" cx="0" cy="0" hidden></circle>
  </svg>`;
}

function bind(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
    button.onclick = () => {
      tab = button.dataset.tab === "story" ? "story" : "lab";
      replayId = "";
      stop();
      sheet.hidden = true;
      writeUrl();
      render();
    };
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-theme-set]")) {
    button.onclick = () => {
      theme = button.dataset.themeSet === "field" ? "field" : "blueprint";
      localStorage.setItem("lab-theme", theme);
      document.body.dataset.theme = theme;
      writeUrl();
      render();
    };
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-replay]")) {
    button.onclick = () => {
      replayId = button.dataset.replay ?? "";
      mode = button.dataset.mode === "story" ? "story" : "trace";
      step = 0;
      writeUrl();
      applyReplay();
    };
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-share]")) {
    button.onclick = () => {
      void openCard(button.dataset.share ?? "");
    };
  }
}

function paintSwitches(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
    button.setAttribute("aria-selected", String(button.dataset.tab === tab));
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-theme-set]")) {
    button.setAttribute("aria-pressed", String(button.dataset.themeSet === theme));
  }
}

function applyReplay(): void {
  const machine = machines().find((item) => item.id === replayId);
  document.body.classList.toggle("dock-open", Boolean(machine));
  dock.hidden = !machine;
  for (const card of document.querySelectorAll<HTMLElement>("[data-machine]")) {
    card.classList.toggle("is-active", card.dataset.machine === replayId);
  }
  clearMarks();
  if (!machine) return;
  const beatList = beats(machine);
  if (beatList.length === 0) return;
  step = Math.min(step, beatList.length - 1);
  scrub.max = String(beatList.length - 1);
  scrub.value = String(step);
  scrub.oninput = () => {
    step = Number(scrub.value);
    writeUrl();
    paintBeats(machine, beatList);
  };
  paintBeats(machine, beatList);
  document.getElementById(domId(machine.id))?.scrollIntoView({ block: "nearest" });
}

function paintBeats(machine: MachineResult, beatList: Beat[]): void {
  clearMarks();
  const root = document.querySelector<HTMLElement>(`[data-machine="${cssEscape(machine.id)}"]`);
  const current = beatList[step];
  if (!root || !current) return;
  const past = new Set(beatList.slice(0, step).map((beat) => beat.chartState));
  for (const node of root.querySelectorAll<SVGGElement>(".node")) {
    const id = node.dataset.state ?? "";
    node.classList.toggle("is-past", past.has(id) && id !== current.chartState);
    node.classList.toggle("is-hot", id === current.chartState && !(mode === "trace" && machine.status === "violation" && step === beatList.length - 1));
    node.classList.toggle("is-break", id === current.chartState && mode === "trace" && machine.status === "violation" && step === beatList.length - 1);
  }
  for (let index = 1; index <= step; index += 1) {
    const from = beatList[index - 1]?.chartState;
    const to = beatList[index]?.chartState;
    const edge = root.querySelector<SVGPathElement>(`.edge[data-from="${cssEscape(from ?? "")}"][data-to="${cssEscape(to ?? "")}"]`);
    edge?.classList.add("is-walked");
  }
  const placed = layout(machine.chart);
  const node = placed.nodes.find((item) => item.id === current.chartState);
  const token = root.querySelector<SVGCircleElement>(".token");
  if (token && node) {
    token.toggleAttribute("hidden", false);
    token.setAttribute("cx", String(node.x));
    token.setAttribute("cy", String(node.y - 28));
  }
  const failing = machine.invariants.find((item) => !item.holds);
  dockKicker.textContent = failing && mode === "trace" ? failing.text : machine.title;
  const ref = current.sourceRef ? ` ${current.sourceRef}` : "";
  dockCaption.textContent = `${step + 1} of ${beatList.length}. ${current.label}${ref}`;
  const share = dock.querySelector<HTMLButtonElement>("[data-act='share']");
  if (share) share.hidden = !machine.bugId;
}

function clearMarks(): void {
  for (const node of document.querySelectorAll(".node")) node.classList.remove("is-hot", "is-past", "is-break");
  for (const edge of document.querySelectorAll(".edge")) edge.classList.remove("is-walked");
  for (const token of document.querySelectorAll<SVGCircleElement>(".token")) token.toggleAttribute("hidden", true);
}

function beats(machine: MachineResult): Beat[] {
  if (mode === "trace" && machine.trace && machine.trace.length > 0) {
    return machine.trace.map((item) => ({
      chartState: item.chartState,
      label: item.label,
      action: item.action,
      sourceRef: item.sourceRef,
      state: item.state,
    }));
  }
  return machine.story.map((item) => ({
    chartState: item.phase,
    label: item.label,
    action: "Story",
    state: { phase: item.phase },
  }));
}

dock.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-act]");
  if (!button) return;
  const machine = machines().find((item) => item.id === replayId);
  if (!machine && button.dataset.act !== "share") return;
  const beatList = machine ? beats(machine) : [];
  if (button.dataset.act === "restart") step = 0;
  if (button.dataset.act === "prev") step = Math.max(0, step - 1);
  if (button.dataset.act === "next") step = Math.min(beatList.length - 1, step + 1);
  if (button.dataset.act === "play") {
    if (timer) stop();
    else play();
    return;
  }
  if (button.dataset.act === "share" && machine?.bugId) {
    void openCard(machine.bugId);
    return;
  }
  stop();
  writeUrl();
  if (machine) paintBeats(machine, beatList);
});

function play(): void {
  stop();
  const playButton = dock.querySelector<HTMLButtonElement>("[data-act='play']");
  if (playButton) playButton.textContent = "Pause";
  timer = window.setInterval(() => {
    const machine = machines().find((item) => item.id === replayId);
    if (!machine) return stop();
    const beatList = beats(machine);
    if (step >= beatList.length - 1) return stop();
    step += 1;
    writeUrl();
    paintBeats(machine, beatList);
  }, 900);
}

function stop(): void {
  window.clearInterval(timer);
  timer = 0;
  const playButton = dock.querySelector<HTMLButtonElement>("[data-act='play']");
  if (playButton) playButton.textContent = "Play";
}

async function openCard(bugId: string): Promise<void> {
  const machine = machines().find((item) => item.bugId === bugId);
  const failing = machine?.invariants.find((item) => !item.holds);
  if (!machine || !machine.trace || !failing) return;
  const svg = shareCardSvg({
    theme,
    title: machine.title,
    machine: machine.id,
    invariant: failing.text,
    steps: machine.trace.map((step) => ({
      ...step,
      chartState: machine.chart.nodes.find((node) => node.id === step.chartState)?.label ?? step.chartState,
    })),
  });
  const url = await svgToPng(svg);
  cardPreview.src = url;
  cardDownload.href = url;
  cardDownload.download = `${bugId}.png`;
  sheet.hidden = false;
}

sheet.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-act='close-sheet']");
  if (button || event.target === sheet) sheet.hidden = true;
});

function svgToPng(svg: string): Promise<string> {
  return new Promise((resolveUrl, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 675;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("canvas"));
        return;
      }
      context.drawImage(image, 0, 0, 1200, 675);
      URL.revokeObjectURL(objectUrl);
      resolveUrl(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("card image"));
    image.src = objectUrl;
  });
}

function writeUrl(): void {
  const params = new URLSearchParams();
  if (theme === "field") params.set("theme", "field");
  if (tab === "story") params.set("tab", "story");
  if (replayId) {
    params.set("replay", replayId);
    params.set("step", String(step));
    if (mode === "story") params.set("mode", "story");
  }
  const query = params.toString();
  history.replaceState(null, "", query ? `?${query}` : location.pathname);
}

function domId(id: string): string {
  return `m-${id.replace(/[^a-z0-9]+/gi, "-")}`;
}

function cssEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

declare global {
  interface Window {
    __labReady?: boolean;
  }
}

window.__labReady = false;
const ready = new MutationObserver(() => {
  window.__labReady = Boolean(lab);
});
ready.observe(app, { childList: true });
