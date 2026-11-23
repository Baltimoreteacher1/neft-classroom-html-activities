// Vocabulary Academy reader — HTML for the text itself and the word card popover. Builds strings only (every piece of
// text is escaped here); player.js puts them in the page and owns all events. No timers, no storage.
//
// One paragraph is drawn in one of four views:
//   read   lesson words are buttons; every word is a span the read-along can light
//   clue   every word is a tap target (roving tab stop, arrow keys) for "Find the clue"
//   tap    every sentence is a button, for "tap the sentence that proves it"
// Marks (Important / Surprise / Question) show in all of them, as a glyph and a word as well as a style.
import { esc, toHtml } from "../../util.js";
import { wordCardHTML } from "../art.js";
import { clueLabel, foundRanges } from "./clues.js";
import { MARK_LABEL, markOf, noteOf } from "./marks.js";
import { paraPieces } from "./text.js";

export const sr = (t) => `<span class="va-sr">${esc(t)}</span>`;
/** The learner-facing pair for a mark or clue type, as plain strings for the current language: [label, glyph]. */
export const markText = (I, k) => [I.S(MARK_LABEL[k][0], MARK_LABEL[k][1]), MARK_LABEL[k][2]];
export const clueText = (I, type) => {
  const l = clueLabel(type);
  return { label: I.S(l[0], l[1]), glyph: l[2], hint: l[3] };
};

/**
 * One paragraph as markup.
 *   R: { I, reading, words, state (saved), ui:{ clue, sel, view } }
 *   view: "read" | "clue" | "tap"
 */
