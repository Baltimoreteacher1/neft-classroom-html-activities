// Interactive world selector and mission console for the four Language Worlds:
// Signal Station (Listening), Evidence City (Reading), Conversation Quest (Speaking), StoryWorks (Writing).
// Each world features 8 substantive, consequential missions per grade band with independent transfer.
import { crumbsHTML } from "../components.js";
import { bandDomains, loadDomain, loadStudioIndex, loadWorlds, ordered } from "../content.js";
import { getWorldMission, WORLD_MISSIONS } from "../content/world-missions.js";
import { loadStudio } from "../lang/studio.js";
import { activityStatus } from "../practice-plan.js";
import { loadRecord } from "../store.js";
import { BASE, html, safeJson, storage } from "../util.js";
import { activityHref } from "./room.js";

const PROGRESS_KEY = "accessPracticeLab:v1:world-missions";
let WORLDS = [];

function loadMissionProgress() {
  return safeJson(storage.get(PROGRESS_KEY), {}) || {};
}

function saveMissionProgress(data) {
  storage.set(PROGRESS_KEY, JSON.stringify(data));
}

const esc = (value) => String(value || "");
const href = (id, band) => `${BASE}/worlds/${id}?grades=${band}`;

function tile(world, band) {
  return html`<a class="world-tile" href="${href(world.id, band)}" style="--world:${world.color}">
    <img src="${BASE}/pictures/worlds/${world.art}" alt="" width="280" height="150" loading="lazy" />
    <span class="world-copy">
      <strong>${world.name}</strong>
      <span>${world.focus}</span>
      <small style="color:var(--ink-2);margin-top:0.35rem">8 substantive missions · Grades ${band.replace("-", "–")}</small>
    </span>
    <span class="world-open" aria-hidden="true">Enter world →</span>
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
  selectedChoice: null,
  checked: false,
  draftText: "",
  showTranscript: false,
  transferDone: false,
};

export async function render(ctx) {
  if (!WORLDS.length) WORLDS = (await loadWorlds()).worlds || [];
  const band = ctx.band;
  const worldId = ctx.route.worldId || ctx.route.id || "";
  const missionId = ctx.route.missionId || "";
  const world = WORLDS.find((w) => w.id === worldId);
  const index = await loadStudioIndex();
  const studio = loadStudio();
  const progress = loadMissionProgress();

  if (!world) {
    return {
      title: "Language Worlds",
      html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${band}`], ["Language Worlds", null]])}
        <section class="worlds-hero">
          <div>
            <span class="badge">Explore · Grades ${band.replace("-", "–")}</span>
            <h1 tabindex="-1">Four worlds. Consequential missions.</h1>
            <p class="lead">Step into consequential language environments. Each world tests your communication in context with original missions and independent transfer.</p>
          </div>
          <p class="worlds-note">Private to this browser. These original learning simulations develop academic language; they do not calculate or predict official WIDA scores.</p>
        </section>
        <nav class="world-grid" aria-label="Choose a learning world">${WORLDS.map((w) => tile(w, band))}</nav>
        <section class="panel world-bridge">
          <h2>Connected language missions</h2>
          <p>Listen, read, collect evidence, discuss, and write through a complete investigation.</p>
          <div class="task-grid">${index.missions.filter((m) => m.band === band || m.band === "Both").map((m) => html`<a class="card task-card" href="${BASE}/missions/${m.id}?grades=${band}"><strong>${m.icon || "◈"} ${m.title}</strong><span class="fine">${m.contentArea} · ${m.minutes} min</span><span>${m.summary}</span></a>`)}</div>
        </section>`
    };
  }

  // If a specific mission inside this world is requested
  if (missionId) {
    const worldDef = WORLD_MISSIONS[world.id];
    const bandMissions = worldDef?.bands?.[band] || [];
    const mission = bandMissions.find((m) => m.baseId === missionId || m.id === missionId);

    if (mission) {
      const isCompleted = Boolean(progress[`${band}:${world.id}:${mission.baseId}`]);
      const isStoryWorks = world.id === "storyworks";
      const isCorrect = missionSession.checked && missionSession.selectedChoice === mission.answer;

      return {
        title: `${mission.title} · ${world.name}`,
        html: html`${crumbsHTML([
          ["Lab", `${BASE}/?grades=${band}`],
          ["Language Worlds", `${BASE}/worlds?grades=${band}`],
          [world.name, `${BASE}/worlds/${world.id}?grades=${band}`],
          [mission.title, null]
        ])}
        <main class="mission-console" style="--world:${world.color}">
          <header class="mission-hero">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">
              <span class="mission-mechanic-badge">${worldDef.mechanic} mechanic · ${world.domain}</span>
              <span class="badge">Grades ${band.replace("-", "–")}</span>
            </div>
            <h1 tabindex="-1">${mission.title}</h1>
            <p class="lead" style="margin:0;color:var(--ink-2)">${mission.context}</p>
          </header>

          <section class="panel mission-stimulus" aria-label="Mission source materials">
            <h2 style="font-size:1.15rem;margin:0 0 0.5rem">Mission source</h2>
            ${world.id === "signal-station" ? html`
              <div class="mission-audio-bar">
                <button type="button" class="btn btn-primary" data-say="${mission.stimulus}" aria-label="Play original listening dispatch">▶ Play dispatch audio</button>
                <button type="button" class="btn" data-stop-audio>Stop</button>
                <button type="button" class="btn" data-world-toggle-transcript aria-expanded="${missionSession.showTranscript}">
                  ${missionSession.showTranscript ? "Hide text" : "Show text preview"}
                </button>
              </div>
              ${missionSession.showTranscript ? html`<p style="margin:0.5rem 0 0;font-style:italic;background:#fff;padding:0.8rem;border-radius:8px;border:1px solid var(--line)">“${mission.stimulus}”</p>` : ""}
            ` : html`
              <p style="margin:0;font-size:1.06rem;line-height:1.6">“${mission.stimulus}”</p>
            `}
          </section>

          <section class="panel mission-workbench" aria-label="Mission investigation">
            <h2 style="font-size:1.2rem;margin:0">${mission.prompt}</h2>

            ${!isStoryWorks ? html`
              <div class="mission-choices" role="radiogroup" aria-label="Possible decisions">
                ${mission.choices.map((choice, i) => html`
                  <label class="mission-choice ${missionSession.selectedChoice === i ? "is-selected" : ""}">
                    <input type="radio" name="missionChoice" value="${i}" ${missionSession.selectedChoice === i ? "checked" : ""} ${missionSession.checked ? "disabled" : ""} data-world-choice="${i}" />
                    <span>${choice}</span>
                  </label>
                `)}
              </div>

              ${!missionSession.checked ? html`
                <div style="display:flex;gap:0.75rem;margin-top:0.5rem">
                  <button type="button" class="btn btn-primary" data-world-check ${missionSession.selectedChoice === null ? "disabled" : ""}>
                    Confirm ${worldDef.mechanic} decision
                  </button>
                </div>
              ` : html`
                <div class="mission-feedback ${isCorrect ? "is-correct" : "is-try"}" role="status">
                  <strong>${isCorrect ? "Coherent and supported by the source." : "Consider the evidence again."}</strong>
                  <p style="margin:0.4rem 0 0">${isCorrect ? mission.feedback : "Check the exact relationships in the source message before deciding."}</p>
                  ${isCorrect && mission.frame ? html`
                    <div class="mission-frame-box">
                      <strong>Language frame for explaining your decision:</strong>
                      <p style="margin:0.3rem 0 0;font-style:italic">${mission.frame}</p>
                    </div>
                  ` : ""}
                </div>
                ${!isCorrect ? html`
                  <button type="button" class="btn btn-primary" data-world-retry style="margin-top:0.5rem">Try again</button>
                ` : ""}
              `}
            ` : html`
              <div class="mission-draft-area">
                <p style="color:var(--ink-2);font-size:0.92rem;margin:0 0 0.5rem"><strong>Success criteria:</strong> ${mission.successCriteria}</p>
                <div style="margin-bottom:0.5rem">
                  <button type="button" class="btn" data-world-insert-frame="${esc(mission.frame)}">Insert sentence frame</button>
                </div>
                <label for="missionDraft" class="sr-only">Draft your response</label>
                <textarea id="missionDraft" rows="5" placeholder="Draft your recommendation or explanation here..." data-world-draft>${missionSession.draftText}</textarea>
                <div style="display:flex;gap:0.75rem;margin-top:0.75rem">
                  <button type="button" class="btn btn-primary" data-world-check-writing ${missionSession.checked ? "disabled" : ""}>Review draft with success criteria</button>
                </div>
                ${missionSession.checked ? html`
                  <div class="mission-feedback is-correct" role="status" style="margin-top:1rem">
                    <strong>Draft review:</strong>
                    <p style="margin:0.4rem 0">${mission.feedback}</p>
                    <div class="mission-frame-box">
                      <strong>Target language pattern:</strong>
                      <p style="margin:0.3rem 0 0;font-style:italic">${mission.frame}</p>
                    </div>
                  </div>
                ` : ""}
              </div>
            `}
          </section>

          ${(missionSession.checked && (isStoryWorks || isCorrect)) ? html`
            <section class="mission-transfer" aria-label="Independent transfer">
              <span class="eyebrow" style="color:var(--brand-ink)">INDEPENDENT TRANSFER CHALLENGE</span>
              <h3>Carry the skill to a new situation</h3>
              <p style="margin:0;line-height:1.55">${mission.independent}</p>
              <div style="margin-top:0.75rem;display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center">
                <button type="button" class="btn btn-primary" data-world-complete="${world.id}:${mission.baseId}">
                  ${isCompleted ? "✓ Mission completed (update progress)" : "✓ Complete mission & record transfer"}
                </button>
                <a class="btn" href="${BASE}/worlds/${world.id}?grades=${band}">← Return to ${world.name} board</a>
              </div>
              <p class="fine" style="margin:0">Independent responses are practiced on paper or shared with a partner. Practice results are never transmitted off this device.</p>
            </section>
          ` : html`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0">
              <a class="btn" href="${BASE}/worlds/${world.id}?grades=${band}">← Back to ${world.name} missions</a>
            </div>
          `}
        </main>`
      };
    }
  }

  // World detail view: renders the 8 substantive world missions for this band!
  const worldDef = WORLD_MISSIONS[world.id];
  const worldMissions = worldDef?.bands?.[band] || [];
  const tasks = await activitiesFor(world, band);
  const missionPattern = new RegExp(world.missionHints.join("|"), "i");
  const missions = index.missions.filter((m) => (m.band === band || m.band === "Both") && missionPattern.test(`${m.title} ${m.summary}`));
  const fallback = missions.length ? missions : index.missions.filter((m) => m.band === band || m.band === "Both");

  return {
    title: `${world.name} · Language Worlds`,
    html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${band}`], ["Language Worlds", `${BASE}/worlds?grades=${band}`], [world.name, null]])}
      <section class="world-detail" style="--world:${world.color}">
        <img src="${BASE}/pictures/worlds/${world.art}" alt="" width="360" height="190" />
        <div>
          <span class="badge">${world.domain} · Grades ${band.replace("-", "–")}</span>
          <h1 tabindex="-1">${world.name}</h1>
          <p class="lead">${world.description}</p>
          <p><strong>Language focus:</strong> ${world.focus}</p>
          <p><strong>Mechanic:</strong> ${worldDef ? worldDef.mechanic : "simulation"} · <strong>Key Language Uses:</strong> ${world.keyUses.join(", ")}</p>
        </div>
      </section>

      <section class="panel world-missions-section">
        <div class="world-section-head">
          <div>
            <span class="eyebrow" style="color:var(--brand-ink)">CONSEQUENTIAL MISSIONS · 8 SCENARIOS</span>
            <h2>${world.name} Mission Board</h2>
            <p>Every mission presents a real situation with observable evidence, focused language moves, and independent transfer.</p>
          </div>
          <span class="badge" style="background:var(--world);color:#fff">${worldMissions.filter((m) => progress[`${band}:${world.id}:${m.baseId}`]).length} of ${worldMissions.length} completed</span>
        </div>
        <div class="world-mission-grid">
          ${worldMissions.map((m, idx) => {
            const done = Boolean(progress[`${band}:${world.id}:${m.baseId}`]);
            return html`
              <a class="world-mission-card ${done ? "is-done" : ""}" href="${BASE}/worlds/${world.id}/${m.baseId}?grades=${band}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span class="badge">${done ? "✓ Completed" : `Mission ${String(idx + 1).padStart(2, "0")}`}</span>
                  <small style="color:var(--ink-2);font-weight:700">${worldDef.mechanic}</small>
                </div>
                <strong>${esc(m.title)}</strong>
                <span style="font-size:0.92rem;color:var(--ink-2)">${esc(m.context)}</span>
                <span style="font-size:0.85rem;color:var(--brand-ink);font-weight:700;margin-top:auto">Launch mission →</span>
              </a>
            `;
          })}
        </div>
      </section>

      <section class="world-map panel">
        <div>
          <span class="eyebrow">Language learning path</span>
          <h2>Practice across the lab</h2>
          <p>Carry skills between interactive game worlds, focused domain studios, and connected missions.</p>
        </div>
        <div class="world-stations" role="list">
          <a role="listitem" href="${BASE}/${world.domain}?grades=${band}">
            <strong>01 · Domain studio</strong>
            <span>Open ${world.domain} activities</span>
          </a>
          <a role="listitem" href="${fallback[0] ? `${BASE}/missions/${fallback[0].id}?grades=${band}` : `${BASE}/missions?grades=${band}`}">
            <strong>02 · Connected mission</strong>
            <span>Investigate across domains</span>
          </a>
          <a role="listitem" href="${BASE}/growth?grades=${band}">
            <strong>03 · Growth map</strong>
            <span>Review evidence & progress</span>
          </a>
        </div>
      </section>

      <section class="panel">
        <div class="world-section-head">
          <div>
            <span class="eyebrow">${world.domain} tasks</span>
            <h2>Field practice activities</h2>
            <p>Try standard practice tasks or explore the complete curriculum room.</p>
          </div>
          <a class="btn" href="${BASE}/${world.domain}?grades=${band}">Open studio</a>
        </div>
        <div class="task-grid world-task-grid">
          ${tasks.map((a) => html`<a class="card task-card" href="${activityHref(world.domain, a.level, a.id)}?grades=${band}"><span class="badge">${a.done ? "Practiced" : "Ready to explore"}</span><strong>${esc(a.title)}</strong><span>${esc(a.skill)}</span><span class="fine">${a.minutes || a.time || 5} min · ${a.type}</span></a>`)}
        </div>
      </section>

      ${fallback.length ? html`
        <section class="panel">
          <h2>Go deeper together</h2>
          <p>These connected missions carry evidence between activities and change what you explore next.</p>
          <div class="task-grid">${fallback.slice(0, 4).map((m) => {
            const state = studio.missions[m.id];
            return html`<a class="card task-card" href="${BASE}/missions/${m.id}?grades=${band}"><span class="badge">${state?.done ? "Mission complete" : state?.started ? "Continue mission" : "Connected mission"}</span><strong>${m.icon || "◈"} ${m.title}</strong><span class="fine">${m.contentArea} · ${m.minutes} min</span><span>${m.summary}</span></a>`;
          })}</div>
        </section>
      ` : ""}
      <p class="disclaimer">Learning activities provide scaffolds and feedback. Independent responses are tracked separately. Practice evidence is not an official proficiency score.</p>`
  };
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
    missionSession.checked = true;
    ctx.rerender();
    return true;
  }

  if (button.hasAttribute("data-world-complete")) {
    const key = button.dataset.worldComplete;
    const progress = loadMissionProgress();
    progress[`${ctx.band}:${key}`] = { completed: true, timestamp: Date.now() };
    saveMissionProgress(progress);
    missionSession.transferDone = true;
    button.textContent = "✓ Recorded on this device";
    button.disabled = true;
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
