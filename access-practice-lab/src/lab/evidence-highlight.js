// Text-evidence highlighting for the Reading games. The learner marks the phrase in the passage that
// supports their answer before they can lock the answer in. One module serves every Reading game so the
// control, the keyboard model, the vocabulary help and the feedback wording mean the same thing everywhere.
//
// Pure parts (unit-tested in tools/access-lab-evidence-highlight.test.mjs):
//   chunkPassage(source, { level })     passage -> stable, ordered phrase chunks { id, text, sentence, part }
//   newHighlight() / toggle(st, id)     serializable selection state: { ids: [], pop: null }
//   acceptedIds(chunks, phrases, fb)    authored `evidence` phrases (else a fallback) -> accepted chunk ids
//   evidenceOk(st, accepted)            does the selection include an accepted supporting phrase
//   vocabFor / togglePopover            Tier-2 word help (a game's `vocab`, or glossary.js terms) and its state
// Markup helpers (highlightHTML, chunksHTML, vocabHTML, markedHTML, evidenceNote) return html`` values.
// Browser glue: mountHighlight (arrow keys, Escape, focus kept across the engine's re-render).
//
// Accessibility rules this file keeps:
//  * Every phrase is a real <button type="button" aria-pressed>: mouse, touch, Tab + Enter/Space all work, arrows move
//    between phrases, and the focus ring is drawn by lab-reading.css. Nothing depends on hover.
//  * Vocabulary words are underlined inside a phrase (a span, never a nested button); their real <button>
//    triggers sit in a "Word help" list with aria-expanded. Esc closes the popover and returns focus to its trigger.
//  * No timers. Only the CSS in lab-reading.css animates, for 150-200ms, and not under prefers-reduced-motion.
//  * Only chrome and word definitions are bilingual. The passage, the phrases and the vocabulary word stay English;
//    a definition uses I.TARGET (English kept, Spanish added as a gloss) so ES and EN+ES never replace English text.
import { glossSpans } from "../glossary.js";
import { esc, html, icon, raw } from "../util.js";

/** Most phrases a learner can have marked at once. A new mark beyond this replaces the oldest. */
export const MAX_MARKS = 2;
const MIN_WORDS = 3; // a shorter piece joins its neighbour so every button is a readable phrase
const LONG_WORDS = 14; // a longer clause is split once more, before a linking word
const ABBR = /\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc)\.$/;
const LINKERS = /\s(?=(?:that|which|because|while|when|but|and|so|although|instead of)\s)/gi;

