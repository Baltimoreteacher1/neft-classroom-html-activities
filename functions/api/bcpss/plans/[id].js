import { getSharedPlan } from "../../../_lib/bcpss/db.js";
import { badRequest, handler, json, notFound } from "../../../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  async handle({ params, env }) {
    const id = String(params?.id || "").trim();
    if (!id || !/^[a-zA-Z0-9_-]{4,40}$/.test(id)) {
      return badRequest("Invalid plan id.");
    }

    const { backend, result } = await getSharedPlan(env, id);
    if (!result) {
      return notFound(`Shared plan "${id}" not found.`);
    }

    return json(result, 200, {
      "X-BCPSS-Backend": backend,
      "Cache-Control": "no-store",
    });
  },
});
