/**
 * The Family Math Studio icon system on a generated page: ONE inline sprite per page (the symbols the
 * page uses, cut from assets/design/family/art/icons.svg) and an `icon()` helper that draws one.
 * Icons are decorative (aria-hidden); a control that has only an icon gets its name from aria-label.
 *
 * Adding an icon to a page means adding its id to PAGE_ICONS: a symbol that is used but not listed
 * is a build failure (iconUse throws), so no `<use>` can point at nothing.
 */
import { readFileSync } from "node:fs";

const SPRITE_URL = new URL("../../assets/design/family/art/icons.svg", import.meta.url);

/** Symbols every homework page carries. The hero and top bar use all of them. */
export const PAGE_ICONS = [
  "home",
  "globe",
  "grownup",
  "text-size",
  "speaker",
  "save",
  "more",
  "close",
  "check",
  "unlock",
  "lab",
  "game",
  "eye",
  "star",
  "hint",
  "pencil",
  "question",
  "print",
  "share",
  "book",
  "map",
  "kitchen",
  "ticket",
  "price-tag",
  "receipt",
  "scoreboard",
  "arrow-next",
];

let cache;
function sprite() {
  if (cache) return cache;
  const svg = readFileSync(SPRITE_URL, "utf8");
  const style = /<defs>[\s\S]*?<\/defs>/.exec(svg)?.[0] ?? "";
  const symbols = new Map(
    [...svg.matchAll(/<symbol id="(fi-[a-z0-9-]+)"[\s\S]*?<\/symbol>/g)].map((m) => [m[1], m[0]]),
  );
  cache = { style, symbols };
  return cache;
}

/** The sprite for a page: one hidden <svg> holding the style block and each listed symbol once. */
export function renderIconSprite(ids = PAGE_ICONS) {
  const { style, symbols } = sprite();
  const body = ids.map((id) => {
    const symbol = symbols.get(`fi-${id}`);
    if (!symbol)
      throw new Error(`family icon "${id}" is not in assets/design/family/art/icons.svg`);
    return symbol;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" class="fm-sprite" aria-hidden="true" focusable="false">${style}${body.join("")}</svg>`;
}

/** One decorative icon. `size` is "", "sm" or "lg". */
export function icon(id, size = "") {
  if (!PAGE_ICONS.includes(id)) throw new Error(`family icon "${id}" is not in PAGE_ICONS`);
  const cls = size ? `fm-icon fm-icon--${size}` : "fm-icon";
  return `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#fi-${id}"/></svg>`;
}
