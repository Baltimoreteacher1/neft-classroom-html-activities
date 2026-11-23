// Word Quest — a small illustrated map. Each region holds one word and two challenges: one about what the word
// MEANS and one about USING it in context. Both must be cleared to open the next region, so the map cannot be
// finished by recognising a word alone. Retry and hints are always free. The run is saved between visits.
import { available, buildQuestion, newMc } from "./questions.js";
import { themedOrder } from "./data.js";
import { glide, mem, motionOK, rectOf } from "./stage-a.js";
import {
  choicesHTML,
  hintButton,
  html,
  icon,
  mcAct,
  mcFeedback,
  mountGame,
  raw,
  stemHTML,
} from "./kit.js";

export const TITLE = ["Word Quest", "Aventura de palabras"];

export const REGIONS = [
  ["Whisper Woods", "Bosque Susurro"],
  ["Clue Creek", "Arroyo de las Pistas"],
  ["Meaning Meadow", "Pradera del Significado"],
  ["Echo Hills", "Colinas del Eco"],
  ["Sentence Shore", "Costa de las Oraciones"],
  ["Lantern Pass", "Paso del Farol"],
  ["Story Summit", "Cumbre del Cuento"],
  ["Harbor of Words", "Puerto de las Palabras"],
];
const MEANING = {
  early: ["picture", "word-def", "def-word"],
  other: ["word-def", "def-word", "syn", "ant"],
};
const APPLY = ["cloze", "misuse-yn", "misuse-pick"];
const MAX_REGIONS = 8;
const MIN_REGIONS = 3;

/** Pure engine: up to eight regions, each with a meaning question and an application question (dim ctx). */
export function buildQuest(pool, rng) {
  const order = themedOrder(pool);
  const pickWords = order.length > MAX_REGIONS ? rng.shuffle(order).slice(0, MAX_REGIONS) : order;
  const rank = new Map(order.map((w, i) => [w.id, i]));
  pickWords.sort((a, b) => rank.get(a.id) - rank.get(b.id));
  const prefer = pool.band === "early" ? MEANING.early : MEANING.other;
  const regions = [];
  for (const word of pickWords) {
    const types = available(word, pool);
    const meaningType = rng.shuffle(prefer.filter((t) => types.includes(t)))[0];
    const applyType = rng.shuffle(APPLY.filter((t) => types.includes(t)))[0];
    if (!meaningType || !applyType) continue;
    const m = buildQuestion(meaningType, word, pool, rng, { variant: 1 });
    const a = buildQuestion(applyType, word, pool, rng, { variant: 1 });
    if (!m || !a) continue;
    const i = regions.length;
    m.id = `quest-${i + 1}-meaning`;
    a.id = `quest-${i + 1}-apply`;
    regions.push({
      i,
      wordId: word.id,
      glyph: word.visual?.glyphs?.[0] || "★",
      qs: [m, a],
      mcs: [newMc(), newMc()],
      step: 0,
      cleared: false,
    });
  }
  return { regions: regions.length >= MIN_REGIONS ? regions : [], open: -1 };
}

/** Where region i sits on the map, as percentages of the map box. Alternates high and low along a winding path. */
export function nodePosition(i, n) {
  const x = n === 1 ? 50 : 9 + (82 * i) / (n - 1);
  const y = [64, 30, 68, 34, 62, 28, 66, 32][i % 8];
  return { x: Math.round(x * 10) / 10, y };
}
export const regionUnlocked = (s, i) => i === 0 || s.regions[i - 1].cleared;
/** One small painted scene per region theme (woods, creek, meadow, hills, shore, pass, summit, harbor). Decoration only. */
const SCENES = [
  '<path d="M8 40 L20 12 L32 40Z M26 40 L38 6 L50 40Z M44 40 L54 18 L64 40Z"/>',
  '<path d="M4 18 q8 -8 16 0 t16 0 t16 0 t16 0 M4 30 q8 -8 16 0 t16 0 t16 0 t16 0 M4 42 q8 -8 16 0 t16 0 t16 0 t16 0" class="vga-stroke"/>',
  '<circle cx="14" cy="22" r="6"/><circle cx="34" cy="14" r="6"/><circle cx="54" cy="24" r="6"/><path d="M14 28v14M34 20v22M54 30v12" class="vga-stroke"/>',
  '<path d="M0 42 Q16 8 34 42Z M26 42 Q46 4 68 42Z"/>',
  '<path d="M4 34 q8 -7 16 0 t16 0 t16 0 t16 0 V44 H4Z"/><path d="M40 28 a14 14 0 0 1 24 0Z M52 28V12" class="vga-stroke"/>',
  '<path d="M26 8 h16 l-3 8 h-10Z M28 16 h12 v22 h-12Z M24 40 h20 v4 h-20Z"/><path d="M34 22v10" class="vga-stroke vga-glow-line"/>',
  '<path d="M2 44 L26 10 L40 30 L50 20 L66 44Z"/><path d="M26 10 V0 l12 4 l-12 4" class="vga-stroke"/>',
  '<path d="M10 34 h46 l-8 10 h-30Z M33 6 V34 M33 8 L52 28 H33Z"/><path d="M2 46 q8 -6 16 0 t16 0 t16 0 t16 0" class="vga-stroke"/>',
];
const sceneSvg = (k) =>
  `<svg viewBox="0 0 68 48" focusable="false" aria-hidden="true">${SCENES[k % SCENES.length]}</svg>`;
