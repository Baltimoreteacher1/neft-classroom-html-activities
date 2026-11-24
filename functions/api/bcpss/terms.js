import { getTerm, searchTerms } from "../../_lib/bcpss/terms.js";
import { badRequest, handler, json, notFound } from "../../_lib/http.js";

const BANDS = new Set(["K-2", "3-5", "6-8"]);

export const onRequest = handler({
  methods: ["GET"],
  async handle({ request }) {
    const url = new URL(request.url);
    const id = (url.searchParams.get("id") || "").trim();
    const cache = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" };
    if (id) {
      if (!/^[a-z0-9-]{2,60}$/.test(id)) return badRequest("Invalid id parameter.");
      const term = getTerm(id);
      return term ? json(term, 200, cache) : notFound(`Term "${id}" not found.`);
    }
    const band = (url.searchParams.get("band") || "").trim();
    if (band && !BANDS.has(band)) return badRequest("band must be K-2, 3-5 or 6-8.");
    const unit = (url.searchParams.get("unit") || "").trim();
    if (unit && !/^[a-z0-9-]{2,40}$/.test(unit)) return badRequest("Invalid unit parameter.");
    const limit = Number(url.searchParams.get("limit") || 50);
    if (!Number.isInteger(limit) || limit < 1)
      return badRequest("limit must be a positive integer.");
    return json(searchTerms({ q: url.searchParams.get("q") || "", unit, band, limit }), 200, cache);
  },
});
