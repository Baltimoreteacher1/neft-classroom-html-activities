// Practice-test screen pieces shared by tests.js and test.js: domain chips, the mode badge and mode cards,
// and the results screen parts: practice-rubric ratings, the Practice Composite table, the formative
// breakdown (Independent vs Supported, by domain / Key Language Use / dimension, with "Practice this
// skill next" links) and the answer review.
import { transcriptHTML } from "../components.js";
import { correctAnswerText, isAuto, isCorrect } from "../grade.js";
import { seedAnswer } from "../items.js";
import { CRITERIA, PRACTICE_BANDS } from "../lang/rubrics.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, html, icon, raw } from "../util.js";
import { modeOf, modePhrase, modeText, otherMode, rich } from "./test-modes.js";

const IGN = raw("data-nsr-ignore");

/** "3 questions" / "3 preguntas" and "2 sections" / "2 secciones". */
export const questionsText = (I, n) => I.T(`${n} question${n === 1 ? "" : "s"}`, `${n} pregunta${n === 1 ? "" : "s"}`);
export const sectionsText = (I, n) => I.T(`${n} section${n === 1 ? "" : "s"}`, `${n} secci${n === 1 ? "ón" : "ones"}`);

/** The four skill names in the chosen language; any other domain name stays as written. */
export const domainName = (I, domain) => (CORE_DOMAINS.includes(domain) ? I.T(domain, DOMAIN_META[domain].es) : domain);

/** Domain colour class (`d-reading`...). Unknown domains stay neutral. */
export const domainClass = (domain) =>
  DOMAIN_META[domain] ? `d-${domain.toLowerCase()}` : "d-model-test";

/** Domain name with its icon, tinted by the domain colour. Icon, colour and word always travel together. */
export const domainChipHTML = (domain, label = domain) =>
  html`<span class="dom-chip ${domainClass(domain)}"
    >${icon(DOMAIN_META[domain]?.icon || "tests")}${label}</span
  >`;

const MODE_ICON = { guided: "bulb", independent: "lock" };

/** Mode label with a different icon and shape per mode, so the two are never told apart by colour alone. */
export const modeBadgeHTML = (I, mode, { tag = false, cls = "", iconOnly = false } = {}) =>
  html`<span class="mode-badge is-${mode} ${cls} ${iconOnly ? "is-icon" : ""}">${icon(MODE_ICON[mode])}${iconOnly ? "" : html`<span>${modeText(I, mode, "label")}</span>`}${tag ? html`<span class="mode-tag">${modeText(I, mode, "tag")}</span>` : ""}</span>`;

const MODE_POINTS = {
  guided: [
    ["check", "No clock. Take your time", "Sin reloj. Tómate tu tiempo"],
    ["check", "Listen as often as you like", "Escucha tantas veces como quieras"],
    ["check", "Hints, word banks and sentence frames", "Pistas, bancos de palabras y estructuras de oraciones"],
    ["check", "Check an answer, see why, and try again", "Revisa una respuesta, mira por qué y vuelve a intentar"],
  ],
  independent: [
    ["lock", "Each recording plays once and cannot be paused", "Cada grabación suena una sola vez y no se puede pausar"],
    ["lock", "No hints, sentence frames or word banks", "Sin pistas, estructuras de oraciones ni bancos de palabras"],
    ["lock", "Flag questions and review each section", "Marca preguntas y repasa cada sección"],
    ["lock", "Optional practice timer that never ends your test", "Temporizador de práctica opcional que nunca termina tu prueba"],
  ],
};
const MODE_SENTENCE = {
  guided: ["Learn as you go. Check each answer, see why it is right, and try again.", "Aprende sobre la marcha. Revisa cada respuesta, mira por qué es correcta y vuelve a intentar."],
  independent: [
    "Like test day. Show what you can do on your own, then submit to see a practice breakdown.",
    "Como el día de la prueba. Muestra lo que puedes hacer por tu cuenta y luego envía para ver un desglose de práctica.",
  ],
};

