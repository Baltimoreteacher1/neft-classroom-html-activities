// Live review state for the provenance chips. The chips always render from what the content says about itself
// (static); this overlays the review API's aggregate badge (GET /api/review/summary?unit=, no key, no names) when
// it can be reached. It only reads. Nothing here writes a review state: the only writer is a reviewer's own
// decision in the Studio queue. If the API is absent (migration not applied, offline) the chips stay as rendered.
import { effectiveBadge, provenanceChipHtml } from "../shared/bcpss-provenance.js";

const cache = new Map(); // unitId -> { state, blocks: { id: badge } } | null

/** Loads and caches the unit's summary. Resolves to the summary or null; never rejects. */
export async function primeLive(unitId, fetchImpl = globalThis.fetch) {
  if (!unitId) return null;
  if (cache.has(unitId)) return cache.get(unitId);
  let out = null;
  try {
    const res = await fetchImpl(`/api/review/summary?unit=${encodeURIComponent(unitId)}`, {
      headers: { Accept: "application/json" },
    });
    const body = res.ok ? await res.json() : null;
    if (body?.state && Array.isArray(body.blocks))
      out = { state: body.state, blocks: Object.fromEntries(body.blocks.map((b) => [b.id, b.badge])) };
  } catch {
    out = null;
  }
  cache.set(unitId, out);
  return out;
}

const unitOf = (blockId) => blockId.replace(/-l\d{2}$|:studio$/, "");

/** The live badge for a unit (blockId empty) or one lesson block; null when unknown. */
export function liveState(unitId, blockId = "") {
  const live = cache.get(blockId ? unitOf(blockId) : unitId);
  if (!live) return null;
  return blockId ? (live.blocks[blockId] ?? null) : live.state;
}

/** Chip HTML for a unit or a lesson block, already merged with whatever live state is cached. */
export function chipHtml(staticState, { unitId = "", blockId = "" } = {}) {
  const state = effectiveBadge(staticState, liveState(unitId, blockId));
  return provenanceChipHtml(state, { blockId, scope: blockId ? "lesson" : "unit", staticState });
}

/** A chip element (for modules that build DOM rather than strings). */
export function chipEl(staticState, opts) {
  const tpl = document.createElement("template");
  tpl.innerHTML = chipHtml(staticState, opts);
  return tpl.content.firstElementChild;
}

/** Re-evaluates every chip under `root` against the cache. Call after primeLive resolves. */
export function refreshChips(root, unitId = "") {
  for (const el of root.querySelectorAll(".prov-chip[data-prov-static]")) {
    const blockId = el.dataset.provBlock || "";
    const fresh = document.createElement("template");
    fresh.innerHTML = chipHtml(el.dataset.provStatic, { unitId, blockId });
    const next = fresh.content.firstElementChild;
    el.dataset.provenance = next.dataset.provenance;
    el.title = next.title;
    el.textContent = next.textContent;
  }
}

/** Test hook. */
export const _resetLiveCache = () => cache.clear();
