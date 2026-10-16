/**
 * Draws the Balance Builder from its state. Static pieces (buttons, radio groups) are
 * built once so focus is never lost; render() only updates text, visibility and the
 * two drawings.
 */
import { eqText, isolated, moveText, spoken, unsimplified } from "./balance-model.js";
import { chipLabel } from "./labels.js";
import { LEVELS } from "./puzzles.js";
import * as R from "./rational.js";
import { equationHtml, numberLineSvg, scaleSvg } from "./scale-view.js";
import { OP_KEYS, t } from "./strings.js";

export const MASTERY = 5;
const MINUS = "−";
const OPS = ["+", MINUS, "×", "÷"];
const INEQ = ["<", ">", "≤", "≥"];

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
};

function radio(name, value, label, checked = false) {
  const input = el("input", { type: "radio", name, value, checked });
  input.setAttribute("data-nsr-ignore", "");
  const text = el("span");
  const wrap = el("label", { className: "bb-op" }, input, text);
  return { wrap, input, text, label };
}

/** Builds the pieces that never change shape; returns the handles render() needs. */
export function buildStatic() {
  const refs = { levels: [], ops: [], rels: [], circles: [], dirs: [] };
  const group = $("bb-levels");
  for (const level of LEVELS) {
    const b = el("button", { type: "button", className: "bb-btn bb-level" });
    b.dataset.level = String(level.id);
    refs.levels.push({ level, b });
    group.append(b);
  }
  refs.buildTab = el("button", { type: "button", className: "bb-btn bb-level" });
  group.append(refs.buildTab);
  for (const op of OPS) {
    const r = radio("bb-op", op, op, op === MINUS);
    r.text.append(el("b", { textContent: op, ariaHidden: "true" }), el("span"));
    r.op = op;
    refs.ops.push(r);
    $("bb-ops").append(r.wrap);
  }
  for (const rel of INEQ) {
    const r = radio("bb-rel", rel, rel);
    r.text.textContent = rel;
    r.wrap.setAttribute("lang", "en");
    refs.rels.push(r);
    $("bb-rel-options").append(r.wrap);
  }
  for (const [name, list, host] of [
    [
      "bb-circle",
      [
        ["open", "circleOpen"],
        ["closed", "circleClosed"],
      ],
      "bb-circle",
    ],
    [
      "bb-dir",
      [
        ["left", "dirLeft"],
        ["right", "dirRight"],
      ],
      "bb-dir",
    ],
  ]) {
    for (const [value, key] of list) {
      const r = radio(name, value, key);
      refs[name === "bb-circle" ? "circles" : "dirs"].push(r);
      $(host).append(r.wrap);
    }
  }
  return refs;
}

const panName = (lang, lean) => t(lang, lean > 0 ? "left" : "right");
const tierLabel = (lang, tier) => t(lang, `tier${tier[0].toUpperCase()}${tier.slice(1)}`);

/** Which way the scale leans for the current picture. */
export function leanOf(app) {
  if (app.lean !== null) return app.lean;
  const rel = app.session.eq.rel;
  if (rel === "=") return 0;
  return rel === ">" || rel === "≥" ? 1 : -1;
}

function renderLevels(app, refs) {
  const { lang } = app;
  for (const { level, b } of refs.levels) {
    b.replaceChildren(
      el("span", {}, t(lang, `level${level.id}`)),
      ...(level.stretch
        ? [el("span", { className: "bb-badge", textContent: t(lang, "stretch") })]
        : []),
      el("small", { textContent: t(lang, `level${level.id}Desc`) }),
    );
    b.setAttribute(
      "aria-pressed",
      String(app.tab === "play" && app.source.level === level.id && app.source.kind === "level"),
    );
  }
  refs.buildTab.replaceChildren(el("span", {}, t(lang, "build")));
  refs.buildTab.setAttribute("aria-pressed", String(app.tab === "build"));
}

