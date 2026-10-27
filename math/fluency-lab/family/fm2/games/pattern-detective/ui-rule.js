// The "My rule" part of the Pattern Detective screen: a core builder for repeating patterns, a sentence builder for
// counting patterns, an operation builder for machines, a y = mx + b form and a typed expression with a key pad.
// Every control is a real button, select or text box, so the keyboard and touch paths are the same path.
// @fm2 FM-013 FM-038 FM-039 FM-058
import { symbolSvg } from "../../art/patterns.js";
import { escapeHtml, tx, L } from "../../lang.js";
import { UI } from "./copy.js";
import { quantity } from "./copy-prompts.js";
import { expressionFromFields } from "./logic.js";

const e = escapeHtml;
const t = (key, lang, vars) => tx(UI[key], lang, vars);
const seqStart = (round) => ({ op: round.say.op === "mul" ? "mul" : "add", start: "", step: "" });

export function initialFields(round) {
  if (round.form === "cycle") return { core: [] };
  if (round.form === "seq") return seqStart(round);
  if (round.form === "expr") return { op1: round.ops.first[0], a: "", op2: "none", b: "" };
  if (round.form === "line") return { m: "", b: round.say.lockB ? "0" : "" };
  if (round.form === "typed") return { text: "" };
  return { A: seqStart(round), B: seqStart(round) };
}

const filled = (value) => String(value ?? "").trim() !== "";
const seqDone = (f) => filled(f.start) && filled(f.step);

// Is the rule complete enough to submit, and what is it as expression text (or a list of shape ids)?
export function ruleOf(round, state) {
  const f = state.fields;
  let complete;
  if (round.form === "cycle") complete = f.core.length > 0;
  else if (round.form === "seq") complete = seqDone(f);
  else if (round.form === "expr")
    complete = state.useTyped
      ? filled(state.typed)
      : filled(f.a) && (f.op2 === "none" || filled(f.b));
  else if (round.form === "line") complete = filled(f.m) && filled(f.b);
  else if (round.form === "typed") complete = filled(f.text);
  else complete = seqDone(f.A) && seqDone(f.B);
  const rule =
    round.form === "expr" && state.useTyped ? state.typed : expressionFromFields(round, f);
  return { complete, rule };
}

// A group of toggle buttons (one pressed) in place of a drop-down: easy to hit on a phone and fully keyboard-driven.
const OP_LABEL = (op, lang) => (op === "none" ? t("noSecond", lang) : `${op} ${L(UI.opNames[lang === "es" ? "es" : "en"][op], lang)}`.trim());
const choice = (key, label, list, current, lang, locked, words = null) =>
  `<span class="pd-opgroup" role="group" aria-label="${e(label)}">${list
    .map(
      (op) =>
        `<button type="button" class="fm2-btn pd-opbtn" data-act="set" data-path="${key}" data-value="${e(op)}" data-key="${key}-${e(op)}" aria-pressed="${op === current}" ${op === "none" || words ? "" : `aria-label="${e(OP_LABEL(op, lang))}"`} ${locked ? "disabled" : ""}>${e(words ? words[op] : op === "none" ? t("noSecond", lang) : op)}</button>`,
    )
    .join("")}</span>`;
const field = (key, label, value, locked, mode = "decimal") =>
  `<input class="pd-input pd-num" type="text" inputmode="${mode}" autocomplete="off" data-key="${key}" data-path="${key}" aria-label="${e(label)}" value="${e(value)}" ${locked ? "disabled" : ""}>`;

function seqSentence(round, f, lang, locked, prefix = "", caption = "") {
  const fig = round.show === "figure";
  const lead = round.x0 === 0 ? t("atZero", lang, { v: round.vars }) : t(fig ? "fig1" : "term1", lang);
  const both = round.say.op === "both";
  const opWord = f.op === "mul" ? t("multiplies", lang) : t("adds", lang);
  const op = both
    ? choice(`${prefix}op`, t("opLabel", lang), ["add", "mul"], f.op, lang, locked, { add: t("adds", lang), mul: t("multiplies", lang) })
    : `<span class="pd-word">${e(opWord)}</span>`;
  return `<div class="pd-sentence">${caption ? `<strong class="pd-who">${e(caption)}</strong>` : ""}<span>${e(lead)}</span> ${field(`${prefix}start`, t("startLabel", lang), f.start, locked)}<span>${fig ? ` ${e(t("tilesWord", lang))}` : ""}. ${e(t(fig ? "eachNextFig" : "eachNext", lang))}</span> ${op} ${field(`${prefix}step`, t("stepLabel", lang), f.step, locked)}<span>.</span></div>`;
}

