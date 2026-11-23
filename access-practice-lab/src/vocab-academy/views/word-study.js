// Word Study Lab — /vocabulary-academy/word-study[/<tool>]. Owner: Word Study agent (SPEC §10).
// Seven tools over content/vocab-academy/morphology.json, filtered by the learner's grade. Results are recorded as
// the "morph" dimension through the Core model when there is a progress record, and the lab works without one.
import { BASE, html, raw, toHtml, announce } from "../../util.js";
import { GRADES, SHIPPED_GRADES } from "../contract.js";
import { resolve } from "../router.js";
import { canSpeak, speak } from "../../speech.js";
import { analyze as analyzeIn } from "../wordstudy/model.js";
import { getIndex, morphDataset } from "../wordstudy/index.js";
import * as Items from "../wordstudy/items.js";
import { readPrefs, recordMorph, writePrefs } from "../wordstudy/record.js";
import { TOOLS, analysisHTML, apartPanel, buildPanel, familiesFor, familiesPanel, kitsFor, originsPanel, predictPanel, shiftsPanel, studioPanel, toolAvailable } from "../wordstudy/panels.js";

const CSS = `${BASE}/vocab-academy-wordstudy.css`;
const TOKENS = `${BASE}/vocab-academy-tokens.css`;
const ROUTE = `${BASE}/vocabulary-academy/word-study`;
const LAB_BAND_GRADE = { K: "K", 1: "1", "2-3": "2", "3-5": "4", "6-8": "7" };

function ensureCss() {
  const add = (href) =>
    new Promise((done) => {
      if (document.querySelector(`link[href^="${href}"]`)) return done();
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = link.onerror = () => done();
      document.head.append(link);
      setTimeout(done, 2000);
    });
  const hasTokens = getComputedStyle(document.documentElement).getPropertyValue("--va-radius").trim();
  return Promise.all([hasTokens ? null : add(TOKENS), add(CSS)]);
}

// Module state: survives re-renders (language switch) and resets when the tool changes.
const S = {
  routeKey: "", grade: "", tool: "", idx: null, session: 0, seen: new Map(),
  item: null, missed: [], state: "open", hintShown: false, answeredFirst: false, counted: false,
  kits: [], anchor: "", kit: null, placed: [], result: null, built: new Set(),
  typed: "", analysis: null, families: [], famId: "", mode: "compound",
  stats: { n: 0, c: 0 }, focus: "", va: null, host: null,
};

const clampGrade = (g) => (SHIPPED_GRADES.includes(String(g)) ? String(g) : GRADES.includes(String(g)) ? "8" : "");
function pickGrade(va, ctx) {
  const prefs = readPrefs(va);
  return clampGrade(prefs.grade) || clampGrade(va.progress?.grade) || LAB_BAND_GRADE[ctx?.band] || "5";
}
const pathStyleWorks = () => {
  try {
    return resolve(["word-study", "build"]).name === "word-study";
  } catch {
    return false;
  }
};
const toolUrl = (tool) => (pathStyleWorks() ? `${ROUTE}/${tool}` : `${ROUTE}?tool=${tool}`);

function setTool(tool) {
  S.tool = tool;
  S.item = null;
  S.missed = [];
  S.state = "open";
  S.hintShown = false;
  S.counted = false;
  S.result = null;
  S.placed = [];
  if (tool === "studio" && !["compound", "plural", "past", "now", "compare"].includes(S.mode)) S.mode = "compound";
  if (tool === "build") setupBuild();
  if (tool === "families") setupFamilies();
  if (tool !== "build" && tool !== "families" && tool !== "apart" && tool !== "hub") nextItem();
  if (tool === "apart" || tool === "families") nextItem();
}
function setupBuild() {
  S.kits = kitsFor(S.idx, S.grade);
  if (!S.kits.some((k) => k.anchor === S.anchor)) S.anchor = S.kits[(S.session % Math.max(1, S.kits.length)) | 0]?.anchor || "";
  S.kit = S.anchor ? Items.buildKit(S.idx, S.grade, S.anchor, S.session) : null;
  S.placed = [];
  S.result = null;
}
function setupFamilies() {
  S.families = familiesFor(S.idx, S.grade);
  if (!S.families.some((f) => f.id === S.famId)) S.famId = S.families[0]?.id || "";
}
function makeItem(seed) {
  const g = S.grade;
  const i = S.idx;
  switch (S.tool) {
    case "apart": return Items.apartItem(i, g, seed);
    case "predict": return Items.predictItem(i, g, seed);
    case "families": return Items.familyItem(i, g, seed);
    case "shifts": return Items.shiftItem(i, seed, g);
    case "origins": return Items.originItem(i, g, seed);
    case "studio": return S.mode === "compound" ? Items.compoundItem(i, seed) : Items.inflectionItem(i, seed, S.mode);
    default: return null;
  }
}
function nextItem() {
  const seen = S.seen.get(S.tool) || new Set();
  let item = null;
  for (let n = 0; n < 12 && !item; n++) {
    const candidate = makeItem(`${S.session}:${S.mode}:${S.seen.size}:${seen.size}:${n}`);
    if (!candidate) break;
    if (!seen.has(candidate.id) || n === 11) item = candidate;
  }
  if (item) {
    seen.add(item.id);
    S.seen.set(S.tool, seen);
    if (seen.size > 40) seen.clear();
  }
  S.item = item;
  S.missed = [];
  S.state = "open";
  S.hintShown = false;
  S.counted = false;
}