function renderScale(app) {
  const { session: s, lang } = app;
  const lean = leanOf(app);
  const text = eqText(s.eq, s.v);
  $("bb-scale").innerHTML = scaleSvg(app.preview?.eq ?? s.eq, s.v, lean);
  $("bb-scale").setAttribute(
    "aria-label",
    lean === 0
      ? t(lang, "scaleLabelBalanced", { eq: spoken(text) })
      : t(lang, "scaleLabelTilt", { eq: spoken(text), pan: panName(lang, lean) }),
  );
  $("bb-eq").innerHTML = equationHtml(s.eq, s.v);
  $("bb-eq").setAttribute("aria-label", spoken(text));
  $("bb-eq").setAttribute("role", "img");
  document.body.classList.toggle("bb-solved", s.status === "solved");
}

function renderHistory(app) {
  const { session: s, lang } = app;
  const list = $("bb-history");
  list.replaceChildren();
  if (!s.steps.length)
    list.append(el("li", { className: "bb-none", textContent: t(lang, "historyEmpty") }));
  for (const step of s.steps) {
    list.append(
      el("li", {
        textContent: `${t(lang, "onBothSides", { move: step.text })}: ${eqText(step.eq, s.v)}`,
      }),
    );
  }
}

function renderMoveForm(app, refs) {
  const { session: s, lang } = app;
  $("bb-move-h").textContent = t(lang, "chooseHeading");
  $("bb-amount-l").textContent = t(lang, "amount");
  $("bb-amount-help").textContent = t(lang, "amountHelp");
  $("bb-apply").textContent = t(lang, "apply");
  for (const r of refs.ops) {
    r.text.lastChild.textContent = t(lang, OP_KEYS[r.op]);
    r.wrap.title = t(lang, OP_KEYS[r.op]);
  }
  $("bb-move").hidden = !(s.status === "playing" && !s.pending);
}

function renderEntryForm(app, refs) {
  const { session: s, lang } = app;
  const show = s.status === "playing" && s.pending;
  $("bb-entry").hidden = !show;
  $("bb-entry-h").textContent = t(lang, "simplifyHeading");
  $("bb-entry-help").textContent = t(lang, "simplifyHelp");
  $("bb-left-l").textContent = t(lang, "leftSide");
  $("bb-right-l").textContent = t(lang, "rightSide");
  $("bb-check").textContent = t(lang, "check");
  $("bb-rel-l").textContent = t(lang, "symbol");
  $("bb-rel").hidden = s.spec.rel === "=";
  for (const r of refs.rels) r.input.setAttribute("aria-label", spoken(r.input.value));
  if (show) {
    const move = s.pending.move;
    $("bb-working").textContent =
      `${t(lang, "leftSide")}: ${unsimplified(s.eq.l, move, s.v)}  |  ${t(lang, "rightSide")}: ${unsimplified(s.eq.r, move, s.v)}`;
    $("bb-entry-h").textContent =
      `${t(lang, "simplifyHeading")} (${t(lang, "onBothSides", { move: moveText(move, s.v) })})`;
  }
}

