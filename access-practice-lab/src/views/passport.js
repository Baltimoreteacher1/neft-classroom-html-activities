// My Passport: stamps per skill, practice streak, milestones, a printable report,
// and a portable progress code (move progress to another device, no account).
// Everything shown here comes from saved records on this device. Stamps count finished activities;
// they are never a proficiency level, a mastery claim or an ACCESS score.
import { crumbsHTML, domainGlyph } from "../components.js";
import { isActivityComplete } from "../attempts.js";
import { evidenceLabel } from "../learning.js";
import { activityStatus } from "../practice-plan.js";
import * as audioStore from "../audio-store.js";
import * as postcardStore from "../postcard-store.js";
import * as postcards from "../postcards.js";
import { ACCESS_LAB_FLAGS } from "../lang/feature-flags.js";
import { exportCodeWithPostcards, importPostcardsFromCode } from "../postcard-code.js";
import { buildShare, encodeShare } from "../lang/share.js";
import { loadLedger } from "../lang/ledger.js";
import { loadStudio } from "../lang/studio.js";
import { downloadText } from "../studio-ui.js";
import { bandDomains, bandRows } from "../content.js";
import { getEngagement, saveEngagement } from "../engagement.js";
import {
  clearAll,
  getStudentName,
  importCode,
  loadRecord,
  practiceDays,
  setStudentName,
  weekStreak,
} from "../store.js";
import { practiceSummary } from "../practice-report.js";
import { journeyHTML, routeProgress } from "../journey.js";
import { checkinHTML, onCheckinClick } from "../checkin-ui.js";
import { familyLetterHTML, howIWorkHTML, onLetterClick } from "./passport-work.js";
import { paperPassportMenu } from "../paper-passport.js";
import { getFamily, tripWeekStreak } from "../family/state.js";
import { i18nFor, makeI18n } from "../i18n.js";
import {
  ART,
  BASE,
  CORE_DOMAINS,
  DOMAIN_META,
  LEVEL_KEYS,
  TIERS,
  announce,
  bandLabel,
  formatDate,
  html,
  icon,
  raw,
  todayISO,
} from "../util.js";

const IGN = raw("data-nsr-ignore");
const RECENT_SHOWN = 6;
const CALENDAR_DAYS = 28;
const STATUS_WORD = {
  draft: ["In progress", "En progreso"],
  retry: ["Try again", "Inténtalo de nuevo"],
};
// Spanish for labels computed in other modules, keyed by their English text (English mode is unchanged).
const ES_EVIDENCE = {
  "Correct without opened help": "Correcta sin abrir ayuda",
  "Correct after help or a retry": "Correcta después de ayuda o de otro intento",
  "Answer attempted · revisit": "Respuesta intentada · vuelve a verla",
  "Draft changed · review needed": "Borrador cambiado · falta revisarlo",
  "Written response · self-reviewed": "Respuesta escrita · revisada por ti",
  "Writing revised · improvement described": "Escritura revisada · mejora descrita",
  "Speaking practiced · self-reported": "Práctica oral · informada por ti",
  "Speaking practiced · recording made in this tab": "Práctica oral · grabación hecha en esta pestaña",
  "Paper practice · self-reported": "Práctica en papel · informada por ti",
  "Earlier practice · support use not recorded": "Práctica anterior · no se registró el uso de apoyos",
};
const ES_STATUS = {
  "Needs Review": "Necesita repaso",
  "Strong Practice": "Práctica sólida",
  "Practice Complete": "Práctica completa",
  "In Progress": "En progreso",
  "Not Started": "Sin empezar",
};
const ES_BAND = {
  "Not yet": "Todavía no",
  "Strong practice response": "Respuesta de práctica sólida",
  "Almost there": "Casi lo logras",
  "Getting started": "Empezando",
};
const ES_ROOM = {
  Listening: "Práctica de escucha",
  Reading: "Práctica de lectura",
  Speaking: "Práctica de expresión oral",
  Writing: "Práctica de escritura",
};

// Set at the top of render(); the helpers below build markup for that render.
let I = makeI18n("en");
const tr = (map, en) => I.T(en, map[en]);
const evid = (result) => {
  const en = evidenceLabel(result);
  return I.T(en, ES_EVIDENCE[en]);
};
const dom = (d) => I.T(d, DOMAIN_META[d]?.es);
const tier = (k) => I.T(TIERS[k].name, TIERS[k].es);
const room = (d) => I.T(DOMAIN_META[d].room, ES_ROOM[d]);

