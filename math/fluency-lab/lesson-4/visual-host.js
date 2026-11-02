// Mounts an interactive graphic (graphics/registry.js) or an animation over an always-working fallback.
// The graphics and animation modules are built separately, so every import is guarded: when a kind is missing, throws,
// or draws nothing, the fallback (the exact model visual-lab.js already draws, or a step-through) stays on screen.
import { ANIMATION_KINDS, GRAPHIC_KINDS, mountGraphic, playAnimation } from "../graphics/registry.js";

// The registry is the source of truth for available kinds. A declared kind whose module has not shipped yet still
// falls back cleanly: attach() catches its dynamic-import failure without logging to the console. Keeping discovery
// independent of Vite's import.meta.glob lets this module load in Node-based tests too.
const FILES = new Set([
  ...GRAPHIC_KINDS.map((kind) => `../graphics/${kind}.js`),
  ...ANIMATION_KINDS.map((kind) => `../graphics/animations/${kind}.js`),
]);
const exists = (path) => FILES.has(path);

// slot: element holding `.ml-fallback` (shown by default) and `.ml-live` (hidden until the module mounts).
// Returns a cleanup function. `loader` is mountGraphic or playAnimation.
function attach(slot, loader, kind, config, { onMount } = {}) {
  const live = slot.querySelector(".ml-live");
  const fallback = slot.querySelector(".ml-fallback");
  let handle = null;
  let gone = false;
  if (!kind || !live) return () => {};
  (async () => {
    try {
      const mounted = await loader(kind, live, config);
      if (gone) return mounted?.destroy?.();
      if (!mounted || !live.childElementCount) throw new Error("empty");
      handle = mounted;
      live.hidden = false;
      if (fallback) fallback.hidden = true;
      slot.dataset.source = kind;
      onMount?.(mounted);
    } catch {
      live.replaceChildren();
      live.hidden = true;
      if (fallback) fallback.hidden = false;
      slot.dataset.source = "fallback";
    }
  })();
  return () => {
    gone = true;
    try {
      handle?.destroy?.();
    } catch {
      /* the module is already gone */
    }
  };
}

export const attachGraphic = (slot, kind, config, hooks) => attach(slot, mountGraphic, exists(`../graphics/${kind}.js`) ? kind : null, config, hooks);
export const attachAnimation = (slot, kind, config, hooks) => attach(slot, playAnimation, exists(`../graphics/animations/${kind}.js`) ? kind : null, config, hooks);