const modePointsHTML = (I, mode) =>
  html`<span class="mode-points"
    >${MODE_POINTS[mode].map(([ic, en, es]) => html`<span>${icon(ic)}${I.T(en, es)}</span>`)}</span
  >`;

/**
 * The mode choice on the intro screen. Before the test starts it is a radio group of two cards (same
 * `data-conditions` radios as before); once started it only states the mode and offers a restart.
 */
export function modeCardsHTML(I, rec, { started, minutes }) {
  const mode = modeOf(rec);
  if (started)
    return html`<div class="test-mode is-started">
      <p>
        ${modeBadgeHTML(I, mode, { tag: true })}
        <span class="fine">${I.T("You chose this when you started. Changing mode restarts the test.", "Elegiste este modo al empezar. Si cambias de modo, la prueba empieza de nuevo.")}</span>
      </p>
      <button type="button" class="btn small" data-switch-mode="${otherMode(mode)}">
        ${icon("retry")} ${modePhrase(I, otherMode(mode), "label", "Restart in {m}", "Reiniciar en {m}")}
      </button>
    </div>`;
  const card = (id, value) =>
    html`<label class="mode-card is-${id} ${mode === id ? "is-chosen" : ""}">
      <input
        type="radio"
        name="test-mode"
        value="${value}"
        data-conditions
        ${mode === id ? raw("checked") : ""}
        ${IGN}
      />
      <span class="mode-card-head">
        <span class="mode-card-icon">${icon(MODE_ICON[id])}</span>
        <span class="mode-card-title"
          ><strong>${modeText(I, id, "label")}</strong><span class="mode-tag">${modeText(I, id, "tag")}</span></span
        >
        <span class="mode-card-check" aria-hidden="true">${icon("check")}</span>
      </span>
      <span class="mode-card-copy">${I.T(...MODE_SENTENCE[id])}</span>
      ${modePointsHTML(I, id)}
    </label>`;
  return html`<fieldset class="test-mode">
    <legend>${I.T("Choose your mode before you start", "Elige tu modo antes de empezar")}</legend>
    <div class="mode-cards">${card("guided", "learning")}${card("independent", "test")}</div>
    ${
      mode === "independent"
        ? html`<div class="mode-options">
            <label class="opt-row"
              ><input type="checkbox" data-replay ${rec.replay ? raw("checked") : ""} ${IGN} />
              <span
                >${I.T("Allow one replay of each recording", "Permitir una repetición de cada grabación")}
                <span class="fine"
                  >${I.T(
                    "EduWonderLab rehearsal setting. It does not grant or represent an official testing accommodation. Ask your teacher about your assessment plan.",
                    "Ajuste de ensayo de EduWonderLab. No otorga ni representa una adaptación oficial para la evaluación. Pregunta a tu docente sobre tu plan de evaluación.",
                  )}</span
                ></span
              ></label
            >
            <label class="opt-row"
              ><input type="checkbox" data-timer ${rec.timer ? raw("checked") : ""} ${IGN} />
              <span
                >${I.T(
                  `Practice with a timer (about ${minutes} minutes). It will never end your test.`,
                  `Practicar con temporizador (unos ${minutes} minutos). Nunca terminará tu prueba.`,
                )}</span
              ></label
            >
          </div>`
        : ""
    }
  </fieldset>`;
}

const ratingId = (domain, crit, band) => `rate-${domain}-${crit}-${band}`;

