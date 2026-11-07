// Continue My Journey: the hero that opens the lab home and the /journey page, and the /journey page itself.
// Reads the recommendation from recommend.js (never recomputes it) and shows the reason in the student's language.
import { BASE, bandLabel, html, icon } from "../../util.js";
import { MISSIONS, MISSION_IDS, STEPS, UNITS, missionNumber, stepInfo, unitOf } from "../curriculum.js";
import { missionProgress, missionStatus } from "../state.js";
import {
  MISSION_STATUS,
  KLU_NAME,
  envChip,
  jhref,
  missionDone,
  pipRow,
  resolveDeps,
  stepHref,
  tx,
  unitClass,
  unitLabel,
} from "./pages-shared.js";

const INTRO = {
  "3-5": [
    "Twelve missions take you from telling stories to explaining and arguing. In each one you look, listen, read, build, say it or write it, and make it better. You choose your help.",
    "Doce misiones te llevan de contar historias a explicar y argumentar. En cada una observas, escuchas, lees, construyes, lo dices o lo escribes, y lo mejoras. Tú eliges tu ayuda.",
  ],
  "6-8": [
    "Twelve missions in four units: narrate, inform, explain and argue. Each one goes from a real situation to a task you do on your own. You choose the support; nothing here is a score.",
    "Doce misiones en cuatro unidades: narrar, informar, explicar y argumentar. Cada una va de una situación real a una tarea que haces por tu cuenta. Tú eliges el apoyo; nada aquí es un puntaje.",
  ],
};
const ACTION = {
  continue: ["Continue", "Continuar"],
  "next-mission": ["Start", "Empezar"],
  "unit-complete": ["Start", "Empezar"],
  assigned: ["Go to", "Ir a"],
  support: ["Practice", "Practicar"],
  review: ["Revisit", "Repasar"],
  "journey-complete": ["Try again", "Intentar otra vez"],
};

export function headline(I, rec) {
  const n = missionNumber(rec.mission);
  const t = MISSIONS[rec.mission].title;
  if (rec.kind === "start")
    return I.T("Start My Learning Journey", "Empieza mi viaje de aprendizaje");
  if (rec.kind === "journey-complete")
    return I.T("You finished the whole journey", "Terminaste todo el viaje");
  if (rec.kind === "review")
    return I.T(`Revisit Mission ${n}: ${t[0]}`, `Repasa la misión ${n}: ${t[1]}`);
  if (rec.kind === "assigned" || rec.kind === "support")
    return I.T(`Mission ${n}: ${t[0]}`, `Misión ${n}: ${t[1]}`);
  return I.T(`Continue Mission ${n}: ${t[0]}`, `Continúa la misión ${n}: ${t[1]}`);
}

export function ctaLabel(I, rec) {
  const step = stepInfo(rec.step);
  if (rec.kind === "start")
    return I.T(
      `Start Mission ${missionNumber(rec.mission)}`,
      `Empezar la misión ${missionNumber(rec.mission)}`,
    );
  const [en, es] = ACTION[rec.kind] || ACTION.continue;
  return I.T(
    `${en} · Step ${step.n}: ${step.label[0]}`,
    `${es} · Paso ${step.n}: ${step.label[1]}`,
  );
}

/** Twelve segments, one per mission, in unit colours: a glance at the whole journey. */
function trailBar(I, state, band, current) {
  const done = MISSION_IDS.filter((id) => missionDone(state, band, id)).length;
  const label = I.S(
    `${done} of ${MISSION_IDS.length} missions finished`,
    `${done} de ${MISSION_IDS.length} misiones terminadas`,
  );
  return html`<div class="jr-trailbar">
    <div class="jr-segs" role="img" aria-label="${label}">
      ${MISSION_IDS.map((id) => html`<i class="jr-seg ${unitClass(id)} ${missionDone(state, band, id) ? "is-done" : missionStatus(state, band, id) === "in-progress" ? "is-doing" : ""} ${id === current ? "is-now" : ""}"></i>`)}
    </div>
    <p class="fine">
      ${I.T(`${done} of ${MISSION_IDS.length} missions finished`, `${done} de ${MISSION_IDS.length} misiones terminadas`)}
    </p>
  </div>`;
}

/**
 * The journey hero. `rec` is a recommendNext() result. Options: `headingId` (the page h1 id), `bandSwitch`
 * (markup for the grade switch, shown under the eyebrow) and `eyebrow`.
 */
