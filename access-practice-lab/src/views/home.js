// Home: one screen — band, the four skill rooms with a "Next" button each,
// this week's Road to ACCESS stop, and doors to tests, passport and families.
import { bandSwitchHTML } from "../components.js";
import { bandDomains, bandRows, findActivity, loadRoad, loadShared } from "../content.js";
import { allRecords, loadRecord, needsReview, weekStreak } from "../store.js";
import { practiceSummary } from "../practice-report.js";
import {
  ART,
  BASE,
  CORE_DOMAINS,
  DOMAIN_META,
  TIERS,
  formatDate,
  html,
  icon,
  testingWindowPhase,
  raw,
} from "../util.js";
import { estimateMinutes } from "../learning.js";
import { loadStudioIndex } from "../content.js";
import { recommendTasks } from "../lang/adapt.js";
import { KEY_LANGUAGE_USES } from "../lang/purpose.js";
import { kluHTML } from "./home-klu.js";
import { heroClick, heroStageHTML } from "./home-hero.js";
import { EXHIBITIONS } from "../content/exhibition.js";
import { bandState, progress as exhibitionProgress } from "../lang/exhibition.js";
import { loadExhibition } from "./exhibition.js";
import { loadLedger } from "../lang/ledger.js";
import { loadStudio } from "../lang/studio.js";
import { buildPracticePlan, STATUS_REASON } from "../practice-plan.js";
import { i18nFor } from "../i18n.js";
import { currentWeek } from "./road.js";
import { daysThisWeek, finishSession, getEngagement, saveEngagement, sessionHref, startSession } from "../engagement.js";
import { trimToMinutes } from "../family/plan.js";
import { journeyHeroHTML } from "../journey/ui/pages-hero.js";
import { loadJourneyData } from "../journey/ui/pages-shared.js";

// Spanish for the plan's fixed status reasons, keyed like STATUS_REASON. Reasons composed from the
// learner's own evidence (review items, task recommendations) come from the engine and stay English.
const STATUS_REASON_ES = {
  draft: "Continúa tu trabajo guardado y revisa esta versión.",
  retry: "Vuelve a esta actividad y aplica los comentarios.",
  new: "Desarrolla tu lenguaje con una actividad nueva.",
  done: "Practica otra vez una actividad terminada.",
  revisit: "Antes usaste ayuda o un reintento. Prueba una respuesta nueva por tu cuenta.",
};
const BLURB_ES = {
  Listening: "Sigue instrucciones, capta los detalles clave y comprende lo que escuchas.",
  Reading: "Lee textos cortos, busca evidencia y explica la idea principal.",
  Speaking: "Planea lo que vas a decir, grábalo y escúchalo.",
  Writing: "Crea oraciones y párrafos con las palabras y estructuras que elijas.",
};
const PRACTICE_STATUS_ES = {
  "Needs Review": "Necesita repaso",
  "Strong Practice": "Práctica sólida",
  "Practice Complete": "Práctica completa",
  "In Progress": "En progreso",
  "Not Started": "Sin empezar",
};
const domT = (I, d) => (DOMAIN_META[d] ? I.T(DOMAIN_META[d].name, DOMAIN_META[d].es) : d);
const domS = (I, d) => (DOMAIN_META[d] ? I.S(DOMAIN_META[d].name, DOMAIN_META[d].es) : d);
const reasonT = (I, reason) => {
  const key = Object.keys(STATUS_REASON).find((k) => STATUS_REASON[k] === reason);
  return key ? I.T(reason, STATUS_REASON_ES[key]) : reason;
};

export function tierFor(ctx, domain, levels) {
  const t = ctx.prefs.tiers?.[domain];
  return levels?.[t] ? t : levels?.A ? "A" : Object.keys(levels || {})[0];
}

export function nextActivity(band, domain, level, rows) {
  const done = new Set(loadRecord(band, domain, level).complete);
  const next = rows.find((r) => !done.has(r[0]));
  return { done: rows.filter((r) => done.has(r[0])).length, total: rows.length, next };
}

const reviewHref = (item, plan, band, ctx) => {
  const row = plan.find((r) => r.review?.key === item.key);
  if (row) return `${BASE}/${row.domain}/${row.level}/${row.id}?grades=${band}`;
  if (item.kind === "pattern") return `${BASE}/detective/${item.id}?grades=${band}`;
  if (item.domain === "Speaking") return `${BASE}/speak?grades=${band}`;
  if (item.domain === "Writing") return `${BASE}/write?grades=${band}`;
  return `${BASE}/${item.domain}/${ctx.prefs.tiers?.[item.domain] || "A"}?grades=${band}`;
};

function reviewHTML(I, due, plan, band, ctx) {
  const reviewRows = plan.filter((row) => due.some((item) => row.review?.key === item.key));
  const mixedReview = reviewRows.length ? `${BASE}/play?${new URLSearchParams({ ids: reviewRows.map((row) => row.id).join(","), t: I.S("Keep it strong · mixed review", "Mantenlo fuerte · repaso mixto"), grades: band })}` : "";
  return html`<section class="panel review-due" aria-labelledby="reviewTitle">
    <h2 id="reviewTitle">${I.T("Keep it strong", "Mantenlo fuerte")}</h2>
    <p class="fine">${I.T("Quick checks spaced 1, 3, 7 and 14 days apart help you keep what you practiced. Each reason comes from your saved work on this device.", "Repasos rápidos a 1, 3, 7 y 14 días de distancia te ayudan a recordar lo que practicaste. Cada motivo viene de tu trabajo guardado en este dispositivo.")}</p>
    <ul class="evidence-list">
      ${due.map((item) => html`<li>
        <span><a href="${reviewHref(item, plan, band, ctx)}">${item.kind === "pattern" ? I.T(`Pattern: ${item.name}`, `Patrón: ${item.name}`) : item.name}</a> · ${domT(I, item.domain)}</span>
        <span class="fine"><strong>${I.T("Why this is recommended:", "Por qué se recomienda:")}</strong> ${item.reason}</span>
      </li>`)}
    </ul>
    ${mixedReview ? html`<a class="btn btn-primary" href="${mixedReview}">${I.T(`Start mixed review · about ${estimateMinutes(reviewRows)} min`, `Empezar el repaso mixto · unos ${estimateMinutes(reviewRows)} min`)}${icon("arrow-right")}</a>` : ""}
    <p class="fine"><a href="${BASE}/growth?grades=${band}#supportChoiceTitle">${I.T("Choose how much support you get", "Elige cuánto apoyo recibes")}</a></p>
  </section>`;
}

