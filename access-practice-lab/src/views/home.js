// Home: the start screen (grade, language, Continue, the four skills, a door for teachers and families; see
// home-start.js), then today's session, the four studios, everything else to explore (home-registry.js),
// growth, practice tests, search, and the teacher and family sections.
import { bandDomains, bandRows, findActivity, loadIndex, loadRoad, loadShared } from "../content.js";
import { activeGradeFocus, inGradeFocus } from "../grade-focus.js";
import { allRecords, loadRecord, needsReview, weekStreak } from "../store.js";
import {
  ART,
  BASE,
  CORE_DOMAINS,
  DOMAIN_META,
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
import { buildPracticePlan } from "../practice-plan.js";
import { i18nFor } from "../i18n.js";
import { currentWeek } from "./road.js";
import {
  daysThisWeek,
  finishSession,
  getEngagement,
  saveEngagement,
  sessionHref,
  startSession,
} from "../engagement.js";
import { trimToMinutes } from "../family/plan.js";
import { cardsFor } from "../home-registry.js";
import { domT, nextActivity, planOptionsHTML, portalHTML, reasonT, tierFor } from "./home-panels.js";

export { nextActivity, tierFor };
import { cardHref, continueTarget, pickBand, recentRoom, startHTML } from "./home-start.js";
import { loadJourneyData } from "../journey/ui/pages-shared.js";
import { latestModuleResume } from "../home-resume.js";

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
  const mixedReview = reviewRows.length
    ? `${BASE}/play?${new URLSearchParams({ ids: reviewRows.map((row) => row.id).join(","), t: I.S("Keep it strong · mixed review", "Mantenlo fuerte · repaso mixto"), grades: band })}`
    : "";
  return html`<section class="panel review-due" aria-labelledby="reviewTitle">
    <h2 id="reviewTitle">${I.T("Keep it strong", "Mantenlo fuerte")}</h2>
    <p class="fine">
      ${I.T("Quick checks spaced 1, 3, 7 and 14 days apart help you keep what you practiced. Each reason comes from your saved work on this device.", "Repasos rápidos a 1, 3, 7 y 14 días de distancia te ayudan a recordar lo que practicaste. Cada motivo viene de tu trabajo guardado en este dispositivo.")}
    </p>
    <ul class="evidence-list">
      ${due.map(
        (item) =>
          html`<li>
            <span
              ><a href="${reviewHref(item, plan, band, ctx)}"
                >${item.kind === "pattern" ? I.T(`Pattern: ${item.name}`, `Patrón: ${item.name}`) : item.name}</a
              >
              · ${domT(I, item.domain)}</span
            >
            <span class="fine"
              ><strong>${I.T("Why this is recommended:", "Por qué se recomienda:")}</strong>
              ${item.reason}</span
            >
          </li>`,
      )}
    </ul>
    ${mixedReview ? html`<a class="btn btn-primary" href="${mixedReview}">${I.T(`Start mixed review · about ${estimateMinutes(reviewRows)} min`, `Empezar el repaso mixto · unos ${estimateMinutes(reviewRows)} min`)}${icon("arrow-right")}</a>` : ""}
    <p class="fine">
      <a href="${BASE}/growth?grades=${band}#supportChoiceTitle"
        >${I.T("Choose how much support you get", "Elige cuánto apoyo recibes")}</a
      >
    </p>
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
  const focus6to8 = activeGradeFocus(ctx.prefs, band);
  const focusCounts =
    band === "6-8" ? (await loadIndex()).gradeBands?.find((g) => g.contentBand === "6-8")?.gradeFocus : null;
  const rows = (await bandRows(band)).filter((r) => inGradeFocus(r.grades, focus6to8));
  const settings = ctx.prefs.practicePlan || {};
  const records = new Map();
  const ledger = loadLedger();
  const journey = loadJourneyData(band, { ledger });
  const journeyStep = journey.recommendation?.kind === "continue"
    ? journey.state?.bands?.[band]?.missions?.[journey.recommendation.mission]?.steps?.[journey.recommendation.step]
    : null;
  journey.updatedAt = journeyStep?.lastAt || journeyStep?.doneAt || "";
  const bandRecords = allRecords().filter((r) => r.band === band);
  const review = {
    entries: ledger.entries.filter((e) => e.band === band),
    records: Object.fromEntries(
      bandRecords.map((r) => [
        `${r.domain}:${r.level}`,
        { domain: r.domain, results: r.record.results },
      ]),
    ),
  };
  // Early bands ship fewer support levels (K has A, Grade 1 has A and B); offer and honour only the ones that exist.
  const shippedLevels = ["A", "B", "C"].filter((l) => rows.some((r) => r.level === l));
  const planSettings = shippedLevels.includes(settings.level) ? settings : { ...settings, level: undefined };
  const plan = buildPracticePlan(rows, { ...planSettings, tiers: ctx.prefs.tiers, review }, (r) => {
    const key = `${r.domain}:${r.level}`;
    if (!records.has(key)) records.set(key, loadRecord(band, r.domain, r.level));
    return records.get(key);
  });
  const option = (value, label, selected) =>
    html`<option value="${value}" ${selected === value ? raw("selected") : ""}>${label}</option>`;
  const focus = CORE_DOMAINS.includes(settings.focus) ? settings.focus : "balanced";
  const level = shippedLevels.includes(settings.level) ? settings.level : "preferred";
  const count = [2, 4, 6].includes(Number(settings.count)) ? Number(settings.count) : 4;
  const week = currentWeek(road?.[band]);
  const stamps = bandRecords.reduce((n, r) => n + r.record.complete.length, 0);
  const due = plan.due || [];
  const streak = weekStreak();
  const engagement = getEngagement(ctx.prefs);
  const practicedThisWeek = daysThisWeek();
  const resume = engagement.activeSession?.band === band ? engagement.activeSession : null;
  const familyMessages = {
    proud: [
      "I’m proud of the way you kept trying.",
      "Me enorgullece que hayas seguido intentando.",
    ],
    keepgoing: [
      "Your ideas are worth sharing. Keep going.",
      "Tus ideas merecen ser compartidas. Sigue adelante.",
    ],
    strategy: [
      "I noticed you used a helpful strategy today.",
      "Noté que usaste una estrategia útil hoy.",
    ],
  };
  const familyMessage = familyMessages[engagement.encouragement];
  const win = shared.testWindow;
  const studio = loadStudio();
  const idx = await loadStudioIndex().catch(() => null);
  const open = Object.entries(studio.missions)
    .filter(([, m]) => m.started && !m.done)
    .sort(([, a], [, b]) => (Date.parse(b.updatedAt || b.started || "") || 0) - (Date.parse(a.updatedAt || a.started || "") || 0))[0];
  const moduleResume = latestModuleResume({ band, studio, index: idx || {} });
  let next = null;
  if (open)
    next = {
      href: `${BASE}/missions/${open[0]}?grades=${band}`,
      title: I.T("Continue your mission", "Continúa tu misión"),
      why: I.T("Pick up where you left off.", "Sigue donde lo dejaste."),
    };
  else {
    const pool = [...(idx?.speaking || []), ...(idx?.writing || [])].filter((t) => t.band === band);
    const rec = recommendTasks(pool, ledger.entries, { band, n: 1 })[0];
    if (rec)
      next = {
        href: `${BASE}/${rec.task.taskType ? "speak" : "write"}/${rec.task.id}?grades=${band}`,
        title: rec.task.title,
        why: html`${domT(I, rec.task.taskType ? "Speaking" : "Writing")} · ${rec.why}`,
      };
  }
  const windowPhase = testingWindowPhase(win);
  const dateOpts = { month: "short", day: "numeric", year: "numeric" };
  const winRange = windowPhase
    ? `${formatDate(win.start, dateOpts)} – ${formatDate(win.end, dateOpts)}`
    : "";

  const exScenario = EXHIBITIONS[band] || EXHIBITIONS["6-8"];
  const exBand = bandState(loadExhibition(), exScenario.band);
  const exProgress = exhibitionProgress(exScenario, exBand);
  const suggested = plan[0]?.domain;

  const tiles = CORE_DOMAINS.filter((d) => domains[d]).map((d) =>
    portalHTML(I, ctx, band, d, domains[d].levels),
  );
  const target = continueTarget(I, {
    band,
    resume,
    openMission: open ? { id: open[0], started: open[1].started, updatedAt: open[1].updatedAt } : null,
    journey,
    recent: recentRoom(band, domains, activeGradeFocus(ctx.prefs, band)),
    moduleResume,
  });

  const card = (c) =>
    html`<a class="studio-card" data-home-card="${c.id}" href="${cardHref(c, band)}"
      >${icon(c.icon)}<span
        ><strong>${I.T(c.title[0], c.title[1])}</strong
        ><span>${I.T(c.text[0], c.text[1])}</span></span
      ></a
    >`;
  const door = (c) =>
    html`<a class="ll-door-link" data-home-card="${c.id}" href="${cardHref(c, band)}"
      >${icon(c.icon)}<span
        ><strong>${I.T(c.title[0], c.title[1])}</strong
        ><span class="fine">${I.T(c.text[0], c.text[1])}</span></span
      >${icon("arrow-right", "ll-door-go")}</a
    >`;
  const explore = cardsFor("explore", band);
  const featured = explore.filter((c) => c.featured);
  const more = explore.filter((c) => !c.featured);
  const stepWord = {
    listen: ["Listen", "Escuchar"],
    read: ["Read", "Leer"],
    speak: ["Speak", "Hablar"],
    write: ["Write", "Escribir"],
  };
  const exStatus = (st) =>
    st === "done"
      ? I.T("done", "hecho")
      : st === "started"
        ? I.T("in progress", "en progreso")
        : I.T("not started", "sin empezar");

  const reviewPanel = due.length
    ? reviewHTML(I, due, plan, band, ctx)
    : html`<section class="panel review-due">
        <h2>${I.T("Keep it strong", "Mantenlo fuerte")}</h2>
        <p class="fine">
          ${I.T("Words and language patterns you practiced come back when they are ready for another look.", "Las palabras y los patrones que practicaste vuelven cuando es buen momento para repasarlos.")}
        </p>
        <a class="btn" href="${BASE}/growth?grades=${band}"
          >${I.T("Open review and growth", "Abrir repaso y progreso")}${icon("arrow-right")}</a
        >
      </section>`;

  return {
    title: "",
    html: html`${startHTML(I, ctx, { band, available: ctx.bands, focusCounts, domains, tierFor: (d, levels) => tierFor(ctx, d, levels), target })}
      ${
        familyMessage
          ? html`<aside class="student-family-note panel">
              <strong
                >${ctx.prefs.lang === "es" ? "Un mensaje de tu familia" : "A message from your family"}</strong
              >
              <p lang="${ctx.prefs.lang === "es" ? "es" : "en"}">
                “${ctx.prefs.lang === "es" ? familyMessage[1] : familyMessage[0]}”
              </p>
              ${ctx.prefs.lang === "bi" ? html`<p lang="es">“${familyMessage[1]}”</p>` : ""}
            </aside>`
          : ""
      }
      ${next ? html`<aside class="lph-recommended-next" aria-label="${I.S("Recommended next practice", "Práctica siguiente recomendada")}"><a class="next-step" href="${next.href}"><span class="ll-kicker">${I.T("Continue where it helps most", "Continúa donde más ayuda")}</span><strong>${next.title}</strong><span class="fine">${next.why}</span><span class="next-go">${icon("arrow-right")}</span></a></aside>` : ""}
      ${due.length ? reviewPanel : ""}
      ${
        windowPhase
          ? html`<aside
              class="window-card"
              aria-label="${I.S("ACCESS testing window", "Período de pruebas de ACCESS")}"
            >
              ${icon("calendar")}
              <p>
                <strong
                  >${I.T(`${win.state} ACCESS testing: ${winRange}`, `Pruebas ACCESS de ${win.state}: ${winRange}`)}</strong
                >
                <span
                  >${I.T(`${windowPhase.phase === "upcoming" ? `${windowPhase.daysAway} days away` : windowPhase.phase === "starting" ? "Starts today" : "Testing is happening now"}. Your school chooses your testing days.`, `${windowPhase.phase === "upcoming" ? (windowPhase.daysAway === 1 ? "Falta 1 día" : `Faltan ${windowPhase.daysAway} días`) : windowPhase.phase === "starting" ? "Comienza hoy" : "Las pruebas están en curso ahora"}. Tu escuela elige los días de tus pruebas.`)}</span
                >
              </p>
              <a href="${win.source || "https://wida.wisc.edu/about/consortium/md"}"
                >${I.T("Official testing window", "Período oficial de pruebas")}</a
              >
            </aside>`
          : ""
      }

      <section class="ll-hero" id="today" aria-labelledby="exploreHeroTitle">
        <div class="ll-hero-copy">
          <p class="eyebrow">
            ${I.T("A practice session for today", "Una sesión de práctica para hoy")}
          </p>
          <h2 id="exploreHeroTitle">
            ${band === "3-5" ? I.T("Explore a world where your words matter.", "Explora un mundo donde tus palabras importan.") : I.T("Step into a world built for your language.", "Entra a un mundo creado para tu lenguaje.")}
          </h2>
          <p class="lead">
            ${band === "3-5" ? I.T("Listen, read, speak and write at the Seed Science Fair and beyond. Choose your help. Try again any time.", "Escucha, lee, habla y escribe en la Feria de Ciencias y más. Elige tu ayuda. Intenta otra vez cuando quieras.") : I.T("Four studios and one living exhibition for listening, reading, speaking and writing. You choose the support; every try is saved on this device.", "Cuatro estudios y una exposición viva para escuchar, leer, hablar y escribir. Tú eliges el apoyo; cada intento se guarda en este dispositivo.")}
          </p>
          <div class="session-heading">
            ${resume ? html`<a class="btn btn-primary btn-big" href="${sessionHref(resume)}">${I.T("Resume today’s mission", "Retoma la misión de hoy")} · ${I.L("common.minutes", { n: resume.minutes })}${icon("arrow-right")}</a>` : ""}
            ${
              plan.length
                ? [10, 5, 15].map((minutes) => {
                    const activities = trimToMinutes(plan, minutes);
                    return html`<button
                      type="button"
                      class="btn ${minutes === 10 && !resume ? "btn-primary btn-big" : "ll-btn-quiet"}"
                      data-start-mission="${minutes}"
                      data-session-ids="${activities.map((r) => r.id).join(",")}"
                      data-session-review-ids="${activities
                        .filter((r) => due.some((item) => r.review?.key === item.key))
                        .map((r) => r.id)
                        .join(",")}"
                    >
                      ${resume ? I.T("Start a new session", "Empezar una sesión nueva") : I.T("Start today’s mission", "Empezar la misión de hoy")}
                      · ${I.L("common.minutes", { n: minutes })}
                    </button>`;
                  })
                : html`<a class="btn btn-big" href="#skills"
                    >${I.T("Choose a skill", "Elige una habilidad")}</a
                  >`
            }
          </div>
          <p class="session-summary" aria-live="polite">
            ${plan.length ? I.T("Choose about 5, 10 or 15 minutes. There is no countdown; unfinished work comes first.", "Elige unos 5, 10 o 15 minutos. No hay cuenta regresiva; primero va lo que no has terminado.") : I.T("No activities match your plan. Change your plan to see activities.", "Ninguna actividad coincide con tu plan. Cambia tu plan para ver actividades.")}
          </p>
          <ul class="ll-legend" aria-label="${I.S("The four stations", "Las cuatro estaciones")}">
            <li class="d-listening">
              <span
                ><strong>${I.T("Sound Dome", "Cúpula del sonido")}</strong> ·
                ${I.T("listen for the details that matter", "escucha los detalles importantes")}</span
              >
            </li>
            <li class="d-reading">
              <span
                ><strong>${I.T("Reading Atelier", "Taller de lectura")}</strong> ·
                ${I.T("find the sentence that proves it", "encuentra la oración que lo prueba")}</span
              >
            </li>
            <li class="d-speaking">
              <span
                ><strong>${I.T("Expression Stage", "Escenario de expresión")}</strong> ·
                ${I.T("plan it, say it, say it better", "planéalo, dilo y dilo mejor")}</span
              >
            </li>
            <li class="d-writing">
              <span
                ><strong>${I.T("Composition Desk", "Mesa de composición")}</strong> ·
                ${I.T("draft, revise, then write on your own", "escribe, revisa y luego escribe por tu cuenta")}</span
              >
            </li>
          </ul>
        </div>
        ${heroStageHTML(I, ctx, band, suggested)}
      </section>

      <section class="ll-next" aria-labelledby="sessionTitle">
        <div class="session-plan">
          <div class="plan-head">
            <p class="ll-kicker">
              ${I.T("Your next learning action", "Tu próxima acción de aprendizaje")}
            </p>
            <h2 id="sessionTitle">${I.T("Today’s mission", "La misión de hoy")}</h2>
            <p class="fine">
              ${plan.length ? I.T(`${plan.length} activities, about ${estimateMinutes(plan)} minutes. Unfinished work and due review come first.`, `${plan.length} actividades, unos ${estimateMinutes(plan)} minutos. Primero va lo que no has terminado y el repaso pendiente.`) : I.T("Change your plan to see activities.", "Cambia tu plan para ver actividades.")}
            </p>
          </div>
          <ol class="plan-preview">
            ${plan.slice(0, 3).map(
              (r) =>
                html`<li class="d-${r.domain.toLowerCase()}">
                  <span class="plan-dot">${icon(DOMAIN_META[r.domain]?.icon || "star")}</span
                  ><span
                    ><a href="${BASE}/${r.domain}/${r.level}/${r.id}?grades=${band}">${r.title}</a
                    ><span class="fine">${domT(I, r.domain)} · ${reasonT(I, r.reason)}</span></span
                  >
                </li>`,
            )}
          </ol>
          ${planOptionsHTML(I, { plan, focus, level, count, option, band, shippedLevels })}
        </div>
        <aside class="today-side" aria-label="${I.S("Your next step", "Tu próximo paso")}">
          <a class="progress-note" href="${BASE}/passport?grades=${band}"
            >${icon("passport")}<span
              ><strong
                >${stamps ? I.T(`${stamps} activit${stamps === 1 ? "y" : "ies"} finished`, `${stamps} ${stamps === 1 ? "actividad terminada" : "actividades terminadas"}`) : I.T("Your Passport is empty", "Tu Pasaporte está vacío")}</strong
              ><span class="fine"
                >${stamps ? I.T(`${streak ? `${streak}-week practice streak. ` : ""}See your saved work.`, `${streak ? `Racha de práctica de ${streak} ${streak === 1 ? "semana" : "semanas"}. ` : ""}Mira tu trabajo guardado.`) : I.T("Finish an activity and it is saved here, on this device.", "Termina una actividad y se guarda aquí, en este dispositivo.")}</span
              ></span
            ></a
          >
        </aside>
      </section>

      ${due.length ? "" : reviewPanel}

      <section class="ll-studios" id="skills" aria-labelledby="roomsTitle">
        <div class="ll-section-head">
          <p class="ll-kicker">${I.T("Four language studios", "Cuatro estudios de lenguaje")}</p>
          <h2 id="roomsTitle">${I.T("Choose a studio", "Elige un estudio")}</h2>
          <p class="fine">
            ${I.T("Each studio has three support choices: Starting, Growing and Expanding. They change the help you get, not a score.", "Cada estudio tiene tres opciones de apoyo: Comenzando, Creciendo y Ampliando. Cambian la ayuda que recibes, no un puntaje.")}
          </p>
        </div>
        <div class="room-grid ll-portals">${tiles}</div>
      </section>

      <details class="lph-dashboard">
        <summary>
          <span>${I.T("More ways to learn", "Más formas de aprender")}</span>
          <strong>${I.T("Explore activities, plans and progress", "Explora actividades, planes y progreso")}</strong>
          <span class="fine">${I.T("Your learning tools and resources are ready when you need them.", "Tus herramientas y recursos están listos cuando los necesites.")}</span>
        </summary>
        <div class="lph-dashboard-content">
          <nav class="lph-dashboard-links" aria-label="${I.S("More ways to start", "Más formas de empezar")}">
            <div class="studio-grid">${cardsFor("start", band).map(card)}</div>
          </nav>

      <section class="ll-library lph-explore" id="explore" aria-labelledby="exploreTitle">
        <div class="ll-section-head">
          <p class="ll-kicker">${I.T("Studios, worlds and games", "Estudios, mundos y juegos")}</p>
          <h2 id="exploreTitle">
            ${I.T("Explore all activities", "Explora todas las actividades")}
          </h2>
          <p class="fine">
            ${I.T("Choose a studio, a world or a game. Everything saves on this device.", "Elige un estudio, un mundo o un juego. Todo se guarda en este dispositivo.")}
          </p>
        </div>
        <div class="studio-grid">${featured.map(card)}</div>
        ${
          more.length
            ? html`<details class="lph-more">
                <summary>${I.T(`Show ${more.length} more`, `Mostrar ${more.length} más`)}</summary>
                <div class="studio-grid">${more.map(card)}</div>
              </details>`
            : ""
        }
        <p>
          <a class="btn" href="${BASE}/library?grades=${band}"
            >${icon("library")}
            ${I.T("Open the activity library", "Abrir la biblioteca de actividades")}</a
          >
        </p>
      </section>

      <section class="ll-world band-identity-strip" aria-labelledby="bandIdentityTitle">
        <div class="ll-world-art" aria-hidden="true">
          <img
            src="${ART}/hall-${band === "3-5" ? "35" : "68"}.svg"
            width="1200"
            height="760"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="ll-world-copy">
          <p class="ll-kicker">
            ${band === "3-5" ? I.T("Language World · Grades 3–5", "Mundo del lenguaje · Grados 3–5") : I.T("Language World · Grades 6–8", "Mundo del lenguaje · Grados 6–8")}
          </p>
          <h2 id="bandIdentityTitle"><span lang="en">${exScenario.title}</span></h2>
          <p>
            ${band === "3-5" ? I.T("One science fair, four ways to use language. Hear where to go, read about a bean test, tell what happened, then write why.", "Una feria de ciencias, cuatro formas de usar el lenguaje. Escucha adónde ir, lee sobre una prueba con frijoles, cuenta lo que pasó y escribe por qué.") : I.T("One exhibition, four linked tasks: catch the key details, find evidence, explain a process, then argue for a design with evidence.", "Una exposición, cuatro tareas unidas: capta los detalles clave, encuentra evidencia, explica un proceso y luego defiende un diseño con evidencia.")}
          </p>
          <ol class="ll-world-path">
            ${exProgress.steps.map(({ step, status }) => html`<li class="is-${status}"><span>${I.T(...stepWord[step])}</span><span class="fine">${exStatus(status)}</span></li>`)}
          </ol>
          <div class="row-actions">
            <a
              class="btn btn-primary"
              href="${BASE}/exhibition${exProgress.done ? `/${exProgress.next || "write"}` : ""}?grades=${band}"
              >${exProgress.done ? I.T("Continue the exhibition", "Continuar la exposición") : I.T("Enter the exhibition", "Entrar a la exposición")}${icon("arrow-right")}</a
            >
            <a class="btn ll-btn-quiet" href="${BASE}/worlds?grades=${band}"
              >${icon("worlds")} ${I.T("More Language Worlds", "Más mundos lingüísticos")}</a
            >
          </div>
        </div>
      </section>

      <section class="ll-growth" aria-labelledby="growthTitle">
        <div class="ll-section-head">
          <p class="ll-kicker">${I.T("My Passport", "Mi Pasaporte")}</p>
          <h2 id="growthTitle">
            ${I.T("Your growth, from your own work", "Tu crecimiento, a partir de tu propio trabajo")}
          </h2>
        </div>
        <div class="ll-growth-grid">
          <a class="ll-passport-card" href="${BASE}/passport?grades=${band}">
            <span class="ll-passport-stamp" aria-hidden="true">${icon("passport")}</span>
            <strong
              >${stamps ? I.T(`${stamps} saved ${stamps === 1 ? "activity" : "activities"}`, `${stamps} ${stamps === 1 ? "actividad guardada" : "actividades guardadas"}`) : I.T("Ready for its first stamp", "Listo para su primer sello")}</strong
            >
            <span class="fine"
              >${I.T(`Language World: ${exProgress.done} of 4 steps. Drafts, revisions and backups live in your Passport.`, `Mundo del lenguaje: ${exProgress.done} de 4 pasos. Borradores, revisiones y copias de seguridad están en tu Pasaporte.`)}</span
            >
            <span class="ll-door-go"
              >${I.T("Open my Passport", "Abrir mi Pasaporte")}${icon("arrow-right")}</span
            >
          </a>
          <section class="panel weekly-goal" aria-labelledby="weeklyGoalTitle">
            <div>
              <p class="ll-kicker">${I.T("Your pace · no pressure", "Tu ritmo · sin presión")}</p>
              <h2 id="weeklyGoalTitle">
                ${I.T(`${practicedThisWeek} of ${engagement.weeklyGoal} practice days this week`, `${practicedThisWeek} de ${engagement.weeklyGoal} días de práctica esta semana`)}
              </h2>
              <p class="fine">
                ${I.T(`A practice day counts when saved work is recorded on this device. Your ${streak ? `${streak}-week streak` : "practice history"} stays yours if you take a week off.`, `Un día de práctica cuenta cuando se guarda trabajo en este dispositivo. Tu ${streak ? `racha de ${streak} ${streak === 1 ? "semana" : "semanas"}` : "historial de práctica"} sigue siendo tuyo si descansas una semana.`)}
              </p>
            </div>
            <label class="field"
              ><span>${I.T("Choose a weekly goal", "Elige una meta semanal")}</span
              ><select data-weekly-goal>
                ${[3, 4, 5, 7].map((n) => html`<option value="${n}" ${n === engagement.weeklyGoal ? raw("selected") : ""}>${I.T(`${n} days per week`, `${n} días por semana`)}</option>`)}
              </select></label
            >${practicedThisWeek >= engagement.weeklyGoal ? html`<p class="goal-done" role="status">${I.T("Weekly goal reached. Nice steady work!", "¡Meta semanal alcanzada! Buen trabajo constante.")}</p>` : ""}
          </section>
        </div>
        ${
          week
            ? html`<div class="road-strip">
                <div>
                  <p class="ll-kicker">
                    ${I.T(`Road to ACCESS · Week ${week.n} of 12`, `Camino a ACCESS · Semana ${week.n} de 12`)}
                  </p>
                  <h3 id="roadStripTitle">${week.taskType}: ${week.theme}</h3>
                  <p class="fine">${week.focus}</p>
                </div>
                <a class="btn" href="${BASE}/road/${week.n}?grades=${band}"
                  >${I.T("Open this week", "Abrir esta semana")}${icon("arrow-right")}</a
                >
              </div>`
            : ""
        }
      </section>

      <section class="ll-tests" aria-labelledby="testsTitle">
        <div class="ll-tests-copy">
          <p class="ll-kicker">
            ${I.T("Assessment-style practice · focused mode", "Práctica tipo evaluación · modo enfocado")}
          </p>
          <h2 id="testsTitle">${I.T("Practice tests", "Pruebas de práctica")}</h2>
          <p>
            ${I.T("A quiet screen with the timer, tools and navigation of a test, so the format feels familiar. Practice only: not an official ACCESS test, score, level or placement.", "Una pantalla tranquila con el temporizador, las herramientas y la navegación de una prueba, para que el formato se sienta familiar. Solo práctica: no es una prueba oficial ACCESS, ni un puntaje, nivel o ubicación.")}
          </p>
          <a class="btn btn-primary" href="${BASE}/tests?grades=${band}"
            >${icon("tests")}
            ${I.T("Open practice tests", "Abrir pruebas de práctica")}${icon("arrow-right")}</a
          >
        </div>
        <div class="ll-tests-links">
          ${door({ id: "assess", href: "assess", icon: "tests", title: ["Assessment simulator", "Simulador de evaluación"], text: ["Item types, tools and review, one question at a time.", "Tipos de preguntas, herramientas y revisión, una pregunta a la vez."] })}
          ${door({ id: "diagnostic", href: "diagnostic", icon: "checkin", title: ["Skill check-in", "Chequeo de destrezas"], text: ["Optional 4-minute starting point.", "Punto de partida opcional de 4 minutos."] })}
          ${door({ id: "tools", href: "tools", icon: "tools", title: ["Test tools warm-up", "Calentamiento con las herramientas de prueba"], text: ["Audio check and the WIDA demo.", "Prueba de audio y demostración de WIDA."] })}
        </div>
      </section>

      <section class="ll-library more-ways" aria-labelledby="moreTitle">
        <div class="ll-section-head">
          <p class="ll-kicker">${I.T("Library", "Biblioteca")}</p>
          <h2 id="moreTitle">
            ${I.T("Find any activity or studio", "Encuentra cualquier actividad o estudio")}
          </h2>
        </div>
        <form class="ll-search" action="${BASE}/library" method="get" role="search">
          <label for="homeSearch"
            >${I.T("Search every activity", "Busca en todas las actividades")}</label
          >
          <div class="ll-search-row">
            <input
              id="homeSearch"
              name="q"
              type="search"
              maxlength="120"
              autocomplete="off"
              placeholder="${I.S("Try: main idea, recipe, explain", "Prueba: idea principal, receta, explicar")}"
            /><input type="hidden" name="grades" value="${band}" /><button
              class="btn btn-primary"
              type="submit"
            >
              ${icon("search")} ${I.T("Search", "Buscar")}
            </button>
          </div>
        </form>
        ${kluHTML(I, ctx, band, rows, idx)}
      </section>

      <section class="ll-paths" aria-labelledby="pathsTitle">
        <h2 id="pathsTitle" class="visually-hidden">
          ${I.T("For teachers and families", "Para docentes y familias")}
        </h2>
        <div class="ll-path-door is-teacher" id="teachers">
          <p class="ll-kicker">${I.T("Teachers", "Docentes")}</p>
          <h3>
            ${I.T("Assign, teach and review evidence", "Asigna, enseña y revisa la evidencia")}
          </h3>
          ${cardsFor("teach", band).map(door)}
        </div>
        <div class="ll-path-door is-family" id="families">
          <p class="ll-kicker">${I.T("Families", "Familias")}</p>
          <h3>${I.T("Practice together at home", "Practiquen juntos en casa")}</h3>
          ${cardsFor("family", band).map(door)}
        </div>
      </section>
        </div>
      </details>`,
  };
}

export function onClick(e, ctx) {
  if (heroClick(e, ctx)) return true;
  const grade = e.target.closest?.("[data-grade-pick]");
  if (grade) {
    const pick = grade.dataset.gradePick;
    const band = pickBand(pick, ctx.bands);
    if (!band) return true;
    ctx.setPrefs({ gradePick: pick });
    const restore = () =>
      document
        .querySelector(`[data-grade-pick="${CSS.escape(pick)}"]`)
        ?.focus({ preventScroll: true });
    if (band !== ctx.band) {
      ctx.setBand(band);
      const url = new URL(location.href);
      url.searchParams.set("grades", band);
      Promise.resolve(ctx.navigate(url.pathname + url.search, { replace: true })).then(restore);
    } else Promise.resolve(ctx.rerender()).then(restore);
    return true;
  }
  const start = e.target.closest?.("[data-start-mission]");
  if (start) {
    const ids = start.dataset.sessionIds.split(",").filter(Boolean);
    if (ids.length) {
      const reviewIds = start.dataset.sessionReviewIds.split(",").filter(Boolean);
      const session = startSession(
        ctx,
        ids.map((id) => ({ id })),
        Number(start.dataset.startMission),
        "Today's mission",
        reviewIds,
      );
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
  const value =
    KEY_LANGUAGE_USES.includes(btn.dataset.klu) && ctx.prefs.kluFocus !== btn.dataset.klu
      ? btn.dataset.klu
      : "";
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
  const session =
    engagement.activeSession?.id === ctx.route.sessionId
      ? engagement.activeSession
      : engagement.lastSession?.id === ctx.route.sessionId
        ? engagement.lastSession
        : null;
  if (!session || session.id !== ctx.route.sessionId)
    return {
      title: "",
      html: html`<p>
        <a class="btn btn-primary" href="${BASE}/?grades=${ctx.band}">Back to today’s mission</a>
      </p>`,
    };
  const items = (
    await Promise.all(session.ids.map((id) => findActivity(id).catch(() => null)))
  ).filter(Boolean);
  const practiced = items.filter((item) => {
    const result = loadRecord(item.band, item.domain, item.level).results?.[item.activity.id];
    return (
      result?.date && Date.parse(result.date) >= Date.parse(session.started) && !needsReview(result)
    );
  });
  if (!practiced.length)
    return {
      title: "Mission",
      html: html`<section class="session-finish panel">
        <h1 tabindex="-1">Ready when you are</h1>
        <p>Try at least one activity in this session before finishing. Your place is saved.</p>
        <a class="btn btn-primary" href="${sessionHref(session)}"
          >Resume this mission${icon("arrow-right")}</a
        >
      </section>`,
    };
  const earned =
    engagement.activeSession?.id === session.id ? finishSession(ctx, session.id, true).earned : 0;
  const domains = [...new Set(practiced.map((item) => item.domain))];
  return {
    title: "Mission complete",
    html: html`<section class="session-finish panel" aria-labelledby="finishTitle">
      <p class="eyebrow">EduWonderLab · Mission complete</p>
      <h1 id="finishTitle" tabindex="-1">You made time for language today.</h1>
      <p class="lead">
        You practiced ${practiced.length} ${practiced.length === 1 ? "activity" : "activities"}
        across ${domains.join(", ")} in an estimated ${session.minutes} minute session. There was no
        timer.
      </p>
      <h2>What you practiced</h2>
      <ul>
        ${practiced.map((item) => html`<li>${item.activity.title} · ${item.domain}</li>`)}
      </ul>
      <p>
        Try this strategy next: name the evidence, explain your choice, then use that move on a new
        task.
      </p>
      ${earned ? html`<p class="reward-chip" role="status">+${earned} Passport XP for completing this session</p>` : html`<p class="fine" role="status">Today’s session reward was already earned. Your practice is saved.</p>`}
      <p class="fine">
        XP celebrates participation and learning habits. It is not a proficiency score or placement.
      </p>
      <div class="session-heading">
        <a class="btn btn-primary" href="${BASE}/passport?grades=${session.band}"
          >See your Passport${icon("arrow-right")}</a
        ><a class="btn" href="${BASE}/?grades=${session.band}">Choose a next step</a>
      </div>
    </section>`,
  };
}
