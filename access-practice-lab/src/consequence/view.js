// Communication Consequence Lab (/simulations/consequence, /simulations/consequence/<scenario>), mounted by the
// Simulations view. The learner builds a sentence from tiles; the pure engine (./engine.js) turns it into a
// consequence: the robot moves exactly as told, the scientist asks for a clearer cause, the council member asks for
// evidence. The learner revises and tries again. An optional typed sentence is saved on this device and never
// checked. Frames, word banks and tips fold behind "Show help" after two independent successes. Progress stays on
// this device (accessPracticeLab:v1:consequence). No scores, timers or levels.
import { i18nFor } from "../i18n.js";
import { WIDA_SOURCE } from "../acc/wida/catalog.js";
import { BASE, announce, html, raw, safeJson, storage } from "../util.js";
import {
  STATUS,
  STORAGE_KEY,
  advance,
  compose,
  evaluate,
  freshScenario,
  helpFolded,
  recordAttempt,
  restoreProgress,
} from "./engine.js";
import { characterPortrait, robotSceneSVG } from "./scene.js";
import { SCENARIOS, scenarioById } from "./scenarios/index.js";

export const CONSEQUENCE_ID = "consequence";
const T = (I, pair) => I.T(pair[0], pair[1]);
const bandOf = (band) => (band === "3-5" ? "3-5" : "6-8");
const hubUrl = (band) => `${BASE}/simulations/${CONSEQUENCE_ID}?grades=${band}`;
const playUrl = (id, band) => `${BASE}/simulations/${CONSEQUENCE_ID}/${id}?grades=${band}`;

const loadAll = () => restoreProgress(safeJson(storage.get(STORAGE_KEY), {}));
const saveAll = (all) => storage.set(STORAGE_KEY, JSON.stringify(all));
const progressOf = (id) => loadAll()[id] || freshScenario();
function saveProgress(id, sp) {
  const all = loadAll();
  all[id] = sp;
  saveAll(all);
}

// The draft (tiles chosen, last consequence, help opened) lives only for this visit to a round.
let live = { key: "", draft: {}, result: null, helpOpen: false, restart: false };
function liveFor(id, round) {
  const key = `${id}|${round}`;
  if (live.key !== key) live = { key, draft: {}, result: null, helpOpen: false, restart: false };
  return live;
}

// ── hub ──────────────────────────────────────────────────────────────────────────
function progressLine(I, s, sp) {
  if (sp.complete)
    return I.T("Finished. You can play it again.", "Terminada. Puedes jugarla otra vez.");
  const passed = Object.keys(sp.memory).length;
  if (!passed && !Object.keys(sp.attempts).length) return I.T("Not started", "Sin empezar");
  return I.T(
    `In progress: round ${sp.round + 1} of ${s.rounds.length}`,
    `En curso: ronda ${sp.round + 1} de ${s.rounds.length}`,
  );
}

function hubHTML(I, band) {
  const all = loadAll();
  return html`<section class="sim-hub cq-hub">
    <header class="sim-hub-head">
      <p class="eyebrow">
        ${I.T("Say it, see what happens, revise", "Dilo, mira qué pasa, revisa")}
      </p>
      <h1 tabindex="-1">
        ${I.T("Communication Consequence Lab", "Laboratorio de consecuencias de la comunicación")}
      </h1>
      <p class="lead">
        ${I.T("Build a sentence from word tiles. A robot, a scientist or a council member reacts to exactly what you said. If your words are vague or wrong, you see what happens, then revise and try again. Your work is saved on this device.", "Arma una oración con fichas de palabras. Un robot, una científica o un miembro del concejo reacciona exactamente a lo que dijiste. Si tus palabras son imprecisas o incorrectas, ves lo que pasa, revisas e intentas otra vez. Tu trabajo se guarda en este dispositivo.")}
      </p>
    </header>
    <ul class="cq-cards">
      ${SCENARIOS.map((s) => {
        const sp = all[s.id] || freshScenario();
        return html`<li>
          <a class="cq-card" href="${playUrl(s.id, band)}">
            <span class="sim-tag">${T(I, s.area)}</span>
            <strong class="sim-card-title">${T(I, s.title)}</strong>
            <span>${T(I, s.summary)}</span>
            <span class="sim-card-meta">${T(I, s.feature)} · ${progressLine(I, s, sp)}</span>
            <span class="sim-card-cta"
              >${sp.complete ? I.T("Open", "Abrir") : Object.keys(sp.attempts).length ? I.T("Continue", "Continuar") : I.T("Start", "Empezar")}</span
            >
          </a>
        </li>`;
      })}
    </ul>
    ${teacherFold(I, band)}
  </section>`;
}