const I18 = (va) => va.I;
function gradePicker(I) {
  return html`<div class="ws-grades" role="group" aria-label="${I.S("Show word parts up to this grade", "Mostrar partes de palabras hasta este grado")}">
    ${SHIPPED_GRADES.map((g) => html`<button type="button" class="btn ws-grade" data-ws="grade" data-id="${g}" aria-pressed="${g === S.grade}"><span aria-hidden="true">${g}</span><span class="visually-hidden">${g === "K" ? I.S("Kindergarten", "Kínder") : I.S(`Grade ${g}`, `Grado ${g}`)}</span></button>`)}
  </div>`;
}
function hub(I) {
  return html`<ul class="ws-tools">
    ${TOOLS.map((t) => {
      const ok = toolAvailable(t, S.grade);
      const range = t.from === t.to ? t.from : `${t.from}–${t.to}`;
      return html`<li><button type="button" class="btn ws-tool" data-ws="tool" data-id="${t.id}" aria-pressed="${S.tool === t.id}" ${ok ? "" : raw("aria-disabled=\"true\"")}>
        <span class="ws-tool-name">${I.T(t.en, t.es)}</span><span class="ws-tool-desc">${I.T(t.dEn, t.dEs)}</span>
        <span class="ws-tool-range">${ok ? "" : I.T(`For Grades ${range}`, `Para los grados ${range}`)}</span></button></li>`;
    })}
  </ul>`;
}
function panel(I) {
  const idx = S.idx;
  switch (S.tool) {
    case "build": return buildPanel(I, S, idx);
    case "apart": return apartPanel(I, S, idx);
    case "predict": return predictPanel(I, S, idx);
    case "families": return familiesPanel(I, S, idx);
    case "studio": return studioPanel(I, S, idx);
    case "shifts": return shiftsPanel(I, S, idx);
    case "origins": return originsPanel(I, S, idx);
    default:
      return html`<section class="ws-welcome"><h2>${I.T("Choose a tool", "Elige una herramienta")}</h2>
        <p class="ws-lead">${I.T("Prefixes, suffixes and roots help you work out words you have never seen. Pick a tool above. Everything here shows parts for your grade and earlier grades.", "Los prefijos, sufijos y raíces te ayudan a descifrar palabras que nunca has visto. Elige una herramienta arriba. Todo aquí muestra partes de tu grado y de grados anteriores.")}</p></section>`;
  }
}
function statsLine(I) {
  if (!S.stats.n) return "";
  return html`<p class="ws-stats">${I.T(`This visit: ${S.stats.c} of ${S.stats.n} questions answered correctly.`, `En esta visita: ${S.stats.c} de ${S.stats.n} preguntas respondidas correctamente.`)}</p>`;
}

function shell(I) {
  const current = TOOLS.find((t) => t.id === S.tool);
  return html`<div class="ws" data-ws-root>
    <nav class="ws-crumbs" aria-label="${I.S("Breadcrumb", "Ruta de navegación")}"><a href="${BASE}/vocabulary-academy">${I.T("My Vocabulary", "Mi vocabulario")}</a> <span aria-hidden="true">/</span> <span aria-current="page">${I.T("Word Study Lab", "Laboratorio de partes de palabras")}</span></nav>
    <header class="ws-head">
      <h1 tabindex="-1">${I.T("Word Study Lab", "Laboratorio de partes de palabras")}</h1>
      <p class="ws-lead">${I.T("See how words are built from prefixes, suffixes, roots and bases.", "Mira cómo se forman las palabras con prefijos, sufijos, raíces y bases.")}</p>
      <div class="ws-grade-row"><span id="wsGradeLbl" class="ws-grade-lbl">${I.T("Parts up to grade", "Partes hasta el grado")}</span>${gradePicker(I)}</div>
    </header>
    <div data-ws-hub>${hub(I)}</div>
    <section class="ws-panel" data-ws-panel aria-labelledby="wsPanelH" tabindex="-1">
      <h2 id="wsPanelH" class="ws-panel-h">${current ? I.T(current.en, current.es) : I.T("Choose a tool", "Elige una herramienta")}</h2>
      <div data-ws-body>${panel(I)}</div>
    </section>
    <div data-ws-stats>${statsLine(I)}</div>
    <p class="ws-links">${I.T("Also try the", "También prueba el")} <a href="${BASE}/vocabulary">${I.T("Word Builder", "Constructor de palabras")}</a> ${I.T("and the", "y las")} <a href="${BASE}/vocab-curriculum">${I.T("vocabulary investigations", "investigaciones de vocabulario")}</a>.</p>
  </div>`;
}

