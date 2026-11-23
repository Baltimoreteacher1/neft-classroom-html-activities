// Shared helpers for the Activity Studio player and export tests: a jsdom window running the BUILT player bundle,
// and `solve()`, which answers any question through the real DOM controls (the same ones a student uses).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PLAYER_JS = readFileSync(
  join(ROOT, "access-practice-lab/player/studio-player.js"),
  "utf8",
);
export const PLAYER_CSS = readFileSync(
  join(ROOT, "access-practice-lab/player/studio-player.css"),
  "utf8",
);

/** A jsdom window with the player bundle loaded; `mount(activity, opts)` mounts into #app. */
export function makeWindow({
  speech = false,
  dangerous = false,
  html = '<!doctype html><html lang="en"><body><main id="app"></main></body></html>',
} = {}) {
  const dom = new JSDOM(html, {
    runScripts: dangerous ? "dangerously" : "outside-only",
    pretendToBeVisual: true,
    url: "http://localhost/",
  });
  const { window } = dom;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  if (speech) {
    const spoken = [];
    window.speechSynthesis = { speak: (u) => spoken.push(u.text), cancel() {} };
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
    window.__spoken = spoken;
  }
  window.eval(PLAYER_JS);
  const mount = (activity, opts = {}) => {
    const root = window.document.getElementById("app");
    return window.StudioPlayer.mountPlayer(root, activity, { preview: true, ...opts });
  };
  return {
    dom,
    window,
    document: window.document,
    mount,
    $: (s) => window.document.querySelector(s),
    $$: (s) => [...window.document.querySelectorAll(s)],
  };
}

const fire = (el, type) =>
  el.dispatchEvent(new el.ownerDocument.defaultView.Event(type, { bubbles: true }));
/** Source text of the DOM solver, so a real browser can run exactly the same steps (see studio-export.test.mjs). */
export const solverSource = () =>
  `const fire=${fire};const click=${click};const type=${type};const byKey=${byKey};return (${solve})(document,q);`;
export const click = (el) => {
  if (!el) throw new Error("click: element not found");
  el.click();
};
export function type(el, value) {
  if (!el) throw new Error("type: element not found");
  el.value = value;
  fire(el, "input");
}
const byKey = (doc, key) =>
  [...doc.querySelectorAll("[data-key]")].find((n) => n.dataset.key === key);

/** Answer one question correctly through the DOM. Returns nothing; call checkNow() after. */
export function solve(doc, q) {
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => [...doc.querySelectorAll(s)];
  switch (q.format) {
    case "choice":
      click($(`.sp-q input[value="${q.answer}"]`));
      break;
    case "multi":
      for (const a of q.answers) click($(`.sp-q input[value="${a}"]`));
      break;
    case "match":
      for (const p of q.pairs) {
        click(byKey(doc, `card:${p.id}`));
        click(byKey(doc, `slot:${p.id}`));
      }
      break;
    case "sort":
      for (const it of q.items) {
        click(byKey(doc, `item:${it.id}`));
        click(byKey(doc, `cat:${it.category}`));
      }
      break;
    case "order": {
      q.items.forEach((it, target) => {
        for (let guard = 0; guard < 20; guard++) {
          const at = $$(".sp-order-item").findIndex((li) => li.dataset.id === it.id);
          if (at <= target) break;
          click(byKey(doc, `up:${it.id}`));
        }
      });
      break;
    }
    case "blank": {
      const answers = [...q.text.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) =>
        m[1].split("|")[0].trim(),
      );
      $$(".sp-blank").forEach((input, i) => type(input, answers[i]));
      break;
    }
    case "number":
      type($(".sp-number"), q.answer);
      break;
    case "short":
      type($(".sp-area"), q.sample || "I think this because it is true and clear.");
      break;
    case "identify":
      for (const w of $$(".sp-word[data-target=yes]")) click(w);
      break;
    case "hotspot":
      click(
        $$(".sp-region").find(
          (b) => b.getAttribute("aria-label") === q.regions.find((r) => r.id === q.answer).label,
        ),
      );
      break;
    case "numberline":
      type($(".sp-number"), q.answer);
      break;
    case "build":
      for (const w of q.words) click($$(".sp-bank .sp-tile").find((t) => t.textContent === w));
      break;
    case "error":
      click($(`.sp-q input[value="${q.errorStep}"]`));
      click($(`.sp-q input[value="${q.fixAnswer}"]`));
      break;
    case "fillTable": {
      const cells = [];
      q.rows.forEach((row) =>
        row.forEach((c) => c && typeof c === "object" && cells.push(c.answer)),
      );
      $$(".sp-cell").forEach((input, i) => type(input, cells[i]));
      break;
    }
    case "plot":
      for (const p of q.points) click($(`.sp-pt[data-x="${p.x}"][data-y="${p.y}"]`));
      break;
    default:
      throw new Error(`solve: no solver for ${q.format}`);
  }
}

/** Press Check and return the feedback element. */
export function checkNow(doc) {
  const btn = doc.querySelector(".sp-check-btn");
  if (!btn) throw new Error("no Check button");
  btn.click();
  return doc.querySelector(".sp-feedback");
}