/** Speaking and Writing cannot be machine-scored, so the composite waits for a practice-rubric rating. */
export function ratingHTML(I, r, ratings) {
  const rated = r.sections.filter(
    (s) => (s.domain === "Speaking" || s.domain === "Writing") && s.openDone > 0,
  );
  if (!rated.length) return "";
  return html`<section class="rate-panel" aria-labelledby="rateTitle">
    <h2 id="rateTitle">${I.T("Rate your speaking and writing", "Evalúa tu expresión oral y tu escritura")}</h2>
    <p class="fine">
      ${I.T(
        "Use the practice rubric to rate each response. A teacher rating is a different kind of evidence than a self-rating, so say who rated. Ratings are saved on this device.",
        "Usa la rúbrica de práctica para evaluar cada respuesta. La evaluación de un docente es un tipo de evidencia distinto de la autoevaluación, así que indica quién evaluó. Las evaluaciones se guardan en este dispositivo.",
      )}
    </p>
    ${rated.map((s) => {
      const cur = ratings?.[s.domain] || {};
      return html`<fieldset class="rate-domain ${domainClass(s.domain)}">
        <legend>${domainChipHTML(s.domain, domainName(I, s.domain))}</legend>
        ${CRITERIA.map(
          (c) =>
            html`<fieldset class="rate-crit">
              <legend>${c.name} <span class="fine">· ${c.dimension}</span></legend>
              <div class="rate-options">
                ${PRACTICE_BANDS.map(
                  (b) =>
                    html`<label class="rate-opt">
                      <input
                        type="radio"
                        id="${ratingId(s.domain, c.id, b.id)}"
                        name="rate-${s.domain}-${c.id}"
                        value="${b.id}"
                        data-rating="${s.domain}"
                        data-rating-crit="${c.id}"
                        ${cur[c.id] === b.id ? raw("checked") : ""}
                        ${IGN}
                      />
                      <span><strong>${b.label}</strong><span>${c.student[b.id]}</span></span>
                    </label>`,
                )}
              </div>
            </fieldset>`,
        )}
        <fieldset class="rate-crit rate-who">
          <legend>${I.T("Who rated this?", "¿Quién lo evaluó?")}</legend>
          <div class="rate-options">
            ${["me", "teacher"].map(
              (who) =>
                html`<label class="rate-opt">
                  <input
                    type="radio"
                    id="rate-${s.domain}-by-${who}"
                    name="rate-${s.domain}-by"
                    value="${who}"
                    data-rating-by="${s.domain}"
                    ${(cur.by || "me") === who ? raw("checked") : ""}
                    ${IGN}
                  />
                  <span
                    ><strong
                      >${who === "me" ? I.T("I rated my own work", "Yo evalué mi propio trabajo") : I.T("My teacher rated it", "Mi docente lo evaluó")}</strong
                    ></span
                  >
                </label>`,
            )}
          </div>
        </fieldset>
      </fieldset>`;
    })}
  </section>`;
}

