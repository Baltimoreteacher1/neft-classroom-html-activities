// symbol-pad.js — one-tap ≤ / ≥ (and < / >) buttons for answer boxes.
//
// "≤" and "≥" are not on a Chromebook keyboard. A student who knows the answer
// still cannot type it, so they type "<=" or "=<" or give up — which grades as
// a maths mistake it is not. Wherever an expected answer uses an inequality
// symbol, this puts the symbols on screen as buttons that insert at the caret.

import { mountInequalityKeyButton } from "./inequality-reference.js";

const INEQUALITY_SYMBOLS = ["<", "≤", ">", "≥"];

const LABELS = {
  "<": "less than",
  "≤": "less than or equal to",
  ">": "greater than",
  "≥": "greater than or equal to",
};

/** True if the expected answer needs a symbol no keyboard offers. */
export function needsSymbolPad(answer) {
  const str = String(answer ?? "");
  return /[≤≥]|<=|>=/.test(str);
}

function insertAtCaret(input, text) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  const caret = start + text.length;
  try {
    input.setSelectionRange(caret, caret);
  } catch (_e) {
    /* number inputs refuse selection ranges */
  }
  input.focus();
  // Let every existing listener (save, live-grade, clear-feedback) see it.
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Mount a symbol pad next to `input`. By default it shows only the symbols the
 * expected answer actually uses (plus its opposite, so the pad is not itself a
 * hint about the direction). Returns the pad element, or null when the answer
 * needs no symbol.
 *
 * @param {HTMLInputElement} input
 * @param {{answer?: string, symbols?: string[], force?: boolean, host?: Element}} [opts]
 */
export function mountSymbolPad(input, opts = {}) {
  if (!input || typeof document === "undefined") return null;
  const { answer, symbols, force, host } = opts;
  if (!symbols && !force && !needsSymbolPad(answer)) return null;

  const keys = symbols?.length ? symbols : INEQUALITY_SYMBOLS;
  const pad = document.createElement("div");
  pad.className = "nt-symbol-pad";
  pad.setAttribute("role", "group");
  pad.setAttribute("aria-label", "Insert a symbol");
  pad.style.cssText = "display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-top:6px;";

  const hint = document.createElement("span");
  hint.textContent = "Tap to add:";
  hint.style.cssText = "font-size:0.85rem; font-weight:700; color:#56627a;";
  pad.append(hint);

  for (const sym of keys) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nt-symbol-key";
    btn.textContent = sym;
    btn.title = LABELS[sym] || sym;
    btn.setAttribute("aria-label", `Insert ${LABELS[sym] || sym}`);
    btn.style.cssText =
      "min-width:44px; min-height:44px; font-size:1.15rem; font-weight:800; " +
      "background:#fff; color:#14223a; border:2px solid #cbd5e1; border-radius:10px; cursor:pointer;";
    btn.addEventListener("click", () => insertAtCaret(input, sym));
    pad.append(btn);
  }

  // The reference lives beside the keys: the moment a student wonders which
  // symbol "at most" means is the moment they are looking at this row.
  mountInequalityKeyButton(pad);

  // `host` keeps the pad out of the flow of text when the box is an inline
  // blank inside a sentence — a flex row dropped mid-sentence reads as part of
  // the sentence ("the speed must be Tap to add: < ≤ > ≥ 65").
  if (host) host.append(pad);
  else input.insertAdjacentElement("afterend", pad);
  return pad;
}