function teacherFold(I, band, only = null) {
  const list = only ? [only] : SCENARIOS;
  return html`<details class="sim-fold sim-teach panel">
    <summary>${I.T("For teachers", "Para docentes")}</summary>
    <ul class="sim-list">
      <li>
        ${I.T("Students compose from authored tiles; the program never tries to understand free text. A typed sentence is saved on this device for the student and is never checked or sent.", "Los estudiantes arman oraciones con fichas preparadas; el programa nunca intenta entender texto libre. Una oración escrita se guarda en este dispositivo para el estudiante y nunca se revisa ni se envía.")}
      </li>
      <li>
        ${I.T("Each wrong or vague sentence produces a specific consequence and a revision prompt; the answer is never shown. Frames and word banks fold behind Show help after two first-try successes.", "Cada oración incorrecta o imprecisa produce una consecuencia concreta y una pista para revisar; la respuesta nunca se muestra. Los marcos y bancos de palabras se ocultan tras Mostrar ayuda después de dos aciertos al primer intento.")}
      </li>
      <li>
        ${I.T("A consequence is part of the story. It is not a grade, a score or a language level, and nothing here is an official WIDA or ACCESS result. The scenarios are original practice, not test items.", "Una consecuencia es parte de la historia. No es una calificación, un puntaje ni un nivel de idioma, y nada aquí es un resultado oficial de WIDA o ACCESS. Las situaciones son práctica original, no preguntas de examen.")}
      </li>
      ${list.map(
        (s) =>
          html`<li>
            <strong>${T(I, s.title)}</strong>: ${T(I, s.feature)}.
            ${I.T("Key Language Use", "Uso clave del lenguaje")}: ${s.keyUse}.
            ${I.T("WIDA ELD Standards Framework (2020) expectation families", "Familias de expectativas del marco WIDA ELD (2020)")}:
            ${s.standards[band].join(", ")} (<a href="${WIDA_SOURCE}" rel="noopener"
              >${I.T("source", "fuente")}</a
            >).
          </li>`,
      )}
    </ul>
  </details>`;
}

// ── a scenario ───────────────────────────────────────────────────────────────────
function stepsHTML(I, s, sp) {
  return html`<ol class="cq-steps" aria-label="${I.S("Rounds", "Rondas")}">
    ${s.rounds.map((r, i) => {
      const done = Boolean(sp.memory[r.id]);
      const now = !sp.complete && i === sp.round;
      return html`<li class="${now ? "is-now" : ""}" ${now ? raw('aria-current="step"') : ""}>
        <span class="cq-step-n" aria-hidden="true">${done ? "✓" : i + 1}</span>
        ${I.T(`Round ${i + 1}`, `Ronda ${i + 1}`)}${done ? html`<span class="visually-hidden">${I.T(", done", ", hecha")}</span>` : ""}
      </li>`;
    })}
  </ol>`;
}

function cardHTML(I, s) {
  if (!s.card) return "";
  return html`<aside class="cq-card-data" aria-label="${I.S(s.card.title[0], s.card.title[1])}">
    <h2 class="cq-sub">${T(I, s.card.title)}</h2>
    <ul>
      ${s.card.lines.map((l) => html`<li>${I.TARGET(l[0], l[1])}</li>`)}
    </ul>
  </aside>`;
}