/** The Practice Composite (computed by views/test.js): weighted, never filled in, never a WIDA score or level. */
export function compositeHTML(I, c, { WEIGHTS, METHOD, LIMITS, MIN_ITEMS, BAND_POINTS }) {
  const points = (m) => (m.status === "ok" ? `${Math.round(m.value)}` : "—");
  const card = (label, sub, v) =>
    html`<article class="comp-card ${v ? "has-value" : ""}">
      <h3>${label} <span class="fine">${sub}</span></h3>
      ${
        v
          ? html`<p class="comp-num">
                <strong>${v.value}</strong> <span>${I.T("/ 100 practice points", "/ 100 puntos de práctica")}</span>
              </p>
              ${v.small ? html`<p class="fine">${I.T("Small sample: fewer than 12 questions in a skill. Treat this as a rough picture.", "Muestra pequeña: menos de 12 preguntas en una destreza. Tómalo como una idea aproximada.")}</p>` : ""}`
          : html`<p class="comp-num is-empty"><strong>—</strong> <span>${I.T("Not shown yet", "Aún no se muestra")}</span></p>`
      }
    </article>`;
  return html`<section class="composite" aria-labelledby="compTitle">
    <h2 id="compTitle">${I.T("Practice composite", "Compuesto de práctica")}</h2>
    <p class="fine comp-kicker">${I.T("Practice points, not a WIDA ACCESS score, level or placement.", "Puntos de práctica, no un puntaje, nivel ni ubicación de WIDA ACCESS.")}</p>
    <div class="comp-grid">
      ${card(I.T("Practice comprehension", "Comprensión de práctica"), I.T("Listening + Reading", "Escuchar + Leer"), c.comprehension)}
      ${card(I.T("Practice overall", "Total de práctica"), I.T("all four skills", "las cuatro destrezas"), c.overall)}
    </div>
    ${c.withheld ? html`<p class="comp-withheld">${icon("info")}<span>${c.withheld}</span></p>` : ""}
    ${c.overall ? html`<p class="fine">${
        c.overall.raters.length > 1
          ? I.T("Speaking and Writing were rated by both you and your teacher.", "Hablar y Escribir fueron evaluados por ti y por tu docente.")
          : c.overall.raters[0] === "teacher"
            ? I.T("Speaking and Writing were rated by your teacher.", "Hablar y Escribir fueron evaluados por tu docente.")
            : I.T("Speaking and Writing are your own ratings.", "Hablar y Escribir son tus propias evaluaciones.")
      }</p>` : ""}
    <div class="fm-scroll">
      <table class="comp-table">
        <caption>
          ${I.T("How each skill counts", "Cómo cuenta cada destreza")}
        </caption>
        <thead>
          <tr>
            <th scope="col">${I.T("Skill", "Destreza")}</th>
            <th scope="col">${I.T("Weight", "Peso")}</th>
            <th scope="col">${I.T("Practice points", "Puntos de práctica")}</th>
            <th scope="col">${I.T("Based on", "Basado en")}</th>
          </tr>
        </thead>
        <tbody>
          ${c.measures.map(
            (m) =>
              html`<tr>
                <th scope="row">${domainChipHTML(m.domain, domainName(I, m.domain))}</th>
                <td data-label="${I.S("Weight", "Peso")}">${Math.round(WEIGHTS[m.domain] * 100)}%</td>
                <td data-label="${I.S("Practice points", "Puntos de práctica")}">${points(m)}</td>
                <td data-label="${I.S("Based on", "Basado en")}">${m.why}</td>
              </tr>`,
          )}
        </tbody>
      </table>
    </div>
    <div class="comp-method">
      <h3>${I.T("How this is calculated, and what it is not", "Cómo se calcula y qué no es")}</h3>
      <p>${METHOD}</p>
      <p>${LIMITS}</p>
      <p class="fine">
        ${I.T(
          `A skill needs at least ${MIN_ITEMS} answered questions to count. Rubric points: early ${BAND_POINTS.early}, building ${BAND_POINTS.building}, strong ${BAND_POINTS.strong}.`,
          `Una destreza necesita al menos ${MIN_ITEMS} preguntas respondidas para contar. Puntos de la rúbrica: early ${BAND_POINTS.early}, building ${BAND_POINTS.building}, strong ${BAND_POINTS.strong}.`,
        )}
      </p>
    </div>
  </section>`;
}

/** Where to practice next, by group (existing Lab routes). */
export const PRACTICE_NEXT = Object.freeze({
  Listening: ["/worlds/signal-station", "Signal Station"],
  Reading: ["/worlds/evidence-city", "Evidence City"],
  Speaking: ["/speak", "Speaking Studio"],
  Writing: ["/write", "Writing Studio"],
  Narrate: ["/worlds/storyworks", "StoryWorks"],
  Inform: ["/worlds/evidence-city", "Evidence City"],
  Explain: ["/missions", "Academic missions"],
  Argue: ["/worlds/conversation-quest", "Conversation Quest"],
  Discourse: ["/construction", "Language Construction Lab"],
  Sentence: ["/detective", "Language Error Detective"],
  "Word/Phrase": ["/vocabulary", "Word Builder"],
});

