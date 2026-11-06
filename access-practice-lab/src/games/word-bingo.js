// Word Bingo. A caller (Pip in 3-5, Juno in 6-8) reads a clue; the learner finds the matching word on a 3x3 card
// (free space in the middle) and taps it to stamp it. A miss gets a hint and a second try; a second miss reveals the
// word as "learned" so the card still fills. Three correct stamps in a row is BINGO. Clues are drawn in a seeded
// random order and the whole card is state, so a reload resumes the same game. No timers: understanding is the score.
import { audioBtn, feedbackHTML, hintHTML, html, icon, judge, newRound, pips, settled, shuffle, takeHint } from "./engine.js";
import { mascot, svg } from "./art.js";

const FREE = 4;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const cellWord = (s, g) => (g === FREE ? -1 : s.cells[g < FREE ? g : g - 1]);
const stamped = (s, only) => {
  const on = new Set([FREE]);
  s.rounds.forEach((r) => { if (r.mark === "right" || (!only && r.mark === "learned")) on.add(s.cells.indexOf(r.answer) + (s.cells.indexOf(r.answer) >= FREE ? 1 : 0)); });
  return on;
};
const bingos = (s) => { const on = stamped(s, true); return LINES.filter((l) => l.every((g) => on.has(g))).length; };
const ball = (n, band) => svg("0 0 64 64", `<circle cx="32" cy="32" r="28" fill="#f2c15b" stroke="#17324d" stroke-width="${band === "3-5" ? 3 : 1.5}"/><circle cx="32" cy="32" r="17" fill="#fff"/><text x="32" y="29" text-anchor="middle" font-size="11" font-weight="800" fill="#17324d">${"BINGO"[(n - 1) % 5]}</text><text x="32" y="43" text-anchor="middle" font-size="15" font-weight="800" fill="#17324d">${n}</text>`, { cls: "bg-ball" });