function badges(stats, streak, days, extra) {
  const total = stats.reduce((n, s) => n + s.done, 0);
  const all4 = stats.every((s) => s.done > 0);
  const doneIn = (d) => stats.find((s) => s.domain === d)?.done || 0;
  return [
    { on: extra.awards.includes("review-explorer"), icon: "calendar", name: "Review Explorer", how: "Return to previous work for a spaced review." },
    { on: extra.awards.includes("welcome-back"), icon: "star", name: "Welcome Back", how: "Return to practice after time away." },
    { on: extra.awards.includes("strategy-on-new-task"), icon: "mission", name: "Strategy on a New Task", how: "Try a language strategy in a related new situation." },
    {
      on: total >= 1,
      icon: "star",
      name: I.T("First stamp", "Primer sello"),
      how: I.T("Finish any activity.", "Termina cualquier actividad."),
    },
    {
      on: all4 || extra.awards.includes("all-four-skills"),
      icon: "grid",
      name: I.T("All four skills", "Las cuatro destrezas"),
      how: I.T("Finish one activity in every skill.", "Termina una actividad en cada destreza."),
    },
    {
      on: total >= 10,
      icon: "medal",
      name: I.T("Ten stamps", "Diez sellos"),
      how: I.T("Finish 10 activities.", "Termina 10 actividades."),
    },
    {
      on: total >= 30,
      icon: "launch",
      name: I.T("Thirty stamps", "Treinta sellos"),
      how: I.T("Finish 30 activities.", "Termina 30 actividades."),
    },
    {
      on: streak >= 3,
      icon: "calendar",
      name: I.T("Three-week streak", "Racha de tres semanas"),
      how: I.T("Practice three weeks in a row.", "Practica tres semanas seguidas."),
    },
    {
      on: extra.recordings >= 3,
      icon: "record",
      name: I.T("Brave speaker", "Hablante valiente"),
      how: I.T("Record yourself speaking and check your language in 3 Speaking Studio tries.", "Grábate hablando y revisa tu lenguaje en 3 intentos del Estudio de expresión oral."),
    },
    {
      on: extra.revised || extra.awards.includes("thoughtful-reviser"),
      icon: "retry",
      name: I.T("Thoughtful Reviser", "Revisión reflexiva"),
      how: I.T("Read specific feedback and revise your response.", "Lee comentarios específicos y revisa tu respuesta."),
    },
    {
      on: extra.independentWriting,
      icon: "flag",
      name: I.T("On my own", "Por mi cuenta"),
      how: I.T("Write or speak a first attempt with no frames, word bank or model.", "Escribe o habla en un primer intento sin estructuras, banco de palabras ni modelo."),
    },
    {
      on: extra.sourceUse || extra.awards.includes("evidence-finder"),
      icon: "bookmark",
      name: I.T("Evidence Finder", "Buscador de evidencia"),
      how: I.T("Use details from a source to support your response.", "Usa detalles de una fuente para apoyar tu respuesta."),
    },
    {
      on: extra.patternClosed,
      icon: "detective",
      name: I.T("Case closed", "Caso cerrado"),
      how: I.T("Fix a pattern, then use it correctly in new writing.", "Corrige un patrón y luego úsalo bien en un texto nuevo."),
    },
    {
      on: extra.missionDone,
      icon: "mission",
      name: I.T("Mission complete", "Misión cumplida"),
      how: I.T("Finish all phases of an academic mission.", "Termina todas las fases de una misión académica."),
    },
    {
      on: doneIn("Writing") >= 5,
      icon: "writing",
      name: I.T("Strong writer", "Buen escritor o buena escritora"),
      how: I.T("Finish 5 writing activities.", "Termina 5 actividades de escritura."),
    },
    {
      on: days.length >= 10,
      icon: "clock",
      name: I.T("Ten practice days", "Diez días de práctica"),
      how: I.T("Practice on 10 different days.", "Practica en 10 días distintos."),
    },
    {
      on: total >= 15,
      icon: "road",
      name: I.T("Language Navigator", "Navegante del lenguaje"),
      how: I.T("Finish 15 activities.", "Termina 15 actividades."),
    },
    {
      on: doneIn("Reading") >= 5,
      icon: "reading",
      name: I.T("Active Reader", "Lector activo o lectora activa"),
      how: I.T("Finish 5 reading activities.", "Termina 5 actividades de lectura."),
    },
  ];
}

function stopMilestones(routes, familyStreak) {
  const total = routes.reduce((n, r) => n + r.stopsDone, 0);
  const allSkills = CORE_DOMAINS.every((d) => routes.some((r) => r.domain === d && r.stopsDone > 0));
  return [
    { on: total >= 1, icon: "star", name: ["First stamp", "Primer sello"], how: ["Get your first stop marked.", "Consigue tu primera parada marcada."] },
    { on: allSkills, icon: "grid", name: ["All four skills", "Las cuatro destrezas"], how: ["Get a stop marked in every skill.", "Una parada marcada en cada destreza."] },
    { on: total >= 10, icon: "medal", name: ["Ten stamps", "Diez sellos"], how: ["Get 10 stops marked.", "Consigue 10 paradas marcadas."] },
    { on: total >= 15, icon: "star", name: ["Language Navigator", "Navegante del Lenguaje"], how: ["Get 15 stops marked.", "Consigue 15 paradas marcadas."] },
    { on: familyStreak >= 3, icon: "calendar", name: ["Three-week streak", "Tres semanas seguidas"], how: ["Finish at least one Family Trip stop in each of three consecutive weeks.", "Termina al menos una parada del viaje familiar en cada una de tres semanas consecutivas."] },
    { on: total >= 30, icon: "launch", name: ["Thirty stamps", "Treinta sellos"], how: ["Get 30 stops marked.", "Consigue 30 paradas marcadas."] },
  ].map((b) => ({ ...b, name: I.T(...b.name), how: I.T(...b.how) }));
}

const domainClass = (d) => `d-${String(d).toLowerCase()}`;
const pctOf = (n, of) => (of ? Math.round((n / of) * 100) : 0);