function fmTableHTML(I, caption, rows, { domains = false } = {}) {
  if (!rows.length) return "";
  return html`<div class="fm-scroll">
    <table class="fm-table">
      <caption>
        ${caption}
      </caption>
      <thead>
        <tr>
          <th scope="col">${I.T("Group", "Grupo")}</th>
          <th scope="col">${I.T("Checked questions", "Preguntas revisadas")}</th>
          <th scope="col">${I.T("Spoken and written work", "Trabajo oral y escrito")}</th>
          <th scope="col">${I.T("Practice this skill next", "Practica esta destreza a continuación")}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r) => {
          const [path, name] = PRACTICE_NEXT[r.key] || [];
          return html`<tr>
            <th scope="row">${domains ? domainName(I, r.key) : r.key}</th>
            <td data-label="${I.S("Checked questions", "Preguntas revisadas")}">
              ${r.scored ? html`${I.T(`${r.right} of ${r.scored} right`, `${r.right} de ${r.scored} correctas`)}${r.small ? html`<span class="fm-small">${I.T("Small sample", "Muestra pequeña")}</span>` : ""}` : "—"}
            </td>
            <td data-label="${I.S("Spoken and written work", "Trabajo oral y escrito")}">
              ${r.open ? I.T(`${r.openDone} of ${r.open} done`, `${r.openDone} de ${r.open} hechas`) : ""}${r.ratings.map((x) => html`<span class="fm-rating">${r.open ? "; " : ""}${domainName(I, x.domain)}: ${x.band} (${x.by === "teacher" ? I.T("teacher rating", "evaluación del docente") : I.T("self rating", "autoevaluación")})</span>`)}${!r.open && !r.ratings.length ? "—" : ""}
            </td>
            <td data-label="${I.S("Practice this skill next", "Practica esta destreza a continuación")}">
              ${path ? html`<a href="${BASE}${path}">${name}</a>` : ""}
            </td>
          </tr>`;
        })}
      </tbody>
    </table>
  </div>`;
}

/** Independent Rehearsal and Supported Practice, side by side and never combined. */
export function formativeHTML(I, formative, formativeBreakdown, { SMALL_SAMPLE, FORMATIVE_SMALL }) {
  const block = (mode) => {
    const snap = formative?.[mode];
    const title = modeText(I, mode, "results");
    if (!snap?.outcomes?.length)
      return html`<article class="fm-mode is-${mode} is-empty">
        <h3>${modeBadgeHTML(I, mode, { iconOnly: true })}<span class="fm-title">${title}</span></h3>
        <p>${modePhrase(I, mode, "results", "No {m} finished for this test yet.", "Aún no hay resultados de {m} para esta prueba.")}</p>
        <button type="button" class="btn small" data-switch-mode="${mode}">
          ${modePhrase(I, mode, "label", "Start {m} (restarts this test)", "Empezar {m} (reinicia esta prueba)")}
        </button>
      </article>`;
    const b = formativeBreakdown(snap);
    return html`<article class="fm-mode is-${mode}">
      <h3>${modeBadgeHTML(I, mode, { iconOnly: true })}<span class="fm-title">${title}</span></h3>
      <p class="fine">
        ${mode === "independent" ? I.T("Your own work under test-day rules.", "Tu propio trabajo con las reglas del día de la prueba.") : I.T("Work with hints, transcripts and retries. Each question counts your first check.", "Trabajo con pistas, transcripciones y nuevos intentos. Cada pregunta cuenta tu primera revisión.")}
        ${snap.date ? I.T(` Finished ${new Date(snap.date).toLocaleDateString()}.`, ` Terminada el ${new Date(snap.date).toLocaleDateString()}.`) : ""}
      </p>
      ${
        b.small
          ? html`<p class="fine">${rich(
              I,
              html`<strong>Small sample:</strong> fewer than ${SMALL_SAMPLE} checked questions in this run. Treat these counts as a hint, not a pattern. A group with fewer than ${FORMATIVE_SMALL} is marked.`,
              html`<strong>Muestra pequeña:</strong> menos de ${SMALL_SAMPLE} preguntas revisadas en esta ronda. Toma estos conteos como una pista, no como un patrón. Un grupo con menos de ${FORMATIVE_SMALL} queda marcado.`,
            )}</p>`
          : ""
      }
      ${fmTableHTML(I, I.T("By domain", "Por destreza"), b.byDomain, { domains: true })} ${fmTableHTML(I, I.T("By Key Language Use", "Por Key Language Use (uso clave del lenguaje)"), b.byKeyUse)}
      ${fmTableHTML(I, I.T("By language dimension", "Por dimensión del lenguaje"), b.byDimension)}
    </article>`;
  };
  return html`<section class="formative" aria-labelledby="fmTitle">
    <h2 id="fmTitle">${I.T("Formative results: what to practice next", "Resultados formativos: qué practicar a continuación")}</h2>
    <p class="fine">
      ${I.T(
        "Two separate results. They are never added together, and neither is a WIDA ACCESS score or level. Key Language Use and language dimension are this lab's own tags for what each question mostly practices. Speaking and Writing appear by dimension only after a practice-rubric rating.",
        "Son dos resultados separados. Nunca se suman, y ninguno es un puntaje ni un nivel de WIDA ACCESS. Key Language Use y la dimensión del lenguaje son etiquetas propias de este laboratorio sobre lo que más practica cada pregunta. Hablar y Escribir aparecen por dimensión solo después de una evaluación con la rúbrica de práctica.",
      )}
    </p>
    <div class="fm-modes">${block("independent")} ${block("guided")}</div>
  </section>`;
}

