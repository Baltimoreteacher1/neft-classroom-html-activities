// Loads the sources the site search reads (content index, glossary, home registry, studios, journey units) once,
// builds the index and the Spanish/English bridge, and hands them to the palette and the /search page.
import { loadGlossary, loadIndex } from "./content.js";
import { HOME_CARDS } from "./home-registry.js";
import { UNITS } from "./journey/curriculum.js";
import { buildBridge, buildDocs } from "./lang/site-search.js";
import { STUDIOS } from "./studios.js";

let pending = null;

/** { docs, bridge }. A source that fails to load is left out; the search still works on the rest. */
export function loadSearch() {
  pending ||= (async () => {
    const [index, glossary] = await Promise.all([loadIndex().catch(() => null), loadGlossary().catch(() => null)]);
    const docs = buildDocs({ index, glossary, cards: HOME_CARDS, studios: STUDIOS, units: UNITS, tests: index?.tests || [] });
    return { docs, bridge: buildBridge(glossary) };
  })();
  pending.catch(() => {
    pending = null;
  });
  return pending;
}
