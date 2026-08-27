//
// A story/simulation-driven SHELL that wraps the existing 6-phase engine
// (engine/core/lesson-renderer.js -> bootLesson). It does NOT replace the
// phase engine. It layers on:
//   1. an opening "mission" story screen,
//   2. scene framing for each of the 6 phases (a narrative banner + scene art),
//   3. a simulation/manipulative centerpiece in the Explore phase,
//   4. Level 1 / Level 2 branching (delegated to engine/core/levels.js +
//      adaptive.js, already wired into the Practice phase),
//   5. a satisfying completion sequence.
//
// Driven by the SAME config.json shape, plus an optional top-level `flagship`
// block. See README.md for the schema.

import { bootLesson } from "../../core/lesson-renderer.js";
import { ensureCanvasBridge } from "../../core/scorm-bridge.js";
import "../../../assets/design-tokens.css";
import "./flagship.css";
// The editorial design layer is now loaded engine-wide by createApp
// (engine/styles/editorial.css); flagship inherits it like every lesson.
import { stackHtml, t } from "../../core/i18n.js";
import { isToolsMode } from "../../core/tools-mode.js";

// The engine runs THREE acts now (Warm-Up / Lesson / Exit Ticket), not the old
// six phases — indexing authored scenes by the old 6-entry list showed Act 3
// students the "explore" scene and made practice/connect/reflect scenes
// unreachable on all 30 flagship lessons. Each act picks the first scene its
// author actually wrote, in the order that act teaches.
const ACT_SCENE_KEYS = [
  ["launch", "vocab"],
  ["explore", "practice", "vocab", "connect"],
  ["reflect", "connect"],
];

function sceneForPhase(scenes, phaseIndex) {
  const candidates = ACT_SCENE_KEYS[phaseIndex] || ACT_SCENE_KEYS[0];
  for (const key of candidates) {
    if (scenes[key]) return scenes[key];
  }
  return null;
}

export function bootFlagship(config) {
  // Canvas/SCORM resume relay, attached BEFORE the mission intro rather than
  // inherited from bootLesson. bootLesson runs inside showMissionIntro's
  // callback — i.e. only after the student presses Start — so relying on the
  // delegation would leave the SCORM wrapper without a handshake for as long as
  // the student sat on the story screen, past the wrapper's handshake timeout,
  // and any stored resume state would arrive after the lesson had already
  // begun. Idempotent, so the later bootLesson call is a no-op.
  ensureCanvasBridge(config);

  const fl = config.flagship || {};
  const scenes = normalizeScenes(fl.scenes);

  // Interactive Tools (?mode=tools) is a standalone practice surface with no
  // phases — so none of the flagship narrative shell applies to it. Hand it
  // straight to the engine, which renders the tools page and returns.
  //
  // Without this, a flagship lesson's tools link was reachable only THROUGH the
  // mission briefing: bootFlagship showed the full-screen "Mission Briefing"
  // overlay first and did not call bootLesson (where the isToolsMode() check
  // lives) until the student pressed Start. A student following the 🧰 link
  // landed on a story screen for a lesson they were not starting, and the scene
  // HUD + completion watcher then attached to a page that never navigates
  // phases. The 10 flagship lessons were the only ones with that gate.
  if (isToolsMode()) {
    bootLesson(config);
    return;
  }

  // If the flagship block defines a simulation, route it into the Explore
  // phase by overriding config.explore.type (additive — only when provided).
  const mergedConfig = applySimulation(config, fl);

  // Mark the body so flagship CSS scopes apply.
  document.body.classList.add("flagship");

  // Show the mission intro, then boot the underlying phase engine and attach
  // the narrative HUD that updates per scene.
  showMissionIntro(fl, config, () => {
    bootLesson(mergedConfig);
    attachSceneHud(scenes, fl);
    attachCompletionWatcher(fl, config);
  });
}

const SCENE_PHASE_NAMES = ["launch", "vocab", "explore", "practice", "connect", "reflect"];

function normalizeScenes(scenes) {
  const out = {};
  (scenes || []).forEach((s) => {
    if (s && s.phase && SCENE_PHASE_NAMES.includes(s.phase)) out[s.phase] = s;
  });
  return out;
}

function applySimulation(config, fl) {
  if (!fl.simulation || !fl.simulation.type) return config;
  const sim = fl.simulation;
  // Only override if the explore phase hasn't already been given this type.
  const explore = { ...(config.explore || {}) };
  explore.type = sim.type;
  // Shallow-merge any provided simulation props (targets, range, etc.).
  for (const k of Object.keys(sim)) {
    if (k === "type") continue;
    explore[k] = sim[k];
  }
  return { ...config, explore };
}

