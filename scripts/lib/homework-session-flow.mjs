/**
 * Session flow for a family homework page: the two-session progress banner, the
 * compact mobile hero, the quick-route disclosure and the warm-up huddle.
 *
 * One vocabulary for the whole system. A lesson taught over two nights is
 * "Session 1: Concept Launch" then "Session 2: Compare & Apply" on every family
 * surface. "Part 2" stays the folder/URL word (`/lessons/4-4-part2/`) and
 * "Apply Day" stays the classroom word for the second classroom lesson; neither
 * is shown to a family.
 */

import { act } from "./homework-actions.mjs";

export const SESSIONS = {
  1: {
    en: "Session 1: Concept Launch",
    es: "Sesión 1: Lanzamiento del concepto",
    short: { en: "Session 1", es: "Sesión 1" },
  },
  2: {
    en: "Session 2: Compare & Apply",
    es: "Sesión 2: Comparar y aplicar",
    short: { en: "Session 2", es: "Sesión 2" },
  },
};

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span>`;

/** Which session a family page is, from its lesson id; null for unpaired pages. */
export function sessionOf(lessonId) {
  const match = String(lessonId ?? "").match(/^(\d+-\d+)(-part2)?$/);
  if (!match) return null;
  return { baseId: match[1], session: match[2] ? 2 : 1 };
}

/**
 * "Tonight we compare two records…" said about another night:
 * "In Session 2, we compare two records…". Every sidecar's learningTonight opens
 * with "Tonight" / "Esta noche"; anything that does not gets the generic line.
 */
export function sessionSentence(learningTonight, session) {
  const short = SESSIONS[session].short;
  const en = String(learningTonight?.en ?? "").trim();
  const es = String(learningTonight?.es ?? "").trim();
  if (/^Tonight\b/.test(en) && /^Esta noche\b/i.test(es)) {
    return {
      en: `In ${short.en}, ${en.replace(/^Tonight\s+/, "")}`,
      es: `En la ${short.es}, ${es.replace(/^Esta noche\s+/i, "")}`,
    };
  }
  return session === 2
    ? {
        en: "Session 2 builds on this idea with new problems and a closer comparison.",
        es: "La Sesión 2 se basa en esta idea con problemas nuevos y una comparación más detallada.",
      }
    : {
        en: "Session 1 introduced the main idea that this page builds on.",
        es: "La Sesión 1 presentó la idea principal en la que se basa esta página.",
      };
}

/**
 * The banner. `partner` is `{ href, learningTonight }` for the other session
 * page, or null when the lesson has none (then nothing renders).
 */
export function renderSessionBanner(lessonId, partner) {
  const here = sessionOf(lessonId);
  if (!here || !partner) return "";
  const onSecond = here.session === 2;
  const stepState = (n) => {
    if (n === here.session) return "current";
    return n < here.session ? "done" : "next";
  };
  const mark = { current: "●", done: "✓", next: "○" };
  const step = (n) => {
    const state = stepState(n);
    const s = SESSIONS[n];
    const inner = `<span class="hw-session-mark" aria-hidden="true">${mark[state]}</span><span class="hw-session-name"><span class="hw-session-full">${bi(s.en, s.es)}</span><span class="hw-session-short">${bi(s.short.en, s.short.es)}</span></span>`;
    return state === "current"
      ? `<li class="hw-session-step is-current"><span class="hw-session-chip" aria-current="step">${inner}</span></li>`
      : `<li class="hw-session-step is-${state}"><a class="hw-session-chip" href="${esc(partner.href)}">${inner}</a></li>`;
  };
  const sentence = sessionSentence(partner.learningTonight, onSecond ? 1 : 2);
  const lead = onSecond
    ? bi("Where we started:", "Donde empezamos:")
    : bi("Coming up next:", "Lo que sigue:");
  const tail = onSecond
    ? bi("Tonight takes that idea further.", "Hoy llevamos esa idea más lejos.")
    : bi(
        "It builds on today’s model. Open it when it is assigned.",
        "Se basa en el modelo de hoy. Ábranla cuando se las asignen.",
      );
  return `<nav class="hw-session-banner" aria-label="Two-session lesson" data-session="${here.session}">
    <ol class="hw-session-steps">${step(1)}<li class="hw-session-arrow" aria-hidden="true">➔</li>${step(2)}</ol>
    <details class="hw-session-more">
      <summary>${lead}</summary>
      <p class="hw-session-sentence">${bi(sentence.en, sentence.es)} ${tail}</p>
    </details>
  </nav>`;
}

/** Quick-route disclosure for the problems the route set aside. */
export function renderQuickOptional() {
  return `<div class="hw-quick-optional" id="hw_quick_optional" hidden>
        <button type="button" id="hw_quick_optional_btn" aria-expanded="false" aria-controls="hw_panel_check" ${act("toggleQuickOptional")}>
          <span class="lang-en"><span data-hw-quick-more-label>Show</span> <span data-hw-quick-more-count>4</span> more problems (optional)</span>
          <span class="lang-es" lang="es"><span data-hw-quick-more-label-es>Mostrar</span> <span data-hw-quick-more-count-es>4</span> problemas más (opcional)</span>
        </button>
      </div>`;
}

/** The Confused Grown-Up as an optional warm-up, between Learn and the problems. */
export function renderWarmupHuddle(cgaHtml) {
  if (!cgaHtml) return "";
  const quickNote = `<p class="cga-quick-note">${bi(
    "Quick practice shows round 1. Choose Learn & practice for every round.",
    "La práctica breve muestra la ronda 1. Elijan Aprender y practicar para ver todas las rondas.",
  )}</p>`;
  const card = cgaHtml.replace(/<\/div>\s*$/, `${quickNote}</div>`);
  return `
      <details class="hw-huddle" id="hw_huddle">
        <summary>
          <span class="hw-huddle-icon" aria-hidden="true">🎭</span>
          <span class="hw-huddle-text">
            <strong>${bi("Optional warm-up huddle · about 3 minutes", "Calentamiento opcional en equipo · unos 3 minutos")}</strong>
            <small>${bi(
              "A grown-up says a wrong answer on purpose. The student coaches. Try it before the problems to build confidence.",
              "Un adulto dice una respuesta equivocada a propósito. El estudiante lo guía. Pruébenlo antes de los problemas para ganar confianza.",
            )}</small>
          </span>
          <span class="hw-huddle-chev" aria-hidden="true">▾</span>
        </summary>
        ${card}
      </details>`;
}

export const SESSION_FLOW_JS = `
/* Quick route: the problems the route set aside stay one tap away. */
function toggleQuickOptional() {
  var open = document.body.dataset.quickMore === '1';
  if (open) delete document.body.dataset.quickMore; else document.body.dataset.quickMore = '1';
  setHomeworkRoute('quick', { silent: true, keepTab: true });
}
`;
