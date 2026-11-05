// Scaffold tools (/scaffold, /scaffold/<sentence-architecture|evidence-builder|language-upgrade>?item=<id>).
// The starting support condition comes from the Language DNA for the tool's domain. The learner chooses it
// or "On my own" BEFORE anything is shown, so an independent attempt never sees a frame, bank or model.
// "Ask for more help" steps the condition toward modeling and marks the attempt supported. Every check that
// changed the work is written to the ledger (src "scaffold"): the first check of an attempt is "first", any
// later one is a "revision". Features come from analyze.js, so the evidence reaches the skill graph and the
// constellation the same way Writing Studio work does.
import { crumbsHTML } from "../components.js";
import { TOOLS, itemById, itemsFor } from "../content/scaffold-items.js";
import { i18nFor } from "../i18n.js";
import { analyzeResponse } from "../lang/analyze.js";
import { CONDITIONS } from "../lang/dna.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { checkEvidence, checkSentence, checkUpgrade } from "../lang/scaffold-check.js";
import { BASE, announce, html, icon, safeJson, storage } from "../util.js";
import { conditionFor, readPath, scaffoldHref } from "./path-data.js";
import {
  evidenceHTML,
  hintHTML,
  modelHTML,
  sentenceHTML,
  showsFrame,
  showsModel,
  upgradeHTML,
} from "./scaffold-tools.js";

export const SCAFFOLD_KEY = "accessPracticeLab:v1:scaffold";
const COND_ES = {
  modeled: "Primero lo hacemos juntos",
  partial: "Tengo un marco y un banco de palabras",
  minimal: "Tengo una pista si la pido",
  independent: "Lo hago por mi cuenta",
};
const condYou = (I, id) => I.T(CONDITIONS.find((c) => c.id === id).you, COND_ES[id]);

let S = null;
let lastCtx = null;

function fresh(tool, item, start) {
  return {
    key: `${tool}|${item.id}`,
    tool,
    item,
    start,
    condition: start,
    started: false,
    supports: { model: false, frames: false, bank: false, hint: false, more: false },
    attemptId: `s${Date.now().toString(36)}`,
    checks: 0,
    lastSig: "",
    result: null,
    finished: false,
    selectedTile: null,
    placed: {},
    ev: { selected: [], connector: "" },
    text: "",
    checkedText: "",
    pattern: "",
    versions: loadVersions(item.id),
    next: null,
  };
}

function loadVersions(id) {
  const all = safeJson(storage.get(SCAFFOLD_KEY), {}) || {};
  return Array.isArray(all.revisions?.[id]) ? all.revisions[id].slice(-10) : [];
}
function saveVersion(id, text) {
  const all = safeJson(storage.get(SCAFFOLD_KEY), {}) || {};
  const revisions = all.revisions && typeof all.revisions === "object" ? all.revisions : {};
  revisions[id] = [...(revisions[id] || []), { t: new Date().toISOString(), text }].slice(-10);
  storage.set(SCAFFOLD_KEY, JSON.stringify({ ...all, revisions }));
  return revisions[id];
}

/** Mark the supports a condition puts on screen. Once shown, a support stays marked for the attempt. */
function applyCondition(cond) {
  S.condition = cond;
  if (showsModel(cond)) S.supports.model = true;
  if (showsFrame(cond)) S.supports.frames = S.supports.bank = true;
}

function pickItem(tool, band, requested) {
  const req = requested ? itemById(requested) : null;
  if (req && req.tool === tool && req.band === band) return req;
  const list = itemsFor(tool, band);
  const done = new Set(
    loadLedger()
      .entries.filter((e) => e.src === "scaffold" && e.m?.ok)
      .map((e) => e.task),
  );
  return list.find((i) => !done.has(i.id)) || list[0];
}

function chooserHTML(I, band) {
  return html`${crumbsHTML(
      [
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("My Language Path", "Mi camino del lenguaje"), `${BASE}/path?grades=${band}`],
        [I.S("Language builders", "Constructores de lenguaje"), null],
      ],
      { i18n: I },
    )}
    <header class="pa-head">
      <h1 tabindex="-1">${I.T("Language builders", "Constructores de lenguaje")}</h1>
      <p class="lead">
        ${I.T("Three tools for building academic language. Your help level starts where your path suggests, and you can always choose to work on your own.", "Tres herramientas para construir lenguaje académico. Tu nivel de ayuda empieza donde sugiere tu camino y siempre puedes elegir trabajar por tu cuenta.")}
      </p>
    </header>
    <div class="pa-tool-grid">
      ${Object.entries(TOOLS).map(
        ([id, t]) =>
          html`<a class="pa-tool" href="${scaffoldHref(id, band)}"
            >${icon(t.icon)}<span
              ><strong>${I.T(...t.name)}</strong><span class="fine">${I.T(...t.blurb)}</span></span
            ></a
          >`,
      )}
    </div>`;
}