function consequenceHTML(I, s, round, st) {
  const r = st.result;
  const status = r?.status ? STATUS[r.status] : null;
  const picture =
    round.kind === "talk"
      ? html`<div class="cq-talk">
          <span class="cq-portrait">${raw(characterPortrait(s, r?.mood))}</span>
          <div class="cq-bubble">
            <p class="cq-who"><strong>${s.character.name}</strong> · ${T(I, s.character.role)}</p>
            <p>${r?.say ? T(I, r.say) : T(I, round.situation)}</p>
          </div>
        </div>`
      : html`<div class="cq-scene">${raw(robotSceneSVG(round, r?.scene, I))}</div>
          ${r?.say ? html`<p class="cq-robot-says">${T(I, r.say)}</p>` : ""}`;
  return html`<section class="panel cq-consequence" aria-labelledby="cqWhat">
    <h2 class="cq-sub" id="cqWhat">
      ${r ? I.T("What happened", "Lo que pasó") : I.T("The situation", "La situación")}
    </h2>
    ${round.kind !== "talk" ? html`<p class="cq-situation">${T(I, round.situation)}</p>` : ""}
    ${picture}
    ${status ? html`<p class="cq-status ${r.ok ? "is-done" : ""}"><span class="cq-status-label">${T(I, status)}</span></p>` : ""}
    ${r?.sentence ? html`<p class="cq-said">${I.T("You said:", "Dijiste:")} <q lang="en">${r.sentence}</q></p>` : ""}
    ${r && !r.ok ? html`<p class="feedback is-hint cq-revise"><strong>${I.T("Revise:", "Revisa:")}</strong> ${T(I, r.revise)}</p>` : ""}
  </section>`;
}

function helpHTML(I, round, sp, st) {
  const folded = helpFolded(sp);
  const open = !folded || st.helpOpen;
  const toggle = folded
    ? html`<button
        type="button"
        class="btn small"
        data-cq-help
        aria-expanded="${open}"
        aria-controls="cqHelp"
      >
        ${open ? I.T("Hide help", "Ocultar ayuda") : I.T("Show help", "Mostrar ayuda")}
      </button>`
    : "";
  const frame = round.frame.replace(/\{\w+\}/g, "___");
  return html`<div class="cq-help-wrap">
    ${toggle}
    ${
      open
        ? html`<div class="cq-help" id="cqHelp">
            <p>
              <strong>${I.T("Sentence frame", "Marco de oración")}:</strong>
              <span lang="en">${frame}</span>
            </p>
            <p>
              <strong>${I.T("Language tip", "Consejo de lenguaje")}:</strong> ${T(I, round.tip)}
            </p>
            <h3 class="cq-sub">${I.T("Word bank", "Banco de palabras")}</h3>
            <ul class="cq-bank">
              ${round.bank.map((b) => html`<li>${I.TARGET(b[0], b[1])}</li>`)}
            </ul>
          </div>`
        : ""
    }
  </div>`;
}

