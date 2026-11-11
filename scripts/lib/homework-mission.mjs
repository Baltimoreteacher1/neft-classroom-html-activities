/**
 * Family Math Mission: the one path through a family homework page.
 *
 * Five steps, in this order, on every lesson and session: Look & Learn -> Try Together -> Your Turn ->
 * Check & Improve -> Finish. Everything else the page offers (the grown-up talk guide, a new
 * challenge, key words, games, the photobooth, the full set of practice problems) is optional and
 * lives behind "Explore more", never in the path.
 *
 * Step ids double as panel ids (`hw_panel_<id>`). They keep the historical ids of the six-stage
 * mission (`connect`, `explore`, `check`, `done`) so saved progress, deep links and the Check/Done
 * machinery keep working; the family sees the step LABELS below. `improve` is the one new panel. Route ids stay `quick` and `full` for the same reason (`?route=quick` links and
 * QR codes already in the wild); their labels are "Today's mission" and "Extended practice".
 */

import { icon } from "./family-icons.mjs";
import { act } from "./homework-actions.mjs";
import { stepHead } from "./homework-flow.mjs";
import { missionModelFor } from "./homework-mission-models.mjs";
import { LESSON_PAGE_IDS } from "./homework-sequence.mjs";

/** Practice items in today's mission. The goal, the "N problems" copy and the route limit all read this. */
export const MISSION_PRACTICE_COUNT = 10;

/**
 * The mission's three levels over its practice problems, in order. `size` is how many problems the level
 * holds; the last level takes whatever is left of MISSION_PRACTICE_COUNT. One table: the level strip, the
 * level-up celebration and the Finish badges all read it (client copy in homework-levels-js.mjs).
 */
export const MISSION_LEVELS = [
  { id: "warmup", size: 3, en: "Warm-up", es: "Calentamiento", icon: "🔥" },
  { id: "build", size: 4, en: "Build", es: "Construir", icon: "🧱" },
  { id: "apply", size: 3, en: "Apply", es: "Aplicar", icon: "🚀" },
];

/** Route times, one source for the start card, the Explore more sheet and the hub. */
export const ROUTE_TIMES = { quick: "15–20", full: "25–35" };

/** The route a first visit lands on. Keep in step with HOMEWORK_ROUTE_DEFAULT in homework-guided-notes.mjs. */
export const DEFAULT_ROUTE = "quick";

export const MISSION_STAGES = [
  { id: "connect", icon: "", en: "Look & Learn", es: "Mira y aprende" },
  { id: "explore", icon: "", en: "Try Together", es: "Prueben juntos" },
  { id: "check", icon: "", en: "Your Turn", es: "Tu turno" },
  { id: "improve", icon: "", en: "Check & Improve", es: "Revisa y mejora" },
  { id: "done", icon: "", en: "Finish", es: "Terminar" },
];