export function journeyHeroHTML(I, band, state, rec, opts = {}) {
  const { headingId = "journeyTitle", bandSwitch = "", eyebrow = null } = opts;
  const id = rec.mission;
  const m = MISSIONS[id];
  const u = unitOf(id);
  const step = stepInfo(rec.step);
  const start = rec.kind === "start";
  const status = missionStatus(state, band, id);
  const prog = missionProgress(state, band, id);
  return html`<section
    class="jr-hero ll-hero ${unitClass(id)}"
    data-band="${band}"
    data-kind="${rec.kind}"
    aria-labelledby="${headingId}"
  >
    <div class="ll-hero-copy jr-hero-copy">
      <p class="eyebrow">
        ${eyebrow ?? I.T(`ACCESS Practice Lab · ${bandLabel(band)}`, `Laboratorio de práctica ACCESS · Grados ${band.replace("-", "–")}`)}
      </p>
      ${bandSwitch}
      <h1 id="${headingId}" tabindex="-1">${headline(I, rec)}</h1>
      <p class="lead">${start ? tx(I, INTRO[band] || INTRO["6-8"]) : tx(I, m.tagline)}</p>
      <div class="jr-cta">
        <a class="btn btn-primary btn-big" data-journey-go href="${stepHref(band, id, rec.step)}"
          >${ctaLabel(I, rec)}${icon("arrow-right")}</a
        >
        <span class="jr-time"
          >${I.T(`about ${step.minutes} minutes · no timer`, `unos ${step.minutes} minutos · sin cronómetro`)}</span
        >
      </div>
      <p class="jr-why">
        <strong>${I.T("Why this step:", "Por qué este paso:")}</strong> ${tx(I, rec.reason)}
      </p>
      <p class="jr-links">
        <a href="${jhref(band, "/map")}"
          >${icon("road")}${I.T("My Journey Map", "Mi mapa del viaje")}</a
        ><a data-explore-all href="${BASE}/library?grades=${band}"
          >${icon("library")}${I.T("Explore all activities", "Explora todas las actividades")}</a
        >
      </p>
    </div>
    <div
      class="jr-hero-card"
      role="group"
      aria-label="${I.S("Where you are in your journey", "Dónde estás en tu viaje")}"
    >
      <dl class="jr-facts">
        <div>
          <dt>${I.T("Unit", "Unidad")}</dt>
          <dd>${unitLabel(I, u)} <span class="jr-klu">${tx(I, KLU_NAME[m.klu])}</span></dd>
        </div>
        <div>
          <dt>${I.T("Mission", "Misión")}</dt>
          <dd>
            ${I.T(`${missionNumber(id)} of ${MISSION_IDS.length}`, `${missionNumber(id)} de ${MISSION_IDS.length}`)}
            ${envChip(I, m.environment)}
          </dd>
        </div>
        <div>
          <dt>${I.T("Step", "Paso")}</dt>
          <dd>
            ${I.T(`${step.n} of ${STEPS.length} · ${step.label[0]}`, `${step.n} de ${STEPS.length} · ${step.label[1]}`)}
          </dd>
        </div>
        <div class="is-goal">
          <dt>${I.T("Language goal", "Meta de lenguaje")}</dt>
          <dd>${tx(I, m.goal[band])}</dd>
        </div>
      </dl>
      <div class="jr-hero-prog">
        ${pipRow(I, state, band, id, { link: false, here: rec.step })}
        <p class="jr-status is-${status}">
          <strong>${tx(I, MISSION_STATUS[status])}</strong> ·
          ${I.T(`${prog.done} of ${STEPS.length} steps done`, `${prog.done} de ${STEPS.length} pasos hechos`)}
        </p>
      </div>
      ${trailBar(I, state, band, id)}
    </div>
  </section>`;
}

const STATUS_GLYPH = {
  "in-progress": "play",
  "completed-with-support": "check",
  "independently-demonstrated": "star",
};

function unitCard(I, band, state, u) {
  const done = u.missions.filter((id) => missionDone(state, band, id)).length;
  return html`<li class="jr-unit-card jr-u${u.n}" id="glance-u${u.n}">
    <a class="jr-unit-top" href="${jhref(band, "/map")}#u${u.n}"
      ><span class="jr-unit-n" aria-hidden="true">${u.n}</span
      ><span
        ><strong>${unitLabel(I, u)}</strong
        ><span class="fine"
          >${tx(I, KLU_NAME[u.klu])} ·
          ${I.T(`${done} of ${u.missions.length} missions`, `${done} de ${u.missions.length} misiones`)}</span
        ></span
      ></a
    >
    <ol class="jr-mini">
      ${u.missions.map((id) => {
        const st = missionStatus(state, band, id);
        return html`<li>
          <a href="${jhref(band, `/${id}`)}"
            ><span class="jr-mini-n" aria-hidden="true">${missionNumber(id)}</span
            ><span class="jr-mini-t">${tx(I, MISSIONS[id].title)}</span
            ><span class="jr-mini-s is-${st}"
              >${STATUS_GLYPH[st] ? icon(STATUS_GLYPH[st]) : ""}${tx(I, MISSION_STATUS[st])}</span
            ></a
          >
        </li>`;
      })}
    </ol>
  </li>`;
}