export async function render(ctx) {
  if (ctx.route.view === "session-done") return renderSessionDone(ctx);
  const I = i18nFor(ctx);
  const band = ctx.band;
  const [domains, road, shared] = await Promise.all([
    bandDomains(band),
    loadRoad(),
    loadShared().catch(() => ({})),
  ]);
  const rows = await bandRows(band);
  const settings = ctx.prefs.practicePlan || {};
  const records = new Map();
  const ledger = loadLedger();
  const journey = loadJourneyData(band, { ledger });
  const bandRecords = allRecords().filter((r) => r.band === band);
  const review = {
    entries: ledger.entries.filter((e) => e.band === band),
    records: Object.fromEntries(bandRecords.map((r) => [`${r.domain}:${r.level}`, { domain: r.domain, results: r.record.results }])),
  };
  const plan = buildPracticePlan(rows, { ...settings, tiers: ctx.prefs.tiers, review }, (r) => {
    const key = `${r.domain}:${r.level}`;
    if (!records.has(key)) records.set(key, loadRecord(band, r.domain, r.level));
    return records.get(key);
  });
  const option = (value, label, selected) =>
    html`<option value="${value}" ${selected === value ? raw("selected") : ""}>${label}</option>`;
  const focus = CORE_DOMAINS.includes(settings.focus) ? settings.focus : "balanced";
  const level = ["A", "B", "C"].includes(settings.level) ? settings.level : "preferred";
  const count = [2, 4, 6].includes(Number(settings.count)) ? Number(settings.count) : 4;
  const week = currentWeek(road?.[band]);
  const stamps = bandRecords.reduce((n, r) => n + r.record.complete.length, 0);
  const due = plan.due || [];
  const streak = weekStreak();
  const engagement = getEngagement(ctx.prefs);
  const practicedThisWeek = daysThisWeek();
  const resume = engagement.activeSession?.band === band ? engagement.activeSession : null;
  const familyMessages = { proud: ["I’m proud of the way you kept trying.", "Me enorgullece que hayas seguido intentando."], keepgoing: ["Your ideas are worth sharing. Keep going.", "Tus ideas merecen ser compartidas. Sigue adelante."], strategy: ["I noticed you used a helpful strategy today.", "Noté que usaste una estrategia útil hoy."] };
  const familyMessage = familyMessages[engagement.encouragement];
  const win = shared.testWindow;
  const studio = loadStudio();
  const open = Object.entries(studio.missions).find(([, m]) => m.started && !m.done);
  const idx = await loadStudioIndex().catch(() => null);
  let next = null;
  if (open) next = { href: `${BASE}/missions/${open[0]}?grades=${band}`, title: I.T("Continue your mission", "Continúa tu misión"), why: I.T("Pick up where you left off.", "Sigue donde lo dejaste.") };
  else {
    const pool = [...(idx?.speaking || []), ...(idx?.writing || [])].filter((t) => t.band === band);
    const rec = recommendTasks(pool, ledger.entries, { band, n: 1 })[0];
    if (rec) next = { href: `${BASE}/${rec.task.taskType ? "speak" : "write"}/${rec.task.id}?grades=${band}`, title: rec.task.title, why: html`${domT(I, rec.task.taskType ? "Speaking" : "Writing")} · ${rec.why}` };
  }
  const windowPhase = testingWindowPhase(win);
  const dateOpts = { month: "short", day: "numeric", year: "numeric" };
  const winRange = windowPhase ? `${formatDate(win.start, dateOpts)} – ${formatDate(win.end, dateOpts)}` : "";

  const exScenario = EXHIBITIONS[band] || EXHIBITIONS["6-8"];
  const exBand = bandState(loadExhibition(), exScenario.band);
  const exProgress = exhibitionProgress(exScenario, exBand);
  const suggested = plan[0]?.domain;

  const tiles = CORE_DOMAINS.filter((d) => domains[d]).map((d) => portalHTML(I, ctx, band, d, domains[d].levels));

  const studioLink = (id, ic, title, text) =>
    html`<a class="studio-card" href="${BASE}/${id}?grades=${band}">${icon(ic)}<span><strong>${title}</strong><span>${text}</span></span></a>`;
  const door = (href, ic, title, text) =>
    html`<a class="ll-door-link" href="${href.startsWith("/") ? href : `${BASE}/${href}?grades=${band}`}">${icon(ic)}<span><strong>${title}</strong><span class="fine">${text}</span></span>${icon("arrow-right", "ll-door-go")}</a>`;
  const stepWord = { listen: ["Listen", "Escuchar"], read: ["Read", "Leer"], speak: ["Speak", "Hablar"], write: ["Write", "Escribir"] };
  const exStatus = (st) => (st === "done" ? I.T("done", "hecho") : st === "started" ? I.T("in progress", "en progreso") : I.T("not started", "sin empezar"));

  const reviewPanel = due.length ? reviewHTML(I, due, plan, band, ctx) : html`<section class="panel review-due"><h2>${I.T("Keep it strong", "Mantenlo fuerte")}</h2><p class="fine">${I.T("Words and language patterns you practiced come back when they are ready for another look.", "Las palabras y los patrones que practicaste vuelven cuando es buen momento para repasarlos.")}</p><a class="btn" href="${BASE}/growth?grades=${band}">${I.T("Open review and growth", "Abrir repaso y progreso")}${icon("arrow-right")}</a></section>`;

  return {
    title: "",
    html: html`${journeyHeroHTML(I, band, journey.state, journey.recommendation, { headingId: "homeTitle", bandSwitch: bandSwitchHTML(band, ctx.bands) })}


      ${familyMessage ? html`<aside class="student-family-note panel"><strong>${ctx.prefs.lang === "es" ? "Un mensaje de tu familia" : "A message from your family"}</strong><p lang="${ctx.prefs.lang === "es" ? "es" : "en"}">“${ctx.prefs.lang === "es" ? familyMessage[1] : familyMessage[0]}”</p>${ctx.prefs.lang === "bi" ? html`<p lang="es">“${familyMessage[1]}”</p>` : ""}</aside>` : ""}

      ${
        windowPhase
          ? html`<aside class="window-card" aria-label="${I.S("ACCESS testing window", "Período de pruebas de ACCESS")}">
              ${icon("calendar")}
              <p><strong>${I.T(`${win.state} ACCESS testing: ${winRange}`, `Pruebas ACCESS de ${win.state}: ${winRange}`)}</strong>
              <span>${I.T(`${windowPhase.phase === "upcoming" ? `${windowPhase.daysAway} days away` : windowPhase.phase === "starting" ? "Starts today" : "Testing is happening now"}. Your school chooses your testing days.`, `${windowPhase.phase === "upcoming" ? (windowPhase.daysAway === 1 ? "Falta 1 día" : `Faltan ${windowPhase.daysAway} días`) : windowPhase.phase === "starting" ? "Comienza hoy" : "Las pruebas están en curso ahora"}. Tu escuela elige los días de tus pruebas.`)}</span></p>
              <a href="${win.source || "https://wida.wisc.edu/about/consortium/md"}">${I.T("Official testing window", "Período oficial de pruebas")}</a>
            </aside>`
          : ""
      }

      <section class="jr-explore" aria-labelledby="exploreTitle">
        <div class="jr-explore-head">
          <p class="ll-kicker">${I.T("Optional targeted practice", "Práctica opcional y específica")}</p>
          <h2 id="exploreTitle">${I.T("Explore all activities", "Explora todas las actividades")}</h2>
          <p class="fine">${I.T("Your journey above is the guided path. Here you can choose a skill, replay a studio, take a practice test or find any activity. Today’s mission and review come first.", "Tu viaje de arriba es el camino guiado. Aquí puedes elegir una destreza, volver a un estudio, hacer una prueba de práctica o buscar cualquier actividad. Primero van la misión de hoy y el repaso.")}</p>
          <a class="btn" href="${BASE}/library?grades=${band}">${icon("library")} ${I.T("Open the activity library", "Abrir la biblioteca de actividades")}</a>
        </div>
      <section class="ll-hero" aria-labelledby="exploreHeroTitle">
        <div class="ll-hero-copy">
          <p class="eyebrow">${I.T("Optional practice for today", "Práctica opcional para hoy")}</p>
          <h2 id="exploreHeroTitle">${band === "3-5" ? I.T("Explore a world where your words matter.", "Explora un mundo donde tus palabras importan.") : I.T("Step into a world built for your language.", "Entra a un mundo creado para tu lenguaje.")}</h2>
          <p class="lead">${band === "3-5" ? I.T("Listen, read, speak and write at the Seed Science Fair and beyond. Choose your help. Try again any time.", "Escucha, lee, habla y escribe en la Feria de Ciencias y más. Elige tu ayuda. Intenta otra vez cuando quieras.") : I.T("Four studios and one living exhibition for listening, reading, speaking and writing. You choose the support; every try is saved on this device.", "Cuatro estudios y una exposición viva para escuchar, leer, hablar y escribir. Tú eliges el apoyo; cada intento se guarda en este dispositivo.")}</p>
          <div class="session-heading">
            ${resume ? html`<a class="btn btn-primary btn-big" href="${sessionHref(resume)}">${I.T("Resume today’s mission", "Retoma la misión de hoy")} · ${I.L("common.minutes", { n: resume.minutes })}${icon("arrow-right")}</a>` : ""}
            ${plan.length ? [10, 5, 15].map((minutes) => { const activities = trimToMinutes(plan, minutes); return html`<button type="button" class="btn ${minutes === 10 && !resume ? "btn-primary btn-big" : "ll-btn-quiet"}" data-start-mission="${minutes}" data-session-ids="${activities.map((r) => r.id).join(",")}" data-session-review-ids="${activities.filter((r) => due.some((item) => r.review?.key === item.key)).map((r) => r.id).join(",")}">${resume ? I.T("Start a new session", "Empezar una sesión nueva") : I.T("Start today’s mission", "Empezar la misión de hoy")} · ${I.L("common.minutes", { n: minutes })}</button>`; }) : html`<a class="btn btn-big" href="#skills">${I.T("Choose a skill", "Elige una habilidad")}</a>`}
          </div>
          <p class="session-summary" aria-live="polite">${plan.length ? I.T("Choose about 5, 10 or 15 minutes. There is no countdown; unfinished work comes first.", "Elige unos 5, 10 o 15 minutos. No hay cuenta regresiva; primero va lo que no has terminado.") : I.T("No activities match your plan. Change your plan to see activities.", "Ninguna actividad coincide con tu plan. Cambia tu plan para ver actividades.")}</p>
          <ul class="ll-legend" aria-label="${I.S("The four stations", "Las cuatro estaciones")}">
            <li class="d-listening"><span><strong>${I.T("Sound Dome", "Cúpula del sonido")}</strong> · ${I.T("listen for the details that matter", "escucha los detalles importantes")}</span></li>
            <li class="d-reading"><span><strong>${I.T("Reading Atelier", "Taller de lectura")}</strong> · ${I.T("find the sentence that proves it", "encuentra la oración que lo prueba")}</span></li>
            <li class="d-speaking"><span><strong>${I.T("Expression Stage", "Escenario de expresión")}</strong> · ${I.T("plan it, say it, say it better", "planéalo, dilo y dilo mejor")}</span></li>
            <li class="d-writing"><span><strong>${I.T("Composition Desk", "Mesa de composición")}</strong> · ${I.T("draft, revise, then write on your own", "escribe, revisa y luego escribe por tu cuenta")}</span></li>
          </ul>
        </div>
        ${heroStageHTML(I, ctx, band, suggested)}
      </section>

      <section class="ll-next" aria-labelledby="sessionTitle">
        <div class="session-plan">
          <div class="plan-head">
            <p class="ll-kicker">${I.T("Your next learning action", "Tu próxima acción de aprendizaje")}</p>
            <h2 id="sessionTitle">${I.T("Today’s mission", "La misión de hoy")}</h2>
            <p class="fine">${plan.length ? I.T(`${plan.length} activities, about ${estimateMinutes(plan)} minutes. Unfinished work and due review come first.`, `${plan.length} actividades, unos ${estimateMinutes(plan)} minutos. Primero va lo que no has terminado y el repaso pendiente.`) : I.T("Change your plan to see activities.", "Cambia tu plan para ver actividades.")}</p>
          </div>
          <ol class="plan-preview">
            ${plan.slice(0, 3).map((r) => html`<li class="d-${r.domain.toLowerCase()}"><span class="plan-dot">${icon(DOMAIN_META[r.domain]?.icon || "star")}</span><span><a href="${BASE}/${r.domain}/${r.level}/${r.id}?grades=${band}">${r.title}</a><span class="fine">${domT(I, r.domain)} · ${reasonT(I, r.reason)}</span></span></li>`)}
          </ol>
          ${planOptionsHTML(I, { plan, focus, level, count, option, band })}
        </div>
        <aside class="today-side" aria-label="${I.S("Your next step", "Tu próximo paso")}">
          ${next ? html`<a class="next-step" href="${next.href}"><span class="ll-kicker">${I.T("Continue where it helps most", "Continúa donde más ayuda")}</span><strong>${next.title}</strong><span class="fine">${next.why}</span><span class="next-go">${icon("arrow-right")}</span></a>` : ""}
          <a class="progress-note" href="${BASE}/passport?grades=${band}">${icon("passport")}<span><strong>${stamps ? I.T(`${stamps} activit${stamps === 1 ? "y" : "ies"} finished`, `${stamps} ${stamps === 1 ? "actividad terminada" : "actividades terminadas"}`) : I.T("Your Passport is empty", "Tu Pasaporte está vacío")}</strong><span class="fine">${stamps ? I.T(`${streak ? `${streak}-week practice streak. ` : ""}See your saved work.`, `${streak ? `Racha de práctica de ${streak} ${streak === 1 ? "semana" : "semanas"}. ` : ""}Mira tu trabajo guardado.`) : I.T("Finish an activity and it is saved here, on this device.", "Termina una actividad y se guarda aquí, en este dispositivo.")}</span></span></a>
        </aside>
      </section>

      <div class="jr-review-slot">${reviewPanel}</div>

      <section class="ll-studios" id="skills" aria-labelledby="roomsTitle">
        <div class="ll-section-head">
          <p class="ll-kicker">${I.T("Four language studios", "Cuatro estudios de lenguaje")}</p>
          <h2 id="roomsTitle">${I.T("Choose a studio", "Elige un estudio")}</h2>
          <p class="fine">${I.T("Each studio has three support choices: Starting, Growing and Expanding. They change the help you get, not a score.", "Cada estudio tiene tres opciones de apoyo: Comenzando, Creciendo y Ampliando. Cambian la ayuda que recibes, no un puntaje.")}</p>
        </div>
        <div class="room-grid ll-portals">${tiles}</div>
      </section>

      <section class="ll-world band-identity-strip" aria-labelledby="bandIdentityTitle">
        <div class="ll-world-art" aria-hidden="true"><img src="${ART}/hall-${band === "3-5" ? "35" : "68"}.svg" width="1200" height="760" alt="" loading="lazy" decoding="async" /></div>
        <div class="ll-world-copy">
          <p class="ll-kicker">${band === "3-5" ? I.T("Language World · Grades 3–5", "Mundo del lenguaje · Grados 3–5") : I.T("Language World · Grades 6–8", "Mundo del lenguaje · Grados 6–8")}</p>
          <h2 id="bandIdentityTitle"><span lang="en">${exScenario.title}</span></h2>
          <p>${band === "3-5" ? I.T("One science fair, four ways to use language. Hear where to go, read about a bean test, tell what happened, then write why.", "Una feria de ciencias, cuatro formas de usar el lenguaje. Escucha adónde ir, lee sobre una prueba con frijoles, cuenta lo que pasó y escribe por qué.") : I.T("One exhibition, four linked tasks: catch the key details, find evidence, explain a process, then argue for a design with evidence.", "Una exposición, cuatro tareas unidas: capta los detalles clave, encuentra evidencia, explica un proceso y luego defiende un diseño con evidencia.")}</p>
          <ol class="ll-world-path">${exProgress.steps.map(({ step, status }) => html`<li class="is-${status}"><span>${I.T(...stepWord[step])}</span><span class="fine">${exStatus(status)}</span></li>`)}</ol>
          <div class="row-actions">
            <a class="btn btn-primary" href="${BASE}/exhibition${exProgress.done ? `/${exProgress.next || "write"}` : ""}?grades=${band}">${exProgress.done ? I.T("Continue the exhibition", "Continuar la exposición") : I.T("Enter the exhibition", "Entrar a la exposición")}${icon("arrow-right")}</a>
            <a class="btn ll-btn-quiet" href="${BASE}/worlds?grades=${band}">${icon("worlds")} ${I.T("More Language Worlds", "Más mundos lingüísticos")}</a>
          </div>
          <p class="ll-world-more">${I.T("Also here:", "También aquí:")} <a href="${BASE}/reality?grades=${band}">${I.T("Language Reality", "Realidad Lingüística")}</a> · <a href="${BASE}/learn?grades=${band}">${I.T("Interactive Learn Hub", "Centro interactivo de aprendizaje")}</a> · <a href="${BASE}/games?grades=${band}">${I.T("Language Games", "Juegos de lenguaje")}</a> · <a href="${BASE}/publisher-demo">${I.T("One topic, four skills", "Un tema, cuatro habilidades")}</a> · <a href="${BASE}/stories?grades=${band}">${I.T("Neighborhood Notes", "Notas del vecindario")}</a></p>
        </div>
      </section>

      <section class="ll-growth" aria-labelledby="growthTitle">
        <div class="ll-section-head">
          <p class="ll-kicker">${I.T("My Passport", "Mi Pasaporte")}</p>
          <h2 id="growthTitle">${I.T("Your growth, from your own work", "Tu crecimiento, a partir de tu propio trabajo")}</h2>
        </div>
        <div class="ll-growth-grid">
          <a class="ll-passport-card" href="${BASE}/passport?grades=${band}">
            <span class="ll-passport-stamp" aria-hidden="true">${icon("passport")}</span>
            <strong>${stamps ? I.T(`${stamps} saved ${stamps === 1 ? "activity" : "activities"}`, `${stamps} ${stamps === 1 ? "actividad guardada" : "actividades guardadas"}`) : I.T("Ready for its first stamp", "Listo para su primer sello")}</strong>
            <span class="fine">${I.T(`Language World: ${exProgress.done} of 4 steps. Drafts, revisions and backups live in your Passport.`, `Mundo del lenguaje: ${exProgress.done} de 4 pasos. Borradores, revisiones y copias de seguridad están en tu Pasaporte.`)}</span>
            <span class="ll-door-go">${I.T("Open my Passport", "Abrir mi Pasaporte")}${icon("arrow-right")}</span>
          </a>
          <section class="panel weekly-goal" aria-labelledby="weeklyGoalTitle"><div><p class="ll-kicker">${I.T("Your pace · no pressure", "Tu ritmo · sin presión")}</p><h2 id="weeklyGoalTitle">${I.T(`${practicedThisWeek} of ${engagement.weeklyGoal} practice days this week`, `${practicedThisWeek} de ${engagement.weeklyGoal} días de práctica esta semana`)}</h2><p class="fine">${I.T(`A practice day counts when saved work is recorded on this device. Your ${streak ? `${streak}-week streak` : "practice history"} stays yours if you take a week off.`, `Un día de práctica cuenta cuando se guarda trabajo en este dispositivo. Tu ${streak ? `racha de ${streak} ${streak === 1 ? "semana" : "semanas"}` : "historial de práctica"} sigue siendo tuyo si descansas una semana.`)}</p></div><label class="field"><span>${I.T("Choose a weekly goal", "Elige una meta semanal")}</span><select data-weekly-goal>${[3, 4, 5, 7].map((n) => html`<option value="${n}" ${n === engagement.weeklyGoal ? raw("selected") : ""}>${I.T(`${n} days per week`, `${n} días por semana`)}</option>`)}</select></label>${practicedThisWeek >= engagement.weeklyGoal ? html`<p class="goal-done" role="status">${I.T("Weekly goal reached. Nice steady work!", "¡Meta semanal alcanzada! Buen trabajo constante.")}</p>` : ""}</section>
        </div>
        ${week ? html`<div class="road-strip"><div><p class="ll-kicker">${I.T(`Road to ACCESS · Week ${week.n} of 12`, `Camino a ACCESS · Semana ${week.n} de 12`)}</p><h3 id="roadStripTitle">${week.taskType}: ${week.theme}</h3><p class="fine">${week.focus}</p></div><a class="btn" href="${BASE}/road/${week.n}?grades=${band}">${I.T("Open this week", "Abrir esta semana")}${icon("arrow-right")}</a></div>` : ""}
      </section>

      <section class="ll-tests" aria-labelledby="testsTitle">
        <div class="ll-tests-copy">
          <p class="ll-kicker">${I.T("Assessment-style practice · focused mode", "Práctica tipo evaluación · modo enfocado")}</p>
          <h2 id="testsTitle">${I.T("Practice tests", "Pruebas de práctica")}</h2>
          <p>${I.T("A quiet screen with the timer, tools and navigation of a test, so the format feels familiar. Practice only: not an official ACCESS test, score, level or placement.", "Una pantalla tranquila con el temporizador, las herramientas y la navegación de una prueba, para que el formato se sienta familiar. Solo práctica: no es una prueba oficial ACCESS, ni un puntaje, nivel o ubicación.")}</p>
          <a class="btn btn-primary" href="${BASE}/tests?grades=${band}">${icon("tests")} ${I.T("Open practice tests", "Abrir pruebas de práctica")}${icon("arrow-right")}</a>
        </div>
        <div class="ll-tests-links">
          ${door("assess", "tests", I.T("Assessment simulator", "Simulador de evaluación"), I.T("Item types, tools and review, one question at a time.", "Tipos de preguntas, herramientas y revisión, una pregunta a la vez."))}
          ${door("diagnostic", "checkin", I.T("Skill check-in", "Chequeo de destrezas"), I.T("Optional 4-minute starting point.", "Punto de partida opcional de 4 minutos."))}
          ${door("tools", "tools", I.T("Test tools warm-up", "Calentamiento con las herramientas de prueba"), I.T("Audio check and the WIDA demo.", "Prueba de audio y demostración de WIDA."))}
        </div>
      </section>

      <section class="ll-library more-ways" aria-labelledby="moreTitle">
        <div class="ll-section-head">
          <p class="ll-kicker">${I.T("Library", "Biblioteca")}</p>
          <h2 id="moreTitle">${I.T("Find any activity or studio", "Encuentra cualquier actividad o estudio")}</h2>
        </div>
        <form class="ll-search" action="${BASE}/library" method="get" role="search">
          <label for="homeSearch">${I.T("Search every activity", "Busca en todas las actividades")}</label>
          <div class="ll-search-row"><input id="homeSearch" name="q" type="search" maxlength="120" autocomplete="off" placeholder="${I.S("Try: main idea, recipe, explain", "Prueba: idea principal, receta, explicar")}" /><input type="hidden" name="grades" value="${band}" /><button class="btn btn-primary" type="submit">${icon("search")} ${I.T("Search", "Buscar")}</button></div>
        </form>
        <div class="studio-grid">
          ${studioLink("exhibition", "worlds", I.T("Language World", "Mundo del lenguaje"), I.T("One exhibition, four linked tasks.", "Una exposición, cuatro tareas unidas."))}
          ${studioLink("reality", "worlds", I.T("Language Reality Engine", "Motor de Realidad Lingüística"), I.T("Mystery Academy, Future City, Science Expedition.", "Academia de Misterios, Ciudad del Futuro, Expedición Científica."))}
          ${studioLink("learn", "bulb", I.T("Interactive Learn Hub", "Centro interactivo de aprendizaje"), I.T("Notice a language move, predict, respond, apply.", "Observa un recurso del lenguaje, predice, responde y aplica."))}
          ${studioLink("games", "sparkle", I.T("Language Game Studio", "Estudio de juegos de lenguaje"), I.T("Fifteen games for all four skills.", "Quince juegos para las cuatro habilidades."))}
          ${studioLink("speak", "speaking", I.T("Speaking Studio", "Estudio de expresión oral"), I.T("Plan, record, listen back, say it better.", "Planea, graba, escucha y mejora lo que dices."))}
          ${studioLink("write", "writing", I.T("Writing Studio", "Estudio de escritura"), I.T("Use sources, draft, get feedback, revise.", "Usa fuentes, escribe, recibe comentarios y revisa."))}
          ${studioLink("reading-room", "reading", I.T("Reading Room", "Sala de lectura"), I.T("Choose a text, annotate evidence.", "Elige un texto y anota la evidencia."))}
          ${studioLink("missions", "mission", I.T("Academic missions", "Misiones académicas"), I.T("Listen, read, decide, speak and write.", "Escucha, lee, decide, habla y escribe."))}
          ${studioLink("detective", "detective", I.T("Error Detective", "Detective de errores"), I.T("Find a pattern in your work and fix it.", "Encuentra un patrón en tu trabajo y corrígelo."))}
          ${studioLink("ladder", "reading", I.T("Reading Ladder", "Escalera de lectura"), I.T("Texts that step up or down as you read.", "Textos que suben o bajan según tu lectura."))}
          ${studioLink("puzzles", "grid", I.T("Puzzle Den", "Rincón de rompecabezas"), I.T("Build sentences, solve clues.", "Forma oraciones y resuelve pistas."))}
          ${studioLink("vocabulary", "words", I.T("Word Builder", "Constructor de palabras"), I.T("Prefixes, roots and academic words.", "Prefijos, raíces y palabras académicas."))}
          ${studioLink("road", "road", I.T("Road to ACCESS", "Camino a ACCESS"), I.T("A 12-week plan, one stop a week.", "Un plan de 12 semanas, una parada por semana."))}
          ${studioLink("tests", "tests", I.T("Practice Tests", "Pruebas de práctica"), I.T("Full ACCESS-style practice sets and short mini checks.", "Pruebas de práctica estilo ACCESS y minipruebas cortas."))}
        </div>
        ${kluHTML(I, ctx, band, rows, idx)}
      </section>

      <section class="ll-paths" aria-labelledby="pathsTitle">
        <h2 id="pathsTitle" class="visually-hidden">${I.T("For families and teachers", "Para familias y docentes")}</h2>
        <div class="ll-path-door is-family">
          <p class="ll-kicker">${I.T("Families", "Familias")}</p>
          <h3>${I.T("Practice together at home", "Practiquen juntos en casa")}</h3>
          ${door("family", "families", I.T("Family hub", "Centro para familias"), I.T("Plain-language guide, in English and Spanish.", "Guía en lenguaje sencillo, en inglés y español."))}
          ${door("/access-family-expedition/", "sparkle", I.T("Family Adventure", "Aventura familiar"), I.T("A guided tour to do together.", "Un recorrido guiado para hacer juntos."))}
          ${door("/access-family-tour/", "road", I.T("Family Expedition", "Expedición familiar"), I.T("See how the lab works, step by step.", "Mira cómo funciona el laboratorio, paso a paso."))}
        </div>
        <div class="ll-path-door is-teacher">
          <p class="ll-kicker">${I.T("Teachers", "Docentes")}</p>
          <h3>${I.T("Plan, project and review evidence", "Planifica, proyecta y revisa la evidencia")}</h3>
          ${door("/access-teacher/", "teacher", I.T("Teacher Hub", "Centro docente"), I.T("Evidence, rubrics, printable packets.", "Evidencia, rúbricas y paquetes imprimibles."))}
          ${door("classroom", "classroom", I.T("Whole-Class Studio", "Estudio para toda la clase"), I.T("Projector-ready routines.", "Rutinas listas para proyectar."))}
          ${door("launch-studio", "launch", I.T("Launch Studio", "Estudio de lanzamiento"), I.T("QR codes and direct links.", "Códigos QR y enlaces directos."))}
          ${door("exhibition/teacher", "worlds", I.T("Language World teacher notes", "Notas docentes del Mundo del lenguaje"), I.T("Objectives, Key Language Uses, supports.", "Objetivos, usos clave del lenguaje y apoyos."))}
        </div>
      </section>
      </section>`,
  };
}

