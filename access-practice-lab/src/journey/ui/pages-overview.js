// /journey/<mNN>: one mission at a glance: goal, the six steps, what it practices, the four domains,
// the earlier missions it builds on, family and teacher links, and the Before & After evidence.
import { BASE, html, icon } from "../../util.js";
import {
  FEATURES,
  MISSIONS,
  MISSION_IDS,
  STEPS,
  UNITS,
  missionIdFromParam,
  missionNumber,
  unitOf,
} from "../curriculum.js";
import { missionProgress, missionStatus, stepStatus } from "../state.js";
import { relatedOverviewHTML } from "./related.js";
import {
  KLU_NAME,
  MISSION_STATUS,
  STEP_STATE,
  domainChip,
  envChip,
  envGlyph,
  hasGrowthRecord,
  hereChip,
  jhref,
  resolveDeps,
  stepHref,
  totalMinutes,
  tx,
  unitClass,
  unitLabel,
} from "./pages-shared.js";

/** Which steps use which skill. Communicate and Show are a conversation or a piece of writing, by task. */
const DOMAIN_STEPS = {
  Listening: [[2], ["Active Listening in Understand", "Escucha activa en Comprende"]],
  Reading: [
    [1, 2],
    ["Discover and the Reading X-Ray", "Descubre y la Radiografía de lectura"],
  ],
  Speaking: [
    [4, 6],
    [
      "Communicate and Show, when the task is a conversation",
      "Comunica y Muestra, cuando la tarea es una conversación",
    ],
  ],
  Writing: [
    [3, 4, 6],
    [
      "Build, plus Communicate and Show when the task is writing",
      "Construye, y también Comunica y Muestra cuando la tarea es escribir",
    ],
  ],
};
const STEP_GLYPH = { started: "play", "done-supported": "check", "done-independent": "star" };
const STATUS_GLYPH = {
  "in-progress": "play",
  "completed-with-support": "check",
  "independently-demonstrated": "star",
};

/** The step to offer from this page: the recommendation when it is in this mission, else the first open step. */
function entryStep(state, band, id, rec) {
  if (rec.mission === id) return rec.step;
  const open = STEPS.find((s) => !stepStatus(state, band, id, s.id).startsWith("done"));
  return (open || STEPS.at(-1)).id;
}

async function growthHTML(I, band, id, ledger, state) {
  const fallback = html`<p class="fine">
    ${I.T("Your Before & After appears here once you have written or said a response and improved it in Step 5.", "Tu Antes y después aparece aquí cuando hayas escrito o dicho una respuesta y la hayas mejorado en el paso 5.")}
  </p>`;
  if (!hasGrowthRecord(ledger, band, id)) return fallback;
  try {
    const mod = await import("./growth.js");
    const out = await mod.growthSectionHTML?.({
      I,
      band,
      mission: id,
      missionId: id,
      ledger,
      state,
    });
    return out || fallback;
  } catch {
    return fallback;
  }
}

function stepCard(I, band, state, id, s, here) {
  const st = stepStatus(state, band, id, s.id);
  const info = STEP_STATE[st];
  return html`<li class="jr-step ${here ? "is-here" : ""} is-${st}">
    <a
      class="jr-step-card"
      href="${stepHref(band, id, s.id)}"
      ${here ? html`aria-current="step"` : ""}
    >
      <span class="jr-step-n" aria-hidden="true">${s.n}</span>
      <span class="jr-step-body">
        <strong>${icon(s.icon)}${tx(I, s.label)}</strong>
        <span>${tx(I, s.purpose)}</span>
        <span class="fine">${I.T(`about ${s.minutes} minutes`, `unos ${s.minutes} minutos`)}</span>
      </span>
      <span class="jr-step-state is-${st}"
        >${STEP_GLYPH[st] ? icon(STEP_GLYPH[st]) : ""}${tx(I, info.text)}</span
      >
      ${here ? hereChip(I) : ""}
    </a>
  </li>`;
}

