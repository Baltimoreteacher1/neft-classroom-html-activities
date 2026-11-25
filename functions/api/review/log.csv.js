/* GET /api/review/log.csv[?afterSeq=&limit=] — the review log as tight CSV (header + one line per event,
 * snapshots excluded). X-Next-After-Seq is set when more rows remain. Teacher gate. */

import { handler, JSON_HEADERS } from "../../_lib/http.js";
import { reviewRoute } from "../../_lib/review/endpoint.js";
import { logExport } from "../../_lib/review/service-read.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["GET"],
    async handle({ request, env }) {
      const { csv, next } = await logExport({
        db: env.DB,
        params: new URL(request.url).searchParams,
      });
      const headers = {
        ...JSON_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="review-log.csv"',
      };
      if (next !== null) headers["X-Next-After-Seq"] = String(next);
      return new Response(csv, { headers });
    },
  }),
);