/** The four studio portals: one composition per domain, the same facts on each. */
const PORTALS = {
  Listening: { studio: ["The Sound Studio", "El estudio del sonido"], art: () => html`<svg class="ll-wave" viewBox="0 0 240 64" aria-hidden="true" focusable="false">${[10, 18, 30, 44, 26, 52, 38, 22, 46, 58, 34, 20, 40, 28, 14, 36, 48, 24, 12, 30, 18, 8].map((h, i) => html`<rect x="${4 + i * 10.6}" y="${32 - h / 2}" width="5" height="${h}" rx="2.5"/>`)}</svg>` },
  Reading: { studio: ["The Reading Atelier", "El taller de lectura"], art: () => html`<div class="ll-folio" aria-hidden="true"><span class="ll-folio-title"></span><span></span><span class="is-mark"></span><span></span><span class="is-short"></span></div>` },
  Speaking: { studio: ["The Expression Studio", "El estudio de expresión"], art: () => html`<div class="ll-rings" aria-hidden="true"><span></span><span></span><span></span>${icon("speaking")}<em lang="en">I noticed that…</em></div>` },
  Writing: { studio: ["The Composition Studio", "El estudio de composición"], art: () => html`<div class="ll-manuscript" aria-hidden="true"><span></span><span class="is-struck"></span><span class="is-insert"></span><span></span><span class="is-caret"></span></div>` },
};

