/**
 * Family Math Mission: the one path through a family homework page.
 *
 * Six stages, in this order, on every lesson: Connect -> Explore -> Practice -> Talk Together ->
 * Apply -> Reflect. Everything else the page offers (key words, games, the photobooth, the full
 * set of practice problems) is optional and lives behind "Explore more", never in the path.
 *
 * Stage ids double as panel ids (`hw_panel_<id>`). `check` and `done` keep their historical ids so
 * saved progress, deep links and the Check/Done machinery keep working; the family sees the stage
 * LABELS below. Route ids stay `quick` and `full` for the same reason (`?route=quick` links and
 * QR codes already in the wild); their labels are "Today's mission" and "Extended practice".
 */

import { icon } from "./family-icons.mjs";
import { act } from "./homework-actions.mjs";
import { missionModelFor } from "./homework-mission-models.mjs";
import { LESSON_PAGE_IDS } from "./homework-sequence.mjs";

/** Practice items in today's mission. The goal, the "N problems" copy and the route limit all read this. */
export const MISSION_PRACTICE_COUNT = 3;

/** Route times, one source for the start card, the Explore more sheet and the hub. */
export const ROUTE_TIMES = { quick: "5–10", full: "15–25" };

/** The route a first visit lands on. Keep in step with HOMEWORK_ROUTE_DEFAULT in homework-guided-notes.mjs. */
export const DEFAULT_ROUTE = "quick";

export const MISSION_STAGES = [
  { id: "connect", icon: "🔭", en: "Connect", es: "Conectar" },
  { id: "explore", icon: "🧩", en: "Explore", es: "Explorar" },
  { id: "check", icon: "✅", en: "Practice", es: "Practicar" },
  { id: "talk", icon: "💬", en: "Talk Together", es: "Conversen" },
  { id: "apply", icon: "🌎", en: "Apply", es: "Aplicar" },
  { id: "done", icon: "🌱", en: "Reflect", es: "Reflexionar" },
];

/** Optional destinations: panels that exist but are not stages. */
export const OPTIONAL_STOPS = [
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
        <h2 id="hw_mission_title" class="fm-hero__q">${bi("Today's Family Math Mission", "La misión de matemáticas de hoy")}</h2>
        <p class="hw-mission-lead fm-hero__promise">${bi(
          `Six short steps, about ${ROUTE_TIMES.quick} minutes. Look, play with the math, solve ${MISSION_PRACTICE_COUNT}, talk, try one new idea, and finish.`,
          `Seis pasos cortos, unos ${ROUTE_TIMES.quick} minutos. Miren, jueguen con las matemáticas, resuelvan ${MISSION_PRACTICE_COUNT}, conversen, prueben una idea nueva y terminen.`,
        )}</p>
        <button type="button" id="hw_start_button" class="fm-btn fm-btn--primary fm-btn--lg fm-btn--block" ${act("startHomework")}><span class="lang-en">Start Today's Math</span><span class="lang-es" lang="es">Empezar la matemática de hoy</span></button>
        <button type="button" id="hw_explore_more_button" class="fm-btn fm-btn--block hw-explore-more-btn" data-open-sheet="hw_explore_sheet" aria-haspopup="dialog"><span class="lang-en">Explore more</span><span class="lang-es" lang="es">Explorar más</span></button>
        <p class="hw-route-promise fm-hero__promise"><span class="lang-en">Optional. No grades. No account. Saved on this device.</span><span class="lang-es" lang="es">Opcional. Sin calificaciones. Sin cuenta. Se guarda en este dispositivo.</span></p>
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
        <p class="hw-explore-lead">${bi("Everything here is optional. Today's mission is already enough.", "Todo esto es opcional. La misión de hoy ya es suficiente.")}</p>
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
      <h2 class="hw-mm-title" id="hw_mm_title">${bi("Try it yourself", "Pruébalo tú")}</h2>
      <p class="hw-mm-lead">${bi(spec.leadEn, spec.leadEs)}</p>
      <div class="hw-mm-stage" data-mission-stage></div>
      <p class="hw-mm-status" role="status" aria-live="polite" data-mission-status></p>
    </section>`;
}

/**
 * Reflect: the evidence summary (filled by the mission script from what the family actually did),
 * then where to go next: the next page in the real sequence, a prerequisite when support was used,
 * the unit's family hub, and "finish for tonight". Saved-on-device is stated, because it is true
 * and the teacher is not sent this.
 */
export function renderReflect({ lessonId, next, prereq }) {
  /* The lesson page, only when it exists: a family is never sent to a 404. */
  const base = lessonId.replace(/-part2$/, "");
  const lessonPage = LESSON_PAGE_IDS.has(base) ? `/lessons/${base}/` : "";
  const link = (href, ico, en, es, extra = "") =>
    `<a class="fm-btn fm-btn--block hw-next-link" href="${esc(href)}"${extra}><span aria-hidden="true">${ico}</span> <span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span></a>`;
  return `
    <section class="mission-block hw-reflect" id="hw_reflect" aria-labelledby="hw_reflect_title">
      <div class="hw-evidence" data-mission-evidence hidden>
        <h2 class="hw-reflect-title" id="hw_reflect_title">${bi("What happened today", "Lo que pasó hoy")}</h2>
        <div id="hw_mission_summary" class="hw-mission-summary" role="status" aria-live="polite"></div>
        <p class="hw-saved-note">${bi("This is saved only on this device. Your teacher has not received it.", "Esto se guarda solo en este dispositivo. Su maestro o maestra no lo ha recibido.")}</p>
      </div>
      <h3 class="hw-next-title">${bi("What next?", "¿Y ahora qué?")}</h3>
      <div class="hw-next-actions">
        <button type="button" class="fm-btn fm-btn--block hw-next-link" ${act("switchHomeworkTab", "check")}><span aria-hidden="true">🔁</span> ${bi("Practice again", "Practicar otra vez")}</button>
        ${next ? link(next.href, "➡️", `Next: ${next.en}`, `Siguiente: ${next.es}`, ` data-next-lesson="${esc(next.id)}"`) : ""}
        ${prereq ? link(prereq.href, "🧱", `Review: ${prereq.en}`, `Repasar: ${prereq.es}`, ` data-mission-prereq hidden`) : ""}
        ${lessonPage ? link(lessonPage, "📘", "Back to the lesson", "Volver a la lección") : ""}
        ${link(`/curriculum/family-connections/math-studio/?lesson=${encodeURIComponent(lessonId)}`, "🧪", "Family Math Studio: build and test an idea", "Estudio familiar: crear y probar una idea")}
        ${link("/families/", "🏠", "Family resources", "Recursos para la familia")}
        <button type="button" class="fm-btn fm-btn--block hw-next-link" data-open-sheet="hw_explore_sheet" aria-haspopup="dialog"><span aria-hidden="true">✨</span> ${bi("Explore more", "Explorar más")}</button>
      </div>
      <p class="hw-finish">${bi("Or finish for tonight. That is a good night of math.", "O terminen por hoy. Fue una buena noche de matemáticas.")}</p>
    </section>`;
}
