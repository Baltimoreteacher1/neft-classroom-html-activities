// The four look presets and the accent guard. A look is a handful of CSS custom properties on the player root;
// player.css reads them and nothing else, so the same markup is classic, playful, calm or adventure.

const PRESETS = {
  classic: {
    "--sp-bg": "#faf9f6",
    "--sp-surface": "#ffffff",
    "--sp-surface-2": "#f2efe9",
    "--sp-ink": "#182230",
    "--sp-ink-2": "#475467",
    "--sp-line": "#c9c4b4",
    "--sp-accent": "#1e3a5f",
    "--sp-right": "#14683a",
    "--sp-right-soft": "#e3f3e8",
    "--sp-wrong": "#9a2b2b",
    "--sp-wrong-soft": "#fbe9e7",
    "--sp-hint": "#6f4500",
    "--sp-hint-soft": "#fff2d1",
    "--sp-radius": "14px",
    "--sp-font": '"Inter","Atkinson Hyperlegible","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif',
    "--sp-display": '"Plus Jakarta Sans","Inter","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif',
  },
  playful: {
    "--sp-bg": "#fff3dc",
    "--sp-surface": "#ffffff",
    "--sp-surface-2": "#ffe9c2",
    "--sp-ink": "#23190a",
    "--sp-ink-2": "#5a4219",
    "--sp-line": "#e0b868",
    "--sp-accent": "#0a6a86",
    "--sp-right": "#0f6b35",
    "--sp-right-soft": "#dff6e5",
    "--sp-wrong": "#a1262a",
    "--sp-wrong-soft": "#ffe4e0",
    "--sp-hint": "#6b4200",
    "--sp-hint-soft": "#fff0b8",
    "--sp-radius": "22px",
    "--sp-font": '"Atkinson Hyperlegible","Trebuchet MS","Avenir Next",system-ui,sans-serif',
    "--sp-display": '"Trebuchet MS","Avenir Next Rounded","Arial Rounded MT Bold",system-ui,sans-serif',
  },
  calm: {
    "--sp-bg": "#e9f0eb",
    "--sp-surface": "#fbfdfb",
    "--sp-surface-2": "#e0eae3",
    "--sp-ink": "#1d2b26",
    "--sp-ink-2": "#44574f",
    "--sp-line": "#b3c6bb",
    "--sp-accent": "#2c5a4c",
    "--sp-right": "#1d6140",
    "--sp-right-soft": "#dcf0e3",
    "--sp-wrong": "#8e3030",
    "--sp-wrong-soft": "#f8e6e3",
    "--sp-hint": "#654a12",
    "--sp-hint-soft": "#f6ecce",
    "--sp-radius": "12px",
    "--sp-font": '"Atkinson Hyperlegible","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif',
    "--sp-display": '"Atkinson Hyperlegible","Segoe UI",system-ui,sans-serif',
  },
  adventure: {
    "--sp-bg": "#0d1730",
    "--sp-surface": "#16264a",
    "--sp-surface-2": "#1e3260",
    "--sp-ink": "#f6f2e6",
    "--sp-ink-2": "#c6d0e8",
    "--sp-line": "#4a679d",
    "--sp-accent": "#f2b441",
    "--sp-right": "#8ae8ad",
    "--sp-right-soft": "#10402b",
    "--sp-wrong": "#ffb9ac",
    "--sp-wrong-soft": "#52221f",
    "--sp-hint": "#ffe38f",
    "--sp-hint-soft": "#4a3a0e",
    "--sp-radius": "16px",
    "--sp-font": '"Atkinson Hyperlegible","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif',
    "--sp-display": '"Plus Jakarta Sans","Inter","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif',
  },
};

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** Relative luminance of a #rrggbb color. */
export function luminance(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG contrast ratio between two #rrggbb colors. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Text color to put on top of a fill: whichever of white and near-black reads better. */
export const onColor = (fill) => (contrast(fill, "#ffffff") >= contrast(fill, "#14161f") ? "#ffffff" : "#14161f");

/** The accent actually used: the teacher's color only when it reads at 4.5:1 as text on the surface and under its label. */
export function safeAccent(preset, accent) {
  const base = PRESETS[preset];
  if (!/^#[0-9a-f]{6}$/i.test(accent || "")) return base["--sp-accent"];
  const ok =
    contrast(accent, base["--sp-surface"]) >= 4.5 &&
    contrast(accent, base["--sp-bg"]) >= 4.5 &&
    contrast(accent, onColor(accent)) >= 4.5;
  return ok ? accent.toLowerCase() : base["--sp-accent"];
}

/** Apply a look (style + optional accent) to the root element. Returns the style name used. */
export function applyLook(root, look) {
  const style = PRESETS[look?.style] ? look.style : "classic";
  const vars = { ...PRESETS[style] };
  vars["--sp-accent"] = safeAccent(style, look?.accent);
  vars["--sp-on-accent"] = onColor(vars["--sp-accent"]);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.dataset.look = style;
  return style;
}
