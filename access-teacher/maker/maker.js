// Language Sheet & Card Maker (access-teacher/maker/maker.js)
// Pick a sheet type, pick words, print. The preview is the printed page: every sheet is laid out on a
// fixed-size paper frame (Letter or A4) and scaled to fit the screen, so print output matches what the teacher sees.
// Words come from Word Lab (755), Survival Vocabulary (144) or a custom English | Spanish | Clue list.

import { WORDS } from "/access-practice-lab/src/content/wordlab-words.js";
import { SURVIVAL_TOPICS } from "/access-practice-lab/src/packs/survival-vocabulary.js";
import { TEMPLATES, buildSheet, esc, seededRng, shuffle } from "/access-teacher/maker/sheets.js";

const $ = (id) => document.getElementById(id);
const PRESET_KEY = "accessTeacher:v1:makerPreset";

const DEFAULTS = {
  source: "wordlab",
  band: "3-5",
  subject: "all",
  topic: "all",
  template: "wordsearch",
  title: "Academic Vocabulary Practice",
  titleTouched: false,
  count: 8,
  diagonals: false,
  showKey: false,
  lang: "en",
  seed: 1,
  paper: "letter",
  bw: false,
  nameLine: true,
  cardsPerPage: 8,
  cardMode: "single",
  svo: true,
};
const BAND_LABEL = {
  K: "Kindergarten",
  1: "Grade 1",
  "2-3": "Grades 2–3",
  "3-5": "Grades 3–5",
  "6-8": "Grades 6–8",
};
const PAPER = { letter: "8.5in 11in", a4: "210mm 297mm" };
const SAMPLE_CUSTOM = `evidence | evidencia | facts that support an idea
compare | comparar | find how two things are alike
explain | explicar | tell how or why something happens
cause | causa | why something happens
effect | efecto | what happens as a result
predict | predecir | say what might happen next`;

const state = { ...DEFAULTS };
let excluded = new Set();
let lastSheet = null;
let renderTimer = 0;

/* ── words ───────────────────────────────────────────────────────────────── */

function parseCustom(text) {
  const rows = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const words = [];
  let missing = 0;
  for (const line of rows) {
    const [en = "", es = "", clue = ""] = line.split(/\||\t/).map((p) => p.trim());
    if (!en) continue;
    if (!es) missing++;
    words.push({ en, es: es || en, clue: clue || es || en });
  }
  return { words, missing };
}

