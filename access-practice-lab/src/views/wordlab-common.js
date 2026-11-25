// Word Lab (/wordlab) shared pieces: saved state, content access, word cards and evidence.
import { FALSE_FRIENDS, MORPHEMES } from "../content/wordlab-lab.js";
import { WORDS } from "../content/wordlab-words.js";
import { collectWord, kindOfWord, wordsForBand } from "../lang/wordlab.js";
import { depthOf } from "../lang/wordlab-depth.js";
import { noteWords } from "../lang/word-encounters.js";
import { BASE, esc, html, icon, raw } from "../util.js";
import {
  bandFor,
  levelOf,
  loadState,
  recordEvidence,
  saveState,
  speakBtn,
  studioHref,
} from "./studio-kit.js";

export const WL_KEY = "accessPracticeLab:v1:wordlab";

/** One Language Lens encounter for a Word Lab word (src/lang/word-encounters.js). A failed write never blocks the learner. */
export const lensNote = (id, mode, opts = {}) => {
  const w = WORDS.find((x) => x.id === id)?.w;
  return w ? noteWords([w], { src: "wordlab", mode, ...opts }) : false;
};
export const WL_DEFAULT = {
  level: "B",
  garden: {},
  frayer: {},
  build: { done: [], helped: [] },
  cog: { done: {} },
  fam: { done: {} },
  det: { done: {} },
  network: {},
  ev: {},
};
export const wlState = () => {
  const s = loadState(WL_KEY, WL_DEFAULT);
  for (const k of ["garden", "frayer", "build", "cog", "fam", "det", "network", "ev"])
    if (!s[k] || typeof s[k] !== "object") s[k] = structuredClone(WL_DEFAULT[k]);
  return s;
};
export const wlSave = (s) => saveState(WL_KEY, s);

export { FALSE_FRIENDS, MORPHEMES, WORDS };
export const bandWords = (band) => wordsForBand(WORDS, bandFor(band));
export const wlHref = (path, band) => studioHref("wordlab", path, band);

/** Spanish shown beside English when the language mode is Spanish or bilingual, or at support level A. */
export const showEs = (I, level) => I.mode !== "en" || level === "A";
export const gloss = (I, level, es, cls = "wl-es") =>
  showEs(I, level) && es ? html`<span class="${cls}" lang="es">${es}</span>` : "";

export const TWIN_LABEL = {
  twin: ["Spanish twin", "Gemela en español", "check"],
  catch: ["Look-alike with a catch", "Parecida, con trampa", "alert"],
  none: ["No look-alike", "Sin parecida", "x"],
};
export const SUBJECT_ICON = { ela: "reading", math: "tools", sci: "detective", ss: "worlds" };

