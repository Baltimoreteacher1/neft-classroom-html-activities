// Practice test runner: intro → questions (navigator, flags) → section review →
// results with a full answer review. Two modes, chosen before the test starts:
//  - Guided Practice: untimed; hints, transcripts (after answering), immediate rationales and retries.
//    Its results are "Supported Practice" and count each question's FIRST checked answer.
//  - Independent Rehearsal: test-day flow; each recording plays once (an optional replay is an
//    EduWonderLab rehearsal setting), no frames or word banks, flags, section review, and a
//    practice timer that NEVER auto-submits.
// Switching mode restarts the test. Each mode keeps its own formative breakdown; they are never merged.
import { listenPlayerHTML, recorderHTML, setComponentsI18n, transcriptHTML } from "../components.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { loadTest } from "../content.js";
import { correctAnswerText, isAnswered, isAuto, isCorrect } from "../grade.js";
import { choiceTarget, inputHTML, reduceAnswer, seedAnswer, setItemsI18n } from "../items.js";
import {
  BAND_POINTS,
  FORMATIVE_SMALL,
  formativeBreakdown,
  keyLanguageUse,
  LIMITS,
  languageDimension,
  METHOD,
  MIN_ITEMS,
  practiceComposite,
  SMALL_SAMPLE,
  WEIGHTS,
} from "../lang/composite.js";
import { visualsHTML } from "../media.js";
import { clear as clearTake, isRecording, stop as stopRecording, takesFor } from "../recorder.js";
import { stop as stopSpeech } from "../speech.js";
import { clearTestRecord, getStudentName, loadTestRecord, saveTestRecord } from "../store.js";
import { ART, BASE, DOMAIN_META, announce, asList, html, icon, raw, toHtml } from "../util.js";
import {
  applyRehearsal,
  onRehearsalClick,
  rehearsalClasses,
  rehearsalPrefs,
  rehearsalToolbarHTML,
  releaseRehearsal,
} from "./tools.js";
import {
  answerReviewHTML,
  compositeHTML,
  domainClass,
  domainName,
  formativeHTML,
  introSideHTML,
  modeBadgeHTML,
  modeCardsHTML,
  questionsText,
  ratingHTML,
  reviewScreenHTML,
  sectionsText,
} from "./test-report.js";
import { MODES, MODE_TEXT, gradesText, modeBannerHTML, modeOf, modePhrase, modePhraseS, otherMode, rich } from "./test-modes.js";

export { MODES, modeOf };

const IGN = raw("data-nsr-ignore");
let T = null; // { test, flat, rec }
let timerId = 0;
let renderGeneration = 0;
let I = makeI18n("en"); // set from the ctx at the top of render() and of the click handler

const rules = () => MODES[modeOf(T.rec)];
const inProgress = () => Boolean(T.rec.startedAt || Object.keys(T.rec.answers || {}).length);
function setMode(mode) {
  T.rec.conditions = mode === "independent";
  if (mode === "guided") {
    T.rec.timer = false;
    T.rec.replay = false;
  }
}
/** `/test/<id>?rehearsal=guided|independent` (from the test list) preselects a mode. */
function requestedMode() {
  const v = new URLSearchParams(globalThis.location?.search || "").get("rehearsal");
  return MODES[v] ? v : null;
}

/** Score of one machine-checked item. Guided runs count the first checked answer, never a retry. */
export function rightFor(item, rec) {
  const first = rec?.guided?.[item.id]?.first;
  if (modeOf(rec) === "guided" && typeof first === "boolean") return first;
  return isCorrect(item, rec?.answers?.[item.id] ?? seedAnswer(item));
}

/** One run's per-question outcomes, tagged for the formative breakdown. */
export function runOutcomes(flat, rec, hasTake = () => false) {
  return flat.map(({ item, section }) => {
    const scored = isAuto(item);
    return {
      domain: section.domain,
      keyUse: keyLanguageUse(item),
      dimension: scored ? languageDimension(item) : null,
      scored,
      right: scored ? rightFor(item, rec) : false,
      done: scored
        ? isAnswered(item, rec?.answers?.[item.id])
        : responseDone(item, section.domain, rec?.answers?.[item.id], rec?.oralPractice?.[item.id], hasTake(item)),
    };
  });
}

function flatten(test) {
  const flat = [];
  (test.sections || []).forEach((section, si) =>
    (section.items || []).forEach((item, ii) =>
      flat.push({ item, section, si, n: ii + 1, of: section.items.length }),
    ),
  );
  return flat;
}
const persist = () => {
  saveTestRecord(T.test.id, T.rec);
  T.savedSnapshot = JSON.stringify(loadTestRecord(T.test.id));
};

// Planning notes are preparation, not evidence of a spoken response.
export function responseDone(item, domain, answer, oralPractice = false, hasTake = false) {
  return item.type === "constructed" && domain === "Speaking"
    ? Boolean(oralPractice || hasTake)
    : isAnswered(item, answer);
}
const done = (f) =>
  responseDone(
    f.item,
    f.section.domain,
    T.rec.answers[f.item.id],
    T.rec.oralPractice?.[f.item.id],
    takesFor(`${T.test.id}:${f.item.id}`).length > 0,
  );