const dedupe = (list) => {
  const seen = new Set();
  return list.filter((w) => {
    const k = w.en.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

function getWordPool() {
  if (state.source === "custom") return dedupe(parseCustom($("mkCustomText")?.value).words);
  if (state.source === "survival") {
    return dedupe(
      SURVIVAL_TOPICS.filter((t) => state.topic === "all" || t.id === state.topic).flatMap((t) =>
        t.words.map(([en, es, icon]) => ({
          en,
          es,
          icon,
          clue: `${t.title[0]} (${es})`,
          example: `We use "${en}" in ${t.title[0].toLowerCase()}.`,
        })),
      ),
    );
  }
  const bandMatch = state.band === "6-8" ? "6-8" : "3-5";
  return dedupe(
    WORDS.filter(
      (w) =>
        (w.b === bandMatch || w.b === "both") && (state.subject === "all" || w.s === state.subject),
    ).map((w) => ({
      en: w.w,
      es: w.e || w.w,
      clue: state.lang === "es" ? w.de || w.d : w.d || w.de,
      example: state.lang === "es" ? w.xe || w.x || "" : w.x || w.xe || "",
    })),
  );
}

function pickWords(pool) {
  const usable = pool.filter((w) => !excluded.has(w.en.toLowerCase()));
  if (state.source === "custom" && usable.length <= state.count) return usable;
  return shuffle(usable, seededRng(state.seed * 7919 + state.count)).slice(0, state.count);
}

/* ── pages ───────────────────────────────────────────────────────────────── */

const pageStart = (i, kind) => {
  if (kind === "key")
    return `<header class="pg-head is-key"><div><h2>Teacher Answer Key</h2><p>${esc(state.title)} · not for students</p></div></header>`;
  if (state.template === "flashcards") return "";
  if (i > 0)
    return `<header class="pg-head is-cont"><div><h2>${esc(state.title)} <span>(continued)</span></h2></div></header>`;
  const name = state.nameLine
    ? `<div class="mk-name-line">Name: <i></i> Date: <i class="short"></i></div>`
    : "";
  return `<header class="pg-head"><h2>${esc(state.title)}</h2><p>Grade Band: ${esc(state.band)} · ACCESS Practice Lab</p>${name}</header>`;
};

function framePages(sheet) {
  const all = [
    ...sheet.pages.map((p) => ({ ...p, kind: "sheet" })),
    ...(state.showKey ? sheet.key.map((p) => ({ ...p, kind: "key" })) : []),
  ];
  return all
    .map((p, i) => {
      const foot = `<footer class="pg-foot"><span>ACCESS Practice Lab · practice material</span>${all.length > 1 ? `<span>Page ${i + 1} of ${all.length}</span>` : ""}</footer>`;
      return `<div class="pg-frame"><article class="pg${p.cards ? " is-cards" : ""}${p.kind === "key" ? " is-answerkey" : ""}" aria-label="Page ${i + 1} of ${all.length}">
        ${pageStart(i, p.kind)}<div class="pg-body">${p.body}</div>${foot}</article></div>`;
    })
    .join("");
}

/* ── render ──────────────────────────────────────────────────────────────── */

function render() {
  const pool = getWordPool();
  const words = pickWords(pool);
  const sheet = buildSheet(words, state);
  lastSheet = { words, sheet, pool };
  const root = $("mkPreview");
  root.dataset.paper = state.paper;
  root.classList.toggle("is-primary", ["K", "1", "2-3"].includes(state.band));
  root.classList.toggle("is-bw", state.bw);
  root.innerHTML = framePages(sheet);
  $("mkPageStyle").textContent = `@page { size: ${PAPER[state.paper]}; margin: 0; }`;
  fit();
  renderWordChips(words, pool);
  const notes = [...sheet.notes];
  root.querySelectorAll(".pg").forEach((pg, i) => {
    const body = pg.querySelector(".pg-body");
    if (body && body.scrollHeight > body.clientHeight + 2)
      notes.push(`Page ${i + 1} is too full. Lower the word count.`);
  });
  const pages = root.querySelectorAll(".pg").length;
  const tpl = TEMPLATES.find((t) => t.id === state.template);
  $("mkSummary").textContent =
    `${tpl.name} · ${words.length} word${words.length === 1 ? "" : "s"} · ${pages} page${pages === 1 ? "" : "s"}`;
  const status = $("mkStatus");
  status.textContent = notes.join(" ");
  status.hidden = !notes.length;
  $("mkPrint").disabled = !words.length;
  $("mkLaunch").disabled = !words.length;
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 120);
}

function fit() {
  const stage = $("mkStage");
  const px = state.paper === "a4" ? 794 : 816;
  const avail = stage.clientWidth - 24;
  const s = Math.max(0.3, Math.min(1, avail / px));
  $("mkPreview").style.setProperty("--s", String(Math.round(s * 1000) / 1000));
}

function renderWordChips(words, pool) {
  const list = $("mkWords");
  list.innerHTML = words
    .map(
      (w) =>
        `<li><span><strong>${esc(w.en)}</strong>${w.es && w.es !== w.en ? ` <em>${esc(w.es)}</em>` : ""}</span><button type="button" class="mk-x" data-drop="${esc(w.en.toLowerCase())}" aria-label="Remove ${esc(w.en)} and add another word">×</button></li>`,
    )
    .join("");
  const left = pool.filter((w) => !excluded.has(w.en.toLowerCase())).length;
  $("mkPoolInfo").textContent =
    `${pool.length} word${pool.length === 1 ? "" : "s"} match${pool.length === 1 ? "es" : ""}${left < pool.length ? ` · ${pool.length - left} removed` : ""}`;
}

/* ── controls ────────────────────────────────────────────────────────────── */

const maxFor = () => TEMPLATES.find((t) => t.id === state.template).max;

function defaultTitle() {
  if (state.source === "custom") return "Vocabulary Practice";
  if (state.source === "survival") {
    const t = SURVIVAL_TOPICS.find((x) => x.id === state.topic);
    return t ? `${t.title[0]} Words` : "Survival Vocabulary Practice";
  }
  return "Academic Vocabulary Practice";
}

function buildCountOptions() {
  const max = maxFor();
  state.count = Math.max(3, Math.min(max, state.count));
  $("mkCount").innerHTML = Array.from({ length: max - 2 }, (_, i) => i + 3)
    .map((n) => `<option value="${n}">${n} words</option>`)
    .join("");
  $("mkCount").value = String(state.count);
}

function syncControls() {
  if (!state.titleTouched) state.title = defaultTitle();
  document
    .querySelectorAll("input[type=radio][data-k]")
    .forEach((r) => (r.checked = String(state[r.dataset.k]) === r.value));
  for (const [id, key] of [
    ["mkBand", "band"],
    ["mkSubject", "subject"],
    ["mkTopic", "topic"],
    ["mkCardsPer", "cardsPerPage"],
  ])
    $(id).value = String(state[key]);
  for (const [id, key] of [
    ["mkDiagonals", "diagonals"],
    ["mkShowKey", "showKey"],
    ["mkBw", "bw"],
    ["mkNameLine", "nameLine"],
    ["mkSvo", "svo"],
  ])
    $(id).checked = !!state[key];
  $("mkSheetTitle").value = state.title;
  buildCountOptions();
  $("mkCustomWrap").hidden = state.source !== "custom";
  document
    .querySelectorAll("[data-only-src]")
    .forEach((el) => (el.hidden = el.dataset.onlySrc !== state.source));
  document
    .querySelectorAll("[data-only-tpl]")
    .forEach((el) => (el.hidden = !el.dataset.onlyTpl.split(" ").includes(state.template)));
  document
    .querySelectorAll("[data-not-tpl]")
    .forEach((el) => (el.hidden = el.dataset.notTpl.split(" ").includes(state.template)));
  $("mkBandNote").hidden = !(state.source === "wordlab" && ["K", "1", "2-3"].includes(state.band));
  const c = parseCustom($("mkCustomText").value);
  $("mkCustomInfo").textContent =
    `${c.words.length} word${c.words.length === 1 ? "" : "s"} ready${c.missing ? ` · ${c.missing} line(s) have no Spanish yet` : ""}.`;
}

function save() {
  try {
    localStorage.setItem(
      PRESET_KEY,
      JSON.stringify({ ...state, customText: $("mkCustomText").value }),
    );
  } catch {}
}

function change(patch, { reset = false } = {}) {
  Object.assign(state, patch);
  if (reset) excluded = new Set();
  syncControls();
  save();
  scheduleRender();
}

function bind() {
  document.querySelectorAll("input[type=radio][data-k]").forEach((r) =>
    r.addEventListener("change", () => {
      const k = r.dataset.k;
      const v = k === "cardsPerPage" ? Number(r.value) : r.value;
      if (k === "source") {
        const patch = { source: v };
        if (v === "custom")
          patch.count = Math.min(
            maxFor(),
            Math.max(3, parseCustom($("mkCustomText").value).words.length || 8),
          );
        return change(patch, { reset: true });
      }
      if (k === "template") {
        const tpl = TEMPLATES.find((t) => t.id === v);
        return change({
          template: v,
          count: Math.min(state.count, tpl.max),
          ...(["tracer"].includes(v) && ["3-5", "6-8"].includes(state.band) ? { band: "1" } : {}),
        });
      }
      change({ [k]: v }, { reset: k === "lang" });
    }),
  );
  const sel = (id, key, num = false, reset = true) =>
    $(id).addEventListener("change", (e) =>
      change({ [key]: num ? Number(e.target.value) : e.target.value }, { reset }),
    );
  sel("mkBand", "band");
  sel("mkSubject", "subject");
  sel("mkTopic", "topic");
  sel("mkCount", "count", true, false);
  sel("mkCardsPer", "cardsPerPage", true, false);
  const chk = (id, key) =>
    $(id).addEventListener("change", (e) => change({ [key]: e.target.checked }));
  chk("mkDiagonals", "diagonals");
  chk("mkShowKey", "showKey");
  chk("mkBw", "bw");
  chk("mkNameLine", "nameLine");
  chk("mkSvo", "svo");
  $("mkSheetTitle").addEventListener("input", (e) =>
    change({ title: e.target.value, titleTouched: true }),
  );
  $("mkCustomText").addEventListener("input", () => {
    if (state.source !== "custom") return;
    excluded = new Set();
    const n = parseCustom($("mkCustomText").value).words.length;
    change(n && n <= maxFor() ? { count: Math.max(3, n) } : {});
  });
  $("mkGenerate").addEventListener("click", () =>
    change({ seed: state.seed + 1 }, { reset: true }),
  );
  $("mkReset").addEventListener("click", () => {
    $("mkCustomText").value = SAMPLE_CUSTOM;
    excluded = new Set();
    Object.assign(state, DEFAULTS);
    change({});
  });
  $("mkWords").addEventListener("click", (e) => {
    const b = e.target.closest("[data-drop]");
    if (!b) return;
    excluded.add(b.dataset.drop);
    render();
    $("mkWords").querySelector("button")?.focus();
  });
  $("mkPrint").addEventListener("click", () => window.print());
  $("mkLaunch").addEventListener("click", launchInteractive);
  document.querySelectorAll("[data-view]").forEach((b) =>
    b.addEventListener("click", () => {
      $("mkShell").dataset.view = b.dataset.view;
      document
        .querySelectorAll("[data-view]")
        .forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      if (b.dataset.view === "preview") requestAnimationFrame(fit);
    }),
  );
  document.querySelector("[data-mk-comfort]")?.addEventListener("click", (e) => {
    const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
    e.currentTarget.setAttribute("aria-pressed", String(on));
    document.documentElement.dataset.comfortTheme = on ? "calm" : "";
    document.documentElement.dataset.comfortMotion = on ? "calm" : "";
  });
  new ResizeObserver(fit).observe($("mkStage"));
  document.fonts?.ready.then(() => render());
}

function launchInteractive() {
  const words = lastSheet?.words || [];
  const json = JSON.stringify({ title: state.title, words });
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  window.open(
    `/access-practice-lab/play?sheet=custom&grades=${encodeURIComponent(state.band === "6-8" ? "6-8" : "3-5")}#sheet=${b64}`,
    "_blank",
    "noopener",
  );
}

function init() {
  $("mkTopic").innerHTML =
    `<option value="all">All topics</option>${SURVIVAL_TOPICS.map((t) => `<option value="${t.id}">${esc(t.title[0])}</option>`).join("")}`;
  $("mkCustomText").value = SAMPLE_CUSTOM;
  try {
    const saved = JSON.parse(localStorage.getItem(PRESET_KEY) || "null");
    if (saved && typeof saved === "object") {
      for (const k of Object.keys(DEFAULTS))
        if (k in saved && typeof saved[k] === typeof DEFAULTS[k]) state[k] = saved[k];
      if (saved.customText) $("mkCustomText").value = saved.customText;
    }
  } catch {}
  // Deep links: ?template=flashcards&source=survival&topic=school&band=1&lang=both&count=10&title=…
  const q = new URLSearchParams(location.search);
  if (TEMPLATES.some((t) => t.id === q.get("template"))) state.template = q.get("template");
  if (["wordlab", "survival", "custom"].includes(q.get("source"))) state.source = q.get("source");
  if (q.get("topic")) state.topic = q.get("topic");
  if (Object.hasOwn(BAND_LABEL, q.get("band"))) state.band = q.get("band");
  if (["en", "es", "both"].includes(q.get("lang"))) state.lang = q.get("lang");
  if (q.get("count")) state.count = Number(q.get("count")) || state.count;
  if (q.get("title"))
    Object.assign(state, { title: q.get("title").slice(0, 80), titleTouched: true });
  if (!Object.hasOwn(BAND_LABEL, state.band)) state.band = DEFAULTS.band;
  bind();
  syncControls();
  render();
}

init();
