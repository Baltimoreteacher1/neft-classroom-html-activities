// Family Mission Companions on the family page: the "Continue Family Practice" card at the top of /family and the
// companion detail view at /family?mission=mNN. Text first, no images. Everything shown here is bilingual through
// the page's language mode; progress is counts and step names from this device only.
import { MISSIONS, MISSION_IDS, STEPS, missionNumber, stepInfo } from "../journey/curriculum.js";
import { findActivity, loadEsGuide } from "../content.js";
import { langSwitchHTML } from "../i18n.js";
import { getStudentName } from "../store.js";
import { BASE, html, icon } from "../util.js";
import {
  currentMissionForFamily,
  familyCompanionFor,
  familyContinueHref,
  journeyStepHref,
  loadJourneyState,
  missionFromSearch,
  progressSummary,
} from "./journey-link.js";
import { crumbs, gradeSwitch, subnavHTML } from "./ui.js";

const TOTAL = MISSION_IDS.length;

/** Who is practicing and where the progress comes from, so a shared device never shows the wrong child. */
function learnerLine(I) {
  const name = getStudentName();
  const who = name
    ? I.T(`Learner on this device: ${name}`, `Estudiante en este dispositivo: ${name}`)
    : I.T(
        "No learner name is set on this device.",
        "No hay un nombre de estudiante guardado en este dispositivo.",
      );
  return html`<p class="jf-learner">
    <strong>${who}</strong>
    <span
      >${I.T("Progress shown is from this device only.", "El progreso que se muestra es solo de este dispositivo.")}</span
    >
  </p>`;
}

/** The machine-assisted Spanish notice, shown wherever Spanish companion text appears. */
const spanishNote = (I) =>
  I.spanish || I.bilingual
    ? html`<p class="jf-note fine" lang="es">
        El español es asistido por máquina y no ha sido revisado por un traductor humano.
      </p>`
    : "";

const stepName = (I, id) => {
  const s = stepInfo(id);
  return s ? I.T(...s.label) : "";
};

/** One recent-activity block: how far into the mission, and the latest finished step names. No text the learner wrote. */
function activityBlock(I, summary, missionId) {
  const done = summary.byMission[missionId] ?? 0;
  const lead = done
    ? I.T(
        `${done} of ${STEPS.length} steps finished in this mission.`,
        `${done} de ${STEPS.length} pasos terminados en esta misión.`,
      )
    : I.T(
        "No steps finished in this mission yet. Start the first one together.",
        "Todavía no hay pasos terminados en esta misión. Empiecen juntos el primero.",
      );
  const latest = summary.recent.map(
    (r) =>
      html`<li>
        ${I.T(MISSIONS[r.mission].title[0], MISSIONS[r.mission].title[1])}: ${stepName(I, r.step)}
      </li>`,
  );
  return html`<div class="jf-activity">
    <h3>${I.T("Recent journey activity", "Actividad reciente en el recorrido")}</h3>
    <p>${lead}</p>
    ${
      latest.length
        ? html`<ul>
            ${latest}
          </ul>`
        : ""
    }
    <p class="fine">
      ${I.T(`Missions started: ${summary.started}. Missions finished: ${summary.completed}.`, `Misiones empezadas: ${summary.started}. Misiones terminadas: ${summary.completed}.`)}
    </p>
  </div>`;
}

/** Twelve companions in mission order. `current` is highlighted for assistive tech and sighted users alike. */
export function pickerHTML(I, band, current) {
  return html`<ol class="jf-picker-list">
    ${MISSION_IDS.map(
      (id) =>
        html`<li>
          <a
            href="${familyContinueHref(id, band)}"
            ${id === current ? html`aria-current="page"` : ""}
            ><span class="jf-n" aria-hidden="true">${missionNumber(id)}</span
            ><span>${I.T(...MISSIONS[id].title)}</span></a
          >
        </li>`,
    )}
  </ol>`;
}

const frameList = (I, frames) =>
  html`<ul class="jf-frames">
    ${frames.map(
      ([en, es]) =>
        html`<li>
          <q class="jf-frame" lang="en">${en}</q
          >${I.spanish || I.bilingual ? html`<span class="jf-meaning" lang="es">${es}</span>` : ""}
        </li>`,
    )}
  </ul>`;

