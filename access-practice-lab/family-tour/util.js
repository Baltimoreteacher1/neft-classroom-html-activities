export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** English words inside a Spanish page: marked so a screen reader switches voice. */
export const en = (s) => `<span lang="en">${esc(s)}</span>`;

import { sceneSVG } from "../src/early/scenes.js";

export const BASE = "/access-practice-lab";
export const hasArt = (p) => Boolean(p?.picture?.src || p?.scene);

/**
 * The picture for an activity: its SVG file (grades 3-8) or its drawn scene (K-3, src/early/scenes.js). `decorative`
 * hides it from screen readers when the same words are already on the screen.
 */
export function art(p, { lang = "en", decorative = false } = {}) {
  if (p?.picture?.src)
    return `<img src="${esc(`${BASE}/${p.picture.src}`)}" alt="${decorative ? "" : esc(p.picture.alt)}" lang="en" loading="lazy" width="640" height="400">`;
  if (p?.scene) {
    const svg = sceneSVG(p.scene, lang);
    return `<span class="scene">${decorative ? svg.replace(/ role="img" aria-label="[^"]*"/, ' aria-hidden="true"') : svg}</span>`;
  }
  return "";
}

export const icon = (name) =>
  ({
    speak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 9a6 6 0 0 0 12 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    write: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4-1 11-11-3-3L5 16l-1 4Zm10-13 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    listen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12 0a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  })[name] || "";
