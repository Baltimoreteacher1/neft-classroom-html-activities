// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/*!
 * level3/workspace.js — wires the Level 3 workspace page to the adaptive engine.
 *
 * Isolation contract: this file is loaded ONLY by /small-group-level-3/. It
 * never touches lesson pages, the lesson renderer, save/resume keys used by
 * lessons, or the service worker. A student arrives with ?lesson=<id>, works,
 * and leaves through "Back to the lesson".
 *
 * Privacy: identity is read from the EXISTING `nt_student` alias — this file
 * never asks for a name, never writes one, and never invents authentication.
 * Session evidence is kept in localStorage under a single per-lesson key so a
 * refresh resumes safely; it is instructional evidence only (item ids, correct/
 * incorrect, supports) and holds no free text the student typed.
 */
import { checkAnswer } from "./checker.js";
import {
  adapt,
  applyDecision,
  createSession,
  effectiveSupports,
  hintAt,
  MAX_HINT,
  markVerified,
  observe,
  overrideSupport,
  pinSupport,
  teacherSummary,
  verify,
} from "./engine.js";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const lessonId = (params.get("lesson") || "").trim();

const PREFS_KEY = "nt_level3_prefs"; // accessibility + language, shared across lessons
const sessionKey = (id) => `nt_level3_session_${id}`;

let CONFIG = null;
let state = null;
let current = null; // the item on screen
let decision = null;
let hintRung = 0;
let usedHintOnItem = 0;

/* ── storage helpers (never throw: private mode / full quota must not break) ── */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — the session still works, it just won't resume */
  }
}

function studentRef() {
  // Reuse the existing identity. `nt_student` stores an ALIAS, not a real name.
  const nt = readJSON("nt_student", null);
  if (nt && nt.alias) return String(nt.alias);
  return null;
}

/* ── preferences (accessibility + language persist across sessions) ────────── */
const prefs = Object.assign(
  { scale: "1", contrast: false, language: "en", readAloud: false },
  readJSON(PREFS_KEY, {}),
);

function applyPrefs() {
  document.documentElement.style.setProperty("--l3-scale", prefs.scale);
  document.body.classList.toggle("l3-contrast", !!prefs.contrast);
  $("l3-text-size").value = prefs.scale;
  $("l3-lang").value = prefs.language;
  const c = $("l3-contrast");
  c.setAttribute("aria-pressed", prefs.contrast ? "true" : "false");
  writeJSON(PREFS_KEY, prefs);
}

/* ── speech (read aloud) ───────────────────────────────────────────────────── */
function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = prefs.language === "es" ? "es-US" : "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

/* ── a tiny, honest visual for each representation ─────────────────────────── */
function renderModel(repId) {
  const host = $("l3-model");
  host.innerHTML = "";
  if (!repId) return;
  const rep = (CONFIG.representations || []).find((r) => r.id === repId);
  if (!rep) return;
  const label = document.createElement("p");
  label.innerHTML = `<strong>Model:</strong> ${rep.label}`;
  host.append(label);

  if (repId === "ratio-table") {
    const t = document.createElement("table");
    t.className = "l3-table";
    t.setAttribute("aria-label", "Blank ratio table you can use for scratch work");
    t.innerHTML =
      "<caption class='l3-evidence'>Use this to line the two quantities up.</caption>" +
      "<tr><th scope='col'>Quantity A</th><th scope='col'>Quantity B</th></tr>" +
      "<tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr>";
    host.append(t);
  } else if (repId === "double-number-line" || repId === "tape-diagram" || repId === "unit-rate") {
    const p = document.createElement("p");
    p.className = "l3-evidence";
    p.textContent = rep.why;
    host.append(p);
  }
}

/* ── rendering one task ────────────────────────────────────────────────────── */
function renderDecision(d) {
  decision = d;
  current = d.item;
  hintRung = 0;
  usedHintOnItem = 0;
  const supports = effectiveSupports(state);

  $("l3-feedback").classList.add("l3-hidden");
  $("l3-hintbox").classList.add("l3-hidden");
  $("l3-why-box").classList.add("l3-hidden");
  $("l3-answer").value = "";

  if (!current) {
    $("l3-prompt").textContent =
      "That's the whole set for today — nice work. Use “Back to the lesson” when you're ready.";
    $("l3-answer").disabled = true;
    $("l3-check").disabled = true;
    $("l3-hint").disabled = true;
    renderTeacher();
    return;
  }

  $("l3-answer").disabled = false;
  $("l3-check").disabled = false;
  $("l3-hint").disabled = false;
  $("l3-prompt").textContent = current.prompt;

  renderModel(supports.representation || current.representation);

  // Sentence frame (TWR) — shown when language support is on.
  const frameBox = $("l3-frame");
  const frame = current.frames ? current.frames[prefs.language] || current.frames.en : null;
  if (frame && (supports.sentenceFrame || prefs.language === "es")) {
    frameBox.textContent = frame;
    frameBox.classList.remove("l3-hidden");
  } else {
    frameBox.classList.add("l3-hidden");
  }

  // Vocabulary chips
  const vocabBox = $("l3-vocab");
  vocabBox.innerHTML = "";
  if (supports.vocabSupport && current.vocab && current.vocab.length) {
    for (const term of current.vocab) {
      const chip = document.createElement("span");
      chip.className = "l3-chip";
      chip.textContent = term;
      vocabBox.append(chip);
    }
    vocabBox.classList.remove("l3-hidden");
  } else {
    vocabBox.classList.add("l3-hidden");
  }

  if (supports.readAloud || prefs.readAloud) speak(current.prompt);
  $("l3-task").focus();
  renderTeacher();
  persist();
}