const words = (t) =>
  String(t || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
/** Lowercase, no quotes or end punctuation, single spaces: how phrases are compared. */
export const norm = (t) =>
  String(t ?? "")
    .toLowerCase()
    .replace(/[“”"'’‘]/g, "")
    .replace(/[.,!?;:—–]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// ── chunking ──────────────────────────────────────────────────────────────────────────────
/** Sentences of a passage. An abbreviation such as "Mr." does not end one. */
export function splitSentences(text) {
  const t = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return [];
  const out = [];
  const re = /[.!?]+["”’')\]]*\s+(?=[A-Z“"‘'(])/g;
  let start = 0;
  let m;
  while ((m = re.exec(t))) {
    const end = m.index + m[0].length;
    const piece = t.slice(start, end).trim();
    if (ABBR.test(piece.replace(/["”’')\]]+$/, ""))) continue;
    out.push(piece);
    start = end;
  }
  const tail = t.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

/** Break between a mark and the next word: end punctuation, comma, semicolon, colon, dash. */
function pieces(sentence) {
  const parts = [];
  let at = 0;
  const re = /([,;:—–]|[.!?]+["”’')\]]*)\s+/g;
  let m;
  while ((m = re.exec(sentence))) {
    const end = m.index + m[0].length;
    if (ABBR.test(sentence.slice(at, m.index + m[1].length))) continue;
    parts.push(sentence.slice(at, end).trim());
    at = end;
  }
  if (at < sentence.length) parts.push(sentence.slice(at).trim());
  return parts;
}

/** Fold pieces under MIN_WORDS into the next piece (the last one into the one before it). */
function fold(list) {
  const out = [];
  let carry = "";
  for (const p of list) {
    const joined = carry ? `${carry} ${p}` : p;
    if (words(joined).length < MIN_WORDS) carry = joined;
    else {
      out.push(joined);
      carry = "";
    }
  }
  if (carry) {
    if (out.length) out[out.length - 1] += ` ${carry}`;
    else out.push(carry);
  }
  return out;
}

/** A clause that is still long is split once, at the linking word nearest its middle (4+ words each side). */
function cut(clause) {
  const n = words(clause).length;
  if (n <= LONG_WORDS) return [clause];
  const spots = [...clause.matchAll(LINKERS)]
    .map((m) => m.index)
    .filter((i) => {
      const left = words(clause.slice(0, i)).length;
      return left >= 4 && n - left >= 4;
    });
  if (!spots.length) return [clause];
  const mid = clause.length / 2;
  const at = spots.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
  return [...cut(clause.slice(0, at).trim()), ...cut(clause.slice(at).trim())];
}

/**
 * Deterministic phrase chunks. `source` is a passage string or an array of sentences/lines already split.
 * level "clause" (default): comma, semicolon, colon, dash and sentence breaks, short pieces folded in, long
 * clauses cut once. level "sentence": one chunk per sentence. Ids are stable for the same text: "s2c1" is the
 * second chunk of the third sentence ("s2" at sentence level). The same input always gives the same chunks.
 */
export function chunkPassage(source, { level = "clause" } = {}) {
  const sentences = Array.isArray(source)
    ? source.map((s) => String(s ?? "").trim())
    : splitSentences(source);
  const chunks = [];
  sentences.forEach((text, sentence) => {
    if (!text) return;
    if (level === "sentence") {
      chunks.push({ id: `s${sentence}`, text, sentence, part: 0 });
      return;
    }
    fold(pieces(text))
      .flatMap(cut)
      .forEach((t, part) => chunks.push({ id: `s${sentence}c${part}`, text: t, sentence, part }));
  });
  return chunks;
}

// ── selection state (serializable; every function returns a new value) ──────────────────────
export const newHighlight = () => ({ ids: [], pop: null });
const live = (st) => (st && Array.isArray(st.ids) ? st : newHighlight());
export const selectedIds = (st) => [...live(st).ids];
export const hasSelection = (st) => live(st).ids.length > 0;

/**
 * Mark or unmark a phrase. At `max` marks the oldest is dropped so a tap never does nothing.
 * `valid` (optional, a list of ids) ignores ids that are not in the passage.
 */
export function toggle(st, id, { max = MAX_MARKS, valid } = {}) {
  const cur = live(st);
  if (valid && !valid.includes(id)) return cur;
  if (cur.ids.includes(id)) return { ...cur, ids: cur.ids.filter((x) => x !== id) };
  return { ...cur, ids: [...cur.ids, id].slice(-Math.max(1, max)) };
}
export const clearMarks = (st) => ({ ...live(st), ids: [] });

// ── evidence ──────────────────────────────────────────────────────────────────────────────
/**
 * Chunk ids that count as supporting evidence. `phrases` are the content's `evidence` strings: a chunk is
 * accepted when it holds a phrase or sits inside one. With no phrases (or none that match), `fallback`
 * ids are used, so a game can derive the evidence from the answer data it already has.
 */
export function acceptedIds(chunks, phrases, fallback = []) {
  const want = (phrases || []).map(norm).filter(Boolean);
  const hit = chunks
    .filter((c) => {
      const n = norm(c.text);
      return want.some((p) => n.includes(p) || p.includes(n));
    })
    .map((c) => c.id);
  return hit.length ? hit : [...fallback];
}
export const idsOfSentence = (chunks, sentence) =>
  chunks.filter((c) => c.sentence === sentence).map((c) => c.id);

/** True when the learner's marks include at least one accepted supporting phrase. */
export const evidenceOk = (st, accepted) =>
  selectedIds(st).some((id) => (accepted || []).includes(id));

/** The words that support the right answer: the authored phrases, else the accepted chunks' text. */
export function supportText(chunks, accepted, phrases) {
  const authored = (phrases || []).filter(Boolean);
  if (authored.length) return authored.join(" … ");
  return chunks
    .filter((c) => (accepted || []).includes(c.id))
    .map((c) => c.text)
    .join(" … ");
}

// ── vocabulary help ─────────────────────────────────────────────────────────────────────
const escRe = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
const formRe = (w) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escRe(w)}(?:s|es|d|ed|ing|ly)?(?![\\p{L}\\p{N}])`, "iu");

/**
 * Normalise a content `vocab` row ({ word, def: { en, es } }) or a glossary.json term ({ term, def, es, esDef })
 * into { word, en, es }. The word is the English word; `es` is the Spanish help for the definition.
 */
export function vocabEntry(row) {
  if (!row) return null;
  const word = String(row.word ?? row.term ?? "").trim();
  const d = row.def;
  const en = typeof d === "string" ? d : (d?.en ?? "");
  const es = typeof d === "object" && d ? (d.es ?? "") : (row.esDef ?? "");
  const gloss = typeof row.es === "string" ? row.es : "";
  return word && (en || es || gloss) ? { word, en, es, gloss } : null;
}

/**
 * Word-help entries for a passage, in order of appearance: the item's `vocab` rows that occur in the text,
 * plus (when a glossary is passed) terms glossary.js finds there. One entry per word.
 */
export function vocabFor(text, vocab = [], glossary) {
  const t = Array.isArray(text) ? text.join(" ") : String(text ?? "");
  const found = new Map();
  for (const row of vocab || []) {
    const e = vocabEntry(row);
    const m = e && formRe(e.word).exec(t);
    if (m && !found.has(e.word.toLowerCase())) found.set(e.word.toLowerCase(), { at: m.index, e });
  }
  if (glossary)
    for (const s of glossSpans(t, glossary, { limit: 6 })) {
      const e = vocabEntry(glossary.terms.find((x) => x.term === s.term));
      if (e && !found.has(e.word.toLowerCase()))
        found.set(e.word.toLowerCase(), { at: s.start, e });
    }
  return [...found.values()].sort((a, b) => a.at - b.at).map((x) => x.e);
}

/** Open the word's popover, or close it when it is already open. */
export function togglePopover(st, word) {
  const cur = live(st);
  return { ...cur, pop: cur.pop === word ? null : word };
}
export const closePopover = (st) => ({ ...live(st), pop: null });
export const popoverOpen = (st) => live(st).pop;

// ── content checks (a game's validate() calls these) ──────────────────────────────────────
/** Problems with an optional `vocab` array: 1-4 words, each in the text, each with an English and a Spanish definition. */
export function vocabProblems(vocab, text, at) {
  if (vocab === undefined) return [];
  if (!Array.isArray(vocab) || vocab.length < 1 || vocab.length > 4) return [`${at}: vocab needs 1-4 words`];
  const t = Array.isArray(text) ? text.join(" ") : String(text ?? "");
  const errs = [];
  for (const v of vocab) {
    const e = vocabEntry(v);
    if (!e || !e.en.trim() || !e.es.trim() || e.es === e.en) errs.push(`${at}: vocab "${v?.word}" needs a bilingual definition`);
    else if (!formRe(e.word).test(t)) errs.push(`${at}: vocab "${e.word}" is not in the text`);
  }
  return errs;
}

/** Problems with an optional `evidence` array: phrases that must appear in the sentence(s) `within`. */
export function evidenceProblems(phrases, within, at) {
  if (phrases === undefined) return [];
  const t = norm(Array.isArray(within) ? within.join(" ") : within);
  const bad = !Array.isArray(phrases) || !phrases.length || phrases.some((x) => typeof x !== "string" || !norm(x) || !t.includes(norm(x)));
  return bad ? [`${at}: evidence must be phrases found in the supporting sentence`] : [];
}

// ── markup ──────────────────────────────────────────────────────────────────────────────
/** A chunk's text with the first use of each help word underlined (a span: never a nested button). */
function withVocab(text, entries, seen) {
  const hits = entries
    .filter((e) => !seen.has(e.word))
    .map((e) => ({ e, m: formRe(e.word).exec(text) }))
    .filter((x) => x.m)
    .sort((a, b) => a.m.index - b.m.index);
  let out = "";
  let at = 0;
  for (const { e, m } of hits) {
    if (m.index < at) continue;
    seen.add(e.word);
    out += `${esc(text.slice(at, m.index))}<span class="lab-ev-vw">${esc(m[0])}</span>`;
    at = m.index + m[0].length;
  }
  return out + esc(text.slice(at));
}

/**
 * The phrase buttons for some chunks, joined by spaces. opts: { st, I, locked, keyIds, vocab, seen, tag }
 *  - locked: all buttons disabled (the answer is settled).
 *  - keyIds: when given (after the answer is settled), accepted phrases show as "supports the answer" and
 *    marks outside them show as "not the evidence", in words for assistive tech and in shape, not colour alone.
 *  - tag(chunk): optional extra class for a game's own state (for example a pinned clue).
 */
export function chunksHTML(
  chunks,
  { st, I, locked = false, keyIds, vocab = [], seen = new Set(), tag } = {},
) {
  const on = selectedIds(st);
  return chunks.map((c, i) => {
    const sel = on.includes(c.id);
    const key = keyIds ? keyIds.includes(c.id) : false;
    const miss = keyIds && sel && !key;
    const cls = `lab-ev-c${sel ? " is-on" : ""}${key ? " is-key" : ""}${miss ? " is-miss" : ""}${tag?.(c) ? ` ${tag(c)}` : ""}`;
    const hidden = (en, es) => `<span class="visually-hidden"> ${esc(I.S(en, es))}</span>`;
    const state = key
      ? hidden("(supports the answer)", "(apoya la respuesta)")
      : miss
        ? hidden("(not the evidence)", "(no es la evidencia)")
        : "";
    // Built as a plain string on purpose: whitespace inside an inline button changes what the learner sees.
    return raw(
      `${i ? " " : ""}<button type="button" class="${esc(cls)}" data-g-hl="${esc(c.id)}" aria-pressed="${sel}"${locked ? " disabled" : ""}>${withVocab(c.text, vocab, seen)}${state}</button>`,
    );
  });
}

/** The whole passage as one paragraph of phrase buttons, in a labelled group. */
export function highlightHTML(chunks, opts = {}) {
  const { I, label } = opts;
  return html`<div
    class="lab-ev"
    data-lab-ev
    role="group"
    aria-label="${label || I.S("Text: mark the words that support your answer", "Texto: marca las palabras que apoyan tu respuesta")}"
  >
    <p class="lab-ev-p">${chunksHTML(chunks, opts)}</p>
  </div>`;
}

/** Word-help triggers (real buttons, aria-expanded) and their popovers. Renders nothing without entries. */
export function vocabHTML(entries, st, { I, name = "p" } = {}) {
  if (!entries?.length) return "";
  const open = popoverOpen(st);
  const idOf = (i) => `lab-ev-pop-${name}-${i}`;
  return html`<div class="lab-ev-vocab">
    <p class="lab-ev-vocab-h">${icon("help")}${I.T("Word help", "Ayuda con palabras")}</p>
    <ul class="lab-ev-vlist">
      ${entries.map((e, i) => html`<li><button type="button" class="lab-ev-vb" data-g-vocab="${e.word}" aria-expanded="${String(open === e.word)}" aria-controls="${idOf(i)}">${e.word}</button></li>`)}
    </ul>
    ${entries.map(
      (e, i) =>
        html`<div class="lab-ev-pop" id="${idOf(i)}" role="note" ${open === e.word ? "" : "hidden"}>
          <p>
            <strong lang="en">${e.word}</strong>:
            ${e.en || e.es ? (I.TARGET || I.T)(e.en || e.es, e.es || e.en) : ""}${e.gloss ? html` <span class="lab-ev-gloss" lang="es">${e.gloss}</span>` : ""}
          </p>
          <button type="button" class="btn small" data-g-vclose>${I.T("Close", "Cerrar")}</button>
        </div>`,
    )}
  </div>`;
}

/** The marks, echoed beside the lock button, or the nudge that unlocks it. */
export function markedHTML(chunks, st, { I, max = MAX_MARKS } = {}) {
  const on = selectedIds(st);
  const text = on.map((id) => chunks.find((c) => c.id === id)?.text).filter(Boolean);
  if (!text.length)
    return html`<p class="lab-ev-marked is-empty" role="status">
      ${icon("pin")}${I.T("Tap the words in the text that support your answer. Then lock it in.", "Toca las palabras del texto que apoyan tu respuesta. Luego confirma.")}
    </p>`;
  return html`<p class="lab-ev-marked" role="status">
    ${icon("pin")}<span
      ><strong>${I.T("You marked:", "Marcaste:")}</strong>
      ${text.map((t) => html`<q>${t}</q> `)}<span class="fine"
        >${I.T(`Up to ${max} phrases. Tap a marked phrase to unmark it.`, `Hasta ${max} frases. Toca una frase marcada para quitarla.`)}</span
      ></span
    >
  </p>`;
}

/**
 * The line that names the supporting words, for feedback. Empty when the marks already supported the answer
 * (`ok` true) or no judgement has been made (`ok` null/undefined). `lead` swaps the sentence stem.
 */
export function evidenceNote(chunks, accepted, ok, { I, phrases, lead } = {}) {
  if (ok !== false) return "";
  const text = supportText(chunks, accepted, phrases);
  if (!text) return "";
  const stem =
    lead ||
    I.T(
      "The words that support the right answer:",
      "Las palabras que apoyan la respuesta correcta:",
    );
  return html`<span class="lab-ev-note">${stem} <q>${text}</q></span>`;
}

// ── controls: one handler for a game's click(), one mount for keyboard and focus ──────────────
/**
 * Handle a click on a highlight or word-help control. Returns null when `b` is not one, else
 * { st, changed } with the new state. `env.use("gloss")` is called when a definition is opened,
 * so opened help is recorded as help. `locked` ignores phrase taps (the answer is settled).
 */
export function clickHighlight(b, st, { chunks, env, locked = false, max = MAX_MARKS } = {}) {
  if (b.dataset?.gHl !== undefined) {
    if (locked) return { st, changed: false };
    const next = toggle(st, b.dataset.gHl, { max, valid: chunks?.map((c) => c.id) });
    return { st: next, changed: JSON.stringify(next) !== JSON.stringify(live(st)) };
  }
  if (b.dataset?.gVocab !== undefined) {
    const next = togglePopover(st, b.dataset.gVocab);
    if (next.pop) env?.use?.("gloss");
    return { st: next, changed: true };
  }
  if (b.hasAttribute?.("data-g-vclose"))
    return { st: closePopover(st), changed: popoverOpen(st) !== null };
  return null;
}

let pending = null;
const remember = (selector) => {
  pending = { selector, at: Date.now() };
};

/**
 * After each render: put focus back where it was (the engine rebuilds the stage on every change), move
 * between phrases with the arrow keys, and close an open word-help popover with Escape. `onEscape()` must
 * clear the popover in the game's state and return true when it did (the game then re-renders).
 * Returns the cleanup the engine expects from a module's mount().
 */
export function mountHighlight(root, { onEscape } = {}) {
  if (pending && Date.now() - pending.at < 2000)
    root.querySelector(pending.selector)?.focus({ preventScroll: true });
  pending = null;
  const onClick = (e) => {
    const b = e.target.closest?.("[data-g-hl],[data-g-vocab],[data-g-vclose]");
    if (!b || !root.contains(b)) return;
    if (b.dataset.gHl !== undefined) remember(`[data-g-hl="${b.dataset.gHl}"]`);
    else if (b.dataset.gVocab !== undefined) remember(`[data-g-vocab="${b.dataset.gVocab}"]`);
    else {
      const open = root.querySelector('[data-g-vocab][aria-expanded="true"]');
      if (open) remember(`[data-g-vocab="${open.dataset.gVocab}"]`);
    }
  };
  const onKey = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "Escape") {
      const open = root.querySelector('[data-g-vocab][aria-expanded="true"]');
      if (open && onEscape) {
        remember(`[data-g-vocab="${open.dataset.gVocab}"]`);
        if (onEscape()) e.preventDefault();
        else pending = null;
      }
      return;
    }
    const from = e.target.closest?.("[data-g-hl]");
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!from || (step === undefined && e.key !== "Home" && e.key !== "End")) return;
    const group = from.closest("[data-lab-ev]") || root;
    const all = [...group.querySelectorAll("[data-g-hl]:not(:disabled)")];
    const i = all.indexOf(from);
    const to =
      e.key === "Home"
        ? all[0]
        : e.key === "End"
          ? all.at(-1)
          : all[(i + step + all.length) % all.length];
    if (to && to !== from) {
      to.focus();
      e.preventDefault();
    }
  };
  root.addEventListener("click", onClick, true);
  root.addEventListener("keydown", onKey);
  return () => {
    root.removeEventListener("click", onClick, true);
    root.removeEventListener("keydown", onKey);
  };
}

