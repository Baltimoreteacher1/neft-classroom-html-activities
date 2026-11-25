import { etagOf, matchesEtag, parseFields, selectFields } from "../../../_lib/bcpss/conditional.js";
import { getUnitDetail } from "../../../_lib/bcpss/db.js";
import { badRequest, handler, json, notFound } from "../../../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  async handle({ params, env, request }) {
    const unitId = String(params?.unitId || "").trim();
    if (!unitId || !/^[a-zA-Z0-9_-]{2,80}$/.test(unitId)) {
      return badRequest("Invalid unitId parameter.");
    }

    const { backend, detail } = await getUnitDetail(env, unitId);
    if (!detail) {
      return notFound(`Unit "${unitId}" not found.`);
    }

    const { fields, error } = parseFields(new URL(request.url).searchParams.get("fields"), detail);
    if (error) return badRequest(error);
    const body = fields ? selectFields(detail, fields) : detail;
    const etag = await etagOf(body);
    const headers = {
      "X-BCPSS-Backend": backend,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      ETag: etag,
      Vary: "Accept-Encoding",
    };
    if (matchesEtag(request.headers.get("If-None-Match"), etag))
      return new Response(null, { status: 304, headers });
    return json(body, 200, headers);
  },
});
