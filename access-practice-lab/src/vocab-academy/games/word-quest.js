// Word Quest — a small illustrated map. Each region holds one word and two challenges: one about what the word
// MEANS and one about USING it in context. Both must be cleared to open the next region, so the map cannot be
// finished by recognising a word alone. Retry and hints are always free. The run is saved between visits.
import { available, buildQuestion, newMc } from "./questions.js";
import { themedOrder } from "./data.js";
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
const STEP_LABEL = [
  ["Challenge 1 of 2: what the word means", "Reto 1 de 2: qué significa la palabra"],
  ["Challenge 2 of 2: use it in context", "Reto 2 de 2: úsala en contexto"],
];

function mapView(s, env) {
  const I = env.I;
  const n = s.regions.length;
  const pts = s.regions.map((r) => nodePosition(r.i, n));
  const path = pts
    .map((p, k) => `${k ? "L" : "M"}${(p.x * 6).toFixed(0)} ${(p.y * 2.6).toFixed(0)}`)
    .join(" ");
  const art = `<svg class="vag-map-art" viewBox="0 0 600 260" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect width="600" height="260" class="vag-map-sky"/>
    <path d="M0 200 Q90 150 180 190 T360 180 T600 170 V260 H0Z" class="vag-map-hill"/>
    <path d="M0 232 Q140 205 300 228 T600 214 V260 H0Z" class="vag-map-hill2"/>
    <path d="${path}" class="vag-map-path"/>
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
    >
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
      <span class="vag-node-label" aria-hidden="true">${k + 1}. ${I.T(...REGIONS[k])}</span>
    </li>`;
  });
  const left = s.regions.filter((r) => !r.cleared).length;
  return html`<p class="vag-prompt">
      ${I.T("Choose the next open region. Clear its two challenges to light the way forward.", "Elige la siguiente región abierta. Supera sus dos retos para abrir el camino.")}
    </p>
    <div class="vag-map" role="group" aria-label="${I.S("Quest map", "Mapa de la aventura")}">
      ${raw(art)}
      <ol class="vag-map-nodes" data-rove data-cols="0">
        ${nodes}
      </ol>
    </div>
    <p class="vag-fine">${I.T(`${left} regions left.`, `Quedan ${left} regiones.`)}</p>`;
}
function regionView(s, env) {
  const I = env.I;
  const r = s.regions[s.open];
  const q = r.qs[Math.min(r.step, 1)];
  const mc = r.mcs[Math.min(r.step, 1)];
  const last = r.step === 1;
  return html`<div class="vag-qcard" data-type="${q.type}">
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
