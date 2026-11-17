// Language Arcade screens: the maze board (visual grid; the accessible controls are the move pad and the status
// line), the gate challenge panel, and the maze-complete card.
import {
  audioBtn,
  choiceList,
  feedbackHTML,
  glossHTML,
  hintHTML,
  html,
  icon,
  pips,
  settled,
} from "./engine.js";
import { DIR_NAMES, DIRS, cellAt, isGate, step } from "./language-arcade-maze.js";

export const TYPES = {
  word: {
    name: ["Word gate", "Puerta de palabras"],
    ask: ["Choose the word that fits the sentence.", "Elige la palabra que encaja en la oración."],
  },
  connector: {
    name: ["Connector gate", "Puerta de conectores"],
    ask: [
      "Choose the connector that links the two ideas.",
      "Elige el conector que une las dos ideas.",
    ],
  },
  fix: {
    name: ["Fix-it gate", "Puerta de corrección"],
    ask: [
      "Read each version. Choose the one that is correct.",
      "Lee cada versión. Elige la que es correcta.",
    ],
  },
  factop: {
    name: ["Fact or opinion gate", "Puerta de hecho u opinión"],
    ask: [
      "Decide: can it be checked, or is it what someone thinks?",
      "Decide: ¿se puede comprobar o es lo que alguien piensa?",
    ],
  },
  evidence: {
    name: ["Evidence gate", "Puerta de evidencia"],
    ask: [
      "Choose the detail that best supports the claim.",
      "Elige el detalle que mejor apoya la afirmación.",
    ],
  },
  register: {
    name: ["Formal language gate", "Puerta de lenguaje formal"],
    ask: [
      "Choose the sentence that fits the situation.",
      "Elige la oración que encaja con la situación.",
    ],
  },
};

/** What is in one direction, as words: "open path", "wall", "locked gate", "open gate", "bonus", "exit". */
export function lookAt(m, dir) {
  const [y, x] = step(m.pos, dir);
  const c = cellAt(m.map, y, x);
  if (c === "#") return "wall";
  if (isGate(c)) return m.open.includes(c) ? "open" : "gate";
  if (c === "X") return "exit";
  if (c === "*" && !m.got.includes(`${y},${x}`)) return "bonus";
  return "path";
}
const LOOK = {
  wall: ["wall", "pared"],
  gate: ["locked gate", "puerta cerrada"],
  open: ["open gate", "puerta abierta"],
  exit: ["exit", "salida"],
  bonus: ["bonus item", "objeto de bonificación"],
  path: ["open path", "camino libre"],
};

function cellHTML(m, def, y, x, I) {
  const c = m.map[y][x];
  const here = m.pos[0] === y && m.pos[1] === x;
  let cls = "la-c";
  let face = "";
  if (c === "#") cls += " is-wall";
  else if (isGate(c)) {
    const open = m.open.includes(c);
    cls += open ? " is-gate is-open" : " is-gate";
    face = open ? "🔓" : "🔒";
  } else if (c === "X") {
    cls += " is-exit";
    face = def.goal;
  } else if (c === "*" && !m.got.includes(`${y},${x}`)) {
    cls += " is-bonus";
    face = def.gem;
  }
  if (here) {
    cls += " is-me";
    face = def.player;
  }
  const dir =
    !m.won &&
    Object.keys(DIRS).find((d) => {
      const [ny, nx] = step(m.pos, d);
      return ny === y && nx === x && c !== "#";
    });
  if (dir)
    return html`<button type="button" class="${cls} is-near" tabindex="-1" data-la-tap="${dir}">
      <span>${face}</span>
    </button>`;
  return html`<span class="${cls}"><span>${face}</span></span>`;
}

function padHTML(m, I) {
  const btn = (d, arrow) => {
    const look = LOOK[lookAt(m, d)];
    return html`<button
      type="button"
      class="la-pad-b la-pad-${d}"
      data-la-move="${d}"
      aria-label="${I.S(`Move ${DIR_NAMES[d][0]}: ${look[0]}`, `Mover ${DIR_NAMES[d][1]}: ${look[1]}`)}"
    >
      <span aria-hidden="true">${arrow}</span>
    </button>`;
  };
  return html`<div class="la-pad" role="group" aria-label="${I.S("Move", "Moverse")}">
    ${btn("up", "▲")}${btn("left", "◀")}<span class="la-pad-mid" aria-hidden="true"></span
    >${btn("right", "▶")}${btn("down", "▼")}
  </div>`;
}