function portfolioHTML(band, saved) {
  const work = saved.filter(
    (row) =>
      row.record.results[row.id] ||
      row.record.notes[row.id] ||
      row.record.reflections[row.id] ||
      row.record.attemptHistory?.[row.id]?.length,
  );
  return html`<section class="pass-portfolio">
    <div class="row-actions no-print">
      <a class="btn" href="${BASE}/passport?grades=${band}"
        >${icon("arrow-left")} ${I.T("Back to Passport", "Volver al Pasaporte")}</a
      ><button type="button" class="btn btn-primary" data-print>
        ${icon("print")} ${I.T("Print my portfolio", "Imprimir mi portafolio")}
      </button>
    </div>
    <header class="pass-portfolio-head">
      <p class="eyebrow">
        ${bandLabel(band)} · ${getStudentName() || I.T("My practice", "Mi práctica")}
      </p>
      <h1 tabindex="-1">${I.T("My practice portfolio", "Mi portafolio de práctica")}</h1>
      <p class="lead">
        ${I.T("Compare your drafts and describe what you changed. This is a record of practice, not a proficiency score. Audio is not included. Keep your printed work private.", "Compara tus borradores y describe lo que cambiaste. Este es un registro de práctica, no un puntaje de dominio. El audio no se incluye. Mantén tu trabajo impreso en privado.")}
      </p>
    </header>
    ${
      work.length
        ? work.map((row) => {
            const id = row.id,
              record = row.record;
            return html`<article
              class="pass-portfolio-entry ${domainClass(row.domain)}"
            >
              <h2>${row.title}</h2>
              <p class="pass-portfolio-meta">
                <span class="pass-pill"
                  >${domainGlyph(row.domain)} ${dom(row.domain)}</span
                >
                <span class="pass-pill">${tier(row.level)}</span>
              </p>
              <p>
                <strong>${I.T("Current evidence:", "Evidencia actual:")}</strong>
                ${record.results[id] ? evid(record.results[id]) : I.T("Draft saved · not yet reviewed", "Borrador guardado · aún sin revisar")}
              </p>
              ${record.results[id]?.date ? html`<p>${I.T("Last review:", "Última revisión:")} ${formatDate(String(record.results[id].date).slice(0, 10))}</p>` : ""}
              ${
                record.drafts[id]?.first
                  ? html`<h3>${I.T("First draft", "Primer borrador")}</h3>
                      <p class="pass-portfolio-response">
                        ${record.drafts[id].first}
                      </p>`
                  : ""
              }
              ${
                record.notes[id]
                  ? html`<h3>
                        ${row.domain === "Speaking" ? I.T("Planning notes", "Notas de planificación") : I.T("Current draft", "Borrador actual")}
                      </h3>
                      <p class="pass-portfolio-response">${record.notes[id]}</p>`
                  : ""
              }
              ${
                record.reflections[id]
                  ? html`<h3>${I.T("What I improved or checked", "Lo que mejoré o revisé")}</h3>
                      <p class="pass-portfolio-response">
                        ${record.reflections[id]}
                      </p>`
                  : ""
              }
              ${
                record.attemptHistory?.[id]?.length
                  ? html`<h3>${I.T("Earlier attempts", "Intentos anteriores")}</h3>
                      <p class="fine">
                        ${I.T("Up to five recent attempt summaries are kept.", "Se guardan hasta cinco resúmenes de intentos recientes.")}
                      </p>
                      <ul>
                        ${record.attemptHistory[id].map((attempt) => html`<li>${formatDate(String(attempt.date).slice(0, 10))} · ${evid(attempt.result)}</li>`)}
                      </ul>`
                  : ""
              }
              <p class="no-print">
                <a
                  href="${BASE}/${row.domain}/${row.level}/${id}?grades=${band}"
                  >${I.T("Review this activity", "Revisar esta actividad")}</a
                >
              </p>
            </article>`;
          })
        : html`<div class="empty-state">
            <img src="${ART}/empty.svg" alt="" width="320" height="240" />
            <h2>${I.T("No saved work yet", "Aún no hay trabajo guardado")}</h2>
            <p>
              ${I.T("Your saved practice will appear here. Start an activity, then return to print your work.", "Tu práctica guardada aparecerá aquí. Empieza una actividad y vuelve para imprimir tu trabajo.")}
            </p>
            <a class="btn btn-primary" href="${BASE}/?grades=${band}"
              >${I.T("Choose an activity", "Elige una actividad")} ${icon("arrow-right")}</a
            >
          </div>`
    }
  </section>`;
}

function domainCard(s, band) {
  const next = s.byLevel.find((l) => l.n < l.of);
  const target = next || s.byLevel[0];
  const name = room(s.domain);
  const statusClass = s.status.toLowerCase().replace(/\s+/g, "-");
  return html`<article
    class="pass-domain ${domainClass(s.domain)}"
    aria-labelledby="pass-${s.domain}"
  >
    <header>
      <span class="pass-tile">${domainGlyph(s.domain)}</span>
      <div>
        <h2 id="pass-${s.domain}">${name}</h2>
        <p class="pass-count">
          <strong>${s.done}</strong> ${I.T(`of ${s.total} activities finished`, `de ${s.total} actividades terminadas`)}
        </p>
        <span class="practice-status is-${statusClass}">${tr(ES_STATUS, s.status)}</span>
      </div>
    </header>
    <div class="bar" aria-hidden="true">
      <i style="width:${pctOf(s.done, s.total)}%"></i>
    </div>
    ${s.possible ? html`<p class="fine pass-score">${I.T("Practice score:", "Puntaje de práctica:")} <strong>${s.score}/${s.possible}</strong> · ${tr(ES_BAND, s.scoreBand)}</p>` : ""}
    <ul class="pass-levels">
      ${s.byLevel.map(
        (l) =>
          html`<li>
            <span class="pass-level-name">${tier(l.level)}</span
            ><span class="bar mini" aria-hidden="true"
              ><i style="width:${pctOf(l.n, l.of)}%"></i></span
            ><span class="pass-level-n"
              >${I.T(`${l.n} of ${l.of}`, `${l.n} de ${l.of}`)}<span class="visually-hidden">
                ${I.T("stamps", "sellos")}</span
              ></span
            >
          </li>`,
      )}
    </ul>
    ${target ? html`<a class="btn small pass-go" href="${BASE}/${s.domain}/${target.level}?grades=${band}">${next ? (s.done ? I.T(`Continue ${s.domain}`, `Continuar: ${dom(s.domain)}`) : I.T(`Start ${s.domain}`, `Empezar: ${dom(s.domain)}`)) : I.T(`Review ${s.domain}`, `Repasar: ${dom(s.domain)}`)} ${icon("arrow-right")}</a>` : ""}
  </article>`;
}

function calendarHTML(days) {
  const marked = new Set(days);
  const cells = [];
  for (let i = CALENDAR_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = todayISO(d);
    cells.push({ iso, on: marked.has(iso), n: d.getDate(), today: i === 0 });
  }
  const count = cells.filter((c) => c.on).length;
  return html`<section class="pass-card" aria-labelledby="passCal">
    <h2 id="passCal">${icon("calendar")} ${I.T("Practice calendar", "Calendario de práctica")}</h2>
    <p class="fine">
      ${count ? I.T(`You practiced on ${count} of the last ${CALENDAR_DAYS} days.`, `Practicaste ${count} de los últimos ${CALENDAR_DAYS} días.`) : I.T(`No practice recorded in the last ${CALENDAR_DAYS} days.`, `No hay práctica registrada en los últimos ${CALENDAR_DAYS} días.`)}
      ${I.T("Each square is one day, oldest first.", "Cada cuadro es un día, del más antiguo al más reciente.")}
    </p>
    <ol class="pass-cal">
      ${cells.map((c) => html`<li class="${c.on ? "is-on" : ""} ${c.today ? "is-today" : ""}"><span class="visually-hidden">${formatDate(c.iso, { weekday: "long", month: "long", day: "numeric" })}${c.today ? I.T(" (today)", " (hoy)") : ""}${c.on ? I.T(": practiced", ": practicaste") : I.T(": no practice", ": sin práctica")}</span><span aria-hidden="true">${c.n}</span></li>`)}
    </ol>
    ${days.length ? html`<p class="fine">${I.T("Last practice:", "Última práctica:")} ${formatDate(days[0], { weekday: "long", month: "long", day: "numeric" })}</p>` : ""}
  </section>`;
}