function builderHTML(I, s, round, sp, st) {
  const built = compose(round, st.draft);
  const passed = Boolean(st.result?.ok);
  const last = sp.round + 1 >= s.rounds.length;
  return html`<section class="panel cq-builder" aria-labelledby="cqBuild">
    <h2 class="cq-sub" id="cqBuild">${I.T("Build your sentence", "Arma tu oración")}</h2>
    <p class="cq-preview" lang="en" aria-live="polite">${built.text}</p>
    ${helpHTML(I, round, sp, st)}
    ${round.slots.map(
      (slot) =>
        html`<div class="cq-slot" role="group" aria-labelledby="cqSlot-${slot.id}">
          <p class="cq-slot-label" id="cqSlot-${slot.id}">${T(I, slot.label)}</p>
          <div class="cq-tiles">
            ${slot.options.map(
              (o) =>
                html`<button
                  type="button"
                  class="cq-tile"
                  data-cq-tile="${slot.id}:${o.id}"
                  aria-pressed="${st.draft[slot.id] === o.id}"
                  ${passed ? raw("disabled") : ""}
                >
                  ${I.TARGET(o.text[0], o.text[1])}
                </button>`,
            )}
          </div>
        </div>`,
    )}
    <details class="sim-fold cq-own">
      <summary>${I.T("Say it your own way (optional)", "Dilo a tu manera (opcional)")}</summary>
      <label class="cq-own-label" for="cqOwn">
        ${I.T("Type your own sentence. It is saved on this device. It is not checked.", "Escribe tu propia oración. Se guarda en este dispositivo. No se revisa.")}
      </label>
      <textarea id="cqOwn" class="sim-text" data-cq-own rows="2" lang="en">
${sp.own[round.id] || ""}</textarea>
    </details>
    <div class="sim-row cq-actions">
      ${
        passed
          ? html`<button type="button" class="btn btn-primary" data-cq-next>
              ${last ? I.T("Finish", "Terminar") : I.T("Next round", "Siguiente ronda")}
            </button>`
          : html`<button type="button" class="btn btn-primary" data-cq-try>
                ${I.T("Say it", "Decirlo")}
              </button>
              <button type="button" class="btn" data-cq-clear>
                ${I.T("Clear tiles", "Borrar fichas")}
              </button>`
      }
      <button
        type="button"
        class="btn small ghost"
        data-say="${built.complete ? built.text : ""}"
        ${built.complete ? "" : raw("disabled")}
      >
        ${I.T("Listen", "Escuchar")}
      </button>
    </div>
  </section>`;
}

function completeHTML(I, s, sp, band, st) {
  return html`<section class="panel cq-complete">
    <h2 class="cq-sub" tabindex="-1" data-cq-done>${I.T("Mission complete", "Misión completa")}</h2>
    <p>${T(I, s.rounds.at(-1).success)}</p>
    <h3 class="cq-sub">${I.T("The sentences that worked", "Las oraciones que funcionaron")}</h3>
    <ol class="cq-said-list">
      ${s.rounds.map(
        (r) =>
          html`<li>
            <q lang="en">${sp.said[r.id] || ""}</q>
            ${sp.own[r.id] ? html`<br /><span class="cq-own-saved">${I.T("Your own words:", "Tus propias palabras:")} <span lang="en">${sp.own[r.id]}</span></span>` : ""}
          </li>`,
      )}
    </ol>
    <div class="sim-row">
      <a class="btn btn-primary" href="${hubUrl(band)}">${I.T("Choose another", "Elegir otra")}</a>
      ${
        st.restart
          ? html`<span role="group" aria-label="${I.S("Play again", "Jugar otra vez")}">
              ${I.T("Start again? Your sentences for this one are cleared.", "¿Empezar otra vez? Se borran tus oraciones de esta misión.")}
              <button type="button" class="btn small" data-cq-restart="yes">
                ${I.T("Yes, start again", "Sí, empezar otra vez")}
              </button>
              <button type="button" class="btn small" data-cq-restart="no">
                ${I.T("Keep them", "Conservarlas")}
              </button>
            </span>`
          : html`<button type="button" class="btn" data-cq-restart="ask">
              ${I.T("Play again", "Jugar otra vez")}
            </button>`
      }
    </div>
  </section>`;
}

function scenarioHTML(I, s, band) {
  const sp = progressOf(s.id);
  const st = liveFor(s.id, sp.complete ? "done" : sp.round);
  const round = s.rounds[sp.round];
  return html`<section class="cq-play">
    <header class="cq-head">
      <p class="eyebrow">${T(I, s.area)} · ${T(I, s.feature)}</p>
      <h1 tabindex="-1">${T(I, s.title)}</h1>
      <p class="lead">${T(I, s.summary)}</p>
      ${stepsHTML(I, s, sp)}
    </header>
    ${
      sp.complete
        ? completeHTML(I, s, sp, band, st)
        : html`<div class="cq-grid">
            <div class="cq-col">${consequenceHTML(I, s, round, st)}${cardHTML(I, s)}</div>
            <div class="cq-col">${builderHTML(I, s, round, sp, st)}</div>
          </div>`
    }
    ${teacherFold(I, band, s)}
  </section>`;
}

