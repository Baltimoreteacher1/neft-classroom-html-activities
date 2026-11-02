// Interactive world selector and mission console for the four Language Worlds:
// Signal Station (Listening), Evidence City (Reading), Conversation Quest (Speaking), StoryWorks (Writing).
// Each world features 8 substantive, consequential missions per grade band with independent transfer.
import { crumbsHTML } from "../components.js";
import { bandDomains, loadDomain, loadStudioIndex, loadWorlds, ordered } from "../content.js";
import { WORLD_MISSIONS } from "../content/world-missions.js";
import { loadStudio } from "../lang/studio.js";
import { activityStatus } from "../practice-plan.js";
import { loadRecord } from "../store.js";
import { BASE, DOMAIN_META, html, icon, safeJson, storage } from "../util.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { activityHref } from "./room.js";

const PROGRESS_KEY = "accessPracticeLab:v1:world-missions";
let WORLDS = [];
let I = makeI18n("en");

function loadMissionProgress() {
  return safeJson(storage.get(PROGRESS_KEY), {}) || {};
}

function saveMissionProgress(data) {
  storage.set(PROGRESS_KEY, JSON.stringify(data));
}

const text = (value) => String(value || "");
const href = (id, band) => `${BASE}/worlds/${id}?grades=${band}`;
const domainClass = (domain) => `d-${String(domain).toLowerCase()}`;
const glyph = (domain) => icon(DOMAIN_META[domain]?.icon || "worlds");
const isDone = (progress, band, worldId, baseId) => Boolean(progress[`${band}:${worldId}:${baseId}`]);
const missionsOf = (worldId, band) => WORLD_MISSIONS[worldId]?.bands?.[band] || [];
const minutesLabel = (v) => (/^\d+$/.test(String(v)) ? `${v} min` : String(v));
const humanize = (v) => String(v || "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
const doneCount = (progress, band, worldId) =>
  missionsOf(worldId, band).filter((m) => isDone(progress, band, worldId, m.baseId)).length;
const MECHANIC_LABEL = {
  dispatch: "Dispatch: listen, then decide",
  evidence: "Evidence: read, then decide",
  dialogue: "Dialogue: choose how to reply",
  publishing: "Publishing: draft for a reader",
};
const MECHANIC_ES = {
  dispatch: { label: "Mensaje de audio: escucha y luego decide", noun: "mensaje de audio" },
  evidence: { label: "Evidencia: lee y luego decide", noun: "evidencia" },
  dialogue: { label: "Diálogo: elige cómo responder", noun: "diálogo" },
  publishing: { label: "Publicación: escribe para un lector", noun: "publicación" },
};
const HOW_IT_WORKS = [
  ["Take in the source", "Listen to a dispatch, read a report, or hear a message.", "Recibe la fuente", "Escucha un mensaje de audio, lee un informe u oye un mensaje."],
  ["Decide with evidence", "Choose the response the source supports, or draft your own.", "Decide con evidencia", "Elige la respuesta que respalda la fuente o escribe la tuya."],
  ["Explain it", "Use a language frame to say why, in your own words.", "Explícalo", "Usa una estructura de oración para decir por qué, con tus propias palabras."],
  ["Try it alone", "Carry the skill to a new situation without supports.", "Inténtalo por tu cuenta", "Lleva la destreza a una situación nueva sin apoyos."],
];
const domT = (d) => (DOMAIN_META[d] ? I.T(DOMAIN_META[d].name, DOMAIN_META[d].es) : d);
const domEs = (d) => (DOMAIN_META[d]?.es || d).toLowerCase();
const mechNoun = (m) => I.T(m, MECHANIC_ES[m]?.noun);
const crumbLab = () => I.T("Lab", "Laboratorio");
const crumbWorlds = () => I.T("Language Worlds", "Mundos lingüísticos");

/** The correct answer sits at position 0 in every authored mission, so show the choices in a stable shuffled order. */
function displayOrder(mission) {
  const n = mission.choices.length;
  let seed = 0;
  for (const ch of mission.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order[0] === mission.answer && n > 1) [order[0], order[1]] = [order[1], order[0]];
  return order;
}

function tile(world, band, progress) {
  const total = missionsOf(world.id, band).length;
  const done = doneCount(progress, band, world.id);
  return html`<a class="world-tile ${domainClass(world.domain)}" href="${href(world.id, band)}">
    <span class="world-art"><img src="${BASE}/pictures/worlds/${world.art}" alt="" width="640" height="360" loading="lazy" /></span>
    <span class="wd-body">
      <span class="lx-pill">${glyph(world.domain)} ${domT(world.domain)}</span>
      <strong class="world-name">${world.name}</strong>
      <span class="world-focus">${world.focus}</span>
      <span class="world-progress">
        <span class="bar" aria-hidden="true"><i style="width:${total ? Math.round((done / total) * 100) : 0}%"></i></span>
        <small>${I.T(`${done} of ${total} missions completed`, `${done} de ${total} misiones completadas`)}</small>
      </span>
    </span>
    <span class="world-open">${I.T("Enter world", "Entrar al mundo")} ${icon("arrow-right")}</span>
  </a>`;
}

async function activitiesFor(world, band) {
  const domainMap = await bandDomains(band);
  const domain = domainMap[world.domain];
  if (!domain) return [];
  const levels = Object.entries(domain.levels || {});
  const data = await loadDomain(band, world.domain);
  const all = [];
  const records = new Map();
  for (const [level] of levels) {
    const record = loadRecord(band, world.domain, level);
    records.set(level, record);
    for (const a of ordered(data.levels[level])) all.push({ ...a, level });
  }
  const terms = /sequence|evidence|explain|purpose|compare|infer|cause|detail|idea|reason|organ|process|direction/i;
  const prioritized = [...all].sort((a, b) => Number(terms.test(b.skill || b.title)) - Number(terms.test(a.skill || a.title)));
  return prioritized.slice(0, 8).map((a) => ({ ...a, done: activityStatus(records.get(a.level), a.id) === "done" }));
}

// In-memory UI state for active mission gameplay
const missionSession = {
  key: "",
  selectedChoice: null,
  checked: false,
  draftText: "",
  showTranscript: false,
  transferDone: false,
  emptyDraft: false,
};

function resetSession(key) {
  Object.assign(missionSession, { key, selectedChoice: null, checked: false, draftText: "", showTranscript: false, transferDone: false, emptyDraft: false });
}

const connectedCard = (m, band, state) =>
  html`<a class="card task-card" href="${BASE}/missions/${m.id}?grades=${band}">
    <span class="lx-pill">${icon("mission")} ${state?.done ? I.T("Mission complete", "Misión completa") : state?.started ? I.T("Continue mission", "Continuar misión") : m.contentArea}</span>
    <strong>${m.title}</strong>
    <span class="fine">${state?.done || state?.started ? `${m.contentArea} · ` : ""}${m.minutes} min</span>
    <span class="tc-summary">${m.summary}</span>
  </a>`;

function hubHTML(ctx, index, progress) {
  const band = ctx.band;
  const total = WORLDS.reduce((n, w) => n + missionsOf(w.id, band).length, 0);
  const done = WORLDS.reduce((n, w) => n + doneCount(progress, band, w.id), 0);
  const bridge = index.missions.filter((m) => m.band === band || m.band === "Both");
  return html`${crumbsHTML([[crumbLab(), `${BASE}/?grades=${band}`], [crumbWorlds(), null]], { i18n: I })}
    <section class="wd-hero">
      <div class="wd-hero-copy">
        <p class="eyebrow">${icon("worlds")} ${I.T(`Explore · Grades ${band.replace("-", "–")}`, `Explorar · Grados ${band.replace("-", "–")}`)}</p>
        <h1 tabindex="-1">${I.T("Four worlds. Consequential missions.", "Cuatro mundos. Misiones con consecuencias.")}</h1>
        <p class="lead">${I.T("Step into consequential language environments. Each world tests your communication in context with original missions and independent transfer.", "Entra a entornos de lenguaje con consecuencias. Cada mundo pone a prueba tu comunicación en contexto con misiones originales y transferencia independiente.")}</p>
        <p class="wd-hero-count">${I.T(`${done} of ${total} missions completed on this device`, `${done} de ${total} misiones completadas en este dispositivo`)}</p>
        <p class="wd-note">${icon("lock")} ${I.T("Private to this browser. These original learning simulations develop academic language; they do not calculate or predict official WIDA scores.", "Privado en este navegador. Estas simulaciones de aprendizaje originales desarrollan el lenguaje académico; no calculan ni predicen puntajes oficiales de WIDA.")}</p>
      </div>
      <aside class="wd-how" aria-labelledby="wd-how-title">
        <h2 id="wd-how-title">${I.T("How a mission works", "Cómo funciona una misión")}</h2>
        <ol>${HOW_IT_WORKS.map(([title, body, titleEs, bodyEs]) => html`<li><strong>${I.T(title, titleEs)}</strong><span>${I.T(body, bodyEs)}</span></li>`)}</ol>
      </aside>
    </section>
    <nav class="world-grid" aria-label="${I.S("Choose a learning world", "Elige un mundo de aprendizaje")}">${WORLDS.map((w) => tile(w, band, progress))}</nav>
    <section class="panel world-bridge">
      <h2>${I.T("Connected language missions", "Misiones de lenguaje conectadas")}</h2>
      <p>${I.T("Listen, read, collect evidence, discuss, and write through a complete investigation.", "Escucha, lee, reúne evidencia, conversa y escribe en una investigación completa.")}</p>
      <div class="task-grid world-bridge-grid">${bridge.map((m) => connectedCard(m, band, null))}</div>
    </section>`;
}

function stimulusHTML(world, mission, def) {
  if (world.id === "signal-station")
    return html`<div class="ms-dispatch">
      <div class="ms-dispatch-bar">
        <button type="button" class="btn btn-primary btn-domain" data-say="${mission.stimulus}" aria-label="${I.S("Play original listening dispatch", "Reproducir el mensaje de audio original")}">${icon("play")} ${I.T("Play dispatch audio", "Reproducir el audio del mensaje")}</button>
        <button type="button" class="btn" data-stop-audio>${icon("stop")} ${I.T("Stop", "Detener")}</button>
        <button type="button" class="btn" data-world-toggle-transcript aria-expanded="${missionSession.showTranscript}">
          ${missionSession.showTranscript ? I.T("Hide text", "Ocultar el texto") : I.T("Show text preview", "Ver vista previa del texto")}
        </button>
      </div>
      <p class="fine">${I.T("Listen first, then decide. A built-in computer voice reads this original script; replay as often as you like.", "Primero escucha y luego decide. Una voz de computadora integrada lee este guion original; repítelo las veces que quieras.")}</p>
      ${missionSession.showTranscript ? html`<blockquote class="ms-quote">${mission.stimulus}</blockquote>` : ""}
    </div>`;
  const label = def.mechanic === "dialogue" ? I.T("Message", "Mensaje") : def.mechanic === "publishing" ? I.T("Writing brief", "Instrucciones de escritura") : I.T("Source file", "Archivo de la fuente");
  return html`<figure class="ms-source">
    <figcaption>${glyph(world.domain)} ${label}</figcaption>
    <blockquote class="ms-quote">${mission.stimulus}</blockquote>
  </figure>`;
}

function choicesHTML(mission, def, isCorrect) {
  const order = displayOrder(mission);
  return html`<div class="choices ms-choices" role="radiogroup" aria-label="${I.S("Possible decisions", "Decisiones posibles")}">
      ${order.map((original, pos) => {
        const picked = missionSession.selectedChoice === original;
        const state = !missionSession.checked || !picked ? "" : isCorrect ? "is-right" : "is-wrong";
        return html`<label class="choice ${picked && !state ? "is-on" : ""} ${state}">
          <input type="radio" name="missionChoice" value="${original}" ${picked ? "checked" : ""} ${missionSession.checked ? "disabled" : ""} data-world-choice="${original}" />
          <span class="choice-letter">${String.fromCharCode(65 + pos)}</span>
          <span>${mission.choices[original]}</span>
        </label>`;
      })}
    </div>
    ${
      missionSession.checked
        ? html`<div class="feedback ${isCorrect ? "is-right" : "is-hint"}" role="status">
            <p class="fb-title">${icon(isCorrect ? "check" : "bulb")} ${isCorrect ? I.T("Coherent and supported by the source.", "Coherente y respaldada por la fuente.") : I.T("Consider the evidence again.", "Piensa otra vez en la evidencia.")}</p>
            <p>${isCorrect ? mission.feedback : I.T("Check the exact relationships in the source message before deciding.", "Revisa las relaciones exactas en el mensaje de la fuente antes de decidir.")}</p>
            ${isCorrect && mission.frame ? frameHTML(I.T("Language frame for explaining your decision", "Estructura de oración para explicar tu decisión"), mission.frame) : ""}
            ${isCorrect ? "" : html`<button type="button" class="btn btn-primary" data-world-retry>${icon("retry")} ${I.T("Try again", "Intentar de nuevo")}</button>`}
          </div>`
        : html`<div class="ms-actions"><button type="button" class="btn btn-primary btn-domain btn-big" data-world-check ${missionSession.selectedChoice === null ? "disabled" : ""}>${I.T(`Confirm ${def.mechanic} decision`, `Confirmar decisión de ${MECHANIC_ES[def.mechanic]?.noun || def.mechanic}`)}</button></div>`
    }`;
}

const frameHTML = (label, frame) =>
  html`<div class="ms-frame"><strong>${icon("writing")} ${label}</strong><p>${frame}</p></div>`;

function draftHTML(mission) {
  return html`<div class="ms-draft">
    <div class="ms-criteria"><strong>${icon("check")} ${I.T("Success criteria", "Criterios de éxito")}</strong><p>${mission.successCriteria}</p></div>
    <div class="ms-actions"><button type="button" class="btn" data-world-insert-frame="${text(mission.frame)}">${I.T("Insert sentence frame", "Insertar estructura de oración")}</button></div>
    <label for="missionDraft" class="visually-hidden">${I.T("Draft your response", "Escribe tu respuesta")}</label>
    <textarea id="missionDraft" rows="6" placeholder="${I.S("Draft your recommendation or explanation here...", "Escribe aquí tu recomendación o explicación...")}" data-world-draft>${missionSession.draftText}</textarea>
    <div class="ms-actions"><button type="button" class="btn btn-primary btn-domain btn-big" data-world-check-writing ${missionSession.checked ? "disabled" : ""}>${I.T("Review draft with success criteria", "Revisar el borrador con los criterios de éxito")}</button></div>
    ${
      missionSession.emptyDraft && !missionSession.checked
        ? html`<p class="feedback is-hint" role="alert">${icon("bulb")} ${I.T("Write at least one sentence first, then review your draft.", "Primero escribe al menos una oración y luego revisa tu borrador.")}</p>`
        : ""
    }
    ${
      missionSession.checked
        ? html`<div class="feedback is-right" role="status">
            <p class="fb-title">${icon("check")} ${I.T("Draft review", "Revisión del borrador")}</p>
            <p>${mission.feedback || I.T("Reread your draft against the success criteria above, revise one sentence, then compare with the target language pattern.", "Vuelve a leer tu borrador con los criterios de éxito de arriba, revisa una oración y compárala con el patrón de lenguaje meta.")}</p>
            ${frameHTML(I.T("Target language pattern", "Patrón de lenguaje meta"), mission.frame)}
          </div>`
        : ""
    }
  </div>`;
}

function transferHTML(world, band, mission, list, idx, completed) {
  const next = list[idx + 1];
  return html`<section class="ms-transfer" aria-label="${I.S("Independent transfer", "Transferencia independiente")}">
    <p class="eyebrow">${icon("flag")} ${I.T("Independent transfer challenge", "Reto de transferencia independiente")}</p>
    <h2>${I.T("Carry the skill to a new situation", "Lleva la destreza a una situación nueva")}</h2>
    <p>${mission.independent}</p>
    ${
      missionSession.transferDone
        ? html`<p class="ms-recorded" role="status">${icon("check")} ${I.T("Mission recorded on this device.", "Misión guardada en este dispositivo.")}</p>`
        : html`<div class="ms-actions"><button type="button" class="btn btn-primary btn-domain" data-world-complete="${world.id}:${mission.baseId}">${icon("check")} ${completed ? I.T("Mission completed (update progress)", "Misión completada (actualizar progreso)") : I.T("Complete mission & record transfer", "Completar la misión y guardar la transferencia")}</button></div>`
    }
    <div class="ms-actions">
      ${next && (completed || missionSession.transferDone) ? html`<a class="btn btn-primary" href="${BASE}/worlds/${world.id}/${next.baseId}?grades=${band}">${I.T(`Next mission: ${next.title}`, `Siguiente misión: ${next.title}`)} ${icon("arrow-right")}</a>` : ""}
      <a class="btn" href="${BASE}/worlds/${world.id}?grades=${band}">${icon("arrow-left")} ${I.T(`Return to ${world.name} board`, `Volver al tablero de ${world.name}`)}</a>
    </div>
    <p class="fine">${I.T("Independent responses are practiced on paper or shared with a partner. Practice results are never transmitted off this device.", "Las respuestas independientes se practican en papel o se comparten con un compañero o una compañera. Los resultados de práctica nunca salen de este dispositivo.")}</p>
  </section>`;
}

function missionHTML(ctx, world, mission, progress) {
  const band = ctx.band;
  const def = WORLD_MISSIONS[world.id];
  const list = missionsOf(world.id, band);
  const idx = list.findIndex((m) => m.baseId === mission.baseId);
  const completed = isDone(progress, band, world.id, mission.baseId);
  const isStoryWorks = world.id === "storyworks";
  const isCorrect = missionSession.checked && missionSession.selectedChoice === mission.answer;
  const showTransfer = missionSession.checked && (isStoryWorks || isCorrect);
  return html`${crumbsHTML([
      [crumbLab(), `${BASE}/?grades=${band}`],
      [crumbWorlds(), `${BASE}/worlds?grades=${band}`],
      [world.name, `${BASE}/worlds/${world.id}?grades=${band}`],
      [mission.title, null],
    ], { i18n: I })}
    <article class="mission-console ${domainClass(world.domain)}">
      <header class="ms-head">
        <div class="ms-head-bar">
          <span class="lx-pill">${glyph(world.domain)} ${world.name} · ${mechNoun(def.mechanic)}</span>
          <span class="ms-count">${I.T(`Mission ${idx + 1} of ${list.length}`, `Misión ${idx + 1} de ${list.length}`)}
            <span class="ms-pips" aria-hidden="true">${list.map((m, i) => html`<i class="${isDone(progress, band, world.id, m.baseId) ? "is-done" : ""} ${i === idx ? "is-here" : ""}"></i>`)}</span>
          </span>
        </div>
        <h1 tabindex="-1">${mission.title}</h1>
        <p class="ms-context">${mission.context}</p>
      </header>
      <div class="ms-grid">
        <section class="ms-panel ms-source-panel" aria-label="${I.S("Mission source materials", "Materiales de la fuente de la misión")}">
          <h2 class="workbook-heading"><span aria-hidden="true">1</span> ${I.T("Mission source", "Fuente de la misión")}</h2>
          ${stimulusHTML(world, mission, def)}
          <img class="ms-art" src="${BASE}/pictures/worlds/${world.art}" alt="" width="640" height="360" loading="lazy" />
        </section>
        <section class="ms-panel ms-work-panel" aria-label="${I.S("Mission investigation", "Investigación de la misión")}">
          <h2 class="workbook-heading"><span aria-hidden="true">2</span> ${isStoryWorks ? I.T("Draft and review", "Escribir y revisar") : I.T("Decide", "Decidir")}</h2>
          <p class="ms-prompt">${mission.prompt}</p>
          ${isStoryWorks ? draftHTML(mission) : choicesHTML(mission, def, isCorrect)}
        </section>
      </div>
      ${
        showTransfer
          ? transferHTML(world, band, mission, list, idx, completed)
          : html`<div class="ms-actions"><a class="btn" href="${BASE}/worlds/${world.id}?grades=${band}">${icon("arrow-left")} ${I.T(`Back to ${world.name} missions`, `Volver a las misiones de ${world.name}`)}</a></div>`
      }
    </article>`;
}

function missionCard(m, idx, world, band, progress, nextIdx) {
  const done = isDone(progress, band, world.id, m.baseId);
  const status = done ? html`${icon("check")} ${I.T("Completed", "Completada")}` : idx === nextIdx ? html`${icon("flag")} ${I.T("Up next", "Sigue ahora")}` : I.T("Not started", "Sin empezar");
  return html`<a class="world-mission-card ${done ? "is-done" : ""} ${idx === nextIdx ? "is-next" : ""}" href="${BASE}/worlds/${world.id}/${m.baseId}?grades=${band}">
    <span class="wm-top"><span class="wm-status">${status}</span><span class="wm-num">${String(idx + 1).padStart(2, "0")}</span></span>
    <strong>${text(m.title)}</strong>
    <span class="wm-context">${text(m.context)}</span>
    <span class="wm-go">${done ? I.T("Review mission", "Repasar la misión") : I.T("Launch mission", "Empezar la misión")} ${icon("arrow-right")}</span>
  </a>`;
}

async function worldHTML(ctx, world, index, studio, progress) {
  const band = ctx.band;
  const def = WORLD_MISSIONS[world.id];
  const list = missionsOf(world.id, band);
  const done = doneCount(progress, band, world.id);
  const nextIdx = list.findIndex((m) => !isDone(progress, band, world.id, m.baseId));
  const tasks = await activitiesFor(world, band);
  const missionPattern = new RegExp(world.missionHints.join("|"), "i");
  const missions = index.missions.filter((m) => (m.band === band || m.band === "Both") && missionPattern.test(`${m.title} ${m.summary}`));
  const fallback = missions.length ? missions : index.missions.filter((m) => m.band === band || m.band === "Both");
  const stations = [
    ["01", I.T("Domain studio", "Estudio de la destreza"), I.T(`Open ${world.domain} activities`, `Abrir actividades de ${domEs(world.domain)}`), `${BASE}/${world.domain}?grades=${band}`],
    ["02", I.T("Connected mission", "Misión conectada"), I.T("Investigate across domains", "Investiga entre destrezas"), fallback[0] ? `${BASE}/missions/${fallback[0].id}?grades=${band}` : `${BASE}/missions?grades=${band}`],
    ["03", I.T("Growth map", "Mapa de crecimiento"), I.T("Review evidence & progress", "Revisa la evidencia y el progreso"), `${BASE}/growth?grades=${band}`],
  ];
  return html`${crumbsHTML([[crumbLab(), `${BASE}/?grades=${band}`], [crumbWorlds(), `${BASE}/worlds?grades=${band}`], [world.name, null]], { i18n: I })}
    <div class="${domainClass(world.domain)}">
    <section class="world-detail">
      <div class="wd-detail-copy">
        <p class="eyebrow"><span class="lx-pill">${glyph(world.domain)} ${domT(world.domain)} · ${I.T(`Grades ${band.replace("-", "–")}`, `Grados ${band.replace("-", "–")}`)}</span></p>
        <h1 tabindex="-1">${world.name}</h1>
        <p class="lead">${world.description}</p>
        <dl class="wd-facts">
          <div><dt>${I.T("Language focus", "Enfoque del lenguaje")}</dt><dd>${world.focus}</dd></div>
          <div><dt>${I.T("Mechanic", "Mecánica")}</dt><dd>${MECHANIC_LABEL[def?.mechanic] ? I.T(MECHANIC_LABEL[def.mechanic], MECHANIC_ES[def.mechanic]?.label) : I.T("Simulation", "Simulación")}</dd></div>
          <div><dt>${I.T("Key Language Uses", "Usos clave del lenguaje")}</dt><dd>${world.keyUses.join(", ")}</dd></div>
        </dl>
        <p class="wd-progress"><span class="bar" aria-hidden="true"><i style="width:${list.length ? Math.round((done / list.length) * 100) : 0}%"></i></span><span>${I.T(`${done} of ${list.length} missions completed`, `${done} de ${list.length} misiones completadas`)}</span></p>
      </div>
      <div class="wd-detail-art"><img src="${BASE}/pictures/worlds/${world.art}" alt="" width="640" height="360" /></div>
    </section>

    <section class="panel world-missions-section">
      <div class="world-section-head">
        <div>
          <p class="eyebrow">${I.T("Consequential missions · 8 scenarios", "Misiones con consecuencias · 8 escenarios")}</p>
          <h2>${I.T(`${world.name} Mission Board`, `Tablero de misiones de ${world.name}`)}</h2>
          <p>${I.T("Every mission presents a real situation with observable evidence, focused language moves, and independent transfer.", "Cada misión presenta una situación real con evidencia observable, movimientos de lenguaje enfocados y transferencia independiente.")}</p>
        </div>
        <span class="lx-pill">${I.T(`${done} of ${list.length} completed`, `${done} de ${list.length} completadas`)}</span>
      </div>
      <div class="world-mission-grid">${list.map((m, idx) => missionCard(m, idx, world, band, progress, nextIdx))}</div>
    </section>

    <section class="world-map panel">
      <div>
        <p class="eyebrow">${I.T("Language learning path", "Ruta de aprendizaje del lenguaje")}</p>
        <h2>${I.T("Practice across the lab", "Practica en todo el laboratorio")}</h2>
        <p>${I.T("Carry skills between interactive game worlds, focused domain studios, and connected missions.", "Lleva tus destrezas entre mundos de juego interactivos, estudios de destreza y misiones conectadas.")}</p>
      </div>
      <ol class="world-stations">
        ${stations.map(([n, title, sub, to]) => html`<li><a href="${to}"><span class="ws-num">${n}</span><strong>${title}</strong><span>${sub}</span></a></li>`)}
      </ol>
    </section>

    <section class="panel">
      <div class="world-section-head">
        <div>
          <p class="eyebrow">${I.T(`${world.domain} tasks`, `Tareas de ${domEs(world.domain)}`)}</p>
          <h2>${I.T("Field practice activities", "Actividades de práctica de campo")}</h2>
          <p>${I.T("Try standard practice tasks or explore the complete curriculum room.", "Prueba tareas de práctica estándar o explora toda la sala del currículo.")}</p>
        </div>
        <a class="btn" href="${BASE}/${world.domain}?grades=${band}">${I.T("Open studio", "Abrir estudio")} ${icon("arrow-right")}</a>
      </div>
      <div class="task-grid world-task-grid">
        ${tasks.map((a) => html`<a class="card task-card" href="${activityHref(world.domain, a.level, a.id)}?grades=${band}">
          <span class="wt-status ${a.done ? "is-done" : ""}">${a.done ? html`${icon("check")} ${I.T("Practiced", "Practicada")}` : I.T("Ready to explore", "Lista para explorar")}</span>
          <strong>${text(a.title)}</strong>
          <span>${text(a.skill)}</span>
          <span class="fine">${minutesLabel(a.minutes || a.time || 5)} · ${humanize(a.type)}</span>
        </a>`)}
      </div>
    </section>

    ${
      fallback.length
        ? html`<section class="panel">
            <h2>${I.T("Go deeper together", "Profundiza más")}</h2>
            <p>${I.T("These connected missions carry evidence between activities and change what you explore next.", "Estas misiones conectadas llevan evidencia entre actividades y cambian lo que exploras después.")}</p>
            <div class="task-grid">${fallback.slice(0, 4).map((m) => connectedCard(m, band, studio.missions[m.id]))}</div>
          </section>`
        : ""
    }
    <p class="disclaimer">${I.T("Learning activities provide scaffolds and feedback. Independent responses are tracked separately. Practice evidence is not an official proficiency score.", "Las actividades de aprendizaje ofrecen apoyos y comentarios. Las respuestas independientes se registran por separado. La evidencia de práctica no es un puntaje oficial de dominio.")}</p>
    </div>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  if (!WORLDS.length) WORLDS = (await loadWorlds()).worlds || [];
  const band = ctx.band;
  const worldId = ctx.route.worldId || ctx.route.id || "";
  const missionId = ctx.route.missionId || "";
  const world = WORLDS.find((w) => w.id === worldId);
  const index = await loadStudioIndex();
  const progress = loadMissionProgress();

  if (!world) return { title: I.S("Language Worlds", "Mundos lingüísticos"), html: hubHTML(ctx, index, progress) };

  if (missionId) {
    const mission = missionsOf(world.id, band).find((m) => m.baseId === missionId || m.id === missionId);
    if (mission) {
      const key = `${band}:${world.id}:${mission.baseId}`;
      if (missionSession.key !== key) resetSession(key);
      return { title: `${mission.title} · ${world.name}`, html: missionHTML(ctx, world, mission, progress) };
    }
  }

  return { title: `${world.name} · ${I.S("Language Worlds", "Mundos lingüísticos")}`, html: await worldHTML(ctx, world, index, loadStudio(), progress) };
}

export async function onClick(e, ctx) {
  const button = e.target.closest("button");
  if (!button) return false;
  if (button.hasAttribute("data-say") || button.hasAttribute("data-stop-audio")) return false;

  if (button.hasAttribute("data-world-toggle-transcript")) {
    missionSession.showTranscript = !missionSession.showTranscript;
    ctx.rerender();
    return true;
  }

  if (button.hasAttribute("data-world-check")) {
    missionSession.checked = true;
    ctx.rerender();
    return true;
  }

  if (button.hasAttribute("data-world-retry")) {
    missionSession.checked = false;
    missionSession.selectedChoice = null;
    ctx.rerender();
    return true;
  }

  if (button.hasAttribute("data-world-insert-frame")) {
    const frame = button.dataset.worldInsertFrame;
    const textarea = document.querySelector("[data-world-draft]");
    if (textarea) {
      textarea.value = frame;
      missionSession.draftText = frame;
    }
    return true;
  }

  if (button.hasAttribute("data-world-check-writing")) {
    const textarea = document.querySelector("[data-world-draft]");
    if (textarea) missionSession.draftText = textarea.value;
    missionSession.emptyDraft = !missionSession.draftText.trim();
    missionSession.checked = !missionSession.emptyDraft;
    ctx.rerender();
    return true;
  }

  if (button.hasAttribute("data-world-complete")) {
    const key = button.dataset.worldComplete;
    const progress = loadMissionProgress();
    progress[`${ctx.band}:${key}`] = { completed: true, timestamp: Date.now() };
    saveMissionProgress(progress);
    missionSession.transferDone = true;
    ctx.rerender();
    return true;
  }

  return false;
}

export async function onChange(e, ctx) {
  if (e.target.matches("[data-world-choice]")) {
    missionSession.selectedChoice = Number(e.target.value);
    missionSession.checked = false;
    ctx.rerender();
    return true;
  }
  if (e.target.matches("[data-world-draft]")) {
    missionSession.draftText = e.target.value;
    return true;
  }
  return false;
}
