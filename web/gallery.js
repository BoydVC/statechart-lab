const lab = window.LAB;
const cards = document.querySelector("#cards");
const tally = document.querySelector("#tally");
const requested = new URLSearchParams(location.search).get("theme");
let theme = requested === "field" ? "field" : "blueprint";

function statusWord(status) {
  if (status === "pass") return "PASS";
  if (status === "violation") return "VIOLATION";
  return "ERROR";
}

function chartSrc(machine) {
  return theme === "field" ? machine.chartField : machine.chartSvg;
}

function traceText(machine) {
  const broken = machine.invariants.filter((item) => item.trace && item.trace.length);
  if (broken.length === 0) return "";
  return broken
    .map((item) => {
      const lines = item.trace.map((step, index) => `${index}. ${step.action}`);
      return `${item.name}\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

function render() {
  const violations = lab.machines.filter((machine) => machine.status === "violation").length;
  tally.textContent = `${lab.machines.length} machines, ${violations} with a violation`;
  cards.innerHTML = lab.machines
    .map((machine) => {
      const invariants = machine.invariants
        .map((item) => {
          const mark = item.holds ? "holds" : item.expected ? "violation, expected" : "violation";
          return `<div><strong>${item.name}</strong> <span>${mark}</span><p>${item.text}</p></div>`;
        })
        .join("");
      const trace = traceText(machine);
      const commit = machine.commit === "none" ? "no pinned file" : machine.commit.slice(0, 12);
      return `<article class="card">
        <div class="row">
          <h2>${machine.id}</h2>
          <span class="status ${machine.status}">${statusWord(machine.status)}</span>
        </div>
        <p class="meta">${machine.states} TLC states · ${commit}</p>
        <div class="inv">${invariants}</div>
        <div class="chart-wrap"><img class="chart" alt="Chart of ${machine.id}" src="${chartSrc(machine)}" /></div>
        ${trace ? `<pre class="trace">${trace}</pre>` : ""}
      </article>`;
    })
    .join("");
}

function paintTheme() {
  document.body.dataset.theme = theme === "field" ? "field" : "blueprint";
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.classList.toggle("on", button.getAttribute("data-theme") === theme);
  });
}

document.querySelectorAll("[data-theme]").forEach((button) => {
  button.addEventListener("click", () => {
    theme = button.getAttribute("data-theme");
    const url = new URL(location.href);
    url.searchParams.set("theme", theme);
    history.replaceState(null, "", url);
    paintTheme();
    render();
  });
});

paintTheme();
render();
