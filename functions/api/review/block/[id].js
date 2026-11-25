/* GET /api/review/block/:id — the block as the server loads it now (content, provenance, effective review
 * state), the content that was last approved (for the side-by-side diff) and the recent decision history. */
import { handler } from "../../../_lib/http.js";
import { reviewRoute } from "../../../_lib/review/endpoint.js";
import { blockDetail } from "../../../_lib/review/service-read.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["GET"],
    handle: ({ env, params }) =>
      blockDetail({ db: env.DB, blockId: decodeURIComponent(String(params.id)) }),
  }),
);