function continueHTML(saved, band) {
  const open = saved
    .map((row) => ({ row, status: activityStatus(row.record, row.id) }))
    .filter((x) => x.status === "draft" || x.status === "retry")
    .slice(0, 4);
  return html`<section class="pass-card" aria-labelledby="passContinue">
    <h2 id="passContinue">${icon("play")} ${I.T("Pick up where you left off", "Continúa donde lo dejaste")}</h2>
    ${
      open.length
        ? html`<ul class="pass-open">
            ${open.map(
              ({ row, status }) =>
                html`<li class="${domainClass(row.domain)}">
                  <span class="pass-tile sm">${domainGlyph(row.domain)}</span
                  ><span
                    ><a href="${activityLink(row, band)}">${row.title}</a
                    ><span class="fine"
                      >${dom(row.domain)} · ${I.T(...STATUS_WORD[status])}</span
                    ></span
                  >
                </li>`,
            )}
          </ul>`
        : html`<p class="fine">
              ${I.T("Nothing is waiting. Choose a skill room to start something new.", "No hay nada pendiente. Elige una sala de destrezas para empezar algo nuevo.")}
            </p>
            <a class="btn small" href="${BASE}/?grades=${band}"
              >${I.T("Choose a skill", "Elige una destreza")} ${icon("arrow-right")}</a
            >`
    }
  </section>`;
}

const activityLink = (row, band) =>
  `${BASE}/${row.domain}/${row.level}/${row.id}?grades=${band}`;

function recentHTML(evidence, band) {
  if (!evidence.length)
    return html`<div class="empty-state pass-empty">
      <img src="${ART}/empty.svg" alt="" width="320" height="240" />
      <h3>${I.T("Your practice record starts here", "Tu registro de práctica empieza aquí")}</h3>
      <p>${I.T("Complete a meaningful attempt to begin your practice record.", "Completa un intento significativo para empezar tu registro de práctica.")}</p>
      <a class="btn btn-primary" href="${BASE}/?grades=${band}"
        >${I.T("Start practicing", "Empieza a practicar")} ${icon("arrow-right")}</a
      >
    </div>`;
  const row = (r) =>
    html`<li class="pass-ev ${domainClass(r.domain)}">
      <span class="pass-tile sm">${domainGlyph(r.domain)}</span
      ><span class="pass-ev-body"
        ><a href="${activityLink(r, band)}">${r.title}</a
        ><span class="fine"
          >${dom(r.domain)} · ${tier(r.level)} ·
          ${evid(r.result)}</span
        ></span
      ><time
        class="pass-ev-date"
        datetime="${String(r.result.date).slice(0, 10)}"
        >${formatDate(String(r.result.date).slice(0, 10))}</time
      >
    </li>`;
  const shown = evidence.slice(0, 20);
  return html`<ul class="pass-evlist">
      ${shown.slice(0, RECENT_SHOWN).map(row)}
    </ul>
    ${
      shown.length > RECENT_SHOWN
        ? html`<details class="pass-more">
            <summary>${I.T(`Show ${shown.length - RECENT_SHOWN} more`, `Mostrar ${shown.length - RECENT_SHOWN} más`)}</summary>
            <ul class="pass-evlist">
              ${shown.slice(RECENT_SHOWN).map(row)}
            </ul>
          </details>`
        : ""
    }
    <p class="fine">
      ${I.T(`Showing ${shown.length} most recent practice records. Open an activity to review your work.`, `Se muestran los ${shown.length} registros de práctica más recientes. Abre una actividad para revisar tu trabajo.`)}
    </p>`;
}

const nextStep = (domain) =>
  domain === "Listening"
    ? I.T("Replay the key part and name one signal word.", "Repite la parte clave y nombra una palabra clave.")
    : domain === "Reading"
      ? I.T("Point to a sentence, table value, or chart detail that supports your answer.", "Señala una oración, un valor de la tabla o un detalle del gráfico que apoye tu respuesta.")
      : domain === "Speaking"
        ? I.T("Name the topic, add a detail, and explain your thinking.", "Nombra el tema, agrega un detalle y explica tu razonamiento.")
        : I.T("Connect two ideas and add one specific detail.", "Conecta dos ideas y agrega un detalle específico.");

