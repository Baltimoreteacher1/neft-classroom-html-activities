// Story Creator markup: seed picker and the storyboard workbench (panel scene + task + guide).
// Pure functions of state. The published storyboard lives in story-creator-publish.js.
import {
  audioBtn,
  glossHTML,
  hintHTML,
  html,
  icon,
  pips,
  raw,
  settled,
} from "./engine.js";
import { mascot } from "./art.js";
import {
  KIND_HINTS,
  MARK_NAMES,
  finalLine,
  shownWord,
  trayFor,
  workText,
} from "./story-creator-lines.js";
import { panelScene, seedScene } from "./story-creator-art.js";

// ── shared accessors ─────────────────────────────────────────────────────────────────────
export const bandOf = (env) => env.content?.bands?.[env.band] || env.content || {};
export const seedOf = (s, env, id = s.seed) => (bandOf(env).seeds || []).find((x) => x.id === id);
export const ROLES = {
  opening: {
    name: ["Opening", "Inicio"],
    sticker: ["Hook", "Gancho"],
    intro: [
      "Every story needs a hook: who, where and what they want.",
      "Todo cuento necesita un gancho: quién, dónde y qué quiere.",
    ],
  },
  problem: {
    name: ["Problem", "Problema"],
    sticker: ["Trouble", "Conflicto"],
    intro: [
      "Now make trouble! The problem has to get in the way of the goal.",
      "¡Ahora crea un conflicto! El problema tiene que estorbar la meta.",
    ],
  },
  turn: {
    name: ["Turning point", "Momento clave"],
    sticker: ["Big turn", "Gran giro"],
    intro: [
      "Turning point: someone acts, and things start to change.",
      "Momento clave: alguien actúa y las cosas empiezan a cambiar.",
    ],
  },
  ending: {
    name: ["Ending", "Final"],
    sticker: ["Resolution", "Resolución"],
    intro: [
      "The ending has to solve the problem. Watch out for endings that just stop!",
      "El final tiene que resolver el problema. ¡Cuidado con los finales que solo se detienen!",
    ],
  },
};
const PRAISE = [
  ["Nice choice!", "¡Buena elección!"],
  ["You've got it!", "¡Lo lograste!"],
  ["Sharp eye!", "¡Qué buen ojo!"],
  ["That's real storytelling!", "¡Eso es contar un cuento de verdad!"],
];
export const stepScore = (rs) =>
  rs.status === "right" ? (rs.tries === 1 && rs.h === 0 ? 3 : 2) : rs.status === "revealed" ? 1 : 0;
export const tierOf = (P) => {
  const a = stepScore(P.prs);
  const b = stepScore(P.lrs);
  return a === 3 && b === 3 ? "gold" : a >= 2 && b >= 2 ? "silver" : "bronze";
};
export const TIER = { gold: ["Gold", "Oro"], silver: ["Silver", "Plata"], bronze: ["Bronze", "Bronce"] };
export const T2 = (I, pair) => I.T(pair[0], pair[1]);
const guideName = (env) => (env.band === "6-8" ? "Juno" : "Pip");

// ── guide bubble ─────────────────────────────────────────────────────────────────────────
export function guide(env, mood, head, body, tone = "") {
  return html`<div
    class="scr-guide${tone ? ` is-${tone}` : ""}"
    data-sc-say
    tabindex="-1"
    role="status"
    aria-live="polite"
  >
    <span class="scr-guide-pic"
      >${mascot(env.band === "6-8" ? "juno" : "pip", env.band, mood, 72)}</span
    >
    <div class="scr-bubble">
      <p class="scr-bubble-who">${guideName(env)}</p>
      <p class="scr-bubble-head">${head}</p>
      ${body ? html`<p>${body}</p>` : ""}
    </div>
  </div>`;
}

