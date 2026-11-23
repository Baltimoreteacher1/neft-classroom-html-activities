import { buildFamilyGuide } from "../../../_lib/bcpss/family-guide.js";
import { badRequest, handler, json, notFound } from "../../../_lib/http.js";

// Curriculum data only (no student data), derived from the canonical seed: safe to edge-cache.
export const onRequest = handler({
  methods: ["GET"],
  async handle({ params }) {
    const unitId = String(params?.unitId || "").trim();
    if (!/^[a-zA-Z0-9_-]{2,80}$/.test(unitId)) return badRequest("Invalid unitId parameter.");
    const guide = buildFamilyGuide(unitId);
    return guide
      ? json(guide, 200, { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" })
      : notFound("unit not found");
  },
});
