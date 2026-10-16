// Small DOM helpers shared by the Learning Supports controls: bilingual text,
// the page language, and one polite announcement region.

import { line } from "./ls-strings.js";

/** @typedef {import("./ls-speech-text.js").Lang} Lang */

/**
 * The language the student picked for the site. The engine (engine/core/i18n.js)
 * owns this choice under the key `nt-lang`; it is read here, not re-saved, so
 * pages that never load the engine still follow it.
 * @returns {Lang}
 */
export function pageLang() {
  try {
    if (localStorage.getItem("nt-lang") === "es") return "es";
  } catch {
    /* storage blocked: English stands */
  }
  return document.documentElement.lang.toLowerCase().startsWith("es") ? "es" : "en";
}

/**
 * English first, Spanish beneath it. The Spanish line is tagged so a screen
 * reader switches voice and read-aloud picks the right language.
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 * @param {string} [className]
 * @returns {HTMLSpanElement}
 */
export function bi(key, vars = {}, className = "") {
  const text = line(key, vars);
  const wrap = document.createElement("span");
  wrap.className = `ls-bi ${className}`.trim();
  const en = document.createElement("span");
  en.className = "ls-en";
  en.lang = "en";
  en.textContent = text.en;
  const es = document.createElement("span");
  es.className = "ls-es";
  es.lang = "es";
  es.textContent = text.es;
  wrap.append(en, es);
  return wrap;
}

/**
 * One line for places that take a single string (aria-label, title): the
 * student's own language.
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 */
export function one(key, vars = {}) {
  return line(key, vars)[pageLang()];
}

/** @type {HTMLElement | null} */
let region = null;

/**
 * Say something to screen readers without moving focus.
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 */
export function announce(key, vars = {}) {
  if (!region || !region.isConnected) {
    region = document.createElement("div");
    region.className = "ls-sr-only";
    region.setAttribute("data-ls-ui", "");
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    document.body.append(region);
  }
  region.textContent = "";
  // A beat later so the same message twice in a row is still announced.
  const message = one(key, vars);
  setTimeout(() => {
    if (region) region.textContent = message;
  }, 30);
}
