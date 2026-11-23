// Shared state and small DOM helpers for the teacher views. Module-level state survives ctx.rerender() (a rerender
// re-runs render(), which reads it again); nothing in here is stored or sent anywhere.
import { html, toHtml } from "../../util.js";
import { SUPPORT_KEYS } from "../contract.js";

const SESSION_CLASS = "vaTeacherClass";
const session = () => {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
};

/** Everything a teacher page remembers between renders. */
export const T = {
  classCode: session()?.getItem(SESSION_CLASS) || "",
  roster: null, // the class server's roster response for `rosterFor`
  rosterFor: "",
  rosterBusy: false,
  stops: new Set(), // assignment stops ticked: "" (whole unit) or a lesson letter
  due: "",
  variant: {
    on: false,
    label: "",
    preset: "",
    fade: 100,
    words: new Set(),
    add: new Set(),
    drop: new Set(),
  },
  draft: null, // the support profile being edited
  presetName: "",
  files: [], // students loaded from progress files [{ label, progress }]
  sample: false,
  unit: null, // the unit the page is showing (published or custom)
  follow: null, // Set of word ids ticked for follow-up practice
};

export const chooseClass = (code) => {
  T.classCode = code;
  T.roster = null;
  T.rosterFor = "";
  try {
    session()?.setItem(SESSION_CLASS, code);
  } catch {
    // tab storage unavailable: the choice lasts until the page reloads
  }
};

/** Replace the inside of a region by id without a rerender (keeps focus and scroll where the teacher is working). */
export function setRegion(id, content) {
  const node = typeof document === "undefined" ? null : document.getElementById(id);
  if (node) node.innerHTML = typeof content === "string" ? content : toHtml(content);
  return Boolean(node);
}

/** A polite status line: tone "ok" | "warn" | "" with text. */
export const statusLine = (text, tone = "") =>
  html`<p class="vat-status" data-tone="${tone}">${text}</p>`;

/** [English, Spanish] label of a support key, plain strings for attributes. */
export const flagList = (I, labels, flags) =>
  SUPPORT_KEYS.filter((k) => flags[k]).map((k) => I.S(...labels[k]));

export const intIn = (v, lo, hi, fb) =>
  Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Math.round(Number(v)))) : fb;
