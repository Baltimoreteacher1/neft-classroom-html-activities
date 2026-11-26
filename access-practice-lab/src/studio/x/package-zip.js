// Which JSZip to use. The browser loads the vendored /card-builder/vendor/jszip.min.js (a global); a caller may also
// inject one (deps.JSZip). Only when neither exists (Node, tests) is the "jszip" package imported.

/** @param {object} [injected] a JSZip constructor, or nothing */
export async function getJSZip(injected) {
  const found = injected ?? globalThis.JSZip;
  if (found) return found;
  const mod = await import("jszip");
  return mod.default ?? mod;
}
