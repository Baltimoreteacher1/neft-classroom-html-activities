// Reading Ladder: one short passage and three questions per round. The next passage is one step up after
// a perfect round, one step down after two or more misses, and the same step otherwise. The learner can
// start at any step. Steps are practice steps on this device, not a reading level, Lexile or WIDA level.
import { crumbsHTML, setComponentsI18n } from "../components.js";
import { award } from "../engagement.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { loadLadder } from "../content.js";
import {
  LADDER_STEPS,
  finishRound,
  ladderSummary,
  normalizeLadder,
  pickPassage,
  questionKindLabel,
  startStep,
  stepMove,
} from "../ladder.js";
import { BASE, announce, html, icon, safeJson, storage, todayISO } from "../util.js";

const KEY = "accessPracticeLab:v1:reading-ladder";
const readAll = () => {
  const saved = safeJson(storage.get(KEY), {});
  return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
};
const bandKey = (band) => (band === "3-5" ? "3-5" : "6-8");
const KIND_ES = {
  detail: "Buscar un detalle",
  word: "Palabra en contexto",
  inference: "Hacer una inferencia",
  "main-idea": "Idea principal",
};

let I = makeI18n("en");
// The router calls onClick synchronously, so the passages loaded by render stay here for the handlers.
let DATA = null;

function load(band) {
  return normalizeLadder(readAll()[band], startStep(band));
}
function save(band, state) {
  storage.set(KEY, JSON.stringify({ ...readAll(), [band]: state }));
}
// The passage stays the same across redraws and reloads until the learner moves on.
function currentPassage(data, state) {
  return data.passages.find((p) => p.id === state.open?.id) || null;
}
function openRound(data, state, random = Math.random) {
  const passage = pickPassage(data.passages, state.step, state.history, random);
  return passage ? { ...state, open: { id: passage.id, picks: [], checked: false } } : state;
}

const rungs = (state) =>
  html`<ol
    class="gm-rungs"
    aria-label="${I.S("Ladder steps, 1 is the lowest", "Peldaños de la escalera, 1 es el más bajo")}"
  >
    ${Array.from({ length: LADDER_STEPS }, (_, i) => LADDER_STEPS - i).map(
      (n) =>
        html`<li
          class="${n === state.step ? "is-here" : ""} ${n <= state.best ? "is-reached" : ""}"
          ${n === state.step ? 'aria-current="step"' : ""}
        >
          <span class="gm-rung-n">${n}</span
          ><span class="gm-rung-label"
            >${n === state.step ? I.T("You are here", "Estás aquí") : n === state.best && n !== state.step ? I.T("Highest so far", "Más alto hasta ahora") : ""}</span
          >
        </li>`,
    )}
  </ol>`;

function questionHTML(q, i, picks, checked) {
  const pick = picks[i];
  const right = pick === q.answer;
  return html`<fieldset
    class="gm-question ${checked ? (right ? "is-right" : "is-miss") : ""}"
    ${checked ? "disabled" : ""}
  >
    <legend>
      <span class="gm-kind">${I.S(questionKindLabel(q.kind), KIND_ES[q.kind] || "")}</span>
      ${i + 1}. ${q.q}
    </legend>
    ${q.choices.map((choice, c) => html`<label class="gm-choice ${checked && c === q.answer ? "is-key" : ""}"><input type="radio" name="gm-q${i}" value="${c}" data-ld-pick="${i}" ${pick === c ? "checked" : ""} /> <span>${choice}</span></label>`)}
    ${
      checked
        ? html`<p class="gm-why ${right ? "is-right" : "is-miss"}">
            ${icon(right ? "check" : "bulb")}
            <b>${right ? I.T("Right.", "Correcto.") : I.T("Not this time.", "Esta vez no.")}</b>
            ${right ? "" : html`${I.T("Look back:", "Vuelve a mirar:")} ${q.hint} `}${q.why}
          </p>`
        : ""
    }
  </fieldset>`;
}

