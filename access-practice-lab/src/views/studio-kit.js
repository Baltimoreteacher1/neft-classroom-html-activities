// Shared pieces for the three publishing studios (Word Lab /wordlab, Real-Life Scenarios /scenarios, Newsroom /newsroom):
// saved state on this device, the A/B/C support chooser, evidence into the ledger, header and card markup, and one
// drag-and-drop attachment helper. Every drag has a keyboard and tap alternative in the studio that uses it.
import { crumbsHTML } from "../components.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { BASE, html, icon, raw, safeJson, storage } from "../util.js";

export const LEVELS = ["A", "B", "C"];
/** Support given at each level. "On my own" (C) opens nothing, so its evidence can be independent. */
export const LEVEL_SUPPORTS = {
  A: { frames: true, bank: true, model: true, l1: true },
  B: { frames: true },
  C: {},
};
export const LEVEL_COPY = {
  A: ["More support", "Más apoyo", "Hints, frames, a model and Spanish help are open."],
  B: ["Some support", "Algo de apoyo", "Sentence frames are open. Hints stay closed."],
  C: [
    "On my own",
    "Por mi cuenta",
    "No hints or frames. Open help any time; it is marked as help.",
  ],
};
export const levelOf = (state) => (LEVELS.includes(state?.level) ? state.level : "B");
export const bandFor = (band) => (band === "3-5" ? "3-5" : "6-8");
export const bandLabel = (band, I) =>
  band === "3-5" ? I.T("Grades 3–5", "Grados 3–5") : I.T("Grades 6–8", "Grados 6–8");

export function loadState(key, fallback = {}) {
  const v = safeJson(storage.get(key), null);
  const base = structuredClone(fallback);
  return v && typeof v === "object" && !Array.isArray(v) ? { ...base, ...v } : base;
}
export const saveState = (key, state) => storage.set(key, JSON.stringify(state));

/** A support is "used" when the learner opened it at a level that did not open it for them, or the level opens it. */
export function supportsFor(level, opened = {}) {
  return { ...LEVEL_SUPPORTS[level], ...opened };
}

/**
 * One piece of evidence in the shared ledger: ids and counts only, never learner text. `opened` lists supports the
 * learner opened on their own (hint, bank, ...); the ledger turns any used support into "supported".
 */
export function recordEvidence({
  src,
  task,
  band,
  domain,
  use = "Inform",
  level = "B",
  opened = {},
  kind = "first",
  m = {},
}) {
  const ledger = loadLedger();
  const entry = appendEntry(ledger, {
    src,
    task,
    band,
    domain,
    use,
    kind,
    stage: level === "C" ? "independent" : "supported",
    supports: supportsFor(level, opened),
    m,
    feedbackSource: "local-rule",
    confidence: 0.6,
  });
  saveLedger(ledger);
  return entry;
}

/** The A/B/C chooser. `attr` is the data attribute the studio's click handler listens for. */
export function levelPickerHTML(I, level, attr = "data-sk-level", compact = false) {
  return html`<fieldset
    class="sk-levels ${compact ? "is-compact" : ""}"
    role="radiogroup"
    aria-label="${I.S("How much support?", "¿Cuánto apoyo?")}"
  >
    <legend>${I.T("How much support?", "¿Cuánto apoyo?")}</legend>
    ${LEVELS.map((l) => {
      const [en, es, note] = LEVEL_COPY[l];
      return html`<button
        type="button"
        class="sk-level ${l === level ? "is-on" : ""}"
        ${raw(attr)}="${l}"
        role="radio"
        aria-checked="${String(l === level)}"
      >
        <strong>${l}</strong> <span>${I.T(en, es)}</span>
      </button>`;
    })}
    ${compact ? "" : html`<p class="fine">${I.T(LEVEL_COPY[level][2], levelNoteEs(level))}</p>`}
  </fieldset>`;
}
const levelNoteEs = (l) =>
  ({
    A: "Las pistas, los marcos, un modelo y la ayuda en español están abiertos.",
    B: "Los marcos de oraciones están abiertos. Las pistas siguen cerradas.",
    C: "Sin pistas ni marcos. Abre ayuda cuando quieras; se marca como ayuda.",
  })[l];

