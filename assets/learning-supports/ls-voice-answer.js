// "Say my answers": a microphone button beside the answer box that has focus.
//
// Typing always works and is never replaced. The student presses the button (or
// Alt+M), says the answer, and sees what was heard written into the box, ready
// to read, fix and submit like anything they typed. Nothing is submitted for
// them and nothing is calculated.
//
// The browser's speech service listens only while the student has pressed the
// button. In Chrome that service may send the audio over the internet, which is
// why this is off until the student turns it on and why the panel says so.

import { spokenToNumberAnswer, spokenToText } from "./ls-spoken-number.js";
import { announce, bi, one, pageLang } from "./ls-ui.js";

const ANSWER_AREA = ".problem-card, .problem-section, [data-ls-problem], [data-ls-voice]";
const NOT_ANSWERS =
  "[data-ls-voice='off'], [readonly], [disabled], [autocomplete~='name'], [autocomplete~='email'], [autocomplete~='username'], [type='password']";
const NUMERIC_TYPES = new Set(["text", "number", "tel", ""]);

/** @returns {any} */
const recognitionClass = () =>
  typeof window === "undefined"
    ? null
    : /** @type {any} */ (window).SpeechRecognition ||
      /** @type {any} */ (window).webkitSpeechRecognition ||
      null;

/** Can this browser listen at all? */
export const canListen = () => recognitionClass() !== null;

/**
 * Is `el` a box a student types an answer into?
 * @param {EventTarget | null} el
 * @returns {el is HTMLInputElement | HTMLTextAreaElement}
 */
export function isAnswerField(el) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false;
  if (el.matches(NOT_ANSWERS) || el.closest("[data-ls-ui]")) return false;
  if (el instanceof HTMLTextAreaElement) return el.closest(ANSWER_AREA) !== null;
  if (!NUMERIC_TYPES.has(el.type)) return false;
  const mode = el.getAttribute("inputmode");
  const numeric = el.type === "number" || mode === "numeric" || mode === "decimal";
  return numeric || el.closest(ANSWER_AREA) !== null;
}

/**
 * Put text in a box the way typing would, so the page's own listeners run.
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {string} text
 */
export function writeToField(field, text) {
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(proto.prototype, "value")?.set;
  const next =
    field instanceof HTMLTextAreaElement && field.value
      ? `${field.value}${/\s$/.test(field.value) ? "" : " "}${text}`
      : text;
  setter?.call(field, next);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

/** @param {{ get: () => import("./ls-prefs.js").Prefs, subscribe: (fn: (p: import("./ls-prefs.js").Prefs) => void) => () => void }} prefs */
export function installVoiceAnswer(prefs) {
  /** @type {HTMLButtonElement | null} */
  let mic = null;
  /** @type {HTMLElement | null} */
  let status = null;
  /** @type {HTMLInputElement | HTMLTextAreaElement | null} */
  let target = null;
  /** @type {any} */
  let rec = null;
  let listening = false;

  function build() {
    mic = document.createElement("button");
    mic.type = "button";
    mic.className = "ls-mic";
    mic.hidden = true;
    mic.setAttribute("data-ls-ui", "");
    mic.setAttribute("aria-pressed", "false");
    const icon = document.createElement("span");
    icon.textContent = "🎤";
    icon.setAttribute("aria-hidden", "true");
    mic.append(icon, bi("sayIt"));
    mic.addEventListener("click", toggle);
    // Keep the answer box focused when the button is pressed with a mouse.
    mic.addEventListener("mousedown", (e) => e.preventDefault());
    status = document.createElement("div");
    status.className = "ls-mic-status";
    status.setAttribute("data-ls-ui", "");
    status.hidden = true;
    document.body.append(mic, status);
  }

  /** @param {string | null} key @param {Record<string, string | number>} [vars] */
  function say(key, vars) {
    if (!status) return;
    status.hidden = key === null;
    if (key === null) return;
    status.textContent = one(key, vars);
    announce(key, vars);
  }

  function place() {
    if (!mic || !status || !target) return;
    const r = target.getBoundingClientRect();
    const left = Math.min(window.innerWidth - mic.offsetWidth - 8, r.right + 8);
    const top = Math.max(8, r.top + (r.height - mic.offsetHeight) / 2);
    mic.style.left = `${Math.max(8, left)}px`;
    mic.style.top = `${top}px`;
    status.style.left = mic.style.left;
    status.style.top = `${top + mic.offsetHeight + 4}px`;
  }

  function stopListening() {
    listening = false;
    mic?.setAttribute("aria-pressed", "false");
    mic?.classList.remove("is-listening");
    try {
      rec?.stop();
    } catch {
      /* already stopped */
    }
  }

  /** @param {string} transcript */
  function accept(transcript) {
    const field = target;
    if (!field) return;
    const lang = pageLang();
    const numeric =
      field instanceof HTMLInputElement &&
      (field.type === "number" ||
        field.getAttribute("inputmode") === "numeric" ||
        field.getAttribute("inputmode") === "decimal");
    const text = numeric ? spokenToNumberAnswer(transcript, lang) : spokenToText(transcript, lang);
    if (!text) {
      say("heardNothing");
      return;
    }
    if (
      field instanceof HTMLInputElement &&
      field.type === "number" &&
      !/^-?\d+(\.\d+)?$/.test(text)
    ) {
      say("notThisBox", { text });
      return;
    }
    writeToField(field, text);
    say("heard", { text });
  }

  function start() {
    const Recognition = recognitionClass();
    if (!Recognition || !target) return;
    rec = new Recognition();
    rec.lang = pageLang() === "es" ? "es-US" : "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (/** @type {any} */ e) => accept(e.results?.[0]?.[0]?.transcript ?? "");
    rec.onerror = (/** @type {any} */ e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      say(
        e.error === "not-allowed" || e.error === "service-not-allowed" ? "micDenied" : "micError",
      );
    };
    rec.onend = () => {
      listening = false;
      mic?.setAttribute("aria-pressed", "false");
      mic?.classList.remove("is-listening");
    };
    try {
      rec.start();
      listening = true;
      mic?.setAttribute("aria-pressed", "true");
      mic?.classList.add("is-listening");
      say("listening");
    } catch {
      say("micError");
    }
  }

  function toggle() {
    if (listening) {
      stopListening();
      say(null);
    } else {
      start();
    }
  }

  /** @param {EventTarget | null} where */
  function showFor(where) {
    if (!mic || where === mic) return;
    if (isAnswerField(where)) {
      target = where;
      mic.hidden = false;
      mic.setAttribute("aria-label", `${one("sayItLabel")} (Alt+M)`);
      place();
    } else if (!listening) {
      mic.hidden = true;
      say(null);
    }
  }

  /** @param {FocusEvent} e */
  const onFocusIn = (e) => showFor(e.target);

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.altKey && e.code === "KeyM" && isAnswerField(document.activeElement)) {
      e.preventDefault();
      target = /** @type {HTMLInputElement} */ (document.activeElement);
      toggle();
    }
  }

  function enable() {
    if (!canListen()) return;
    if (!mic) build();
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    if (isAnswerField(document.activeElement))
      onFocusIn(new FocusEvent("focusin", { relatedTarget: null }));
  }

  function disable() {
    stopListening();
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", place);
    window.removeEventListener("resize", place);
    if (mic) mic.hidden = true;
    say(null);
  }

  let on = false;
  /** @param {boolean} want */
  const sync = (want) => {
    if (want === on) return;
    on = want;
    if (want) enable();
    else disable();
  };
  sync(prefs.get().voiceAnswer);
  prefs.subscribe((p) => sync(p.voiceAnswer));
}