// ── seed picker ──────────────────────────────────────────────────────────────────────────
export function seedView(s, env) {
  const I = env.I;
  const card = (id) => {
    const x = seedOf(s, env, id);
    return html`<li class="scr-seed">
      <figure class="scr-seed-art">${seedScene(x, env.band, I.S(x.title.en, x.title.es))}</figure>
      <h3>${I.T(x.title.en, x.title.es)}</h3>
      <dl class="scr-seed-facts">
        <dt>${I.T("Who", "Quién")}</dt>
        <dd>${I.T(x.who.en, x.who.es)}</dd>
        <dt>${I.T("Where", "Dónde")}</dt>
        <dd>${I.T(x.where.en, x.where.es)}</dd>
        <dt>${I.T("Goal", "Meta")}</dt>
        <dd>${I.T(x.goal.en, x.goal.es)}</dd>
      </dl>
      <button type="button" class="btn btn-primary" data-g-seed="${id}">
        ${icon("writing")}${I.T("Build this story", "Crear este cuento")}
      </button>
    </li>`;
  };
  return html`<section class="scr scr-pick" data-mechanic="storyboard">
    ${guide(env, "hi", I.T("Let's make a storyboard!", "¡Hagamos un guion gráfico!"), I.T("Pick a story seed. You will build four panels, polish one line in each, and publish your finished story.", "Elige una semilla de cuento. Vas a crear cuatro paneles, pulir una línea en cada uno y publicar tu cuento terminado."))}
    <h2 class="scr-h" tabindex="-1">
      ${I.T("Choose your story seed", "Elige tu semilla de cuento")}
    </h2>
    <ul class="scr-seeds">
      ${s.seeds.map(card)}
    </ul>
  </section>`;
}

// ── the storyboard strip (progress you can see) ──────────────────────────────────────────
function strip(s, env, seed) {
  const I = env.I;
  const cell = (panel, i) => {
    const P = s.panels[i];
    const done = settled(P.prs) && settled(P.lrs);
    const now = i === s.p && s.phase === "build";
    const locked = i > s.p && s.phase === "build";
    const role = ROLES[panel.role];
    const state = done
      ? I.S(`${TIER[tierOf(P)][0]} sticker`, `Calcomanía de ${TIER[tierOf(P)][1].toLowerCase()}`)
      : now
        ? I.S("Building now", "En construcción")
        : I.S("Locked", "Bloqueado");
    return html`<li
      class="scr-cell${done ? " is-done" : ""}${now ? " is-now" : ""}"
      aria-label="${I.S(`Panel ${i + 1}, ${role.name[0]}: ${state}`, `Panel ${i + 1}, ${role.name[1]}: ${state}`)}"
    >
      <span class="scr-cell-art"
        >${panelScene(seed, panel, env.band, { locked: locked || (!done && !now) })}</span
      >
      <span class="scr-cell-l">${i + 1}. ${T2(I, role.name)}</span>
      ${done ? html`<span class="scr-sticker is-${tierOf(P)}" aria-hidden="true">${icon("star")}</span>` : ""}
    </li>`;
  };
  return html`<ol class="scr-strip" aria-label="${I.S("Your storyboard", "Tu guion gráfico")}">
    ${seed.panels.map(cell)}
  </ol>`;
}

function streakChip(s, I) {
  return html`<p class="scr-streak${s.streak >= 3 ? " is-hot" : ""}">
    ${icon("sparkle")}<span
      >${I.T(`Understanding streak: ${s.streak}`, `Racha de comprensión: ${s.streak}`)}</span
    ><span class="scr-best">${I.T(`Best ${s.best}`, `Mejor ${s.best}`)}</span>
  </p>`;
}

// ── build: one panel at a time ───────────────────────────────────────────────────────────
export function buildView(s, env, prog) {
  const I = env.I;
  const seed = seedOf(s, env);
  const panel = seed.panels[s.p];
  const P = s.panels[s.p];
  const role = ROLES[panel.role];
  const pieceDone = settled(P.prs);
  const okPiece = panel.pieces.find((x) => x.ok);
  const caption = pieceDone
    ? html`<p class="scr-cap">${I.T(okPiece.en, okPiece.es)}</p>
        ${settled(P.lrs) ? html`<p class="scr-cap is-line">${I.T(finalLine(panel.line), panel.line.es)}</p>` : ""}`
    : html`<p class="scr-cap is-empty">
        ${I.T("Choose a piece to fill this panel.", "Elige una parte para llenar este panel.")}
      </p>`;
  const fx = s.fx && s.fx.p === s.p ? ` scr-fx-${s.fx.kind}` : "";
  return html`<section class="scr scr-build" data-mechanic="storyboard">
    <div class="scr-top">
      ${streakChip(s, I)}${pips(prog.done, prog.total, I.S(`${prog.done} of ${prog.total} story steps finished`, `${prog.done} de ${prog.total} pasos del cuento terminados`), I.S)}
    </div>
    ${strip(s, env, seed)}
    <h2 class="scr-h" tabindex="-1">
      ${I.T(`Panel ${s.p + 1} of 4 · ${role.name[0]}`, `Panel ${s.p + 1} de 4 · ${role.name[1]}`)}
    </h2>
    <div class="scr-work">
      <figure class="scr-panel${fx}">
        ${panelScene(seed, panel, env.band, { label: I.S(`${seed.title.en}, panel ${s.p + 1}`, `${seed.title.es}, panel ${s.p + 1}`) })}
        <figcaption>${caption}</figcaption>
        ${settled(P.prs) && settled(P.lrs) ? html`<span class="scr-stamp is-${tierOf(P)}">${icon("star")}${T2(I, role.sticker)}</span>` : ""}
      </figure>
      <div class="scr-task">
        ${pieceDone ? lineTask(s, env, panel, P) : pieceTask(s, env, panel, P)}
      </div>
    </div>
  </section>`;
}

