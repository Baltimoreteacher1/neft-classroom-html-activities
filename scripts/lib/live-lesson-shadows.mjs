/**
 * A redirect must not 301 a path that is already a live lesson.
 *
 * After the 2026-08-10 Reveal-TOC renumber, routes.json kept "old id → new id"
 * rules. The small-group generator later recreated variants at the NOW-canonical
 * numbers, so `/lessons/7-1` is a real integers lesson while the redirect still
 * sends that URL to `/lessons/8-1/` (equations). Cloudflare only honours the
 * first 100 `_redirects` rules and the middleware only replays the map on 404,
 * so this is latent — until a rule slides into the first 100 or the folder is
 * deleted, at which point students are misrouted.
 */
export function liveLessonShadows(redirects, lessonExists) {
  const hits = [];
  for (const r of redirects || []) {
    const m = String(r.source || "").match(/^\/lessons\/([^/]+?)(?:\/\*)?$/);
    if (!m) continue;
    const id = m[1];
    if (!lessonExists(id)) continue;
    const destId = String(r.destination || "")
      .replace(/^\/lessons\//, "")
      .replace(/\/.*$/, "");
    if (destId && destId !== id) {
      hits.push({ source: r.source, destination: r.destination, id, destId });
    }
  }
  return hits;
}
