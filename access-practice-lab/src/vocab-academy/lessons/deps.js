// Vocabulary Academy lessons — sibling modules written by other owners, loaded lazily so a missing one produces a
// clear "not ready" state instead of a blank page. Tests and harnesses may inject replacements with setDeps().
const LOADERS = {
  data: () => import("../data.js"),
  store: () => import("../store.js"),
  model: () => import("../model.js"),
  supports: () => import("../supports.js"),
  activities: () => import("../activities/index.js"),
  art: () => import("../art.js"),
  session: () => import("../session.js"),
};
/** Without these a lesson cannot run at all; the rest degrade gracefully. */
export const REQUIRED = ["data", "store", "model"];

let injected = null;
let cache = null;

export const setDeps = (mods) => {
  injected = mods;
  cache = null;
};

export async function loadDeps() {
  if (cache) return cache;
  const names = Object.keys(LOADERS);
  const settled = await Promise.all(
    names.map(async (name) => {
      if (injected && name in injected) return injected[name];
      try {
        return await LOADERS[name]();
      } catch {
        return null;
      }
    }),
  );
  const deps = Object.fromEntries(names.map((n, i) => [n, settled[i]]));
  deps.missing = names.filter((n) => !deps[n]);
  deps.ready = REQUIRED.every((n) => deps[n]);
  // Cache only a complete load so a module that lands later is picked up on the next render.
  if (!deps.missing.length) cache = deps;
  return deps;
}