/** One word card: the word, meaning, example, Hear it buttons, the Spanish side and a garden toggle. */
export function wordCardHTML(w, I, level, st, band) {
  const collected = Boolean(st.garden[w.id]);
  const kind = kindOfWord(w);
  const [tEn, tEs, tIco] = TWIN_LABEL[kind];
  return html`<article class="wl-card wl-subj-${w.s}" aria-labelledby="${w.id}-t">
    <header>
      <h3 id="${w.id}-t">${w.w} <span class="wl-pos">${w.pos}</span></h3>
      <span class="wl-tier" title="${I.S("Tier", "Nivel de palabra")}"
        >${icon(SUBJECT_ICON[w.s])}
        ${I.T(w.t === 3 ? "Subject word" : "Everywhere word", w.t === 3 ? "Palabra de la materia" : "Palabra de todas partes")}</span
      >
    </header>
    <p class="wl-def">${w.d}</p>
    ${gloss(I, level, w.de)}
    <p class="wl-ex">${w.x}</p>
    ${gloss(I, level, w.xe)}
    ${
      I.mode !== "en" || level === "A"
        ? html`<p class="wl-twin is-${kind}">
              <span class="wl-chip">${icon(tIco)} ${I.T(tEn, tEs)}</span>
              <span lang="es">${w.e}</span>
            </p>
            ${w.n ? html`<p class="wl-warn" role="note">${icon("alert")} ${I.T(w.n, w.ne)}</p>` : ""}`
        : ""
    }
    ${deepHTML(w, I, level)}
    <div class="wl-actions">
      ${speakBtn(I, w.w, I.S(`Hear ${w.w}`, `Escuchar ${w.w}`))}
      <button
        type="button"
        class="btn small sk-say"
        data-say="${w.x}"
        aria-label="${I.S("Hear the sentence", "Escuchar la oración")}"
      >
        ${icon("volume")} <span>${I.T("Sentence", "Oración")}</span>
      </button>
      <button type="button" class="btn small" data-wl-collect="${w.id}" aria-pressed="${String(collected)}">
        ${icon(collected ? "check" : "bookmark")}
        <span
          >${collected ? I.T("In my garden", "En mi jardín") : I.T("Plant in my garden", "Plantar en mi jardín")}</span
        >
      </button>
      <a class="btn small" href="${wlHref(`frayer/${w.id}`, band)}"
        >${icon("writing")} <span>${I.T("Frayer card", "Tarjeta Frayer")}</span></a
      >
    </div>
  </article>`;
}

/** What the word is NOT, the phrases it travels in, related words and a second meaning. Native <details>, so it works from the keyboard. */
export function deepHTML(w, I, level) {
  const d = depthOf(w);
  const rows = [];
  if (d.no)
    rows.push(
      html`<p><b>${I.T("Not this:", "No es esto:")}</b> ${d.no}${gloss(I, level, d.noe)}</p>`,
    );
  if (d.col?.length)
    rows.push(html`<p><b>${I.T("Goes with:", "Se usa con:")}</b> ${d.col.join(" · ")}</p>`);
  if (d.syn?.length)
    rows.push(
      html`<p>
        <b>${I.T("Close in meaning:", "Parecida en significado:")}</b> ${d.syn.join(", ")}
      </p>`,
    );
  if (d.ant?.length)
    rows.push(html`<p><b>${I.T("Opposite:", "Opuesta:")}</b> ${d.ant.join(", ")}</p>`);
  if (d.mm)
    rows.push(
      html`<p>
        <b>${I.T("Another meaning:", "Otro significado:")}</b> ${d.mm[0]}. <i>${d.mm[1]}</i>
      </p>`,
    );
  if (!rows.length) return "";
  return html`<details class="wl-deep">
    <summary>${icon("search")} ${I.T("Go deeper", "Profundizar")}</summary>
    ${rows}
  </details>`;
}

/** Evidence at the end of a round. Counts and ids only; at most one entry per task per day. */
export function wlEvidence(st, ctx, task, m, opened = {}, use = "Explain") {
  const stamp = `${task}:${new Date().toISOString().slice(0, 10)}`;
  if (st.ev[stamp]) return null;
  st.ev[stamp] = 1;
  const keys = Object.keys(st.ev);
  if (keys.length > 120) for (const k of keys.slice(0, keys.length - 120)) delete st.ev[k];
  return recordEvidence({
    src: "wordlab",
    task,
    band: bandFor(ctx.band),
    domain: "Reading",
    use,
    level: levelOf(st),
    opened,
    m,
  });
}

/** Tile for the morpheme builder, with its meaning when support shows it. */
export const morphemeOf = (f) =>
  MORPHEMES.find((m) => m.f === f) || { f, m: "", me: "", k: "root" };
export const attrs = (obj) =>
  raw(
    Object.entries(obj)
      .map(([k, v]) => `${k}="${esc(v)}"`)
      .join(" "),
  );
export { BASE };

/** Plants a word in the garden once; it keeps its history if it is already there. */
export const collectOnce = (st, id) => collectWord(st, id);
