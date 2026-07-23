// small-group-standards.js — resolve a standard code (e.g. "6.NOS.4") to its
// full descriptive wording from the canonical registry, so studios can show
// what the code *means* instead of a bare badge. Best-effort: one cached
// fetch per page; every failure path resolves to null and the UI keeps the
// code-only display it already has.

let registryPromise = null;

function loadRegistry() {
  if (!registryPromise) {
    registryPromise = fetch("/data/ccss-standards.json", { credentials: "omit" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data?.standards || null)
      .catch(() => null);
  }
  return registryPromise;
}

/** → { code, shortLabel, fullText } or null. */
export async function resolveStandard(code) {
  if (!code) return null;
  const registry = await loadRegistry();
  const entry = registry?.[code];
  if (!entry?.fullText) return null;
  return { code, shortLabel: entry.shortLabel || "", fullText: entry.fullText };
}

export default resolveStandard;