function resultHTML(state, passage, band) {
  const row = state.history.at(-1);
  const move = stepMove(row.step, row.correct, row.total);
  const message = {
    up: I.T(
      `You answered all ${row.total} questions correctly, so the next passage is one step up.`,
      `Respondiste bien las ${row.total} preguntas, así que el próximo texto sube un peldaño.`,
    ),
    hold: I.T(
      "One miss. The next passage stays on this step so you can build on it.",
      "Una respuesta no correcta. El próximo texto se queda en este peldaño para que sigas practicando.",
    ),
    down: I.T(
      "A few misses. The next passage moves one step down so you can read it with more confidence.",
      "Varias respuestas no correctas. El próximo texto baja un peldaño para que lo leas con más seguridad.",
    ),
  }[move];
  const top = move === "up" && state.step === row.step;
  return html`<section
    class="feedback is-${move === "down" ? "hint" : "right"}"
    role="status"
    tabindex="-1"
  >
    <p class="fb-title">
      ${icon(move === "down" ? "bulb" : "check")}
      ${I.T(`${row.correct} of ${row.total} correct`, `${row.correct} de ${row.total} correctas`)}
    </p>
    <p>
      ${top ? I.T("You are on the top step. Keep reading at this step to stay strong.", "Estás en el peldaño más alto. Sigue leyendo aquí para mantenerte fuerte.") : message}
      ${I.T(`Next: step ${state.step} of ${LADDER_STEPS}.`, `Siguiente: peldaño ${state.step} de ${LADDER_STEPS}.`)}
    </p>
    <div class="gm-actions">
      <button class="btn btn-primary" type="button" data-ld-next>
        ${I.T("Next passage", "Siguiente texto")} ${icon("arrow-right")}</button
      ><a class="btn" href="${BASE}/reading-room?grades=${band}"
        >${I.T("Open the Reading Room", "Abrir la sala de lectura")}</a
      >
    </div>
  </section>`;
}

function summaryHTML(state) {
  const s = ladderSummary(state);
  const recent = state.history.slice(-5).reverse();
  return html`<section class="panel gm-summary" aria-labelledby="ldSummary">
    <h2 id="ldSummary">${I.T("My ladder", "Mi escalera")}</h2>
    ${
      s.rounds
        ? html`<p>
              ${I.T(`${s.rounds} ${s.rounds === 1 ? "round" : "rounds"} on ${s.days} ${s.days === 1 ? "day" : "days"} · ${s.right} of ${s.asked} questions right · highest step ${s.best}`, `${s.rounds} ${s.rounds === 1 ? "ronda" : "rondas"} en ${s.days} ${s.days === 1 ? "día" : "días"} · ${s.right} de ${s.asked} preguntas correctas · peldaño más alto ${s.best}`)}
            </p>
            ${s.enough ? "" : html`<p class="fine">${I.T("Not enough evidence yet to see a pattern. Read three rounds.", "Todavía no hay suficiente evidencia para ver un patrón. Lee tres rondas.")}</p>`}
            <ul class="gm-recent">
              ${recent.map((row) => html`<li>${I.T(`Step ${row.step}`, `Peldaño ${row.step}`)}: ${row.correct}/${row.total}</li>`)}
            </ul>`
        : html`<p class="fine">
            ${I.T("Your rounds will appear here. They stay on this device.", "Tus rondas aparecerán aquí. Se quedan en este dispositivo.")}
          </p>`
    }
  </section>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  setComponentsI18n(I);
  const band = bandKey(ctx.band);
  const data = await loadLadder();
  DATA = data;
  let state = load(band);
  if (!currentPassage(data, state)) {
    state = openRound(data, state);
    save(band, state);
  }
  const passage = currentPassage(data, state);
  const checked = state.open?.checked === true;
  const picks = state.open?.picks || [];
  const bandLabel =
    band === "3-5" ? I.T("Grades 3–5", "Grados 3–5") : I.T("Grades 6–8", "Grados 6–8");
  return {
    title: I.S("Reading Ladder", "Escalera de lectura"),
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Reading Ladder", "Escalera de lectura"), null],
      ])}
      <div class="gm-studio d-reading">
        <header class="gm-hero">
          <div>
            <p class="gm-kicker">
              ${icon("reading")} ${I.T("Reading practice", "Práctica de lectura")} · ${bandLabel}
            </p>
            <h1 tabindex="-1">${I.T("Reading Ladder", "Escalera de lectura")}</h1>
            <p class="lead">
              ${I.T("Read a short text and answer three questions. Do well and the next text is a step harder. Miss a few and it steps back so you can build up again.", "Lee un texto corto y responde tres preguntas. Si te va bien, el próximo texto es un peldaño más difícil. Si fallas varias, baja un peldaño para que vuelvas a subir.")}
            </p>
            <p class="fine">
              ${I.T("Steps are this lab’s own practice steps, from shorter and simpler texts to longer and more complex ones. They are not a reading level, a Lexile measure or a WIDA level.", "Los peldaños son los pasos de práctica de este laboratorio, de textos más cortos y sencillos a textos más largos y complejos. No son un nivel de lectura, una medida Lexile ni un nivel de WIDA.")}
            </p>
          </div>
          <div class="gm-step-card">
            <p class="gm-step-now">
              ${I.T(`Step ${state.step} of ${LADDER_STEPS}`, `Peldaño ${state.step} de ${LADDER_STEPS}`)}
            </p>
            ${rungs(state)}
          </div>
        </header>
        <div class="gm-layout">
          <section class="panel gm-passage" aria-labelledby="ldTitle">
            <p class="eyebrow">
              ${passage.topic} · ${I.T(`Step ${passage.step}`, `Peldaño ${passage.step}`)}
            </p>
            <h2 id="ldTitle">${passage.title}</h2>
            <p class="gm-text">${passage.text}</p>
            <button type="button" class="ghost small" data-say="${passage.text}">
              ${icon("volume")} ${I.T("Read this aloud", "Leer en voz alta")}
            </button>
          </section>
          <section class="panel gm-questions" aria-label="${I.S("Questions", "Preguntas")}">
            ${passage.questions.map((q, i) => questionHTML(q, i, picks, checked))}
            ${checked ? resultHTML(state, passage, band) : html`<div class="gm-actions"><button class="btn btn-primary" type="button" data-ld-check>${I.T("Check my answers", "Revisar mis respuestas")}</button></div>`}
          </section>
        </div>
        <div class="gm-grid2">
          ${summaryHTML(state)}
          <section class="panel gm-chooser" aria-labelledby="ldChoose">
            <h2 id="ldChoose">${I.T("Start on a different step", "Empezar en otro peldaño")}</h2>
            <p class="fine">
              ${I.T("You choose where to practice. A different step starts a new round.", "Tú eliges dónde practicar. Otro peldaño empieza una ronda nueva.")}
            </p>
            <label class="field"
              ><span>${I.T("Step", "Peldaño")}</span
              ><select data-ld-step>
                ${Array.from({ length: LADDER_STEPS }, (_, i) => i + 1).map((n) => html`<option value="${n}" ${n === state.step ? "selected" : ""}>${I.S(`Step ${n}`, `Peldaño ${n}`)}</option>`)}
              </select></label
            >
            <button class="btn" type="button" data-ld-go>
              ${I.T("Start at this step", "Empezar en este peldaño")}
            </button>
          </section>
        </div>
        <p class="gm-note">
          ${I.T("Your rounds are saved on this device only. Nothing here is a score, a proficiency level or a prediction of any test result.", "Tus rondas se guardan solo en este dispositivo. Nada aquí es una calificación, un nivel de dominio ni una predicción del resultado de una prueba.")}
        </p>
      </div>`,
  };
}