/** Every question with its key; Listening keeps its transcript here, after the test. */
export function answerReviewHTML(I, flat, answers) {
  return html`<section class="panel answer-review-panel">
    <h2>${I.T("Answer review", "Repaso de respuestas")}</h2>
    <ol class="answer-review">
      ${flat.map((f, i) => {
        const a = answers[f.item.id] ?? seedAnswer(f.item);
        const auto = isAuto(f.item);
        const ok = auto && isCorrect(f.item, a);
        return html`<li
          class="${auto ? (ok ? "is-right" : "is-wrong") : "is-open"} ${domainClass(f.section.domain)}"
        >
          <span class="ar-n" aria-hidden="true">${i + 1}</span>
          <div class="ar-body">
            <p class="ar-q">${domainChipHTML(f.section.domain, domainName(I, f.section.domain))} <span>${f.item.prompt}</span></p>
            ${
              auto
                ? ok
                  ? html`<p class="ar-verdict">
                      ${icon("check")}<span class="visually-hidden">\u2713 </span>${I.T("Correct", "Correcta")}
                    </p>`
                  : html`<p class="ar-verdict">
                      ${icon("x")}<span
                        >${rich(I, html`Correct answer: <strong>${correctAnswerText(f.item)}</strong>`, html`Respuesta correcta: <strong>${correctAnswerText(f.item)}</strong>`)}</span
                      >
                    </p>`
                : html`<p class="ar-verdict">
                    ${icon("info")}<span>${I.T("Your teacher will review this answer.", "Tu docente revisará esta respuesta.")}</span>
                  </p>`
            }
            ${!ok && f.item.hint ? html`<p class="fine">${f.item.hint}</p>` : ""}
            ${f.section.domain === "Listening" && f.item.script ? transcriptHTML(f.item.id, f.item.script, { i18n: I }) : ""}
          </div>
        </li>`;
      })}
    </ol>
  </section>`;
}

