// Plan & Respond — whole-class engagement views, all built from the unit's own authored data. No timer, no names, nothing saved.
//   Word match: a memory game pairing unit words with their meanings.
//   Four corners: the unit's talk-line statements, with agree / disagree sentence stems at the chosen support level.
//   Language routine: the unit's subject language routine, one step at a time for the projector.

import { blanks, esc, shuffle, vstate } from "./util.js";

// ── Word match ──────────────────────────────────────────────────────────────

/** Twelve cards: six unit words and their six meanings, shuffled by round. Pure. */
export function matchDeck(detail, round = 0) {
  const words = detail.studio.vocab.slice(0, 6);
  const cards = words.flatMap((v, i) => [
    { pair: i, kind: "word", text: v.term },
    { pair: i, kind: "meaning", text: v.def },
  ]);
  return shuffle(cards, `${detail.unit.id}:match:${round}`);
}

export const match = {
  id: "match",
  render(st, detail) {
    const vs = vstate(st, "match", { round: 0, open: [], done: [], tries: 0 });
    const deck = matchDeck(detail, vs.round);
    const finished = vs.done.length === deck.length / 2;
    const cards = deck
      .map((c, i) => {
        const up = vs.open.includes(i) || vs.done.includes(c.pair);
        const label = up
          ? `${c.kind === "word" ? "Word" : "Meaning"}: ${c.text}`
          : `Card ${i + 1}, face down`;
        return `<button type="button" class="cp-mcard${up ? " cp-mcard--up" : ""}${vs.done.includes(c.pair) ? " cp-mcard--done" : ""} cp-mcard--${c.kind}" data-cp-act="match:flip" data-cp-arg="${i}" aria-label="${esc(label)}" ${vs.done.includes(c.pair) ? "disabled" : ""}>${up ? `<small>${c.kind === "word" ? "Word" : "Meaning"}</small><span>${esc(c.text)}</span>` : `<span aria-hidden="true">?</span>`}</button>`;
      })
      .join("");
    const status = finished
      ? `All pairs found in ${vs.tries} tries. Say each word and its meaning to a partner.`
      : vs.open.length === 2
        ? deck[vs.open[0]].pair === deck[vs.open[1]].pair
          ? "A match."
          : "Not a pair. Tap any card to try again."
        : `${vs.done.length} of ${deck.length / 2} pairs found.`;
    return `<div class="cp-match"><p class="cp-muted">Find each word and its meaning. Take turns choosing two cards.</p><div class="cp-mgrid">${cards}</div><p class="cp-note" role="status">${esc(status)}</p>${finished ? `<button type="button" class="cp-btn cp-btn--solid" data-cp-act="match:again">Play again</button>` : ""}</div>`;
  },
  act(st, action, arg, ctx) {
    const vs = vstate(st, "match", { round: 0, open: [], done: [], tries: 0 });
    if (action === "again") {
      Object.assign(vs, { round: vs.round + 1, open: [], done: [], tries: 0 });
      return true;
    }
    if (action !== "flip") return false;
    const deck = matchDeck(ctx.detail, vs.round);
    const i = Number(arg);
    if (vs.open.length === 2) vs.open = [];
    if (vs.open.includes(i)) return false;
    vs.open.push(i);
    if (vs.open.length === 2) {
      vs.tries += 1;
      const [a, b] = vs.open;
      if (deck[a].pair === deck[b].pair && deck[a].kind !== deck[b].kind)
        vs.done.push(deck[a].pair);
    }
    return true;
  },
};

// ── Four corners ────────────────────────────────────────────────────────────

