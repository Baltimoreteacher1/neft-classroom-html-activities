// Journey pages: the single import point for the route view and the lab home.
//   homeHTML(ctx, deps)              /journey          Continue My Journey (sync)
//   mapHTML(ctx, deps)               /journey/map      the trail of 4 units x 3 missions x 6 steps (sync)
//   overviewHTML(ctx, missionId, deps)  /journey/mNN   one mission at a glance (async: loads the growth section)
//   journeyHeroHTML(I, band, state, recommendation, opts)   the hero, also the first section of the lab home
// `deps` is { state, ledger, recommendation, reviews, band, I }; anything missing is read from the device
// (state.js, the ledger, recommend.js), so the runner may pass only what it already has.
import { journeyHeroHTML, homeHTML } from "./pages-hero.js";
import { mapHTML } from "./pages-map.js";
import { overviewHTML } from "./pages-overview.js";
import { loadJourneyData, resolveDeps } from "./pages-shared.js";

export { homeHTML, journeyHeroHTML, loadJourneyData, mapHTML, overviewHTML, resolveDeps };

/** After a page renders: bring a `#hash` target (a map node, "Before & After") into view. Safe to call on any render. */
export function mountPages(root = document) {
  const id = decodeURIComponent((typeof location === "undefined" ? "" : location.hash).slice(1));
  const target = id && root.querySelector?.(`[id="${CSS.escape(id)}"]`);
  if (target) target.scrollIntoView({ block: "start" });
}
