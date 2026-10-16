/**
 * Balance Builder: wires the puzzle rules (session.js) to the page, the shared game
 * runtime (GameStudio toolbar, NeftScore, NTSignal) and the shared save/resume engine.
 * Untimed and self-paced by design: nothing here reads a clock.
 */
import { eqText, equation, isolated, spoken } from "./balance-model.js";
import { mountEditor } from "./editor.js";
import { loadLabels } from "./labels.js";
import { generate, LEVELS } from "./puzzles.js";
import * as R from "./rational.js";
import {
  chooseMove,
  nextHint,
  proveIt,
  reset,
  restore,
  serialize,
  startSession,
  submitEntry,
  submitGraph,
  testValue,
  undo,
} from "./session.js";
import { decodePuzzle, encodePuzzle } from "./share-code.js";
import { STRINGS, t } from "./strings.js";
import { buildStatic, MASTERY, panName, render } from "./view.js";

const $ = (id) => document.getElementById(id);
const STANDARD = { 1: "6.AT.8", 4: "6.AT.9" };
const GAME_ID = "algebra-balance-scale";

function storedLang() {
  try {
    return localStorage.getItem("nt-lang") === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}
const safeStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
};

const app = {
  lang: storedLang(),
  tab: "play",
  progress: Object.fromEntries(LEVELS.map(({ id }) => [id, { index: 0, solved: 0 }])),
  source: { kind: "level", level: 1, index: 0 },
  session: null,
  credited: false,
  lean: null,
  preview: null,
  labels: {},
  feedback: { coach: "", kind: "", tag: null, hint: "" },
};
let refs;
let editor;
let focusAfter = null;

// ── helpers ────────────────────────────────────────────────────────────────
const say = (text) => {
  const live = $("bb-live");
  live.textContent = "";
  setTimeout(() => {
    live.textContent = text;
  }, 30);
};
const tracked = () => app.source.kind === "level" && app.source.level in STANDARD;
const setFeedback = (coach, kind = "", tag = null, hint = "") => {
  app.feedback = { coach, kind, tag, hint };
};

function judged(correct, tag) {
  if (tracked()) window.NeftScore?.attempt(correct);
  const standard = STANDARD[app.source.level];
  window.NTSignal?.record({ standard, correct, misconceptionTag: tag || undefined });
}

function paint() {
  render(app, refs);
  if (focusAfter) {
    const target = $(focusAfter);
    focusAfter = null;
    target?.focus();
  }
}

function registerStudio() {
  window.GameStudio?.register({
    title: t(app.lang, "studioTitle"),
    instructions: STRINGS[app.lang].studioHelp,
  });
}

function loadPuzzle(source, saved = null) {
  const spec = source.kind === "level" ? generate(source.level, source.index) : source.spec;
  app.source = source;
  app.session = saved ? restore(spec, saved) : startSession(spec);
  app.credited = false;
  app.lean = null;
  app.preview = null;
  setFeedback("");
  for (const id of ["bb-amount", "bb-left", "bb-right", "bb-prove-l", "bb-prove-r", "bb-test-n"])
    $(id).value = "";
  for (const r of [...refs.circles, ...refs.dirs, ...refs.rels]) r.input.checked = false;
}

function openLevelPuzzle(level) {
  app.tab = "play";
  loadPuzzle({ kind: "level", level, index: app.progress[level].index });
  say(
    t(app.lang, "liveLevel", {
      level: t(app.lang, `level${level}`),
      n: app.progress[level].index + 1,
      eq: spoken(eqText(app.session.eq, app.session.v)),
    }),
  );
  focusAfter = "bb-amount";
  paint();
}

/** A level button: keeps the puzzle in progress if the student is already on that level. */
function startLevel(level) {
  const here = app.tab === "play" && app.source.kind === "level" && app.source.level === level;
  if (!here) return openLevelPuzzle(level);
  focusAfter = "bb-amount";
  paint();
}

function playCustom(spec, code, author) {
  app.tab = "play";
  loadPuzzle({ kind: "custom", level: 0, spec, code, author });
  say(t(app.lang, "customPuzzle"));
  focusAfter = "bb-amount";
  paint();
}

// ── a turn ─────────────────────────────────────────────────────────────────
const MOVE_ERRORS = {
  amount: "needAmount",
  zero: "noZeroAmount",
  variableScale: "noVariableScale",
  tooBig: "tooBig",
};

function onMove(event) {
  event.preventDefault();
  const op = refs.ops.find((r) => r.input.checked)?.op;
  const text = $("bb-amount").value.trim();
  const out = chooseMove(app.session, op, text);
  app.lean = null;
  app.preview = null;
  if (out.kind === "error") {
    const negative = text.startsWith("-") || text.startsWith("−");
    const key = negative ? "needPositive" : MOVE_ERRORS[out.code] || "needAmount";
    setFeedback(t(app.lang, key), "problem");
    focusAfter = "bb-amount";
    return paint();
  }
  if (out.classify !== "ok") {
    const coach = out.classify === "sameOp" ? "coach.sameOp" : "coach.wrongFamily";
    setFeedback(
      `${t(app.lang, "legalNote")} ${t(app.lang, coach, { v: app.session.v })}`,
      "problem",
      out.tag,
    );
    window.NTSignal?.record({
      standard: STANDARD[app.source.level],
      correct: false,
      misconceptionTag: out.tag,
    });
  } else setFeedback("");
  say(t(app.lang, "liveMove", { move: app.session.pending.text }));
  focusAfter = "bb-left";
  paint();
}

