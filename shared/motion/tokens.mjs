// Motion and colour constants. The values are MIRRORED from engine/design/tokens.json (the site's brand source);
// tools/motion-tokens.test.mjs fails if they drift, so there is one source of truth and this file holds no opinion.

export const MOTION = Object.freeze({
  fastMs: 150,
  baseMs: 200,
  slowMs: 250,
  celebrateMs: 600,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
});

export const COLOR = Object.freeze({
  navy: "#17324d",
  teal: "#1fa6a2",
  amber: "#f2c15b",
  canvas: "#f7f4ec",
  text: "#24323f",
  white: "#ffffff",
  success: "#0f7c4a",
  error: "#b3402a",
  ink: "#0d273d",
  tealInk: "#177b78",
  muted: "#4a555e",
});

/** Fills that tell copies apart. Identity is also carried by each copy's outline (solid or dashed) and number, never by colour alone. */
export const COPY_FILLS = Object.freeze(["#1fa6a2", "#f2c15b", "#6b7c8d", "#65ab8b"]);

export const FONT = '"Nunito", "Avenir Next", Calibri, system-ui, sans-serif';

/** Literal colour -> the CSS custom property that carries it when a page wants tokens instead of hex (family pages, forced colours). */
export const CSS_VARS = Object.freeze({
  "#17324d": "var(--mc-navy)",
  "#1fa6a2": "var(--mc-c0)",
  "#f2c15b": "var(--mc-c1)",
  "#6b7c8d": "var(--mc-c2)",
  "#65ab8b": "var(--mc-c3)",
  "#ffffff": "var(--mc-white)",
  "#0d273d": "var(--mc-ink)",
  "#177b78": "var(--mc-teal-ink)",
  "#4a555e": "var(--mc-muted)",
  "#0f7c4a": "var(--mc-success)",
  "#b3402a": "var(--mc-error)",
});
