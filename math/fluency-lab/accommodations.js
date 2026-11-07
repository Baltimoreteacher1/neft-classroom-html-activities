// Teacher-set accommodation profile carried in an assignment link: read each problem aloud, show each problem in
// Spanish too, fewer answer choices (2 or 3), Focus view, and a calculator. The profile applies only while the
// learner works on that assignment; it never changes the learner's own settings or how answers are judged.
// Pure helpers (codec, choice trimming, calculator arithmetic) plus one small DOM mount for the calculator.
import { t } from "./i18n.js";

export const ACCESS_FLAGS = Object.freeze(["read", "es", "focus", "calc"]);
const LETTER = { read: "r", es: "s", focus: "f", calc: "c" };

// Keeps only known, valid settings. Returns null when nothing is set, so a plain assignment gains no key.
export function cleanAccess(value) {
  if (!value || typeof value !== "object") return null;
  const out = {};
  for (const flag of ACCESS_FLAGS) if (value[flag] === true) out[flag] = true;
  if (value.mc === 2 || value.mc === 3) out.mc = value.mc;
  return Object.keys(out).length ? out : null;
}

// "arsfc3": a, then the flags in a fixed order, then the choice limit. Empty for no profile.
export function encodeAccess(value) {
  const access = cleanAccess(value);
  if (!access) return "";
  return `a${ACCESS_FLAGS.filter((flag) => access[flag])
    .map((flag) => LETTER[flag])
    .join("")}${access.mc || ""}`;
}

export function decodeAccess(part) {
  const match = /^a(r?)(s?)(f?)(c?)([23]?)$/.exec(String(part || ""));
  if (!match || part === "a") return null;
  return cleanAccess({
    read: Boolean(match[1]),
    es: Boolean(match[2]),
    focus: Boolean(match[3]),
    calc: Boolean(match[4]),
    ...(match[5] ? { mc: Number(match[5]) } : {}),
  });
}

// The profile in force: only during the assignment's own practice session.
export const activeAccess = (assignment, sessionMode) =>
  sessionMode === "assignment" ? cleanAccess(assignment?.access) : null;

// Cut a multiple-choice list to `max` options. The right choice always stays, the others are drawn with the
// session's rng, and the original order is kept so the layout does not hint at the answer. Comparison (<, =, >)
// and two-option items are left alone, as is any item whose right choice cannot be found.
export function trimChoices(choices, isRight, max, rng = Math.random) {
  if (!Array.isArray(choices) || !(max === 2 || max === 3) || choices.length <= max) return choices;
  if (choices.includes("<") && choices.includes(">")) return choices;
  const right = choices.findIndex((choice) => isRight(choice));
  if (right < 0) return choices;
  const others = choices.map((_, index) => index).filter((index) => index !== right);
  for (let i = others.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const keep = new Set([right, ...others.slice(0, max - 1)]);
  return choices.filter((_, index) => keep.has(index));
}

// Short words for the learner's banner and the teacher's assignment list.
export function accessSummary(value) {
  const access = cleanAccess(value);
  if (!access) return [];
  return [
    access.read ? t("Read aloud") : "",
    access.es ? t("Spanish shown") : "",
    access.mc ? t("{n} answer choices", { n: access.mc }) : "",
    access.focus ? t("Focus view") : "",
    access.calc ? t("Calculator") : "",
  ].filter(Boolean);
}

// ---- Calculator: + − × ÷, parentheses and decimals, evaluated by a small parser (never eval). ----
const OPS = { "+": "+", "-": "-", "−": "-", "*": "*", "×": "*", "/": "/", "÷": "/" };
export function evaluateExpression(text) {
  const tokens = String(text ?? "")
    .replace(/\s+/g, "")
    .match(/\d*\.?\d+|[()+\-−*×/÷]|./g);
  if (!tokens || tokens.length > 120) return null;
  let at = 0;
  const peek = () => tokens[at];
  const number = () => {
    const token = tokens[at];
    if (token === "(") {
      at += 1;
      const value = sum();
      if (tokens[at] !== ")") throw new Error("paren");
      at += 1;
      return value;
    }
    if (OPS[token] === "-") {
      at += 1;
      return -number();
    }
    if (!/^\d*\.?\d+$/.test(token || "")) throw new Error("number");
    at += 1;
    return Number(token);
  };
  const product = () => {
    let value = number();
    while (OPS[peek()] === "*" || OPS[peek()] === "/") {
      const op = OPS[tokens[at++]];
      const next = number();
      if (op === "/" && next === 0) throw new Error("zero");
      value = op === "*" ? value * next : value / next;
    }
    return value;
  };
  const sum = () => {
    let value = product();
    while (OPS[peek()] === "+" || OPS[peek()] === "-") {
      const op = OPS[tokens[at++]];
      const next = product();
      value = op === "+" ? value + next : value - next;
    }
    return value;
  };
  try {
    const value = sum();
    if (at !== tokens.length || !Number.isFinite(value)) return null;
    return Number(value.toPrecision(12));
  } catch {
    return null;
  }
}

const KEYS = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "(", ")", "+"];

// A calculator panel under the answer box. Returns an unmount function.
export function mountCalculator(host) {
  if (!host) return () => {};
  const box = document.createElement("details");
  box.className = "fl-access-calc";
  box.innerHTML = `<summary>${t("Calculator")}</summary>
    <p class="fl-access-calc-note">${t("Your teacher turned on a calculator for this practice.")}</p>
    <label class="fl-access-calc-screen"><span class="sr-only">${t("Calculation")}</span><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-calc-input></label>
    <output class="fl-access-calc-out" data-calc-out aria-live="polite"></output>
    <div class="fl-access-calc-keys">${KEYS.map((key) => `<button type="button" data-calc-key="${key}">${key}</button>`).join("")}<button type="button" data-calc-clear>${t("Clear")}</button><button type="button" data-calc-eq>=</button></div>`;
  const input = box.querySelector("[data-calc-input]");
  const out = box.querySelector("[data-calc-out]");
  const run = () => {
    const value = evaluateExpression(input.value);
    out.textContent = value === null ? t("Check the calculation.") : `= ${value}`;
  };
  box.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.calcKey) input.value += button.dataset.calcKey;
    else if (button.hasAttribute("data-calc-clear")) {
      input.value = "";
      out.textContent = "";
    } else if (button.hasAttribute("data-calc-eq")) run();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      run();
    }
  });
  host.append(box);
  return () => box.remove();
}