function advance() {
  const d = adapt(state, CONFIG);
  state = applyDecision(state, d);
  renderDecision(d);
}

/* ── checking ──────────────────────────────────────────────────────────────── */
async function onCheck() {
  if (!current) return;
  const raw = $("l3-answer").value;
  const box = $("l3-feedback");

  // Explanation items are not graded — they are observed for language access.
  if (current.kind === "explanation") {
    state = observe(state, {
      itemId: current.id,
      kind: "explanation",
      explanationLength: raw.trim().split(/\s+/).filter(Boolean).length,
    });
    state = observe(state, { itemId: current.id, kind: "attempt", correct: true, hintRung });
    box.textContent = "Thanks — that tells me how you're thinking about it.";
    box.classList.remove("l3-hidden");
    setTimeout(advance, 900);
    return;
  }

  const result = await checkAnswer(current, raw);
  state = observe(state, {
    itemId: current.id,
    kind: "attempt",
    correct: result.correct,
    misconception: result.misconception,
    representation: effectiveSupports(state).representation,
    hintRung: usedHintOnItem,
    transfer: (CONFIG.transfer || []).some((i) => i.id === current.id),
    prerequisite: current.prerequisite || null,
  });

  if (result.correct) {
    box.textContent = "That works. Here's the next one.";
    box.classList.remove("l3-hidden");
    // Did this success close out a misconception in a new context?
    for (const tag of current.targets || []) {
      if (verify(state, CONFIG, tag)) state = markVerified(state, tag);
    }
    setTimeout(advance, 800);
  } else {
    // Never say what the answer is; move up the ladder instead.
    box.textContent = "Not yet — take another look. Tap Hint if you want a nudge, then try again.";
    box.classList.remove("l3-hidden");
    persist();
    renderTeacher();
    $("l3-answer").focus();
  }
}

function onHint() {
  if (!current) return;
  hintRung = Math.min(MAX_HINT, hintRung + 1);
  usedHintOnItem = Math.max(usedHintOnItem, hintRung);
  const text = hintAt(current, hintRung);
  const box = $("l3-hintbox");
  box.textContent = `Hint ${hintRung} of ${MAX_HINT}: ${text}`;
  box.classList.remove("l3-hidden");
  state = observe(state, { itemId: current.id, kind: "hint", hintRung });
  if (prefs.readAloud) speak(text);
  persist();
  renderTeacher();
}

/* ── student controls ──────────────────────────────────────────────────────── */
function onWhy() {
  const box = $("l3-why-box");
  const supports = effectiveSupports(state);
  // Describe the model actually on screen: the runtime may not have pinned a
  // representation, in which case the item's own model is what the student sees.
  const repId = supports.representation || (current && current.representation);
  const rep = (CONFIG.representations || []).find((r) => r.id === repId);
  const bits = [decision && decision.reason ? decision.reason : "You're on the lesson's task."];
  if (rep) bits.push(`You are seeing a ${rep.label.toLowerCase()} because ${rep.why}`);
  bits.push("You can change the model or bring a support back at any time.");
  box.textContent = bits.join(" ");
  box.classList.remove("l3-hidden");
  if (prefs.readAloud) speak(box.textContent);
}

function onRestore() {
  // Bring back the language scaffolds, and pin them so fading can't remove them.
  state = pinSupport(state, "sentenceFrame", true);
  state = pinSupport(state, "vocabSupport", true);
  const box = $("l3-why-box");
  box.textContent =
    "Brought back the sentence frame and the word list, and pinned them so they stay.";
  box.classList.remove("l3-hidden");
  renderDecision({ ...decision, supports: effectiveSupports(state) });
}

/* ── teacher view ──────────────────────────────────────────────────────────── */
function teacherModeOn() {
  try {
    return localStorage.getItem("nt-teacher-mode") === "1";
  } catch {
    return false;
  }
}

function renderTeacher() {
  const panel = $("l3-teacher");
  if (!teacherModeOn()) {
    panel.classList.add("l3-hidden");
    return;
  }
  panel.classList.remove("l3-hidden");
  const sum = teacherSummary(state, CONFIG);
  $("l3-teacher-target").textContent = `${sum.learningTarget} (${sum.standard})`;
  $("l3-teacher-suggestion").textContent = sum.suggestion;
  $("l3-teacher-evidence").textContent = `${sum.evidence} · ${sum.attempts} attempt(s)`;
  $("l3-teacher-direction").textContent = sum.supportDirection;
  const rep = (CONFIG.representations || []).find((r) => r.id === sum.representation);
  $("l3-teacher-group").textContent = rep ? `working in the ${rep.label.toLowerCase()}` : "—";
}

