// Language Quest (/quest): the immersive layer of The Language Page. Three doors (Quick Practice, Explore a World,
// Create Something), nine worlds, and a mission player that runs structured mission files through one engine.
//
//   /quest                         the three doors, where you left off, and what to try next (with reasons)
//   /quest/quick                   a focused five-minute practice, using the lab's existing rooms
//   /quest/world[/<world>]         the nine worlds; one world's scene, character and missions
//   /quest/mission/<id>            a mission: Discover, Investigate, Communicate, Revise, Apply
//   /quest/create[/<id>]           Creative Language Studio (see quest-more.js)
//   /quest/speaking[/<id>]         Speaking Studio 2.0: picture description in five steps (quest-speaking.js)
//   /quest/portfolio               Living Language Portfolio
//   /quest/teacher[/<id>|evidence] Teacher Mission Hub
//   /quest/family/<id>             optional family summary
//
// Saved on this device only (accessPracticeLab:v1:quest). Nothing is uploaded and nothing is public.
import { crumbsHTML, setComponentsI18n } from "../components.js";
import { i18nFor } from "../i18n.js";
import { BASE, html, icon, raw } from "../util.js";
import { portraitSVG, sceneSVG, thumbSVG } from "../quest/art.js";
import { characterOf, loadCatalog, loadMission, missionMeta, worldOf } from "../quest/content.js";
import { RUNGS, RUNG_COPY, itemDone, missionProgress, pickEnding, rungIndex } from "../quest/engine.js";
import * as A from "../quest/kinds-a.js";
import * as B from "../quest/kinds-b.js";
import { moreSupport, recommend, suggestRung } from "../quest/pathway.js";
import { archiveRun, finishRun, historyFor, loadQuest, runFor, saveQuest } from "../quest/state.js";
import { bi, bs, coachHTML, resetUi, say, syncUi, ui } from "../quest/ui.js";
import * as More from "./quest-more.js";
import * as Speaking from "./quest-speaking.js";

const KINDS = { ...A, ...B };
const KIND_HANDLERS = Object.fromEntries(["explore", "read", "sort", "compare", "ask", "choose", "check"].map((k) => [k, A[k]]).concat(["write", "speak", "story", "forge", "simulate", "route", "timeline"].map((k) => [k, B[k]])));
void KINDS;
export const questHref = (path = "", band = "") => `${BASE}/quest${path ? `/${path}` : ""}${band ? `?grades=${band}` : ""}`;
const bandOf = (ctx) => (ctx.band === "3-5" ? "3-5" : "6-8");
const qparam = (k) => new URLSearchParams(location.search).get(k) || "";

let cur = null; // the mission on screen: { mission, qs, run, character, I, ctx, demo }
const demoStates = new Map();

function envFor() {
  const { mission, qs, run, character, I, ctx, demo } = cur;
  let timer = 0;
  return {
    ctx, I, mission, run, qs, character, demo,
    item: (id) => (run.items[id] ||= {}),
    save: () => (demo ? null : saveQuest(qs)),
    saveSoon: () => {
      if (demo) return;
      clearTimeout(timer);
      timer = setTimeout(() => saveQuest(qs), 450);
    },
    rerender: () => ctx.rerender(),
  };
}