/** Intro side column: what is in the test, how it works in the chosen mode, and the not-official note. */
export function introSideHTML(I, test, { mode, plays }) {
  return html`<aside class="test-intro-side">
        <section class="test-card-side" aria-labelledby="inTest">
          <h2 id="inTest">${I.T("In this test", "En esta prueba")}</h2>
          <ol class="section-list">
            ${(test.sections || []).map((s) => html`<li class="${domainClass(s.domain)}"><span class="section-name">${domainChipHTML(s.domain, s.title || domainName(I, s.domain))}</span><span class="section-meta">${questionsText(I, s.items.length)} · ${I.T(`about ${s.estMinutes || 8} min`, `unos ${s.estMinutes || 8} min`)}</span></li>`)}
          </ol>
        </section>
        <section class="test-card-side" aria-labelledby="howTest">
          <h2 id="howTest">${I.T("How it works", "Cómo funciona")}</h2>
          <ul class="rules">
            <li>${icon("clock")}<span>${mode === "guided" ? I.T("Take your time. Guided Practice has no clock.", "Tómate tu tiempo. La práctica guiada no tiene reloj.") : I.T("There is no clock unless you turn on the practice timer.", "No hay reloj, a menos que actives el temporizador de práctica.")}</span></li>
            <li>${icon("arrow-right")}<span>${rich(I, html`Use <strong>Next</strong> and <strong>Back</strong>. Flag a question to come back to it. You review each section before you submit.`, html`Usa <strong>Siguiente</strong> y <strong>Atrás</strong>. Marca una pregunta para volver a ella. Repasas cada sección antes de enviar.`)}</span></li>
            ${
              plays
                ? html`<li>${icon("play")}<span>${rich(I, html`Listening: press <strong>Play</strong>. Each recording plays ${plays === 1 ? "one time" : "up to two times"} and cannot be paused or stopped.`, html`Escuchar: presiona <strong>Reproducir</strong>. Cada grabación suena ${plays === 1 ? "una sola vez" : "hasta dos veces"} y no se puede pausar ni detener.`)}</span></li>`
                : html`<li>${icon("play")}<span>${rich(I, html`Listening: press <strong>Listen</strong>. You may listen more than once. After you check an answer you can read what you heard.`, html`Escuchar: presiona <strong>Escuchar</strong>. Puedes escuchar más de una vez. Después de revisar una respuesta, puedes leer lo que oíste.`)}</span></li>`
            }
            <li>${icon("writing")}<span>${I.T("Speaking: record your answer or say it to a teacher or partner. Writing: type your answer. For Grade 3 ACCESS preparation, also practice handwriting on paper with your teacher.", "Hablar: graba tu respuesta o dísela a tu docente o a un compañero. Escribir: escribe tu respuesta. Para prepararte para ACCESS en 3.er grado, practica también la escritura a mano en papel con tu docente.")}</span></li>
          </ul>
        </section>
        <p class="test-note disclaimer">
          ${icon("info")}<span>${rich(
            I,
            html`Original classroom practice, not an official WIDA test or score. Actual ACCESS Online adapts
          Listening and Reading and uses those results for Speaking and Writing tier placement. This
          fixed practice set does not reproduce its difficulty, scoring, timing, or routing. Use the
          <a href="https://wbte.drcedirect.com/WIDA" target="_blank" rel="noopener">official WIDA demo</a>
          to learn the actual testing interface.`,
            html`Práctica original de clase; no es una prueba ni un puntaje oficial de WIDA. El ACCESS Online real adapta
          Escuchar y Leer, y usa esos resultados para asignar el nivel (tier) de Hablar y Escribir. Este
          conjunto fijo de práctica no reproduce su dificultad, puntuación, tiempo ni ruta. Usa la
          <a href="https://wbte.drcedirect.com/WIDA" target="_blank" rel="noopener">demostración oficial de WIDA</a>
          para conocer la interfaz real de la prueba.`,
          )}</span>
        </p>
      </aside>`;
}