/** The "Continue Family Practice" card for the top of the family page. Returns "" when nothing can be shown. */
export async function continueSectionHTML(ctx, I) {
  const band = ctx.band;
  const state = await loadJourneyState();
  const next = await currentMissionForFamily(state, band);
  const companion = await familyCompanionFor(next.mission);
  if (!companion) return "";
  const m = MISSIONS[next.mission];
  const summary = progressSummary(state, band);
  return html`<section class="jf-continue panel" aria-labelledby="jfContinueTitle">
    <p class="eyebrow">
      ${icon("families")} ${I.T("Continue Family Practice", "Continuar la práctica en familia")}
    </p>
    <h2 id="jfContinueTitle">
      ${I.T(`Mission ${missionNumber(next.mission)} of ${TOTAL}: ${m.title[0]}`, `Misión ${missionNumber(next.mission)} de ${TOTAL}: ${m.title[1]}`)}
    </h2>
    ${learnerLine(I)}
    <p class="lead">${I.T(...companion.goal)}</p>
    ${activityBlock(I, summary, next.mission)}
    <div class="jf-cards">
      <article>
        <h3>${I.T("Talk about it", "Conversen")}</h3>
        <p>${I.T(...companion.talk[band])}</p>
      </article>
      <article>
        <h3>${I.T("Five-minute activity", "Actividad de cinco minutos")}</h3>
        <p>${I.T(...companion.fiveMinute[band])}</p>
      </article>
      <article>
        <h3>${I.T("Optional challenge", "Reto opcional")}</h3>
        <p>${I.T(...companion.challenge)}</p>
      </article>
    </div>
    <div class="fam-cta jf-actions">
      <a class="btn btn-primary btn-big" href="${familyContinueHref(next.mission, band)}"
        >${I.T("Open the family companion", "Abrir la guía familiar")}${icon("arrow-right")}</a
      >
      <a class="btn btn-big" href="${journeyStepHref(next.mission, next.step, band)}"
        >${I.T("Do the next practice together", "Hagan juntos la siguiente práctica")}</a
      >
    </div>
    <details class="jf-picker">
      <summary>${I.T("All twelve family companions", "Las doce guías familiares")}</summary>
      ${pickerHTML(I, band, next.mission)}
    </details>
    ${spanishNote(I)}
  </section>`;
}

const section = (id, title, body) =>
  html`<section class="jf-section" aria-labelledby="${id}">
    <h2 id="${id}">${title}</h2>
    ${body}
  </section>`;