function portalHTML(I, ctx, band, d, levels) {
  const meta = DOMAIN_META[d];
  const tier = tierFor(ctx, d, levels);
  const { done, total, next } = nextActivity(band, d, tier, levels[tier].activities);
  const record = loadRecord(band, d, tier);
  const { status } = practiceSummary(record.results, done, total);
  const statusClass = status.toLowerCase().replace(/\s+/g, "-");
  const roomHref = `${BASE}/${d}/${tier}?grades=${band}`;
  const href = next ? `${BASE}/${d}/${tier}/${next[0]}?grades=${band}` : roomHref;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const portal = PORTALS[d];
  return html`<article class="room-tile ll-portal d-${d.toLowerCase()}">
    <div class="ll-portal-art">${portal.art()}</div>
    <div class="room-body">
      <p class="ll-portal-studio">${I.T(...portal.studio)}</p>
      <h3 class="room-name"><a class="room-link" href="${roomHref}">${I.T(meta.name, meta.es)}</a></h3>
      <p class="room-blurb">${I.T(meta.blurb, BLURB_ES[d])}</p>
      <div class="ll-portal-meta">
        <span class="practice-status is-${statusClass}">${I.T(status, PRACTICE_STATUS_ES[status])}</span>
        <span class="fine">${I.T(`${TIERS[tier]?.name || tier} support`, `Apoyo ${TIERS[tier]?.es || tier}`)}</span>
      </div>
      <div class="room-progress">
        <div class="bar" role="img" aria-label="${I.S(`${meta.name}: ${done} of ${total} activities done`, `${meta.es}: ${done} de ${total} actividades hechas`)}"><i style="width:${pct}%"></i></div>
        <p class="fine">${I.T(`${done} of ${total} done`, `${done} de ${total} hechas`)}</p>
      </div>
      ${
        next
          ? html`<a class="btn btn-room" href="${href}">${done ? I.T(`Continue ${meta.name.toLowerCase()}`, `Seguir con ${meta.es.toLowerCase()}`) : I.T(`Start ${meta.name.toLowerCase()}`, `Empezar a ${meta.es.toLowerCase()}`)}${icon("arrow-right")}</a>
              <p class="room-next fine">${I.T("Next:", "Siguiente:")} ${next[1]}</p>`
          : html`<a class="btn btn-room" href="${roomHref}">${I.T("Level complete — choose another", "Nivel completo: elige otro")}${icon("arrow-right")}</a>`
      }
    </div>
  </article>`;
}