/** Pause on any route departure, including browser Back and same-view test changes. */
export function unmount() {
  renderGeneration++;
  clearInterval(timerId);
  releaseRehearsal();
  if (T) T.paramApplied = false;
  if (T) T.pendingMode = null;
  if (T?.rec.phase === "running") {
    T.rec.phase = "intro";
    persist();
  }
}

/** Discard cached state after importing or clearing device progress. */
export function invalidate() {
  renderGeneration++;
  clearInterval(timerId);
  T = null;
}
const answered = () => T.flat.filter(done).length;

function grade() {
  const sections = (T.test.sections || []).map((s, si) => {
    const items = T.flat.filter((f) => f.si === si).map((f) => f.item);
    const auto = items.filter(isAuto);
    const correct = auto.filter((it) => rightFor(it, T.rec)).length;
    const open = items.filter((it) => !isAuto(it));
    const openDone = open.filter((it) =>
      responseDone(
        it,
        s.domain,
        T.rec.answers[it.id],
        T.rec.oralPractice?.[it.id],
        takesFor(`${T.test.id}:${it.id}`).length > 0,
      ),
    ).length;
    return {
      domain: s.domain,
      title: s.title || s.domain,
      correct,
      total: auto.length,
      attempted: auto.filter((it) => isAnswered(it, T.rec.answers[it.id])).length,
      open: open.length,
      openDone,
    };
  });
  const c = sections.reduce((n, s) => n + s.correct, 0);
  const t = sections.reduce((n, s) => n + s.total, 0);
  return {
    sections,
    meaningful: sections.some((s) => s.attempted > 0 || s.openDone > 0),
    correct: c,
    total: t,
    date: new Date().toISOString(),
    studentName: getStudentName(),
  };
}

