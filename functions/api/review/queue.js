/* GET /api/review/queue?grade=&subject=&unit=&dimension=&state=&olderThanDays=&verifier=&limit=&offset=
 * Blocks with their effective review state per dimension, age since last review activity and verifier
 * failure counts. Teacher gate: x-teacher-key (functions/_lib/review/endpoint.js). */
import { handler } from "../../_lib/http.js";
import { reviewRoute } from "../../_lib/review/endpoint.js";
import { queue } from "../../_lib/review/service-read.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["GET"],
    handle: ({ request, env }) =>
      queue({ db: env.DB, params: new URL(request.url).searchParams, now: Date.now() }),
  }),
);