const errorPanel = (I) =>
  html`<section class="va-panel va-empty" aria-labelledby="wsErr"><h1 id="wsErr" tabindex="-1">${I.T("The word parts could not load", "No se pudieron cargar las partes de palabras")}</h1>
    <p>${I.T("Check your connection and try again. Your work is safe.", "Revisa tu conexión e inténtalo de nuevo. Tu trabajo está a salvo.")}</p></section>`;

export async function render(ctx, va) {
  const I = I18(va);
  await ensureCss();
  const data = await morphDataset();
  if (!data) return { title: I.S("Word Study Lab", "Laboratorio de partes de palabras"), html: errorPanel(I) };
  S.idx = getIndex();
  S.va = va;
  const q = va.route?.q || {};
  const wanted = va.route?.path?.[1] || q.tool || "";
  const routeKey = `${va.route?.path?.join("/")}|${q.tool || ""}`;
  if (!S.session) S.session = Math.floor(Math.random() * 1e6);
  const grade = pickGrade(va, ctx);
  const changedGrade = grade !== S.grade;
  S.grade = grade;
  if (S.routeKey !== routeKey) {
    S.routeKey = routeKey;
    S.tool = "";
    if (TOOLS.some((t) => t.id === wanted)) setTool(toolAvailable(TOOLS.find((t) => t.id === wanted), S.grade) ? wanted : "");
  } else if (changedGrade && S.tool) setTool(S.tool);
  const words = readPrefs(va).built;
  if (Array.isArray(words) && !S.built.size) S.built = new Set(words.slice(0, 400));
  return { title: I.S("Word Study Lab", "Laboratorio de partes de palabras"), html: shell(I) };
}

// ── interaction ───────────────────────────────────────────────────────────────────────────────────────────────────
function repaint() {
  const host = S.host;
  if (!host?.isConnected) return;
  const I = S.va.I;
  const body = host.querySelector("[data-ws-body]");
  const current = TOOLS.find((t) => t.id === S.tool);
  host.querySelector("#wsPanelH").textContent = current ? I.S(current.en, current.es) : I.S("Choose a tool", "Elige una herramienta");
  body.innerHTML = toHtml(panel(I));
  host.querySelector("[data-ws-stats]").innerHTML = toHtml(statsLine(I));
  host.querySelector("[data-ws-hub]").innerHTML = toHtml(hub(I));
  for (const b of host.querySelectorAll(".ws-grade")) b.setAttribute("aria-pressed", String(b.dataset.id === S.grade));
  const target = S.focus && host.querySelector(S.focus);
  S.focus = "";
  if (target) target.focus({ preventScroll: false });
}
function say(text) {
  announce(text, { toast: false });
}
function count(ok, word) {
  S.stats.n += 1;
  if (ok) S.stats.c += 1;
  recordMorph(S.va, word, ok, { tool: S.tool });
}
function choose(id) {
  const it = S.item;
  if (!it || S.state !== "open" || S.missed.includes(id)) return;
  if (id === it.answer) {
    S.state = "solved";
    if (!S.counted) {
      S.counted = true;
      count(true, it.word);
    }
    S.focus = "[data-ws=next]";
    say(S.va.I.S("Yes. That is right.", "Sí. Es correcto."));
  } else {
    S.missed.push(id);
    S.focus = `[data-ws=choose][data-id=${id}]`;
    say(S.va.I.S("Not yet. Try another choice.", "Todavía no. Prueba otra opción."));
  }
  repaint();
}
function leaveUnsolved() {
  if (S.item && S.state === "open" && !S.counted) {
    S.counted = true;
    count(false, S.item.word);
  }
}
function placeTile(id) {
  if (!S.kit || S.placed.includes(id) || S.placed.length >= 5) return;
  S.placed.push(id);
  S.result = null;
  S.focus = `[data-ws=tile][data-id="${id}"]`;
  repaint();
}
function check() {
  if (!S.kit) return;
  const r = evaluate();
  S.result = r;
  if (r.ok) {
    const first = !S.built.has(r.derivation.word);
    S.built.add(r.derivation.word);
    writePrefs(S.va, { built: [...S.built].slice(-400) });
    if (first) count(true, r.derivation.word);
    say(S.va.I.S(`That is a real word: ${r.derivation.word}.`, `Es una palabra real: ${r.derivation.word}.`));
  } else if (r.reason !== "short") {
    S.stats.n += 1;
    recordMorph(S.va, "", false, { tool: "build" });
    say(S.va.I.S("That combination is not in my word list.", "Esa combinación no está en mi lista de palabras."));
  }
  S.focus = "";
  repaint();
  if (r.ok) S.host.querySelector(".ws-result .ws-word")?.parentElement?.scrollIntoView({ block: "nearest" });
}
const evaluate = () => Items.evaluateBuild(S.idx, S.kit, S.placed);

