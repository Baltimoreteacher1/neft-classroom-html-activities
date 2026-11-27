// Plan & Respond — "Word and concept cards": an animated Frayer-style card for each unit word, built from the unit's own
// vocabulary entry (meaning, example, not-an-example, Spanish, picture idea), its cognate notes and double-duty senses.
// The animation only reveals the unit's authored content in a teaching order; it draws no new facts.

import { doc, FOOT, openPrint, unitLine } from "./companion-print.js";
import { esc, markTerms, vstate } from "./util.js";
import { frayerLines } from "./visuals.js";

const ID = "words";

/** Everything the card for one term shows. Pure; every field comes from detail. */
export function conceptCard(detail, term) {
  const v = detail.studio.vocab.find((x) => x.term === term) || detail.studio.vocab[0];
  const key = v.term.toLowerCase();
  const cog = (detail.esol_pack?.cognates || []).find((c) => c.term?.toLowerCase() === key);
  const dd = (detail.esol_pack?.double_duty || []).find((d) => d.word?.toLowerCase() === key);
  return {
    term: v.term,
    icon: v.icon || "",
    pos: v.pos || "",
    es: v.es || "",
    esNote: v.es_note || "",
    def: v.def,
    example: v.example,
    nonexample: v.nonexample,
    cue: v.cue || "",
    family: v.family || [],
    cognate: cog ? { kind: cog.kind, tip: cog.tip, falseFriend: cog.false_friend || "" } : null,
    senses: dd?.senses || [],
  };
}

// Reveal order for the step-by-step view. Index = piece number.
const PIECES = ["word", "meaning", "example", "notExample", "spanish", "picture"];

function piece(card, vocab, name, shown) {
  const cls = `cp-piece cp-piece--${name}${shown ? "" : " cp-piece--hidden"}`;
  const style = `style="--i:${PIECES.indexOf(name)}"`;
  if (name === "word")
    return `<div class="${cls} cp-frayer-core" ${style}><span class="cp-frayer-icon" aria-hidden="true">${esc(card.icon)}</span><b>${esc(card.term)}</b><small>${esc(card.pos)}</small></div>`;
  const body = {
    meaning: [`Meaning`, esc(card.def)],
    example: [
      `Example`,
      markTerms(card.example, [{ term: card.term, family: card.family }], (m) => `<b>${m}</b>`),
    ],
    notExample: [`Not an example`, esc(card.nonexample)],
    spanish: [
      `In Spanish`,
      `${card.es ? `<b>${esc(card.es)}</b>` : "—"}${card.esNote ? `<br><span class="cp-muted">${esc(card.esNote)}</span>` : ""}${card.cognate?.falseFriend ? `<br><span class="cp-fix"><b>Careful:</b> ${esc(card.cognate.falseFriend)}</span>` : ""}`,
    ],
    picture: [`Picture idea`, esc(card.cue || "Draw something that shows the word.")],
  }[name];
  return `<div class="${cls}" ${style}><h5>${body[0]}</h5><p>${body[1]}</p></div>`;
}

