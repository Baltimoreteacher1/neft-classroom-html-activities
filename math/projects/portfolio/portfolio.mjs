/**
 * Portfolio behaviour. The cards are real HTML before this runs (every project and its launch
 * links, from the registry). This reads the student's own device through store.mjs and adds what
 * is genuinely there: status, the saved artifacts, a certificate for finished work, a print view.
 * It never writes project data. The only key it writes is the one it always wrote, the student's
 * name for certificates (`nt-student-name`). Every storage access is inside try/catch.
 */
import { loadPortfolio } from "./store.mjs";
import { certificateFor } from "./certificate.mjs";

const NAME_KEY = "nt-student-name";
const $ = (selector, root = document) => root.querySelector(selector);
const dataEl = $("#pf-data");
if (!dataEl) throw new Error("portfolio data missing");
const data = JSON.parse(dataEl.textContent);
const promptOf = new Map(data.reflections.map((r) => [r.id, r.prompt]));

let storage = null;
try {
  storage = window.localStorage;
  storage.getItem(NAME_KEY);
} catch {
  storage = null;
}
const store = storage || { length: 0, key: () => null, getItem: () => null };
let rows = [];
let lastSummary = "";

const el = (tag, props = {}, ...kids) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "text") node.textContent = v;
    else if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  for (const kid of kids) if (kid) node.append(kid);
  return node;
};
const when = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d.toDateString();
  }
};
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* ---------- artifact blocks ---------- */
function addPair(list, term, value) {
  if (!value) return;
  list.append(el("dt", { text: term }), el("dd", { text: value }));
}

/** The student's own words and choices, from a completion record or a live Studio save. */
function studioWork(project, source) {
  const list = el("dl");
  addPair(list, "The context you chose", source.context);
  addPair(list, "Your goal", source.vision);
  project.prompts.forEach((prompt, i) => addPair(list, prompt, source.evidence[i]));
  if (source.firstDesign && source.design) {
    const changed = project.fields
      .filter((f) => source.firstDesign[f.key] !== undefined && source.firstDesign[f.key] !== source.design[f.key])
      .map((f) => `${f.label}: ${source.firstDesign[f.key]} to ${source.design[f.key]}`);
    if (changed.length) {
      const dd = el("dd");
      const ul = el("ul");
      for (const line of changed) ul.append(el("li", { text: line }));
      dd.append(ul);
      list.append(el("dt", { text: "What you changed from your first design" }), dd);
    }
  }
  addPair(list, "The question you asked about your design", source.critique);
  addPair(list, "Your revision and its tradeoff", source.revision);
  addPair(list, "Your recommendation", source.claim);
  return list;
}

function selfCheck(labels, flags) {
  const done = labels.filter((_, i) => flags[i] === true).length;
  const wrap = el("div");
  wrap.append(el("p", { text: `Self-check: ${done} of ${labels.length} boxes checked.` }));
  const ul = el("ul");
  labels.forEach((label, i) => ul.append(el("li", { text: `${flags[i] === true ? "Checked" : "Not yet"}: ${label}` })));
  wrap.append(ul);
  return wrap;
}

