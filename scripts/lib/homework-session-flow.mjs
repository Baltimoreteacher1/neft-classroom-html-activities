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
    <p class="hw-session-sentence"><strong>${lead}</strong> ${bi(sentence.en, sentence.es)} ${tail}</p>
  </nav>`;
}

export const SESSION_FLOW_CSS = `
/* Session banner: where this night sits in a two-night lesson. */
.hw-session-banner { margin: 14px 0 0; padding: 12px 14px; background: #fff; color: var(--ink, #21313f); border-radius: 14px; border: 2px solid var(--teal, #1fa6a2); box-shadow: 0 6px 18px rgba(8, 27, 46, .22); }
.hw-session-steps { list-style: none; margin: 0; padding: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.hw-session-arrow { font-size: 18px; font-weight: 800; color: var(--teal-ink, #0c6f6b); }
.hw-session-chip { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 14px; border-radius: 999px; border: 2px solid #b8c7d6; background: #f3f7fa; color: var(--navy, #12355b); font-weight: 800; font-size: 15px; line-height: 1.25; text-decoration: none; }
a.hw-session-chip:hover { border-color: var(--teal, #1fa6a2); background: var(--teal-light, #dff2ee); }
a.hw-session-chip:focus-visible { outline: 3px solid var(--teal-ink, #0c6f6b); outline-offset: 2px; }
.hw-session-step.is-current .hw-session-chip { background: var(--navy, #12355b); border-color: var(--navy, #12355b); color: #fff; }
.hw-session-step.is-done .hw-session-chip { background: var(--success-bg, #e6f7ef); border-color: var(--success, #0f7c4a); color: #0b5a36; }
.hw-session-mark { font-size: 16px; }
.hw-session-sentence { margin: 10px 0 0; font-size: 15px; line-height: 1.5; }
@media (max-width: 640px) {
  .hw-session-steps { display: grid; grid-template-columns: 1fr auto 1fr; gap: 6px; }
  .hw-session-chip { width: 100%; justify-content: center; padding: 8px 10px; font-size: 13px; border-radius: 14px; text-align: center; }
  .hw-session-name { display: inline-flex; flex-direction: column; }
  .hw-session-sentence { font-size: 14px; }
}
@media print { .hw-session-banner { display: none !important; } }

/* Hero subtitle and one-sentence big idea. */
.hw-hero-subtitle { margin: 4px 0 0; font-size: 15px; font-weight: 700; letter-spacing: .02em; opacity: .92; }
.hw-hero-bigidea { margin: 14px 0 0; padding: 12px 14px; border-left: 5px solid var(--amber, #f2c15b); background: rgba(255, 255, 255, .13); border-radius: 10px; font-size: 18px; line-height: 1.45; font-weight: 700; }
.hw-hero-bigidea .hw-hero-bigidea-label { display: block; margin-bottom: 2px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; opacity: .85; }
.hw-hero-bigidea .lang-es { color: inherit; }
.hw-tools-menu .hw-standard-details { margin: 10px 0 0; }

/* Mobile first: big idea, route pills, then the lesson. The detail lives one tap away. */
@media (max-width: 640px) {
  .hw-hero-lead, .hw-experience-banner { display: none !important; }
  .hw-hero-body { display: flex; flex-direction: column; }
  .hw-hero-body > .hw-hero-kicker { order: 1; }
  .hw-hero-body > .hw-hero-head { order: 2; }
  .hw-hero-body > .hw-hero-lesson { order: 3; }
  .hw-hero-body > .hw-hero-bigidea { order: 4; }
  .hw-hero-body > .hw-route-chooser { order: 5; }
  .hw-hero-body > .hw-session-banner { order: 6; }
  .hw-hero-body > .hw-hero-controls { order: 7; }
  .hw-hero-body > .hw-tools-menu { order: 8; }
  .hw-hero-bigidea { font-size: 17px; }
  .hw-route-chooser .hw-route-heading > div > p { display: none; }
  .hw-route-chooser .hw-route-heading { margin-bottom: 6px; }
  .hw-route-options { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .hw-route-option { flex-direction: column; align-items: center; justify-content: flex-start; gap: 2px; min-height: 76px; padding: 8px 4px; text-align: center; }
  .hw-route-option .hw-route-copy small { display: none; }
  .hw-route-option .hw-route-copy strong { font-size: 13px; line-height: 1.2; }
  .hw-route-option .hw-route-time { font-size: 18px; }
  .hw-route-note { font-size: 13px; }
}

/* Quick route: one round of the huddle, the rest of the practice behind a disclosure. */
.hw-quick-optional { margin: 14px 0; }
.hw-quick-optional[hidden] { display: none; }
.hw-quick-optional button { min-height: 48px; width: 100%; padding: 10px 16px; font: inherit; font-weight: 800; border-radius: 12px; border: 2px dashed var(--teal, #1fa6a2); background: #f0fdfa; color: var(--teal-ink, #0c6f6b); cursor: pointer; }
.hw-quick-optional button:focus-visible { outline: 3px solid var(--teal-ink, #0c6f6b); outline-offset: 2px; }
.cga-quick-note { display: none; margin: 10px 0 0; font-size: 14px; color: #7c2d12; }
body[data-homework-route="quick"] #hw_cga .cga-round:not([data-cga-round="0"]), body[data-homework-route="quick"] #hw_cga .cga-next { display: none !important; }
body[data-homework-route="quick"] #hw_cga .cga-quick-note { display: block; }

/* Warm-up huddle: the Confused Grown-Up, offered right after Learn. */
.hw-huddle { margin: 16px 0; border: 2px solid var(--amber, #f2c15b); border-radius: 16px; background: var(--amber-light, #fef7e0); }
.hw-huddle > summary { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 12px 14px; cursor: pointer; list-style: none; }
.hw-huddle > summary::-webkit-details-marker { display: none; }
.hw-huddle > summary:focus-visible { outline: 3px solid var(--teal-ink, #0c6f6b); outline-offset: 2px; }
.hw-huddle-icon { font-size: 28px; }
.hw-huddle-text { flex: 1; display: grid; gap: 2px; }
.hw-huddle-text small { font-size: 14px; color: var(--muted, #5f6f80); }
.hw-huddle-chev { font-size: 18px; transition: transform .15s ease; }
.hw-huddle[open] .hw-huddle-chev { transform: rotate(180deg); }
.hw-huddle > .cga-card { margin: 0 12px 12px; }
@media print { .hw-huddle { display: none; } }
`;

/** Quick-route disclosure for the problems the route set aside. */
export function renderQuickOptional() {
  return `<div class="hw-quick-optional" id="hw_quick_optional" hidden>
        <button type="button" id="hw_quick_optional_btn" aria-expanded="false" aria-controls="hw_panel_check" onclick="toggleQuickOptional()">
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