export function paraHTML(R, i, view = "read") {
  const { I, reading, words, state, ui } = R;
  const para = reading.paras[i];
  const pieces = paraPieces(para, words);
  const wordById = new Map(words.map((w) => [w.id, w]));
  const clueIds = new Set((reading.clues || []).map((c) => c.word));
  const ranges =
    view === "clue" || view === "read"
      ? foundRanges(reading.paras, reading.clues, ui.clue?.found)[i] || []
      : [];
  const sel = ui.sel && ui.sel.p === i ? ui.sel.s : -1;
  const inRange = (p) => ranges.find((r) => p.start < r.end && p.end > r.start);

  const shown = new Set();
  const wrapClue = (piece, body) => {
    const r = inRange(piece);
    if (!r) return body;
    let badge = "";
    if (!shown.has(r.clue)) {
      shown.add(r.clue);
      const t = clueText(I, r.type);
      badge = `<span class="var-cbadge" data-ct="${esc(r.type)}"><span aria-hidden="true">${esc(t.glyph)}</span> ${esc(t.label)}</span> `;
    }
    return `${badge}<span class="var-in-clue" data-ct="${esc(r.type)}">${body}</span>`;
  };

  const pieceHTML = (p) => {
    if (p.kind === "gap") return wrapClue(p, esc(p.text));
    if (p.kind === "tok") {
      if (view === "clue")
        return wrapClue(
          p,
          `<span class="var-t var-tap" role="button" tabindex="-1" data-t="${p.token}" data-start="${p.start}">${esc(p.text)}</span>`,
        );
      if (view === "tap") return esc(p.text);
      return wrapClue(p, `<span class="var-t" data-t="${p.token}">${esc(p.text)}</span>`);
    }
    const word = wordById.get(p.wordId);
    const ts = p.tokens.join(" ");
    if (view === "tap") return `<mark class="var-wm">${esc(p.text)}</mark>`;
    if (view === "clue") {
      const has = clueIds.has(p.wordId);
      const on = ui.clue?.target === p.wordId;
      return wrapClue(
        p,
        `<span class="var-t var-w var-tap${has ? " has-clue" : " no-clue"}${on ? " is-target" : ""}" role="button" tabindex="-1" data-t="${p.tokens[0]}" data-ts="${ts}" data-start="${p.start}" data-word="${esc(p.wordId)}" aria-pressed="${on}" aria-label="${esc(`${p.text}${has ? `, ${I.S("a lesson word with a clue to find", "palabra de la lección con una pista que encontrar")}` : `, ${I.S("a lesson word", "palabra de la lección")}`}`)}">${has ? '<span class="var-hasclue" aria-hidden="true">◇</span>' : ""}${esc(p.text)}</span>`,
      );
    }
    return wrapClue(
      p,
      `<button type="button" class="var-w" data-word="${esc(p.wordId)}" data-para-of="${i}" aria-haspopup="dialog" aria-label="${esc(`${p.text}, ${I.S("a lesson word. Open its word card.", "palabra de la lección. Abrir su tarjeta.")}`)}"><span class="var-t" data-t="${p.tokens[0]}" data-ts="${ts}">${esc(p.text)}</span></button>`,
    );
  };

  // Group by sentence so a sentence is one element (marks, selection, tap-to-prove, karaoke).
  const bySentence = new Map();
  for (const p of pieces) {
    if (!bySentence.has(p.sentence)) bySentence.set(p.sentence, []);
    bySentence.get(p.sentence).push(p);
  }
  let out = "";
  for (const [s, group] of [...bySentence.entries()].sort((a, b) => a[0] - b[0])) {
    const body = group.map(pieceHTML).join("");
    const mark = markOf(state, i, s);
    const note = noteOf(state, i, s);
    const glyph = mark
      ? `<span class="var-mk" data-k="${mark}"><span aria-hidden="true">${esc(MARK_LABEL[mark][2])}</span>${sr(`${markText(I, mark)[0]}:`)}</span>`
      : "";
    const noteMark = note
      ? `<span class="var-nk" title="${esc(note)}"><span aria-hidden="true">✎</span>${sr(I.S("Has a note.", "Tiene una nota."))}</span>`
      : "";
    if (view === "tap") {
      const key = `${i}:${s}`;
      const proof = ui.q?.proof === key;
      const tried = !proof && ui.q?.tapped?.includes(key);
      const flag = proof ? ` <span class="var-ct">✓ ${esc(I.S("Right", "Correcto"))}</span>` : tried ? ` <span class="var-ct">✕ ${esc(I.S("Not this one", "Esta no"))}</span>` : "";
      out += `<button type="button" class="var-sbtn${mark ? ` var-m-${mark}` : ""}" data-tap-p="${i}" data-tap-s="${s}" data-s="${s}" data-state="${proof ? "right" : tried ? "tried" : ""}">${glyph}${body}${flag}</button>`;
    } else {
      out += `<span class="var-s${mark ? ` var-m-${mark}` : ""}${sel === s ? " is-selected" : ""}" data-p="${i}" data-s="${s}">${glyph}${body}${noteMark}</span>`;
    }
  }
  const n = i + 1;
  return `<p class="var-para" data-para="${i}" tabindex="-1" lang="en"><span class="var-pn" aria-hidden="true">${n}</span>${sr(I.S(`Paragraph ${n}.`, `Párrafo ${n}.`))}${out}</p><div class="var-pop-host" data-pop-host="${i}">${ui.pop && ui.pop.p === i ? popHTML(R) : ""}</div>`;
}

/** The whole text (or the current paragraph in one-at-a-time mode), as one string. */
export function textHTML(R, view = "read", only = null) {
  const idx = only === null ? R.reading.paras.map((_, i) => i) : [only];
  return idx.map((i) => paraHTML(R, i, view)).join("");
}

/** The word card popover for ui.pop.wordId. */
export function popHTML(R) {
  const word = R.words.find((w) => w.id === R.ui.pop?.wordId);
  if (!word) return "";
  const { I } = R;
  let card = "";
  try {
    card = toHtml(wordCardHTML(word, { I, supports: R.sup, band: R.band, size: "md" }));
  } catch (error) {
    console.warn("[vocab-academy] word card failed; showing the plain card", error);
  }
  if (!card)
    card = `<article class="va-card"><h3 lang="en">${esc(word.hw)}</h3><p lang="en">${esc(word.def)}</p>${word.ex ? `<p lang="en"><em>${esc(word.ex)}</em></p>` : ""}</article>`;
  return `<aside class="var-pop" role="dialog" aria-modal="false" aria-label="${esc(`${I.S("Word card", "Tarjeta de la palabra")}: ${word.hw}`)}" tabindex="-1" data-var-pop>
    <button type="button" class="btn var-pop-close" data-var-pop-close>${esc(I.S("Close", "Cerrar"))} <span aria-hidden="true">✕</span></button>${card}</aside>`;
}

