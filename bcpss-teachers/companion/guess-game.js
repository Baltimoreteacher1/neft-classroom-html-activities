// Plan & Respond — "Guess my word": a whole-class game for the projector. Clues for one unit word appear one at a time
// (picture idea, meaning, example with the word hidden, Spanish, first letter). Fewer clues used means more stars for the
// class. No timer, no names, nothing saved. Clues are the unit's own authored vocabulary fields.

import { esc, markTerms, shuffle, vstate } from "./util.js";

const ID = "guess";
const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

const hide = (text, v) =>
  markTerms(text, [{ term: v.term, family: v.family || [] }], () => "_____").replace(/&amp;/g, "&");

/** The clues for one word, easiest last. Any clue that would show the word itself is left out. */
export function cluesFor(v) {
  const word = fold(v.term);
  const out = [];
  if (v.cue) out.push({ label: "Picture this", text: hide(v.cue, v) });
  out.push({ label: "What it means", text: hide(v.def, v) });
  if (v.example) out.push({ label: "In a sentence", text: hide(v.example, v) });
  if (v.es && fold(v.es) !== word && !fold(v.es).startsWith(word.slice(0, 4)))
    out.push({ label: "In Spanish", text: v.es });
  out.push({
    label: "First letter",
    text: `It starts with “${v.term[0].toUpperCase()}” and has ${v.term.replace(/\s/g, "").length} letters${v.term.includes(" ") ? ` in ${v.term.split(/\s+/).length} words` : ""}.`,
  });
  return out.filter((c) => !fold(c.text).includes(word) || c.label === "First letter");
}

export function render(st, detail) {
  const vocab = detail.studio.vocab;
  const vs = vstate(st, ID, { round: 0, i: 0, shown: 1, reveal: false, stars: 0, done: 0 });
  const order = shuffle(
    vocab.map((v) => v.term),
    `${detail.unit.id}:g:${vs.round}`,
  );
  if (vs.i >= order.length)
    return `<div class="cp-guess"><div class="cp-card cp-card--lead"><p class="cp-question">All ${order.length} words done. The class earned ${vs.stars} stars.</p><button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:again">Play again</button></div></div>`;
  const v = vocab.find((x) => x.term === order[vs.i]);
  const clues = cluesFor(v);
  const shown = Math.min(vs.shown, clues.length);
  const worth = Math.max(1, clues.length - shown + 1);
  return `
    <div class="cp-guess">
      <div class="cp-set-head"><h4>Word ${vs.i + 1} of ${order.length}</h4><span class="cp-stars" aria-label="Class stars: ${vs.stars}">★ ${vs.stars}</span></div>
      <ol class="cp-clues">${clues
        .slice(0, shown)
         .map((c, k) =>
            `<li class="cp-clue cp-fadein"><small>${esc(c.label)}</small><span${k === shown - 1 ? " data-cp-speak" : ""}>${esc(c.text)}</span></li>`,
        )
        .join("")}</ol>
      ${
        vs.reveal
          ? `<p class="cp-reveal cp-fadein" role="status">${esc(v.icon || "")} <b>${esc(v.term)}</b>${v.es ? ` <i>${esc(v.es)}</i>` : ""}</p>`
          : `<p class="cp-muted" role="status">Talk with a partner. Agree on a guess. Right now a correct guess is worth ${worth} star${worth === 1 ? "" : "s"}.</p>`
      }
      <div class="cp-actions">
        ${vs.reveal ? "" : `<button type="button" class="cp-btn" data-cp-act="${ID}:clue" ${shown >= clues.length ? "disabled" : ""}>Next clue</button><button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:got">The class got it</button><button type="button" class="cp-btn" data-cp-act="${ID}:show">Show the word</button>`}
        ${vs.reveal ? `<button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:next">Next word</button>` : ""}
      </div>
    </div>`;
}

export function act(st, action, _arg, ctx) {
  const vs = vstate(st, ID, {});
  const v = ctx.detail.studio.vocab;
  if (action === "clue") vs.shown += 1;
  else if (action === "got" || action === "show") {
    if (action === "got") {
      const order = shuffle(
        v.map((x) => x.term),
        `${ctx.detail.unit.id}:g:${vs.round}`,
      );
      const clues = cluesFor(v.find((x) => x.term === order[vs.i]));
      vs.stars += Math.max(1, clues.length - Math.min(vs.shown, clues.length) + 1);
    }
    vs.reveal = true;
  } else if (action === "next") {
    vs.i += 1;
    vs.shown = 1;
    vs.reveal = false;
  } else if (action === "again") {
    Object.assign(vs, { round: vs.round + 1, i: 0, shown: 1, reveal: false, stars: 0 });
  } else return false;
  return true;
}
