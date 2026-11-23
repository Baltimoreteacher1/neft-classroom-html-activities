import { getInsights } from "../../_lib/bcpss/db.js";
import { handler, json } from "../../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  async handle({ env }) {
    const defaultBackend = env?.DATABASE_URL ? "neon" : env?.DB ? "d1" : "memory";
    const insights = await getInsights(env);
    return json(insights, 200, {
      "X-BCPSS-Backend": insights.backend || defaultBackend,
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    });
  },
});
