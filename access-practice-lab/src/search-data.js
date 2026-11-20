// Loads the sources the site search reads (content index, glossary, home registry, studios, journey units and the
// sitemap's destinations, which bring the Resource Finder's packets, handouts and hub sections with them) once,
// builds the index and the Spanish/English bridge, and hands them to the palette and the /search page.
import { loadGlossary, loadIndex } from "./content.js";
import { HOME_CARDS } from "./home-registry.js";
import { UNITS } from "./journey/curriculum.js";
import { buildBridge, buildDocs } from "./lang/site-search.js";
import { STUDIO_APP_PAGES } from "./studio-app.js";
import { DESTINATIONS } from "./sitemap.js";
import { STUDIOS } from "./studios.js";
import { BASE } from "./util.js";

let pending = null;

/** { docs, bridge }. A source that fails to load is left out; the search still works on the rest. */
export function loadSearch() {
  pending ||= (async () => {
    const [index, glossary, finderMetadata] = await Promise.all([
      loadIndex().catch(() => null),
      loadGlossary().catch(() => null),
      fetch(`${BASE}/content/finder-metadata.json`).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]);
    const docs = buildDocs({ index, glossary, cards: HOME_CARDS, studios: STUDIOS, studioApp: STUDIO_APP_PAGES, units: UNITS, tests: index?.tests || [], destinations: DESTINATIONS, activityMetadata: finderMetadata?.activities || {} });
    return { docs, bridge: buildBridge(glossary) };
  })();
  pending.catch(() => {
    pending = null;
  });
  return pending;
}