const sideName = (lang, side) => t(lang, side === "left" ? "left" : "right");

function wrongEntryText(lang, result, v) {
  const parts = [t(lang, `coach.${result.coach}`, { v })];
  if (result.relWrong) return parts.join(" ");
  for (const side of ["left", "right"]) {
    const key = result.sides[side] === "ok" ? "sideOk" : "sideOff";
    parts.push(t(lang, key, { side: sideName(lang, side) }));
  }
  if (result.tilt) parts.push(t(lang, "notBalanced", { pan: panName(lang, result.tilt) }));
  return parts.join(" ");
}

function onEntry(event) {
  event.preventDefault();
  const s = app.session;
  const typed = {
    left: $("bb-left").value,
    right: $("bb-right").value,
    rel: refs.rels.find((r) => r.input.checked)?.input.value,
  };
  const out = submitEntry(s, typed);
  app.lean = null;
  app.preview = null;
  if (out.kind === "format") {
    const side = sideName(app.lang, out.side);
    const text = t(app.lang, out.reason, { side, v: s.v });
    setFeedback(text, "problem");
    focusAfter = out.side === "right" ? "bb-right" : "bb-left";
    return paint();
  }
  if (out.kind === "wrong") {
    judged(false, out.tag);
    if (out.result.tilt) {
      app.lean = out.result.tilt;
      app.preview = { eq: equation(out.result.typed.l, out.result.typed.r, s.eq.rel) };
    }
    setFeedback(wrongEntryText(app.lang, out.result, s.v), "problem", out.tag);
    focusAfter =
      out.result.sides.left === "ok" && out.result.sides.right !== "ok" ? "bb-right" : "bb-left";
    return paint();
  }
  judged(true);
  $("bb-left").value = "";
  $("bb-right").value = "";
  for (const r of refs.rels) r.input.checked = false;
  say(t(app.lang, "liveStep", { eq: spoken(eqText(s.eq, s.v)) }));
  setFeedback("");
  if (out.solved) onSolved();
  focusAfter = s.status === "playing" ? "bb-amount" : solvedFocus();
  paint();
}

function solvedFocus() {
  if (app.session.status === "isolated") return "bb-graph-check";
  if (app.source.kind === "level") return "bb-next";
  return app.source.author ? "bb-save" : "bb-prove-l";
}

function onSolved() {
  if (app.credited) return;
  app.credited = true;
  const { source } = app;
  const message = t(app.lang, "solvedShort");
  window.GameStudio?.emit("feedback", { correct: true, message });
  if (source.kind !== "level") return;
  const entry = app.progress[source.level];
  entry.solved += 1;
  if (entry.solved === MASTERY) {
    window.GameStudio?.emit("complete", { correct: MASTERY, total: MASTERY });
    if (tracked()) window.NeftScore?.finish();
  }
}

function onGraph(event) {
  event.preventDefault();
  const open = refs.circles.find((r) => r.input.checked)?.input.value;
  const dir = refs.dirs.find((r) => r.input.checked)?.input.value;
  if (!open || !dir) {
    setFeedback(t(app.lang, "needGraphChoice"), "problem");
    return paint();
  }
  const out = submitGraph(app.session, { open: open === "open", dir });
  if (out.kind === "correct") {
    judged(true);
    setFeedback("");
    onSolved();
    focusAfter = solvedFocus();
  } else {
    judged(false, out.tag);
    setFeedback(t(app.lang, out.coach), "problem", out.tag);
  }
  paint();
}

function onProve(event) {
  event.preventDefault();
  const s = app.session;
  const out = proveIt(s, $("bb-prove-l").value, $("bb-prove-r").value);
  const value = R.fmt(isolated(s.eq).value);
  if (out.kind === "format") setFeedback(t(app.lang, "needNumber"), "problem");
  else if (out.kind === "correct") setFeedback(t(app.lang, "proveGood", { v: s.v, value }));
  else setFeedback(t(app.lang, "proveBad", { v: s.v }), "problem");
  paint();
}

function onTest(event) {
  event.preventDefault();
  const out = testValue(app.session, $("bb-test-n").value);
  if (out.kind === "error") {
    setFeedback(t(app.lang, "needNumber"), "problem");
    return paint();
  }
  app.lean = out.tilt;
  app.preview = null;
  const truth = t(app.lang, out.truth ? "truthTrue" : "truthFalse");
  const key = out.tilt === 0 ? "testLevel" : "testLeans";
  setFeedback(
    t(app.lang, key, { v: app.session.v, n: out.n, pan: panName(app.lang, out.tilt), truth }),
  );
  paint();
}

