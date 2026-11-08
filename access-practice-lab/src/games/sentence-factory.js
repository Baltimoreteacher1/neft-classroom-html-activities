// Sentence Factory: Industrial Conveyor Assembly Line for academic sentences and discourse.
// Learners snap together syntactic blocks (Subject/Actor, Verb/Predicate, Modifiers, Connectors),
// run the mechanical Syntax Diagnostic Gauge, calibrate clause order, and ship approved sentences
// down the pneumatic transit chute. Full WIDA 2020 scaffolding across Key Language Uses (Explain, Narrate, Inform).
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

const SYNTAX_TAGS = {
  0: ["Subject & Verb Chassis", "Chasis de sujeto y verbo"],
  1: ["Clause Expander", "Expansor de cláusula"],
  2: ["Discourse Connector", "Conector discursivo"],
  3: ["Precision Modifier", "Modificador de precisión"],
};

function machineryGauge(level = 0, isSettled = false, isRight = false) {
  const angle = isRight ? 65 : level === 0 ? -65 : isSettled ? -20 : 15;
  const color = isRight ? "#2b7447" : isSettled ? "#c94f3b" : "#f2c15b";
  const statusText = isRight ? "VERIFIED" : isSettled ? "ALIGN REQ" : level > 0 ? "DOCKED" : "STANDBY";
  return svg(
    "0 0 160 90",
    `<defs>
      <linearGradient id="sf-g-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#c94f3b"/>
        <stop offset="50%" stop-color="#f2c15b"/>
        <stop offset="100%" stop-color="#2b7447"/>
      </linearGradient>
    </defs>
    <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="#2a3d52" stroke-width="14" stroke-linecap="round"/>
    <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="url(#sf-g-grad)" stroke-width="8" stroke-linecap="round"/>
    <circle cx="80" cy="80" r="10" fill="#14263d" stroke="#6d7e90" stroke-width="3"/>
    <g transform="rotate(${angle} 80 80)">
      <line x1="80" y1="80" x2="80" y2="28" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="80" cy="28" r="3" fill="#ffffff"/>
    </g>
    <rect x="45" y="68" width="70" height="18" rx="4" fill="#0f1f30" stroke="#3b526d" stroke-width="1.5"/>
    <text x="80" y="81" font-size="10" font-weight="800" text-anchor="middle" fill="${color}" font-family="monospace">${statusText}</text>`,
    { cls: "sf-gauge-svg", label: `Syntax calibration: ${statusText}` }
  );
}