/* ── persistence (safe refresh / resume) ───────────────────────────────────── */
function persist() {
  if (!lessonId) return;
  writeJSON(sessionKey(lessonId), {
    v: 1,
    evidence: state.evidence,
    served: state.served,
    phase: state.phase,
    supports: state.supports,
    pinned: state.pinned,
    teacherOverrides: state.teacherOverrides,
    verified: state.verified,
    consecutiveCorrect: state.consecutiveCorrect,
    bridgeReturnTo: state.bridgeReturnTo,
  });
}

function restore() {
  const saved = readJSON(sessionKey(lessonId), null);
  if (!saved || saved.v !== 1) return false;
  state = Object.assign(state, {
    evidence: saved.evidence || [],
    served: saved.served || [],
    phase: saved.phase || state.phase,
    supports: Object.assign({}, state.supports, saved.supports || {}),
    pinned: saved.pinned || {},
    teacherOverrides: saved.teacherOverrides || {},
    verified: saved.verified || {},
    consecutiveCorrect: saved.consecutiveCorrect || 0,
    bridgeReturnTo: saved.bridgeReturnTo || null,
  });
  return true;
}

/* ── boot ──────────────────────────────────────────────────────────────────── */
async function boot() {
  applyPrefs();

  if (!lessonId) {
    $("l3-prompt").textContent =
      "This workspace needs a lesson. Open it from a lesson's “Level 3 · Adaptive Small Group” link.";
    return;
  }
  $("l3-back").href = `/lessons/${lessonId}/`;

  let all;
  try {
    const res = await fetch("/data/level3-adaptive.json", { cache: "no-cache" });
    all = await res.json();
  } catch {
    $("l3-prompt").textContent = "Could not load this workspace. Try refreshing.";
    return;
  }
  CONFIG = all && all.lessons ? all.lessons[lessonId] : null;
  if (!CONFIG) {
    $("l3-prompt").textContent =
      "Level 3 isn't set up for this lesson yet. Use “Back to the lesson” to keep going there.";
    return;
  }

  document.title = `Level 3 · ${CONFIG.title} — Neft Teacher`;
  $("l3-learning-target").innerHTML = `<strong>Learning target:</strong> ${CONFIG.learningTarget}`;
  $("l3-standard").textContent = CONFIG.standard;

  // Representation pickers (student + teacher override) from the lesson config.
  for (const select of [$("l3-rep"), $("l3-teacher-rep")]) {
    select.innerHTML = "";
    const auto = document.createElement("option");
    auto.value = "";
    auto.textContent = "Choose for me";
    select.append(auto);
    for (const rep of CONFIG.representations || []) {
      const o = document.createElement("option");
      o.value = rep.id;
      o.textContent = rep.label;
      select.append(o);
    }
  }

  state = createSession(CONFIG, { studentRef: studentRef() });
  restore();

  // Controls
  $("l3-check").addEventListener("click", onCheck);
  $("l3-answer").addEventListener("keydown", (e) => {
    if (e.key === "Enter") onCheck();
  });
  $("l3-hint").addEventListener("click", onHint);
  $("l3-why").addEventListener("click", onWhy);
  $("l3-restore").addEventListener("click", onRestore);

  $("l3-text-size").addEventListener("change", (e) => {
    prefs.scale = e.target.value;
    applyPrefs();
    state = observe(state, { kind: "access", signal: "zoom" });
  });
  $("l3-contrast").addEventListener("click", () => {
    prefs.contrast = !prefs.contrast;
    applyPrefs();
    state = observe(state, { kind: "access", signal: "contrast" });
  });
  $("l3-readaloud").addEventListener("click", () => {
    prefs.readAloud = true;
    writeJSON(PREFS_KEY, prefs);
    state = observe(state, { itemId: current && current.id, kind: "access", signal: "read-aloud" });
    if (current) speak(current.prompt);
  });
  $("l3-lang").addEventListener("change", (e) => {
    prefs.language = e.target.value;
    applyPrefs();
    state = observe(state, { itemId: current && current.id, kind: "access", signal: "translate" });
    if (decision) renderDecision(decision);
  });
  $("l3-rep").addEventListener("change", (e) => {
    // A student swapping models is a choice, not a deficit — pin it, don't score it.
    state = pinSupport(state, "representation", e.target.value || undefined);
    if (!e.target.value) {
      const pinned = { ...state.pinned };
      delete pinned.representation;
      state = { ...state, pinned };
    }
    if (decision) renderDecision({ ...decision, supports: effectiveSupports(state) });
  });
  $("l3-teacher-rep").addEventListener("change", (e) => {
    state = overrideSupport(state, "representation", e.target.value || null);
    if (decision) renderDecision({ ...decision, supports: effectiveSupports(state) });
  });
  $("l3-teacher-clear").addEventListener("click", () => {
    state = overrideSupport(state, "representation", null);
    $("l3-teacher-rep").value = "";
    if (decision) renderDecision({ ...decision, supports: effectiveSupports(state) });
  });

  advance();
}

boot();