export function render(st, detail) {
  const vocab = detail.studio.vocab;
  const vs = vstate(st, ID, { term: vocab[0].term, mode: "all", step: PIECES.length - 1 });
  const card = conceptCard(detail, vs.term);
  const stepping = vs.mode === "step";
  const shown = (name) => !stepping || PIECES.indexOf(name) <= vs.step;
  const chips = vocab
    .map(
      (v) =>
        `<button type="button" class="cp-chip" data-cp-act="${ID}:term" data-cp-arg="${esc(v.term)}" aria-pressed="${v.term === vs.term}">${esc(v.term)}</button>`,
    )
    .join("");
  const extra = [
    card.family.length ? `<p><b>Word family:</b> ${card.family.map(esc).join(", ")}</p>` : "",
    card.cognate?.tip
      ? `<p><b>${card.cognate.kind === "cognate" ? "Cognate" : "Spanish link"}:</b> ${esc(card.cognate.tip)}</p>`
      : "",
    card.senses.length
      ? `<p><b>Also means:</b> ${card.senses.map((s) => `${esc(s.ctx)}: ${esc(s.def)}`).join(" · ")}</p>`
      : "",
  ].join("");
  return `
    <div class="cp-words-view">
      <fieldset class="cp-field"><legend>Pick a word</legend><div class="cp-chiprow cp-chiprow--tight">${chips}</div></fieldset>
      <div class="cp-actions" role="group" aria-label="How to show the card">
        <button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:play">Play the animation</button>
        <button type="button" class="cp-btn" data-cp-act="${ID}:step" aria-pressed="${stepping}">${stepping ? (vs.step >= PIECES.length - 1 ? "Start over" : "Next piece") : "One piece at a time"}</button>
        ${stepping ? `<button type="button" class="cp-btn" data-cp-act="${ID}:showall">Show everything</button>` : ""}
      </div>
      <div class="cp-frayer ${vs.anim ? "cp-frayer--play" : ""}" role="group" aria-label="Concept card for ${esc(card.term)}" aria-live="polite">
        <div class="cp-frayer-quad">${frayerLines()}${PIECES.filter((p) => p !== "picture")
          .map((p) => piece(card, vocab, p, shown(p)))
          .join("")}</div>
        ${piece(card, vocab, "picture", shown("picture"))}
      </div>
      <div class="cp-card">${extra || `<p class="cp-muted">No extra word notes for this word.</p>`}</div>
      <div class="cp-actions">
        <button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:print" data-cp-arg="filled">Print all cards (filled in)</button>
        <button type="button" class="cp-btn" data-cp-act="${ID}:print" data-cp-arg="blank">Print blank cards for students</button>
      </div>
    </div>`;
}

export function act(st, action, arg, ctx) {
  const vs = vstate(st, ID, {});
  const detail = ctx.detail;
  if (action === "term") {
    vs.term = arg;
    vs.anim = false;
    if (vs.mode === "step") vs.step = 0;
    return true;
  }
  if (action === "play") {
    vs.mode = "all";
    vs.step = PIECES.length - 1;
    vs.anim = true;
    return true;
  }
  if (action === "step") {
    vs.anim = false;
    if (vs.mode !== "step") {
      vs.mode = "step";
      vs.step = 0;
    } else vs.step = vs.step >= PIECES.length - 1 ? 0 : vs.step + 1;
    return true;
  }
  if (action === "showall") {
    vs.mode = "all";
    vs.step = PIECES.length - 1;
    vs.anim = false;
    return true;
  }
  if (action === "print") {
    openPrint(conceptDoc(detail, arg === "blank"), `word-cards-${detail.unit.id}.html`);
    return false;
  }
  return false;
}

const CSS = `
.card{border:1.5pt solid #111;border-radius:5pt;padding:7pt 9pt;margin:0 0 9pt;break-inside:avoid}
.card h3{margin:0 0 4pt;font-size:14pt;display:flex;justify-content:space-between}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:6pt}
.cell{border:1pt solid #777;border-radius:3pt;padding:4pt 6pt;min-height:0.85in}
.cell small{display:block;font-weight:700;color:#1e3a5f;margin-bottom:2pt}
.cell.blank{min-height:1in}
`;

/** One card per unit word: filled for the teacher, or blank boxes for students to complete. */
export function conceptDoc(detail, blank = false) {
  const unit = detail.unit;
  const cards = detail.studio.vocab
    .map((v) => {
      const c = conceptCard(detail, v.term);
      const cell = (label, text) =>
        `<div class="cell${blank ? " blank" : ""}"><small>${label}</small>${blank ? "" : esc(text)}</div>`;
      return `<div class="card"><h3><span>${esc(c.term)}${blank ? "" : ` <span class="small">${esc(c.pos)}</span>`}</span><span class="small">${c.es && !blank ? esc(c.es) : ""}</span></h3>
        <div class="grid">${cell("Meaning (in my words)", c.def)}${cell("Example", c.example)}${cell("Not an example", c.nonexample)}${cell("Draw it", c.cue ? `Idea: ${c.cue}` : "")}</div></div>`;
    })
    .join("");
  const body = `
    <div class="head"><div><h1>Word cards${blank ? "" : " (teacher copy)"}</h1><div class="meta">${unitLine(unit)}</div></div>${blank ? `<div class="name">Name <span></span></div>` : ""}</div>
    ${blank ? `<p class="small">Words: ${detail.studio.vocab.map((v) => esc(v.term)).join(", ")}. Fill in each card.</p>` : ""}${cards}`;
  return doc(`Word cards - ${unit.unit_title}`, body, FOOT, CSS);
}