export async function render(ctx) {
  I = i18nFor(ctx);
  const band = ctx.band;
  const rows = await bandRows(band);
  const saved = rows.map((row) => ({
    ...row,
    record: loadRecord(band, row.domain, row.level),
  }));
  if (new URLSearchParams(location.search).has("portfolio"))
    return { title: I.S("My practice portfolio", "Mi portafolio de práctica"), html: portfolioHTML(band, saved) };
  const domains = await bandDomains(band);
  const stats = CORE_DOMAINS.filter((d) => domains[d]).map((d) => {
    let done = 0;
    let total = 0;
    const practiceRows = [];
    const byLevel = LEVEL_KEYS.filter((k) => domains[d].levels[k]).map((k) => {
      const ids = new Set(domains[d].levels[k].activities.map((r) => r[0]));
      const record = loadRecord(band, d, k);
      const n = [...ids].filter((id) => isActivityComplete(record, id)).length;
      done += n;
      total += ids.size;
      for (const [id, result] of Object.entries(record.results)) {
        practiceRows.push([`${k}:${id}`, result]);
      }
      return { level: k, n, of: ids.size };
    });
    const summary = practiceSummary(practiceRows, done, total);
    return { domain: d, done, total, byLevel, color: domains[d].color, ...summary };
  });
  const evidence = saved
    .map((row) => ({ ...row, result: row.record.results[row.id] }))
    .filter(
      (row) =>
        row.result?.date &&
        row.result.meaningful !== false &&
        row.result.words !== 0 &&
        row.result.practiced !== false,
    )
    .sort((a, b) => b.result.date.localeCompare(a.result.date));
  const days = practiceDays();
  const streak = weekStreak(days);
  const engagement = getEngagement(ctx.prefs);
  const ledger = loadLedger();
  const studio = loadStudio();
  const mine = ledger.entries.filter((e) => e.band === band);
  const extra = {
    awards: engagement.awards,
    recordings: mine.filter((e) => e.src === "speaking").length,
    revised: mine.some((e) => e.kind === "revision"),
    independentWriting: mine.some(
      (e) =>
        e.kind === "first" &&
        e.stage === "independent" &&
        ["writing", "speaking"].includes(e.src),
    ),
    sourceUse: mine.some((e) => (e.m?.cites || 0) >= 2),
    patternClosed: mine.some(
      (e) => e.src === "detective" && e.kind === "transfer" && e.m?.ok,
    ),
    missionDone: Object.values(studio.missions).some((m) => m.done),
  };
  const revisions = mine.filter((e) => e.kind === "revision").length;
  const retried = saved.filter(
    (row) => row.record.attemptHistory?.[row.id]?.length,
  ).length;
  const kept = await audioStore.list();
  const postcardsHTML = ACCESS_LAB_FLAGS.cameraPostcardsEnabled ? await postcards.albumHTML(I) : "";
  const list = badges(stats, streak, days, extra);
  const routes = routeProgress(saved);
  const stopBadges = stopMilestones(routes, tripWeekStreak(getFamily(ctx.prefs).tripWeeks));
  const earned = list.filter((b) => b.on).length;
  const name = getStudentName();
  const stamps = stats.reduce((n, s) => n + s.done, 0);
  const totalActs = stats.reduce((n, s) => n + s.total, 0);
  const scoredStats = stats.filter((s) => s.percent != null).sort((a, b) => b.percent - a.percent);
  const strongest = scoredStats[0] || null;
  const nextDomain = stats.find((s) => s.status === "Needs Review") || [...stats].filter((s) => s.done < s.total).sort((a, b) => (a.percent ?? -1) - (b.percent ?? -1))[0] || null;
  const pathway = CORE_DOMAINS.map((d) => `${d} ${ctx.prefs.tiers?.[d] || "A"}`).join(" · ");
  return {
    title: I.S("My Passport", "Pasaporte"),
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/`],
        [I.S("My Passport", "Pasaporte"), null],
      ])}
      <section class="pass-page">
        <header class="pass-hero ${engagement.cosmetic ? `cosmetic-${engagement.cosmetic}` : ""}">
          <div class="pass-hero-copy">
            <p class="eyebrow">${I.T(`ACCESS Practice Passport · ${bandLabel(band)}`, `Pasaporte de práctica ACCESS · ${bandLabel(band)}`)}</p>
            <h1 tabindex="-1">${name ? I.T(`${name}'s Passport`, `Pasaporte de ${name}`) : I.T("My Passport", "Pasaporte")}</h1>
            <p class="lead">
              ${I.T("Your finished practice, saved on this device. Stamps show how much you practiced. They are not an ACCESS score or a language level.", "Tu práctica terminada, guardada en este dispositivo. Los sellos muestran cuánto practicaste. No son un puntaje de ACCESS ni un nivel de lenguaje.")}
            </p>
            ${paperPassportMenu(I)}
            <label class="field pass-name"
              ><span>${I.T("My nickname or initials (not my full name)", "Mi apodo o iniciales (no mi nombre completo)")}</span
              ><input
                type="text"
                data-name
                value="${name}"
                maxlength="40"
                autocomplete="off"
                ${IGN}
            /></label>
          </div>
          <img class="pass-art" src="${ART}/progress-passport.svg" alt="" width="360" height="270" />
          <ul class="pass-stats">
            <li><span class="pass-stat-ico">${icon("check")}</span><span class="pass-stat-label">${I.T("Stamps", "Sellos")}</span><strong class="pass-stat-value">${stamps}</strong><span class="pass-stat-note">${I.T(`of ${totalActs} activities`, `de ${totalActs} actividades`)}</span></li>
            <li><span class="pass-stat-ico">${icon("calendar")}</span><span class="pass-stat-label">${I.T("Week streak", "Racha semanal")}</span><strong class="pass-stat-value">${streak}</strong><span class="pass-stat-note">${I.T(`${streak === 1 ? "week" : "weeks"} in a row`, `${streak === 1 ? "semana seguida" : "semanas seguidas"}`)}</span></li>
            <li><span class="pass-stat-ico">${icon("clock")}</span><span class="pass-stat-label">${I.T("Practice days", "Días de práctica")}</span><strong class="pass-stat-value">${days.length}</strong><span class="pass-stat-note">${days.length ? I.T(`last ${formatDate(days[0])}`, `última: ${formatDate(days[0])}`) : I.T("none yet", "aún ninguno")}</span></li>
          </ul>
        </header>

        <section>
          <section class="panel practice-report" aria-labelledby="practiceReportTitle">
            <div class="practice-report-head"><div><p class="eyebrow">${formatDate(todayISO())} · ${bandLabel(band)} · ${pathway}</p><h2 id="practiceReportTitle">${I.T("ACCESS-style practice report", "Informe de práctica estilo ACCESS")}</h2></div>
              <div class="row-actions no-print"><button type="button" class="btn small" data-refresh-report>${icon("retry")} ${I.T("Update My Report", "Actualizar mi informe")}</button><button type="button" class="btn btn-primary small" data-print>${icon("print")} ${I.T("Print Practice Report", "Imprimir informe de práctica")}</button></div>
            </div>
            <p>${I.T("Student:", "Estudiante:")} <strong>${name || I.T("My practice", "Mi práctica")}</strong> · ${I.T("Teacher review recommended for speaking and writing.", "Se recomienda la revisión del docente para expresión oral y escritura.")}</p>
            <p class="fine">${I.T("Strongest practice evidence:", "Evidencia de práctica más sólida:")} <strong>${strongest ? html`${room(strongest.domain)} · ${tr(ES_BAND, strongest.scoreBand)}` : I.T("Not enough scored practice yet", "Aún no hay suficiente práctica con puntaje")}</strong>. ${I.T("Suggested next domain:", "Destreza sugerida a continuación:")} <strong>${nextDomain ? room(nextDomain.domain) : I.T("Choose a new task", "Elige una tarea nueva")}</strong>.</p>
            <ul class="practice-next-steps">${stats.map((s) => html`<li><strong>${room(s.domain)} · ${tr(ES_STATUS, s.status)}</strong>${s.possible ? html`<span>${I.T(`Practice score: ${s.score} of ${s.possible} · ${s.scoreBand}`, `Puntaje de práctica: ${s.score} de ${s.possible} · ${ES_BAND[s.scoreBand] || s.scoreBand}`)}</span>` : html`<span>${I.T("No scored practice saved yet.", "Aún no hay práctica con puntaje guardada.")}</span>`}<span><strong>${I.T("Next step:", "Siguiente paso:")}</strong> ${nextStep(s.domain)}</span></li>`)}</ul>
            <p class="practice-disclaimer">${I.T("This is classroom practice feedback, not an official WIDA ACCESS score. Practice scores summarize visible task checks across different activities and are not proficiency levels or placement decisions.", "Estos son comentarios de práctica de clase, no un puntaje oficial de WIDA ACCESS. Los puntajes de práctica resumen las verificaciones visibles de tareas en distintas actividades y no son niveles de dominio ni decisiones de ubicación.")}</p>
          </section>
          <details class="panel teacher-score-guide"><summary>${I.T("Teacher quick-use scoring guide", "Guía rápida de puntuación para docentes")}</summary><div><p><strong>${I.T("Not yet:", "Todavía no:")}</strong> ${I.T("Re-model one strategy and let the learner try a similar item with support.", "Vuelva a modelar una estrategia y deje que el estudiante pruebe un ítem similar con apoyo.")}</p><p><strong>${I.T("Getting started:", "Empezando:")}</strong> ${I.T("Name one signal that is working, then practice one missing step in a short conference.", "Nombre una señal que esté funcionando y luego practique un paso que falte en una conferencia breve.")}</p><p><strong>${I.T("Almost there:", "Casi lo logra:")}</strong> ${I.T("Ask the learner to explain a choice or add evidence, then try a fresh task independently.", "Pida al estudiante que explique una elección o agregue evidencia, y luego que intente una tarea nueva de forma independiente.")}</p><p><strong>${I.T("Strong practice response:", "Respuesta de práctica sólida:")}</strong> ${I.T("Confirm the evidence with the learner and offer a transfer task or peer explanation.", "Confirme la evidencia con el estudiante y ofrezca una tarea de transferencia o una explicación a un compañero.")}</p><p>${I.T("For a small group, model a short example, practice together, and close with one independent check. Bands describe this classroom practice only; teacher review is recommended and they are not official ACCESS scoring.", "En un grupo pequeño, modele un ejemplo breve, practiquen juntos y cierre con una verificación independiente. Las bandas describen solo esta práctica de clase; se recomienda la revisión del docente y no son una puntuación oficial de ACCESS.")}</p></div></details>
          ${journeyHTML(I, routes)}
          ${checkinHTML(I, routes)}
          <div class="pass-heading-row"><h2 id="passSkills" class="pass-heading">${I.T("Practice by skill", "Práctica por destreza")}</h2></div>
          <div class="pass-domains">
            ${stats.map((s) => domainCard(s, band))}
          </div>
        </section>

        <div class="pass-split">
          <section class="panel pass-evidence" aria-labelledby="passShows">
            <h2 id="passShows">${I.T("What my practice shows", "Lo que muestra mi práctica")}</h2>
            <p class="pass-note">
              ${I.T("Stamps show completed practice, not mastery or an ACCESS score. A correct answer after help, a reviewed draft, spoken practice, and a worksheet are different kinds of evidence. Older records may not include support details.", "Los sellos muestran práctica terminada, no dominio ni un puntaje de ACCESS. Una respuesta correcta después de recibir ayuda, un borrador revisado, la práctica oral y una hoja de trabajo son distintos tipos de evidencia. Es posible que los registros anteriores no incluyan detalles de apoyo.")}
            </p>
            ${recentHTML(evidence, band)}
          </section>
          <div class="pass-side">
            ${calendarHTML(days)} ${continueHTML(saved, band)}
            ${howIWorkHTML(I, { entries: mine, records: saved })}
            <section class="pass-card" aria-labelledby="passRevise">
              <h2 id="passRevise">
                ${icon("retry")} ${I.T("Revisions and earlier tries", "Revisiones e intentos anteriores")}
              </h2>
              <dl class="pass-mini">
                <div>
                  <dt>${I.T("Revisions after feedback", "Revisiones después de comentarios")}</dt>
                  <dd>${revisions}</dd>
                </div>
                <div>
                  <dt>${I.T("Activities with earlier tries kept", "Actividades con intentos anteriores guardados")}</dt>
                  <dd>${retried}</dd>
                </div>
              </dl>
              <a
                class="btn small no-print"
                href="${BASE}/passport?grades=${band}&portfolio=1"
                >${icon("list")} ${I.T("Review my portfolio", "Revisar mi portafolio")}</a
              >
            </section>
          </div>
        </div>

        ${postcardsHTML}

        <section aria-labelledby="passMiles">
          <section class="pass-cosmetics" aria-labelledby="passCosmeticsTitle"><h2 id="passCosmeticsTitle">Passport decorations</h2><p class="fine">Earn XP for meaningful practice, then choose a small decoration. Every lesson and support stays available either way.</p><p class="pass-xp"><strong>${engagement.xp} XP</strong> · participation points, not a proficiency score.</p><div class="pass-cosmetic-list">${[{ id: "trail-glow", need: 25, label: "Trail glow", icon: "worlds" }, { id: "map-pin", need: 60, label: "Golden map pin", icon: "road" }, { id: "word-wings", need: 100, label: "Word wings", icon: "writing" }].map((item) => html`<button type="button" class="btn" data-equip-cosmetic="${item.id}" ${engagement.xp < item.need ? "disabled" : ""} aria-pressed="${engagement.cosmetic === item.id}">${icon(item.icon)} ${item.label} · ${item.need} XP ${engagement.xp >= item.need ? (engagement.cosmetic === item.id ? "· Selected" : "· Unlocked") : "· Locked"}</button>`)}</div></section>
          <div class="pass-heading-row">
            <h2 id="passMiles" class="pass-heading">${I.T("Milestones", "Logros")}</h2>
            <p class="fine">
              ${I.T(`${earned} of ${list.length} earned. Milestones mark practice habits, not language level.`, `${earned} de ${list.length} logrados. Los logros marcan hábitos de práctica, no el nivel de lenguaje.`)}
            </p>
          </div>
          <ul class="pass-badges">
            ${list.map((b) => html`<li class="${b.on ? "is-on" : ""}"><span class="pass-badge-icon">${icon(b.on ? b.icon : b.icon)}</span><strong>${b.name}</strong><span class="pass-badge-how">${b.on ? html`${icon("check")} ${I.T("Earned", "Logrado")}` : b.how}</span></li>`)}
            ${stopBadges.map((b) => html`<li class="${b.on ? "is-on" : ""}"><span class="pass-badge-icon">${icon(b.icon)}</span><strong>${b.name}</strong><span class="pass-badge-how">${b.on ? html`${icon("check")} ${I.T("Earned", "Logrado")}` : b.how}</span></li>`)}
          </ul>
        </section>

        <div class="row-actions no-print pass-actions">
          <a class="btn btn-secondary" href="${BASE}/growth?grades=${band}"
            >${icon("growth")} ${I.T("View Language Growth Map", "Ver mi mapa de crecimiento del lenguaje")}</a
          >
          <button type="button" class="btn btn-primary" data-print>
            ${icon("print")} ${I.T("Print Practice Report", "Imprimir informe de práctica")}
          </button>
          <a class="btn" href="${BASE}/passport?grades=${band}&portfolio=1"
            >${icon("list")} ${I.T("Review and print my portfolio", "Revisar e imprimir mi portafolio")}</a
          >
        </div>
      </section>

      ${familyLetterHTML(I, { name, counts: Object.fromEntries(stats.map((s) => [s.domain, s.done])), entries: mine, records: saved })}

      <div class="pass-split pass-split-even no-print">
        <section class="panel pass-share" aria-labelledby="shareTitle">
          <h2 id="shareTitle">${icon("mail")} ${I.T("Send my work to my teacher", "Enviar mi trabajo a mi docente")}</h2>
          <p>
            ${I.T("Choose what to share. The code may contain your writing, speaking transcripts, mission and detective results, reading/listening practice results, and postcards you marked “Keep for my teacher.” It has no email, school ID or recordings. Only your alias is included. Keep the code private and give it only to your teacher.", "Elige qué compartir. El código puede incluir tu escritura, las transcripciones de lo que dijiste, los resultados de misiones y de detective, los resultados de práctica de lectura y escucha, y las postales que marcaste “Guardar para mi docente”. No incluye correo electrónico, identificación escolar ni grabaciones. Solo se incluye tu alias. Mantén el código en privado y dáselo solo a tu docente.")}
          </p>
          <label class="field"
            ><span
              >${I.T("My alias for my teacher (initials or a class nickname, not my full name)", "Mi alias para mi docente (iniciales o un apodo de clase, no mi nombre completo)")}</span
            ><input
              type="text"
              data-share-alias
              value="${name}"
              maxlength="40"
              autocomplete="off"
              ${IGN}
          /></label>
          <fieldset class="pass-options">
            <legend>${I.T("What to include", "Qué incluir")}</legend>
            ${[
              ["writing", I.T("Writing drafts and reflections", "Borradores y reflexiones de escritura")],
              ["speaking", I.T("Speaking transcripts and reviews", "Transcripciones y revisiones de expresión oral")],
              ["missions", I.T("Mission results", "Resultados de misiones")],
              ["detective", I.T("Error Detective results", "Resultados de Detective de errores")],
              ["readingListening", I.T("Reading and listening practice results", "Resultados de práctica de lectura y escucha")],
            ].map(
              ([k, l]) =>
                html`<label class="pass-check"
                  ><input
                    type="checkbox"
                    data-share-opt="${k}"
                    checked
                    ${IGN}
                  /><span>${l}</span></label
                >`,
            )}
          </fieldset>
          <div class="row-actions">
            <button type="button" class="btn btn-primary" data-share-copy>
              ${icon("copy")} ${I.T("Copy share code", "Copiar código para compartir")}</button
            ><button type="button" class="btn" data-share-file>
              ${icon("download")} ${I.T("Download share file", "Descargar archivo para compartir")}
            </button>
          </div>
          <p class="fine" data-share-status role="status"></p>
          <h3>${I.T("Recordings kept on this device", "Grabaciones guardadas en este dispositivo")}</h3>
          ${
            kept.length
              ? html`<ul class="pass-rec">
                    ${kept.map((k) => html`<li><span>${k.task} · ${k.seconds}s · ${String(k.t).slice(0, 10)}</span><button type="button" class="ghost danger small" data-del-audio="${k.id}">${I.T("Delete", "Eliminar")}</button></li>`)}
                  </ul>
                  <button
                    type="button"
                    class="ghost danger small"
                    data-del-audio-all
                  >
                    ${I.T("Delete all recordings", "Eliminar todas las grabaciones")}
                  </button>`
              : html`<p class="fine">
                  ${I.T("None. Recordings are only kept if you press “Keep for my teacher” in the Speaking Studio. You can always download a recording instead.", "Ninguna. Las grabaciones solo se guardan si presionas “Guardar para mi docente” en el Estudio de expresión oral. Siempre puedes descargar una grabación en su lugar.")}
                </p>`
          }
        </section>

        <section class="panel pass-backup" aria-labelledby="backupTitle">
          <h2 id="backupTitle">${icon("save")} ${I.T("Use another computer", "Usar otra computadora")}</h2>
          <p>
            ${I.T("Your written answers, planning notes, checklists, first drafts, revision reflections and practice records are saved in this browser. Clearing browser data can remove them. Audio recordings are not included. Postcards are included only when you mark “Keep for my teacher.” Copy the full ACCESS1 progress code, then paste it here on another device. It contains your work, so keep it private. No name is required to practice. On a shared device, export your own work before using the clear option; do not clear another student’s work. Site Save/Resume short codes are a separate system; for a portable lab backup use this full progress code.", "Tus respuestas escritas, notas de planificación, listas de verificación, primeros borradores, reflexiones de revisión y registros de práctica se guardan en este navegador. Borrar los datos del navegador puede eliminarlos. Las grabaciones de audio no se incluyen. Copia el código de progreso ACCESS1 completo y pégalo aquí en otro dispositivo. Contiene tu trabajo, así que mantenlo en privado. Las postales se incluyen solo si marcas “Guardar para mi docente”. No se necesita un nombre para practicar. En un dispositivo compartido, exporta tu propio trabajo antes de usar la opción de borrar; no borres el trabajo de otro estudiante. Los códigos cortos de Guardar y continuar del sitio son un sistema aparte; para una copia de seguridad portátil del laboratorio usa este código de progreso completo.")}
          </p>
          <p>
            ${I.T("Loading a backup keeps work already on this device and adds missing activities. It also keeps existing test attempts and settings. To use a different version of an activity, open the backup in a separate browser profile.", "Cargar una copia de seguridad conserva el trabajo que ya está en este dispositivo y agrega las actividades que faltan. También conserva los intentos de prueba y los ajustes existentes. Para usar una versión distinta de una actividad, abre la copia de seguridad en un perfil de navegador separado.")}
          </p>
          <ol class="pass-steps">
            <li>
              <span class="pass-step-n">1</span>
              <div>
                <strong>${I.T("On the old device", "En el dispositivo anterior")}</strong>
                <div class="row-actions">
                  <button type="button" class="btn" data-export>
                    ${icon("copy")} ${I.T("Copy my progress code", "Copiar mi código de progreso")}
                  </button>
                </div>
              </div>
            </li>
            <li>
              <span class="pass-step-n">2</span>
              <div>
                <strong>${I.T("On the new device", "En el dispositivo nuevo")}</strong>
                <label class="field"
                  ><span>${I.T("Paste a progress code", "Pega un código de progreso")}</span
                  ><textarea
                    rows="3"
                    data-import-text
                    placeholder="ACCESS1.…"
                    ${IGN}
                  ></textarea>
                </label>
                <div class="row-actions">
                  <button type="button" class="btn btn-primary" data-import>
                    ${icon("download")} ${I.T("Load progress", "Cargar progreso")}
                  </button>
                </div>
              </div>
            </li>
          </ol>
          <div class="pass-danger">
            <p class="fine">
              ${I.T("Starting over on a shared device? This removes saved progress from this browser and cannot be undone.", "¿Empiezas de nuevo en un dispositivo compartido? Esto elimina el progreso guardado de este navegador y no se puede deshacer.")}
            </p>
            <button type="button" class="ghost danger" data-clear>
              ${I.T("Clear My Practice Data", "Borrar mis datos de práctica")}
            </button>
          </div>
        </section>
      </div>`,
  };
}
export function unmount() { postcards.unmount(); postcards.releaseAlbumUrls(); }
export function onChange(e, ctx) { if (ACCESS_LAB_FLAGS.cameraPostcardsEnabled) postcards.onChange(e, ctx.rerender); }
export function onInput(e) {
  if (e.target.matches("[data-name]")) setStudentName(e.target.value.trim());
}

async function shareBundle(ctx) {
  const alias = document.querySelector("[data-share-alias]")?.value || "";
  const include = Object.fromEntries([...document.querySelectorAll("[data-share-opt]")].map((el) => [el.dataset.shareOpt, el.checked]));
  const postcards = ACCESS_LAB_FLAGS.cameraPostcardsEnabled ? await postcardStore.shared() : [];
  return buildShare({ alias, band: ctx.band, include, postcards });
}

export async function onClick(e, ctx) {
  const I = i18nFor(ctx);
  if (ACCESS_LAB_FLAGS.cameraPostcardsEnabled && postcards.onClick(e, I, ctx.rerender)) return true;
  if (await onCheckinClick(e, ctx, I)) return true;
  if (onLetterClick(e, ctx)) return true;
  const t = e.target;
  const equip = t.closest("[data-equip-cosmetic]");
  if (equip) {
    const state = getEngagement(ctx.prefs);
    const need = { "trail-glow": 25, "map-pin": 60, "word-wings": 100 }[equip.dataset.equipCosmetic];
    if (need && state.xp >= need) { saveEngagement(ctx, { cosmetic: equip.dataset.equipCosmetic }); ctx.rerender(); }
    return true;
  }
  if (t.closest("[data-refresh-report]")) {
    announce(I.S("Practice report updated from saved work on this device.", "Informe de práctica actualizado con el trabajo guardado en este dispositivo."));
    ctx.rerender();
    return true;
  }
  const status = document.querySelector("[data-share-status]");
  if (t.closest("[data-share-copy]")) {
    const code = encodeShare(await shareBundle(ctx));
    try {
      await navigator.clipboard.writeText(code);
      if (status) status.textContent = I.S(`Share code copied (${Math.ceil(code.length / 1000)} KB). Paste it into your teacher's dashboard or message.`, `Código para compartir copiado (${Math.ceil(code.length / 1000)} KB). Pégalo en el panel de tu docente o en un mensaje.`);
    } catch {
      if (status) status.textContent = I.S("Copy failed. Use “Download share file” instead.", "No se pudo copiar. Usa “Descargar archivo para compartir”.");
    }
    return true;
  }
  if (t.closest("[data-share-file]")) {
    {
      const b = await shareBundle(ctx);
      downloadText(`access-${b.alias.replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 24)}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(b), "application/json");
    }
    if (status) status.textContent = I.S("File downloaded. Give it to your teacher.", "Archivo descargado. Entrégaselo a tu docente.");
    return true;
  }
  const del = t.closest("[data-del-audio]");
  if (del) {
    await audioStore.remove(del.dataset.delAudio);
    announce(I.S("Recording deleted.", "Grabación eliminada."));
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-del-audio-all]")) {
    await audioStore.clearAll();
    announce(I.S("All kept recordings deleted.", "Se eliminaron todas las grabaciones guardadas."));
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-export]")) {
    const code = await exportCodeWithPostcards();
    try {
      await navigator.clipboard.writeText(code);
      announce(I.S("Progress code copied. Paste it on your other device.", "Código de progreso copiado. Pégalo en tu otro dispositivo."));
    } catch {
      const box = document.querySelector("[data-import-text]");
      if (box) {
        box.value = code;
        box.select();
      }
      announce(I.S("Copy the code from the box.", "Copia el código del cuadro."));
    }
    return;
  }
  if (t.closest("[data-import]")) {
    try {
      const text = document.querySelector("[data-import-text]")?.value;
      const n = importCode(text);
      const photoCount = await importPostcardsFromCode(text);
      announce(I.S(`Backup checked (${n} records and ${photoCount} postcards loaded). Work already on this device was kept; missing activities were added.`, `Copia de seguridad revisada (${n} registros y ${photoCount} postales cargados). Se conservó el trabajo que ya estaba en este dispositivo y se agregaron las actividades que faltaban.`));
      ctx.rerender();
    } catch (err) {
      announce(err.message || I.S("That code did not work.", "Ese código no funcionó."));
    }
    return;
  }
  if (t.closest("[data-clear]")) {
    if (
      !window.confirm(
        I.S("Clear all ACCESS Practice Lab progress on this device? This cannot be undone.", "¿Borrar todo el progreso del Laboratorio de práctica ACCESS en este dispositivo? No se puede deshacer."),
      )
    )
      return;
    clearAll();
    await audioStore.clearAll();
    await postcardStore.clearAll();
    announce(I.S("Progress cleared.", "Progreso borrado."));
    ctx.rerender();
  }
}
