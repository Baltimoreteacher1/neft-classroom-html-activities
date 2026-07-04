/* Universal Access Layer — client-side, opt-in, offline. No PII, no network calls.
 * Prefs in localStorage only. TTS uses the browser's on-device SpeechSynthesis. */
import { LEVELS, LANGUAGES, GLOSSARY, PROBLEMS } from "./data.js";

const KEY = "access-prefs";
const langVoice = { en: "en-US", es: "es-ES", ht: "fr-FR", ar: "ar-SA" }; // ht: closest available fallback
const state = Object.assign(
  { problem: PROBLEMS[0].id, level: 1, lang: "en" },
  load(),
);

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
const esc = (s) =>
  String(s).replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
  );

function currentProblem() {
  return PROBLEMS.find((p) => p.id === state.problem) || PROBLEMS[0];
}
function rawText() {
  const p = currentProblem();
  return (
    (p.levels[state.level] && p.levels[state.level][state.lang]) ||
    p.levels[state.level].en
  );
}
// Convert [[term]] markers into tappable spans; escape everything else.
function renderText(raw) {
  return raw
    .split(/(\[\[[^\]]+\]\])/)
    .map((chunk) => {
      const m = chunk.match(/^\[\[([^\]]+)\]\]$/);
      if (!m) return esc(chunk);
      const key = m[1].toLowerCase();
      return `<span class="term" tabindex="0" role="button" data-term="${esc(key)}">${esc(m[1])}</span>`;
    })
    .join("");
}
function plainText(raw) {
  return raw.replace(/\[\[([^\]]+)\]\]/g, "$1");
}

function build() {
  const dir = LANGUAGES.find((l) => l.code === state.lang)?.dir || "ltr";
  document.getElementById("seg-problem").innerHTML = PROBLEMS.map(
    (p) =>
      `<button data-problem="${p.id}" aria-pressed="${p.id === state.problem}">${esc(p.title)}</button>`,
  ).join("");
  document.getElementById("seg-lang").innerHTML = LANGUAGES.map(
    (l) =>
      `<button data-lang="${l.code}" aria-pressed="${l.code === state.lang}">${esc(l.name)}</button>`,
  ).join("");
  document.getElementById("levelbar").innerHTML = LEVELS.map(
    (lv) =>
      `<button data-level="${lv.id}" aria-pressed="${lv.id === state.level}">
       <span class="nm">${esc(lv.name)}</span><span class="bl">${esc(lv.blurb)}</span></button>`,
  ).join("");
  const p = currentProblem();
  document.getElementById("ptitle").textContent = p.title;
  const body = document.getElementById("ptext");
  body.setAttribute("dir", dir);
  body.innerHTML = renderText(rawText());
  bindAll();
}

function bindAll() {
  bindSeg("#seg-problem", "problem", (v) => (state.problem = v));
  bindSeg("#seg-lang", "lang", (v) => (state.lang = v));
  document.querySelectorAll("#levelbar [data-level]").forEach((b) =>
    b.addEventListener("click", () => {
      state.level = +b.dataset.level;
      persist();
      build();
    }),
  );
  document.querySelectorAll(".term").forEach((t) => {
    t.addEventListener("click", (e) => showGloss(t.dataset.term, e));
    t.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showGloss(t.dataset.term, e);
      }
    });
  });
}
function bindSeg(sel, field, set) {
  document.querySelectorAll(`${sel} [data-${field}]`).forEach((b) =>
    b.addEventListener("click", () => {
      set(b.dataset[field]);
      persist();
      build();
    }),
  );
}

// ---- glossary popover ----
function showGloss(key, evt) {
  const g = GLOSSARY[key];
  if (!g) return;
  const box = document.getElementById("gloss");
  box.innerHTML = `<div class="gi">${esc(g.icon)}</div><div class="gt">${esc(g.term)}</div>
    <div class="gd">${esc(g.def)}</div><button id="gloss-close">Got it</button>`;
  box.classList.add("show");
  const r = (evt.target.getBoundingClientRect &&
    evt.target.getBoundingClientRect()) || { left: 40, bottom: 80 };
  box.style.left = Math.min(r.left, window.innerWidth - 320) + "px";
  box.style.top = Math.min(r.bottom + 8, window.innerHeight - 160) + "px";
  document
    .getElementById("gloss-close")
    .addEventListener("click", () => box.classList.remove("show"));
}
document.addEventListener("click", (e) => {
  const box = document.getElementById("gloss");
  if (
    box.classList.contains("show") &&
    !box.contains(e.target) &&
    !e.target.classList.contains("term")
  )
    box.classList.remove("show");
});

// ---- on-device TTS ----
let speaking = false;
function speak() {
  if (!("speechSynthesis" in window)) {
    alert("Read-aloud isn't supported in this browser.");
    return;
  }
  const synth = window.speechSynthesis;
  if (speaking) {
    synth.cancel();
    speaking = false;
    updateSpeakBtn();
    return;
  }
  const u = new SpeechSynthesisUtterance(plainText(rawText()));
  u.lang = langVoice[state.lang] || "en-US";
  u.rate = parseFloat(document.getElementById("rate").value) || 0.85;
  u.onend = () => {
    speaking = false;
    updateSpeakBtn();
  };
  speaking = true;
  updateSpeakBtn();
  synth.cancel();
  synth.speak(u);
}
function updateSpeakBtn() {
  document.getElementById("speak").textContent = speaking
    ? "⏹ Stop"
    : "🔊 Read aloud";
}

document.addEventListener("DOMContentLoaded", () => {
  build();
  document.getElementById("speak").addEventListener("click", speak);
});