function whereHTML(m, def, I) {
  const open = Object.keys(DIRS).filter((d) => lookAt(m, d) !== "wall");
  const near = Object.keys(DIRS).filter((d) => lookAt(m, d) === "gate");
  return html`<p class="la-where">
    ${I.T(`Row ${m.pos[0] + 1}, column ${m.pos[1] + 1}. You can go: ${open.map((d) => DIR_NAMES[d][0]).join(", ")}.`, `Fila ${m.pos[0] + 1}, columna ${m.pos[1] + 1}. Puedes ir: ${open.map((d) => DIR_NAMES[d][1]).join(", ")}.`)}
    ${near.length ? html` <strong>${I.T(`Gate ${DIR_NAMES[near[0]][0]}.`, `Puerta ${DIR_NAMES[near[0]][1]}.`)}</strong>` : ""}
  </p>`;
}

function gateHTML(s, m, def, env) {
  const I = env.I;
  const g = m.gates[s.at];
  const spec = def.gates[s.at];
  const t = TYPES[spec.type];
  const locked = settled(g.rs);
  const choices = g.order.map((i) => spec.choices[i]);
  const answer = g.order.indexOf(spec.answer);
  const prompt = spec.prompt.replace("___", "_____");
  return html`<section class="la-gate" aria-labelledby="la-gate-h">
    <h3 id="la-gate-h" class="la-gate-h" tabindex="-1">
      <span aria-hidden="true">${locked ? "🔓" : "🔒"}</span> ${I.T(t.name[0], t.name[1])}
    </h3>
    <p class="la-ask">${I.T(t.ask[0], t.ask[1])}</p>
    <p class="la-prompt" lang="en">${prompt}</p>
    <div class="la-gate-tools">
      ${audioBtn(spec.prompt.replace("___", "blank"), I, I.S("Listen to the challenge", "Escuchar el reto"))}${glossHTML(spec.es, env)}
    </div>
    <div lang="en">
      ${choiceList(choices, { name: "gate", sel: g.pick ?? -1, locked, right: locked ? answer : -1, picked: locked && g.pick !== answer && g.pick !== null ? [g.pick] : [] })}
    </div>
    ${hintHTML(g.rs, [I.T(spec.hint.en, spec.hint.es), I.T("Try each choice in the sentence and read it aloud quietly. Which one sounds and means right?", "Prueba cada opción en la oración y léela en voz baja. ¿Cuál suena y significa lo correcto?"), I.T("Cross out the choice that makes the least sense, then compare the other two.", "Descarta la opción que tiene menos sentido y luego compara las otras dos.")], env, { disabled: locked })}
    ${feedbackHTML(g.rs, {
      I,
      right: I.T("Correct! The gate unlocks.", "¡Correcto! La puerta se abre."),
      retry: I.T(
        "The lock did not turn. Use the hint and try another choice.",
        "El candado no giró. Usa la pista y prueba otra opción.",
      ),
      answer: I.T(
        `The answer that opens the gate: ${choices[answer]}`,
        `La respuesta que abre la puerta: ${choices[answer]}`,
      ),
      explain: I.T(spec.explain.en, spec.explain.es),
    })}
    <div class="gs-actions">
      ${locked ? html`<button type="button" class="btn btn-primary btn-big" data-la-close>${icon("arrow-right")}${I.T("Go through the gate", "Pasar por la puerta")}</button>` : html`<button type="button" class="btn btn-primary btn-big" data-la-check ${g.pick === null ? "disabled" : ""}>${icon("check")}${I.T("Try the lock", "Probar el candado")}</button>`}
    </div>
  </section>`;
}

