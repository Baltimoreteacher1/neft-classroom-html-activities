// Academic Language Escape Room: Four subject chambers requiring forensic linguistic deduction.
// Chamber 1: Bio-Research Vault (Science) — empirical observations, hypothesis validation
// Chamber 2: Ancient Archive (Social Studies) — historical artifact evidence, chronology, perspective
// Chamber 3: Cryptographic Terminal (Mathematics) — logical patterns, coordinate systems, ratio deductions
// Chamber 4: The Scriptorium (Language Arts) — rhetorical analysis, claim and evidence justification
// Full WIDA 2020 Framework alignment across all 4 Key Language Uses (Narrate, Inform, Explain, Argue).
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

const CHAMBERS = [
  {
    name: ["Bio-Research Vault", "Bóveda de Investigación Biológica"],
    iconName: "evidence",
    standard: "Language for Science",
    theme: "#167c75",
  },
  {
    name: ["Ancient Archive", "Archivo de la Antigüedad"],
    iconName: "library",
    standard: "Language for Social Studies",
    theme: "#b9814a",
  },
  {
    name: ["Cryptographic Terminal", "Terminal Criptográfica"],
    iconName: "tools",
    standard: "Language for Mathematics",
    theme: "#17324d",
  },
  {
    name: ["The Scriptorium", "El Scriptorium"],
    iconName: "words",
    standard: "Language for Language Arts",
    theme: "#c94f3b",
  },
];

function vaultBlueprint(currentIdx, totalRooms, rounds) {
  return html`
    <div class="er-blueprint" role="region" aria-label="Facility Blueprint and Chamber Security Status">
      <div class="er-blueprint-header">
        <span class="er-blueprint-title">SECURITY FACILITY SCHEMATIC · 4-CHAMBER SYSTEM</span>
        <span class="er-security-level">WIDA PROTOCOL ACTIVE</span>
      </div>
      <div class="er-chambers-grid">
        ${Array.from({ length: totalRooms }, (_, i) => {
          const room = CHAMBERS[i % 4];
          const isDone = i < currentIdx || (rounds[i] && settled(rounds[i].rs) && rounds[i].rs.status === "right");
          const isCurrent = i === currentIdx;
          const statusClass = isDone ? "is-cleared" : isCurrent ? "is-active" : "is-locked";
          const statusIcon = isDone ? icon("check") : isCurrent ? icon("alert") : icon("lock");
          const statusText = isDone ? "CLEARED" : isCurrent ? "BREACH ACTIVE" : "LOCKED";
          return html`
            <div class="er-chamber-node ${statusClass}">
              <div class="er-node-top">
                <span class="er-node-icon" aria-hidden="true">${icon(room.iconName)}</span>
                <span class="er-node-badge">${statusIcon} ${statusText}</span>
              </div>
              <div class="er-node-name">${room.name[0]}</div>
              <div class="er-node-sub">${room.standard}</div>
            </div>
          `;
        })}
      </div>
    </div>
  `;
}

function lockMechanismSVG(isUnlocked = false, isSettled = false) {
  const dialAngle = isUnlocked ? 90 : isSettled ? -45 : 0;
  const statusColor = isUnlocked ? "#2b7447" : isSettled ? "#c94f3b" : "#f2c15b";
  return svg(
    "0 0 100 100",
    `<circle cx="50" cy="50" r="44" fill="#0f1f30" stroke="#3b526d" stroke-width="4"/>
    <circle cx="50" cy="50" r="32" fill="#14263d" stroke="${statusColor}" stroke-width="2" stroke-dasharray="4 2"/>
    <g transform="rotate(${dialAngle} 50 50)">
      <line x1="50" y1="50" x2="50" y2="24" stroke="${statusColor}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="24" r="3" fill="#ffffff"/>
    </g>
    <circle cx="50" cy="50" r="8" fill="${statusColor}"/>
    <path d="M 22 50 L 32 50 M 68 50 L 78 50 M 50 22 L 50 32 M 50 68 L 50 78" stroke="#6d7e90" stroke-width="2"/>`,
    { cls: "er-lock-dial", label: `Lock Dial: ${isUnlocked ? "Disengaged" : "Engaged"}` }
  );
}

