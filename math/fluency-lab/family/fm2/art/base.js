// Shared drawing language for every Family Math 2.0 model: one palette, one stroke weight, one SVG wrapper.
// Game-specific models live in art/<topic>.js and build on these. @fm2 FM-036
import { escapeHtml } from "../lang.js";

export const PALETTE = {
  ink: "#1f2740",
  muted: "#5d6683",
  paper: "#ffffff",
  mist: "#f1f4fb",
  line: "#c9d0e4",
  teal: "#1FA6A2",
  tealSoft: "#F7F4EC",
  mint: "#1d9a6c",
  mintSoft: "#dff5ec",
  coral: "#e0583f",
  coralSoft: "#fde5df",
  gold: "#d99a12",
  goldSoft: "#fbefcf",
  sky: "#2a7bd6",
  skySoft: "#dcebfb",
};

// A labelled, scalable figure. `label` is the accessible name: describe the model in words so it is not decoration.
export function svg(width, height, body, label, extra = "") {
  return `<svg class="fm2-art" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)}" ${extra}>${body}</svg>`;
}

export const circle = (x, y, r, fill, stroke = PALETTE.ink) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
export const rect = (x, y, w, h, fill, stroke = PALETTE.ink, r = 4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
export const line = (x1, y1, x2, y2, stroke = PALETTE.ink, width = 2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
export const label = (x, y, text, size = 16, fill = PALETTE.ink, anchor = "middle") => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="700" fill="${fill}" font-family="Atkinson Hyperlegible, system-ui, sans-serif">${escapeHtml(text)}</text>`;