function wonHTML(s, m, def, env) {
  const I = env.I;
  const gates = Object.keys(m.gates).length;
  const gems = m.map.join("").split("*").length - 1;
  const next = s.mazes[s.mi + 1];
  const nextDef = next && env.content.mazes.find((d) => d.id === next.id);
  return html`<section class="la-won">
    <p class="la-won-icon" aria-hidden="true">${def.goal}</p>
    <h3 class="la-won-h" tabindex="-1">
      ${I.T(`You reached the ${def.goalName.en}!`, `¡Llegaste a: ${def.goalName.es}!`)}
    </h3>
    <ul class="la-won-stats">
      <li>
        ${icon("lock")}${I.T(`Gates opened: ${gates} of ${gates}`, `Puertas abiertas: ${gates} de ${gates}`)}
      </li>
      <li>
        <span aria-hidden="true">${def.gem}</span
        >${I.T(`Bonus ${def.gemName.en}s: ${m.got.length} of ${gems}`, `Bonificación (${def.gemName.es}): ${m.got.length} de ${gems}`)}
      </li>
    </ul>
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-la-next>
        ${icon("arrow-right")}${nextDef ? I.T(`Next maze: ${nextDef.name.en}`, `Siguiente laberinto: ${nextDef.name.es}`) : I.T("Finish the arcade", "Terminar el arcade")}
      </button>
    </div>
  </section>`;
}

export function stageHTML(s, env) {
  const I = env.I;
  const m = s.mazes[s.mi];
  if (!m)
    return html`<p role="status">
      ${I.T("Every maze is complete.", "Todos los laberintos están completos.")}
    </p>`;
  const def = env.content.mazes.find((d) => d.id === m.id);
  const gateTotal = Object.keys(m.gates).length;
  const gems = m.map.join("").split("*").length - 1;
  const side = m.won
    ? wonHTML(s, m, def, env)
    : s.at
      ? gateHTML(s, m, def, env)
      : html`${whereHTML(m, def, I)}${padHTML(m, I)}
          <p class="fine la-keys">
            ${I.T("Arrow keys work too. You can also tap a square next to you.", "También funcionan las flechas del teclado. También puedes tocar una casilla junto a ti.")}
          </p>`;
  return html`<section class="la-arcade la-${def.theme}" data-mechanic="maze-gates">
    <header class="la-head">
      <div>
        <p class="la-level">
          ${I.T(`Maze ${s.mi + 1} of ${s.mazes.length}`, `Laberinto ${s.mi + 1} de ${s.mazes.length}`)}
        </p>
        <h2 class="la-title" tabindex="-1">${I.T(def.name.en, def.name.es)}</h2>
        <p class="la-story">${I.T(def.story.en, def.story.es)}</p>
      </div>
      <ul class="la-score" aria-label="${I.S("Maze score", "Marcador del laberinto")}">
        <li>
          <span aria-hidden="true">🔓</span
          >${I.T(`Gates ${m.open.length}/${gateTotal}`, `Puertas ${m.open.length}/${gateTotal}`)}
        </li>
        <li>
          <span aria-hidden="true">${def.gem}</span
          >${I.T(`Bonus ${m.got.length}/${gems}`, `Bonificación ${m.got.length}/${gems}`)}
        </li>
      </ul>
    </header>
    ${pips(m.open.length, gateTotal, I.S(`${m.open.length} of ${gateTotal} gates open`, `${m.open.length} de ${gateTotal} puertas abiertas`), I.S)}
    <div class="la-play">
      <div
        class="la-board${s.at ? " is-paused" : ""}"
        aria-hidden="true"
        style="--cols:${m.map[0].length}"
      >
        ${m.map.map((row, y) => [...row].map((_, x) => cellHTML(m, def, y, x, I)))}
      </div>
      <div class="la-side">
        <p class="la-say">
          ${s.say ? I.T(s.say.en, s.say.es) : I.T(`Find your way to the ${def.goalName.en}.`, `Encuentra el camino a: ${def.goalName.es}.`)}
        </p>
        ${side}
      </div>
    </div>
    <p class="la-legend fine">
      <span
        ><span aria-hidden="true">${def.player}</span>
        ${I.T(def.playerName.en, def.playerName.es)}</span
      ><span><span aria-hidden="true">🔒</span> ${I.T("gate", "puerta")}</span
      ><span
        ><span aria-hidden="true">${def.gem}</span>
        ${I.T(`bonus ${def.gemName.en}`, `bonificación: ${def.gemName.es}`)}</span
      ><span
        ><span aria-hidden="true">${def.goal}</span> ${I.T(def.goalName.en, def.goalName.es)}</span
      >
    </p>
  </section>`;
}
