// Shared station mechanics for games whose language goal is selecting and defending a response.
// Each module supplies a different station identity, authored bilingual content and distinct shell art.
import { audioBtn, choiceList, feedbackHTML, hintHTML, html, icon, judge, newRound, pips, settled, shuffle, takeHint } from "./engine.js";

const labels = {
  "grammar-jungle": ["Jungle station", "Estación de la selva"],
  "story-detective": ["Clue board", "Tablero de pistas"],
  "sentence-strategy": ["Strategy square", "Casilla de estrategia"],
  "sound-word-studio": ["Sound mixer", "Mezclador de sonidos"],
  "read-along-theater": ["Story page", "Página del cuento"],
  "fluency-echo": ["Echo rehearsal", "Ensayo de eco"],
  "story-world": ["Story map", "Mapa del cuento"],
  "word-bingo": ["Bingo card", "Tarjeta de bingo"],
  "sentence-factory": ["Factory station", "Estación de la fábrica"],
  "spelling-expedition": ["Mountain checkpoint", "Puesto de la montaña"],
  "word-search-adventure": ["Clue trail", "Ruta de pistas"],
  "story-creator": ["Story board", "Tablero de cuentos"],
  "language-arcade": ["Gate challenge", "Reto de la puerta"],
  "escape-room": ["Room lock", "Cerradura de la sala"],
};

export function createChoiceGame(id) {
  return {
    id,
    init(env) {
      const source = env.content.rounds || env.content.bands?.[env.band]?.rounds || [];
      const rows = source.slice(0, env.count(source.length, Math.min(2, source.length)));
      return { rounds: rows.map((row) => {
        const order = shuffle(row.choices.map((_, i) => i), env.rng);
        return { id: row.id, prompt: row.prompt, hint: row.hint, explain: row.explain, choices: order.map((i) => row.choices[i]), answer: order.indexOf(row.answer), pick: null, rs: newRound() };
      }), i: 0 };
    },
    done: (s) => s.i >= s.rounds.length,
    progress(s) { return { done: s.rounds.filter((r) => settled(r.rs)).length, total: s.rounds.length }; },
    view(s, env) {
      const I = env.I;
      const row = s.rounds[s.i];
      if (!row) return html`<p role="status">${I.T("All stations complete.", "Todas las estaciones están completas.")}</p>`;
      const p = this.progress(s);
      const locked = settled(row.rs);
      const choices = row.choices.map((c) => I.T(c.en, c.es));
      const answer = choices[row.answer];
      const chosen = row.pick === null ? "" : choices[row.pick];
      const num = s.i + 1;
      const [stationEn, stationEs] = labels[id] || ["Language station", "Estación de lenguaje"];
      return html`<section class="cg-station cg-${id}" data-mechanic="${env.content.mechanic}">
        <div class="cg-route"><span class="cg-route-icon" aria-hidden="true">${icon(id === "escape-room" ? "lock" : id === "word-bingo" ? "sparkle" : "arrow-right")}</span><span>${I.T(stationEn, stationEs)} · ${num}</span></div>
        ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} stations complete`, `${p.done} de ${p.total} estaciones completas`), I.S)}
        <h2 class="cg-prompt">${I.T(row.prompt.en, row.prompt.es)}</h2>
        ${env.sup.audio === "auto" || env.sup.audio === "tap" ? audioBtn(row.prompt.en, I, I.S("Listen to the prompt", "Escuchar la pregunta")) : ""}
        <p class="cg-instruction">${I.T("Choose the response that best fits the clues.", "Elige la respuesta que mejor encaja con las pistas.")}</p>
        ${choiceList(choices, { name: "choice", sel: row.pick, locked, right: locked ? row.answer : -1, picked: locked && row.pick !== row.answer ? [row.pick] : [] })}
        ${hintHTML(row.rs, [I.T(row.hint.en, row.hint.es), I.T("Read the prompt again and compare the details in each choice.", "Lee la pregunta otra vez y compara los detalles de cada opción."), I.T("Look for the choice supported by the strongest clue.", "Busca la opción que se apoya en la pista más sólida.")], env, { disabled: locked })}
        ${feedbackHTML(row.rs, { I, right: I.T("Your choice fits the prompt.", "Tu elección encaja con la pregunta."), retry: I.T("Use a detail in the prompt to revise your choice.", "Usa un detalle de la pregunta para revisar tu elección."), answer: I.T(`A response that fits: ${answer}`, `Una respuesta que encaja: ${answer}`), explain: I.T(row.explain.en, row.explain.es), hint: row.rs.h ? I.T(row.hint.en, row.hint.es) : "" })}
        ${!locked ? html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-check ${row.pick === null ? "disabled" : ""}>${icon("check")}${I.T("Check my thinking", "Revisar mi idea")}</button></div>` : html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${s.i + 1 === s.rounds.length ? I.T("Finish stations", "Terminar las estaciones") : I.T("Next station", "Siguiente estación")}</button></div>`}
      </section>`;
    },
    click(el, s, env) {
      const b = el.closest("button");
      if (!b) return false;
      const row = s.rounds[s.i];
      if (!row) return false;
      if (b.dataset.gChoice !== undefined && !settled(row.rs)) { row.pick = Number(b.dataset.gChoice); return true; }
      if (b.hasAttribute("data-g-check") && row.pick !== null && !settled(row.rs)) {
        judge(row.rs, row.pick === row.answer, env, { id: row.id, skill: env.def.skill.toLowerCase() });
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
      const choice = wrong ? (row.answer + 1) % row.choices.length : row.answer;
      return [{ click: `[data-g-choice="${choice}"]` }, { click: "[data-g-check]" }];
    },
    validate(content) {
      const errors = [];
      for (const band of ["3-5", "6-8"]) {
        const rows = content.bands?.[band]?.rounds || [];
        if (rows.length < 2) errors.push(`${band}: needs at least two authored stations`);
        rows.forEach((r) => {
          if (!r.prompt?.en || !r.prompt?.es) errors.push(`${band}/${r.id}: prompt must be bilingual`);
          if (!Array.isArray(r.choices) || r.choices.length < 3 || !Number.isInteger(r.answer) || r.answer < 0 || r.answer >= r.choices.length) errors.push(`${band}/${r.id}: needs 3+ choices and a valid answer index`);
          if (!r.hint?.en || !r.hint?.es || !r.explain?.en || !r.explain?.es) errors.push(`${band}/${r.id}: hint and explanation must be bilingual`);
          const answer = r.choices?.[r.answer];
          if (answer && [r.hint?.en, r.hint?.es].some((h) => h?.toLowerCase().includes(answer.en.toLowerCase()))) errors.push(`${band}/${r.id}: hint leaks an answer`);
        });
      }
      return errors;
    },
  };
}