function planOptionsHTML(I, { plan, focus, level, count, option, band }) {
  return html`<details id="planOptions" class="session-options"><summary>${I.T("Change my plan or see all activities", "Cambiar mi plan o ver todas las actividades")}</summary>
    <div class="session-controls">
      <label class="field"><span>${I.T("Skill focus", "Habilidad principal")}</span><select id="planFocus" data-plan="focus" data-nsr-ignore>
        ${option("balanced", I.S("Any skill · unfinished work first", "Cualquier habilidad · primero lo que falta"), focus)}
        ${CORE_DOMAINS.map((d) => option(d, domS(I, d), focus))}
      </select></label>
      <label class="field"><span>${I.T("Support choice", "Apoyo elegido")}</span><select id="planLevel" data-plan="level" data-nsr-ignore>
        ${option("preferred", I.S("My chosen room supports", "Los apoyos que elegí en cada sala"), level)}
        ${option("A", I.S("Starting · words and short sentences", "Comenzando · palabras y oraciones cortas"), level)}
        ${option("B", I.S("Growing · connected ideas", "Creciendo · ideas conectadas"), level)}
        ${option("C", I.S("Expanding · details and explanations", "Ampliando · detalles y explicaciones"), level)}
      </select></label>
      <label class="field"><span>${I.T("Session length", "Duración de la sesión")}</span><select id="planCount" data-plan="count" data-nsr-ignore>
        ${[2, 4, 6].map((n) => option(String(n), I.S(`${n} activities`, `${n} actividades`), String(count)))}
      </select></label>
    </div>
    <p class="fine">${I.T("Starting: name and describe with words or short sentences. Growing: connect ideas. Expanding: explain with details. These choices change tasks and scaffolds; they are not WIDA scores. Change support any time.", "Comenzando: nombra y describe con palabras u oraciones cortas. Creciendo: conecta ideas. Ampliando: explica con detalles. Estas opciones cambian las tareas y los apoyos; no son puntajes de WIDA. Puedes cambiar el apoyo cuando quieras.")}</p>
    <p class="fine">${I.T("This browser’s saved practice puts unfinished work first, then retries, then new activities. On a shared device, check that the saved work is yours.", "La práctica guardada en este navegador pone primero lo que no has terminado, luego los reintentos y después las actividades nuevas. En un dispositivo compartido, verifica que el trabajo guardado sea tuyo.")}</p>
    <ol class="session-list">
      ${plan.map(
        (r) => html`<li>
        <span class="session-domain">${domT(I, r.domain)} · ${I.T(TIERS[r.level].name, TIERS[r.level].es)}</span>
        <a href="${BASE}/${r.domain}/${r.level}/${r.id}?grades=${band}">${r.title}</a>
        <span class="fine">${reasonT(I, r.reason)} · ${I.T(`about ${estimateMinutes([r])} minutes`, `unos ${estimateMinutes([r])} minutos`)}</span>
      </li>`,
      )}
    </ol>
  </details>`;
}

