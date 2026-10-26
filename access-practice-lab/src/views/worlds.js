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
import { activityHref } from "./room.js";

const PROGRESS_KEY = "accessPracticeLab:v1:world-missions";
let WORLDS = [];

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
const HOW_IT_WORKS = [
  ["Take in the source", "Listen to a dispatch, read a report, or hear a message."],
  ["Decide with evidence", "Choose the response the source supports, or draft your own."],
  ["Explain it", "Use a language frame to say why, in your own words."],
  ["Try it alone", "Carry the skill to a new situation without supports."],
];

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
      <span class="lx-pill">${glyph(world.domain)} ${world.domain}</span>
      <strong class="world-name">${world.name}</strong>
      <span class="world-focus">${world.focus}</span>
      <span class="world-progress">
        <span class="bar" aria-hidden="true"><i style="width:${total ? Math.round((done / total) * 100) : 0}%"></i></span>
        <small>${done} of ${total} missions completed</small>
      </span>
    </span>
    <span class="world-open">Enter world ${icon("arrow-right")}</span>
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
    <span class="lx-pill">${icon("mission")} ${state?.done ? "Mission complete" : state?.started ? "Continue mission" : m.contentArea}</span>
    <strong>${m.title}</strong>
    <span class="fine">${state?.done || state?.started ? `${m.contentArea} · ` : ""}${m.minutes} min</span>
    <span class="tc-summary">${m.summary}</span>
  </a>`;

function hubHTML(ctx, index, progress) {
  const band = ctx.band;
  const total = WORLDS.reduce((n, w) => n + missionsOf(w.id, band).length, 0);
  const done = WORLDS.reduce((n, w) => n + doneCount(progress, band, w.id), 0);
  const bridge = index.missions.filter((m) => m.band === band || m.band === "Both");
  return html`${crumbsHTML([["Lab", `${BASE}/?grades=${band}`], ["Language Worlds", null]])}
    <section class="wd-hero">
      <div class="wd-hero-copy">
        <p class="eyebrow">${icon("worlds")} Explore · Grades ${band.replace("-", "–")}</p>
        <h1 tabindex="-1">Four worlds. Consequential missions.</h1>
        <p class="lead">Step into consequential language environments. Each world tests your communication in context with original missions and independent transfer.</p>
        <p class="wd-hero-count"><strong>${done} of ${total}</strong> missions completed on this device</p>
        <p class="wd-note">${icon("lock")} Private to this browser. These original learning simulations develop academic language; they do not calculate or predict official WIDA scores.</p>
      </div>
      <aside class="wd-how" aria-labelledby="wd-how-title">
        <h2 id="wd-how-title">How a mission works</h2>
        <ol>${HOW_IT_WORKS.map(([title, body]) => html`<li><strong>${title}</strong><span>${body}</span></li>`)}</ol>
      </aside>
    </section>
    <nav class="world-grid" aria-label="Choose a learning world">${WORLDS.map((w) => tile(w, band, progress))}</nav>
    <section class="panel world-bridge">
      <h2>Connected language missions</h2>
      <p>Listen, read, collect evidence, discuss, and write through a complete investigation.</p>
      <div class="task-grid world-bridge-grid">${bridge.map((m) => connectedCard(m, band, null))}</div>
    </section>`;
}

function stimulusHTML(world, mission, def) {
  if (world.id === "signal-station")
    return html`<div class="ms-dispatch">
      <div class="ms-dispatch-bar">
        <button type="button" class="btn btn-primary btn-domain" data-say="${mission.stimulus}" aria-label="Play original listening dispatch">${icon("play")} Play dispatch audio</button>
        <button type="button" class="btn" data-stop-audio>${icon("stop")} Stop</button>
        <button type="button" class="btn" data-world-toggle-transcript aria-expanded="${missionSession.showTranscript}">
          ${missionSession.showTranscript ? "Hide text" : "Show text preview"}
        </button>
      </div>
      <p class="fine">Listen first, then decide. A built-in computer voice reads this original script; replay as often as you like.</p>
      ${missionSession.showTranscript ? html`<blockquote class="ms-quote">${mission.stimulus}</blockquote>` : ""}
    </div>`;
  const label = def.mechanic === "dialogue" ? "Message" : def.mechanic === "publishing" ? "Writing brief" : "Source file";
  return html`<figure class="ms-source">
    <figcaption>${glyph(world.domain)} ${label}</figcaption>
    <blockquote class="ms-quote">${mission.stimulus}</blockquote>
  </figure>`;
}

function choicesHTML(mission, def, isCorrect) {
  const order = displayOrder(mission);
  return html`<div class="choices ms-choices" role="radiogroup" aria-label="Possible decisions">
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
            <p class="fb-title">${icon(isCorrect ? "check" : "bulb")} ${isCorrect ? "Coherent and supported by the source." : "Consider the evidence again."}</p>
            <p>${isCorrect ? mission.feedback : "Check the exact relationships in the source message before deciding."}</p>
            ${isCorrect && mission.frame ? frameHTML("Language frame for explaining your decision", mission.frame) : ""}
            ${isCorrect ? "" : html`<button type="button" class="btn btn-primary" data-world-retry>${icon("retry")} Try again</button>`}
          </div>`
        : html`<div class="ms-actions"><button type="button" class="btn btn-primary btn-domain btn-big" data-world-check ${missionSession.selectedChoice === null ? "disabled" : ""}>Confirm ${def.mechanic} decision</button></div>`
    }`;
}