export default {
  id: "word-bingo",

  init(env) {
    const band = env.content.bands?.[env.band] || env.content;
    const card = band.card;
    const calls = shuffle(band.rounds, env.rng);
    const take = calls.slice(0, env.count(calls.length, Math.min(4, calls.length)));
    return {
      cells: shuffle(card.map((_, i) => i), env.rng),
      rounds: take.map((r) => ({ id: r.id, prompt: r.prompt, hint: r.hint, explain: r.explain, answer: r.answer, rs: newRound(), mark: null })),
      card, i: 0, band: env.band, seen: 0,
    };
  },

  done: (s) => s.i >= s.rounds.length,
  progress: (s) => ({ done: s.rounds.filter((r) => settled(r.rs)).length, total: s.rounds.length }),

  view(s, env) {
    const I = env.I;
    const row = s.rounds[s.i];
    if (!row) return html`<p role="status">${I.T("Your card is complete.", "Tu tarjeta está completa.")}</p>`;
    const p = this.progress(s);
    const locked = settled(row.rs);
    const on = stamped(s);
    const wins = bingos(s);
    const word = s.card[row.answer];
    const mood = row.rs.status === "right" ? "cheer" : row.rs.status === "retry" ? "think" : "hi";
    const caller = s.band === "6-8" ? "juno" : "pip";
    const cells = Array.from({ length: 9 }, (_, g) => {
      if (g === FREE) return html`<li class="bg-cell is-free"><span class="bg-free">${icon("sparkle")}<span>${I.T("FREE", "GRATIS")}</span></span></li>`;
      const w = cellWord(s, g);
      const mark = s.rounds.find((r) => r.answer === w)?.mark;
      const missed = row.rs.picks.includes(w) && !locked;
      const state = mark === "right" ? "is-stamped" : mark === "learned" ? "is-learned" : "";
      const label = I.S(s.card[w].en, s.card[w].es) + (mark === "right" ? I.S(", stamped", ", sellada") : mark === "learned" ? I.S(", learned", ", aprendida") : "");
      return html`<li><button type="button" class="bg-cell ${state}${missed ? " is-miss" : ""}${locked && w === row.answer && !mark ? " is-reveal" : ""}" data-g-choice="${w}" aria-label="${label}" ${locked || mark ? "disabled" : ""}>
        <span class="bg-word">${I.T(s.card[w].en, s.card[w].es)}</span>${mark ? html`<span class="bg-dab" aria-hidden="true">${mark === "right" ? icon("check") : icon("help")}</span>` : ""}</button></li>`;
    });
    const line = wins ? I.T(`BINGO! ${wins} line${wins > 1 ? "s" : ""} of three.`, `¡BINGO! ${wins} ${wins > 1 ? "líneas" : "línea"} de tres.`) : I.T("Stamp three in a row for BINGO.", "Sella tres en fila para hacer BINGO.");
    return html`<section class="cg-station bg-board bg-${caller}" data-mechanic="bingo-card">
      ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} words called`, `${p.done} de ${p.total} palabras cantadas`), I.S)}
      <div class="bg-caller">
        <div class="bg-guide">${mascot(caller, s.band, mood, 88)}</div>
        <div class="bg-call">${ball(s.i + 1, s.band)}<div class="bg-bubble">
          <p class="bg-label">${I.T("Caller clue", "Pista del locutor")} · ${s.i + 1}/${s.rounds.length}</p>
          <h2 class="cg-prompt">${I.T(row.prompt.en, row.prompt.es)}</h2>
          ${audioBtn(row.prompt.en, I, I.S("Hear the clue", "Escuchar la pista"))}</div></div>
      </div>
      <p class="bg-score${wins ? " is-bingo" : ""}" role="status" aria-live="polite">${icon(wins ? "medal" : "sparkle")}${line}</p>
      <p class="cg-instruction">${I.T("Tap the word on your card that fits the clue.", "Toca la palabra de tu tarjeta que encaja con la pista.")}</p>
      <ul class="bg-card" role="group" aria-label="${I.S("Your bingo card", "Tu tarjeta de bingo")}">${cells}</ul>
      ${hintHTML(row.rs, [I.T(row.hint.en, row.hint.es), I.T(`It starts with “${I.S(word.en, word.es)[0]}”.`, `Empieza con “${I.S(word.en, word.es)[0]}”.`), I.T(`It has ${word.en.length} letters.`, `Tiene ${word.es.length} letras.`)], env, { disabled: locked })}
      ${feedbackHTML(row.rs, { I, right: I.T("Stamped! That word fits the clue.", "¡Sellada! Esa palabra encaja con la pista."), retry: I.T("Not that one. Read the clue again, then try another word.", "Esa no. Lee la pista otra vez y prueba otra palabra."), answer: I.T(`The word was: ${word.en}`, `La palabra era: ${word.es}`), explain: I.T(row.explain.en, row.explain.es), hint: "" })}
      ${locked ? html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${s.i + 1 === s.rounds.length ? I.T("Finish my card", "Terminar mi tarjeta") : I.T("Call the next word", "Cantar la siguiente palabra")}</button></div>` : ""}
      <p class="fine bg-count">${I.T(`Stamps: ${on.size - 1} of 8`, `Sellos: ${on.size - 1} de 8`)}</p>
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    const row = s.rounds[s.i];
    if (!b || !row) return false;
    if (b.dataset.gChoice !== undefined && !settled(row.rs)) {
      const pick = Number(b.dataset.gChoice);
      if (row.rs.picks.includes(pick)) return false;
      row.rs.picks.push(pick);
      judge(row.rs, pick === row.answer, env, { id: row.id, skill: env.def.skill.toLowerCase() });
      if (row.rs.status === "right") row.mark = "right";
      else if (row.rs.status === "revealed") row.mark = "learned";
      return true;
    }
    if (b.hasAttribute("data-g-hint") && !settled(row.rs)) { takeHint(row.rs, env); return true; }
    if (b.hasAttribute("data-g-next") && settled(row.rs)) { s.i += 1; return true; }
    return false;
  },

  plan(s, { wrong } = {}) {
    const row = s.rounds[s.i];
    if (!row) return [];
    if (settled(row.rs)) return [{ click: "[data-g-next]" }];
    const open = s.card.map((_, w) => w).filter((w) => !row.rs.picks.includes(w) && !s.rounds.some((r) => r.answer === w && r.mark));
    const pick = wrong ? open.find((w) => w !== row.answer) : row.answer;
    return [{ click: `[data-g-choice="${pick}"]` }];
  },

  validate(content) {
    const errors = [];
    for (const band of ["3-5", "6-8"]) {
      const { card = [], rounds = [] } = content.bands?.[band] || {};
      if (card.length !== 8) errors.push(`${band}: the bingo card needs exactly 8 words around the free space`);
      if (rounds.length < 4) errors.push(`${band}: needs at least four caller clues`);
      card.forEach((w, i) => { if (!w.en || !w.es) errors.push(`${band}: card word ${i} must be bilingual`); });
      if (new Set(card.map((w) => w.en)).size !== card.length) errors.push(`${band}: card words must be unique`);
      rounds.forEach((r) => {
        if (!r.prompt?.en || !r.prompt?.es) errors.push(`${band}/${r.id}: clue must be bilingual`);
        if (!Number.isInteger(r.answer) || r.answer < 0 || r.answer >= card.length) errors.push(`${band}/${r.id}: answer must index a card word`);
        if (!r.hint?.en || !r.hint?.es || !r.explain?.en || !r.explain?.es) errors.push(`${band}/${r.id}: hint and explanation must be bilingual`);
        const w = card[r.answer];
        if (w && [r.hint?.en, r.hint?.es, r.explain?.es && null].some((h) => h?.toLowerCase().includes(w.en.toLowerCase()) || h?.toLowerCase().includes(w.es.toLowerCase()))) errors.push(`${band}/${r.id}: hint leaks the answer`);
        if (w && r.hint?.en === r.explain?.en) errors.push(`${band}/${r.id}: explanation must say why, not repeat the hint`);
        if (w && new RegExp(`\\b${w.en}\\b`, "i").test(r.prompt.en)) errors.push(`${band}/${r.id}: clue says the answer word`);
      });
      if (new Set(rounds.map((r) => r.answer)).size !== rounds.length) errors.push(`${band}: each clue must point to a different card word`);
    }
    return errors;
  },
};