/** The companion detail page for one mission: everything a grown-up reads aloud, printable on one or two pages. */
async function companionPage(ctx, I, missionId) {
  const band = ctx.band;
  const [companion, state] = await Promise.all([familyCompanionFor(missionId), loadJourneyState()]);
  const m = MISSIONS[missionId];
  const next = await currentMissionForFamily(state, band);
  const n = missionNumber(missionId);
  const title = I.S(m.title[0], m.title[1]);
  const prev = MISSION_IDS[n - 2];
  const after = MISSION_IDS[n];
  return {
    title,
    html: html`<div class="jf-companion">
      ${crumbs(I, title)} ${subnavHTML(I, "", band)}
      <header class="jf-head">
        <p class="eyebrow">
          ${icon("families")} ${I.T("Family Mission Companion", "Guía familiar de la misión")} ·
          ${I.T(`Mission ${n} of ${TOTAL}`, `Misión ${n} de ${TOTAL}`)}
        </p>
        <h1 id="jfTitle" tabindex="-1">${I.T(...m.title)}</h1>
        <p class="lead">${I.T(...companion.goal)}</p>
        <p class="jf-childgoal">
          <strong>${I.T("In your child’s words:", "En palabras de su hijo o hija:")}</strong>
          ${I.T(...m.goal[band])}
        </p>
        ${learnerLine(I)}
        <p class="jf-band no-print">${gradeSwitch(band, ctx.bands)}</p>
      </header>
      ${section("jfWhy", I.T("Why it matters", "Por qué importa"), html`<p>${I.T(...companion.why)}</p>`)}
      ${section("jfPractice", I.T("What students practice", "Lo que practican los estudiantes"), html`<p>${I.T(...companion.practicing)}</p>`)}
      ${section(
        "jfFive",
        I.T("Five-minute activity", "Actividad de cinco minutos"),
        html`<p>${I.T(...companion.fiveMinute[band])}</p>
          <p class="fine">
            ${I.T("No materials or screens needed.", "No se necesitan materiales ni pantallas.")}
          </p>`,
      )}
      ${section("jfTalk", I.T("Talk about it", "Conversen"), html`<p class="jf-question">${I.T(...companion.talk[band])}</p>`)}
      ${section("jfListen", I.T("Listen or read together", "Escuchen o lean juntos"), html`<p>${I.T(...companion.listenOrRead)}</p>`)}
      ${section("jfChallenge", I.T("Optional challenge", "Reto opcional"), html`<p>${I.T(...companion.challenge)}</p>`)}
      ${section("jfRevise", I.T("How to encourage revision", "Cómo animar a revisar"), html`<p>${I.T(...companion.revise)}</p>`)}
      ${section(
        "jfFrames",
        I.T("Useful language", "Lenguaje útil"),
        html`<p class="fine">
            ${I.T("These are the English sentence starters this mission teaches.", "Estos son los inicios de oración en inglés que enseña esta misión.")}
          </p>
          ${frameList(I, companion.frames)}`,
      )}
      ${section("jfHome", I.T("In your home language", "En su idioma del hogar"), html`<p>${I.T(...companion.homeLanguage)}</p>`)}
      <div class="fam-cta jf-actions no-print">
        <a class="btn btn-primary btn-big" href="${journeyStepHref(next.mission, next.step, band)}"
          >${I.T("Do the next practice together", "Hagan juntos la siguiente práctica")}${icon("arrow-right")}</a
        >
        <a class="btn btn-big" href="${journeyStepHref(missionId, "", band)}"
          >${I.T("Open this mission", "Abrir esta misión")}</a
        >
        <button type="button" class="btn btn-big" data-print>
          ${I.T("Print this companion", "Imprimir esta guía")}
        </button>
      </div>
      <nav class="jf-pager no-print" aria-label="${I.S("Family companions", "Guías familiares")}">
        ${prev ? html`<a href="${familyContinueHref(prev, band)}" rel="prev">${I.T("Previous: ", "Anterior: ")}${I.T(...MISSIONS[prev].title)}</a>` : ""}
        ${after ? html`<a href="${familyContinueHref(after, band)}" rel="next">${I.T("Next: ", "Siguiente: ")}${I.T(...MISSIONS[after].title)}</a>` : ""}
      </nav>
      <section
        class="jf-picker no-print"
        aria-label="${I.S("All twelve family companions", "Las doce guías familiares")}"
      >
        <h2>${I.T("All twelve family companions", "Las doce guías familiares")}</h2>
        ${pickerHTML(I, band, missionId)}
        <p class="fine">
          <a href="${BASE}/family?grades=${band}"
            >${I.T("Back to the family page", "Volver a la página de familias")}</a
          >
        </p>
      </section>
      ${spanishNote(I)}
    </div>`,
  };
}