/** Optional destinations: panels that exist but are not steps. */
export const OPTIONAL_STOPS = [
  {
    id: "talk",
    icon: "💬",
    en: "Family talk guide",
    es: "Guía para conversar",
    blurbEn: "Short prompts for a grown-up: what to ask, what to look for",
    blurbEs: "Preguntas cortas para el adulto: qué preguntar y qué observar",
  },
  {
    id: "apply",
    icon: "🌎",
    en: "A new challenge",
    es: "Un nuevo reto",
    blurbEn: "A fresh situation and a mystery to crack, if you want more",
    blurbEs: "Una situación nueva y un misterio por resolver, si quieren más",
  },
  {
    id: "words",
    icon: "📚",
    en: "Key words",
    es: "Palabras clave",
    blurbEn: "Cards and a short quiz for tonight's vocabulary",
    blurbEs: "Tarjetas y un repaso corto del vocabulario de hoy",
  },
  {
    id: "play",
    icon: "🎮",
    en: "Math games",
    es: "Juegos de matemáticas",
    blurbEn: "Games that practice tonight's idea. No timers.",
    blurbEs: "Juegos que practican la idea de hoy. Sin cronómetro.",
  },
  {
    id: "photobooth",
    icon: "📸",
    en: "Photobooth",
    es: "Fotos",
    blurbEn: "Optional: take a picture of tonight's math work",
    blurbEs: "Opcional: toma una foto del trabajo de matemáticas de hoy",
  },
];

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span>`;

/**
 * The hero's one action: what tonight is, how long it takes, one primary button and one quiet
 * secondary. The time chooser and the second route card this replaces made a family decide before
 * they had seen any mathematics.
 */
export function renderMissionStart() {
  return `
      <section class="hw-mission-start fm-hero__action" aria-labelledby="hw_mission_title">
        <h2 id="hw_mission_title" class="fm-hero__q">${bi("Today's Family Practice", "La práctica familiar de hoy")}</h2>
        <p class="hw-mission-lead fm-hero__promise">${bi(
          `Five short steps, about ${ROUTE_TIMES.quick} minutes: watch the idea, try one together, solve ${MISSION_PRACTICE_COUNT} in three levels, check, celebrate.`,
          `Cinco pasos cortos, unos ${ROUTE_TIMES.quick} minutos: miren la idea, prueben uno juntos, resuelvan ${MISSION_PRACTICE_COUNT} en tres niveles, revisen y celebren.`,
        )}</p>
        <button type="button" id="hw_start_button" class="fm-btn fm-btn--primary fm-btn--lg fm-btn--block" ${act("startHomework")}><span class="lang-en">Start</span><span class="lang-es" lang="es">Empezar</span></button>
        <button type="button" id="hw_explore_more_button" class="fm-btn fm-btn--block hw-explore-more-btn" data-open-sheet="hw_explore_sheet" aria-haspopup="dialog"><span class="lang-en">Explore more</span><span class="lang-es" lang="es">Explorar más</span></button>
        <p class="hw-route-promise fm-hero__promise"><span class="lang-en">Optional. No grades, no account. Your place is saved on this device.</span><span class="lang-es" lang="es">Opcional. Sin calificaciones ni cuenta. Su avance se guarda en este dispositivo.</span></p>
        <p class="hw-route-note fm-sr" id="hw_route_note" aria-live="polite"></p>
        <p id="hw_resume_note" class="fm-hero__resume" role="status" aria-live="polite"></p>
      </section>`;
}

/**
 * "Explore more": the level-3 sheet. Extended practice, key words, games, photobooth. Opening one
 * closes the sheet and moves the family there; none of them is needed to finish the mission.
 */
export function renderExploreMoreSheet() {
  const row = (actHtml, ico, en, es, descEn, descEs, extra = "") => `
        <li><button type="button" class="fm-btn fm-btn--block hw-explore-row" ${actHtml}${extra}>
          <span class="hw-explore-ico" aria-hidden="true">${ico}</span>
          <span class="hw-explore-copy"><strong>${bi(en, es)}</strong><small>${bi(descEn, descEs)}</small></span>
        </button></li>`;
  const stops = OPTIONAL_STOPS.map((s) =>
    row(act("openOptionalStop", s.id), s.icon, s.en, s.es, s.blurbEn, s.blurbEs),
  ).join("");
  return `<dialog class="fm-sheet hw-explore-sheet" id="hw_explore_sheet" aria-labelledby="hw_explore_title">
      <span class="fm-sheet__grab" aria-hidden="true"></span>
      <div class="fm-sheet__head"><h2 id="hw_explore_title" class="fm-card__title">${bi("Explore more", "Explorar más")}</h2><button type="button" class="fm-btn fm-btn--icon" data-close aria-label="Close" data-aria-en="Close" data-aria-es="Cerrar">${icon("close")}</button></div>
      <div class="fm-sheet__body">
        <p class="hw-explore-lead">${bi("Everything here is optional. The five steps are already enough.", "Todo esto es opcional. Los cinco pasos ya son suficientes.")}</p>
        <ul class="hw-explore-list">
        ${row(act("chooseExtendedPractice"), "🏋️", "Extended practice", "Práctica extendida", `All the practice problems, about ${ROUTE_TIMES.full} minutes`, `Todos los problemas de práctica, unos ${ROUTE_TIMES.full} minutos`, " data-hw-extended-row")}
        ${stops}
        </ul>
      </div>
    </dialog>`;
}

/**
 * Connect: one noticing prompt. The family looks at the case and the picture above, then says (or
 * types, optionally) what they notice and wonder. Saved on this device by the mission script;
 * never graded, never required.
 */
export function renderNoticeWonder() {
  const field = (id, labelEn, labelEs, phEn, phEs) => `
        <label class="hw-nw-field" for="${id}"><span class="hw-nw-label">${bi(labelEn, labelEs)}</span>
          <textarea id="${id}" rows="2" maxlength="280" data-mission-note="${id}" placeholder="${esc(phEn)}" data-placeholder-en="${esc(phEn)}" data-placeholder-es="${esc(phEs)}"></textarea></label>`;
  return `
    <section class="mission-block hw-nw" id="hw_notice_wonder" aria-labelledby="hw_nw_title">
      <h2 class="hw-nw-title" id="hw_nw_title">${bi("What do you notice?", "¿Qué notas?")}</h2>
      <p>${bi("Look at the picture and the story. Say it out loud, or type a few words. There is no wrong answer here.", "Mira el dibujo y la historia. Dilo en voz alta o escribe unas palabras. Aquí no hay respuestas incorrectas.")}</p>
      ${field("hw_notice", "I notice…", "Noto que…", "I notice…", "Noto que…")}
      ${field("hw_wonder", "I wonder…", "Me pregunto…", "I wonder…", "Me pregunto…")}
    </section>`;
}

/**
 * Explore: the mount point for the lesson's interactive model. The model engine loads lazily
 * (`/assets/family-mission/models/index.mjs`) the first time this stage opens, so a family that
 * never reaches Explore never downloads it. Empty when the lesson has no model family yet; the
 * static picture and labs still render beside it.
 */
export function renderMissionModelHost(config) {
  const spec = missionModelFor(config);
  if (!spec) return "";
  return `
    <section class="hw-mission-model" id="hw_mission_model" aria-labelledby="hw_mm_title" data-mission-model data-family="${esc(spec.family)}" data-config="${esc(JSON.stringify(spec.config))}">
      <div class="hw-mm-head">
        <span class="hw-mm-badge">${bi("Living Math · Interactive Model", "Matemáticas vivas · Modelo interactivo")}</span>
        <h2 class="hw-mm-title" id="hw_mm_title">${bi("Try it yourself", "Pruébalo tú")}</h2>
      </div>
      <p class="hw-mm-lead">${bi(spec.leadEn, spec.leadEs)}</p>
      <div class="hw-mm-stage" data-mission-stage></div>
      <p class="hw-mm-status" role="status" aria-live="polite" data-mission-status></p>
      <div class="hw-mm-transition">
        <p class="hw-mm-predict">${bi("Prediction check: Before you move to Your Turn, predict what will happen when you change one value by 1 step, then test your prediction above.", "Comprobación de predicción: Antes de pasar a Tu turno, predice qué pasará cuando cambies un valor en 1 paso y luego pruébalo arriba.")}</p>
        <button type="button" class="fm-btn fm-btn--primary" ${act("switchHomeworkTab", "check")}>${bi("Ready for Your Turn →", "Listo para Tu turno →")}</button>
      </div>
    </section>`;
}

/**
 * Finish (step 5): what was practiced, one strength and one next step (filled by the mission script
 * from what the family actually did), one family question, then where to go next. Saved-on-device is
 * stated, because it is true and the teacher is not sent this. Everything past the first row of
 * actions is optional and folded.
 */
export function renderReflect({ lessonId, next, prereq, question, studio = "" }) {
  /* The lesson page, only when it exists: a family is never sent to a 404. */
  const base = lessonId.replace(/-part2$/, "");
  const lessonPage = LESSON_PAGE_IDS.has(base) ? `/lessons/${base}/` : "";
  const link = (href, en, es, cls = "", extra = "") =>
    `<a class="fm-btn fm-btn--block hw-next-link${cls}" href="${esc(href)}"${extra}><span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span></a>`;
  const pairText = (p) => bi(p?.en, p?.es);
  return `
    <section class="mission-block hw-reflect fp-finish" id="hw_reflect" aria-labelledby="hw_reflect_title">
      ${stepHead(5, "Finish", "Terminar", "Celebrate what you did, see what it showed, then take one next step or stop here.", "Celebren lo que hicieron, vean lo que mostró y den un siguiente paso o paren aquí.")}
      <div class="fm-celebrate" id="hw_celebrate" data-celebrate aria-live="polite"></div>
      <div class="hw-evidence fp-card" data-mission-evidence hidden>
        <h3 class="fp-label" id="hw_reflect_title">${bi("What happened today", "Lo que pasó hoy")}</h3>
        <div id="hw_mission_summary" class="hw-mission-summary" role="status" aria-live="polite"></div>
        <p class="hw-saved-note">${bi("Saved only on this device. Your teacher has not received it.", "Se guarda solo en este dispositivo. Su maestro o maestra no lo ha recibido.")}</p>
      </div>
      <div class="hw-math-win fp-card" id="hw_math_win" data-math-win hidden></div>
      ${question?.en ? `<aside class="fp-family" aria-label="${esc("Family question")}"><p class="fp-label">${bi("Talk about it (optional)", "Conversen (opcional)")}</p><p>${pairText(question)}</p></aside>` : ""}
      <div class="hw-next-actions fp-actions">
        <button type="button" class="fm-btn fm-btn--block fm-btn--primary" data-celebrate-mission ${act("openOptionalStop", "apply")}><span aria-hidden="true">🌎</span> <span class="lang-en">Launch Family Math Mission (3-stage challenge)</span><span class="lang-es" lang="es">Iniciar Misión Matemática Familiar (reto de 3 etapas)</span></button>
        <button type="button" class="fm-btn fm-btn--block fm-btn--primary" data-celebrate-photo ${act("openOptionalStop", "photobooth")}><span aria-hidden="true">📸</span> <span class="lang-en">Take your victory photo</span><span class="lang-es" lang="es">Tomen su foto de victoria</span></button>
        <button type="button" class="fm-btn fm-btn--block fm-btn--primary" data-celebrate-games ${act("openOptionalStop", "play")}><span aria-hidden="true">🎮</span> <span class="lang-en">Play a practice game</span><span class="lang-es" lang="es">Jugar un juego de práctica</span></button>
        <button type="button" class="fm-btn fm-btn--block" data-celebrate-challenge ${act("hwStartChallengeRound")}><span aria-hidden="true">⭐</span> <span class="lang-en">Challenge round (deeper problems)</span><span class="lang-es" lang="es">Ronda de reto (problemas más profundos)</span></button>
        ${studio ? link(studio, "Practice Studio: interactive practice at three levels", "Estudio de práctica: práctica interactiva en tres niveles", "", " data-practice-studio") : ""}
        <button type="button" class="fm-btn fm-btn--block" ${act("fpPracticeMore")}><span class="lang-en">Practice more (new problems)</span><span class="lang-es" lang="es">Más práctica (problemas nuevos)</span></button>
        ${next ? link(next.href, `Next lesson: ${next.en}`, `Siguiente lección: ${next.es}`, " fm-btn--primary", ` data-next-lesson="${esc(next.id)}"`) : ""}
        ${prereq ? link(prereq.href, `Review first: ${prereq.en}`, `Repasar primero: ${prereq.es}`, "", " data-mission-prereq hidden") : ""}
        ${lessonPage ? link(lessonPage, "Back to the lesson", "Volver a la lección") : ""}
        ${link("/families/", "All lessons", "Todas las lecciones")}
      </div>
      <details class="fp-optional fp-more">
        <summary>${bi("More to do (optional)", "Más para hacer (opcional)")}</summary>
        <div class="hw-next-actions fp-actions">
          <button type="button" class="fm-btn fm-btn--block hw-next-link" ${act("switchHomeworkTab", "check")}>${bi("Practice again", "Practicar otra vez")}</button>
          <button type="button" class="fm-btn fm-btn--block hw-next-link" data-open-sheet="hw_explore_sheet" aria-haspopup="dialog">${bi("Explore more", "Explorar más")}</button>
          ${link(`/curriculum/family-connections/math-studio/?lesson=${encodeURIComponent(lessonId)}`, "Family Math Studio: build and test an idea", "Estudio familiar: crear y probar una idea")}
          <button type="button" class="fm-btn fm-btn--block hw-next-link" ${act("resetWorksheet")}>${bi("Start this practice over", "Empezar esta práctica de nuevo")}</button>
        </div>
      </details>
    </section>`;
}
