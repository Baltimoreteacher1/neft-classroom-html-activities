// Interactive math graphics registry. Each kind lives in graphics/<kind>.js and exports
// `mount(container, config) -> handle` synchronously. Owners: agent "graphics-a" (first six), "graphics-b" (rest).
export const GRAPHIC_KINDS = Object.freeze([
  "fraction-model",
  "number-line",
  "place-value",
  "array",
  "area-model",
  "ratio-table",
  "double-number-line",
  "coordinate-grid",
  "geometry",
  "solids-nets",
  "decimal-percent",
  "stats-display",
]);

// config: { mode: "explore" | "build" | "check", lang: "en" | "es", label, target, onChange(state), ...kind options }
// handle: { kind, getState(), setState(state), describe(), destroy() }
//   getState() is plain JSON (fractions as {n, d}, never floats), setState() restores it exactly,
//   describe() returns the plain-language description a screen reader should hear for the current state.
export async function mountGraphic(kind, container, config = {}) {
  if (!GRAPHIC_KINDS.includes(kind)) throw new Error(`Unknown graphic kind: ${kind}`);
  const module = await import(`./${kind}.js`);
  return module.mount(container, config);
}

export const ANIMATION_KINDS = Object.freeze([
  "fraction-equivalence",
  "fraction-addition",
  "regrouping",
  "multiplication-grouping",
  "ratio-scaling",
  "coordinate-movement",
  "area-decomposition",
  "transformation",
]);

// Owner: agent "animations". handle: { kind, play(), pause(), step(delta), restart(), destroy() }.
// Reduced motion shows the finished frame with Next/Back step buttons and never autoplays.
export async function playAnimation(kind, container, config = {}) {
  if (!ANIMATION_KINDS.includes(kind)) throw new Error(`Unknown animation kind: ${kind}`);
  const module = await import(`./animations/${kind}.js`);
  return module.play(container, config);
}
