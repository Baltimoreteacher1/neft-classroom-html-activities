// Shared pieces for the arcade games (Math Baseball, Guess the Number, Math Race): the star rule, motion that respects
// the learner's reduced-motion setting, and the typed-answer form. Stars here reward careful thinking, never speed.
import { t } from "./i18n.js";
import { peekCap } from "./step-leak.js";
import { mathText, stepsBlock } from "./trail-pictures.js";

export const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// Three stars for 4 in 5 first-try answers, two for half, one otherwise. Nothing here is timed.
export const starsByShare = (right, total) =>
  total <= 0 ? 1 : right / total >= 0.8 ? 3 : right / total >= 0.5 ? 2 : 1;

export const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

// Moves an SVG element through [x, y, opacity?] points with the Web Animations API. The element's own `transform`
// attribute is its resting place, so skipping this (reduced motion, old browsers, jsdom) leaves a correct picture.
export function flyAlong(element, points, { step = 450, easing = "linear" } = {}) {
  if (!element || typeof element.animate !== "function" || reducedMotion() || points.length < 2)
    return null;
  const frames = points.map(([x, y, opacity = 1]) => ({
    transform: `translate(${x}px, ${y}px)`,
    opacity,
  }));
  return element.animate(frames, {
    duration: step * (points.length - 1),
    easing,
    fill: "backwards",
  });
}

// The question, a typed answer box and (after a first miss) the steps up to, but never including, the answer step.
export function askFormHtml(card, { solved, shown, tries, peek, label }) {
  const steps = peekCap(card) > 0 ? card.steps : [];
  return `<form class="gm-ask-form" autocomplete="off"><p class="gm-q" id="gm-q">${mathText(card.question)}</p>
    <div class="tr-answer"><label class="tr-sr" for="gm-input">${t("Your answer")}</label><input id="gm-input" class="tr-input" inputmode="${card.kind === "number" ? "decimal" : "text"}" spellcheck="false" aria-describedby="gm-q" value="${esc(shown)}"${solved ? " disabled" : ""} /><button type="submit" class="tr-check"${solved ? " disabled" : ""}>${label || t("Check")}</button></div>
    ${steps.length && tries && !solved ? stepsBlock(steps, Math.max(1, peek), { id: "gm-steps", cap: peekCap(card) }) : ""}</form>`;
}

// Puts the cursor where the learner types next: the Next button once a result is settled, else the answer box.
export function focusNext(host, solved) {
  if (solved) host.querySelector("[data-gm-next]")?.focus();
  else host.querySelector("#gm-input")?.focus();
}