function classicWork(row) {
  const wrap = el("div");
  const { legacy, legacyRecord } = row;
  if (legacyRecord) {
    const bits = [`Finished ${when(legacyRecord.completedAt)}`];
    if (typeof legacyRecord.stars === "number" && Number.isFinite(legacyRecord.stars))
      bits.push(`${Math.min(3, Math.max(0, Math.round(legacyRecord.stars)))} of 3 stars`);
    if (typeof legacyRecord.rubricTotal === "number" && typeof legacyRecord.rubricMax === "number")
      bits.push(`rubric self-score ${legacyRecord.rubricTotal} of ${legacyRecord.rubricMax}`);
    wrap.append(el("p", { text: bits.join(" · ") }));
  }
  if (legacy) {
    const bits = [];
    if (legacy.percent) bits.push(`about ${legacy.percent}% saved`);
    if (legacy.updated) bits.push(`last saved ${when(new Date(legacy.updated).toISOString())}`);
    if (legacy.answers) bits.push(plural(legacy.answers, "answer") + " written");
    if (!legacyRecord && !bits.length) bits.push("saved work found");
    wrap.append(el("p", { text: `Classic page: ${bits.join(" · ")}` }));
    if (legacy.rubricScored && !legacyRecord?.rubricTotal)
      wrap.append(
        el("p", {
          text: `Rubric self-check: ${legacy.rubricScored} of ${row.project.rubricRows || legacy.rubricScored} rows scored (${legacy.rubricSum} points).`,
        }),
      );
    if (legacy.reflections) {
      const list = el("dl");
      for (const [id, text] of Object.entries(legacy.reflections)) addPair(list, promptOf.get(id) || "Your reflection", text);
      if (list.children.length) {
        const details = el("details", {}, el("summary", { text: "My reflections" }), list);
        wrap.append(details);
      }
    }
  }
  return wrap;
}

function artifactFor(row) {
  const { project } = row;
  const wrap = el("div");
  const studio = row.studioDone
    ? {
        ...row.studioDone.evidence,
        evidence: row.studioDone.evidence.prompts.map((p) => p.text),
        review: row.studioDone.selfCheck.items.map((i) => i.checked),
        checks: row.studioDone.evidence.mathChecks.passed,
      }
    : row.studio;
  if (studio) {
    wrap.append(
      el("p", {
        text: row.studioDone
          ? `Studio: ${studio.checks} of ${row.studioDone.evidence.mathChecks.total} math checks matched when you finished.`
          : `Studio: step ${studio.step} of 5 · ${studio.checks} of 6 math checks matched.`,
      }),
    );
    const work = studioWork(project, studio);
    const details = el("details", {}, el("summary", { text: "See my work" }), work);
    details.append(selfCheck(data.selfCheck, studio.review));
    wrap.append(details);
  }
  if (row.legacy || row.legacyRecord) wrap.append(classicWork(row));
  return wrap;
}

/* ---------- card updates ---------- */
function statusText(row) {
  if (row.status === "complete") {
    const latest = row.completions.map((c) => c.at).sort((a, b) => Date.parse(b) - Date.parse(a))[0];
    return `Complete · ${when(latest)}`;
  }
  if (row.status === "not-started") return "Not started";
  const parts = [];
  if (row.studio) parts.push(`Studio step ${row.studio.step} of 5`);
  if (row.legacy) parts.push(row.legacy.percent ? `classic page about ${row.legacy.percent}% saved` : "classic page saved work found");
  return `In progress · ${parts.join(" · ")}`;
}

function paintCard(row) {
  const card = $(`.pf-card[data-id="${CSS.escape(row.project.id)}"]`);
  if (!card) return;
  card.dataset.status = row.status;
  const status = $('[data-role="status"]', card);
  status.hidden = false;
  status.textContent = statusText(row);
  const artifact = $('[data-role="artifact"]', card);
  artifact.replaceChildren();
  artifact.hidden = row.status === "not-started";
  if (row.status !== "not-started") artifact.append(artifactFor(row));
  const page = $('[data-role="page"]', card);
  const studio = $('[data-role="studio"]', card);
  const sr = (link, title) => link.append(el("span", { class: "pf-sr", text: ` for ${title}` }));
  if (page) {
    page.textContent = row.legacy || row.legacyRecord ? "Continue project page" : "Open project page";
    sr(page, row.project.title);
  }
  studio.textContent = row.studioDone ? "Review in Studio" : row.studio ? "Continue in Studio" : "Open in Studio";
  sr(studio, row.project.title);
}