export function onChange(event, ctx) {
  const radio = event.target.closest("[data-ld-pick]");
  if (!radio) return;
  const band = bandKey(ctx.band);
  const state = load(band);
  if (!state.open || state.open.checked) return;
  const picks = [...state.open.picks];
  picks[Number(radio.dataset.ldPick)] = Number(radio.value);
  save(band, { ...state, open: { ...state.open, picks } });
}

export function onClick(event, ctx) {
  const button = event.target.closest("button");
  if (!button || !DATA) return false;
  const band = bandKey(ctx.band);
  const data = DATA;
  let state = load(band);
  const passage = currentPassage(data, state);
  if (button.hasAttribute("data-ld-check") && passage && !state.open.checked) {
    const picks = passage.questions.map((_, i) => state.open.picks[i] ?? null);
    if (picks.some((p) => p === null)) {
      announce(
        I.S(
          "Answer all three questions, then check.",
          "Responde las tres preguntas y luego revisa.",
        ),
      );
      return true;
    }
    state = finishRound(state, passage, picks, todayISO());
    state = { ...state, open: { id: passage.id, picks, checked: true } };
    const row = state.history.at(-1);
    if (row.correct > 0)
      award(
        ctx,
        `ladder:${band}:${passage.id}:${state.history.length}`,
        row.correct,
        "Reading Ladder round",
      );
  } else if (button.hasAttribute("data-ld-next")) {
    state = openRound(data, { ...state, open: null });
  } else if (button.hasAttribute("data-ld-go")) {
    const step = Number(document.querySelector("[data-ld-step]")?.value);
    if (!(step >= 1 && step <= LADDER_STEPS)) return true;
    state = openRound(data, { ...state, step, open: null });
  } else return false;
  save(band, state);
  ctx.rerender();
  return true;
}