/** Called by the Simulations view for /simulations/consequence[/<id>]. */
export function renderConsequence(ctx, crumbs) {
  const I = i18nFor(ctx);
  const band = bandOf(ctx.band);
  const hubName = I.S(
    "Communication Consequence Lab",
    "Laboratorio de consecuencias de la comunicación",
  );
  const s = ctx.route.sub ? scenarioById(ctx.route.sub) : null;
  if (!s) return { title: hubName, html: html`${crumbs([[hubName, null]])}${hubHTML(I, band)}` };
  const title = I.S(s.title[0], s.title[1]);
  return {
    title,
    html: html`${crumbs([
      [hubName, hubUrl(band)],
      [title, null],
    ])}${scenarioHTML(I, s, band)}`,
  };
}

// ── events ───────────────────────────────────────────────────────────────────────
const focusAfter = (ctx, sel) =>
  Promise.resolve(ctx.rerender()).then(() => document.querySelector(sel)?.focus());

export function onConsequenceClick(e, ctx) {
  const s = scenarioById(ctx.route.sub);
  if (!s) return false;
  const t = e.target;
  const I = i18nFor(ctx);
  let sp = progressOf(s.id);
  const st = liveFor(s.id, sp.complete ? "done" : sp.round);
  const round = s.rounds[sp.round];
  const tile = t.closest("[data-cq-tile]");
  if (tile && !tile.disabled) {
    const [slot, opt] = tile.dataset.cqTile.split(":");
    st.draft = { ...st.draft, [slot]: st.draft[slot] === opt ? undefined : opt };
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-cq-clear]")) {
    st.draft = {};
    announce(I.S("Tiles cleared.", "Fichas borradas."));
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-cq-help]")) {
    st.helpOpen = !st.helpOpen;
    if (st.helpOpen && !sp.helped[round.id])
      saveProgress(s.id, { ...sp, helped: { ...sp.helped, [round.id]: true } });
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-cq-try]")) {
    const result = evaluate(s, sp.round, st.draft, sp.memory);
    if (result.outcome === "incomplete") {
      const names = result.missing.map((id) => round.slots.find((x) => x.id === id).label);
      announce(
        I.S(
          `Choose a tile for: ${names.map((n) => n[0]).join(", ")}.`,
          `Elige una ficha para: ${names.map((n) => n[1]).join(", ")}.`,
        ),
      );
      return true;
    }
    st.result = result;
    sp = recordAttempt(sp, s, result, st.draft);
    saveProgress(s.id, sp);
    const said = I.S(result.say[0], result.say[1]);
    announce(result.ok ? said : `${said} ${I.S(result.revise[0], result.revise[1])}`, {
      tone: result.ok ? "success" : "info",
    });
    if (result.ok) focusAfter(ctx, "[data-cq-next]");
    else ctx.rerender();
    return true;
  }
  if (t.closest("[data-cq-next]")) {
    sp = advance(sp, s);
    saveProgress(s.id, sp);
    focusAfter(ctx, sp.complete ? "[data-cq-done]" : "#cqWhat");
    return true;
  }
  const restart = t.closest("[data-cq-restart]");
  if (restart) {
    const what = restart.dataset.cqRestart;
    if (what === "yes") {
      saveProgress(s.id, freshScenario());
      live = { key: "", draft: {}, result: null, helpOpen: false, restart: false };
      announce(I.S("Starting again.", "Empezando otra vez."));
      focusAfter(ctx, "h1");
      return true;
    }
    st.restart = what === "ask";
    ctx.rerender();
    return true;
  }
  return false;
}

export function onConsequenceInput(e, ctx) {
  if (!e.target.matches?.("[data-cq-own]")) return false;
  const s = scenarioById(ctx.route.sub);
  if (!s) return false;
  const sp = progressOf(s.id);
  const round = s.rounds[sp.round];
  saveProgress(s.id, { ...sp, own: { ...sp.own, [round.id]: e.target.value.slice(0, 600) } });
  return true;
}
