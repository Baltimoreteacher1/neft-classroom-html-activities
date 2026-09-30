// Lesson 3.4 ratio table lab: state, navigation, and event wiring.
// Each station module owns its own state slice, rendering, and handlers;
// this file only routes events to the active station and persists progress.

import { practice } from "./practice.mjs";
import { int, obj } from "./sanitize.mjs";
import { CORE_STATIONS } from "./stations-core.mjs";
import { GRAPH_STATIONS } from "./stations-graph.mjs";

const STATIONS = [...CORE_STATIONS, ...GRAPH_STATIONS, practice];
const KEY = "eduwonderlab-3.4-ratio-table-v4";
const LEGACY_KEY = "eduwonderlab-3.4-ratio-table-v3";
const $ = (id) => document.getElementById(id);

const fresh = () => ({
  version: 4,
  step: 0,
  data: Object.fromEntries(STATIONS.map((st) => [st.id, st.fresh()])),
});

function restore(saved) {
  const state = fresh();
  state.step = int(saved.step, 0, STATIONS.length - 1, 0);
  const data = obj(saved.data);
  for (const st of STATIONS) state.data[st.id] = { ...st.fresh(), ...st.restore(obj(data[st.id])) };
  return state;
}

// v3 was the five-step lab. Carry over the work that still has a home.
function fromV3(old) {
  return {
    step: [1, 2, 3, 4, 6][int(old.step, 0, 4, 0)],
    data: {
      explore: { bags: old.bags },
      build: { index: old.buildIndex, values: old.buildValues, solved: old.buildSolved },
      check: { phase: old.checkPhase, repair: old.repair, reason: old.reason, pairX: old.pairX, pairY: old.pairY },
    },
  };
}

let state = fresh();
let storageOK = true;
const ui = { hint: false, message: "", kind: "" };

try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (saved?.version === 4) state = restore(saved);
  else {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (legacy?.version === 3) state = restore(fromV3(legacy));
  }
} catch {
  storageOK = false;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    storageOK = false;
  }
  if (!storageOK) {
    $("save-note").classList.add("save-error");
    $("save-note").firstChild.textContent = "Saving is unavailable. Keep this tab open to keep your work. ";
  }
}

const station = () => STATIONS[state.step];
const completion = () => STATIONS.map((st) => st.done(state.data[st.id]));

function showFeedback() {
  const el = $("feedback");
  el.textContent = ui.message;
  el.className = `feedback${ui.kind ? ` ${ui.kind}` : ""}`;
}

const ctx = {
  get s() {
    return state.data[station().id];
  },
  get step() {
    return state.step;
  },
  get hint() {
    return ui.hint;
  },
  set hint(v) {
    ui.hint = v;
  },
  say(text, kind = "") {
    ui.message = text;
    ui.kind = kind;
  },
  feedback(text, kind = "") {
    ctx.say(text, kind);
    showFeedback();
  },
  invalid(id, flag = true) {
    $(id)?.setAttribute("aria-invalid", String(flag));
  },
  refresh(focusId) {
    save();
    render(focusId);
  },
  go,
};

function updateNav() {
  const done = completion();
  const count = done.filter(Boolean).length;
  $("steps").innerHTML = STATIONS.map((st, i) => {
    const current = i === state.step ? 'aria-current="step" ' : "";
    const mark = done[i] ? "✓" : i + 1;
    return `<li><button type="button" class="step-link${done[i] ? " done" : ""}" data-go="${i}" ${current}aria-label="${st.label}${done[i] ? ", complete" : ""}"><span class="step-no" aria-hidden="true">${mark}</span><span class="step-label">${st.label}</span></button></li>`;
  }).join("");
  $("progress-text").textContent = count === STATIONS.length ? "All 8 stations complete ★" : `${count} of ${STATIONS.length} complete`;
  $("progress-bar").style.width = `${Math.round((count / STATIONS.length) * 100)}%`;
  $("back").disabled = state.step === 0;
  $("next").hidden = state.step === STATIONS.length - 1;
  $("next").textContent = `Next: ${STATIONS[state.step + 1]?.label ?? ""}`;
}

function render(focusId) {
  updateNav();
  $("activity").innerHTML = station().render(ctx);
  showFeedback();
  document.title = `${station().label} · Ratio table lab · Lesson 3.4`;
  if (focusId && $(focusId)) $(focusId).focus({ preventScroll: true });
}

function go(index) {
  state.step = Math.max(0, Math.min(STATIONS.length - 1, index));
  ui.hint = false;
  ctx.say("");
  save();
  render("stage-title");
  $("lesson").scrollIntoView({ behavior: "instant", block: "start" });
}

function speak() {
  if (!("speechSynthesis" in window)) return;
  const parts = ["stage-title", "stage-instruction", "practice-prompt"].map((id) => $(id)?.textContent).filter(Boolean);
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(parts.join(". "));
  u.lang = "en-US";
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

const GLOBAL = {
  back: () => go(state.step - 1),
  next: () => go(state.step + 1),
  hint: () => {
    ui.hint = !ui.hint;
    render("act-hint");
  },
  speak,
  "about-open": () => $("about").showModal(),
  "about-close": () => $("about").close(),
  "reset-open": () => $("reset-dialog").showModal(),
  "reset-cancel": () => $("reset-dialog").close(),
  "reset-confirm": () => {
    state = fresh();
    ui.hint = false;
    ctx.say("");
    save();
    $("reset-dialog").close();
    render("stage-title");
  },
};

document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-go], [data-action], button[id]");
  if (!target || target.disabled) return;
  if (target.dataset.go !== undefined) {
    go(Number(target.dataset.go));
    return;
  }
  const name = target.dataset.action ?? target.id;
  if (GLOBAL[name]) GLOBAL[name]();
  else station().action?.(name, target, ctx);
});

function onInput(e) {
  if (station().input?.(e.target, ctx)) {
    e.target.removeAttribute("aria-invalid");
    save();
  }
}
document.addEventListener("input", onInput);
document.addEventListener("change", onInput);

document.addEventListener("submit", (e) => {
  e.preventDefault();
  station().submit?.(e.target.id, ctx);
});

document.addEventListener("keydown", (e) => {
  if (station().key?.(e, ctx)) e.preventDefault();
});

if (!("speechSynthesis" in window)) document.body.classList.add("no-speech");
save();
render();