export default {
  id: "escape-room",

  init(env) {
    const source = env.content.rounds || env.content.bands?.[env.band]?.rounds || [];
    const rows = source.slice(0, env.count(source.length, Math.min(4, source.length)));
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
      return html`<section class="er-complete-banner" role="status">
        <div class="er-vault-open-icon">${icon("sparkle")}</div>
        <h2>${I.T("All Four Chambers Unlocked — Facility Evacuated!", "¡Las cuatro salas están desbloqueadas — Instalación evacuada!")}</h2>
        <p>${I.T("Through rigorous linguistic deduction, scientific observation, historical analysis, and rhetorical clarity, all security bulkheads have opened.", "A través de la deducción lingüística rigurosa, observación científica, análisis histórico y claridad retórica, todas las compuertas de seguridad se han abierto.")}</p>
      </section>`;
    }

    const p = this.progress(s);
    const locked = settled(row.rs);
    const isRight = row.rs.status === "right";
    const chamber = CHAMBERS[s.i % 4];
    const choices = row.choices.map((c) => ({
      en: c.en,
      es: c.es,
      label: I.T(c.en, c.es),
    }));
    const answer = choices[row.answer]?.label || "";
    const chosen = row.pick === null ? null : choices[row.pick];
    const roomNum = s.i + 1;

    return html`<section class="er-station ${locked ? "is-settled" : ""} ${isRight ? "is-cleared" : ""}" data-mechanic="locked-rooms">
      <!-- Blueprint & Status Terminal -->
      ${vaultBlueprint(s.i, s.rounds.length, s.rounds)}

      ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} chambers unlocked`, `${p.done} de ${p.total} salas desbloqueadas`), I.S)}

      <!-- Chamber Access Terminal -->
      <div class="er-terminal">
        <div class="er-terminal-head">
          <div class="er-chamber-info">
            <span class="er-chamber-avatar" aria-hidden="true">${chamber.icon}</span>
            <div>
              <span class="er-chamber-tag">${I.T("CHAMBER", "SALA")} 0${roomNum} · ${chamber.standard}</span>
              <h2 class="er-chamber-title">${I.T(chamber.name[0], chamber.name[1])}</h2>
            </div>
          </div>
          <div class="er-lock-indicator">
            ${lockMechanismSVG(isRight, locked && !isRight)}
          </div>
        </div>

        <!-- Evidence Dossier Box -->
        <div class="er-dossier">
          <div class="er-dossier-bar">
            <span class="er-dossier-tag">${icon("lock")} ${I.T("CIPHER DATA STREAM", "FLUJO DE DATOS DEL CIFRADO")}</span>
            <span class="er-dossier-sub">${I.T("Analyze textual and empirical clues", "Analiza las pistas textuales y empíricas")}</span>
          </div>
          <div class="er-prompt-card">
            <h3 class="er-prompt-text">${I.T(row.prompt.en, row.prompt.es)}</h3>
            ${env.sup.audio === "auto" || env.sup.audio === "tap" ? audioBtn(row.prompt.en, I, I.S("Intercept audio frequency", "Interceptar frecuencia de audio")) : ""}
          </div>
        </div>
      </div>

      <!-- Decryption Keys (Choice Cards) -->
      <div class="er-key-matrix" role="radiogroup" aria-label="${I.S("Security Decryption Keys", "Llaves de descifrado de seguridad")}">
        <p class="er-matrix-label">${I.T("Select Decryption Key to calibrate door bolt:", "Selecciona la llave de descifrado para calibrar el cerrojo:")}</p>
        <div class="er-keys-list">
          ${choices.map((c, idx) => {
            const isPicked = row.pick === idx;
            const isAnswer = locked && idx === row.answer;
            const isWrongPick = locked && isPicked && !isRight;
            const keyClass = isAnswer ? "is-answer" : isWrongPick ? "is-wrong" : isPicked ? "is-selected" : "";
            return html`
              <button
                type="button"
                class="er-key-card ${keyClass}"
                data-g-choice="${idx}"
                role="radio"
                aria-checked="${String(isPicked)}"
                ${locked ? "disabled" : ""}
              >
                <span class="er-key-chip" aria-hidden="true">
                  <span class="er-chip-lines"></span>
                </span>
                <span class="er-key-code">KEY-0${idx + 1}</span>
                <span class="er-key-text">${c.label}</span>
                ${env.sup.gloss !== "off" && c.es ? glossHTML(c.es, env) : ""}
              </button>
            `;
          })}
        </div>
      </div>

      <!-- Forensic Hints & Lock Feedback -->
      ${hintHTML(
        row.rs,
        [
          I.T(row.hint.en, row.hint.es),
          I.T("Re-examine the evidence log. Which key accounts for every condition stated?", "Examina de nuevo el registro de evidencia. ¿Qué llave explica todas las condiciones indicadas?"),
          I.T("Eliminate keys that contradict verified observations.", "Descarta las llaves que contradicen las observaciones verificadas."),
        ],
        env,
        { disabled: locked }
      )}

      ${feedbackHTML(row.rs, {
        I,
        right: I.T("Cipher decrypted! Security bolt retracted — door unlocked.", "¡Cifrado descifrado! Cerrojo retraído — puerta abierta."),
        retry: I.T("Access Denied: Key signature mismatched. Analyze the clue again.", "Acceso denegado: Firma de llave no coincide. Analiza la pista de nuevo."),
        answer: I.T(`Authenticated key: ${answer}`, `Llave autenticada: ${answer}`),
        explain: I.T(row.explain.en, row.explain.es),
        hint: row.rs.h ? I.T(row.hint.en, row.hint.es) : "",
      })}

      <!-- Security Actions -->
      <div class="gs-actions er-actions">
        ${!locked ? html`
          <button
            type="button"
            class="btn btn-primary btn-big er-action-btn"
            data-g-check
            ${row.pick === null ? "disabled" : ""}
          >
            ${icon("check")}
            <span>${I.T("Authorize Key · Unlock Chamber Door", "Autorizar llave · Desbloquear puerta")}</span>
          </button>
        ` : html`
          <button
            type="button"
            class="btn btn-primary btn-big er-action-btn is-advance"
            data-g-next
          >
            ${icon("arrow-right")}
            <span>${s.i + 1 === s.rounds.length ? I.T("Breach Final Bulkhead · Evacuate", "Abrir compuerta final · Evacuar") : I.T("Proceed to Next Chamber", "Avanzar a la siguiente sala")}</span>
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
        skill: env.def?.skill?.toLowerCase() || "integrated",
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
      if (rows.length < 2) errors.push(`${band}: needs at least two authored escape rooms`);
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
