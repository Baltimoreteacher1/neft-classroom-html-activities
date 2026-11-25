// Renders the REAL Vocabulary Studio module in jsdom so gates judge what a teacher sees.
import { JSDOM, VirtualConsole } from "jsdom";

let dom = null;
export function setupDom() {
  if (dom) return dom.window;
  dom = new JSDOM("<!doctype html><body></body>", {
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
  });
  const { window } = dom;
  window.scrollTo = () => {};
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.CSS = { escape: (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, "\\$&") };
  return window;
}

/** Cards for one unit at one band, as { word, rows: { label: text }, svg, html } objects. */
export async function renderCards(detail, band) {
  const window = setupDom();
  const { renderVisualVocabStudio } = await import("../../bcpss-teachers/vocab-studio.js");
  const container = window.document.createElement("div");
  window.document.body.append(container);
  renderVisualVocabStudio(container, {
    unit: detail.unit,
    connection: detail.connections[0],
    blueprint: {},
    wida: "3_4",
  });
  container.querySelector(`[data-vs-band="${band}"]`)?.click();
  const cards = [...container.querySelectorAll(".vs-card")].map((card) => {
    const rows = {};
    for (const p of card.querySelectorAll(".vs-meta-row")) {
      const label = p.querySelector("strong")?.textContent?.replace(/:$/, "") || "";
      rows[label] = p.textContent.replace(p.querySelector("strong")?.textContent || "", "").trim();
    }
    return {
      word: card.querySelector(".vs-word-title")?.textContent || "",
      rows,
      svg: card.querySelector("svg"),
      cue: card.querySelector(".vs-cue")?.textContent || "",
      html: card.innerHTML,
    };
  });
  container.remove();
  return cards;
}
