import { buildGradePathway, buildMoveAtlas, buildPathwayIndex } from "../../_lib/bcpss/pathways.js";
import { badRequest, handler, json } from "../../_lib/http.js";

// Curriculum data only (no student or teacher data): derived from the canonical seed, so it is
// identical for every caller and safe to cache at the edge for an hour.
const CACHE = { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };

export const onRequest = handler({
  methods: ["GET"],
  async handle({ request }) {
    const params = new URL(request.url).searchParams;
    const view = params.get("view");
    if (view === "atlas") return json(buildMoveAtlas(), 200, CACHE);
    if (params.has("grade")) {
      const pathway = buildGradePathway(params.get("grade"));
      return pathway ? json(pathway, 200, CACHE) : badRequest("grade must be K or 1-8");
    }
    if (view && view !== "index") return badRequest("view must be index or atlas");
    return json(buildPathwayIndex(), 200, CACHE);
  },
});