function renderSolved(app, refs) {
  const { session: s, lang, source } = app;
  const done = s.status === "solved" || s.status === "isolated";
  $("bb-solved").hidden = !done;
  if (!done) return;
  const iso = isolated(s.eq);
  const tilt = s.spec.rel !== "=";
  const value = iso ? R.fmt(iso.value) : "";
  const graphing = s.status === "isolated";
  $("bb-solved-msg").textContent = graphing
    ? t(lang, "solvedTilt")
    : tilt
      ? `${t(lang, "solved", { v: s.v, rel: s.spec.rel, value })} ${t(lang, "graphGood")}`
      : t(lang, "solved", { v: s.v, rel: "=", value });
  $("bb-graph").hidden = !tilt;
  $("bb-prove").hidden = tilt;
  $("bb-graph-h").textContent = t(lang, "graphHeading");
  $("bb-circle-l").textContent = t(lang, "graphCircle");
  $("bb-dir-l").textContent = t(lang, "graphDirection");
  $("bb-graph-check").textContent = t(lang, "graphCheck");
  $("bb-graph-check").hidden = !graphing;
  for (const r of [...refs.circles, ...refs.dirs]) {
    r.text.textContent = t(lang, r.label);
    r.input.disabled = !graphing;
  }
  if (tilt && iso) {
    const open = refs.circles.find((r) => r.input.checked)?.input.value;
    const dir = refs.dirs.find((r) => r.input.checked)?.input.value;
    $("bb-numline").innerHTML = numberLineSvg(
      iso.value.n,
      open && dir ? { open: open === "open", dir } : null,
      s.v,
    );
  }
  $("bb-prove-h").textContent = t(lang, "proveHeading");
  $("bb-prove-help").textContent = t(lang, "proveHelp", { v: s.v, value });
  $("bb-prove-ll").textContent = t(lang, "proveLeft");
  $("bb-prove-rl").textContent = t(lang, "proveRight");
  $("bb-prove-check").textContent = t(lang, "proveCheck");
  $("bb-next").textContent = t(lang, "nextPuzzle");
  $("bb-next").hidden = source.kind !== "level" || s.status !== "solved";
  $("bb-save").textContent = t(lang, "savePuzzle");
  $("bb-save").hidden = !(source.author && s.status === "solved");
}

function renderFeedback(app) {
  const { feedback: f, labels, lang } = app;
  const label = f.tag ? chipLabel(labels, f.tag, lang) : null;
  $("bb-chip").hidden = !label;
  $("bb-chip").textContent = label ?? "";
  if (label) $("bb-chip").setAttribute("lang", lang);
  $("bb-coach").textContent = f.coach;
  $("bb-coach").dataset.kind = f.kind;
  $("bb-hint-text").textContent = f.hint;
}

export function render(app, refs) {
  const { session: s, lang } = app;
  document.documentElement.lang = lang;
  $("bb-skip").textContent = t(lang, "skip");
  $("bb-title").textContent = t(lang, "title");
  $("bb-tagline").textContent = t(lang, "tagline");
  $("bb-lang").textContent = t(lang, "langButton");
  $("bb-lang").lang = lang === "es" ? "en" : "es";
  $("bb-levels").setAttribute("aria-label", t(lang, "levelsLabel"));
  renderLevels(app, refs);
  $("bb-play").hidden = app.tab !== "play";
  $("bb-build").hidden = app.tab !== "build";
  if (app.tab !== "play") return;
  const { source } = app;
  $("bb-puzzle-title").textContent =
    source.kind === "level"
      ? `${t(lang, `level${source.level}`)} · ${t(lang, "puzzleOf", { n: source.index + 1 })}`
      : t(lang, "customPuzzle");
  $("bb-rating").textContent = t(lang, "rating", { tier: tierLabel(lang, s.rating.tier) });
  const solvedCount = Math.min(MASTERY, app.progress[source.level]?.solved ?? 0);
  $("bb-progress").textContent =
    source.kind === "level" ? t(lang, "progress", { n: solvedCount }) : "";
  $("bb-history-title").textContent = t(lang, "history");
  renderScale(app);
  renderHistory(app);
  renderMoveForm(app, refs);
  renderEntryForm(app, refs);
  renderSolved(app, refs);
  const tilt = s.spec.rel !== "=";
  $("bb-test").hidden = !tilt;
  if (tilt) {
    $("bb-test-h").textContent = t(lang, "testHeading", { v: s.v });
    $("bb-test-help").textContent = t(lang, "testHelp", { v: s.v });
    $("bb-test-nl").textContent = t(lang, "testHeading", { v: s.v });
    $("bb-test-go").textContent = t(lang, "testButton");
  }
  $("bb-hint").textContent = t(lang, "hint");
  $("bb-undo").textContent = t(lang, "undo");
  $("bb-reset").textContent = t(lang, "startOver");
  $("bb-undo").disabled = !s.pending && s.steps.length === 0;
  $("bb-reset").disabled = !s.pending && s.steps.length === 0;
  $("bb-hint").disabled = s.status === "solved";
  renderFeedback(app);
}

export { panName };