function onHint() {
  const out = nextHint(app.session);
  const text = out.locked ? t(app.lang, "hintLocked") : t(app.lang, out.key, out.vars);
  app.feedback = { ...app.feedback, hint: text };
  paint();
}

function onBackOrReset(action) {
  const s = app.session;
  const changed = action === "undo" ? undo(s) : (reset(s), true);
  if (!changed) return;
  app.lean = null;
  app.preview = null;
  setFeedback("");
  say(t(app.lang, action === "undo" ? "liveUndo" : "liveReset", { eq: spoken(eqText(s.eq, s.v)) }));
  focusAfter = "bb-amount";
  paint();
}

function onNext() {
  const { level } = app.source;
  app.progress[level].index += 1;
  openLevelPuzzle(level);
}

function onSave() {
  const code = encodePuzzle(app.session.spec);
  app.tab = "build";
  editor.saved(code);
  focusAfter = "ed-new";
  paint();
}

function toggleLanguage() {
  app.lang = app.lang === "es" ? "en" : "es";
  try {
    localStorage.setItem("nt-lang", app.lang);
  } catch {}
  document.dispatchEvent(new CustomEvent("ewl:lang", { detail: { lang: app.lang } }));
}

// ── save / resume (shared runtime) ─────────────────────────────────────────
function snapshot() {
  const { source } = app;
  return {
    bb: 1,
    tab: app.tab,
    progress: app.progress,
    source:
      source.kind === "level"
        ? source
        : { kind: "custom", code: source.code, author: !!source.author },
    saved: serialize(app.session),
    credited: app.credited,
  };
}

const clampInt = (n, lo, hi) => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo);

function restoreFrom(data) {
  if (!data || data.bb !== 1) return;
  for (const { id } of LEVELS) {
    const p = data.progress?.[id];
    app.progress[id] = {
      index: clampInt(p?.index, 0, 9999),
      solved: clampInt(p?.solved, 0, MASTERY),
    };
  }
  const src = data.source;
  if (src?.kind === "custom") {
    const decoded = decodePuzzle(String(src.code));
    if (decoded.ok)
      loadPuzzle(
        {
          kind: "custom",
          level: 0,
          spec: decoded.spec,
          code: encodePuzzle(decoded.spec),
          author: src.author === true,
        },
        data.saved,
      );
  } else {
    const level = LEVELS.some((l) => l.id === src?.level) ? src.level : 1;
    loadPuzzle({ kind: "level", level, index: clampInt(src?.index, 0, 9999) }, data.saved);
  }
  app.credited = data.credited === true;
  app.tab = data.tab === "build" ? "build" : "play";
  paint();
}

function wireSaveResume(attempt = 1) {
  const sr = window.NeftSaveResume;
  if (!sr?.registerStateProvider) {
    // Both scripts are deferred; the engine may load after this module.
    if (attempt <= 10) setTimeout(() => wireSaveResume(attempt + 1), 120 * attempt);
    return;
  }
  sr.registerStateProvider(snapshot);
  sr.registerStateRestorer((data) => restoreFrom(data));
}

// ── start ──────────────────────────────────────────────────────────────────
function bind() {
  $("bb-move").addEventListener("submit", onMove);
  $("bb-entry").addEventListener("submit", onEntry);
  $("bb-graph").addEventListener("submit", onGraph);
  $("bb-prove").addEventListener("submit", onProve);
  $("bb-test").addEventListener("submit", onTest);
  $("bb-hint").addEventListener("click", onHint);
  $("bb-undo").addEventListener("click", () => onBackOrReset("undo"));
  $("bb-reset").addEventListener("click", () => onBackOrReset("reset"));
  $("bb-next").addEventListener("click", onNext);
  $("bb-save").addEventListener("click", onSave);
  $("bb-lang").addEventListener("click", toggleLanguage);
  for (const { level, b } of refs.levels) b.addEventListener("click", () => startLevel(level.id));
  refs.buildTab.addEventListener("click", () => {
    app.tab = "build";
    editor.refresh();
    focusAfter = "bb-build-h";
    paint();
  });
  for (const r of [...refs.circles, ...refs.dirs]) r.input.addEventListener("change", paint);
  document.addEventListener("ewl:lang", () => {
    app.lang = storedLang();
    editor.refresh();
    registerStudio();
    paint();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "nt-lang") document.dispatchEvent(new CustomEvent("ewl:lang"));
  });
}

function boot() {
  refs = buildStatic();
  editor = mountEditor($("bb-build"), {
    lang: () => app.lang,
    storage: safeStorage(),
    onSolveOwn: (spec) => playCustom(spec, encodePuzzle(spec), true),
    onPlay: (spec, code) => playCustom(spec, code, false),
    say,
  });
  window.NeftScore?.init({ gameId: GAME_ID, standard: "6.AT.8", level: 1 });
  loadPuzzle({ kind: "level", level: 1, index: 0 });
  bind();
  paint();
  loadLabels().then((labels) => {
    app.labels = labels;
    paint();
  });
  wireSaveResume();
  if (window.GameStudio) registerStudio();
  else document.addEventListener("game:studio-ready", registerStudio, { once: true });
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
