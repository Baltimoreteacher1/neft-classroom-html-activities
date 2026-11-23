// Shared pieces for the Language Lens and Resource Remix views: stylesheet, the on-device privacy note, grade and subject
// fields, the text box with its counter, and the small hand-off from Lens to Remix. Markup and tiny state only; the
// language logic lives in core/lens.js and core/remix.js.
import { h } from "../core/dom.js";
import { GRADES, GRADE_LABEL, SUBJECTS } from "../data/taxonomy.js";
import { ensureCss } from "./lens-ui.js";

export const MAX_TEXT = 20000;
export const MIN_WORDS = 3;

export const SAMPLE = {
  grade: "4",
  subject: "science",
  text: "Water moves through the water cycle. First, the sun heats the ocean, and the water evaporates into the air. Then the vapor cools and condenses into clouds. When the clouds become heavy, precipitation falls as rain or snow. Explain why the water cycle is called a cycle. Use the words evaporation and condensation.",
};

export const PRIVACY_LINE =
  "Private by design: what you type or paste is read in this browser only. Nothing is uploaded, saved to a server or shared.";

let toolCss = false;
export function ensureToolCss() {
  ensureCss();
  if (toolCss || typeof document === "undefined") return;
  toolCss = true;
  if (document.querySelector("link[data-st-lt-css]")) return;
  const href = new URL("./lens-tools.css", import.meta.url).href;
  document.head.append(h("link", { rel: "stylesheet", href, "data-st-lt-css": "1" }));
}

export const wordCount = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

export function privacyBanner(extra) {
  return h(
    "div",
    { class: "st-ll-banner st-lt-privacy" },
    h("p", {}, h("strong", {}, "Your text stays on this device. "), PRIVACY_LINE),
    extra ? h("p", { class: "st-ll-muted" }, extra) : null,
  );
}

function selectField(id, label, options, value, hint) {
  const sel = h("select", { id, class: "st-ll-input" });
  for (const [v, text] of options) {
    const o = h("option", { value: v }, text);
    if (v === value) o.selected = true;
    sel.append(o);
  }
  return {
    sel,
    el: h(
      "div",
      { class: "st-lt-field" },
      h("label", { for: id }, label),
      sel,
      hint ? h("p", { class: "st-ll-muted st-lt-hint" }, hint) : null,
    ),
  };
}

/** Grade and subject pickers. get() -> { grade, subject }. Values outside the K-8 lists are dropped. */
export function gradeSubject(prefix, { grade = "", subject = "" } = {}) {
  const g = selectField(
    `${prefix}-grade`,
    "Grade",
    [["", "Not chosen"], ...GRADES.map((x) => [x, GRADE_LABEL[x]])],
    GRADES.includes(grade) ? grade : "",
    "Sets what counts as a long sentence.",
  );
  const s = selectField(
    `${prefix}-subject`,
    "Subject",
    [["", "Not chosen"], ...SUBJECTS.map((x) => [x.id, x.label])],
    SUBJECTS.some((x) => x.id === subject) ? subject : "",
    "Picks the subject word lists.",
  );
  return {
    el: h("div", { class: "st-lt-pair" }, g.el, s.el),
    get: () => ({ grade: g.sel.value, subject: s.sel.value }),
    set: (v) => {
      if (GRADES.includes(v.grade)) g.sel.value = v.grade;
      if (SUBJECTS.some((x) => x.id === v.subject)) s.sel.value = v.subject;
    },
  };
}

/** A labelled textarea with a live word counter. */
export function textBox({ id, label, hint, rows = 9, value = "", maxlength = MAX_TEXT }) {
  const ta = h("textarea", {
    id,
    class: "st-ll-input st-lt-text",
    rows: String(rows),
    maxlength: String(maxlength),
    "aria-describedby": `${id}-count`,
  });
  ta.value = value;
  const count = h("p", { id: `${id}-count`, class: "st-ll-muted st-lt-count" });
  const paint = () => {
    const n = wordCount(ta.value);
    count.textContent = `${n} ${n === 1 ? "word" : "words"}${ta.value.length >= maxlength ? ". You reached the limit; the rest is not used." : ""}`;
  };
  ta.addEventListener("input", paint);
  paint();
  return {
    ta,
    paint,
    el: h(
      "div",
      { class: "st-lt-field" },
      h("label", { for: id }, label),
      hint ? h("p", { class: "st-ll-muted st-lt-hint" }, hint) : null,
      ta,
      count,
    ),
  };
}

/** Polite status line shared by both views. */
export function statusLine() {
  const el = h("p", { class: "st-lt-status", role: "status", "aria-live": "polite" });
  return {
    el,
    say: (t) => {
      el.className = "st-lt-status";
      el.removeAttribute("role");
      el.setAttribute("role", "status");
      el.textContent = t;
    },
    fail: (t) => {
      el.className = "st-lt-status st-lt-status-bad";
      el.setAttribute("role", "alert");
      el.textContent = t;
    },
  };
}

// Lens -> Remix hand-off: kept in memory and in this tab's session storage, never in a server or shared storage.
const KEY = "lp.studio.v1.lens.handoff";
let held = null;
export function saveHandoff(v) {
  held = { text: String(v.text || ""), grade: v.grade || "", subject: v.subject || "" };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(held));
  } catch {
    /* session storage unavailable: memory is enough within this visit */
  }
}
export function loadHandoff() {
  if (held) return held;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) held = JSON.parse(raw);
  } catch {
    held = null;
  }
  return held;
}
export function clearHandoff() {
  held = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing stored */
  }
}
