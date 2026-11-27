// Shared pieces for the three "start another way" boxes (describe it, use my own material, recipes). They appear in
// the Activity Studio chooser and in Project Studio's Create panel, so they carry their own small stylesheet
// (wire.css, loaded when a box first opens) and do not depend on either page's classes. DOM is built with
// createElement/textContent only. Authoring code: never imported by a student page.

import { h } from "../studio/editor/ui.js";
import { BASE } from "../util.js";

const JSZIP_SRC = "/card-builder/vendor/jszip.min.js";

let css = null;
/** Load the boxes' stylesheet once. */
export function ensureWireCss() {
  if (typeof document === "undefined") return;
  css ||= Object.assign(document.createElement("link"), {
    rel: "stylesheet",
    href: `${BASE}/src/create/wire.css`,
  });
  if (!css.isConnected) document.head.append(css);
}

/** The site's vendored JSZip, loaded the first time a .docx is read (never on student pages). */
export function loadJSZip() {
  if (globalThis.JSZip) return Promise.resolve(globalThis.JSZip);
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = JSZIP_SRC;
    el.onload = () => (globalThis.JSZip ? resolve(globalThis.JSZip) : reject(new Error("jszip")));
    el.onerror = () => reject(new Error("jszip"));
    document.head.append(el);
  });
}

let seq = 0;
export const uid = (p = "xw") => `${p}-${++seq}`;

/** A button. `kind` is "primary" (one per screen), "ghost" or "link". Always at least 44px tall (CSS). */
export function xbtn(label, onclick, kind = "ghost", attrs = {}) {
  return h(`button.xw-btn.xw-${kind}`, { type: "button", onclick, ...attrs }, label);
}

/** A labelled control. The label is a real <label for>. `hint` becomes the control's description. */
export function xfield(label, control, hint = "") {
  const id = control.id || (control.id = uid("xw-f"));
  const wrap = h("div.xw-field", h("label", { for: id }, label), control);
  if (hint) {
    const hid = uid("xw-h");
    wrap.append(h("p.xw-hint", { id: hid }, hint));
    control.setAttribute("aria-describedby", hid);
  }
  return wrap;
}

export function xarea(value, onInput, attrs = {}) {
  const el = h("textarea.xw-input", { rows: 4, oninput: (e) => onInput(e.target.value), ...attrs });
  el.value = value ?? "";
  return el;
}

export const xinput = (value, onInput, attrs = {}) =>
  h("input.xw-input", {
    type: "text",
    value: value ?? "",
    oninput: (e) => onInput(e.target.value),
    ...attrs,
  });

/**
 * A radio group in a fieldset (arrow keys move between options natively).
 * options: [{ id, label, hint? }]
 */
export function radioGroup({ name, legend, options, value, onChange }) {
  return h(
    "fieldset.xw-radios",
    h("legend", legend),
    options.map((o) =>
      h(
        "label.xw-radio",
        h("input", {
          type: "radio",
          name,
          value: o.id,
          checked: o.id === value,
          onchange: () => onChange(o.id),
        }),
        h("span", h("strong", o.label), o.hint ? h("small", o.hint) : null),
      ),
    ),
  );
}

/** "Line 4" / "Lines 4-6" for a [first, last] pair (1-based), or "". */
export function linesText(S, lines) {
  if (!Array.isArray(lines) || !(lines[0] > 0)) return "";
  const [a, b] = lines;
  return b > a ? S(`Lines ${a}-${b}`, `Líneas ${a}-${b}`) : S(`Line ${a}`, `Línea ${a}`);
}

/** A reason is `{ en, es }` itself, or wraps one as `.reason`. Returns { en, es } or null. */
export function pairOf(x) {
  const p = x && typeof x === "object" && x.reason && typeof x.reason === "object" ? x.reason : x;
  if (!p || (typeof p.en !== "string" && typeof p.es !== "string")) return null;
  return { en: p.en || p.es, es: p.es || p.en };
}

/** Review items (any of the studio's shapes) as plain `{ en, es, lines? }` notes. Nothing is dropped silently. */
export function notesOf(items) {
  return (items || [])
    .map((r) => {
      const p = pairOf(r);
      return p ? { ...p, ...(r.lines ? { lines: r.lines } : {}) } : null;
    })
    .filter(Boolean);
}

/** A list of notes with optional line numbers. */
export function noteList(S, notes) {
  return h(
    "ul.xw-notes",
    notes.map((n) =>
      h("li", n.lines ? h("span.xw-lines", linesText(S, n.lines)) : null, S(n.en, n.es)),
    ),
  );
}

/** Move keyboard focus to a heading-like element and make sure it can take it. */
export function focusEl(el) {
  if (!el) return;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: false });
}

/** Polite announcement for screen readers (its own live region, so the boxes work on any page). */
export function announce(message) {
  if (typeof document === "undefined") return;
  let live = document.getElementById("xw-live");
  if (!live) {
    live = h("div.xw-sr", { id: "xw-live", role: "status", "aria-live": "polite" });
    document.body.append(live);
  }
  live.textContent = "";
  setTimeout(() => {
    live.textContent = message;
  }, 30);
}