function cogWheel(size = 40, spin = false) {
  return svg(
    "0 0 40 40",
    `<circle cx="20" cy="20" r="14" fill="#47596f" stroke="#1b2a3a" stroke-width="2"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="17" y="2" width="6" height="8" rx="1.5" fill="#47596f" stroke="#1b2a3a" stroke-width="1.5" transform="rotate(${i * 45} 20 20)"/>`).join("")}
    <circle cx="20" cy="20" r="5" fill="#f6e9cc" stroke="#1b2a3a" stroke-width="1.5"/>`,
    { cls: `sf-cog ${spin ? "is-spinning" : ""}`, style: `width:${size}px;height:${size}px;` }
  );
}

export default {
  id: "sentence-factory",

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
      return html`<section class="sf-complete-banner" role="status">
        <div class="sf-stamp">${icon("check")}</div>
        <h2>${I.T("All Assembly Stations Complete!", "¡Todas las estaciones de ensamblaje están completas!")}</h2>
        <p>${I.T("Your constructed sentences have cleared final mechanical inspection and shipped to the language network.", "Tus oraciones construidas pasaron la inspección mecánica final y se enviaron a la red de lenguaje.")}</p>
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
    const num = s.i + 1;
    const [syntaxEn, syntaxEs] = SYNTAX_TAGS[s.i % 4] || SYNTAX_TAGS[0];

    return html`<section class="sf-station ${locked ? "is-settled" : ""} ${isRight ? "is-approved" : ""}" data-mechanic="factory-line">
      <!-- Factory Top Bar: Station status & Diagnostic Meter -->
      <div class="sf-header">
        <div class="sf-station-badge">
          <span class="sf-cogs" aria-hidden="true">${cogWheel(26, !locked)} ${cogWheel(20, !locked)}</span>
          <span class="sf-station-name">${I.T("Station", "Estación")} ${num} · ${I.T(syntaxEn, syntaxEs)}</span>
        </div>
        <div class="sf-gauge-wrap">
          ${machineryGauge(row.pick === null ? 0 : 1, locked, isRight)}
        </div>
      </div>

      ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} sentences assembled`, `${p.done} de ${p.total} oraciones ensambladas`), I.S)}

      <!-- Factory Machine Prompt Area -->
      <div class="sf-console">
        <div class="sf-console-screen">
          <div class="sf-terminal-hdr">
            <span class="sf-led ${locked ? (isRight ? "is-green" : "is-red") : "is-amber"}" aria-hidden="true"></span>
            <span class="sf-terminal-tag">${I.T("CONSTRUCTION BLUEPRINT", "PLANO DE CONSTRUCCIÓN")}</span>
          </div>
          <h2 class="sf-prompt">${I.T(row.prompt.en, row.prompt.es)}</h2>
          ${env.sup.audio === "auto" || env.sup.audio === "tap" ? audioBtn(row.prompt.en, I, I.S("Listen to the factory prompt", "Escuchar la instrucción")) : ""}
        </div>
      </div>

      <!-- Conveyor Assembly Bay: Displays the docked unit -->
      <div class="sf-conveyor-bay">
        <div class="sf-conveyor-track">
          <div class="sf-track-rollers" aria-hidden="true">
            ${Array.from({ length: 8 }, (_, i) => `<span class="sf-roller"></span>`).join("")}
          </div>
          <div class="sf-docking-cradle ${chosen ? "has-payload" : "is-empty"} ${isRight ? "is-shipped" : ""}">
            ${chosen ? html`
              <div class="sf-payload-card">
                <span class="sf-clamp-icon" aria-hidden="true">${icon("check")}</span>
                <p class="sf-payload-text">${chosen.label}</p>
                ${isRight ? html`<span class="sf-quality-seal">${I.T("VERIFIED", "VERIFICADO")}</span>` : ""}
              </div>
            ` : html`
              <div class="sf-empty-cradle">
                <span class="sf-arrow-down" aria-hidden="true">↓</span>
                <span>${I.T("Conveyor Bay Ready · Dock a word module below", "Bahía lista · Conecta un módulo de palabras abajo")}</span>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Component Blocks Bank: Module Choices -->
      <div class="sf-module-bank" role="radiogroup" aria-label="${I.S("Sentence assembly modules", "Módulos de ensamblaje de oraciones")}">
        <p class="sf-bank-label">${I.T("Available Sentence Modules:", "Módulos de oración disponibles:")}</p>
        <div class="sf-blocks-grid">
          ${choices.map((c, idx) => {
            const isPicked = row.pick === idx;
            const isAnswer = locked && idx === row.answer;
            const isWrongPick = locked && isPicked && !isRight;
            const blockStatus = isAnswer ? "is-answer" : isWrongPick ? "is-faulty" : isPicked ? "is-docked" : "";
            return html`
              <button
                type="button"
                class="sf-word-block ${blockStatus}"
                data-g-choice="${idx}"
                role="radio"
                aria-checked="${String(isPicked)}"
                ${locked ? "disabled" : ""}
              >
                <span class="sf-block-header">
                  <span class="sf-block-pin" aria-hidden="true"></span>
                  <span class="sf-module-tag">MOD-0${idx + 1}</span>
                  ${isPicked ? html`<span class="sf-dock-pill">${I.T("DOCKED", "ACOPLADO")}</span>` : ""}
                </span>
                <span class="sf-block-body">${c.label}</span>
                ${env.sup.gloss !== "off" && c.es ? glossHTML(c.es, env) : ""}
              </button>
            `;
          })}
        </div>
      </div>

      <!-- Hint & Diagnostic Feedback -->
      ${hintHTML(
        row.rs,
        [
          I.T(row.hint.en, row.hint.es),
          I.T("Check subject-verb agreement and logical connector order.", "Revisa la concordancia entre sujeto y verbo y el orden del conector."),
          I.T("Look for the structure that connects causes directly to effects.", "Busca la estructura que conecta directamente las causas con los efectos."),
        ],
        env,
        { disabled: locked }
      )}

      ${feedbackHTML(row.rs, {
        I,
        right: I.T("Sentence verified! Conveyor cleared for transit.", "¡Oración verificada! Cinta transportadora lista para el despacho."),
        retry: I.T("Mechanical mismatch detected. Inspect the clause alignment and recalibrate.", "Desajuste mecánico detectado. Revisa la alineación de las cláusulas y recalibra."),
        answer: I.T(`Calibrated assembly: ${answer}`, `Ensamblaje calibrado: ${answer}`),
        explain: I.T(row.explain.en, row.explain.es),
        hint: row.rs.h ? I.T(row.hint.en, row.hint.es) : "",
      })}

      <!-- Machine Operating Actions -->
      <div class="gs-actions sf-actions">
        ${!locked ? html`
          <button
            type="button"
            class="btn btn-primary btn-big sf-act-btn"
            data-g-check
            ${row.pick === null ? "disabled" : ""}
          >
            ${icon("check")}
            <span>${I.T("Run Machinery · Check Assembly", "Activar maquinaria · Probar ensamblaje")}</span>
          </button>
        ` : html`
          <button
            type="button"
            class="btn btn-primary btn-big sf-act-btn is-advance"
            data-g-next
          >
            ${icon("arrow-right")}
            <span>${s.i + 1 === s.rounds.length ? I.T("Ship Final Freight · Finish Factory", "Despachar carga · Terminar fábrica") : I.T("Advance Conveyor · Next Station", "Avanzar cinta · Siguiente estación")}</span>
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
      if (rows.length < 2) errors.push(`${band}: needs at least two authored factory stations`);
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
