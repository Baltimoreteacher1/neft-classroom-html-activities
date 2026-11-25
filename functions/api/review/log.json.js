/* GET /api/review/log.json[?afterSeq=&limit=] — the review log as JSON (schema ewl-review-log/1): the same columns
 * and rows as log.csv, snapshots excluded, `next_after_seq` set when more rows remain. Teacher gate. */

import { handler, JSON_HEADERS } from "../../_lib/http.js";
import { reviewRoute } from "../../_lib/review/endpoint.js";
import { logExportJson } from "../../_lib/review/service-read.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["GET"],
    async handle({ request, env }) {
      const doc = await logExportJson({ db: env.DB, params: new URL(request.url).searchParams });
      return new Response(JSON.stringify(doc), {
        headers: {
          ...JSON_HEADERS,
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": 'attachment; filename="review-log.json"',
        },
      });
    },
  }),
);
