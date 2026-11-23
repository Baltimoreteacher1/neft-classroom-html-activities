// Studio icon set: flat, outlined 64x64 icons built from SVG primitives, no DOM and no external assets.
// Entries live in core/icons/<category>.js; this module is the public API.
//
//   listIcons()                      -> [{name, category, keywords}]   (for search and pickers)
//   renderIcon(name, {size, color, skin, hair, title})  -> standalone <svg> string
//   iconBody(name, opts)             -> <g> markup in the 64x64 box, for composing into other drawings
//   hasIcon(name), ICON_CATEGORIES
//
// `color` replaces the icon's main fill (hex). `skin` / `hair` (hex or index 0-5 / 0-6) apply to people icons.
// Icons are decorative unless `title` is given (then role="img" with a <title>).
import { HAIR, INK, SKIN, light, shade } from "./icons/dsl.js";
import animals from "./icons/animals.js";
import plants from "./icons/plants.js";
import weather from "./icons/weather.js";
import school from "./icons/school.js";
import food from "./icons/food.js";
import body from "./icons/body.js";
import community from "./icons/community.js";
import science from "./icons/science.js";
import shapes from "./icons/shapes.js";
import tools from "./icons/tools.js";
import arrows from "./icons/arrows.js";
import transport from "./icons/transport.js";
import arts from "./icons/arts.js";
import math from "./icons/math.js";
import ui from "./icons/ui.js";
import people from "./icons/people.js";
import baltimore from "./icons/baltimore.js";

const SETS = [animals, plants, weather, school, food, body, community, science, shapes, tools, arrows, transport, arts, math, ui, people, baltimore];

export const ICON_CATEGORIES = [
  "animals",
  "plants",
  "weather",
  "school",
  "food",
  "body",
  "community",
  "science",
  "shapes",
  "tools",
  "arrows",
  "transport",
  "sports",
  "arts",
  "math",
  "ui",
  "people",
  "baltimore",
];

const REGISTRY = new Map();
for (const set of SETS) {
  for (const e of set) {
    if (REGISTRY.has(e.name)) throw new Error(`icons: duplicate icon name "${e.name}"`);
    REGISTRY.set(e.name, e);
  }
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const hasIcon = (name) => REGISTRY.has(name);

export function listIcons() {
  return [...REGISTRY.values()].map((e) => ({
    name: e.name,
    category: e.category,
    keywords: [e.name.replace(/-/g, " "), e.category, ...e.keywords.split(/\s+/)].filter(Boolean),
  }));
}

function tone(value, list, what) {
  if (value == null) return undefined;
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0 || value >= list.length)
      throw new Error(`icons: ${what} index must be 0-${list.length - 1}, got ${value}`);
    return list[value];
  }
  if (!HEX.test(value))
    throw new Error(
      `icons: ${what} must be a #rrggbb colour or an index, got ${JSON.stringify(value)}`,
    );
  return value;
}

/** The icon's drawing as a <g> in the 64x64 box (outline settings are on the group). */
export function iconBody(name, opts = {}) {
  const e = REGISTRY.get(name);
  if (!e)
    throw new Error(`icons: unknown icon "${name}". Use listIcons() for the available names.`);
  const main = opts.color == null ? e.main : tone(opts.color, [], "color");
  const c = {
    m: main,
    d: shade(main, 0.28),
    l: light(main, 0.4),
    skin: tone(opts.skin, SKIN, "skin") || SKIN[2],
    hair: tone(opts.hair, HAIR, "hair") || HAIR[0],
  };
  return `<g stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${e.draw(c)}</g>`;
}

export function renderIcon(name, { size = 64, color, skin, hair, title } = {}) {
  if (!Number.isFinite(size) || size <= 0)
    throw new Error(`icons: size must be a positive number, got ${size}`);
  const body = iconBody(name, { color, skin, hair });
  const a11y = title
    ? `role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>`
    : 'aria-hidden="true" focusable="false">';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" ${a11y}${body}</svg>`;
}
