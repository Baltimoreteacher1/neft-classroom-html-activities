// Interactive math graphics registry. Each kind lives in graphics/<kind>.js and exports
// `mount(container, config) -> handle` synchronously. Owners: agent "graphics-a" (first six), "graphics-b" (rest).
// One explicit loader per kind. A template import (`./${kind}.js`) makes the bundler glob every sibling,
// which includes this file and fires INEFFECTIVE_DYNAMIC_IMPORT; named imports keep each chunk statically known.
const GRAPHIC_LOADERS = Object.freeze({
  "fraction-model": () => import("./fraction-model.js"),
  "number-line": () => import("./number-line.js"),
  "place-value": () => import("./place-value.js"),
  "array": () => import("./array.js"),
  "area-model": () => import("./area-model.js"),
  "ratio-table": () => import("./ratio-table.js"),
  "double-number-line": () => import("./double-number-line.js"),
  "coordinate-grid": () => import("./coordinate-grid.js"),
  "geometry": () => import("./geometry.js"),
  "solids-nets": () => import("./solids-nets.js"),
  "decimal-percent": () => import("./decimal-percent.js"),
  "stats-display": () => import("./stats-display.js"),
});
export const GRAPHIC_KINDS = Object.freeze(Object.keys(GRAPHIC_LOADERS));

// config: { mode: "explore" | "build" | "check", lang: "en" | "es", label, target, onChange(state), ...kind options }
// handle: { kind, getState(), setState(state), describe(), destroy() }
//   getState() is plain JSON (fractions as {n, d}, never floats), setState() restores it exactly,
//   describe() returns the plain-language description a screen reader should hear for the current state.
export async function mountGraphic(kind, container, config = {}) {
  if (!GRAPHIC_KINDS.includes(kind)) throw new Error(`Unknown graphic kind: ${kind}`);
  const module = await GRAPHIC_LOADERS[kind]();
  return module.mount(container, config);
}

const ANIMATION_LOADERS = Object.freeze({
  "fraction-equivalence": () => import("./animations/fraction-equivalence.js"),
  "fraction-addition": () => import("./animations/fraction-addition.js"),
  "regrouping": () => import("./animations/regrouping.js"),
  "multiplication-grouping": () => import("./animations/multiplication-grouping.js"),
  "ratio-scaling": () => import("./animations/ratio-scaling.js"),
  "coordinate-movement": () => import("./animations/coordinate-movement.js"),
  "area-decomposition": () => import("./animations/area-decomposition.js"),
  "transformation": () => import("./animations/transformation.js"),
});
export const ANIMATION_KINDS = Object.freeze(Object.keys(ANIMATION_LOADERS));

// Owner: agent "animations". handle: { kind, play(), pause(), step(delta), restart(), destroy() }.
// Reduced motion shows the finished frame with Next/Back step buttons and never autoplays.
export async function playAnimation(kind, container, config = {}) {
  if (!ANIMATION_KINDS.includes(kind)) throw new Error(`Unknown animation kind: ${kind}`);
  const module = await ANIMATION_LOADERS[kind]();
  return module.play(container, config);
}