function showMissionIntro(fl, config, onStart) {
  const mission = fl.mission || {};
  const root = document.getElementById("app");
  if (!root) {
    onStart();
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "flagship-mission";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "Mission briefing");
  overlay.innerHTML = `
    <div class="flagship-mission-card">
      <div class="flagship-mission-emoji">${config.themeEmoji || "🚀"}</div>
      <div class="flagship-mission-eyebrow">${esc(mission.eyebrow || "Mission Briefing")}</div>
      <h1 class="flagship-mission-title">${esc(mission.title || config.title)}</h1>
      <p class="flagship-mission-story">${esc(mission.story || (config.launch && config.launch.narrative) || "")}</p>
      ${
        mission.objective
          ? `<div class="flagship-mission-objective"><span>🎯 Objective</span><p>${esc(mission.objective)}</p></div>`
          : ""
      }
      <button class="btn btn-primary btn-lg flagship-mission-start">${esc(mission.cta || t("startActivity"))}</button>
    </div>
  `;
  // Into #app, NOT document.body — and `root` above exists for exactly this.
  //
  // assets/lesson-shell-guard.js treats "#app is still empty 9s after load" as
  // proof that a lesson failed to boot, and paints a "This lesson is having
  // trouble loading" card. A flagship lesson does not call bootLesson() until
  // the student presses Start, so appending the briefing to <body> left #app
  // empty for as long as the student spent reading it — and the briefing is a
  // story screen, so nine seconds is a normal dwell time, not an edge case.
  // All 10 unit-entry lessons showed students a false "broken lesson" alert.
  //
  // The overlay is `position: fixed; inset: 0` (flagship.css) and #app has no
  // transformed ancestor, so the parent has no effect on how it paints.
  root.append(overlay);

  const start = () => {
    overlay.classList.add("leaving");
    setTimeout(() => {
      overlay.remove();
      onStart();
    }, 350);
  };
  overlay.querySelector(".flagship-mission-start").addEventListener("click", start);
}

// A persistent narrative banner that reflects the current scene. It listens to
// the engine's navigation event so it stays in sync without touching internals.
function attachSceneHud(scenes, _fl) {
  const main = document.querySelector(".main");
  if (!main) return;

  const hud = document.createElement("div");
  hud.className = "flagship-scene-hud";
  hud.setAttribute("aria-live", "polite");
  main.prepend(hud);

  function update(phaseIndex) {
    const scene = sceneForPhase(scenes, phaseIndex);
    if (!scene) {
      hud.style.display = "none";
      return;
    }
    hud.style.display = "";
    hud.innerHTML = `
      <div class="flagship-scene-icon">${esc(scene.icon || "✨")}</div>
      <div class="flagship-scene-body">
        <div class="flagship-scene-name">${esc(scene.name || "")}</div>
        <div class="flagship-scene-text">${esc(scene.text || "")}</div>
      </div>
    `;
  }

  update(0);
  document.addEventListener("rma:navigate", (e) =>
    update(/** @type {CustomEvent} */ (e).detail.phase),
  );
}

// Watches for full completion and plays a flagship completion sequence on top
// of the engine's summary card.
function attachCompletionWatcher(fl, config) {
  const finale = fl.finale || {};
  const seen = new WeakSet();
  const observer = new MutationObserver(() => {
    const summary = document.querySelector(".phase .card.text-center");
    if (summary && !seen.has(summary)) {
      // Heuristic: the final summary contains "Activity Complete".
      if (/Activity Complete/i.test(summary.textContent)) {
        seen.add(summary);
        playFinale(finale, config);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function playFinale(finale, _config) {
  const banner = document.createElement("div");
  banner.className = "flagship-finale";
  banner.setAttribute("role", "status");
  banner.innerHTML = `
    <div class="flagship-finale-card">
      <div class="flagship-finale-emoji">${esc(finale.emoji || "🏆")}</div>
      <div class="flagship-finale-title">${esc(finale.title || "Mission Accomplished!")}</div>
      <p class="flagship-finale-text">${esc(finale.text || "You completed the mission. Outstanding work, mathematician!")}</p>
    </div>
  `;
  document.body.append(banner);
  requestAnimationFrame(() => banner.classList.add("visible"));
  setTimeout(() => banner.classList.remove("visible"), 4200);
  setTimeout(() => banner.remove(), 4800);
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}