function pieceTask(s, env, panel, P) {
  const I = env.I;
  const role = ROLES[panel.role];
  const order = s.deal[s.seed][s.p].opts;
  const seed = seedOf(s, env);
  const last = P.last !== null ? panel.pieces[order[P.last]] : null;
  const say =
    P.prs.status === "retry" && last
      ? guide(
          env,
          "think",
          I.T("Hmm, not yet.", "Mmm, todavía no."),
          html`${I.T(last.why.en, last.why.es)} ${I.T("Pick another piece.", "Elige otra parte.")}`,
          "retry",
        )
      : guide(
          env,
          "hi",
          T2(I, role.intro),
          s.p === 0
            ? I.T(
                `Remember: ${seed.who.en}. Goal: ${seed.goal.en}.`,
                `Recuerda: ${seed.who.es}. Meta: ${seed.goal.es}.`,
              )
            : "",
        );
  const hints = [
    T2(I, [
      "Picture it. Which piece lets a reader see exactly who, where and what is happening?",
      "Imagínalo. ¿Qué parte deja ver exactamente quién, dónde y qué pasa?",
    ]),
    I.T(panel.clue.en, panel.clue.es),
    T2(I, [
      "Cross out a piece that is too vague to picture, and a piece that belongs to a different story.",
      "Descarta la parte demasiado vaga para imaginarla y la parte que pertenece a otro cuento.",
    ]),
  ];
  return html`${say}
    <p class="gs-prompt">
      ${I.T(`Which piece makes the strongest ${role.name[0].toLowerCase()} for your story?`, `¿Qué parte crea el mejor ${role.name[1].toLowerCase()} para tu cuento?`)}
    </p>
    <div
      class="gs-choices scr-opts"
      role="group"
      aria-label="${I.S("Story pieces", "Partes del cuento")}"
    >
      ${order.map((k, i) => {
        const x = panel.pieces[k];
        const miss = P.prs.picks.includes(i);
        return html`<button
          type="button"
          class="gs-choice scr-opt${P.pick === i ? " is-sel" : ""}${miss ? " is-miss" : ""}"
          data-g-opt="${i}"
          aria-pressed="${P.pick === i}"
          ${miss ? "disabled" : ""}
        >
          ${I.T(x.en, x.es)}
        </button>`;
      })}
    </div>
    ${hintHTML(P.prs, hints, env)}
    <div class="gs-actions">
      <button
        type="button"
        class="btn btn-primary btn-big"
        data-g-check
        ${P.pick === null || P.prs.picks.includes(P.pick) ? "disabled" : ""}
      >
        ${icon("check")}${I.T("Put it in my panel", "Ponerlo en mi panel")}
      </button>
    </div>`;
}

function pieceFeedback(env, panel, P, n) {
  const I = env.I;
  const ok = panel.pieces.find((x) => x.ok);
  if (P.prs.status === "right")
    return guide(
      env,
      "cheer",
      T2(I, PRAISE[n % PRAISE.length]),
      I.T(ok.why.en, ok.why.es),
      "right",
    );
  return guide(
    env,
    "think",
    I.T("Here is a strong piece for this panel.", "Esta es una buena parte para este panel."),
    html`<strong>${I.T(ok.en, ok.es)}</strong> ${I.T(ok.why.en, ok.why.es)}`,
    "reveal",
  );
}

