import { getFamilyCard } from "../../../_lib/bcpss/db.js";
import { badRequest, handler, json, notFound } from "../../../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  async handle({ params, env }) {
    const unitId = String(params?.unitId || "").trim();
    if (!unitId || !/^[a-zA-Z0-9_-]{2,80}$/.test(unitId)) {
      return badRequest("Invalid unitId parameter.");
    }

    const { backend, unit, family_card } = await getFamilyCard(env, unitId);
    if (!unit || !family_card) {
      return notFound(`Family card for unit "${unitId}" not found.`);
    }

    return json({ unit, family_card }, 200, {
      "X-BCPSS-Backend": backend,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    });
  },
});
