// Six entrances into the existing connected journey. Each route uses the same
// mission runner, saved state, evidence ledger, feedback, revision and transfer.
// The setting descriptions name the actual authored tasks in each mission pack.
import { BASE, html, icon } from "../util.js";
import { MISSIONS, STEPS } from "./curriculum.js";
import { environmentArt } from "./ui/environments.js";
import { stepHref, tx } from "./ui/pages-shared.js";
import { getStep, loadJourney, missionStatus } from "./state.js";

export const CONNECTED_WORLDS = Object.freeze([
  { slug: "school", name: ["The School", "La escuela"], mission: "m01", setting: ["Investigate a classroom morning, talk with classmates, and tell what happened.", "Investiga una mañana en el salón, conversa con compañeros y cuenta lo que pasó."] },
  { slug: "neighborhood", name: ["The Neighborhood", "El vecindario"], mission: "m03", setting: ["Compare accounts of a neighborhood parade and retell it from another perspective.", "Compara relatos de un desfile del barrio y cuéntalo desde otra perspectiva."] },
  { slug: "museum-mystery", name: ["The Museum Mystery", "El misterio del museo"], mission: "m09", setting: ["Inspect the faded flag, question the curator, and revise an explanation as new clues appear.", "Investiga la bandera descolorida, pregunta a la curadora y revisa una explicación al descubrir pistas nuevas."] },
  { slug: "science-lab", name: ["The Science Lab", "El laboratorio de ciencias"], mission: "m07", setting: ["Investigate rain in a jar, follow a procedure, and explain the water cycle.", "Investiga la lluvia en un frasco, sigue un procedimiento y explica el ciclo del agua."] },
  { slug: "marketplace", name: ["The Marketplace", "El mercado"], mission: "m05", setting: ["Compare places on a city map, classify facts, and recommend a choice with evidence.", "Compara lugares en un mapa urbano, clasifica datos y recomienda una opción con evidencia."] },
  { slug: "newsroom", name: ["The Newsroom", "La sala de noticias"], mission: "m06", setting: ["Research monarch butterflies with a student reporter and combine facts from two sources.", "Investiga las mariposas monarca con un reportero estudiantil y combina datos de dos fuentes."] },
]);

export const connectedWorld = (slug) => CONNECTED_WORLDS.find((w) => w.slug === slug);
const worldHref = (slug, band) => `${BASE}/worlds/connected/${slug}?grades=${band}`;

function nextStep(state, band, mission) {
  return STEPS.find((step) => getStep(state, band, mission, step.id).status !== "done")?.id || "show";
}

export function connectedWorldsHTML(I, band, state = loadJourney()) {
  if (!["3-5", "6-8"].includes(band)) return "";
  return html`<section class="cw-section" aria-labelledby="cw-title">
    <div class="cw-heading"><p class="eyebrow">${I.T("Connected learning", "Aprendizaje conectado")}</p>
      <h2 id="cw-title">${I.T("Enter a language world", "Entra en un mundo de lenguaje")}</h2>
      <p>${I.T("Explore a scene, listen and read, build language, converse or write, revise, then try a new challenge. Your next step and evidence stay together on this device.", "Explora una escena, escucha y lee, construye lenguaje, conversa o escribe, revisa y luego prueba un reto nuevo. Tu siguiente paso y la evidencia permanecen juntos en este dispositivo.")}</p></div>
    <div class="cw-grid">${CONNECTED_WORLDS.map((w) => {
      const mission = MISSIONS[w.mission];
      const done = STEPS.filter((s) => getStep(state, band, w.mission, s.id).status === "done").length;
      return html`<a class="cw-card" href="${worldHref(w.slug, band)}">
        <span class="cw-art">${environmentArt(mission.environment, "neutral", band)}</span>
        <span class="cw-copy"><strong>${tx(I, w.name)}</strong><span>${tx(I, w.setting)}</span>
          <small>${I.T(`${done} of 6 connected steps complete`, `${done} de 6 pasos conectados completados`)}</small></span>
        <span class="cw-enter">${done ? I.T("Continue world", "Continuar mundo") : I.T("Explore world", "Explorar mundo")} ${icon("arrow-right")}</span>
      </a>`;
    })}</div>
  </section>`;
}

export function connectedWorldHTML(I, band, slug, state = loadJourney()) {
  const world = connectedWorld(slug);
  if (!world || !["3-5", "6-8"].includes(band)) return null;
  const mission = MISSIONS[world.mission];
  const next = nextStep(state, band, world.mission);
  const status = missionStatus(state, band, world.mission);
  return { title: `${world.name[0]} · The Language Page`, html: html`<article class="cw-detail">
    <a class="cw-back" href="${BASE}/worlds?grades=${band}">${icon("arrow-left")} ${I.T("All language worlds", "Todos los mundos de lenguaje")}</a>
    <div class="cw-detail-grid"><div class="cw-detail-copy"><p class="eyebrow">${I.T("A connected language mission", "Una misión de lenguaje conectada")}</p>
      <h1 tabindex="-1">${tx(I, world.name)}</h1><p class="lead">${tx(I, world.setting)}</p>
      <p>${tx(I, mission.goal[band])}</p>
      <p class="fine">${I.T("Progress:", "Progreso:")} ${STEPS.filter((s) => getStep(state, band, world.mission, s.id).status === "done").length} / 6 · ${status === "independently-demonstrated" ? I.T("Independent transfer demonstrated", "Transferencia independiente demostrada") : status === "completed-with-support" ? I.T("Completed with support", "Completada con apoyo") : I.T("Ready to continue", "Lista para continuar")}</p>
      <a class="btn btn-primary btn-big" href="${stepHref(band, world.mission, next)}">${I.T(next === "discover" ? "Start exploring" : "Continue the mission", next === "discover" ? "Comenzar a explorar" : "Continuar la misión")} ${icon("arrow-right")}</a>
    </div><div class="cw-detail-art">${environmentArt(mission.environment, "neutral", band)}</div></div>
    <h2>${I.T("Your journey through this world", "Tu viaje por este mundo")}</h2>
    <ol class="cw-steps">${STEPS.map((step) => {
      const record = getStep(state, band, world.mission, step.id);
      return html`<li><a href="${stepHref(band, world.mission, step.id)}"><span class="cw-step-num">${step.n}</span><span><strong>${tx(I, step.label)}</strong><small>${tx(I, step.purpose)}</small></span><span class="cw-step-status">${record.status === "done" ? I.T("Done", "Hecho") : step.id === next ? I.T("Next", "Sigue") : ""}</span></a></li>`;
    })}</ol>
    <p class="disclaimer">${I.T("Practice evidence stays on this device unless you choose to share it. It is not an official WIDA score.", "La evidencia de práctica permanece en este dispositivo a menos que decidas compartirla. No es un puntaje oficial de WIDA.")}</p>
  </article>` };
}