/** Section review before submit: counts, a warning for blanks, and every question by section. */
export function reviewScreenHTML(I, { test, flat, rec, done, answered: n }) {
  const flags = rec.flags || [];
  const missing = flat.length - n;
  const row = (f, i) => {
    const completed = done(f);
    const fl = flags.includes(f.item.id);
    return html`<li>
      <button type="button" class="review-row ${completed ? "is-done" : "is-blank"}" data-jump="${i}">
        <span class="rv-n" aria-hidden="true">${i + 1}</span>
        <span class="rv-title"><span class="visually-hidden">${i + 1}. </span>${f.item.title || f.item.skill || I.T("Question", "Pregunta")}</span>
        <span class="rv-state">${completed ? html`<span class="rv-pill is-done">${icon("check")}${I.T("Answered", "Respondida")}</span>` : html`<span class="rv-pill is-blank">${icon("alert")}${I.T("Not answered", "Sin responder")}</span>`}${fl ? html`<span class="rv-pill is-flag">${icon("flag")}${I.T("Flagged", "Marcada")}</span>` : ""}</span>
      </button>
    </li>`;
  };
  return html`<section class="review">
    <header class="review-head">
      <p class="eyebrow">${modeBadgeHTML(I, modeOf(rec))}</p>
      <h1 tabindex="-1">${I.T("Review each section before you submit", "Repasa cada sección antes de enviar")}</h1>
      <p class="lead">
        ${I.T(`${n} answered · ${missing} not answered · ${flags.length} flagged. Tap a question to go back.`, `${n} respondidas · ${missing} sin responder · ${flags.length} marcadas. Toca una pregunta para volver a ella.`)}
      </p>
      <ul class="review-stats" aria-hidden="true">
        <li class="is-done">${icon("check")}${rich(I, html`<strong>${n}</strong> answered`, html`<strong>${n}</strong> respondidas`)}</li>
        <li class="is-blank">${icon("alert")}${rich(I, html`<strong>${missing}</strong> not answered`, html`<strong>${missing}</strong> sin responder`)}</li>
        <li class="is-flag">${icon("flag")}${rich(I, html`<strong>${flags.length}</strong> flagged`, html`<strong>${flags.length}</strong> marcadas`)}</li>
      </ul>
    </header>
    ${missing ? html`<p class="review-warn" role="note">${icon("alert")}<span>${missing === 1 ? I.T("1 question has no answer yet. You can go back to it, or submit as it is.", "1 pregunta no tiene respuesta todavía. Puedes volver a ella o enviar la prueba así.") : I.T(`${missing} questions have no answer yet. You can go back to them, or submit as it is.`, `${missing} preguntas no tienen respuesta todavía. Puedes volver a ellas o enviar la prueba así.`)}</span></p>` : ""}
    ${(test.sections || []).map((s, si) => {
      const rows = flat.map((f, i) => [f, i]).filter(([f]) => f.si === si);
      const sDone = rows.filter(([f]) => done(f)).length;
      const sFlags = rows.filter(([f]) => flags.includes(f.item.id)).length;
      return html`<section class="review-section" data-domain="${s.domain}" aria-labelledby="rev-${si}">
        <div class="rs-head">
          <h2 id="rev-${si}">${icon(DOMAIN_META[s.domain]?.icon || "tests")}${s.title || domainName(I, s.domain)}</h2>
          <p class="fine">${I.T(`${sDone} of ${rows.length} answered · ${sFlags} flagged`, `${sDone} de ${rows.length} respondidas · ${sFlags} marcadas`)}</p>
          <div class="bar" aria-hidden="true"><i style="width:${Math.round((sDone / rows.length) * 100)}%"></i></div>
        </div>
        <ol class="review-list">
          ${rows.map(([f, i]) => row(f, i))}
        </ol>
      </section>`;
    })}
    <div class="row-actions review-actions">
      <button type="button" class="btn" data-jump="${rec.index}">${icon("arrow-left")}${I.T("Keep working", "Seguir trabajando")}</button
      ><button type="button" class="btn btn-primary btn-big" data-submit>${I.T("Submit test", "Enviar la prueba")}${icon("check")}</button>
    </div>
  </section>`;
}