export const corners = {
  id: "corners",
  render(st, detail) {
    const tl = detail.esol_pack?.talk_line;
    if (!tl?.statements?.length)
      return `<p class="cp-note">This unit has no discussion statements yet.</p>`;
    const vs = vstate(st, "corners", { i: 0 });
    const i = Math.min(vs.i, tl.statements.length - 1);
    const stems = tl.stems?.[st.level] || tl.stems?.["3_4"] || {};
    return `<div class="cp-corners">
      <p class="cp-muted">Read the statement. Students walk to the corner that matches what they think, talk with the people there, then one person from each corner shares.</p>
      <div class="cp-card cp-card--lead"><p class="cp-eyebrow">Statement ${i + 1} of ${tl.statements.length}</p><p class="cp-question">${esc(tl.statements[i])}</p></div>
      <div class="cp-corner-grid">${(tl.corners || []).map((c, k) => `<div class="cp-corner"><span aria-hidden="true">${k + 1}</span>${esc(c)}</div>`).join("")}</div>
      <div class="cp-card"><h4>Say it like this</h4><ul class="cp-plain">${Object.entries(stems)
        .map(([k, v]) => `<li><b>${esc(k[0].toUpperCase() + k.slice(1))}:</b> ${blanks(v)}</li>`)
        .join("")}</ul></div>
      <div class="cp-actions"><button type="button" class="cp-btn" data-cp-act="corners:prev" ${i === 0 ? "disabled" : ""}>Back</button><button type="button" class="cp-btn cp-btn--solid" data-cp-act="corners:next" ${i >= tl.statements.length - 1 ? "disabled" : ""}>Next statement</button></div>
    </div>`;
  },
  act(st, action, _arg, ctx) {
    const vs = vstate(st, "corners", { i: 0 });
    const n = ctx.detail.esol_pack?.talk_line?.statements?.length || 1;
    if (action === "next") vs.i = Math.min(n - 1, vs.i + 1);
    else if (action === "prev") vs.i = Math.max(0, vs.i - 1);
    else return false;
    return true;
  },
};

// ── Language routine ────────────────────────────────────────────────────────

export const routine = {
  id: "routine",
  render(st, detail) {
    const list = detail.esol_pack?.routines || [];
    if (!list.length) return `<p class="cp-note">This unit has no language routine yet.</p>`;
    const vs = vstate(st, "routine", { r: 0, step: 0 });
    const r = list[Math.min(vs.r, list.length - 1)];
    const step = Math.min(vs.step, r.steps.length - 1);
    const [head, ...rest] = r.steps[step].split(" — ");
    return `<div class="cp-routine">
      ${list.length > 1 ? `<div class="cp-chiprow">${list.map((x, k) => `<button type="button" class="cp-chip" data-cp-act="routine:pick" data-cp-arg="${k}" aria-pressed="${k === vs.r}">${esc(x.name)}</button>`).join("")}</div>` : ""}
      <div class="cp-card cp-card--lead"><p class="cp-eyebrow">${esc(r.name)}</p>
        <div class="cp-strip" role="img" aria-label="Step ${step + 1} of ${r.steps.length}">${r.steps.map((_, k) => `<span class="cp-dot${k === step ? " cp-dot--now" : ""}">${k + 1}</span>`).join("")}</div>
        <p class="cp-question cp-fadein" role="status">${rest.length ? `<b>${esc(head)}.</b> ${blanks(rest.join(" — "))}` : blanks(head)}</p>
        ${r.source ? `<p class="cp-muted cp-teacher">Source: ${esc(r.source)}</p>` : ""}
      </div>
      <div class="cp-actions"><button type="button" class="cp-btn" data-cp-act="routine:prev" ${step === 0 ? "disabled" : ""}>Back</button><button type="button" class="cp-btn cp-btn--solid" data-cp-act="routine:next" ${step >= r.steps.length - 1 ? "disabled" : ""}>Next step</button></div>
    </div>`;
  },
  act(st, action, arg, ctx) {
    const vs = vstate(st, "routine", { r: 0, step: 0 });
    const list = ctx.detail.esol_pack?.routines || [];
    const n = list[vs.r]?.steps?.length || 1;
    if (action === "pick") Object.assign(vs, { r: Number(arg), step: 0 });
    else if (action === "next") vs.step = Math.min(n - 1, vs.step + 1);
    else if (action === "prev") vs.step = Math.max(0, vs.step - 1);
    else return false;
    return true;
  },
};