function onClick(e) {
  const el = e.target.closest?.("[data-ws]");
  if (!el || !S.host?.contains(el) || el.getAttribute("aria-disabled") === "true") return;
  const act = el.dataset.ws;
  switch (act) {
    case "tool": {
      leaveUnsolved();
      S.focus = "[data-ws-panel]";
      setTool(el.dataset.id);
      try {
        history.replaceState(history.state, "", toolUrl(el.dataset.id));
      } catch {
        // history may be unavailable in an embedded view
      }
      repaint();
      break;
    }
    case "grade":
      leaveUnsolved();
      writePrefs(S.va, { grade: el.dataset.id });
      S.grade = el.dataset.id;
      if (S.tool && !toolAvailable(TOOLS.find((t) => t.id === S.tool), S.grade)) S.tool = "";
      else if (S.tool) setTool(S.tool);
      S.focus = `.ws-grade[data-id="${el.dataset.id}"]`;
      repaint();
      break;
    case "choose": choose(el.dataset.id); break;
    case "hint": S.hintShown = true; S.focus = ""; repaint(); break;
    case "show":
      if (!S.counted) { S.counted = true; count(false, S.item.word); }
      S.state = "shown"; S.focus = "[data-ws=next]"; repaint(); break;
    case "next": nextItem(); S.focus = ".ws-choice"; repaint(); break;
    case "tile": placeTile(el.dataset.id); break;
    case "unplace": S.placed.splice(Number(el.dataset.i), 1); S.result = null; S.focus = ""; repaint(); break;
    case "undo": S.placed.pop(); S.result = null; S.focus = ""; repaint(); break;
    case "clear": S.placed = []; S.result = null; S.focus = ""; repaint(); break;
    case "check": check(); break;
    case "mode": S.mode = el.dataset.id; nextItem(); S.focus = `.ws-mode[data-id="${el.dataset.id}"]`; repaint(); break;
    case "analyze": runAnalyze(); break;
    case "hear": hear(el.dataset.word); break;
    default: break;
  }
}
function runAnalyze() {
  const input = S.host.querySelector("[data-ws=word]");
  S.typed = (input?.value || "").trim();
  S.analysis = analyzeIn(S.idx, S.typed);
  const region = S.host.querySelector(".ws-try .ws-result");
  if (region) region.innerHTML = toHtml(analysisHTML(S.va.I, S.analysis));
  const a = S.analysis;
  say(a.known ? S.va.I.S(`${a.word}: ${a.segments.map((s) => s.text).join(", ")}.`, `${a.word}: ${a.segments.map((s) => s.text).join(", ")}.`) : S.va.I.S("I am not sure about that word.", "No estoy seguro de esa palabra."));
}
function hear(word) {
  if (!word) return;
  if (!canSpeak()) return say(S.va.I.S("This device cannot read words aloud.", "Este dispositivo no puede leer palabras en voz alta."));
  speak(word, { lang: "en-US" });
}
function onChange(e) {
  const el = e.target.closest?.("[data-ws]");
  if (!el || !S.host?.contains(el)) return;
  if (el.dataset.ws === "kit") {
    S.anchor = el.value;
    setupBuild();
    S.focus = "#wsKit";
    repaint();
  } else if (el.dataset.ws === "fam") {
    S.famId = el.value;
    nextItem();
    S.focus = "#wsFam";
    repaint();
  }
}
function onKey(e) {
  if (e.key === "Enter" && e.target?.dataset?.ws === "word") {
    e.preventDefault();
    runAnalyze();
  }
}

export function mount(root) {
  const host = root.querySelector?.("[data-ws-root]") || document.querySelector("[data-ws-root]");
  S.host = host;
  if (!host) return;
  host.addEventListener("click", onClick);
  host.addEventListener("change", onChange);
  host.addEventListener("keydown", onKey);
}
export function unmount() {
  leaveUnsolved();
  S.host = null;
}
