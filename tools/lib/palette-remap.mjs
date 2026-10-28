// Deterministic remap of forbidden-hue colours (violet / purple / magenta) onto the
// locked palette's hue families, preserving lightness. Used to recolour SVG art and
// to explain what a replacement should be; the gate itself only detects.
//
//   hue 255-300  (violet, purple)  -> navy family  (hue 209)
//   hue 300-335  (magenta, orchid) -> teal family  (hue 178)
//
// Lightness is kept so shading in the art survives; saturation is capped at the
// family's own so the result reads as palette, not as a neon version of it.
import { fromHsl, isForbiddenHue, parseColor, toHex, toHsl } from "./color-math.mjs";

const FAMILIES = [
  { upTo: 300, h: 209, s: 0.52 }, // navy #17324D is hsl(209, 52%, 20%)
  { upTo: 336, h: 178, s: 0.6 }, // teal #1FA6A2 is hsl(178, 68%, 39%)
];

/** {r,g,b} -> {r,g,b}; colours outside the forbidden range are returned unchanged. */
export function remapForbidden(c) {
  if (!isForbiddenHue(c)) return c;
  const { h, s, l } = toHsl(c);
  const fam = FAMILIES.find((f) => h < f.upTo) || FAMILIES[FAMILIES.length - 1];
  return fromHsl({ h: fam.h, s: Math.min(s, fam.s), l });
}

/** Rewrite every hex / rgb() literal in `text` whose colour is forbidden. */
export function remapText(text) {
  return text.replace(/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g, (m) => {
    const c = parseColor(m);
    if (!c || !isForbiddenHue(c)) return m;
    return toHex(remapForbidden(c)) + (m.length === 9 ? m.slice(7) : "");
  });
}