const travellerSvg =
  '<svg viewBox="0 0 34 44" focusable="false" aria-hidden="true"><circle cx="17" cy="9" r="7" class="vga-t-head"/><path d="M6 42 V26 q0 -9 11 -9 t11 9 V42Z" class="vga-t-body"/><path d="M26 20 V4 l-8 4 l8 4" class="vga-t-flag"/></svg>';

/** Index of the region the traveller stands at: the first one not yet cleared (the last one when all are). */
export const travellerAt = (s) => {
  const k = s.regions.findIndex((r) => !r.cleared);
  return k < 0 ? s.regions.length - 1 : k;
};

const STEP_LABEL = [
  ["Challenge 1 of 2: what the word means", "Reto 1 de 2: qué significa la palabra"],
  ["Challenge 2 of 2: use it in context", "Reto 2 de 2: úsala en contexto"],
];

function mapView(s, env) {
  const I = env.I;
  const n = s.regions.length;
  const pts = s.regions.map((r) => nodePosition(r.i, n));
  const toXY = (p) => `${(p.x * 6).toFixed(0)} ${(p.y * 2.6).toFixed(0)}`;
  const path = pts.map((p, k) => `${k ? "L" : "M"}${toXY(p)}`).join(" ");
  const here = travellerAt(s);
  const walked = pts
    .slice(0, here + 1)
    .map((p, k) => `${k ? "L" : "M"}${toXY(p)}`)
    .join(" ");
  const art = `<svg class="vag-map-art" viewBox="0 0 600 260" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect width="600" height="260" class="vag-map-sky"/>
    <path d="M30 52 q14 -16 30 -4 q12 -12 30 0 q16 0 14 12 H22 q-6 -4 8 -8Z M330 34 q14 -14 30 -3 q14 -10 28 2 q14 2 10 12 H322 q-4 -6 8 -11Z" class="vga-cloud"/>
    <path d="M0 200 Q90 150 180 190 T360 180 T600 170 V260 H0Z" class="vag-map-hill"/>
    <path d="M0 232 Q140 205 300 228 T600 214 V260 H0Z" class="vag-map-hill2"/>
    <path d="${path}" class="vag-map-path" vector-effect="non-scaling-stroke"/>
    <path d="${walked}" class="vga-walked" vector-effect="non-scaling-stroke"/>
    <circle cx="540" cy="36" r="16" class="vag-map-sun"/>
    <path d="M60 110 l10 -26 l10 26z M82 116 l9 -22 l9 22z" class="vag-map-tree"/>
    <path d="M470 120 q10 -14 20 0 q10 -14 20 0" class="vag-map-wave"/></svg>`;
  const nodes = s.regions.map((r, k) => {
    const open = regionUnlocked(s, k);
    const name = I.S(...REGIONS[k]);
    const status = r.cleared
      ? I.S("cleared", "superada")
      : open
        ? r.step || r.mcs[0].done
          ? I.S("in progress", "en curso")
          : I.S("ready", "lista")
        : I.S(
            "locked until the region before it is cleared",
            "bloqueada hasta superar la anterior",
          );
    const p = pts[k];
    return html`<li
      class="vag-node"
      style="left:${p.x}%;top:${p.y}%"
      data-state="${r.cleared ? "cleared" : open ? "open" : "locked"}"
      data-scene="${k % SCENES.length}"
    >
      <span class="vga-scene" aria-hidden="true">${raw(sceneSvg(k))}</span>
      <button
        type="button"
        class="vag-node-btn"
        data-region="${k}"
        data-fk="region-${k}"
        data-rv
        ${k === 0 ? "data-rv-cur" : ""}
        aria-label="${I.S("Region", "Región")} ${k + 1} ${I.S("of", "de")} ${n}: ${name}, ${status}"
        aria-disabled="${open && !r.cleared ? "false" : "true"}"
      >
        <span class="vag-node-glyph" aria-hidden="true"
          >${r.cleared ? icon("check") : open ? r.glyph : icon("lock")}</span
        >
      </button>
      ${k === here ? html`<span class="vga-trav-inline" aria-hidden="true">${raw(travellerSvg)}</span>` : ""}
      <span class="vag-node-label" aria-hidden="true">${k + 1}. ${I.T(...REGIONS[k])}</span>
    </li>`;
  });
  const left = s.regions.filter((r) => !r.cleared).length;
  const cards = s.regions
    .filter((r) => r.cleared)
    .map((r) => {
      const w = env.pool.byId.get(r.wordId);
      if (!w) return "";
      return html`<li class="vga-postcard" data-region-card="${r.i}" data-scene="${r.i % SCENES.length}">
        <span class="vga-stamp-corner" aria-hidden="true">${raw(sceneSvg(r.i))}</span>
        <span class="vga-pc-place">${I.T(...REGIONS[r.i])}</span>
        <strong class="vga-pc-word" lang="en">${w.hw}</strong>
        <span class="vga-pc-def">${w.def}</span>
        ${env.gloss(w)}
      </li>`;
    });
  return html`<p class="vag-prompt">
      ${I.T("Choose the next open region. Clear its two challenges to light the way forward.", "Elige la siguiente región abierta. Supera sus dos retos para abrir el camino.")}
    </p>
    <div class="vag-map" role="group" aria-label="${I.S("Quest map", "Mapa de la aventura")}">
      ${raw(art)}
      <ol class="vag-map-nodes" data-rove data-cols="0">
        ${nodes}
      </ol>
      <span class="vga-traveller" aria-hidden="true" data-at="${here}" style="left:${pts[here].x}%;top:${pts[here].y}%">${raw(travellerSvg)}</span>
    </div>
    <p class="vga-where">${icon("pin")}<span>${left ? I.T(`Your traveller is at ${REGIONS[here][0]}.`, `Tu viajero está en ${REGIONS[here][1]}.`) : I.T("Your traveller reached the end of the map.", "Tu viajero llegó al final del mapa.")}</span></p>
    <p class="vag-fine">${I.T(`${left} regions left.`, `Quedan ${left} regiones.`)}</p>
    ${
      cards.length
        ? html`<section class="vga-postcards" aria-label="${I.S("Postcards from your trip", "Postales de tu viaje")}">
            <h3 class="vga-pc-h">${icon("star")}${I.T("Postcards from your trip", "Postales de tu viaje")}</h3>
            <ul class="vga-pc-list">${cards}</ul>
          </section>`
        : ""
    }`;
}
function regionView(s, env) {
  const I = env.I;
  const r = s.regions[s.open];
  const q = r.qs[Math.min(r.step, 1)];
  const mc = r.mcs[Math.min(r.step, 1)];
  const last = r.step === 1;
  return html`<div class="vag-qcard vga-region" data-type="${q.type}" data-scene="${s.open % SCENES.length}">
    <div class="vga-region-band" aria-hidden="true">
      <span class="vga-scene">${raw(sceneSvg(s.open))}</span>
      <span class="vga-lights"><i class="${r.step >= 0 ? "is-on" : ""}"></i><i class="${r.step >= 1 ? "is-on" : ""}"></i></span>
    </div>
    <p class="vag-qtype">
      <strong>${I.T(...REGIONS[s.open])}</strong> · ${I.T(...STEP_LABEL[r.step])}
    </p>
    ${stemHTML(q, env)}${choicesHTML(q, mc, env)}
    <div class="vag-actions">
      ${hintButton(mc, env)}
      ${mc.done ? html`<button type="button" class="btn btn-primary" data-next-step data-fk="next" data-autofocus>${last ? I.T("Clear this region", "Superar esta región") : I.T("Next challenge", "Siguiente reto")}${icon("arrow-right")}</button>` : ""}
      <button type="button" class="btn small" data-back-map data-fk="back">
        ${icon("arrow-left")}${I.T("Back to the map", "Volver al mapa")}
      </button>
    </div>
    ${mcFeedback(q, mc, env)}
  </div>`;
}