/** Contextual Family Companion for any teacher-shared activity (?companion=<activityId>). */
async function activityCompanionPage(ctx, I, activityId) {
  const [found, esGuide] = await Promise.all([
    findActivity(activityId).catch(() => null),
    loadEsGuide().catch(() => ({})),
  ]);
  const band = found?.band || ctx.band || "6-8";
  if (!found || !found.activity) {
    return {
      title: I.S("Family Activity Companion", "Guía familiar de la actividad"),
      html: html`<div class="jf-companion">
        ${crumbs(I, I.S("Activity Companion", "Guía de la actividad"))}
        <section class="panel">
          <h1 tabindex="-1">${I.T("Choose a family activity", "Elija una actividad en familia")}</h1>
          <p>${I.T("We could not find that specific activity link, but you can start a short activity right now.", "No encontramos ese enlace específico, pero pueden empezar una actividad corta ahora mismo.")}</p>
          <a class="btn btn-primary btn-big" href="${BASE}/family/practice?grades=${band}">${I.T("Start an Activity", "Empezar una actividad")}${icon("arrow-right")}</a>
        </section>
      </div>`,
    };
  }
  const { activity: act, domain, level } = found;
  const esInfo = esGuide?.[act.id] || {};
  const minutes = Number(act.time) || 5;
  const actHref = `${BASE}/${domain}/${level}/${act.id}?grades=${band}`;
  const plainGoalEn = act.skill ? `Practice how to ${act.skill.toLowerCase()}.` : `Practice ${domain.toLowerCase()} together.`;
  const plainGoalEs = esInfo.goal || `Practicar ${domain === "Listening" ? "escuchar" : domain === "Speaking" ? "hablar" : domain === "Reading" ? "leer" : "escribir"} juntos.`;
  const dirEn = act.directions || "Read or listen to the question together, then talk about your idea.";
  const dirEs = esInfo.directions || act.directionsEs || "Lean o escuchen la pregunta juntos y conversen sobre su idea.";

  return {
    title: I.S(`Family Companion: ${act.title}`, `Guía familiar: ${act.title}`),
    html: html`<div class="jf-companion jf-act-companion">
      ${crumbs(I, act.title)} ${subnavHTML(I, "", band)}
      <header class="jf-head panel">
        <p class="eyebrow">
          ${icon("families")} ${I.T("Family Companion · Teacher-Shared Activity", "Guía familiar · Actividad compartida por el maestro")}
        </p>
        <h1 id="jfTitle" tabindex="-1"><span lang="en">${act.title}</span></h1>
        <p class="lead">
          ${I.T(
            "You do not need teaching experience to help. Sit together, listen to your child's ideas, and encourage them to explain their thinking.",
            "No necesita experiencia docente para ayudar. Siéntense juntos, escuche las ideas de su hijo o hija y anímele a explicar lo que piensa.",
          )}
        </p>
        <div class="fam-lang">
          <p class="fam-lang-label">${I.T("Choose your preferred language:", "Elija su idioma preferido:")}</p>
          ${langSwitchHTML(I.mode, { large: true, idPrefix: "comp" })}
        </div>
        <p class="fine">
          ${I.T(`Approximate time: about ${minutes} minutes · No timer`, `Tiempo aproximado: unos ${minutes} minutos · Sin cronómetro`)}
        </p>
        <div class="fam-cta">
          <a class="btn btn-primary btn-big" href="${actHref}">
            ${I.T("Begin Activity Now", "Comenzar la actividad ahora")}${icon("arrow-right")}
          </a>
          <a class="btn btn-big" href="${BASE}/family?grades=${band}">
            ${I.T("Return to Family Home", "Volver al inicio para familias")}
          </a>
        </div>
      </header>

      <div class="jf-cards">
        <article class="panel">
          <h2>${I.T("What your child will practice", "Lo que practicará su hijo o hija")}</h2>
          <p>${I.T(plainGoalEn, plainGoalEs)}</p>
        </article>
        <article class="panel">
          <h2>${I.T("Simple directions", "Instrucciones sencillas")}</h2>
          <p>${I.T(dirEn, dirEs)}</p>
          <div class="fam-prompt-audio">
            <button type="button" class="btn small" data-say="${dirEn}">
              ${icon("volume")} ${I.T("Hear directions in English", "Escuchar en inglés")}
            </button>
            <button type="button" class="btn small" data-say-es="${dirEs}">
              ${icon("volume")} ${I.T("Hear in Spanish", "Escuchar en español")}
            </button>
          </div>
        </article>
        <article class="panel">
          <h2>${I.T("Questions you can ask together", "Preguntas para conversar juntos")}</h2>
          <ul class="jf-frames">
            <li>
              <strong>${I.T("“What do you notice first?”", "«¿Qué notas primero?»")}</strong>
            </li>
            <li>
              <strong>${I.T("“Can you tell me more about your idea?”", "«¿Puedes contarme más sobre tu idea?»")}</strong>
            </li>
            <li>
              <strong>${I.T("“Which word or detail helped you decide?”", "«¿Qué palabra o detalle te ayudó a decidir?»")}</strong>
            </li>
          </ul>
          <p class="fine">
            ${I.T(
              "Tip: You can talk together in your home language first, then help your child try the sentence in English.",
              "Consejo: Pueden conversar primero en el idioma de casa y luego intentar la oración en inglés.",
            )}
          </p>
        </article>
      </div>
      ${spanishNote(I)}
    </div>`,
  };
}

export const companionPageFor = (ctx, I) => {
  const q = new URLSearchParams(location.search);
  const actId = (q.get("companion") || "").trim();
  if (actId && /^[a-z0-9-]+$/i.test(actId)) return activityCompanionPage(ctx, I, actId);
  const id = missionFromSearch(location.search);
  return id ? companionPage(ctx, I, id) : null;
};
