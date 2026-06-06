// Flagship lesson template.
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
import "../../../assets/design-tokens.css";
import "./flagship.css";
import { stackHtml, t } from "../../core/i18n.js";

const PHASE_KEYS = [
  "launch",
  "vocab",
  "explore",
  "practice",
  "connect",
  "reflect",
];

export function bootFlagship(config) {
  const fl = config.flagship || {};
  const scenes = normalizeScenes(fl.scenes);

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

function normalizeScenes(scenes) {
  const out = {};
  (scenes || []).forEach((s) => {
    if (s && s.phase && PHASE_KEYS.includes(s.phase)) out[s.phase] = s;
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
  document.body.append(overlay);

  const start = () => {
    overlay.classList.add("leaving");
    setTimeout(() => {
      overlay.remove();
      onStart();
    }, 350);
  };
  overlay
    .querySelector(".flagship-mission-start")
    .addEventListener("click", start);
}

// A persistent narrative banner that reflects the current scene. It listens to
// the engine's navigation event so it stays in sync without touching internals.
function attachSceneHud(scenes, fl) {
  const main = document.querySelector(".main");
  if (!main) return;

  const hud = document.createElement("div");
  hud.className = "flagship-scene-hud";
  hud.setAttribute("aria-live", "polite");
  main.prepend(hud);

  function update(phaseIndex) {
    const key = PHASE_KEYS[phaseIndex] || "launch";
    const scene = scenes[key];
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
  document.addEventListener("rma:navigate", (e) => update(e.detail.phase));
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

function playFinale(finale, config) {
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
