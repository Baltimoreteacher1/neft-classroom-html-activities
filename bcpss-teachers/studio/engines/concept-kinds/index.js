// Registry of concept-builder kinds. Kinds are loaded lazily in the browser; Node tests load them all with allKinds().
export const KIND_IDS = ["ratio-table", "number-line", "graph-line", "fraction-bar", "area-model", "label-diagram", "map-hotspots", "process-model", "timeline-sort", "scale-sort"];

export async function loadKind(id) {
  if (!KIND_IDS.includes(id)) throw new Error(`Unknown concept-builder kind "${id}"`);
  return (await import(`./${id}.js`)).default;
}

export async function allKinds() {
  return Object.fromEntries(await Promise.all(KIND_IDS.map(async (id) => [id, await loadKind(id)])));
}