export function onClick(e, ctx) {
  if (heroClick(e, ctx)) return true;
  const start = e.target.closest?.("[data-start-mission]");
  if (start) {
    const ids = start.dataset.sessionIds.split(",").filter(Boolean);
    if (ids.length) {
      const reviewIds = start.dataset.sessionReviewIds.split(",").filter(Boolean);
      const session = startSession(ctx, ids.map((id) => ({ id })), Number(start.dataset.startMission), "Today's mission", reviewIds);
      ctx.navigate(sessionHref(session));
    }
    return true;
  }
  const tryBtn = e.target.closest?.("[data-klu-try]");
  if (tryBtn) {
    const klu = ctx.prefs.kluFocus;
    if (klu) {
      ctx.setPrefs({ kluTry: { ...(ctx.prefs.kluTry || {}), [klu]: tryBtn.dataset.kluTry } });
      ctx.rerender({ keepFocus: true });
    }
    return true;
  }
  const btn = e.target.closest?.("[data-klu]");
  if (!btn) return false;
  const value = KEY_LANGUAGE_USES.includes(btn.dataset.klu) && ctx.prefs.kluFocus !== btn.dataset.klu ? btn.dataset.klu : "";
  ctx.setPrefs({ kluFocus: value });
  ctx.rerender().then(() => document.getElementById(btn.id)?.focus({ preventScroll: true }));
  return true;
}