// ── hub ────────────────────────────────────────────────────────────────────────────────────────────────────────
const crumbs = (I, band, here, mid = null) =>
  crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`], [I.S("Language Quest", "Misión del lenguaje"), here || mid ? questHref("", band) : null], ...(mid ? [[mid, null]] : here ? [[here, null]] : [])], { i18n: I });

const statusOf = (qs, id) => {
  const p = qs.prog[id];
  if (!p?.runs?.length) return qs.runs[id] ? "going" : "new";
  return p.runs.some((r) => r.rung === "independent" && !r.help) ? "independent" : "supported";
};
const STATUS = { new: ["Not started", "Sin empezar"], going: ["In progress", "En curso"], supported: ["Finished with support", "Terminada con apoyo"], independent: ["Finished on my own", "Terminada por mi cuenta"] };
const chip = (I, s) => html`<span class="q-chip is-${s}">${s === "independent" ? icon("check") : ""}${I.T(STATUS[s][0], STATUS[s][1])}</span>`;

function missionCard(I, qs, cat, m, band) {
  const w = worldOf(cat, m.world);
  return html`<a class="card q-mcard" href="${questHref(`mission/${m.id}`, band)}">
    <div class="q-mthumb" aria-hidden="true">${raw(thumbSVG(m.theme))}</div>
    <strong class="task-title">${bi(I, m.title)}</strong>
    <span class="fine">${bi(I, w.name)} · ${I.T(`Grades ${m.band.replace("-", "–")}`, `Grados ${m.band.replace("-", "–")}`)} · ${m.minutes} min</span>
    <span class="task-desc">${bi(I, m.objective)}</span>
    ${chip(I, statusOf(qs, m.id))}
  </a>`;
}

function hubHTML(ctx, I, cat, qs) {
  const band = bandOf(ctx);
  const inProgress = Object.entries(qs.runs).filter(([k, r]) => !k.includes("#") && !r.completed).map(([k]) => missionMeta(cat, k)).filter(Boolean);
  const recs = recommend({ missions: cat.missions, band, prog: qs.prog, interests: qs.interests, teacher: qs.teacher });
  return html`${crumbs(I, band, null)}
    <header class="sk-hero q-hero"><div class="sk-hero-copy">
      <p class="eyebrow">${icon("worlds")} ${I.T(`Grades ${band.replace("-", "–")} · speak, write, listen, read`, `Grados ${band.replace("-", "–")} · hablar, escribir, escuchar, leer`)}</p>
      <h1 tabindex="-1">${I.T("Language Quest", "Misión del lenguaje")}</h1>
      <p class="lead">${I.T("Your words change what happens. Investigate, explain, tell stories and make arguments in nine worlds. No clock. Every mission asks you to produce real language, and to revise it.", "Tus palabras cambian lo que pasa. Investiga, explica, cuenta historias y argumenta en nueve mundos. Sin reloj. Cada misión te pide producir lenguaje de verdad y revisarlo.")}</p></div>
      <div class="sk-hero-art" aria-hidden="true">${raw(thumbSVG("lab") + thumbSVG("forge") + thumbSVG("map"))}</div></header>
    <section class="q-doors" aria-label="${I.S("Three ways to start", "Tres formas de empezar")}">
      <a class="card q-door" href="${questHref("quick", band)}" data-focus-first>${icon("clock")}<strong>${I.T("Quick Practice", "Práctica rápida")}</strong><span>${I.T("A focused 5 minutes. Pick a skill and go.", "5 minutos enfocados. Elige una destreza y empieza.")}</span></a>
      <a class="card q-door" href="${questHref("world", band)}">${icon("worlds")}<strong>${I.T("Explore a World", "Explora un mundo")}</strong><span>${I.T("An adventure with characters, clues and a mission.", "Una aventura con personajes, pistas y una misión.")}</span></a>
      <a class="card q-door" href="${questHref("create", band)}">${icon("writing")}<strong>${I.T("Create Something", "Crea algo")}</strong><span>${I.T("Make a story, comic, news report or talk.", "Haz un cuento, cómic, noticia o charla.")}</span></a>
    </section>
    ${inProgress.length ? html`<section class="panel" aria-labelledby="qh-go"><h2 id="qh-go">${I.T("Where you left off", "Donde lo dejaste")}</h2><div class="q-grid">${inProgress.map((m) => missionCard(I, qs, cat, m, band))}</div></section>` : ""}
    <section class="panel" aria-labelledby="qh-next"><h2 id="qh-next">${I.T("Ideas for what to try next", "Ideas para probar después")}</h2>
      <p class="fine">${I.T("These are suggestions, not a track. Every mission is open.", "Son sugerencias, no un camino fijo. Todas las misiones están abiertas.")}</p>
      <div class="q-grid">${recs.map((r) => html`<div class="q-rec">${missionCard(I, qs, cat, r.mission, band)}<ul class="q-why">${r.reasons.map((x) => html`<li>${bi(I, x)}</li>`)}</ul></div>`)}</div></section>
    <nav class="panel q-more-links" aria-label="${I.S("More in Language Quest", "Más en Misión del lenguaje")}">
      <a class="btn btn-primary" href="${BASE}/book-studio?grades=${band}">${icon("writing")} ${I.T("Open Book Studio", "Abrir Book Studio")}</a>
      <a class="btn" href="${BASE}/pathways?grades=${band}">${icon("road")} ${I.T("Connected Pathways", "Rutas conectadas")}</a>
      <a class="btn" href="${questHref("speaking", band)}">${icon("speaking")} ${I.T("Speaking Studio", "Estudio de expresión oral")}</a>
      <a class="btn" href="${questHref("portfolio", band)}">${icon("bookmark")} ${I.T("My portfolio", "Mi portafolio")}</a>
      <a class="btn" href="${questHref("teacher", band)}">${icon("teacher")} ${I.T("Teacher Mission Hub", "Centro de misiones para docentes")}</a>
      <a class="btn" href="${BASE}/city?grades=${band}">${icon("worlds")} ${I.T("Language City", "Ciudad del lenguaje")}</a>
      <a class="btn" href="/language-adventures/">${icon("external")} ${I.T("Language Adventures (original 9 worlds)", "Aventuras del lenguaje (los 9 mundos originales)")}</a>
    </nav>`;
}

function quickHTML(ctx, I, cat, qs) {
  const band = bandOf(ctx);
  const short = cat.missions.filter((m) => m.band === band).sort((a, b) => a.minutes - b.minutes)[0];
  const go = (d, label, es, ico) => html`<a class="card q-door" href="${BASE}/${d}?grades=${band}">${icon(ico)}<strong>${I.T(label, es)}</strong></a>`;
  return html`${crumbs(I, band, I.S("Quick Practice", "Práctica rápida"))}
    <header class="panel"><h1 tabindex="-1">${I.T("Quick Practice", "Práctica rápida")}</h1><p class="lead">${I.T("Five focused minutes. Choose one skill. These open the lab's practice rooms.", "Cinco minutos enfocados. Elige una destreza. Estos enlaces abren las salas de práctica del laboratorio.")}</p></header>
    <section class="q-doors" aria-label="${I.S("Choose a skill", "Elige una destreza")}">
      ${go("Listening", "Listening", "Comprensión auditiva", "listening")}${go("Reading", "Reading", "Lectura", "reading")}${go("Speaking", "Speaking", "Expresión oral", "speaking")}${go("Writing", "Writing", "Escritura", "writing")}${go("warmup", "Daily warm-up", "Calentamiento diario", "calendar")}${go("wordlab", "Word Lab", "Laboratorio de palabras", "words")}
    </section>
    ${short ? html`<section class="panel"><h2>${I.T("Or play the shortest mission", "O juega la misión más corta")}</h2><div class="q-grid">${missionCard(I, qs, cat, short, band)}</div></section>` : ""}`;
}

function worldsHTML(ctx, I, cat, qs) {
  const band = bandOf(ctx);
  return html`${crumbs(I, band, I.S("Worlds", "Mundos"))}
    <header class="panel"><h1 tabindex="-1">${I.T("Explore a World", "Explora un mundo")}</h1><p class="lead">${I.T("Nine worlds, each with its own character and missions.", "Nueve mundos, cada uno con su personaje y sus misiones.")}</p></header>
    <div class="q-grid">${cat.worlds.map((w) => {
      const ms = cat.missions.filter((m) => m.world === w.id);
      const done = ms.filter((m) => ["supported", "independent"].includes(statusOf(qs, m.id))).length;
      return html`<a class="card q-mcard" href="${questHref(`world/${w.id}`, band)}"><div class="q-mthumb" aria-hidden="true">${raw(thumbSVG(w.theme))}</div><strong class="task-title">${bi(I, w.name)}</strong><span class="task-desc">${bi(I, w.tagline)}</span><span class="fine">${I.T(`${ms.length} mission${ms.length === 1 ? "" : "s"} · ${done} finished`, `${ms.length} misión${ms.length === 1 ? "" : "es"} · ${done} terminada${done === 1 ? "" : "s"}`)}</span></a>`;
    })}</div>`;
}

function worldHTML(ctx, I, cat, qs, world) {
  const band = bandOf(ctx);
  const ch = characterOf(cat, world.character);
  const ms = cat.missions.filter((m) => m.world === world.id);
  const mine = ms.filter((m) => m.band === band);
  const other = ms.filter((m) => m.band !== band);
  return html`${crumbs(I, band, bs(I, world.name), I.S("Worlds", "Mundos"))}
    <header class="q-world-hero"><div class="q-world-art" role="img" aria-label="${bs(I, world.name)}">${raw(sceneSVG(world.theme, { alt: bs(I, world.name) }))}</div>
      <div class="q-world-copy"><h1 tabindex="-1">${bi(I, world.name)}</h1><p class="lead">${bi(I, world.tagline)}</p>
        <div class="q-coach-inline">${raw(portraitSVG(ch, "happy", { w: 72 }))}<p><strong>${ch.name}</strong> <span class="fine">${bi(I, ch.role)}</span><br />${bi(I, ch.lines.intro)}</p></div></div></header>
    <section class="panel"><h2>${I.T(`Missions for grades ${band.replace("-", "–")}`, `Misiones para los grados ${band.replace("-", "–")}`)}</h2>
      ${mine.length ? html`<div class="q-grid">${mine.map((m) => missionCard(I, qs, cat, m, band))}</div>` : html`<p>${I.T("No mission here for this grade band yet. The other band's missions are below.", "Todavía no hay misión para este nivel. Abajo están las del otro nivel.")}</p>`}
      ${other.length ? html`<h3>${I.T(`Missions for grades ${other[0].band.replace("-", "–")}`, `Misiones para los grados ${other[0].band.replace("-", "–")}`)}</h3><div class="q-grid">${other.map((m) => missionCard(I, qs, cat, m, other[0].band))}</div>` : ""}</section>
    <p class="panel"><a class="btn" href="${world.link}">${icon("external")} ${I.T("Open the original adventure for this world", "Abrir la aventura original de este mundo")}</a></p>`;
}

// ── mission player ───────────────────────────────────────────────────────────────────────────────────────────────
function introHTML(ctx, I, mission, cat, qs, character) {
  const band = mission.band;
  const fn = mission.functions[0];
  const sug = suggestRung(historyFor(qs, cat.missions, fn), qs.teacher);
  const asked = qparam("rung");
  const start = RUNGS.includes(asked) ? asked : sug.rung;
  ui.pick.startRung = ui.pick.startRung || start;
  const w = worldOf(cat, mission.world);
  return html`${crumbs(I, band, bs(I, mission.title), bs(I, w.name))}
    <header class="q-mission-hero"><div class="q-world-art">${raw(sceneSVG(mission.scene.theme, { alt: mission.scene.alt }))}</div>
      <div class="q-world-copy"><p class="eyebrow">${bi(I, w.name)} · ${I.T(`Grades ${band.replace("-", "–")}`, `Grados ${band.replace("-", "–")}`)} · ${mission.minutes} min</p><h1 tabindex="-1">${bi(I, mission.title)}</h1>
      <p class="lead">${mission.narrative}</p><button type="button" class="btn small" data-say="${mission.narrative}">${icon("volume")} ${I.T("Hear the story", "Escuchar la historia")}</button></div></header>
    <section class="panel"><h2>${I.T("Your language goal", "Tu meta de lenguaje")}</h2><p>${bi(I, mission.objective)}</p>
      <h3>${I.T("I can…", "Puedo…")}</h3><ul class="q-success">${mission.success.map((s) => html`<li>${bi(I, s)}</li>`)}</ul>
      <p class="fine">${I.T("Skills:", "Destrezas:")} ${mission.domains.map((d) => I.S(d, { Listening: "Comprensión auditiva", Reading: "Lectura", Speaking: "Expresión oral", Writing: "Escritura" }[d])).join(", ")}. ${I.T("Language functions:", "Funciones del lenguaje:")} ${mission.functions.join(", ")}.</p></section>
    <section class="panel"><h2>${I.T("How much support do you want to start with?", "¿Con cuánto apoyo quieres empezar?")}</h2>
      <p class="fine">${bi(I, sug.why)} ${I.T("This is only a starting point. You can change it any time.", "Es solo un punto de partida. Puedes cambiarlo cuando quieras.")}</p>
      <div class="q-rungs" role="radiogroup" aria-label="${I.S("Starting support", "Apoyo inicial")}">${RUNGS.map((r, i) => html`<button type="button" class="q-rung ${ui.pick.startRung === r ? "is-on" : ""}" role="radio" aria-checked="${String(ui.pick.startRung === r)}" data-q-act="pick-start" data-rung="${r}"><span class="q-rung-n" aria-hidden="true">${i + 1}</span>${bi(I, RUNG_COPY[r])}</button>`)}</div>
      <p><button type="button" class="btn btn-primary" data-q-act="start" data-focus-first>${I.T("Start the mission", "Empezar la misión")}</button></p>
      ${qs.runs[mission.id]?.completed ? html`<p class="fine">${I.T("You have finished this mission before. Starting again keeps your earlier work in your portfolio.", "Ya terminaste esta misión. Si empiezas otra vez, tu trabajo anterior queda en tu portafolio.")}</p>` : ""}</section>
    <aside class="panel">${coachHTML({ I, character })}</aside>`;
}

function stageAccessible(mission, run, i, demo) {
  if (demo || i === 0) return true;
  const prog = missionProgress(mission, run);
  return prog.stages[i - 1].complete;
}

function playerHTML(ctx, I, mission, cat, qs, run, character, demo) {
  const band = mission.band;
  const env = envFor();
  const prog = missionProgress(mission, run);
  const w = worldOf(cat, mission.world);
  let si = Math.min(run.stage || 0, mission.stages.length - 1);
  if (!stageAccessible(mission, run, si, demo)) si = 0;
  const stage = mission.stages[si];
  const STAGE_NAME = { discover: ["Discover", "Descubre"], investigate: ["Investigate", "Investiga"], communicate: ["Communicate", "Comunica"], revise: ["Revise", "Revisa"], apply: ["Apply", "Aplica"] };
  const ending = run.completed ? mission.endings.find((e) => e.id === run.ending) || pickEnding(mission, run) : null;
  return html`${crumbs(I, band, bs(I, mission.title), bs(I, w.name))}
    ${demo ? html`<p class="q-demo" role="note">${icon("info")} ${I.T("Demo mode: nothing you do here is saved. Stages are open.", "Modo demostración: nada de lo que hagas aquí se guarda. Las etapas están abiertas.")}</p>` : ""}
    <header class="q-player-head"><h1 tabindex="-1">${bi(I, mission.title)}</h1>
      <nav class="q-stages" aria-label="${I.S("Mission stages", "Etapas de la misión")}"><ol>${mission.stages.map((s, i) => {
        const ok = stageAccessible(mission, run, i, demo);
        return html`<li><button type="button" class="q-stage ${i === si ? "is-on" : ""} ${prog.stages[i].complete ? "is-done" : ""}" data-q-act="stage" data-stage="${i}" ${ok ? "" : html`disabled`} ${i === si ? html`aria-current="step"` : ""}><span class="q-stage-n" aria-hidden="true">${prog.stages[i].complete ? icon("check") : i + 1}</span><span>${I.T(STAGE_NAME[s.id][0], STAGE_NAME[s.id][1])}</span><span class="visually-hidden">${prog.stages[i].done} / ${prog.stages[i].total}</span></button></li>`;
      })}</ol></nav>
      <p class="fine" role="status">${I.T(`${prog.done} of ${prog.total} tasks done.`, `${prog.done} de ${prog.total} tareas hechas.`)}</p></header>
    <div class="q-layout">
      <div class="q-main">
        ${si === 0 ? html`<div class="q-world-art q-small">${raw(sceneSVG(mission.scene.theme, { alt: mission.scene.alt }))}</div><p class="q-narr">${mission.narrative} <button type="button" class="ghost small" data-say="${mission.narrative}">${icon("volume")} ${I.T("Hear it", "Escuchar")}</button></p>` : ""}
        <h2 class="q-stage-title">${bi(I, { en: STAGE_NAME[stage.id][0], es: STAGE_NAME[stage.id][1] })}: ${stage.title}</h2>
        ${stage.items.map((it) => KIND_HANDLERS[it.kind].render(env, it))}
        ${missionNav(I, mission, prog, si, run, ending, qs, cat, band)}
      </div>
      <div class="q-side">${coachHTML({ I, character })}
        <details class="q-vocab card" open><summary><strong>${I.T("Words for this mission", "Palabras de esta misión")}</strong></summary><dl>${mission.vocab.map((v) => html`<dt>${v.term} <button type="button" class="ghost small" data-say="${v.term}. ${v.def}" aria-label="${I.S("Hear ", "Escuchar ")}${v.term}">${icon("volume")}</button></dt><dd>${v.def}</dd>`)}</dl></details>
        <section class="card q-support-now"><h3>${I.T("My support", "Mi apoyo")}</h3><p>${bi(I, RUNG_COPY[run.rung])}${run.helpUsed ? html` <span class="fine">(${I.T("extra support used", "se usó apoyo adicional")})</span>` : ""}</p></section>
      </div>
    </div>`;
}

function missionNav(I, mission, prog, si, run, ending, qs, cat, band) {
  const last = si === mission.stages.length - 1;
  return html`<div class="q-nav">
      ${si > 0 ? html`<button type="button" class="btn" data-q-act="stage" data-stage="${si - 1}">${icon("arrow-left")} ${I.T("Back", "Atrás")}</button>` : ""}
      ${!last ? html`<button type="button" class="btn btn-primary" data-q-act="stage" data-stage="${si + 1}" ${prog.stages[si].complete || cur.demo ? "" : html`disabled aria-describedby="qn-why"`}>${I.T("Next stage", "Siguiente etapa")} ${icon("arrow-right")}</button>${prog.stages[si].complete ? "" : html`<span class="fine" id="qn-why">${I.T("Finish this stage's tasks to go on.", "Termina las tareas de esta etapa para seguir.")}</span>`}` : ""}
    </div>
    ${prog.complete && !run.completed ? html`<section class="panel q-finish"><h2>${I.T("You finished every stage", "Terminaste todas las etapas")}</h2><button type="button" class="btn btn-primary" data-q-act="finish-mission">${I.T("Finish the mission", "Terminar la misión")}</button></section>` : ""}
    ${ending
      ? html`<section class="panel q-ending" role="region" aria-label="${I.S("Ending", "Final")}"><h2>${ending.title}</h2><p>${ending.text}</p>
          <p class="fine">${I.T("Support: ", "Apoyo: ")}${bi(I, RUNG_COPY[run.rung])}${run.helpUsed ? I.T(" · extra support used", " · se usó apoyo adicional") : ""}</p>
          <div class="q-actions"><a class="btn btn-primary" href="${BASE}/book-studio?grades=${band}">${icon("writing")} ${I.T("Create an alternate ending in Book Studio", "Crear un final alternativo en Book Studio")}</a><a class="btn" href="${questHref("portfolio", band)}">${icon("bookmark")} ${I.T("See my portfolio", "Ver mi portafolio")}</a><a class="btn" href="${questHref(`family/${mission.id}`, band)}">${icon("families")} ${I.T("Family summary", "Resumen para la familia")}</a><button type="button" class="btn" data-q-act="replay">${icon("retry")} ${I.T("Play again", "Jugar otra vez")}</button><a class="btn" href="${questHref("", band)}">${I.T("More missions", "Más misiones")}</a></div></section>`
      : ""}`;
}

async function missionPage(ctx, I, cat, id) {
  const meta = missionMeta(cat, id);
  if (!meta) return { title: I.S("Language Quest", "Misión del lenguaje"), html: notFound(I, ctx) };
  const mission = await loadMission(id);
  const demo = qparam("demo") === "1";
  syncUi(`${id}${demo ? "#demo" : ""}`);
  let qs;
  if (demo) qs = demoStates.get(id) || demoStates.set(id, { v: 1, runs: {}, prog: {}, teacher: {}, interests: [], picks: [], reflections: {}, creations: [] }).get(id);
  else qs = loadQuest();
  const character = characterOf(cat, mission.characters[0]);
  const title = `${bs(I, mission.title)} · ${I.S("Language Quest", "Misión del lenguaje")}`;
  if (demo && !qs.runs[id]) runFor(qs, id, RUNGS.includes(qparam("rung")) ? qparam("rung") : "frame").startRung = "frame";
  const run = qs.runs[id];
  cur = { mission, qs, run, character, I, ctx, demo, cat };
  if (!run) return { title, html: introHTML(ctx, I, mission, cat, qs, character) };
  run.startRung ||= run.rung;
  return { title, html: playerHTML(ctx, I, mission, cat, qs, run, character, demo) };
}

const notFound = (I, ctx) => html`<section class="panel"><h1 tabindex="-1">${I.T("We could not find that mission.", "No encontramos esa misión.")}</h1><p><a class="btn" href="${questHref("", bandOf(ctx))}">${I.T("Back to Language Quest", "Volver a Misión del lenguaje")}</a></p></section>`;

// ── route ────────────────────────────────────────────────────────────────────────────────────────────────────────
export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  const cat = await loadCatalog();
  const { id = "", sub = "" } = ctx.route;
  const qs = loadQuest();
  const wrap = (title, body) => ({ title: `${title} · ${I.S("Language Quest", "Misión del lenguaje")}`, html: html`<div class="q-page">${body}</div>` });
  if (!id) return { title: I.S("Language Quest", "Misión del lenguaje"), html: html`<div class="q-page">${hubHTML(ctx, I, cat, qs)}</div>` };
  if (id === "quick") return wrap(I.S("Quick Practice", "Práctica rápida"), quickHTML(ctx, I, cat, qs));
  if (id === "world") {
    const w = worldOf(cat, sub);
    return w ? wrap(bs(I, w.name), worldHTML(ctx, I, cat, qs, w)) : wrap(I.S("Worlds", "Mundos"), worldsHTML(ctx, I, cat, qs));
  }
  if (id === "mission") {
    const out = await missionPage(ctx, I, cat, sub);
    return { title: out.title, html: html`<div class="q-page">${out.html}</div>` };
  }
  if (id === "speaking") {
    const out = await Speaking.render(ctx, I, cat, qs, sub, { crumbs });
    return { title: `${out.title} · ${I.S("Language Quest", "Misión del lenguaje")}`, html: html`<div class="q-page">${out.html}</div>` };
  }
  const more = await More.render(ctx, I, cat, qs, id, sub, { questHref, crumbs, chip, statusOf, missionCard });
  if (more) return { title: `${more.title} · ${I.S("Language Quest", "Misión del lenguaje")}`, html: html`<div class="q-page">${more.html}</div>` };
  return wrap(I.S("Language Quest", "Misión del lenguaje"), hubHTML(ctx, I, cat, qs));
}

// ── events ───────────────────────────────────────────────────────────────────────────────────────────────────────
function global(el, ctx) {
  const act = el.dataset.qAct;
  if (!cur) return false;
  const { mission, qs, run, demo } = cur;
  const save = () => (demo ? null : saveQuest(qs));
  if (act === "pick-start") return ((ui.pick.startRung = el.dataset.rung), ctx.rerender(), true);
  if (act === "start") {
    const r = runFor(qs, mission.id, ui.pick.startRung || "frame");
    r.rung = r.startRung = ui.pick.startRung || "frame";
    save();
    return (ctx.rerender(), true);
  }
  if (!run) return false;
  if (act === "stage") {
    const i = Number(el.dataset.stage);
    if (stageAccessible(mission, run, i, demo)) {
      run.stage = i;
      save();
      ctx.rerender();
      window.scrollTo({ top: 0 });
    }
    return true;
  }
  if (act === "rung") {
    run.rung = el.dataset.rung;
    if (rungIndex(run.rung) < rungIndex(run.startRung || run.rung)) run.helpUsed = true;
    save();
    return (ctx.rerender(), true);
  }
  if (act === "more-help") {
    run.rung = moreSupport(run.rung);
    run.helpUsed = true;
    save();
    return (ctx.rerender(), true);
  }
  if (act === "hint") {
    run.hints = (run.hints || 0) + 1;
    const item = el.closest("[data-q-item]");
    const it = mission.stages.flatMap((s) => s.items).find((x) => x.id === item?.dataset.qItem);
    say(envFor(), "hint", it?.ladder?.cue || null);
    save();
    return (ctx.rerender(), true);
  }
  if (act === "finish-mission") {
    finishRun(qs, mission, run);
    run.ending = pickEnding(mission, run).id;
    save();
    return (ctx.rerender(), true);
  }
  if (act === "replay") {
    archiveRun(qs, mission.id);
    save();
    ui.pick.startRung = "";
    return (ctx.rerender(), window.scrollTo({ top: 0 }), true);
  }
  return false;
}

export function onClick(e, ctx) {
  if (ctx.route.id === "speaking") return Speaking.onClick(e, ctx);
  const el = e.target.closest("[data-q-act]");
  if (el && (ctx.route.id === "mission" || el.dataset.qAct === "pick-start")) {
    if (global(el, ctx)) return true;
    const itemEl = el.closest("[data-q-item]");
    if (itemEl && cur) {
      const item = cur.mission.stages.flatMap((s) => s.items).find((x) => x.id === itemEl.dataset.qItem);
      if (item && KIND_HANDLERS[item.kind].click?.(el, envFor(), item)) return true;
    }
    return false;
  }
  return More.onClick(e, ctx, { questHref }) || false;
}
export function onChange(e, ctx) {
  if (ctx.route.id === "speaking") return Speaking.onChange(e, ctx);
  const el = e.target.closest("[data-q-act]");
  if (el && ctx.route.id === "mission" && cur) {
    const itemEl = el.closest("[data-q-item]");
    const item = itemEl && cur.mission.stages.flatMap((s) => s.items).find((x) => x.id === itemEl.dataset.qItem);
    if (item) return KIND_HANDLERS[item.kind].change?.(el, envFor(), item) || false;
  }
  return More.onChange?.(e, ctx) || false;
}
export const onInput = (e, ctx) => onChange(e, ctx);
/** The lab's recorder calls this when a take ends; the take is noted as made (the audio stays in this tab only). */
export function onRecorded(key) {
  if (key.startsWith("quest:speaking-")) return Speaking.onRecorded(key);
  const m = /^quest:([^:]+):(.+)$/.exec(key);
  if (!m || !cur || cur.mission.id !== m[1]) return;
  (cur.run.items[m[2]] ||= {}).took = true;
  if (!cur.demo) saveQuest(cur.qs);
}
export function unmount() {
  resetUi();
  Speaking.unmount?.();
  More.unmount?.();
}
export const mount = () => {
  ui.anim = "";
};
export const canListen = () => true;
export { itemDone };