function clock(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function startTimer() {
  clearInterval(timerId);
  if (!T.rec.timer) return;
  timerId = setInterval(() => {
    if (!T || T.rec.phase !== "running") return clearInterval(timerId);
    T.rec.remaining = Math.max(0, (T.rec.remaining ?? T.minutes * 60) - 1);
    const el = document.getElementById("testClock");
    if (el)
      el.textContent = T.rec.remaining
        ? clock(T.rec.remaining)
        : I.S("Time is up — keep going or submit", "Se acabó el tiempo: sigue o envía la prueba");
    if (T.rec.remaining % 10 === 0) persist();
  }, 1000);
}

/** Plays allowed by this optional Lab practice setting. It does not configure an official accommodation. */
const maxPlays = () => (T?.rec.replay ? 2 : 1);

/** Hooks the app calls around the Listen button (main.js). Under test conditions the count lives in the saved test, so a reload cannot reset it. */
export function canListen(key) {
  return !T?.rec.conditions || (T.rec.plays?.[key] || 0) < maxPlays();
}
export function onListen(key) {
  if (!T?.rec.conditions) return;
  T.rec.plays ||= {};
  T.rec.plays[key] = (T.rec.plays[key] || 0) + 1;
  persist();
}

const sectionCount = () => (T.test.sections || []).length;

function introHTML() {
  const test = T.test;
  const mode = modeOf(T.rec);
  return html`${modeBannerHTML(I, T.pendingMode, T.rec)}
    <header class="test-hero">
      <div class="test-hero-copy">
        <p class="eyebrow">${I.T("Classroom practice", "Práctica de clase")} · ${gradesText(I, test.band)}</p>
        <h1 tabindex="-1">${test.title}</h1>
        ${test.overview ? html`<p class="lead">${test.overview}</p>` : ""}
        <ul class="test-facts">
          <li>${icon("list")}${questionsText(I, T.flat.length)}</li>
          <li>${icon("clock")}${I.T(`About ${T.minutes} min`, `Unos ${T.minutes} min`)}</li>
          <li>${icon("tests")}${sectionsText(I, sectionCount())}</li>
        </ul>
        <p class="test-current-mode">${modeBadgeHTML(I, mode)}</p>
      </div>
      <img class="test-hero-art" src="${ART}/test-intro.svg" alt="" width="480" height="300" />
    </header>
    <div class="test-intro-grid">
      <div class="test-intro-main">
        ${modeCardsHTML(I, T.rec, { started: inProgress(), minutes: T.minutes })}
        ${rehearsalToolbarHTML()}
        <div class="row-actions test-start">
          <button type="button" class="btn btn-primary btn-big" data-start>
            ${inProgress() ? I.T("Resume test", "Continuar la prueba") : I.T("Start test", "Empezar la prueba")}${icon("arrow-right")}
          </button>
          ${inProgress() ? html`<button type="button" class="ghost" data-restart>${I.T("Start over", "Empezar de nuevo")}</button>` : ""}
          <a class="ghost" href="${BASE}/tests">${I.T("All tests", "Todas las pruebas")}</a>
        </div>
      </div>
      ${introSideHTML(I, test, { mode, plays: T.rec.conditions ? maxPlays() : 0 })}
    </div>`;
}

function stimulus(f, ctx) {
  const { item, section } = f;
  const key = `${T.test.id}:${item.id}`;
  const listening = section.domain === "Listening";
  const script = listening
    ? [...asList(item.script), ...(item.questionAudio ? [item.questionAudio] : [])]
    : null;
  const playRule = T.rec.conditions
    ? html`<p class="cond-tag is-independent">${icon("lock")}${maxPlays() === 1 ? I.T(`Plays once · ${MODE_TEXT.independent.name[0]}`, `Suena una vez · ${MODE_TEXT.independent.name[1]}`) : I.T(`Plays up to twice · ${MODE_TEXT.independent.name[0]}`, `Suena hasta dos veces · ${MODE_TEXT.independent.name[1]}`)}</p>`
    : html`<p class="cond-tag is-guided">${icon("replay")}${I.T(`Replay allowed · ${MODE_TEXT.guided.name[0]}`, `Se puede repetir · ${MODE_TEXT.guided.name[1]}`)}</p>`;
  return html`${listening && script.length ? html`${playRule}${listenPlayerHTML(key, script, T.rec.conditions ? { rate: ctx.prefs.rate, test: true, maxPlays: maxPlays(), played: T.rec.plays?.[key] || 0, i18n: I } : { rate: ctx.prefs.rate, test: true, i18n: I })}` : ""}
  ${visualsHTML(item)}
  ${
    !listening && asList(item.passage).length
      ? html`<article class="passage">
          ${item.passageTitle ? html`<h3>${item.passageTitle}</h3>` : ""}${asList(item.passage).map((p) => html`<p>${p}</p>`)}
        </article>`
      : ""
  }`;
}

const supportLabel = (text) => html`<p class="support-label">${icon("bulb")}<strong>${text}</strong><span>${I.T("Guided Practice only", "Solo en práctica guiada")}</span></p>`;

function inputFor(f) {
  const { item, section } = f;
  const a = T.rec.answers[item.id];
  const key = `${T.test.id}:${item.id}`;
  if (item.type === "constructed") {
    if (section.domain === "Speaking")
      return html`${recorderHTML(key, { prompt: item.prompt, recording: isRecording(key) })}<label
          class="field"
          ><span>${I.T("Planning notes (optional)", "Notas de planificación (opcional)")}</span
          ><textarea rows="3" data-test-note ${IGN}>${a || ""}</textarea></label
        ><label class="timer-opt opt-row"
          ><input
            type="checkbox"
            data-test-oral
            ${T.rec.oralPractice?.[item.id] ? raw("checked") : ""}
            ${IGN}
          />
          <span>${I.T("I said my answer aloud to a teacher or partner.", "Dije mi respuesta en voz alta a un docente o compañero.")}</span></label
        >
        <p class="fine">
          ${I.T(
            "Planning notes do not count as a spoken answer. Recordings stay in this tab; ask your teacher to listen before closing or reloading it.",
            "Las notas de planificación no cuentan como respuesta oral. Las grabaciones se quedan en esta pestaña; pide a tu docente que las escuche antes de cerrarla o recargarla.",
          )}
        </p>`;
    return html`${
        rules().wordBank && item.wordBank?.length
          ? html`<div class="support-zone is-bank">
              ${supportLabel(I.T("Word bank", "Banco de palabras"))}
              <ul class="wordbank">
                ${item.wordBank.map((w) => html`<li>${w}</li>`)}
              </ul>
            </div>`
          : ""
      }<label class="field"
        ><span>${item.responseLabel || I.T("Your answer", "Tu respuesta")}</span
        ><textarea rows="8" data-test-note spellcheck="false" ${IGN}>${a || ""}</textarea>
      </label>`;
  }
  return inputHTML(item, a);
}

const answerKey = (item) => JSON.stringify(T.rec.answers[item.id] ?? null);

/** Guided only: hints and look-back supports. Never rendered in Independent Rehearsal. */
function lookbackHTML(f) {
  if (!rules().lookback) return "";
  const { item, section } = f;
  const lookFor = asList(item.listenFor || item.readFor || item.sayFor || item.writeFor);
  const frames = rules().frames ? asList(item.frames) : [];
  const g = T.rec.guided?.[item.id];
  const transcript =
    section.domain === "Listening" && g?.tries > 0 ? transcriptHTML(item.id, item.script, { i18n: I }) : "";
  if (!item.support && !lookFor.length && !frames.length && !transcript) return "";
  return html`<details class="lookback">
      <summary>${icon("bulb")}${I.T("Look back: hints and supports (Guided Practice)", "Mira atrás: pistas y apoyos (práctica guiada)")}</summary>
      ${item.support ? html`<p>${item.support}</p>` : ""}
      ${lookFor.length ? html`<p><strong>${section.domain === "Listening" ? I.T("Listen for", "Escucha y busca") : section.domain === "Reading" ? I.T("Read for", "Lee y busca") : I.T("Include", "Incluye")}:</strong></p><ul>${lookFor.map((x) => html`<li>${x}</li>`)}</ul>` : ""}
      ${frames.length ? html`<p><strong>${I.T("Sentence frames", "Estructuras de oraciones")}:</strong></p><ul class="frames">${frames.map((x) => html`<li>${x}</li>`)}</ul>` : ""}
    </details>
    ${transcript}`;
}

/** Guided only: check an answer for an immediate rationale, then retry. */
function guidedCheckHTML(f) {
  const { item } = f;
  if (!rules().rationales || !isAuto(item)) return "";
  const g = T.rec.guided?.[item.id];
  const current = g && g.last === answerKey(item);
  const why = String(item.correct || "").replace(/^correct[.!]?\s*/i, "");
  let body = "";
  if (g && !current)
    body = html`<div class="feedback is-shown" role="status"><p>${I.T("You changed your answer. Check it again.", "Cambiaste tu respuesta. Revísala otra vez.")}</p></div>`;
  else if (g?.ok)
    body = html`<div class="feedback is-right" role="status"><p class="fb-title"><span class="visually-hidden">\u2713 ${I.S("Correct", "Correcta")}</span><span aria-hidden="true">${icon("check")} ${I.T("Correct", "Correcta")}</span></p>${why ? html`<p>${why}</p>` : ""}</div>`;
  else if (g && g.tries < 2)
    body = html`<div class="feedback is-hint" role="status"><p class="fb-title">${icon("bulb")}${I.T("Not yet", "Todavía no")}</p><p>${item.hint || I.T("Look back at the question and try again.", "Vuelve a mirar la pregunta e inténtalo otra vez.")}</p><p>${I.T("Change your answer and check again.", "Cambia tu respuesta y revisa otra vez.")}</p></div>`;
  else if (g)
    body = html`<div class="feedback is-shown" role="status"><p class="fb-title">${icon("info")}${rich(I, html`The answer is: ${correctAnswerText(item)}`, html`La respuesta es: ${correctAnswerText(item)}`)}</p>${why ? html`<p>${why}</p>` : ""}</div>`;
  return html`<div class="row-actions">
      <button type="button" class="btn btn-check" data-guided-check>${g ? I.T("Check again", "Revisar otra vez") : I.T("Check my answer", "Revisar mi respuesta")}</button>
    </div>
    ${body}
    ${g ? html`<p class="fine">${g.first ? I.T("Supported Practice counts your first check: right.", "La práctica con apoyos cuenta tu primera revisión: correcta.") : I.T("Supported Practice counts your first check: not yet.", "La práctica con apoyos cuenta tu primera revisión: todavía no.")}</p>` : ""}`;
}

/** The Guided Practice supports for one question, grouped and labelled so they are never mistaken for test conditions. */
function supportZoneHTML(f) {
  if (!rules().rationales && !rules().lookback) return "";
  const body = html`${guidedCheckHTML(f)} ${lookbackHTML(f)}`;
  if (!toHtml(body).replace(/\s+/g, "")) return "";
  return html`<div class="support-zone">${supportLabel(I.T("Practice supports", "Apoyos de práctica"))}${body}</div>`;
}

function scratchHTML() {
  if (!rehearsalPrefs().scratch) return "";
  return html`<label class="field rh-scratch"
    ><span>${I.T("Scratchpad — EduWonderLab rehearsal setting. Never scored; stays on this device.", "Borrador — ajuste de ensayo de EduWonderLab. Nunca se califica; se queda en este dispositivo.")}</span
    ><textarea rows="4" data-scratch ${IGN}>${T.rec.scratch || ""}</textarea></label
  >`;
}

function paletteHTML() {
  const flags = T.rec.flags || [];
  return html`<aside class="palette" aria-label="${I.S("Question navigator", "Navegador de preguntas")}">
    <h2>${I.T("Questions", "Preguntas")}</h2>
    <p class="palette-count">${rich(I, html`<strong>${answered()}</strong> of ${T.flat.length} answered`, html`<strong>${answered()}</strong> de ${T.flat.length} respondidas`)}</p>
    ${(T.test.sections || []).map(
      (s, si) => html`<div class="pal-sec ${domainClass(s.domain)}">
        <p class="pal-sec-title">${icon(DOMAIN_META[s.domain]?.icon || "tests")}<span>${s.title || domainName(I, s.domain)}</span></p>
        <div class="dots">
          ${T.flat.map((g, i) => {
            if (g.si !== si) return "";
            const completed = done(g);
            const fl = flags.includes(g.item.id);
            return html`<button
              type="button"
              class="dot ${i === T.rec.index ? "is-current" : ""} ${completed ? "is-done" : ""} ${fl ? "is-flag" : ""}"
              data-jump="${i}"
              ${i === T.rec.index ? raw('aria-current="step"') : ""}
              aria-label="${I.S(`Question ${i + 1}${completed ? ", answered" : ""}${fl ? ", flagged" : ""}`, `Pregunta ${i + 1}${completed ? ", respondida" : ""}${fl ? ", marcada" : ""}`)}"
            >
              ${i + 1}
            </button>`;
          })}
        </div>
      </div>`,
    )}
    <ul class="pal-key" aria-label="${I.S("Key", "Leyenda")}">
      <li><span class="pal-swatch is-current" aria-hidden="true"></span>${I.T("Current", "Actual")}</li>
      <li><span class="pal-swatch is-done" aria-hidden="true"></span>${I.T("Answered", "Respondida")}</li>
      <li><span class="pal-swatch is-flag" aria-hidden="true"></span>${I.T("Flagged", "Marcada")}</li>
      <li><span class="pal-swatch" aria-hidden="true"></span>${I.T("Not answered", "Sin responder")}</li>
    </ul>
  </aside>`;
}

function runnerHTML(ctx) {
  const f = T.flat[T.rec.index] || T.flat[0];
  const flagged = (T.rec.flags || []).includes(f.item.id);
  const last = T.rec.index >= T.flat.length - 1;
  const listening = f.section.domain === "Listening";
  const hasPassage = !listening && asList(f.item.passage).length > 0;
  const stim = stimulus(f, ctx);
  const hasStimulus = Boolean(toHtml(stim).replace(/\s+/g, ""));
  const response = html`<p class="prompt-text">${f.item.prompt || ""}</p>
    ${inputFor(f)} ${supportZoneHTML(f)}`;
  return html`<div class="test-bar">
      ${modeBadgeHTML(I, modeOf(T.rec))}
      <span class="dom-chip">${icon(DOMAIN_META[f.section.domain]?.icon || "tests")}${f.section.title || domainName(I, f.section.domain)}</span>
      <span class="test-sec">${I.T(`Section ${f.si + 1} of ${T.test.sections.length}`, `Sección ${f.si + 1} de ${T.test.sections.length}`)}</span>
      ${T.rec.timer ? html`<span class="test-clock-wrap">${icon("clock")}<span class="test-clock-label">${I.T("Practice timer", "Temporizador de práctica")}</span><span class="test-clock" id="testClock" role="timer">${T.rec.remaining ? clock(T.rec.remaining) : I.S("Time is up — keep going or submit", "Se acabó el tiempo: sigue o envía la prueba")}</span></span>` : ""}
      <button type="button" class="ghost small" data-exit>${icon("save")}${I.T("Save & exit", "Guardar y salir")}</button>
    </div>
    <div class="test-progress" aria-hidden="true">
      <span style="width:${Math.round(((T.rec.index + 1) / T.flat.length) * 100)}%"></span>
    </div>
    ${rehearsalToolbarHTML({ compact: true })}
    <div class="test-stage">
      <section class="test-q ${hasPassage ? "has-passage" : ""} ${hasStimulus ? "has-stimulus" : ""}" aria-labelledby="qTitle">
        <div class="q-head">
          <h1 id="qTitle" tabindex="-1">
            ${rich(I, html`Question ${T.rec.index + 1} <span>of ${T.flat.length}</span>`, html`Pregunta ${T.rec.index + 1} <span>de ${T.flat.length}</span>`)}
          </h1>
          <button
            type="button"
            class="flag ${flagged ? "is-on" : ""}"
            data-flag
            aria-pressed="${flagged}"
          >
            ${icon("flag")}${flagged ? I.T("Flagged", "Marcada") : I.T("Flag for review", "Marcar para revisar")}
          </button>
        </div>
        ${f.n === 1 && f.section.directions ? html`<p class="section-directions">${icon("info")}<span><strong>${I.T("Directions.", "Instrucciones.")}</strong> ${f.section.directions}</span></p>` : ""}
        ${
          hasStimulus
            ? html`<div class="test-workspace has-stimulus ${hasPassage ? "has-passage" : ""}">
                <div class="test-passage-col">${stim}</div>
                <div class="test-response-col">${response}</div>
              </div>`
            : html`<div class="test-workspace"><div class="test-response-col">${response}</div></div>`
        }
        ${scratchHTML()}
      </section>
      ${paletteHTML()}
    </div>
    <nav class="act-nav" aria-label="${I.S("Question navigation", "Navegación de preguntas")}">
      <button type="button" class="btn" data-prev ${T.rec.index === 0 ? raw("disabled") : ""}>
        ${icon("arrow-left")}${I.T("Back", "Atrás")}
      </button>
      <span class="act-count">${I.T(`${answered()}/${T.flat.length} answered`, `${answered()}/${T.flat.length} respondidas`)}</span>
      ${last ? html`<button type="button" class="btn btn-primary" data-review>${I.T("Review answers", "Repasar respuestas")}${icon("arrow-right")}</button>` : html`<button type="button" class="btn btn-primary" data-next>${I.T("Next", "Siguiente")}${icon("arrow-right")}</button>`}
    </nav>`;
}

function resultsHTML() {
  const r = T.rec.results;
  const mode = modeOf(T.rec);
  const pct = r.total ? Math.round((r.correct / r.total) * 100) : 0;
  return html`<section class="results">
      ${modeBannerHTML(I, T.pendingMode, T.rec)}
      <header class="report-hero">
        <div class="report-copy">
          <p class="eyebrow">${I.T(`Practice report${r.studentName ? ` · ${r.studentName}` : ""}`, `Informe de práctica${r.studentName ? ` · ${r.studentName}` : ""}`)}</p>
          <h1 tabindex="-1">${T.test.title}</h1>
          <p class="report-mode">${modeBadgeHTML(I, mode)}</p>
          <p class="fine">${rich(I, html`<strong>${MODE_TEXT[mode].label[0]}.</strong> ${T.rec.conditions ? `Each recording played ${maxPlays() === 1 ? "once" : "up to twice"} and could not be paused.` : "Hints and retries were available, so each checked question counts your first try."}`, html`<strong>${MODE_TEXT[mode].label[1]}.</strong> ${T.rec.conditions ? `Cada grabación se reprodujo ${maxPlays() === 1 ? "una sola vez" : "hasta dos veces"} y no se pudo pausar.` : "Había pistas y nuevos intentos, así que cada pregunta revisada cuenta tu primer intento."}`)}</p>
          ${r.total ? html`<p class="big-score"><strong>${r.correct}/${r.total}</strong><span>${I.T("scored questions right", "preguntas calificadas correctas")}</span></p><div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>` : ""}
        </div>
        <img class="report-art" src="${ART}/test-complete.svg" alt="" width="480" height="300" />
      </header>
      <div class="result-grid">
        ${r.sections.map(
          (s) =>
            html`<article class="result-card ${domainClass(s.domain)}">
              <h2>${icon(DOMAIN_META[s.domain]?.icon || "tests")}${s.title}</h2>
              ${
                s.total
                  ? html`<p class="rc-score">${rich(I, html`<strong>${s.correct}</strong> of ${s.total} right`, html`<strong>${s.correct}</strong> de ${s.total} correctas`)}</p>
                      <div class="bar" aria-hidden="true">
                        <i style="width:${Math.round((s.correct / s.total) * 100)}%"></i>
                      </div>`
                  : ""
              }
              ${s.open ? html`<p>${I.T(
                    `${s.openDone} of ${s.open} ${s.domain === "Speaking" ? "spoken" : "written"} answer${s.open === 1 ? "" : "s"} done — ask your teacher to listen or read.`,
                    `${s.openDone} de ${s.open} ${s.domain === "Speaking" ? (s.open === 1 ? "respuesta oral" : "respuestas orales") : s.open === 1 ? "respuesta escrita" : "respuestas escritas"} ${s.open === 1 ? "hecha" : "hechas"}: pide a tu docente que ${s.open === 1 ? "la" : "las"} ${s.domain === "Speaking" ? "escuche" : "lea"}.`,
                  )}</p>` : ""}
            </article>`,
        )}
      </div>
      ${ratingHTML(I, r, T.rec.ratings)}
      ${compositeHTML(I, practiceComposite(r.sections, T.rec.ratings), { WEIGHTS, METHOD, LIMITS, MIN_ITEMS, BAND_POINTS })}
      ${formativeHTML(I, T.rec.formative, formativeBreakdown, { SMALL_SAMPLE, FORMATIVE_SMALL })}
      <p class="test-note disclaimer">
        ${icon("info")}<span>${I.T(
          "This is practice feedback, not a WIDA ACCESS score or level. Speaking and writing are best judged by your teacher.",
          "Esta es retroalimentación de práctica, no un puntaje ni un nivel de WIDA ACCESS. Tu docente es quien mejor puede evaluar Hablar y Escribir.",
        )}</span>
      </p>
      <div class="row-actions report-actions">
        <button type="button" class="btn" data-print>${icon("print")}${I.T("Print report", "Imprimir informe")}</button
        ><button type="button" class="btn" data-restart>${icon("retry")}${I.T("Take it again", "Hacerla de nuevo")}</button
        ><button type="button" class="btn" data-switch-mode="${otherMode(mode)}">${modePhrase(I, otherMode(mode), "label", "Try {m}", "Probar {m}")}</button
        ><a class="ghost" href="${BASE}/tests">${I.T("All tests", "Todas las pruebas")}</a>
      </div>
    </section>
    ${answerReviewHTML(I, T.flat, T.rec.answers)}`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  setComponentsI18n(I);
  setItemsI18n(I);
  const generation = ++renderGeneration;
  const id = ctx.route.testId;
  const saved = loadTestRecord(id);
  if (!T || T.test.id !== id || T.savedSnapshot !== JSON.stringify(saved)) {
    clearInterval(timerId);
    const test = await loadTest(id).catch(() => null);
    // The app discards stale HTML; do not let it replace this module's state either.
    if (generation !== renderGeneration) return { title: "", html: html`` };
    if (!test)
      return {
        title: I.S("Test not found", "Prueba no encontrada"),
        html: html`<section class="panel">
          <h1 tabindex="-1">${I.T("We could not find that test.", "No pudimos encontrar esa prueba.")}</h1>
          <a class="btn" href="${BASE}/tests">${I.T("All practice tests", "Todas las pruebas de práctica")}</a>
        </section>`,
      };
    const rec = saved;
    T = {
      test,
      savedSnapshot: JSON.stringify(saved),
      flat: flatten(test),
      minutes: (test.sections || []).reduce((n, s) => n + (Number(s.estMinutes) || 8), 0),
      rec: { phase: "intro", index: 0, answers: {}, flags: [], conditions: Boolean(test.conditionsDefault), ...rec },
    };
    if (T.rec.results) T.rec.phase = "results";
    if (T.rec.phase === "running") T.rec.phase = "intro"; // resume from the intro screen
  }
  const want = requestedMode();
  if (want && !T.paramApplied) {
    T.paramApplied = true;
    if (want !== modeOf(T.rec)) {
      if (T.rec.phase === "intro" && !inProgress()) {
        setMode(want);
        persist();
      } else T.pendingMode = want;
    }
  }
  const body =
    T.rec.phase === "running"
      ? runnerHTML(ctx)
      : T.rec.phase === "review"
        ? reviewScreenHTML(I, { test: T.test, flat: T.flat, rec: T.rec, done, answered: answered() })
        : T.rec.phase === "results"
          ? resultsHTML()
          : introHTML();
  const running = T.rec.phase === "running";
  const domain = running ? (T.flat[T.rec.index] || T.flat[0]).section.domain : "";
  return {
    title: T.test.title,
    html: html`<div class="test-view is-${T.rec.phase} ${running ? domainClass(domain) : "d-model-test"} ${rehearsalClasses()}" data-mode="${modeOf(T.rec)}">${body}</div>`,
  };
}
export function mount(_root, ctx) {
  applyRehearsal(ctx);
  if (T?.rec.phase === "running" && T.rec.timer) startTimer();
  else clearInterval(timerId);
}

/** Start over, keeping each mode's last formative result. `mode` switches mode (a switch always restarts). */
function restart(ctx, mode = modeOf(T.rec)) {
  const current = T;
  stopRecording().then(() => {
    if (T !== current) return;
    for (const f of T.flat) clearTake(`${T.test.id}:${f.item.id}`);
    clearTestRecord(T.test.id);
    const { formative, conditions, replay } = T.rec;
    T.rec = { phase: "intro", index: 0, answers: {}, flags: [], conditions, replay };
    if (formative) T.rec.formative = formative;
    setMode(mode);
    T.pendingMode = null;
    announce(modePhraseS(I, mode, "label", "{m}. The test starts over.", "{m}. La prueba empieza de nuevo."));
    go(ctx, {});
  });
  return true;
}

function guidedCheck(ctx, f) {
  const { item } = f;
  if (!rules().rationales || !isAuto(item)) return;
  if (!isAnswered(item, T.rec.answers[item.id])) return announce(I.S("Choose an answer first.", "Primero elige una respuesta."));
  const ok = isCorrect(item, T.rec.answers[item.id] ?? seedAnswer(item));
  T.rec.guided ||= {};
  const g = (T.rec.guided[item.id] ||= { tries: 0 });
  g.tries++;
  if (typeof g.first !== "boolean") g.first = ok;
  g.ok = ok;
  g.last = answerKey(item);
  persist();
  announce(ok ? I.S("Correct.", "Correcta.") : g.tries < 2 ? I.S("Not yet. Try again.", "Todavía no. Inténtalo otra vez.") : I.S("Here is the answer.", "Aquí está la respuesta."));
  ctx.rerender();
}

async function go(ctx, patch) {
  stopSpeech();
  const current = T;
  await stopRecording();
  if (T !== current) return;
  Object.assign(T.rec, patch);
  persist();
  ctx.rerender();
  window.scrollTo({ top: 0 });
  setTimeout(() => document.getElementById("qTitle")?.focus({ preventScroll: true }), 0);
}

export function onClick(e, ctx) {
  if (!T) return;
  I = i18nFor(ctx);
  const t = e.target;
  const f = T.flat[T.rec.index];
  if (onRehearsalClick(e, ctx)) return true;
  const choice = T.rec.phase === "running" && f && choiceTarget(e);
  if (choice) {
    T.rec.answers[f.item.id] = reduceAnswer(f.item, T.rec.answers[f.item.id], choice);
    persist();
    ctx.rerender();
    return true;
  }
  if (T.rec.phase === "running" && f && ["sort", "order", "hotText"].includes(f.item.type)) {
    const next = reduceAnswer(f.item, T.rec.answers[f.item.id], t);
    if (next !== undefined && !t.matches("[data-ans-choice]")) {
      T.rec.answers[f.item.id] = next;
      persist();
      return ctx.rerender();
    }
  }
  if (t.closest("[data-start]")) {
    if (T.rec.timer && T.rec.remaining == null) T.rec.remaining = T.minutes * 60;
    return go(ctx, { phase: "running", startedAt: T.rec.startedAt || new Date().toISOString() });
  }
  if (t.closest("[data-restart]")) return restart(ctx);
  const switchTo = t.closest("[data-switch-mode]")?.dataset.switchMode;
  if (MODES[switchTo]) return restart(ctx, switchTo);
  if (t.closest("[data-guided-check]") && T.rec.phase === "running" && f) {
    guidedCheck(ctx, f);
    return true;
  }
  if (t.closest("[data-prev]")) return go(ctx, { index: Math.max(0, T.rec.index - 1) });
  if (t.closest("[data-next]"))
    return go(ctx, { index: Math.min(T.flat.length - 1, T.rec.index + 1) });
  const jump = t.closest("[data-jump]");
  if (jump) return go(ctx, { phase: "running", index: Number(jump.dataset.jump) || 0 });
  if (t.closest("[data-review]")) return go(ctx, { phase: "review" });
  if (t.closest("[data-flag]")) {
    const set = new Set(T.rec.flags || []);
    set.has(f.item.id) ? set.delete(f.item.id) : set.add(f.item.id);
    T.rec.flags = [...set];
    persist();
    return ctx.rerender();
  }
  if (t.closest("[data-submit]")) {
    clearInterval(timerId);
    const current = T;
    stopRecording().then(() => {
      if (T !== current) return;
      announce(I.S("Test submitted.", "Prueba enviada."));
      const mode = modeOf(T.rec);
      const outcomes = runOutcomes(T.flat, T.rec, (item) => takesFor(`${T.test.id}:${item.id}`).length > 0);
      // Each mode's breakdown lives in its own slot: guided work can never land in the independent one.
      const formative = { ...(T.rec.formative || {}), [mode]: { mode, date: new Date().toISOString(), outcomes, ratings: T.rec.ratings || {} } };
      go(ctx, { phase: "results", results: grade(), formative });
    });
    return true;
  }
  if (t.closest("[data-exit]")) {
    unmount();
    return ctx.navigate(`${BASE}/tests`);
  }
}

export function onChange(e, ctx) {
  if (!T) return;
  const t = e.target;
  if (t.matches("[data-timer]")) {
    T.rec.timer = t.checked;
    if (t.checked && T.rec.remaining == null) T.rec.remaining = T.minutes * 60;
    persist();
    return;
  }
  if (T.rec.phase === "results" && (t.matches("[data-rating]") || t.matches("[data-rating-by]"))) {
    const domain = t.dataset.rating || t.dataset.ratingBy;
    T.rec.ratings ||= {};
    const cur = (T.rec.ratings[domain] ||= {});
    if (t.dataset.rating) cur[t.dataset.ratingCrit] = t.value;
    else cur.by = t.value;
    const snap = T.rec.formative?.[modeOf(T.rec)];
    if (snap) snap.ratings = T.rec.ratings;
    persist();
    const id = t.id;
    return ctx.rerender().then(() => document.getElementById(id)?.focus({ preventScroll: true }));
  }
  if (T.rec.phase === "intro" && (t.matches("[data-conditions]") || t.matches("[data-replay]"))) {
    if (t.matches("[data-conditions]")) {
      if (inProgress()) return; // a mode change mid-test goes through restart()
      setMode(t.value === "test" ? "independent" : "guided");
    } else T.rec.replay = t.checked;
    persist();
    return ctx.rerender().then(() => document.querySelector(`[data-conditions][value="${T.rec.conditions ? "test" : "learning"}"], [data-replay]`)?.focus({ preventScroll: true }));
  }
  const f = T.flat[T.rec.index];
  if (T.rec.phase !== "running" || !f) return;
  if (t.matches("[data-test-oral]")) {
    T.rec.oralPractice ||= {};
    T.rec.oralPractice[f.item.id] = t.checked;
    persist();
    ctx.rerender();
    return;
  }
  const next = reduceAnswer(f.item, T.rec.answers[f.item.id], t);
  if (next !== undefined) {
    T.rec.answers[f.item.id] = next;
    persist();
    ctx.rerender();
  }
}

export function onInput(e) {
  if (T && e.target.matches("[data-scratch]")) {
    T.rec.scratch = e.target.value.slice(0, 5000);
    return persist();
  }
  if (!T || !e.target.matches("[data-test-note]")) return;
  const f = T.flat[T.rec.index];
  T.rec.answers[f.item.id] = e.target.value;
  persist();
}
