// Colour maths shared by the design-token generator and the style gates.
// Pure functions, no I/O. WCAG 2.x relative luminance and contrast ratio.

/** "#abc" | "#aabbcc" | "rgb(...)" | "rgba(...)" -> {r,g,b,a} (0-255, a 0-1) or null. */
export function parseColor(input) {
  if (typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) {
    const [r, g, b] = [...m[1]].map((c) => Number.parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }
  m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
  if (m) {
    const h = m[1];
    return {
      r: Number.parseInt(h.slice(0, 2), 16),
      g: Number.parseInt(h.slice(2, 4), 16),
      b: Number.parseInt(h.slice(4, 6), 16),
      a: m[2] ? Number.parseInt(m[2], 16) / 255 : 1,
    };
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    if (parts.length >= 3 && parts.every((n) => Number.isFinite(n))) {
      return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
    }
  }
  return null;
}

export const toHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/** {r,g,b} -> {h:0-360, s:0-1, l:0-1} */
export function toHsl({ r, g, b }) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const mx = Math.max(R, G, B);
  const mn = Math.min(R, G, B);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (mx === R) h = ((G - B) / d) % 6;
  else if (mx === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

export function fromHsl({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb;
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return { r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 };
}

export function luminance({ r, g, b }) {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio of two opaque colours. */
export function contrast(a, b) {
  const L1 = luminance(a);
  const L2 = luminance(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

/** Composite a (possibly translucent) foreground over an opaque background. */
export function over(fg, bg) {
  const a = fg.a ?? 1;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

/** Snap each channel to the integer a hex colour can hold. */
export const roundRgb = ({ r, g, b, a = 1 }) => ({
  r: Math.round(r),
  g: Math.round(g),
  b: Math.round(b),
  a,
});

/** Linear mix: t=0 -> a, t=1 -> b. */
export const mix = (a, b, t) => ({
  r: a.r + (b.r - a.r) * t,
  g: a.g + (b.g - a.g) * t,
  b: a.b + (b.b - a.b) * t,
  a: 1,
});

/**
 * The hue range this product forbids: violet, purple, magenta. A colour only
 * counts when it is actually coloured (saturation) and not near-black/white
 * (lightness), so a blue-grey neutral is never flagged.
 */
export function isForbiddenHue(c) {
  const { h, s, l } = toHsl(c);
  return s > 0.15 && l > 0.03 && l < 0.97 && h >= 255 && h <= 335;
}

/** Darken (toward black) until `fg` reaches `min` contrast on every `onBgs`. */
export function darkenToContrast(fg, onBgs, min) {
  let t = 0;
  let cur = fg;
  const black = { r: 0, g: 0, b: 0, a: 1 };
  while (t <= 1) {
    // Judge the colour that will actually be emitted: toHex() rounds each channel, and a
    // ratio verified on the unrounded value can land under the floor once rounded.
    cur = roundRgb(mix(fg, black, t));
    if (onBgs.every((bg) => contrast(cur, bg) >= min)) return cur;
    t += 0.01;
  }
  return cur;
}