function startHTML(I) {
  const independent = S.start === "independent";
  return html`<section class="panel sc-start" aria-labelledby="scStartTitle">
    <h2 id="scStartTitle">${I.T("How do you want to work?", "¿Cómo quieres trabajar?")}</h2>
    <p>
      ${I.T("Your path suggests:", "Tu camino sugiere:")} <strong>${condYou(I, S.start)}</strong>
    </p>
    <div class="sc-start-actions">
      <button type="button" class="btn btn-primary btn-big" data-sc-start="${S.start}">
        ${independent ? I.T("Start on my own", "Empezar por mi cuenta") : I.T("Start with this help", "Empezar con esta ayuda")}
      </button>
      ${independent ? "" : html`<button type="button" class="btn btn-big" data-sc-start="independent">${icon("star")} ${I.T("On my own", "Por mi cuenta")}</button>`}
    </div>
    <p class="fine">
      ${I.T("On my own means no frame, word bank, model or hint. Opening any help later marks this try as supported.", "Por mi cuenta significa sin marco, banco de palabras, modelo ni pista. Si abres alguna ayuda después, este intento cuenta como apoyado.")}
    </p>
  </section>`;
}

function feedbackHTML(I, band) {
  const r = S.result;
  if (!r) return "";
  const lines = S.tool === "sentence-architecture" ? [r.message] : r.messages;
  return html`<div
    class="feedback ${r.ok ? "is-right" : "is-hint"}"
    role="status"
    tabindex="-1"
    data-sc-feedback
  >
    <p class="fb-title">
      ${icon(r.ok ? "check" : "bulb")}
      ${r.ok ? I.T("It works.", "Funciona.") : I.T("Not yet. Here is what to fix:", "Todavía no. Esto es lo que hay que arreglar:")}
    </p>
    <ul lang="en">
      ${lines.map((x) => html`<li>${x}</li>`)}
    </ul>
    ${
      S.next
        ? html`<div class="sc-next">
            <p>
              <strong>${I.T("Saved to your path.", "Guardado en tu camino.")}</strong>
              ${I.T(`Your next mission is in ${S.next.domain}.`, `Tu próxima misión es en ${S.next.domainEs}.`)}
            </p>
            <a class="btn btn-primary" data-sc-path href="${BASE}/path?grades=${band}"
              >${I.T("Back to My Language Path", "Volver a Mi camino del lenguaje")}
              ${icon("arrow-right")}</a
            >
            ${S.nextItem ? html`<a class="btn" href="${scaffoldHref(S.tool, band, S.nextItem)}">${I.T("Try another one", "Intentar otra")}</a>` : ""}
          </div>`
        : ""
    }
  </div>`;
}

export async function render(ctx) {
  lastCtx = ctx;
  const I = i18nFor(ctx);
  const band = ctx.band;
  const tool = ctx.route.id;
  if (!TOOLS[tool])
    return {
      title: I.S("Language builders", "Constructores de lenguaje"),
      html: chooserHTML(I, band),
    };
  const requested = new URLSearchParams(location.search).get("item");
  const item = pickItem(tool, band, requested);
  if (!S || S.key !== `${tool}|${item.id}`) {
    const support = conditionFor(readPath(band).dna, TOOLS[tool].domain);
    S = fresh(tool, item, support?.condition || "partial");
  }
  const name = I.T(...TOOLS[tool].name);
  const body = !S.started
    ? startHTML(I)
    : html`<div class="sc-bar">
          <p>
            ${icon("info")}
            <strong>${I.T("My help:", "Mi ayuda:")}</strong> ${condYou(I, S.condition)}
          </p>
          ${S.condition !== "modeled" && !S.finished ? html`<button type="button" class="btn ghost small" data-sc-more>${I.T("Ask for more help", "Pedir más ayuda")}</button>` : ""}
        </div>
        ${showsModel(S.condition) ? modelHTML(I, tool) : ""}
        ${tool === "sentence-architecture" ? sentenceHTML(I, S, item) : tool === "evidence-builder" ? evidenceHTML(I, S, item) : upgradeHTML(I, S, item)}
        ${hintHTML(I, S, item)}
        <div class="sc-actions">
          <button type="button" class="btn btn-primary" data-sc-check>
            ${icon("check")} ${I.T("Check my work", "Revisar mi trabajo")}
          </button>
        </div>
        ${feedbackHTML(I, band)}`;
  return {
    title: I.S(TOOLS[tool].name[0], TOOLS[tool].name[1]),
    html: html`${crumbsHTML(
        [
          [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
          [I.S("My Language Path", "Mi camino del lenguaje"), `${BASE}/path?grades=${band}`],
          [I.S(...TOOLS[tool].name), null],
        ],
        { i18n: I },
      )}
      <div
        class="sc-page"
        data-scaffold="${tool}"
        data-item-id="${item.id}"
        data-condition="${S.condition}"
      >
        <header class="pa-head">
          <p class="eyebrow">
            ${icon(TOOLS[tool].icon)} ${name} ·
            ${I.T(item.use, { Narrate: "Narrar", Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" }[item.use])}
            · <span lang="en">${item.topic}</span>
          </p>
          <h1 tabindex="-1" lang="en">${item.prompt}</h1>
          <p class="sc-target">
            <strong>${I.T("Target:", "Objetivo:")}</strong> <span lang="en">${item.target}</span>
          </p>
        </header>
        ${body}
      </div>`,
  };
}

