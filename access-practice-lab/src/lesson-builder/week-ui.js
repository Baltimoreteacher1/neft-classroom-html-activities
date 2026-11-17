// Lesson Builder markup for the week plan (on screen and printed), the family note and the student page.
// Plans print in English (the lesson language); family-facing lines carry Spanish beside the English.
import { bandLabel, bandLabelEs } from "../bands.js";
import { KLU_KIDS } from "../lang/boards.js";
import { BASE, DOMAIN_META, html, icon } from "../util.js";
import { FUNCTIONS, KLU_ES, SUPPORT_PROFILES } from "./rules.js";
import { WEEK_MINUTES, framesAround } from "./week.js";

const boardPath = (week) =>
  `${BASE}/choice-boards/${KLU_KIDS[week.klu].slug}?grades=${week.settings.band}`;
const talkPath = (week) =>
  `${BASE}/talk-table/${KLU_KIDS[week.klu].slug}?grades=${week.settings.band}`;
const warmPath = (week) => `${BASE}/warmup?grades=${week.settings.band}`;

/** The week on screen: five compact day cards, then print buttons. */
export function weekHTML(I, week, { rowById, activityHref }) {
  const s = week.settings;
  const fn = FUNCTIONS[s.fn];
  const dom = (d) => I.S(d, DOMAIN_META[d]?.es);
  return html`<section class="panel lb-week" aria-labelledby="lb-week-title">
    <h2 id="lb-week-title" class="workbook-heading">
      <span aria-hidden="true">2</span>
      ${I.T("Your week", "Su semana")}
    </h2>
    <p class="lb-meta">
      ${I.S(bandLabel(s.band), bandLabelEs(s.band))} · ${I.T(fn.label[0], fn.label[1])} ·
      ${I.S(`WIDA Key Language Use: ${week.klu}`, `Uso clave del lenguaje WIDA: ${KLU_ES[week.klu]}`)}
      · ${I.S(SUPPORT_PROFILES[s.support].name[0], SUPPORT_PROFILES[s.support].name[1])} ·
      ${I.T(`about ${Object.values(WEEK_MINUTES).reduce((a, b) => a + b, 0)} min a day`, `unos ${Object.values(WEEK_MINUTES).reduce((a, b) => a + b, 0)} min al día`)}
    </p>
    <p class="fine">
      ${I.T("Every day: warm-up, one core activity, choice time on the board, an exit ticket and a question to talk about at home.", "Cada día: calentamiento, una actividad central, tiempo de elección en el tablero, un boleto de salida y una pregunta para conversar en casa.")}
      <a href="${boardPath(week)}" target="_blank" rel="noopener"
        >${I.T("Open the board", "Abrir el tablero")}</a
      >
      ·
      <a href="${talkPath(week)}" target="_blank" rel="noopener"
        >${I.T("Open the Talk Table cards", "Abrir las tarjetas de conversación")}</a
      >
    </p>
    <ol class="lb-week-days">
      ${week.days.map((day) => {
        const row = rowById(day.activityId);
        const href = day.activityId ? activityHref(day.activityId) : "";
        return html`<li class="lb-day">
          <h3>
            ${I.T(day.name[0], day.name[1])}${day.focus ? html` <span class="lb-min">${dom(day.focus)}</span>` : html` <span class="lb-min">${I.T("Create and share", "Crear y compartir")}</span>`}
          </h3>
          <ul class="lb-day-steps">
            <li>
              <span class="lb-step-min">${WEEK_MINUTES.warmup}′</span>
              <a href="${warmPath(week)}" target="_blank" rel="noopener"
                >${I.T("Daily Language Warm-Up", "Calentamiento diario")}</a
              >
            </li>
            <li>
              <span class="lb-step-min">${WEEK_MINUTES.core}′</span> ${
                row
                  ? html`<a href="${href}" target="_blank" rel="noopener">${row.title}</a
                      >${day.name[0] === "Friday" ? html` <span class="fine">${I.T("(second try)", "(segundo intento)")}</span>` : ""}`
                  : I.T(
                      "Your own materials (no matching activity)",
                      "Sus propios materiales (sin actividad que coincida)",
                    )
              }
            </li>
            <li>
              <span class="lb-step-min">${WEEK_MINUTES.choice}′</span>
              ${I.T("Choice board:", "Tablero:")} <span lang="en">${day.choice}</span>
            </li>
            <li>
              <span class="lb-step-min">${WEEK_MINUTES.exit}′</span>
              ${I.T("Exit ticket:", "Boleto de salida:")} <span lang="en">${day.exit}</span>
            </li>
            ${day.talk ? html`<li class="lb-day-home">${icon("families")} <span lang="en">${day.talk.q[0]}</span> <span class="fine" lang="es">${day.talk.q[1]}</span></li>` : ""}
          </ul>
        </li>`;
      })}
    </ol>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-lb-week-print>
        ${icon("print")} ${I.T("Print the week", "Imprimir la semana")}
      </button>
      <button type="button" class="btn" data-lb-week-family>
        ${icon("families")}
        ${I.T("Print the family note (English and Spanish)", "Imprimir la nota para la familia (inglés y español)")}
      </button>
    </div>
    <p class="fine">
      ${I.T("Want a single lesson instead? Choose Build my lesson above.", "¿Prefiere una sola lección? Elija Crear mi lección arriba.")}
    </p>
  </section>`;
}