const spec = {
  id: "word-quest",
  title: TITLE,
  persist: true,
  howTo: [
    [
      "The map has regions in a row. Only the first one is open. Choose it.",
      "El mapa tiene regiones en fila. Solo la primera está abierta. Elígela.",
    ],
    [
      "Each region has two challenges: one about what a word means, one about using it in a sentence.",
      "Cada región tiene dos retos: uno sobre el significado y otro sobre usar la palabra en una oración.",
    ],
    [
      "Pick an answer. If it is not right, pick another. Hints are always free.",
      "Elige una respuesta. Si no es correcta, elige otra. Las pistas son gratis.",
    ],
    [
      "Clear both challenges to open the next region. You can leave and come back. The map remembers.",
      "Supera los dos retos para abrir la siguiente región. Puedes salir y volver. El mapa se acuerda.",
    ],
  ],
  keys: [
    ["Arrow keys", ["move between regions", "moverse entre regiones"]],
    ["Enter", ["open a region", "abrir una región"]],
    ["1 to 4", ["choose that answer", "elegir esa respuesta"]],
  ],
  build(env) {
    return buildQuest(env.pool, env.rng);
  },
  valid: (s) => Array.isArray(s?.regions) && s.regions.length >= MIN_REGIONS,
  unplayable: (s) => !s.regions.length,
  isDone: (s) => s.regions.every((r) => r.cleared),
  progress: (s) => ({ done: s.regions.filter((r) => r.cleared).length, total: s.regions.length }),
  view: (s, env) => (s.open < 0 ? mapView(s, env) : regionView(s, env)),
  click(el, s, env) {
    if (s.open < 0) {
      const b = el.closest("[data-region]");
      if (!b) return false;
      const k = Number(b.dataset.region);
      const r = s.regions[k];
      if (!r || r.cleared || !regionUnlocked(s, k)) {
        env.say(
          env.I.S(
            "That region is locked. Clear the one before it first.",
            "Esa región está bloqueada. Supera primero la anterior.",
          ),
        );
        return false;
      }
      s.open = k;
      return true;
    }
    const r = s.regions[s.open];
    if (el.closest("[data-back-map]")) {
      s.open = -1;
      return true;
    }
    if (el.closest("[data-next-step]")) {
      const mc = r.mcs[Math.min(r.step, 1)];
      if (!mc.done) return false;
      if (r.step === 0) r.step = 1;
      else {
        r.cleared = true;
        s.open = -1;
        env.say(env.I.S("Region cleared.", "Región superada."));
      }
      return true;
    }
    const idx = Math.min(r.step, 1);
    return mcAct(el, r.qs[idx], r.mcs[idx], env, { kind: r.qs[idx].type });
  },
  /** Decoration only: the traveller walks to the next region, and a new postcard drops onto the pile. */
  after(body, s, env) {
    if (s.open >= 0 || !body.querySelector(".vga-traveller")) return;
    const m = mem(env);
    const at = travellerAt(s);
    const t = body.querySelector(".vga-traveller");
    if (typeof m.at === "number" && m.at !== at && motionOK()) {
      const from = nodePosition(m.at, s.regions.length);
      const to = nodePosition(at, s.regions.length);
      t.style.transition = "none";
      t.style.left = `${from.x}%`;
      t.style.top = `${from.y}%`;
      void t.offsetWidth;
      t.style.transition = "";
      t.style.left = `${to.x}%`;
      t.style.top = `${to.y}%`;
      t.classList.add("is-walking");
      t.addEventListener("transitionend", () => t.classList.remove("is-walking"), { once: true });
    }
    m.at = at;
    const cleared = s.regions.filter((r) => r.cleared).length;
    if (typeof m.cleared === "number" && cleared > m.cleared && motionOK()) {
      const card = body.querySelector(".vga-postcard:last-child");
      card?.classList.add("is-new");
      const node = body.querySelector(`.vag-node[data-state="cleared"]:nth-child(${cleared}) .vag-node-btn`);
      glide(env.I.S("Postcard", "Postal"), rectOf(node), rectOf(card), { ms: 640, tone: "card" });
    }
    m.cleared = cleared;
  },
  extra: (s) => ({
    regionsCleared: s.regions.filter((r) => r.cleared).length,
    regions: s.regions.length,
  }),
  finishExtra: (s, env) =>
    html`<p class="vag-fine">
      ${env.I.T("Every region on the map is cleared.", "Todas las regiones del mapa están superadas.")}
    </p>`,
};

export default {
  id: "word-quest",
  title: TITLE[0],
  titleEs: TITLE[1],
  blurb:
    "Travel a small map. Each region asks what a word means and how to use it, and opens the next.",
  blurbEs: "Recorre un mapa pequeño. Cada región pregunta qué significa una palabra y cómo se usa.",
  purpose: "Show you know what a word means and can use it in context, word by word.",
  minGrade: "K",
  maxGrade: "12",
  dims: ["mean", "rec", "ctx"],
  mount: (root, opts) => mountGame(root, opts, spec),
  engine: { build: buildQuest, position: nodePosition, unlocked: regionUnlocked },
};
