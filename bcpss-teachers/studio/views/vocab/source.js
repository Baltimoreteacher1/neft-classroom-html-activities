// Data access for the vocabulary views, through shell.catalog. Failures are returned, never thrown into the page.
export async function loadCollections(shell) {
  const items = await shell.catalog.byKind("vocab");
  const settled = await Promise.allSettled(items.map((it) => shell.catalog.vocab(it.id)));
  const collections = [];
  const failed = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value?.entries) collections.push(r.value);
    else failed.push(items[i].id);
  });
  return { collections, failed };
}

/** Activities a collection references that actually exist, with the engine that runs them. */
export async function launchableActivities(shell, collection) {
  const ids = collection.activities || [];
  const found = await Promise.allSettled(ids.map((id) => shell.catalog.activity(id)));
  return found
    .map((r, i) => (r.status === "fulfilled" && r.value ? { id: ids[i], engine: r.value.engine, title: r.value.title || ids[i] } : null))
    .filter(Boolean);
}

export const ENGINE_VERB = {
  "vocab-quest": "Vocabulary Quest",
  "visual-match": "Visual Match Lab",
  "concept-builder": "Concept Builder",
  "language-detective": "Language Detective",
  "conversation-studio": "Conversation Studio",
  "early-sort": "Little Learners Studio",
};

export const collectionHref = (id, sub = "", query = {}) => {
  const q = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== "" && v != null && v !== false)).toString();
  return `#/vocab/${encodeURIComponent(id)}${sub ? `/${sub}` : ""}${q ? `?${q}` : ""}`;
};

/** Absolute student-facing link (no teacher notes). */
export const studentUrl = (id, sub = "wall") =>
  `${location.origin}${location.pathname}${collectionHref(id, sub, { student: 1 })}`;