function render() {
  rows = loadPortfolio(data, store);
  for (const row of rows) paintCard(row);
  const count = (s) => rows.filter((r) => r.status === s).length;
  const complete = count("complete");
  const progress = count("in-progress");
  const unitsDone = new Set(rows.filter((r) => r.status === "complete").map((r) => r.project.unit)).size;
  $("#stat-complete").textContent = complete;
  $("#stat-progress").textContent = progress;
  $("#stat-units").textContent = unitsDone;
  const stars = rows.reduce(
    (n, r) =>
      n +
      (r.legacyRecord && Number(r.legacyRecord.stars) > 0
        ? Math.min(3, Math.round(Number(r.legacyRecord.stars)))
        : 0),
    0,
  );
  $("#stat-stars").textContent = stars;
  $("#stat-stars-wrap").hidden = stars === 0;
  for (const unit of data.units) {
    const mine = rows.filter((r) => r.project.unit === unit.unit);
    const done = mine.filter((r) => r.status === "complete").length;
    const going = mine.filter((r) => r.status === "in-progress").length;
    const meta = [plural(mine.length, "project")];
    if (done) meta.push(`${done} complete`);
    if (going) meta.push(`${going} in progress`);
    const section = $(`#${unit.key}`);
    $('[data-role="unit-meta"]', section).textContent = meta.join(" · ");
    $("[data-cert]", section).hidden = done === 0;
  }
  $("#empty-state").hidden = complete + progress > 0;
  $("#pf-print").hidden = complete + progress === 0;
  const summary = `${plural(complete, "project")} finished, ${progress} in progress.`;
  if (lastSummary && summary !== lastSummary) $("#pf-live").textContent = `Portfolio updated: ${summary}`;
  lastSummary = summary;
}

/* ---------- certificate ---------- */
const dialog = $("#cert-modal");
const nameInput = $("#student-name");
const currentName = () => (nameInput.value || "").trim();
let openUnit = null;

function paintCertificate() {
  const unit = data.units.find((u) => u.key === openUnit);
  const cert = unit && certificateFor(unit, rows.filter((r) => r.project.unit === unit.unit), currentName());
  if (!cert) return false;
  $("#cert-content").replaceChildren(cert);
  return true;
}
window.showCert = (unitKey) => {
  openUnit = String(unitKey);
  if (!paintCertificate()) {
    openUnit = null;
    return;
  }
  document.body.classList.add("pf-printing-cert");
  landscape.disabled = false;
  if (!dialog.open) dialog.showModal();
};
window.closeCert = () => {
  if (dialog.open) dialog.close();
};
/* A certificate prints on one landscape Letter page; the page size is only asked for while one is open. */
const landscape = document.head.appendChild(
  el("style", { media: "print", text: "@page { size: letter landscape; margin: 0.4in; }" }),
);
landscape.disabled = true;
dialog.addEventListener("close", () => {
  landscape.disabled = true;
  document.body.classList.remove("pf-printing-cert");
  openUnit = null;
});
$("#cert-close").addEventListener("click", window.closeCert);
$("#cert-print").addEventListener("click", () => window.print());
for (const button of document.querySelectorAll("[data-cert]"))
  button.addEventListener("click", () => window.showCert(button.dataset.cert));

/* ---------- name, print, refresh ---------- */
try {
  nameInput.value = store.getItem(NAME_KEY) || "";
} catch {
  /* blocked */
}
nameInput.addEventListener("input", () => {
  try {
    storage?.setItem(NAME_KEY, nameInput.value);
  } catch {
    /* the name still prints from the field for this visit */
  }
});

$("#pf-print").addEventListener("click", () => window.print());
let reopened = [];
window.addEventListener("beforeprint", () => {
  reopened = [...document.querySelectorAll(".pf-artifact details:not([open])")];
  for (const d of reopened) d.open = true;
});
window.addEventListener("afterprint", () => {
  for (const d of reopened) d.open = false;
  reopened = [];
});

window.addEventListener("storage", () => render());
document.addEventListener("visibilitychange", () => !document.hidden && render());
window.addEventListener("pageshow", (event) => event.persisted && render());

window.NTPortfolioRefresh = render;
if (storage) render();
else
  $(".pf-lede").after(
    el("p", {
      class: "pf-note",
      role: "status",
      text: "This browser is blocking saved work, so the portfolio cannot show what you have started or finished. Every project still opens below.",
    }),
  );
