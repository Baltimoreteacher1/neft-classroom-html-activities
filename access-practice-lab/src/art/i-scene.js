// Shared pieces for the runtime game scenes (src/games/art.js, src/views/play-arcade-art.js, src/adventures/art.js,
// src/flagship/art.js). Built on the illustration kit: no outlines; form from a lit and a shade side, soft contact
// shadows, one warm light. Pure strings, no DOM.
import { FONT, P, circle, ellipse, esc, light, mix, path, rrect, shade } from "./kit.js";

/* Local gradients with ids unique per call, collected by the scene that is drawing (see collect()). */
let DEFS = null;
let n = 0;
/** Run draw() while gathering the gradients it registers; returns [defs, body]. */
export function collect(draw) {
  const was = DEFS;
  DEFS = [];
  try {
    const body = draw();
    return [DEFS.join(""), body];
  } finally {
    DEFS = was;
  }
}
const stopsOf = (stops) =>
  stops
    .map(
      ([o, c, a = 1]) =>
        `<stop offset="${o}" stop-color="${c}"${a !== 1 ? ` stop-opacity="${a}"` : ""}/>`,
    )
    .join("");
/** Linear gradient (top to bottom by default). Outside collect() it falls back to the middle colour. */
export function lg(stops, { x2 = 0, y2 = 1 } = {}) {
  if (!DEFS) return stops[Math.floor((stops.length - 1) / 2)][1];
  const i = `ig${(n += 1)}`;
  DEFS.push(
    `<linearGradient id="${i}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stopsOf(stops)}</linearGradient>`,
  );
  return `url(#${i})`;
}
/** Radial glow; outside collect() it drops out ("none"). */
export function rg(stops, { cx = 0.5, cy = 0.5, r = 0.5 } = {}) {
  if (!DEFS) return "none";
  const i = `ig${(n += 1)}`;
  DEFS.push(
    `<radialGradient id="${i}" cx="${cx}" cy="${cy}" r="${r}">${stopsOf(stops)}</radialGradient>`,
  );
  return `url(#${i})`;
}

/* Colour for the two band house styles. */
const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** Field Journal (6-8): every fill a little cooler and quieter, toward slate. */
export function cool(c) {
  const [r, g, b] = rgb(c);
  const y = Math.round(0.3 * r + 0.55 * g + 0.15 * b);
  const grey = `#${[y, y, y].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  return mix(mix(c, grey, 0.22), "#3d5a75", 0.08);
}
export const coolAll = (s) => s.replace(/#[0-9a-fA-F]{6}\b/g, cool);

/* Dimensional pieces (UI-ish objects drawn as real things: cards, tiles, chips). */
/** A raised card: soft drop shadow, a darker lip, the face and a lit top band. */
export function tile(x, y, w, h, r, fill, { lift = 3, glow = 0.35 } = {}) {
  return (
    rrect(x + 1.5, y + lift + 2, w, h, r, "#1c2f4a", 'opacity=".18"') +
    rrect(x, y + lift, w, h, r, shade(fill, 0.28)) +
    rrect(x, y, w, h, r, fill) +
    (glow
      ? rrect(
          x + r * 0.4,
          y + 2,
          w - r * 0.8,
          Math.min(h * 0.38, 14),
          Math.min(r, 6),
          light(fill, 0.45),
          `opacity="${glow}"`,
        )
      : "")
  );
}
/** A round chip or coin seen slightly from above. */
export function chip(x, y, r, fill) {
  return (
    ellipse(x + 1, y + r * 0.3 + 2, r, r * 0.9, "#1c2f4a", 'opacity=".18"') +
    circle(x, y + r * 0.18, r, shade(fill, 0.3)) +
    circle(x, y, r, fill) +
    ellipse(x - r * 0.25, y - r * 0.38, r * 0.5, r * 0.28, light(fill, 0.5), 'opacity=".55"')
  );
}
/** Bold readable glyph text for tiles (letters, numbers). */
export const word = (x, y, str, size, fill = P.ivory, weight = 800) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(str)}</text>`;
/** Magnifying glass: brass rim, pale lens with a glint, wooden handle. */
export function magnifier(x, y, r = 24, a = 45) {
  return `<g transform="translate(${x} ${y}) rotate(${a - 45})">${path(`M${r * 0.62} ${r * 0.74}l${r * 0.98} ${r * 0.98}a${r * 0.16} ${r * 0.16} 0 0 1 -${r * 0.34} ${r * 0.24}l-${r * 0.98} -${r * 0.98}z`, P.woodDark)}${circle(1.5, 3, r + 3, "#1c2f4a", 'opacity=".16"')}${circle(0, 0, r + 2, shade(P.gold, 0.25))}${circle(-0.8, -0.8, r, P.gold)}${circle(0, 0, r * 0.78, "#dff0f4")}${circle(r * 0.12, r * 0.12, r * 0.66, "#c6e3ec")}${path(`M${-r * 0.5} ${-r * 0.1}a${r * 0.52} ${r * 0.52} 0 0 1 ${r * 0.42} ${-r * 0.42}`, "none", `stroke="#ffffff" stroke-width="${(r * 0.12).toFixed(1)}" stroke-linecap="round" opacity=".85"`)}</g>`;
}
