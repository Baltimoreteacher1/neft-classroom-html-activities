import { getUnitDetail } from "../../../_lib/bcpss/db.js";
import { badRequest, handler, json, notFound } from "../../../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  async handle({ params, env }) {
    const unitId = String(params?.unitId || "").trim();
    if (!unitId || !/^[a-zA-Z0-9_-]{2,80}$/.test(unitId)) {
      return badRequest("Invalid unitId parameter.");
    }

    const { backend, detail } = await getUnitDetail(env, unitId);
    if (!detail) {
      return notFound(`Unit "${unitId}" not found.`);
    }

    return json(detail, 200, {
      "X-BCPSS-Backend": backend,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    });
  },
});