export async function overviewHTML(ctx, missionId, deps = {}) {
  const d = resolveDeps(ctx, deps);
  const { I, band, state, ledger, recommendation: rec } = d;
  const id = missionIdFromParam(missionId);
  if (!id)
    return html`<div class="jr-page" data-band="${band}">
      <section class="panel empty-state">
        <h1 id="overviewTitle" tabindex="-1">
          ${I.T("We could not find that mission", "No encontramos esa misión")}
        </h1>
        <p>
          <a class="btn btn-primary" href="${jhref(band, "/map")}"
            >${I.T("Open the journey map", "Abrir el mapa del viaje")}</a
          >
        </p>
      </section>
    </div>`;
  const m = MISSIONS[id];
  const n = missionNumber(id);
  const u = unitOf(id);
  const status = missionStatus(state, band, id);
  const prog = missionProgress(state, band, id);
  const go = entryStep(state, band, id, rec);
  const goInfo = STEPS.find((s) => s.id === go);
  const verb =
    status === "not-started"
      ? ["Start", "Empezar"]
      : prog.done === STEPS.length
        ? ["Revisit", "Repasar"]
        : ["Continue", "Continuar"];
  const growth = await growthHTML(I, band, id, ledger, state);
  const unitDone = u.missions.every((m) => /^(completed|independently)/.test(missionStatus(state, band, m)));
  const related = await relatedOverviewHTML({ I, band, missionId: id, stepId: go, unitDone });
  const shared = (r) => m.features.filter((f) => MISSIONS[r].features.includes(f));
  return html`<div
    class="jr-page jr-overview ${unitClass(id)}"
    data-band="${band}"
    data-mission="${id}"
  >
    <nav class="crumbs" aria-label="${I.S("Breadcrumb", "Ruta de navegación")}">
      <ol>
        <li><a href="${jhref(band)}">${I.T("My Journey", "Mi viaje")}</a></li>
        <li><a href="${jhref(band, "/map")}">${I.T("Journey map", "Mapa del viaje")}</a></li>
        <li aria-current="page">${I.T(`Mission ${n}`, `Misión ${n}`)}</li>
      </ol>
    </nav>
    <header class="jr-ov-hero">
      <span class="jr-ov-art" aria-hidden="true">${envGlyph(m.environment)}</span>
      <div class="jr-ov-copy">
        <p class="eyebrow">
          ${unitLabel(I, u)} · <span class="jr-klu">${tx(I, KLU_NAME[m.klu])}</span>
        </p>
        <h1 id="overviewTitle" tabindex="-1">
          <span class="jr-ov-n">${I.T(`Mission ${n}`, `Misión ${n}`)}</span> ${tx(I, m.title)}
        </h1>
        <p class="lead">${tx(I, m.tagline)}</p>
        <p class="jr-goal">
          <strong>${I.T("Language goal", "Meta de lenguaje")}</strong> ${tx(I, m.goal[band])}
        </p>
        <p class="jr-ov-meta">
          ${envChip(I, m.environment)}<span class="jr-status is-${status}"
            >${STATUS_GLYPH[status] ? icon(STATUS_GLYPH[status]) : ""}<strong
              >${tx(I, MISSION_STATUS[status])}</strong
            >
            · ${I.T(`${prog.done} of 6 steps`, `${prog.done} de 6 pasos`)}</span
          ><span class="fine"
            >${I.T(`about ${totalMinutes()} minutes in all, any time you like`, `unos ${totalMinutes()} minutos en total, cuando quieras`)}</span
          >
        </p>
        <p class="jr-cta">
          <a class="btn btn-primary btn-big" data-journey-go href="${stepHref(band, id, go)}"
            >${I.T(`${verb[0]} · Step ${goInfo.n}: ${goInfo.label[0]}`, `${verb[1]} · Paso ${goInfo.n}: ${goInfo.label[1]}`)}${icon("arrow-right")}</a
          >
        </p>
      </div>
    </header>
    <section class="jr-section" aria-labelledby="ovStepsTitle">
      <h2 id="ovStepsTitle">${I.T("Six steps", "Seis pasos")}</h2>
      <ol class="jr-steps">
        ${STEPS.map((s) => stepCard(I, band, state, id, s, rec.mission === id && rec.step === s.id))}
      </ol>
    </section>
    <div class="jr-ov-grid">
      <section class="jr-section jr-panel" aria-labelledby="ovPracticeTitle">
        <h2 id="ovPracticeTitle">${I.T("What you will practice", "Qué vas a practicar")}</h2>
        <ul class="jr-chips">
          ${m.features.map((f) => html`<li class="jr-chip">${tx(I, FEATURES[f].label)}</li>`)}
        </ul>
      </section>
      <section class="jr-section jr-panel" aria-labelledby="ovDomainsTitle">
        <h2 id="ovDomainsTitle">
          ${I.T("All four language skills", "Las cuatro destrezas del lenguaje")}
        </h2>
        <ul class="jr-domains">
          ${Object.entries(DOMAIN_STEPS).map(([dom, [, text]]) => html`<li>${domainChip(I, dom)}<span class="fine">${tx(I, text)}</span></li>`)}
        </ul>
      </section>
      ${
        m.reviews.length
          ? html`<section class="jr-section jr-panel" aria-labelledby="ovReviewTitle">
              <h2 id="ovReviewTitle">
                ${I.T("Builds on earlier missions", "Se apoya en misiones anteriores")}
              </h2>
              <ul class="jr-reviews">
                ${m.reviews.map(
                  (r) =>
                    html`<li>
                      <a href="${jhref(band, `/${r}`)}"
                        ><strong
                          >${I.T(`Mission ${missionNumber(r)}: ${MISSIONS[r].title[0]}`, `Misión ${missionNumber(r)}: ${MISSIONS[r].title[1]}`)}</strong
                        ><span class="fine"
                          >${shared(r)
                            .map((f) => tx(I, FEATURES[f].label))
                            .flatMap((x, i) => (i ? [", ", x] : [x]))}</span
                        ></a
                      >
                    </li>`,
                )}
              </ul>
            </section>`
          : ""
      }
      <section class="jr-section jr-panel" aria-labelledby="ovPeopleTitle">
        <h2 id="ovPeopleTitle">${I.T("At home and in class", "En casa y en clase")}</h2>
        <ul class="jr-reviews">
          <li>
            <a href="${BASE}/family?mission=${id}&amp;grades=${band}"
              >${icon("families")}<strong>${I.T("Family companion", "Compañero familiar")}</strong
              ><span class="fine"
                >${I.T("A short conversation to have at home, in any language you share.", "Una conversación breve para tener en casa, en cualquier idioma que compartan.")}</span
              ></a
            >
          </li>
          <li>
            <a href="${jhref(band, "/guide")}#${id}"
              >${icon("teacher")}<strong>${I.T("Teacher guide", "Guía docente")}</strong
              ><span class="fine"
                >${I.T("Goals, evidence and direct links for this mission.", "Metas, evidencia y enlaces directos de esta misión.")}</span
              ></a
            >
          </li>
        </ul>
      </section>
    </div>
    <section class="jr-section jr-panel jr-related-section" aria-label="${I.S("Related practice", "Práctica relacionada")}">
      ${related}
    </section>
    <section
      class="jr-section jr-panel jr-evidence"
      id="before-after"
      aria-labelledby="ovGrowthTitle"
    >
      <h2 id="ovGrowthTitle">${I.T("Before & After", "Antes y después")}</h2>
      ${growth}
    </section>
    <p class="jr-foot fine">
      <a href="${jhref(band, "/map")}"
        >${icon("arrow-left")}${I.T("Back to the journey map", "Volver al mapa del viaje")}</a
      >
      ·
      ${I.T(`Mission ${n} of ${MISSION_IDS.length} · ${UNITS.length} units`, `Misión ${n} de ${MISSION_IDS.length} · ${UNITS.length} unidades`)}
    </p>
  </div>`;
}