export function onChange(e, ctx) {
  if (e.target.matches("[data-weekly-goal]")) {
    const n = Number(e.target.value);
    if ([3, 4, 5, 7].includes(n)) saveEngagement(ctx, { weeklyGoal: n });
    return;
  }
  const key = e.target.dataset.plan;
  if (!["focus", "level", "count"].includes(key)) return;
  ctx.setPrefs({ practicePlan: { ...ctx.prefs.practicePlan, [key]: e.target.value } });
  const id = e.target.id;
  const open = document.getElementById("planOptions")?.open;
  ctx.rerender().then(() => {
    const disclosure = document.getElementById("planOptions");
    if (disclosure) disclosure.open = open;
    document.getElementById(id)?.focus({ preventScroll: true });
  });
}

async function renderSessionDone(ctx) {
  const engagement = getEngagement(ctx.prefs);
  const session = engagement.activeSession?.id === ctx.route.sessionId ? engagement.activeSession : engagement.lastSession?.id === ctx.route.sessionId ? engagement.lastSession : null;
  if (!session || session.id !== ctx.route.sessionId) return { title: "", html: html`<p><a class="btn btn-primary" href="${BASE}/?grades=${ctx.band}">Back to today’s mission</a></p>` };
  const items = (await Promise.all(session.ids.map((id) => findActivity(id).catch(() => null)))).filter(Boolean);
  const practiced = items.filter((item) => {
    const result = loadRecord(item.band, item.domain, item.level).results?.[item.activity.id];
    return result?.date && Date.parse(result.date) >= Date.parse(session.started) && !needsReview(result);
  });
  if (!practiced.length) return { title: "Mission", html: html`<section class="session-finish panel"><h1 tabindex="-1">Ready when you are</h1><p>Try at least one activity in this session before finishing. Your place is saved.</p><a class="btn btn-primary" href="${sessionHref(session)}">Resume this mission${icon("arrow-right")}</a></section>` };
  const earned = engagement.activeSession?.id === session.id ? finishSession(ctx, session.id, true).earned : 0;
  const domains = [...new Set(practiced.map((item) => item.domain))];
  return { title: "Mission complete", html: html`<section class="session-finish panel" aria-labelledby="finishTitle"><p class="eyebrow">EduWonderLab · Mission complete</p><h1 id="finishTitle" tabindex="-1">You made time for language today.</h1><p class="lead">You practiced ${practiced.length} ${practiced.length === 1 ? "activity" : "activities"} across ${domains.join(", ")} in an estimated ${session.minutes} minute session. There was no timer.</p><h2>What you practiced</h2><ul>${practiced.map((item) => html`<li>${item.activity.title} · ${item.domain}</li>`)}</ul><p>Try this strategy next: name the evidence, explain your choice, then use that move on a new task.</p>${earned ? html`<p class="reward-chip" role="status">+${earned} Passport XP for completing this session</p>` : html`<p class="fine" role="status">Today’s session reward was already earned. Your practice is saved.</p>`}<p class="fine">XP celebrates participation and learning habits. It is not a proficiency score or placement.</p><div class="session-heading"><a class="btn btn-primary" href="${BASE}/passport?grades=${session.band}">See your Passport${icon("arrow-right")}</a><a class="btn" href="${BASE}/?grades=${session.band}">Choose a next step</a></div></section>` };
}
