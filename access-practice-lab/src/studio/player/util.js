// DOM helpers for the player. Everything an activity says reaches the page through createTextNode / append(string),
// never innerHTML. Math markup ({3/4}, x^2) and **bold** are turned into real elements here.

import { mathRuns, plainMath, spokenMath } from "../core/math.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Create an element. Attribute values are set with setAttribute; on* functions become listeners. */
export function h(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  applyAttrs(node, attrs);
  addKids(node, kids);
  return node;
}

/** Create an SVG element (same attribute rules as h). */
export function sv(tag, attrs, ...kids) {
  const node = document.createElementNS(SVG_NS, tag);
  applyAttrs(node, attrs);
  addKids(node, kids);
  return node;
}

function applyAttrs(node, attrs) {
  if (!attrs) return;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === "class") node.setAttribute("class", value);
    else if (key.startsWith("on") && typeof value === "function")
      node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
}

function addKids(node, kids) {
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    node.append(typeof kid === "object" ? kid : String(kid));
  }
}

/** Replace all children of a node. */
export function fill(node, ...kids) {
  node.replaceChildren();
  addKids(node, kids);
  return node;
}

function mathNodes(text) {
  const frag = document.createDocumentFragment();
  for (const run of mathRuns(text)) {
    if (run.t === "text") frag.append(run.v);
    else if (run.t === "frac")
      frag.append(
        h(
          "span",
          { class: "sp-frac", role: "math", "aria-label": spokenMath(`{${run.n}/${run.d}}`) },
          h("span", { class: "sp-num", "aria-hidden": "true" }, run.n),
          h("span", { class: "sp-den", "aria-hidden": "true" }, run.d),
        ),
      );
    else if (run.t === "sup") frag.append(h("sup", null, run.v));
    else frag.append(h("sub", null, run.v));
  }
  return frag;
}

/** Append activity text: **bold** and math markup become elements, everything else stays text. */
export function rich(parent, text) {
  for (const part of String(text ?? "").split(/(\*\*[^*]+\*\*)/)) {
    if (!part) continue;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**"))
      parent.append(h("strong", null, mathNodes(part.slice(2, -2))));
    else parent.append(mathNodes(part));
  }
  return parent;
}

/** An element holding rich activity text. */
export function rt(tag, cls, text, attrs) {
  return rich(h(tag, { class: cls, ...attrs }), text);
}

/** Activity text as plain text for aria-labels and speech fallbacks. */
export const plainText = (text) => plainMath(String(text ?? "").replace(/\*\*/g, ""));

/** Activity text as speakable text. */
export const spokenText = (text) => spokenMath(String(text ?? "").replace(/\*\*/g, ""));

let idCounter = 0;
export const nid = (prefix = "sp") => `${prefix}-${++idCounter}`;

/** Visually hidden text for screen readers. */
export const sr = (text) => h("span", { class: "sp-sr" }, text);

/** A small deterministic random generator (mulberry32) seeded from a string. */
export function seeded(seed) {
  let a = 0;
  for (const ch of String(seed)) a = (Math.imul(a, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A shuffled copy. When `avoidSame` is set the result never equals the input order. */
export function shuffled(items, rand, avoidSame = false) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (avoidSame && out.length > 1 && out.every((v, i) => v === items[i])) out.push(out.shift());
  return out;
}

/** Arrow-key movement between the controls of a group (roving tabindex, one tab stop). */
export function roving(container, selector, { vertical = false, onMove } = {}) {
  const items = () => [...container.querySelectorAll(selector)].filter((n) => !n.disabled);
  const setStop = (target) => {
    for (const n of items()) n.tabIndex = n === target ? 0 : -1;
  };
  container.addEventListener("keydown", (e) => {
    const list = items();
    const at = list.indexOf(document.activeElement);
    if (at < 0) return;
    const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const home = e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : -1;
    if (next === undefined && home < 0) return;
    if (vertical && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;
    e.preventDefault();
    const target = home >= 0 ? list[home] : list[(at + next + list.length) % list.length];
    setStop(target);
    target.focus();
    onMove?.(target);
  });
  setStop(items().find((n) => n.getAttribute("aria-checked") === "true") || items()[0]);
  return { setStop };
}

/** Split text into paragraphs on blank lines. */
export const paragraphs = (text) =>
  String(text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Re-run `paint()` and keep keyboard focus on the same control (found again by data-key), or on `prefer`. */
export function repaint(root, paint, prefer) {
  const had = root.contains(document.activeElement);
  const key = prefer || document.activeElement?.dataset?.key;
  paint();
  if (!had && !prefer) return;
  const target = [...root.querySelectorAll("[data-key]")].find((n) => n.dataset.key === key);
  target?.focus();
}
