/**
 * Shared cabinet shell: objective, one-step tutorial, keyboard controls,
 * specific miss feedback, and device-local progress. No student names.
 */
import {
  SHELL_KEY,
  checkGameMove,
  gameIdFromPath,
  shellCopy,
  shellProgress,
  studentFacingMiss,
} from "./game-shell-data.mjs";

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHELL_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRow(row) {
  const all = readAll();
  all[row.id] = row;
  try {
    localStorage.setItem(SHELL_KEY, JSON.stringify(all));
  } catch {
    /* private mode: the panel still shows the latest attempt */
  }
}

function paintProgress(row) {
  const node = document.querySelector(".ewl-game-save");
  if (!node || !row) return;
  node.textContent = `Saved on this device: ${row.solved} solved, ${row.misses} to revise.`;
}

export function mountShell(id, host) {
  const spec = shellCopy(id);
  if (!spec || document.querySelector(".ewl-game-shell")) return null;
  const row = readAll()[id] || { schema_version: 1, id, solved: 0, misses: 0, attempts: 0 };
  row.schema_version = 1;
  row.id = id;
  writeRow(row);
  const section = document.createElement("section");
  section.className = "ewl-game-shell";
  section.setAttribute("aria-label", "How this game works");
  section.innerHTML = `
    <p class="ewl-game-objective"><strong>Objective. </strong><span></span></p>
    <p class="ewl-game-tutorial" hidden><strong>Try this first. </strong><span></span></p>
    <p class="ewl-game-keys"></p>
    <p class="ewl-game-feedback" role="status" aria-live="polite"></p>
    <p class="ewl-game-save" role="status"></p>
    <button type="button" class="ewl-game-step">Show the one step</button>
  `;
  const tutorial = section.querySelector(".ewl-game-tutorial");
  tutorial.tabIndex = -1;
  section.querySelector(".ewl-game-objective span").textContent = spec.objective;
  section.querySelector(".ewl-game-tutorial span").textContent = spec.tutorial;
  section.querySelector(".ewl-game-keys").textContent = `Keyboard: ${spec.keys}`;
  const button = section.querySelector(".ewl-game-step");
  button.addEventListener("click", () => {
    const open = tutorial.hidden;
    tutorial.hidden = !open;
    button.textContent = open ? "Hide the one step" : "Show the one step";
    if (open) tutorial.focus?.();
  });
  const parent = host || document.querySelector("main") || document.body;
  parent.prepend(section);
  paintProgress(row);
  return section;
}

export function observe(id, message, correct) {
  const spec = shellCopy(id);
  if (!spec) return null;
  const shown = studentFacingMiss(id, message);
  const all = readAll();
  const row = shellProgress(all[id], { id, message: shown, correct: !!correct });
  writeRow(row);
  const feedback = document.querySelector(".ewl-game-feedback");
  if (feedback) feedback.textContent = shown;
  paintProgress(row);
  return row;
}

function boot() {
  const id = gameIdFromPath(location.pathname);
  if (!shellCopy(id)) return;
  mountShell(id);
  document.addEventListener("ewl:studio", (event) => {
    const message = event.detail && event.detail.feedback;
    if (!message) return;
    const correct = /\b(correct|solved|equivalent|matches)\b/i.test(message) && !GENERIC_CORRECT_BLOCK.test(message);
    observe(id, message, correct);
  });
  const live = document.querySelector("#feedback-line, #practice-native-feedback, #coach");
  if (live) {
    let last = "";
    const push = () => {
      const text = live.textContent.trim();
      if (!text || text === last) return;
      last = text;
      const correct = /\b(correct|yes|right|solved)\b/i.test(text) && !/not quite|not yet|wrong/i.test(text);
      observe(id, text, correct);
    };
    new MutationObserver(push).observe(live, { childList: true, characterData: true, subtree: true });
  }
}

const GENERIC_CORRECT_BLOCK = /not quite|not yet|wrong|may indicate/i;

const api = { mountShell, observe, check: checkGameMove, boot };
window.EWLGameShell = api;
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