// ── the line repair tasks ────────────────────────────────────────────────────────────────
function lineTask(s, env, panel, P) {
  const I = env.I;
  const line = panel.line;
  const done = settled(P.lrs);
  const hints = KIND_HINTS[line.kind].map((h) => (h ? T2(I, h) : I.T(line.clue.en, line.clue.es)));
  const prompt = {
    punct: I.T(
      "Polish the dialogue: add the missing marks and fix the capital letters.",
      "Pule el diálogo: agrega los signos que faltan y corrige las mayúsculas.",
    ),
    connector: I.T(
      "Choose the connecting word that shows how the two ideas fit together.",
      "Elige la palabra de enlace que muestra cómo se relacionan las dos ideas.",
    ),
    verb: I.T(
      `“${line.weak}” is a weak verb. Choose a precise verb that fits the clue.`,
      `“${line.weak}” es un verbo débil. Elige un verbo preciso que encaje con la pista.`,
    ),
  }[line.kind];
  const body =
    line.kind === "punct" ? punctBoard(env, line, P, done) : wordBoard(s, env, line, P, done);
  return html`${P.lrs.status === "open" || done ? (done ? lineFeedback(env, panel, P, s.p) : pieceFeedback(env, panel, P, s.p)) : retryLine(env, panel, P)}
    <p class="gs-prompt">${prompt}</p>
    ${body} ${glossHTML(line.kind === "punct" ? line.es : line.gap_es, env)}
    ${hintHTML(P.lrs, hints, env, { disabled: done })}
    <div class="gs-actions">
      ${
        done
          ? html`<button type="button" class="btn btn-primary btn-big" data-g-next>
              ${icon("arrow-right")}${s.p < 3 ? I.T("Unlock the next panel", "Desbloquear el siguiente panel") : I.T("Finish my storyboard", "Terminar mi guion gráfico")}
            </button>`
          : html`<button
              type="button"
              class="btn btn-primary btn-big"
              data-g-check
              ${line.kind !== "punct" && P.lpick === null ? "disabled" : ""}
            >
              ${icon("check")}${I.T("Check my line", "Revisar mi línea")}
            </button>`
      }
    </div>`;
}

function retryLine(env, panel, P) {
  const I = env.I;
  const line = panel.line;
  if (line.kind === "punct")
    return guide(
      env,
      "think",
      I.T("Close! Let's revise.", "¡Casi! Vamos a revisar."),
      T2(I, P.diag || ["", ""]),
      "retry",
    );
  const pick = line.bank[P.lastWord];
  return guide(
    env,
    "think",
    I.T("Not quite. Let's revise.", "No del todo. Vamos a revisar."),
    pick ? I.T(pick.why.en, pick.why.es) : "",
    "retry",
  );
}

function lineFeedback(env, panel, P, n) {
  const I = env.I;
  const line = panel.line;
  const why =
    line.kind === "punct"
      ? I.T(
          "Quotation marks wrap only the spoken words, and the mark that ends them goes inside.",
          "Las comillas encierran solo las palabras dichas, y el signo que las termina va dentro.",
        )
      : I.T(
          line.bank.find((b) => b.w === line.answer).why.en,
          line.bank.find((b) => b.w === line.answer).why.es,
        );
  const head =
    P.lrs.status === "right"
      ? T2(I, PRAISE[(n + 1) % PRAISE.length])
      : I.T("Here is the polished line.", "Esta es la línea pulida.");
  return guide(
    env,
    P.lrs.status === "right" ? "cheer" : "think",
    head,
    html`<strong>${finalLine(line)}</strong> ${why}
      ${I.T("Panel complete: sticker earned!", "Panel completo: ¡ganaste una calcomanía!")}`,
    P.lrs.status === "right" ? "right" : "reveal",
  );
}