export const studioHref = (studio, path, band) =>
  `${BASE}/${studio}${path ? `/${path}` : ""}?grades=${band}`;

export function studioCrumbs(I, band, studio, title, here = null) {
  const items = [
    [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
    [title, here ? studioHref(studio, "", band) : null],
  ];
  if (here) items.push([here, null]);
  return crumbsHTML(items, { i18n: I });
}

/** Studio header: kicker, title, lead and an art slot. */
export function studioHero({ I, kicker, title, lead, art, ico, cls = "" }) {
  return html`<header class="sk-hero ${cls}">
    <div class="sk-hero-copy">
      <p class="eyebrow">${icon(ico)} ${kicker}</p>
      <h1 tabindex="-1">${title}</h1>
      <p class="lead">${lead}</p>
    </div>
    <div class="sk-hero-art" aria-hidden="true">${art}</div>
  </header>`;
}

/** A tab-like row of links between a studio's modes. */
export function modeNavHTML(I, items, current, aria) {
  return html`<nav class="sk-modes" aria-label="${aria}">
    ${items.map(([id, label, href, ico]) => html`<a class="sk-mode ${id === current ? "is-on" : ""}" href="${href}" ${id === current ? html`aria-current="page"` : ""}>${icon(ico)} ${label}</a>`)}
  </nav>`;
}

export function speakBtn(I, text, label = null, es = false) {
  const attr = es ? "data-say-es" : "data-say";
  return html`<button
    type="button"
    class="btn small sk-say"
    ${raw(attr)}="${text}"
    aria-label="${label || I.S("Hear it", "Escucharlo")}"
  >
    ${icon("volume")} <span>${I.T("Hear it", "Escúchalo")}</span>
  </button>`;
}

const attached = new WeakMap();
/**
 * Native drag-and-drop on the persistent #app root. `handlers` = { start(el, e), drop(zoneEl, e, dragEl) } and is
 * replaced on every mount; pass null on unmount. The click path in each studio is the keyboard and touch alternative.
 */
export function useDrag(root, handlers) {
  if (!root) return;
  let rec = attached.get(root);
  if (!rec) {
    rec = { handlers: null, drag: null };
    attached.set(root, rec);
    root.addEventListener("dragstart", (e) => {
      const el = e.target.closest?.("[data-drag]");
      if (!el || !rec.handlers) return;
      rec.drag = el;
      e.dataTransfer?.setData("text/plain", el.dataset.drag);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });
    root.addEventListener("dragover", (e) => {
      if (rec.drag && e.target.closest?.("[data-drop]")) e.preventDefault();
    });
    root.addEventListener("drop", (e) => {
      const zone = e.target.closest?.("[data-drop]");
      if (!zone || !rec.drag || !rec.handlers) return;
      e.preventDefault();
      rec.handlers.drop(zone, e, rec.drag);
      rec.drag = null;
    });
    root.addEventListener("dragend", () => {
      rec.drag = null;
    });
  }
  rec.handlers = handlers;
}

export const todayISO = () => new Date().toISOString();

let pointerDown = false;
let pendingRender = null;
if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", () => (pointerDown = true), true);
  document.addEventListener("pointercancel", () => (pointerDown = false), true);
  document.addEventListener("keydown", () => (pointerDown = false), true);
  document.addEventListener(
    "click",
    () => {
      pointerDown = false;
      const c = pendingRender;
      pendingRender = null;
      if (c) setTimeout(() => c.rerender(), 0);
    },
    true,
  );
}
/**
 * Re-render after a text field's change event, without eating the click that caused it. Pressing a button blurs the
 * field first (mousedown, blur, change); replacing the page at that moment loses the click. While a pointer is down the
 * redraw waits for the click that follows.
 */
export function renderAfterChange(ctx) {
  if (pointerDown) pendingRender = ctx;
  else ctx.rerender();
}
