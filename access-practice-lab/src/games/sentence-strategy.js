// Sentence Strategy: Tactical discourse territory grid for argumentative and explanatory language.
// Learners claim tactical nodes across a 3x3 strategic sector map by deploying claims, evidence,
// warrants, and concession statements. Aligns with WIDA Key Language Uses (Argue and Explain).
import {
  audioBtn,
  feedbackHTML,
  glossHTML,
  hintHTML,
  html,
  icon,
  judge,
  newRound,
  pips,
  settled,
  shuffle,
  takeHint,
} from "./engine.js";
import { svg } from "./art.js";

const SECTORS = [
  { coord: "A-1", tag: "Primary Claim", iconName: "flag" },
  { coord: "A-2", tag: "Factual Evidence", iconName: "evidence" },
  { coord: "A-3", tag: "Logical Warrant", iconName: "tools" },
  { coord: "B-1", tag: "Cause & Effect", iconName: "arrow-right" },
  { coord: "B-2", tag: "Central Thesis", iconName: "star" },
  { coord: "B-3", tag: "Counter-Claim", iconName: "alert" },
  { coord: "C-1", tag: "Supporting Detail", iconName: "detective" },
  { coord: "C-2", tag: "Rebuttal Shield", iconName: "help" },
  { coord: "C-3", tag: "Synthesis Point", iconName: "check" },
];

function strategicGridSVG(activeIdx, settledRounds) {
  return html`
    <div class="sst-grid" role="region" aria-label="3 by 3 Tactical Strategy Board">
      ${SECTORS.map((sec, i) => {
        const isCurrent = i === activeIdx;
        const isCaptured = i < activeIdx || (settledRounds[i] && settled(settledRounds[i].rs) && settledRounds[i].rs.status === "right");
        const isMissed = settledRounds[i] && settled(settledRounds[i].rs) && settledRounds[i].rs.status !== "right";
        const nodeClass = isCaptured ? "is-captured" : isMissed ? "is-neutral" : isCurrent ? "is-active" : "is-idle";
        return html`
          <div class="sst-node ${nodeClass}">
            <div class="sst-node-head">
              <span class="sst-node-coord">${sec.coord}</span>
              <span class="sst-node-icon" aria-hidden="true">${icon(sec.iconName)}</span>
            </div>
            <div class="sst-node-tag">${sec.tag}</div>
            <div class="sst-node-status">${isCaptured ? "CAPTURED" : isCurrent ? "DEPLOYING" : "OPEN"}</div>
          </div>
        `;
      })}
    </div>
  `;
}