function signature() {
  if (S.tool === "sentence-architecture") return JSON.stringify(S.placed);
  if (S.tool === "evidence-builder") return JSON.stringify(S.ev);
  return S.text.trim();
}

/** Check the work, show feedback, and record the attempt if the work changed since the last check. */
function check(ctx) {
  const item = S.item;
  let result;
  let text;
  let moves;
  let sourceText = [];
  if (S.tool === "sentence-architecture") {
    result = checkSentence(item, S.placed);
    text = result.text;
    moves = Object.fromEntries(result.results.map((r) => [r.slot, r.ok ? 1 : 0]));
  } else if (S.tool === "evidence-builder") {
    result = checkEvidence(item, S.ev);
    text = result.text;
    sourceText = item.cards.filter((c) => c.supports).map((c) => c.text);
    moves = {
      evidence: result.unsupported.length === 0 && result.missing === 0 ? 1 : 0,
      order: result.orderOk ? 1 : 0,
      connector: result.connectorOk ? 1 : 0,
    };
  } else {
    text = S.text.trim();
    result = checkUpgrade(item, text);
    moves = Object.fromEntries(Object.entries(result.checks).map(([k, v]) => [k, v ? 1 : 0]));
    S.checkedText = text;
  }
  S.result = result;
  const sig = signature();
  if (!text || sig === S.lastSig) return;
  S.lastSig = sig;
  const stage = CONDITIONS.find((c) => c.id === S.condition).ledger;
  const a = analyzeResponse(text, {
    keyUse: item.use,
    stage,
    sourceText,
    wordBank: item.precision || [],
  });
  if (S.tool === "language-upgrade") {
    S.pattern = a.errors.find((x) => x.confidence === "high")?.name || "";
    S.versions = saveVersion(item.id, text);
  }
  const ledger = loadLedger();
  appendEntry(ledger, {
    src: "scaffold",
    task: item.id,
    band: item.band,
    domain: TOOLS[S.tool].domain,
    use: item.use,
    stage,
    kind: S.checks === 0 ? "first" : "revision",
    attempt: S.attemptId,
    supports: { ...S.supports },
    m: {
      ...a.ledger,
      ...(S.tool === "evidence-builder" ? { cites: result.supporting } : {}),
      moves,
      ok: result.ok ? 1 : 0,
      tool: S.tool,
      condition: S.condition,
    },
  });
  saveLedger(ledger);
  S.checks += 1;
  if (result.ok) {
    S.finished = true;
    const next = readPath(ctx.band).mission;
    const ES = { Listening: "Escuchar", Reading: "Leer", Speaking: "Hablar", Writing: "Escribir" };
    S.next = { domain: next.domain, domainEs: ES[next.domain] };
    const others = itemsFor(S.tool, ctx.band).filter((i) => i.id !== item.id);
    S.nextItem =
      others.find((i) => !ledger.entries.some((e) => e.task === i.id && e.m?.ok))?.id ||
      others[0]?.id ||
      null;
  }
}

