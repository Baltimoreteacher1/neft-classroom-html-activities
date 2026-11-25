/* GET /api/review/summary[?unit=<unitId>] — the badge a unit or lesson card shows: draft / in_review /
 * reviewed (retired is possible). Aggregate states and counts only: no content, no reviewer names, no
 * comments, so it needs no key and is cached for a minute. Everything else under /api/review is gated. */
import { handler, json } from "../../_lib/http.js";
import { reviewRoute } from "../../_lib/review/endpoint.js";
import { summary } from "../../_lib/review/service-read.js";
import { isMissingTable } from "../../_lib/review/store.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["GET"],
    open: true,
    rateLimit: { max: 120, ipMax: 600, windowMs: 60_000 },
    async handle({ request, env }) {
      try {
        const out = await summary({ db: env.DB, params: new URL(request.url).searchParams });
        return json(out, 200, { "Cache-Control": "public, max-age=60" });
      } catch (err) {
        if (isMissingTable(err)) {
          return json(
            { ok: true, available: false, state: null, blocks: [], units: null },
            200,
            { "Cache-Control": "public, max-age=60" },
          );
        }
        throw err;
      }
    },
  }),
);