export default {
  id: "sentence-strategy",

  init(env) {
    const source = env.content.rounds || env.content.bands?.[env.band]?.rounds || [];
    const rows = source.slice(0, env.count(source.length, Math.min(3, source.length)));
    return {
      rounds: rows.map((row) => {
        const order = shuffle(row.choices.map((_, i) => i), env.rng);
        return {
          id: row.id,
          prompt: row.prompt,
          hint: row.hint,
          explain: row.explain,
          choices: order.map((i) => row.choices[i]),
          answer: order.indexOf(row.answer),
          pick: null,
          rs: newRound(),
        };
      }),
      i: 0,
    };
  },

  done: (s) => s.i >= s.rounds.length,
  progress: (s) => ({
    done: s.rounds.filter((r) => settled(r.rs)).length,
    total: s.rounds.length,
  }),

  view(s, env) {
    const I = env.I;
    const row = s.rounds[s.i];
    if (!row) {
      return html`<section class="sst-complete-banner" role="status">
        <div class="sst-crown">${icon("star")}</div>
        <h2>${I.T("Tactical Discourse Board Secured!", "¡Tablero de discurso táctico asegurado!")}</h2>
        <p>${I.T("All strategic argumentation sectors have been captured with evidence-backed claims and cohesive warrants.", "Todos los sectores estratégicos de argumentación se han asegurado con afirmaciones respaldadas por evidencia y justificaciones cohesivas.")}</p>
      </section>`;
    }

    const p = this.progress(s);
    const locked = settled(row.rs);
    const isRight = row.rs.status === "right";
    const choices = row.choices.map((c) => ({
      en: c.en,
      es: c.es,
      label: I.T(c.en, c.es),
    }));
    const answer = choices[row.answer]?.label || "";
    const chosen = row.pick === null ? null : choices[row.pick];
    const sector = SECTORS[s.i % SECTORS.length];

    return html`<section class="sst-station ${locked ? "is-settled" : ""} ${isRight ? "is-secured" : ""}" data-mechanic="tic-tac-toe">
      <!-- Tactical Board & Sector Map -->
      <div class="sst-board-container">
        <div class="sst-top-banner">
          <span class="sst-mission-title">STRATEGY BOARD · SECTOR ${sector.coord} (${sector.tag})</span>
          <span class="sst-control-score">${I.T("Node Objective: Capture Territory", "Objetivo del nodo: Capturar territorio")}</span>
        </div>
        ${strategicGridSVG(s.i, s.rounds)}
      </div>

      ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} sectors secured`, `${p.done} de ${p.total} sectores asegurados`), I.S)}

      <!-- Tactical Argumentation Mission -->
      <div class="sst-mission-box">
        <div class="sst-mission-header">
          <span class="sst-badge">${sector.icon} ${sector.tag}</span>
          <h2 class="sst-prompt">${I.T(row.prompt.en, row.prompt.es)}</h2>
        </div>
        ${env.sup.audio === "auto" || env.sup.audio === "tap" ? audioBtn(row.prompt.en, I, I.S("Listen to tactical prompt", "Escuchar instrucción táctica")) : ""}
      </div>

      <!-- Tactical Move Options (Choices) -->
      <div class="sst-moves-matrix" role="radiogroup" aria-label="${I.S("Tactical discourse moves", "Movimientos de discurso tácticos")}">
        <p class="sst-matrix-title">${I.T("Deploy Discourse Statement to Sector:", "Despliega enunciado de discurso al sector:")}</p>
        <div class="sst-moves-list">
          ${choices.map((c, idx) => {
            const isPicked = row.pick === idx;
            const isAnswer = locked && idx === row.answer;
            const isWrongPick = locked && isPicked && !isRight;
            const moveClass = isAnswer ? "is-answer" : isWrongPick ? "is-rebutted" : isPicked ? "is-targeted" : "";
            return html`
              <button
                type="button"
                class="sst-move-btn ${moveClass}"
                data-g-choice="${idx}"
                role="radio"
                aria-checked="${String(isPicked)}"
                ${locked ? "disabled" : ""}
              >
                <span class="sst-move-marker">#0${idx + 1}</span>
                <span class="sst-move-label">${c.label}</span>
                ${env.sup.gloss !== "off" && c.es ? glossHTML(c.es, env) : ""}
              </button>
            `;
          })}
        </div>
      </div>

      <!-- Tactical Scaffolds & Rebuttal Feedback -->
      ${hintHTML(
        row.rs,
        [
          I.T(row.hint.en, row.hint.es),
          I.T("Select the statement that directly supports the claim with logical reasoning.", "Elige el enunciado que respalda directamente la afirmación con razonamiento lógico."),
          I.T("Ensure the transition links ideas without leaving logical gaps.", "Asegura que la transición una las ideas sin dejar brechas lógicas."),
        ],
        env,
        { disabled: locked }
      )}

      ${feedbackHTML(row.rs, {
        I,
        right: I.T("Tactical Node Secured! Sector territory captured.", "¡Nodo táctico asegurado! Territorio del sector capturado."),
        retry: I.T("Rebuttal Encountered: Discourse move insufficiently supported. Review evidence.", "Refutación encontrada: Movimiento de discurso insuficientemente respaldado. Revisa la evidencia."),
        answer: I.T(`Targeted move: ${answer}`, `Movimiento certero: ${answer}`),
        explain: I.T(row.explain.en, row.explain.es),
        hint: row.rs.h ? I.T(row.hint.en, row.hint.es) : "",
      })}

      <!-- Strategic Actions -->
      <div class="gs-actions sst-actions">
        ${!locked ? html`
          <button
            type="button"
            class="btn btn-primary btn-big sst-action-btn"
            data-g-check
            ${row.pick === null ? "disabled" : ""}
          >
            ${icon("check")}
            <span>${I.T("Deploy Move · Claim Sector", "Desplegar movimiento · Asegurar sector")}</span>
          </button>
        ` : html`
          <button
            type="button"
            class="btn btn-primary btn-big sst-action-btn is-advance"
            data-g-next
          >
            ${icon("arrow-right")}
            <span>${s.i + 1 === s.rounds.length ? I.T("Secure Full Territory · Finish", "Asegurar territorio completo · Terminar") : I.T("Advance to Next Sector", "Avanzar al siguiente sector")}</span>
          </button>
        `}
      </div>
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    if (!b) return false;
    const row = s.rounds[s.i];
    if (!row) return false;

    if (b.dataset.gChoice !== undefined && !settled(row.rs)) {
      row.pick = Number(b.dataset.gChoice);
      return true;
    }

    if (b.hasAttribute("data-g-check") && row.pick !== null && !settled(row.rs)) {
      judge(row.rs, row.pick === row.answer, env, {
        id: row.id,
        skill: env.def?.skill?.toLowerCase() || "writing",
      });
      return true;
    }

    if (b.hasAttribute("data-g-hint") && !settled(row.rs)) {
      takeHint(row.rs, env);
      return true;
    }

    if (b.hasAttribute("data-g-next") && settled(row.rs)) {
      s.i += 1;
      return true;
    }

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
      if (rows.length < 2) errors.push(`${band}: needs at least two authored strategy rounds`);
      rows.forEach((r) => {
        if (!r.prompt?.en || !r.prompt?.es) errors.push(`${band}/${r.id}: prompt must be bilingual`);
        if (
          !Array.isArray(r.choices) ||
          r.choices.length < 3 ||
          !Number.isInteger(r.answer) ||
          r.answer < 0 ||
          r.answer >= r.choices.length
        )
          errors.push(`${band}/${r.id}: needs 3+ choices and a valid answer index`);
        if (!r.hint?.en || !r.hint?.es || !r.explain?.en || !r.explain?.es)
          errors.push(`${band}/${r.id}: hint and explanation must be bilingual`);
        const answer = r.choices?.[r.answer];
        if (
          answer &&
          [r.hint?.en, r.hint?.es].some((h) => h?.toLowerCase().includes(answer.en.toLowerCase()))
        )
          errors.push(`${band}/${r.id}: hint leaks an answer`);
      });
    }
    return errors;
  },
};
