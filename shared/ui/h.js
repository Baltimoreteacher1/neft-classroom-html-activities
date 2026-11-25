// Tiny DOM builder shared by every component in shared/ui. Browser-safe ESM, no globals captured at import
// time, so a component can be built in jsdom or in the Studio. Text is always appended as a text node:
// there is no HTML-string path, so a component can never inject markup from data.

/** h("button", { class: "x", onclick }, "text" | Node | [children]) -> HTMLElement */
export function h(tag, attrs = {}, ...kids) {
  const el = globalThis.document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k.startsWith("on") && typeof v === "function")
      el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "class") el.className = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : globalThis.document.createTextNode(String(kid)));
  }
  return el;
}

let counter = 0;
/** A document-unique id for aria-labelledby and similar wiring. */
export const uid = (prefix = "ui") => `${prefix}-${++counter}`;

/** Space-joined class list that drops falsy parts. */
export const cx = (...parts) => parts.filter(Boolean).join(" ");

/** Reading direction at an element ("rtl" | "ltr"), from the nearest dir attribute. */
export function directionOf(el) {
  return el.closest("[dir]")?.getAttribute("dir") === "rtl" ? "rtl" : "ltr";
}

/** Heading level guard: a card inside a page picks its own level, clamped to h2-h6. */
export const headingTag = (level = 3) => `h${Math.min(6, Math.max(2, Number(level) || 3))}`;
