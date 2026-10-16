// Renders a Touch & Try lab in jsdom and records what it draws, so a change that
// is meant to leave the English untouched (wrapping strings in labT) can prove it.
//
// The record is a list of HTML fingerprints: the first paint, then the DOM after
// each of a fixed series of interactions (type a value into every field, click
// the next button). That is a regression net, not a coverage claim: the series is
// generic, so it reaches most status messages but not every branch.
//
//   renderLabStates(kind, cfg, { mode }) -> Promise<string[]>   (HTML per state)
//
// Math.random is frozen and timers run for real but short, so the output is
// deterministic.

import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";

const INPUT_SERIES = ["7", "1/2", "12", "3"];
const STEPS = 48;
const KEYS = ["ArrowRight", "ArrowRight", "ArrowUp", "ArrowLeft", "Enter"];

let installed = null;
let pendingFrames = 0;

/** Install one shared jsdom window as the globals the labs read. */
function install() {
  if (installed) return installed;
  const dom = new JSDOM("<!doctype html><html lang='en'><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const names = [
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "Node",
    "Element",
    "HTMLElement",
    "SVGElement",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "PointerEvent",
    "InputEvent",
    "CustomEvent",
    "MutationObserver",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "DOMParser",
    "XMLSerializer",
    "HTMLInputElement",
  ];
  for (const name of names) {
    if (window[name] === undefined) continue;
    Object.defineProperty(globalThis, name, {
      value: window[name],
      configurable: true,
      writable: true,
    });
  }
  Object.defineProperty(globalThis, "navigator", {
    value: window.navigator,
    configurable: true,
    writable: true,
  });
  // Animations read the frame timestamp. Hand them a clock that jumps a second
  // per frame so every tween finishes in a frame or two, whatever the machine.
  let frameClock = 0;
  const frame = (cb) => {
    pendingFrames += 1;
    return setTimeout(() => {
      pendingFrames -= 1;
      cb((frameClock += 1000));
    }, 0);
  };
  const unframe = (id) => {
    clearTimeout(id);
    pendingFrames = Math.max(0, pendingFrames - 1);
  };
  for (const target of [globalThis, window]) {
    target.requestAnimationFrame = frame;
    target.cancelAnimationFrame = unframe;
  }
  for (const perf of [globalThis.performance, window.performance]) {
    Object.defineProperty(perf, "now", { value: () => frameClock, configurable: true });
  }
  Math.random = () => 0.5;
  installed = window;
  return window;
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Let every queued animation frame run, so a step never races its tween. */
async function settle() {
  for (let i = 0; i < 50 && pendingFrames > 0; i += 1) await pause(2);
  await pause(2);
}

function fire(el, type, init = {}) {
  const Ctor = type.startsWith("key") ? globalThis.KeyboardEvent : globalThis.Event;
  el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, ...init }));
}

function pressables(host) {
  return [...host.querySelectorAll("button, [role='button'], select, svg [tabindex]")].filter(
    (el) => !el.disabled && el.getAttribute("aria-disabled") !== "true",
  );
}

/**
 * @param {string} kind interactive-visual kind (a REGISTRY key)
 * @param {object} cfg its config, as the homework page serializes it
 * @param {{ mode?: "en" | "es" | "bilingual" }} [opts]
 * @returns {Promise<string[]>}
 */
export async function renderLabStates(kind, cfg, { mode = "en" } = {}) {
  const window = install();
  const { document } = window;
  document.body.className = mode === "en" ? "" : `lang-mode-${mode}`;
  document.documentElement.lang = mode === "es" ? "es" : "en";
  document.body.innerHTML = "";
  const host = document.createElement("div");
  host.className = "interactive-visual";
  host.dataset.visual = kind;
  host.dataset.config = JSON.stringify(cfg);
  document.body.appendChild(host);

  const { mountInteractiveVisuals } = await import("../core/interactive-visual.js");
  mountInteractiveVisuals(document.body);
  await pause(120);

  if (host.querySelector(".interactive-visual-error")) {
    throw new Error(`lab "${kind}" failed to mount`);
  }
  const states = [host.innerHTML];
  // Some labs open behind a "predict first" card (its own module, with its own
  // strings). Answer it and wait out its reveal delay so the lab itself is what
  // gets recorded.
  const choice = host.querySelector(".iv-predict-choice");
  if (choice) {
    choice.dispatchEvent(new globalThis.MouseEvent("click", { bubbles: true, cancelable: true }));
    await pause(2900);
    states.push(host.innerHTML);
  }

  for (let step = 0; step < STEPS; step += 1) {
    const value = INPUT_SERIES[step % INPUT_SERIES.length];
    for (const input of host.querySelectorAll("input")) {
      if (input.type === "range") {
        const lo = Number(input.min || 0);
        const hi = Number(input.max || 100);
        input.value = String([lo, (lo + hi) / 2, hi][step % 3]);
        fire(input, "input");
        fire(input, "change");
      } else if (input.type === "text" || input.type === "number" || input.type === "") {
        input.value = value;
        fire(input, "input");
        fire(input, "change");
      }
    }
    for (const el of host.querySelectorAll("[role='slider'], [tabindex='0']")) {
      fire(el, "keydown", { key: KEYS[step % KEYS.length] });
    }
    const targets = pressables(host);
    if (targets.length) {
      const pick = targets[step % targets.length];
      if (pick.tagName === "SELECT") {
        pick.selectedIndex = (pick.selectedIndex + 1) % Math.max(1, pick.options.length);
        fire(pick, "change");
      } else {
        pick.dispatchEvent(
          new globalThis.MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      }
    }
    await settle();
    states.push(host.innerHTML);
  }
  return states;
}

/** A short stable fingerprint for one rendered state. */
export const fingerprint = (html) => createHash("sha256").update(html).digest("hex").slice(0, 16);

/**
 * The first state that is the lab itself, not the "predict first" card some labs
 * open behind (that card belongs to engine/core/predict-then-reveal.js).
 * @param {string[]} states
 */
export const labPaint = (states) =>
  states.find((html) => !html.includes('class="iv-predict"')) ?? states[0];