const frameHTML = (label, frame) =>
  html`<div class="ms-frame"><strong>${icon("writing")} ${label}</strong><p>${frame}</p></div>`;

function draftHTML(mission) {
  return html`<div class="ms-draft">
    <div class="ms-criteria"><strong>${icon("check")} Success criteria</strong><p>${mission.successCriteria}</p></div>
    <div class="ms-actions"><button type="button" class="btn" data-world-insert-frame="${text(mission.frame)}">Insert sentence frame</button></div>
    <label for="missionDraft" class="visually-hidden">Draft your response</label>
    <textarea id="missionDraft" rows="6" placeholder="Draft your recommendation or explanation here..." data-world-draft>${missionSession.draftText}</textarea>
    <div class="ms-actions"><button type="button" class="btn btn-primary btn-domain btn-big" data-world-check-writing ${missionSession.checked ? "disabled" : ""}>Review draft with success criteria</button></div>
    ${
      missionSession.emptyDraft && !missionSession.checked
        ? html`<p class="feedback is-hint" role="alert">${icon("bulb")} Write at least one sentence first, then review your draft.</p>`
        : ""
    }
    ${
      missionSession.checked
        ? html`<div class="feedback is-right" role="status">
            <p class="fb-title">${icon("check")} Draft review</p>
            <p>${mission.feedback || "Reread your draft against the success criteria above, revise one sentence, then compare with the target language pattern."}</p>
            ${frameHTML("Target language pattern", mission.frame)}
          </div>`
        : ""
    }
  </div>`;
}

