import { parseBugList, parseMachineResult } from "../../src/domain/parse.ts";
import { parseChart, renderSvg, type ChartTheme } from "../../src/chart/render.ts";
import { toCard, type CardView } from "../../src/gallery/cards.ts";
import type { Bug } from "../../src/domain/types.ts";

const themeButton = document.querySelector<HTMLButtonElement>("#theme");
const cards = document.querySelector<HTMLElement>("#cards");

function themeFromStorage(): ChartTheme {
  const params = new URLSearchParams(location.search);
  const query = params.get("theme");
  if (query === "field-guide" || query === "blueprint") return query;
  return localStorage.getItem("statechart-lab-theme") === "field-guide" ? "field-guide" : "blueprint";
}

let theme: ChartTheme = themeFromStorage();

function applyTheme(next: ChartTheme): void {
  theme = next;
  document.documentElement.dataset.theme = next === "field-guide" ? "field-guide" : "blueprint";
  if (themeButton) {
    themeButton.textContent = next === "field-guide" ? "Blueprint" : "Field guide";
    themeButton.setAttribute("aria-pressed", String(next === "field-guide"));
  }
  localStorage.setItem("statechart-lab-theme", next);
}

applyTheme(theme);
themeButton?.addEventListener("click", () => {
  applyTheme(theme === "blueprint" ? "field-guide" : "blueprint");
  redrawCharts();
});

async function load(): Promise<void> {
  if (!cards) return;
  const catalog = (await fetch("/catalog.json").then((response) => response.json())) as unknown;
  if (!Array.isArray(catalog)) {
    cards.textContent = "Run npm run check to generate the gallery.";
    return;
  }
  const bugs = await loadBugs();
  const views: CardView[] = [];
  for (const file of catalog) {
    if (typeof file !== "string") continue;
    const raw = (await fetch(`/results/${file}`).then((response) => response.json())) as unknown;
    try {
      views.push(toCard(parseMachineResult(raw)));
    } catch (error) {
      cards.append(note(error instanceof Error ? error.message : "Could not read a result"));
    }
  }
  for (const view of views) cards.append(await renderCard(view, bugs));
  if (new URLSearchParams(location.search).get("demo") === "1") startDemo();
}

async function loadBugs(): Promise<Bug[]> {
  try {
    const raw = (await fetch("/bugs/index.json").then((response) => response.json())) as unknown;
    return parseBugList(raw);
  } catch {
    return [];
  }
}

async function renderCard(view: CardView, bugs: readonly Bug[]): Promise<HTMLElement> {
  const article = document.createElement("article");
  if (view.badge === "VIOLATION") article.classList.add("violation");
  const top = document.createElement("div");
  top.className = "top";
  const title = document.createElement("h2");
  title.textContent = view.id;
  const badge = document.createElement("span");
  badge.className = `badge ${view.badge.toLowerCase()}`;
  badge.textContent = view.badge;
  top.append(title, badge);
  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = `${view.states} states, ${view.commit}`;
  const chart = document.createElement("div");
  chart.className = "chart";
  chart.innerHTML = await chartSvg(view);
  article.append(top, meta, chart, invariantList(view));
  if (view.message) {
    const message = document.createElement("p");
    message.textContent = view.message;
    article.append(message);
  }
  if (view.trace.length) article.append(traceList(view));
  for (const bug of bugs) {
    if (bug.machine !== view.id || bug.confirmed) continue;
    const broken = view.invariants.some((item) => item.name === bug.invariant && !item.holds);
    if (!broken) continue;
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = `Unconfirmed. ${bug.explanation}`;
    const sketch = document.createElement("pre");
    sketch.textContent = bug.failingTest ?? "";
    article.append(note, sketch);
  }
  return article;
}

async function chartSvg(view: CardView): Promise<string> {
  const file = `${view.id.replace("/", "--")}.json`;
  try {
    const raw = (await fetch(`/charts/${file}`).then((response) => response.json())) as unknown;
    const highlight = view.trace.at(-1)?.action;
    return renderSvg(parseChart(raw), theme, highlight);
  } catch {
    return view.chartSvg.startsWith("<svg") && !/<script/i.test(view.chartSvg) ? view.chartSvg : "";
  }
}

function invariantList(view: CardView): HTMLElement {
  const holding = document.createElement("ul");
  holding.className = "holds";
  const broken = document.createElement("ul");
  broken.className = "broke";
  for (const item of view.invariants) {
    const li = document.createElement("li");
    li.textContent = `${item.name}. ${item.text}`;
    (item.holds ? holding : broken).append(li);
  }
  const wrap = document.createElement("div");
  if (broken.childElementCount) wrap.append(broken);
  if (holding.childElementCount) wrap.append(holding);
  return wrap;
}

function traceList(view: CardView): HTMLElement {
  const list = document.createElement("ol");
  list.className = "trace";
  for (const step of view.trace) {
    const li = document.createElement("li");
    const action = document.createElement("strong");
    action.textContent = step.action;
    const detail = document.createElement("span");
    detail.textContent = ` ${step.state}  ${step.source}`;
    li.append(action, detail);
    list.append(li);
  }
  return list;
}

function note(text: string): HTMLElement {
  const p = document.createElement("p");
  p.textContent = text;
  return p;
}

function redrawCharts(): void {
  for (const chart of document.querySelectorAll<HTMLElement>(".chart")) {
    const article = chart.closest("article");
    const title = article?.querySelector("h2")?.textContent;
    if (!title) continue;
    const file = `${title.replace("/", "--")}.json`;
    void fetch(`/charts/${file}`)
      .then((response) => response.json())
      .then((raw) => {
        const action = article?.querySelector(".trace li:last-child strong")?.textContent ?? undefined;
        chart.innerHTML = renderSvg(parseChart(raw), theme, action ?? undefined);
      })
      .catch(() => undefined);
  }
}

function startDemo(): void {
  window.setInterval(() => {
    applyTheme(theme === "blueprint" ? "field-guide" : "blueprint");
    document.querySelector("article.violation")?.scrollIntoView({ block: "center" });
    redrawCharts();
  }, 1600);
}

void load();