function place(slotId, ctx) {
  const tile = S.selectedTile;
  if (!tile) {
    if (S.placed[slotId]) delete S.placed[slotId];
  } else {
    for (const [k, v] of Object.entries(S.placed)) if (v === tile) delete S.placed[k];
    S.placed[slotId] = tile;
    S.selectedTile = null;
  }
  S.result = null;
  ctx.rerender();
}

let suppressClick = false;
export function onClick(e, ctx) {
  if (!S) return false;
  // The click a browser fires right after a drop is part of the drag. Keyboard clicks (detail 0) never are.
  if (suppressClick && e.detail > 0) {
    suppressClick = false;
    return true;
  }
  const t = e.target;
  const start = t.closest("[data-sc-start]");
  if (start) {
    S.started = true;
    applyCondition(start.dataset.scStart);
    ctx
      .rerender()
      .then(() =>
        document.querySelector(".sc-work button, .sc-work input, .sc-work textarea")?.focus(),
      );
    return true;
  }
  if (t.closest("[data-sc-more]")) {
    const i = CONDITIONS.findIndex((c) => c.id === S.condition);
    S.supports.more = true;
    applyCondition(CONDITIONS[Math.max(0, i - 1)].id);
    announce(
      i18nFor(ctx).S(
        "More help is open. This try now counts as supported.",
        "Hay más ayuda abierta. Este intento ahora cuenta como apoyado.",
      ),
    );
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-sc-hint]")) {
    S.supports.hint = true;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-sc-check]")) {
    check(ctx);
    ctx.rerender().then(() => document.querySelector("[data-sc-feedback]")?.focus());
    return true;
  }
  if (t.closest("[data-sc-clear]")) {
    S.placed = {};
    S.selectedTile = null;
    S.result = null;
    ctx.rerender();
    return true;
  }
  const tile = t.closest("[data-tile]");
  if (tile) {
    S.selectedTile = S.selectedTile === tile.dataset.tile ? null : tile.dataset.tile;
    ctx.rerender();
    return true;
  }
  const slot = t.closest("[data-slot]");
  if (slot) return (place(slot.dataset.slot, ctx), true);
  const card = t.closest("[data-card]");
  if (card) {
    const id = card.dataset.card;
    S.ev.selected = S.ev.selected.includes(id)
      ? S.ev.selected.filter((x) => x !== id)
      : [...S.ev.selected, id];
    S.result = null;
    ctx.rerender();
    return true;
  }
  const move = t.closest("[data-card-up], [data-card-down]");
  if (move) {
    const id = move.dataset.cardUp || move.dataset.cardDown;
    const list = [...S.ev.selected];
    const i = list.indexOf(id);
    const j = move.dataset.cardUp ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
    S.ev.selected = list;
    S.result = null;
    ctx.rerender();
    return true;
  }
  return false;
}

export function onChange(e, ctx) {
  if (S && e.target.name === "sc-connector") {
    S.ev.connector = e.target.value;
    S.result = null;
    ctx.rerender();
  }
}

export function onInput(e) {
  if (S && e.target.matches("[data-sc-text]")) S.text = e.target.value;
}

// Pointer drag for Sentence Architecture: pick up a tile, drop it on a slot. Tap and keyboard placement
// (choose a tile, then a slot) do the same thing, so dragging is never required.
let drag = null;
function bindDrag() {
  if (bindDrag.done) return;
  bindDrag.done = true;
  document.addEventListener("pointerdown", (e) => {
    const tile = e.target.closest?.(".sc-sentence [data-tile]");
    if (!tile || !S || e.button > 0) return;
    drag = { id: tile.dataset.tile, el: tile, x: e.clientX, y: e.clientY, moving: false };
  });
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moving && Math.hypot(dx, dy) < 8) return;
    drag.moving = true;
    drag.el.classList.add("is-dragging");
    drag.el.style.transform = `translate(${dx}px, ${dy}px)`;
    document.querySelectorAll(".sc-slot.is-target").forEach((s) => s.classList.remove("is-target"));
    document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest?.("[data-slot]")
      ?.classList.add("is-target");
  });
  const end = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moving) return;
    d.el.classList.remove("is-dragging");
    d.el.style.transform = "";
    suppressClick = true;
    // A post-drop click is dispatched in the same task as pointerup, so it never outlives this timeout.
    setTimeout(() => (suppressClick = false), 0);
    const slot =
      e.type === "pointerup"
        ? document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-slot]")
        : null;
    if (slot && lastCtx) {
      S.selectedTile = d.id;
      place(slot.dataset.slot, lastCtx);
    } else lastCtx?.rerender();
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
}

export function mount() {
  bindDrag();
}