function transferHTML(world, band, mission, list, idx, completed) {
  const next = list[idx + 1];
  return html`<section class="ms-transfer" aria-label="Independent transfer">
    <p class="eyebrow">${icon("flag")} Independent transfer challenge</p>
    <h2>Carry the skill to a new situation</h2>
    <p>${mission.independent}</p>
    ${
      missionSession.transferDone
        ? html`<p class="ms-recorded" role="status">${icon("check")} Mission recorded on this device.</p>`
        : html`<div class="ms-actions"><button type="button" class="btn btn-primary btn-domain" data-world-complete="${world.id}:${mission.baseId}">${icon("check")} ${completed ? "Mission completed (update progress)" : "Complete mission & record transfer"}</button></div>`
    }
    <div class="ms-actions">
      ${next && (completed || missionSession.transferDone) ? html`<a class="btn btn-primary" href="${BASE}/worlds/${world.id}/${next.baseId}?grades=${band}">Next mission: ${next.title} ${icon("arrow-right")}</a>` : ""}
      <a class="btn" href="${BASE}/worlds/${world.id}?grades=${band}">${icon("arrow-left")} Return to ${world.name} board</a>
    </div>
    <p class="fine">Independent responses are practiced on paper or shared with a partner. Practice results are never transmitted off this device.</p>
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
      ["Lab", `${BASE}/?grades=${band}`],
      ["Language Worlds", `${BASE}/worlds?grades=${band}`],
      [world.name, `${BASE}/worlds/${world.id}?grades=${band}`],
      [mission.title, null],
    ])}
    <article class="mission-console ${domainClass(world.domain)}">
      <header class="ms-head">
        <div class="ms-head-bar">
          <span class="lx-pill">${glyph(world.domain)} ${world.name} · ${def.mechanic}</span>
          <span class="ms-count">Mission ${idx + 1} of ${list.length}
            <span class="ms-pips" aria-hidden="true">${list.map((m, i) => html`<i class="${isDone(progress, band, world.id, m.baseId) ? "is-done" : ""} ${i === idx ? "is-here" : ""}"></i>`)}</span>
          </span>
        </div>
        <h1 tabindex="-1">${mission.title}</h1>
        <p class="ms-context">${mission.context}</p>
      </header>
      <div class="ms-grid">
        <section class="ms-panel ms-source-panel" aria-label="Mission source materials">
          <h2 class="workbook-heading"><span aria-hidden="true">1</span> Mission source</h2>
          ${stimulusHTML(world, mission, def)}
          <img class="ms-art" src="${BASE}/pictures/worlds/${world.art}" alt="" width="640" height="360" loading="lazy" />
        </section>
        <section class="ms-panel ms-work-panel" aria-label="Mission investigation">
          <h2 class="workbook-heading"><span aria-hidden="true">2</span> ${isStoryWorks ? "Draft and review" : "Decide"}</h2>
          <p class="ms-prompt">${mission.prompt}</p>
          ${isStoryWorks ? draftHTML(mission) : choicesHTML(mission, def, isCorrect)}
        </section>
      </div>
      ${
        showTransfer
          ? transferHTML(world, band, mission, list, idx, completed)
          : html`<div class="ms-actions"><a class="btn" href="${BASE}/worlds/${world.id}?grades=${band}">${icon("arrow-left")} Back to ${world.name} missions</a></div>`
      }
    </article>`;
}