function doorsHTML(I, band) {
  const door = (href, ic, title, text) =>
    html`<a class="jr-door" href="${href}"
      >${icon(ic)}<span><strong>${title}</strong><span class="fine">${text}</span></span
      >${icon("arrow-right", "jr-door-go")}</a
    >`;
  return html`<nav class="jr-doors" aria-labelledby="jrDoorsTitle">
    <h2 id="jrDoorsTitle" class="visually-hidden">${I.T("Where to go", "Adónde ir")}</h2>
    ${door(jhref(band, "/map"), "road", I.T("My Journey Map", "Mi mapa del viaje"), I.T("All 12 missions and 6 steps.", "Las 12 misiones y los 6 pasos."))}
    ${door(`${BASE}/library?grades=${band}`, "library", I.T("Practice a Skill", "Practicar una destreza"), I.T("Pick listening, reading, speaking or writing.", "Elige escuchar, leer, hablar o escribir."))}
    ${door(`${BASE}/passport?grades=${band}`, "passport", I.T("My Passport", "Mi Pasaporte"), I.T("Your saved work and growth.", "Tu trabajo guardado y tu progreso."))}
    ${door(`${BASE}/family?grades=${band}`, "families", I.T("Family Practice", "Práctica en familia"), I.T("Do a mission together at home.", "Hagan una misión juntos en casa."))}
    ${door(`${BASE}/learn?grades=${band}`, "bulb", I.T("Explore", "Explorar"), I.T("Studios, worlds and games.", "Estudios, mundos y juegos."))}
  </nav>`;
}

/** /journey: Continue My Journey. Hero, the four units at a glance, other good next steps, review, navigation. */
export function homeHTML(ctx, deps = {}) {
  const { I, band, state, recommendation: rec, reviews } = resolveDeps(ctx, deps);
  const alts = rec.alternatives || [];
  return html`<div class="jr-page jr-home" data-band="${band}">
    ${journeyHeroHTML(I, band, state, rec)}
    <section class="jr-section" aria-labelledby="jrGlanceTitle">
      <h2 id="jrGlanceTitle">${I.T("Your journey at a glance", "Tu viaje de un vistazo")}</h2>
      <ol class="jr-units-glance">
        ${UNITS.map((u) => unitCard(I, band, state, u))}
      </ol>
    </section>
    ${
      alts.length || reviews.length
        ? html`<section class="jr-section jr-next-more" aria-labelledby="jrMoreTitle">
            <h2 id="jrMoreTitle">
              ${I.T("Other good ways to keep going", "Otras buenas formas de seguir")}
            </h2>
            <ul class="jr-alts">
              ${[
                ...alts
                  .slice(0, 2)
                  .map((a) => ({
                    href: stepHref(band, a.mission, a.step),
                    label: a.label,
                    reason: a.reason,
                  })),
                ...reviews
                  .slice(0, 1)
                  .map((r) => ({
                    href: stepHref(band, r.mission, r.step),
                    label: [
                      `Keep it strong: ${MISSIONS[r.mission].title[0]}`,
                      `Mantenlo fuerte: ${MISSIONS[r.mission].title[1]}`,
                    ],
                    reason: r.reason,
                  })),
              ].map(
                (a) =>
                  html`<li>
                    <a href="${a.href}"
                      ><strong>${tx(I, a.label)}</strong
                      ><span class="fine">${tx(I, a.reason)}</span></a
                    >
                  </li>`,
              )}
            </ul>
          </section>`
        : ""
    }
    ${doorsHTML(I, band)}
    <p class="jr-foot fine">
      ${I.T("Your journey is saved on this device. It shows what you did and which help you used. It is not a score or a level.", "Tu viaje se guarda en este dispositivo. Muestra lo que hiciste y qué ayuda usaste. No es un puntaje ni un nivel.")}
      <a href="${jhref(band, "/guide")}"
        >${I.T("Journey teacher guide", "Guía docente del viaje")}</a
      >
    </p>
  </div>`;
}
