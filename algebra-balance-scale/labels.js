/**
 * Names for the misconception chip come from the shared taxonomy, not from this
 * game: data/misconception-labels.json is generated from engine/core/misconceptions.js
 * and is what the teacher heatmap reads. If the file cannot be fetched the chip is
 * simply left out; the coaching sentence still shows.
 */
const URL_PATH = "/data/misconception-labels.json";
let loaded;

export function loadLabels(fetchFn = globalThis.fetch) {
  loaded ??= Promise.resolve()
    .then(() => fetchFn(URL_PATH))
    .then((res) => (res.ok ? res.json() : { tags: {} }))
    .then((json) => json?.tags ?? {})
    .catch(() => ({}));
  return loaded;
}

/** "Did not undo the operation" / "No deshizo la operación", or null for an unknown tag. */
export function chipLabel(labels, tag, lang) {
  const entry = labels?.[tag];
  if (!entry) return null;
  return (lang === "es" ? entry.labelEs : entry.label) || entry.label || null;
}
