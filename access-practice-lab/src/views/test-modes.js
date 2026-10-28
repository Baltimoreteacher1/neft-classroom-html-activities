// Practice-test modes: what Guided Practice and Independent Rehearsal each allow, plus the language
// helpers the practice-test views share. The mode choice itself renders in views/test-report.js.
import { html, raw, toHtml } from "../util.js";

/** What each mode allows. Guided supports are never rendered in Independent Rehearsal. */
export const MODES = Object.freeze({
  guided: Object.freeze({ id: "guided", label: "Guided Practice Mode", results: "Supported Practice", timer: false, singlePassAudio: false, frames: true, wordBank: true, lookback: true, rationales: true, retry: true, flagging: true, sectionReview: true }),
  independent: Object.freeze({ id: "independent", label: "Independent Rehearsal Mode", results: "Independent Rehearsal", timer: true, singlePassAudio: true, frames: false, wordBank: false, lookback: false, rationales: false, retry: false, flagging: true, sectionReview: true }),
});
/** Mode names as [English, Español] pairs: `label` (long), `name` (short), `results`, `tag`. */
export const MODE_TEXT = Object.freeze({
  guided: {
    label: ["Guided Practice Mode", "Modo de práctica guiada"],
    name: ["Guided Practice", "Práctica guiada"],
    results: ["Supported Practice", "Práctica con apoyos"],
    tag: ["Supports on", "Con apoyos"],
  },
  independent: {
    label: ["Independent Rehearsal Mode", "Modo de ensayo independiente"],
    name: ["Independent Rehearsal", "Ensayo independiente"],
    results: ["Independent Rehearsal", "Ensayo independiente"],
    tag: ["Test-day conditions", "Como el día de la prueba"],
  },
});
/** A mode name for a text node. */
export const modeText = (I, id, key) => I.T(...MODE_TEXT[id][key]);

/** A phrase around a mode name, written with an {m} slot: "Restart in {m}". Text-node and plain-string forms. */
export const modePhrase = (I, id, key, en, es) =>
  I.T(en.replace("{m}", MODE_TEXT[id][key][0]), es.replace("{m}", MODE_TEXT[id][key][1]));
export const modePhraseS = (I, id, key, en, es) =>
  I.S(en.replace("{m}", MODE_TEXT[id][key][0]), es.replace("{m}", MODE_TEXT[id][key][1]));

/**
 * Like I.T, but for a sentence that contains markup (<strong>, <a>). `en` and `es` are html`` fragments;
 * build each from the matching side of MODE_TEXT and plain strings, never from T output.
 */
export const rich = (I, en, es) => {
  if (I.bilingual) return raw(`<span class="bi-pair">${toHtml(en)}<span class="bi-es" lang="es">${toHtml(es)}</span></span>`);
  if (I.spanish) return I.pageLang === "es" ? es : raw(`<span lang="es">${toHtml(es)}</span>`);
  return en;
};

/** "Grades 6–8" in each language. */
export const gradesText = (I, band) => {
  const range = String(band).replace("-", "–");
  return I.T(`Grades ${range}`, `Grados ${range}`);
};

/** Saved records keep the original `conditions` flag, so older tests resume in the right mode. */
export const modeOf = (rec) => (rec?.conditions ? "independent" : "guided");
export const otherMode = (m) => (m === "independent" ? "guided" : "independent");

export function modeBannerHTML(I, want, rec) {
  if (!want || want === modeOf(rec)) return "";
  const have = modeOf(rec);
  const state = rec.phase === "results" ? ["finished", "terminada"] : ["started", "empezada"];
  const [wantEn, wantEs] = MODE_TEXT[want].label;
  const [haveEn, haveEs] = MODE_TEXT[have].label;
  return html`<div class="mode-banner" role="status">
    <p>
      ${rich(
        I,
        html`You chose <strong>${wantEn}</strong>, but this test is already ${state[0]} in ${haveEn}. Changing mode restarts the test.`,
        html`Elegiste <strong>${wantEs}</strong>, pero esta prueba ya está ${state[1]} en ${haveEs}. Si cambias de modo, la prueba empieza de nuevo.`,
      )}
    </p>
    <button type="button" class="btn" data-switch-mode="${want}">${modePhrase(I, want, "label", "Restart in {m}", "Reiniciar en {m}")}</button>
  </div>`;
}