function exprBuilder(round, state, lang, locked) {
  const f = state.fields;
  const out = quantity(round, "out", lang);
  const inn = round.showVars ? round.vars : quantity(round, "in", lang);
  const second = round.ops.second
    ? `${choice("op2", t("secondOp", lang), ["none", ...round.ops.second], f.op2, lang, locked)}${f.op2 !== "none" ? field("b", t("secondNum", lang), f.b, locked) : ""}`
    : "";
  const typed =
    round.grade >= 3
      ? `<button type="button" class="fm2-btn fm2-btn-quiet" data-act="toggle-typed" data-key="toggle-typed" ${locked ? "disabled" : ""}>${e(t(state.useTyped ? "useBuilder" : "typeOwn", lang))}</button>`
      : "";
  const builder = `<div class="pd-sentence"><span>${e(out)} =</span> <span>${e(inn)}</span> ${choice("op1", t("firstOp", lang), round.ops.first, f.op1, lang, locked)} ${field("a", t("firstNum", lang), f.a, locked)} ${second}</div>`;
  return state.useTyped
    ? `${typedBox(round, state, lang, locked, "typed")}${typed}`
    : `${builder}${typed}`;
}

const KEYS = ["+", "−", "×", "÷", "^", "(", ")"];
function typedBox(round, state, lang, locked, path) {
  const v = round.vars;
  const value = path === "typed" ? state.typed : state.fields.text;
  const pad = [v, ...KEYS]
    .map(
      (k) =>
        `<button type="button" class="fm2-btn pd-key" data-act="insert" data-text="${e(k)}" data-key="key-${e(k)}" aria-label="${e(t("insert", lang, { key: k }))}" ${locked ? "disabled" : ""}>${e(k)}</button>`,
    )
    .join("");
  return `<div class="pd-typed"><label class="pd-label" for="pd-typed">${e(t("typedLabel", lang, { v }))}</label><input id="pd-typed" class="pd-input pd-wide" type="text" autocomplete="off" spellcheck="false" data-key="typed" data-path="${path === "typed" ? "typed" : "text"}" value="${e(value)}" ${locked ? "disabled" : ""}><div class="pd-keys" role="group" aria-label="${e(t("keypad", lang))}">${pad}</div></div>`;
}

function lineForm(round, state, lang, locked) {
  const f = state.fields;
  const out = round.showVars ? "y" : quantity(round, "out", lang);
  const bPart = round.say.lockB
    ? ""
    : ` <span>+</span> ${field("b", t("intercept", lang), f.b, locked)}`;
  return `<div class="pd-sentence"><span>${e(out)} =</span> ${field("m", t("slope", lang, { v: round.vars }), f.m, locked)} <span>× ${e(round.vars)}</span>${bPart}</div>`;
}

function coreBuilder(round, state, lang, locked) {
  const core = state.fields.core;
  const sym = (id) => L(UI.symbols[id], lang);
  const slots = core.length
    ? core
        .map(
          (id, i) =>
            `<li class="pd-slot">${symbolSvg(id, 36)}<span>${e(sym(id))}</span><span class="fm2-sr">${e(t("coreSlot", lang, { n: i + 1, name: sym(id) }))}</span></li>`,
        )
        .join("")
    : `<li class="pd-slot pd-slot-empty">${e(t("coreEmpty", lang))}</li>`;
  const add = round.alpha
    .map(
      (id) =>
        `<button type="button" class="fm2-btn pd-pal" data-act="core-add" data-id="${id}" data-key="core-${id}" aria-label="${e(t("coreAdd", lang, { name: sym(id) }))}" ${locked || core.length >= 4 ? "disabled" : ""}>${symbolSvg(id, 32)}<span>${e(sym(id))}</span></button>`,
    )
    .join("");
  return `<ol class="pd-core">${slots}</ol><div class="pd-palette">${add}</div><div class="pd-row"><button type="button" class="fm2-btn" data-act="core-undo" data-key="core-undo" ${locked || !core.length ? "disabled" : ""}>${e(t("undo", lang))}</button><button type="button" class="fm2-btn" data-act="core-clear" data-key="core-clear" ${locked || !core.length ? "disabled" : ""}>${e(t("clear", lang))}</button></div>`;
}

export function renderRule(round, state, lang, locked) {
  const f = state.fields;
  if (round.form === "cycle") return coreBuilder(round, state, lang, locked);
  if (round.form === "seq") return seqSentence(round, f, lang, locked);
  if (round.form === "expr") return exprBuilder(round, state, lang, locked);
  if (round.form === "line") return lineForm(round, state, lang, locked);
  if (round.form === "typed") return typedBox(round, state, lang, locked, "text");
  return `${seqSentence(round, f.A, lang, locked, "A.", t("machineA", lang))}${seqSentence(round, f.B, lang, locked, "B.", t("machineB", lang))}`;
}
