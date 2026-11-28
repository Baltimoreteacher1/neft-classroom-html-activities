// Math Literacy Studio: tiny DOM helpers shared by every interactive activity (engines, games, manipulatives).
// Activities build DOM with textContent (never innerHTML of data), announce changes in a polite live region, and never rely on colour alone.
import { textLevelOf } from "./lang.js";

/** h("button", { class: "btn", onclick: fn, "aria-pressed": "false" }, "Label", child...) */
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, String(v));
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}
export const clear = (el) => {
  while (el.firstChild) el.firstChild.remove();
  return el;
};

/** A polite live region inside `root` (created once). Use say(root, "message") for every state change a learner cannot see in text. */
export function say(root, msg) {
  let r = root.querySelector("[data-ml-live]");
  if (!r) {
    r = h("p", { class: "ml-sr", role: "status", "aria-live": "polite", "data-ml-live": "" });
    root.append(r);
  }
  r.textContent = "";
  setTimeout(() => {
    r.textContent = msg;
  }, 30);
}

/** Feedback that never relies on colour: a word and a mark are always present. kind: "ok" | "try" | "info". */
export function feedback(box, kind, text) {
  box.className = `ml-fb ml-fb-${kind}`;
  box.setAttribute("role", "status");
  box.textContent = "";
  box.append(h("strong", {}, kind === "ok" ? "Yes. " : kind === "try" ? "Not yet. " : ""), text);
}

// ---- device speech: always identified as the device's voice, never as a recording of a person
export const speechAvailable = () => typeof window !== "undefined" && "speechSynthesis" in window;
export function speak(text, { rate = 0.9, lang = "en-US" } = {}) {
  if (!speechAvailable()) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text));
  u.rate = rate;
  u.lang = lang;
  window.speechSynthesis.speak(u);
  return true;
}
export const stopSpeech = () => {
  if (speechAvailable()) window.speechSynthesis.cancel();
};
/** A "Hear it" button that reads `text` aloud with the device voice, or says clearly that this device has none. */
export function hearButton(text, label = "Hear it") {
  return h("button", { type: "button", class: "btn small", "aria-label": `${label} (device voice)`, onclick: (e) => {
    if (!speak(text)) e.currentTarget.textContent = "This device has no voice. Read the text instead.";
  } }, label);
}

/** Text of a generated Problem at the level a language band uses. */
export function problemText(p, band) {
  const lv = textLevelOf(band);
  return { stem: p.stem[lv] || "", ask: p.ask[lv] };
}

/** Hint ladder: conceptual, then procedural, then (after two misses) the worked example steps; the answer itself is never shown after a miss. */
export function makeLadder(p) {
  let misses = 0;
  return {
    get misses() {
      return misses;
    },
    miss() {
      misses += 1;
      return misses === 1 ? p.hints.conceptual : misses === 2 ? p.hints.procedural : null;
    },
    /** After the third miss: the worked steps of a parallel example are offered by the caller; this returns the generic prompt. */
    worked: () => misses >= 3,
    reset() {
      misses = 0;
    },
  };
}

export const termsOf = (skill) => (skill.vocab || []).map((v) => v.term);
/** A random-looking but reproducible seed per activity start. */
export const seedFor = (opts, salt = 0) => (Number(opts.seed) || 1) * 7919 + salt;
/** Make activity styles load once. */
export async function styles() {
  const { ensureStylesheet } = await import("../util.js");
  return ensureStylesheet("mls-play.css");
}