/** The printed week plan. */
export function weekPrintHTML(week, { rowById, activityHref, origin }) {
  const s = week.settings;
  const fn = FUNCTIONS[s.fn];
  return html`<article class="lb-print" lang="en">
    <h1>Week plan: ${fn.label[0]} (${week.klu})</h1>
    <p>
      ${bandLabel(s.band)} · ${s.domains.join(", ")} · ${SUPPORT_PROFILES[s.support].name[0]}
      support${s.topic ? ` · Topic: ${s.topic}` : ""}
    </p>
    <p>
      <strong>Content objective:</strong> ${week.objectives.content}<br /><strong
        >Language objective:</strong
      >
      ${week.objectives.language}
    </p>
    <p>
      <strong>Choice board:</strong> ${origin}${boardPath(week)} ·
      <strong>Warm-up:</strong> ${origin}${warmPath(week)}
    </p>
    ${week.days.map((day) => {
      const row = rowById(day.activityId);
      return html`<section class="lb-print-day">
        <h2>${day.name[0]}${day.focus ? ` · ${day.focus}` : " · Create and share"}</h2>
        <ul>
          <li>Warm-up (${WEEK_MINUTES.warmup} min): Daily Language Warm-Up.</li>
          <li>
            Core (${WEEK_MINUTES.core} min):
            ${row ? `${row.title} — ${origin}${activityHref(day.activityId)}` : "your own materials"}
          </li>
          <li>Choice time (${WEEK_MINUTES.choice} min): ${day.choice}</li>
          <li>Exit ticket (${WEEK_MINUTES.exit} min): ${day.exit}</li>
          ${day.talk ? html`<li>Home question: ${day.talk.q[0]} / <span lang="es">${day.talk.q[1]}</span></li>` : ""}
        </ul>
      </section>`;
    })}
  </article>`;
}

/** One page for families: what we practice this week and the five questions to talk about, in both languages. */
export function familyNoteHTML(week, { origin }) {
  const k = KLU_KIDS[week.klu];
  return html`<article class="lb-print">
    <h1>This week in English class · Esta semana en la clase de inglés</h1>
    <p lang="en">
      This week we practice how to <strong>${k.name[0].toLowerCase()}</strong>. ${k.hint[0]} Each
      night, ask your child one question below. Answer in Spanish first if you like, then your child
      tries it in English.
    </p>
    <p lang="es">
      Esta semana practicamos cómo <strong>${k.name[1].toLowerCase()}</strong>. ${k.hint[1]} Cada
      noche, haga a su hijo o hija una de las preguntas de abajo. Pueden responder primero en
      español y luego su hijo o hija intenta en inglés.
    </p>
    <ol>
      ${week.days.map((d) => (d.talk ? html`<li><strong>${d.name[0]} · ${d.name[1]}:</strong> <span lang="en">${d.talk.q[0]}</span><br /><span lang="es">${d.talk.q[1]}</span><br /><em lang="en">${d.talk.starter[0]}</em> / <em lang="es">${d.talk.starter[1]}</em></li>` : ""))}
    </ol>
    <p>Online / En línea: ${origin}${talkPath(week)}</p>
  </article>`;
}

/** One printable student sheet for a built lesson: objectives, word bank, frames at three steps, exit ticket, home talk. */
export function studentPageHTML(lesson, card) {
  const s = lesson.settings;
  const f = framesAround(s);
  const vocab =
    lesson.phases.find((p) => p.key === "vocabulary")?.words || FUNCTIONS[s.fn].words.slice(0, 5);
  const exit = lesson.phases.find((p) => p.key === "exit");
  const frames = (list) =>
    html`<ul>
      ${list.map((x) => html`<li>${x}</li>`)}
    </ul>`;
  return html`<article class="lb-print" lang="en">
    <h1>${FUNCTIONS[s.fn].label[0]}${s.topic ? `: ${s.topic}` : ""}</h1>
    <p>Name: ____________________ Date: __________</p>
    <p>
      <strong>I can</strong> ${lesson.objectives.content.replace(/^I can /, "")}<br /><strong
        >I can</strong
      >
      ${lesson.objectives.language.replace(/^I can /, "")}
    </p>
    <h2>Word bank</h2>
    <p>${vocab.join(" · ")}</p>
    <h2>Sentence frames</h2>
    ${frames(f.mine)}
    ${
      f.easier
        ? html`<h2>Need more help?</h2>
            ${frames(f.easier)}`
        : ""
    }
    ${
      f.harder
        ? html`<h2>Ready for more?</h2>
            ${frames(f.harder)}`
        : ""
    }
    <h2>My answer</h2>
    <p>______________________________________________________________</p>
    <p>______________________________________________________________</p>
    <p>______________________________________________________________</p>
    ${
      exit
        ? html`<h2>Exit ticket</h2>
            <p>${exit.student}</p>
            <p>______________________________________________________________</p>`
        : ""
    }
    ${
      card
        ? html`<h2>Talk at home · Conversa en casa</h2>
            <p>${card.q[0]}<br /><span lang="es">${card.q[1]}</span></p>
            <p><em>${card.starter[0]}</em> / <em lang="es">${card.starter[1]}</em></p>`
        : ""
    }
  </article>`;
}
