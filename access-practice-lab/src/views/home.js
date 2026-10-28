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
  bandLabel,
  formatDate,
  html,
  icon,
  testingWindowPhase,
  raw,
} from "../util.js";
import { estimateMinutes } from "../learning.js";
import { loadStudioIndex } from "../content.js";
import { recommendTasks } from "../lang/adapt.js";
import { filterByKeyUse, KEY_LANGUAGE_USES, KLU_DOMAINS, kluReference } from "../lang/purpose.js";
import { loadLedger } from "../lang/ledger.js";
import { loadStudio } from "../lang/studio.js";
import { buildPracticePlan, STATUS_REASON } from "../practice-plan.js";
import { i18nFor } from "../i18n.js";
import { currentWeek } from "./road.js";
import { daysThisWeek, finishSession, getEngagement, saveEngagement, sessionHref, startSession } from "../engagement.js";
import { trimToMinutes } from "../family/plan.js";

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

function kluHTML(I, ctx, band, rows, idx) {
  const klu = KEY_LANGUAGE_USES.includes(ctx.prefs.kluFocus) ? ctx.prefs.kluFocus : "";
  const ref = klu ? kluReference(klu, band) : null;
  const studioTasks = [...(idx?.speaking || []).map((t) => ({ ...t, domain: "Speaking" })), ...(idx?.writing || []).map((t) => ({ ...t, domain: "Writing" }))].filter((t) => !t.band || t.band === band);
  const practice = (domain) => {
    if (domain === "Speaking" || domain === "Writing")
      return filterByKeyUse(studioTasks, klu, domain).slice(0, 3).map((t) => [`${BASE}/${domain === "Speaking" ? "speak" : "write"}/${t.id}?grades=${band}`, t.title]);
    const tier = ctx.prefs.tiers?.[domain] || "A";
    return filterByKeyUse(rows.filter((r) => r.domain === domain && r.level === tier), klu, domain).slice(0, 3).map((r) => [`${BASE}/${domain}/${r.level}/${r.id}?grades=${band}`, r.title]);
  };
  const missions = klu ? filterByKeyUse((idx?.missions || []).filter((m) => !m.band || m.band === band), klu) : [];
  return html`<section class="panel klu-practice" aria-labelledby="kluTitle">
    <p class="eyebrow">${I.T("Practice by Key Language Use", "Practica por Uso clave del lenguaje")}</p>
    <h2 id="kluTitle">${I.T("What do you want your language to do?", "¿Qué quieres que haga tu lenguaje?")}</h2>
    <div class="sort-cats" role="group" aria-label="${I.S("Key Language Use", "Uso clave del lenguaje")}">
      ${KEY_LANGUAGE_USES.map((k) => html`<button type="button" class="cat-chip" id="klu-${k}" data-klu="${k}" aria-pressed="${k === klu ? "true" : "false"}">${k}</button>`)}
    </div>
    ${ref ? html`<p>${ref.purpose}</p>
      <div class="domain-grid">
        <div class="card"><h3>${I.T("How it is organized", "Cómo se organiza")}</h3><ol>${ref.moves.map((m) => html`<li>${m}</li>`)}</ol></div>
        <div class="card"><h3>${I.T("Language functions", "Funciones del lenguaje")}</h3><ul>${ref.functions.map((m) => html`<li>${m}</li>`)}</ul></div>
        <div class="card"><h3>${I.T("Signal words", "Palabras señal")}</h3><p>${ref.signals.join(" · ")}</p></div>
      </div>
      <div class="domain-grid">
        ${KLU_DOMAINS.map((d) => {
          const links = practice(d);
          return html`<div class="card"><h3>${domT(I, d)}</h3><p class="fine">${ref.domains[d]}</p>${links.length ? html`<ul>${links.map(([href, title]) => html`<li><a href="${href}">${title}</a></li>`)}</ul>` : html`<p class="fine">${I.T(`No ${klu} activity at your ${d} support right now.`, `No hay actividades de ${klu} para ${DOMAIN_META[d]?.es?.toLowerCase() ?? d} con tu apoyo actual.`)} <a href="${BASE}/library?grades=${band}">${I.T("Find one in the library", "Busca una en la biblioteca")}</a>.</p>`}</div>`;
        })}
      </div>
      ${missions.length ? html`<p class="fine">${I.T(`Missions that use ${klu}:`, `Misiones que usan ${klu}:`)} ${missions.map((m, i) => html`${i ? " · " : ""}<a href="${BASE}/missions/${m.id}?grades=${band}">${m.title}</a>`)}</p>` : ""}
      <p class="fine">${I.T(`Reference for grades ${ref.band.replace("-", "–")}, in the lab's own words. Choose the same button again to close it.`, `Referencia para los grados ${ref.band.replace("-", "–")}, con las palabras del laboratorio. Elige el mismo botón otra vez para cerrarla.`)}</p>`
    : html`<p class="fine">${I.T("Choose Narrate, Inform, Explain or Argue to see how that kind of language is organized, its signal words, and practice in listening, reading, speaking and writing.", "Elige Narrate, Inform, Explain o Argue para ver cómo se organiza ese tipo de lenguaje, sus palabras señal y práctica de escuchar, leer, hablar y escribir.")}</p>`}
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

  const tiles = CORE_DOMAINS.filter((d) => domains[d]).map((d) => {
    const meta = DOMAIN_META[d];
    const levels = domains[d].levels;
    const tier = tierFor(ctx, d, levels);
    const { done, total, next } = nextActivity(band, d, tier, levels[tier].activities);
    const record = loadRecord(band, d, tier);
    const { status } = practiceSummary(record.results, done, total);
    const statusClass = status.toLowerCase().replace(/\s+/g, "-");
    const roomHref = `${BASE}/${d}/${tier}?grades=${band}`;
    const href = next ? `${BASE}/${d}/${tier}/${next[0]}?grades=${band}` : roomHref;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return html`<article class="room-tile d-${d.toLowerCase()}">
      <a class="room-art" href="${roomHref}" tabindex="-1" aria-hidden="true"
        ><img src="${ART}/domain-${d.toLowerCase()}.svg" width="480" height="360" alt="" loading="lazy" decoding="async"
      /></a>
      <div class="room-body">
        <h3 class="room-name"><a class="room-link" href="${roomHref}">${I.T(meta.name, meta.es)}</a></h3>
        <p class="room-blurb">${I.T(meta.blurb, BLURB_ES[d])}</p>
          <span class="practice-status is-${statusClass}">${I.T(status, PRACTICE_STATUS_ES[status])}</span>
        <div class="room-progress">
          <div class="bar" role="img" aria-label="${I.S(`${meta.name}: ${done} of ${total} activities done`, `${meta.es}: ${done} de ${total} actividades hechas`)}"><i style="width:${pct}%"></i></div>
          <p class="fine">${I.T(`${done} of ${total} done · ${TIERS[tier]?.name || tier} support`, `${done} de ${total} hechas · apoyo ${TIERS[tier]?.es || tier}`)}</p>
        </div>
        ${
          next
            ? html`<a class="btn btn-room" href="${href}">${done ? I.T(`Continue ${meta.name.toLowerCase()}`, `Seguir con ${meta.es.toLowerCase()}`) : I.T(`Start ${meta.name.toLowerCase()}`, `Empezar a ${meta.es.toLowerCase()}`)}${icon("arrow-right")}</a>
                <p class="room-next fine">${I.T("Next:", "Siguiente:")} ${next[1]}</p>`
            : html`<a class="btn btn-room" href="${roomHref}">${I.T("Level complete — choose another", "Nivel completo: elige otro")}${icon("arrow-right")}</a>`
        }
      </div>
    </article>`;
  });

  const studioLink = (id, ic, title, text) =>
    html`<a class="studio-card" href="${BASE}/${id}?grades=${band}">${icon(ic)}<span><strong>${title}</strong><span>${text}</span></span></a>`;
  const tool = (id, ic, title, text) =>
    html`<a class="tool-row" href="${id.startsWith("/") ? id : `${BASE}/${id}?grades=${band}`}">${icon(ic)}<span><strong>${title}</strong><span>${text}</span></span></a>`;
  const worldCard = (id, title, text, color, domain) =>
    html`<a class="world-mini-card" href="${BASE}/worlds/${id}?grades=${band}" style="--world:${color}"><img src="${BASE}/pictures/worlds/${id}.svg" alt="" width="96" height="70" loading="lazy" /><span><strong>${title}</strong><span>${domT(I, domain)} · ${text}</span></span></a>`;

  return {
    title: "",
    html: html`<section class="home-hero" aria-labelledby="homeTitle">
        <div class="hero-copy">
          <p class="eyebrow">${I.T(`ACCESS Practice Lab · ${bandLabel(band)}`, `Laboratorio de práctica ACCESS · Grados ${band.replace("-", "–")}`)}</p>
          ${bandSwitchHTML(band, ctx.bands)}
          <h1 id="homeTitle" tabindex="-1"><span class="w-listening">${I.T("Listen.", "Escucha.")}</span> <span class="w-reading">${I.T("Read.", "Lee.")}</span> <span class="w-speaking">${I.T("Speak.", "Habla.")}</span> <span class="w-writing">${I.T("Write.", "Escribe.")}</span></h1>
          <p class="lead">${I.T("Short practice sessions for multilingual learners, with supports you choose and time to try again.", "Sesiones cortas de práctica para estudiantes multilingües, con apoyos que tú eliges y tiempo para intentar de nuevo.")}</p>
          <div class="session-heading">
            ${resume ? html`<a class="btn btn-primary btn-big" href="${sessionHref(resume)}">${I.T("Resume today’s mission", "Retoma la misión de hoy")} · ${I.L("common.minutes", { n: resume.minutes })}${icon("arrow-right")}</a>` : ""}
            ${plan.length ? [5, 10, 15].map((minutes) => { const activities = trimToMinutes(plan, minutes); return html`<button type="button" class="btn ${minutes === 10 ? "btn-primary" : ""} btn-big" data-start-mission="${minutes}" data-session-ids="${activities.map((r) => r.id).join(",")}" data-session-review-ids="${activities.filter((r) => due.some((item) => r.review?.key === item.key)).map((r) => r.id).join(",")}">${resume ? I.T("Start a new session", "Empezar una sesión nueva") : I.T("Start today’s mission", "Empezar la misión de hoy")} · ${I.L("common.minutes", { n: minutes })}</button>`; }) : html`<a class="btn btn-big" href="#skills">${I.T("Choose a skill", "Elige una habilidad")}</a>`}
          </div>
          <p class="session-summary" aria-live="polite">${plan.length ? I.T("Purpose: practice language toward a meaningful goal. Choose about 5, 10, or 15 minutes; there is no countdown.", "Propósito: practicar el lenguaje para alcanzar una meta significativa. Elige unos 5, 10 o 15 minutos; no hay cuenta regresiva.") : I.T("No activities match your plan. Change your plan to see activities.", "Ninguna actividad coincide con tu plan. Cambia tu plan para ver actividades.")}</p>
        </div>
        <div class="hero-art"><img src="${ART}/hero.svg" width="720" height="600" alt="${I.S("Four tiles for listening, reading, speaking and writing, linked by a speech bubble", "Cuatro mosaicos para escuchar, leer, hablar y escribir, unidos por un globo de diálogo")}" decoding="async" fetchpriority="high" /></div>
      </section>

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

      <div class="home-today">
        <section class="session-plan panel" aria-labelledby="sessionTitle">
          <div class="plan-head">
            <h2 id="sessionTitle">${I.T("Today’s mission", "La misión de hoy")}</h2>
            <p class="fine">${plan.length ? I.T(`${plan.length} activities, about ${estimateMinutes(plan)} minutes. Unfinished work and due review come first.`, `${plan.length} actividades, unos ${estimateMinutes(plan)} minutos. Primero va lo que no has terminado y el repaso pendiente.`) : I.T("Change your plan to see activities.", "Cambia tu plan para ver actividades.")}</p>
          </div>
          <ol class="plan-preview">
            ${plan.slice(0, 3).map((r) => html`<li><span class="plan-dot d-${r.domain.toLowerCase()}">${icon(DOMAIN_META[r.domain]?.icon || "star")}</span><span><a href="${BASE}/${r.domain}/${r.level}/${r.id}?grades=${band}">${r.title}</a><span class="fine">${domT(I, r.domain)} · ${reasonT(I, r.reason)}</span></span></li>`)}
          </ol>
          <details id="planOptions" class="session-options"><summary>${I.T("Change my plan or see all activities", "Cambiar mi plan o ver todas las actividades")}</summary>
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
          </details>
        </section>
        <aside class="today-side" aria-label="${I.S("Your next step", "Tu próximo paso")}">
          ${next ? html`<a class="next-step" href="${next.href}"><span class="eyebrow">${I.T("Your next step", "Tu próximo paso")}</span><strong>${next.title}</strong><span class="fine">${next.why}</span><span class="next-go">${icon("arrow-right")}</span></a>` : ""}
          <a class="progress-note" href="${BASE}/passport?grades=${band}">${icon("passport")}<span><strong>${stamps ? I.T(`${stamps} activit${stamps === 1 ? "y" : "ies"} finished`, `${stamps} ${stamps === 1 ? "actividad terminada" : "actividades terminadas"}`) : I.T("Your Passport is empty", "Tu Pasaporte está vacío")}</strong><span class="fine">${stamps ? I.T(`${streak ? `${streak}-week practice streak. ` : ""}See your saved work.`, `${streak ? `Racha de práctica de ${streak} ${streak === 1 ? "semana" : "semanas"}. ` : ""}Mira tu trabajo guardado.`) : I.T("Finish an activity and it is saved here, on this device.", "Termina una actividad y se guarda aquí, en este dispositivo.")}</span></span></a>
        </aside>
      </div>

      <section class="panel weekly-goal" aria-labelledby="weeklyGoalTitle"><div><p class="eyebrow">${I.T("Your pace · no pressure", "Tu ritmo · sin presión")}</p><h2 id="weeklyGoalTitle">${I.T(`${practicedThisWeek} of ${engagement.weeklyGoal} practice days this week`, `${practicedThisWeek} de ${engagement.weeklyGoal} días de práctica esta semana`)}</h2><p class="fine">${I.T(`A practice day counts when saved work is recorded on this device. Your ${streak ? `${streak}-week streak` : "practice history"} and Passport accomplishments stay yours if you take a week off.`, `Un día de práctica cuenta cuando se guarda trabajo en este dispositivo. Tu ${streak ? `racha de ${streak} ${streak === 1 ? "semana" : "semanas"}` : "historial de práctica"} y tus logros del Pasaporte siguen siendo tuyos si descansas una semana.`)}</p></div><label class="field"><span>${I.T("Choose a weekly goal", "Elige una meta semanal")}</span><select data-weekly-goal>${[3, 4, 5, 7].map((n) => html`<option value="${n}" ${n === engagement.weeklyGoal ? raw("selected") : ""}>${I.T(`${n} days per week`, `${n} días por semana`)}</option>`)}</select></label>${practicedThisWeek >= engagement.weeklyGoal ? html`<p class="goal-done" role="status">${I.T("Weekly goal reached. Nice steady work!", "¡Meta semanal alcanzada! Buen trabajo constante.")}</p>` : ""}</section>
      ${due.length ? reviewHTML(I, due, plan, band, ctx) : html`<section class="panel review-due"><h2>${I.T("Keep it strong", "Mantenlo fuerte")}</h2><p>${I.T("Previous words and language patterns return when they are ready for another look.", "Las palabras y los patrones de lenguaje anteriores vuelven cuando es buen momento para repasarlos.")}</p><a class="btn" href="${BASE}/growth?grades=${band}">${I.T("Open review and growth", "Abrir repaso y progreso")}${icon("arrow-right")}</a></section>`}

      <section class="skills" id="skills" aria-labelledby="roomsTitle">
        <div class="section-head"><h2 id="roomsTitle">${I.T("Choose a skill", "Elige una habilidad")}</h2><p class="fine">${I.T("Each skill has three support levels. Start at Starting and move on when you are ready.", "Cada habilidad tiene tres niveles de apoyo. Empieza en Comenzando y avanza cuando estés listo o lista.")}</p></div>
        <div class="room-grid">${tiles}</div>
      </section>

      <section class="panel journey-connect" aria-labelledby="journeyConnectTitle"><div><p class="eyebrow">${I.T("Your learning journey", "Tu recorrido de aprendizaje")}</p><h2 id="journeyConnectTitle">${I.T("Choose a language goal and take the next stop", "Elige una meta de lenguaje y avanza a la próxima parada")}</h2><p class="fine">${I.T("Road to ACCESS and Language Worlds connect practice to goals such as explaining a cause, supporting a claim, or retelling events. Every practice stop remains open to you.", "El Camino a ACCESS y los Mundos lingüísticos conectan la práctica con metas como explicar una causa, apoyar una afirmación o volver a contar eventos. Todas las actividades siguen disponibles.")}</p></div><a class="btn" href="${BASE}/road?grades=${band}">${I.T("Open the journey", "Abrir el recorrido")}${icon("arrow-right")}</a><a class="btn" href="${BASE}/worlds?grades=${band}">${I.T("Explore Language Worlds", "Explorar Mundos lingüísticos")}${icon("arrow-right")}</a></section>

      <section class="more-ways" aria-labelledby="moreTitle">
        <div class="section-head"><h2 id="moreTitle">${I.T("More ways to practice", "Más formas de practicar")}</h2><p class="fine">${I.T("Do real language tasks, get specific feedback, revise, then try it on your own.", "Haz tareas de lenguaje reales, recibe comentarios específicos, revisa y luego inténtalo por tu cuenta.")}</p></div>
        <div class="studio-grid">
          ${studioLink("speak", "speaking", I.T("Speaking Studio", "Estudio de expresión oral"), I.T("Plan, record, listen back, and say it better.", "Planea, graba, escucha y mejora lo que dices."))}
          ${studioLink("write", "writing", I.T("Writing Studio", "Estudio de escritura"), I.T("Use sources, draft, get feedback, revise.", "Usa fuentes, escribe un borrador, recibe comentarios y revisa."))}
          ${studioLink("reading-room", "reading", I.T("Reading Room", "Sala de lectura"), I.T("Choose a text, annotate evidence, and keep your place.", "Elige un texto, anota la evidencia y guarda dónde ibas."))}
          ${studioLink("missions", "mission", I.T("Academic missions", "Misiones académicas"), I.T("Listen, read, decide, speak and write in one investigation.", "Escucha, lee, decide, habla y escribe en una sola investigación."))}
          ${studioLink("detective", "detective", I.T("Error Detective", "Detective de errores"), I.T("Find a pattern in your work and fix it for good.", "Encuentra un patrón en tu trabajo y corrígelo para siempre."))}
          ${studioLink("vocabulary", "words", I.T("Word Builder", "Constructor de palabras"), I.T("Prefixes, roots, and academic words in context.", "Prefijos, raíces y palabras académicas en contexto."))}
        </div>
        ${kluHTML(I, ctx, band, rows, idx)}
      </section>

      <section class="world-showcase" aria-labelledby="worldEntryTitle">
        <div class="world-copy">
          <h2 id="worldEntryTitle">${I.T("Language Worlds", "Mundos lingüísticos")}</h2>
          <p>${I.T("Step into four places where language has consequences: dispatch audio, investigate with evidence, join a dialogue, and publish your story.", "Entra a cuatro lugares donde el lenguaje tiene consecuencias: envía audio, investiga con evidencia, participa en un diálogo y publica tu historia.")}</p>
          <a class="btn" href="${BASE}/worlds?grades=${band}">${I.T("Open Language Worlds", "Abrir Mundos lingüísticos")}${icon("arrow-right")}</a>
          <a class="btn" href="${BASE}/stories?grades=${band}">${I.T("Read a Neighborhood Notes episode", "Lee un episodio de Notas del vecindario")}${icon("arrow-right")}</a>
        </div>
        <div class="world-cards-grid">
          ${worldCard("signal-station", "Signal Station", I.T("Audio dispatch", "Mensajes de audio"), "var(--listening)", "Listening")}
          ${worldCard("evidence-city", "Evidence City", I.T("Investigations", "Investigaciones"), "var(--reading)", "Reading")}
          ${worldCard("conversation-quest", "Conversation Quest", I.T("Dialogue", "Diálogo"), "var(--speaking)", "Speaking")}
          ${worldCard("storyworks", "StoryWorks", I.T("Publishing", "Publicación"), "var(--writing)", "Writing")}
        </div>
      </section>

      ${
        week
          ? html`<section class="road-strip" aria-labelledby="roadStripTitle">
              <div>
                <p class="eyebrow">${I.T(`Road to ACCESS · Week ${week.n} of 12`, `Camino a ACCESS · Semana ${week.n} de 12`)}</p>
                <h2 id="roadStripTitle">${week.taskType}: ${week.theme}</h2>
                <p>${week.focus}</p>
              </div>
              <a class="btn btn-primary" href="${BASE}/road/${week.n}?grades=${band}">${I.T("Open this week", "Abrir esta semana")}${icon("arrow-right")}</a>
            </section>`
          : ""
      }

      <section class="tools-band" aria-labelledby="toolsTitle">
        <h2 id="toolsTitle">${I.T("Plan, check and share", "Planifica, revisa y comparte")}</h2>
        <div class="tool-grid">
          ${tool("tests", "tests", I.T("Practice tests", "Pruebas de práctica"), I.T("Full tests and short minis.", "Pruebas completas y minipruebas cortas."))}
          ${tool("library", "library", I.T("Find an activity", "Buscar una actividad"), I.T("Search every quick-practice activity.", "Busca entre todas las actividades de práctica rápida."))}
          ${tool("road", "road", I.T("Road to ACCESS", "Camino a ACCESS"), I.T("A 12-week plan, one stop a week.", "Un plan de 12 semanas, una parada por semana."))}
          ${tool("diagnostic", "checkin", I.T("Skill check-in", "Chequeo de destrezas"), I.T("Optional 4-minute starting point.", "Punto de partida opcional de 4 minutos."))}
          ${tool("growth", "growth", I.T("My growth", "Mi progreso"), I.T("Evidence from your own work.", "Evidencia de tu propio trabajo."))}
          ${tool("tools", "tools", I.T("Test tools warm-up", "Calentamiento con las herramientas de prueba"), I.T("Audio check and the WIDA demo.", "Prueba de audio y demostración de WIDA."))}
          ${tool("classroom", "classroom", I.T("Whole-Class Studio", "Estudio para toda la clase"), I.T("Projector-ready routines.", "Rutinas listas para proyectar."))}
          ${tool("launch-studio", "launch", I.T("Launch Studio", "Estudio de lanzamiento"), I.T("QR codes and direct links for teachers.", "Códigos QR y enlaces directos para docentes."))}
        </div>
      </section>`,
  };
}

export function onClick(e, ctx) {
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