function wordBoard(s, env, line, P, done) {
  const I = env.I;
  const [pre, post] = line.text.split("___");
  const chosen = P.lpick !== null ? line.bank[P.lpick].w : "";
  const clue = env.sup.visuals || P.lrs.h >= 1;
  const gap = chosen
    ? html`<span class="scr-gap is-filled">${chosen}</span>`
    : html`<span class="scr-gap" role="img" aria-label="${I.S("blank", "espacio en blanco")}"
        >&nbsp;</span
      >`;
  const weak =
    line.kind === "verb"
      ? html`<s
          class="scr-weak"
          aria-label="${I.S(`weak verb: ${line.weak}`, `verbo débil: ${line.weak}`)}"
          >${line.weak}</s
        > `
      : "";
  const order = s.deal[s.seed][s.p].bank;
  return html`<p class="gs-text scr-line${clue ? " show-clue" : ""}">
      ${pre}${weak}${gap}${post} ${audioBtn(line.text.replace("___", "blank"), I)}
    </p>
    <div
      class="gs-choices scr-bank"
      role="group"
      aria-label="${I.S("Word choices", "Opciones de palabras")}"
    >
      ${order.map((k) => {
        const w = line.bank[k];
        const right = done && w.w === line.answer;
        return html`<button
          type="button"
          class="gs-choice scr-word${P.lpick === k ? " is-sel" : ""}${right ? " is-right" : ""}"
          data-g-word="${k}"
          aria-pressed="${P.lpick === k}"
          ${done ? "disabled" : ""}
        >
          ${w.w}${env.sup.gloss === "show" ? html`<span class="gs-gloss" lang="es">${w.es}</span>` : ""}
        </button>`;
      })}
    </div>`;
}

function punctBoard(env, line, P, done) {
  const I = env.I;
  const W = P.work;
  const n = line.words.length;
  const tray = trayFor(line, env.sup);
  const gapBtn = (i) => {
    const marks = W.gaps[i] || "";
    const where =
      i === 0
        ? I.S(`before “${line.words[0]}”`, `antes de “${line.words[0]}”`)
        : i === n
          ? I.S("at the end", "al final")
          : I.S(
              `between “${line.words[i - 1]}” and “${line.words[i]}”`,
              `entre “${line.words[i - 1]}” y “${line.words[i]}”`,
            );
    return html`<button
      type="button"
      class="scr-slot${marks ? " is-filled" : ""}"
      data-g-gap="${i}"
      ${done ? "disabled" : ""}
      aria-label="${I.S(`Space ${where}`, `Espacio ${where}`)}${marks ? `: ${marks}` : ""}"
    >
      ${marks || raw('<span class="scr-caret" aria-hidden="true">^</span>')}
    </button>`;
  };
  const wordBtn = (i) =>
    html`<button
      type="button"
      class="scr-wordtile"
      data-g-cap="${i}"
      ${done ? "disabled" : ""}
      aria-label="${I.S(`Word: ${shownWord(line, W, i)}. Tap to switch its capital letter.`, `Palabra: ${shownWord(line, W, i)}. Toca para cambiar la mayúscula.`)}"
    >
      ${shownWord(line, W, i)}
    </button>`;
  const cells = [];
  for (let i = 0; i < n; i += 1) cells.push(gapBtn(i), wordBtn(i));
  cells.push(gapBtn(n));
  const tool = (t) =>
    html`<button
      type="button"
      class="scr-tool${W.tool === String(t.i) ? " is-on" : ""}"
      data-g-tool="${t.i}"
      aria-pressed="${W.tool === String(t.i)}"
      aria-label="${I.S(MARK_NAMES[t.m][0], MARK_NAMES[t.m][1])}"
      ${done ? "disabled" : ""}
    >
      ${t.m}
    </button>`;
  return html`${
      done
        ? ""
        : html`<p class="scr-how">
              ${I.T("Pick a mark, then tap a ^ space to place it. Tap a word to switch its capital letter.", "Elige un signo y luego toca un espacio ^ para colocarlo. Toca una palabra para cambiar su mayúscula.")}
            </p>
            <div
              class="scr-tray"
              role="group"
              aria-label="${I.S("Punctuation marks", "Signos de puntuación")}"
            >
              ${tray.map(tool)}<button
                type="button"
                class="scr-tool is-erase${W.tool === "erase" ? " is-on" : ""}"
                data-g-tool="erase"
                aria-pressed="${W.tool === "erase"}"
              >
                ${icon("x")}${I.T("Erase", "Borrar")}</button
              ><button type="button" class="btn small" data-g-clear>
                ${icon("retry")}${I.T("Start over", "Empezar de nuevo")}
              </button>
            </div>`
    }
    <div
      class="scr-sentence"
      role="group"
      aria-label="${I.S("The line to fix", "La línea que debes arreglar")}"
    >
      ${cells}
    </div>
    <p class="scr-readback">
      ${audioBtn(workText(line, W), I, I.S("Listen to my line", "Escuchar mi línea"))}
    </p>`;
}