function missionCard(m, idx, world, band, progress, nextIdx) {
  const done = isDone(progress, band, world.id, m.baseId);
  const status = done ? html`${icon("check")} Completed` : idx === nextIdx ? html`${icon("flag")} Up next` : "Not started";
  return html`<a class="world-mission-card ${done ? "is-done" : ""} ${idx === nextIdx ? "is-next" : ""}" href="${BASE}/worlds/${world.id}/${m.baseId}?grades=${band}">
    <span class="wm-top"><span class="wm-status">${status}</span><span class="wm-num">${String(idx + 1).padStart(2, "0")}</span></span>
    <strong>${text(m.title)}</strong>
    <span class="wm-context">${text(m.context)}</span>
    <span class="wm-go">${done ? "Review mission" : "Launch mission"} ${icon("arrow-right")}</span>
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
    ["01", "Domain studio", `Open ${world.domain} activities`, `${BASE}/${world.domain}?grades=${band}`],
    ["02", "Connected mission", "Investigate across domains", fallback[0] ? `${BASE}/missions/${fallback[0].id}?grades=${band}` : `${BASE}/missions?grades=${band}`],
    ["03", "Growth map", "Review evidence & progress", `${BASE}/growth?grades=${band}`],
  ];
  return html`${crumbsHTML([["Lab", `${BASE}/?grades=${band}`], ["Language Worlds", `${BASE}/worlds?grades=${band}`], [world.name, null]])}
    <div class="${domainClass(world.domain)}">
    <section class="world-detail">
      <div class="wd-detail-copy">
        <p class="eyebrow"><span class="lx-pill">${glyph(world.domain)} ${world.domain} · Grades ${band.replace("-", "–")}</span></p>
        <h1 tabindex="-1">${world.name}</h1>
        <p class="lead">${world.description}</p>
        <dl class="wd-facts">
          <div><dt>Language focus</dt><dd>${world.focus}</dd></div>
          <div><dt>Mechanic</dt><dd>${MECHANIC_LABEL[def?.mechanic] || "Simulation"}</dd></div>
          <div><dt>Key Language Uses</dt><dd>${world.keyUses.join(", ")}</dd></div>
        </dl>
        <p class="wd-progress"><span class="bar" aria-hidden="true"><i style="width:${list.length ? Math.round((done / list.length) * 100) : 0}%"></i></span><span><strong>${done} of ${list.length}</strong> missions completed</span></p>
      </div>
      <div class="wd-detail-art"><img src="${BASE}/pictures/worlds/${world.art}" alt="" width="640" height="360" /></div>
    </section>

    <section class="panel world-missions-section">
      <div class="world-section-head">
        <div>
          <p class="eyebrow">Consequential missions · 8 scenarios</p>
          <h2>${world.name} Mission Board</h2>
          <p>Every mission presents a real situation with observable evidence, focused language moves, and independent transfer.</p>
        </div>
        <span class="lx-pill">${done} of ${list.length} completed</span>
      </div>
      <div class="world-mission-grid">${list.map((m, idx) => missionCard(m, idx, world, band, progress, nextIdx))}</div>
    </section>

    <section class="world-map panel">
      <div>
        <p class="eyebrow">Language learning path</p>
        <h2>Practice across the lab</h2>
        <p>Carry skills between interactive game worlds, focused domain studios, and connected missions.</p>
      </div>
      <ol class="world-stations">
        ${stations.map(([n, title, sub, to]) => html`<li><a href="${to}"><span class="ws-num">${n}</span><strong>${title}</strong><span>${sub}</span></a></li>`)}
      </ol>
    </section>

    <section class="panel">
      <div class="world-section-head">
        <div>
          <p class="eyebrow">${world.domain} tasks</p>
          <h2>Field practice activities</h2>
          <p>Try standard practice tasks or explore the complete curriculum room.</p>
        </div>
        <a class="btn" href="${BASE}/${world.domain}?grades=${band}">Open studio ${icon("arrow-right")}</a>
      </div>
      <div class="task-grid world-task-grid">
        ${tasks.map((a) => html`<a class="card task-card" href="${activityHref(world.domain, a.level, a.id)}?grades=${band}">
          <span class="wt-status ${a.done ? "is-done" : ""}">${a.done ? html`${icon("check")} Practiced` : "Ready to explore"}</span>
          <strong>${text(a.title)}</strong>
          <span>${text(a.skill)}</span>
          <span class="fine">${minutesLabel(a.minutes || a.time || 5)} · ${humanize(a.type)}</span>
        </a>`)}
      </div>
    </section>

    ${
      fallback.length
        ? html`<section class="panel">
            <h2>Go deeper together</h2>
            <p>These connected missions carry evidence between activities and change what you explore next.</p>
            <div class="task-grid">${fallback.slice(0, 4).map((m) => connectedCard(m, band, studio.missions[m.id]))}</div>
          </section>`
        : ""
    }
    <p class="disclaimer">Learning activities provide scaffolds and feedback. Independent responses are tracked separately. Practice evidence is not an official proficiency score.</p>
    </div>`;
}

export async function render(ctx) {
  if (!WORLDS.length) WORLDS = (await loadWorlds()).worlds || [];
  const band = ctx.band;
  const worldId = ctx.route.worldId || ctx.route.id || "";
  const missionId = ctx.route.missionId || "";
  const world = WORLDS.find((w) => w.id === worldId);
  const index = await loadStudioIndex();
  const progress = loadMissionProgress();

  if (!world) return { title: "Language Worlds", html: hubHTML(ctx, index, progress) };

  if (missionId) {
    const mission = missionsOf(world.id, band).find((m) => m.baseId === missionId || m.id === missionId);
    if (mission) {
      const key = `${band}:${world.id}:${mission.baseId}`;
      if (missionSession.key !== key) resetSession(key);
      return { title: `${mission.title} · ${world.name}`, html: missionHTML(ctx, world, mission, progress) };
    }
  }

  return { title: `${world.name} · Language Worlds`, html: await worldHTML(ctx, world, index, loadStudio(), progress) };
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
