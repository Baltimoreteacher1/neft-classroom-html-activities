/* POST /api/review/bulk { items: [{ blockId, dimension, lang? }], state, comment?, reviewer, sample? }
 * Up to 100 items in one transaction. More than 10 approvals need the server's random sample of 3, each
 * already reviewed individually (see bulk/sample.js). */
import { handler } from "../../_lib/http.js";
import { reviewRoute } from "../../_lib/review/endpoint.js";
import { bulkDecide } from "../../_lib/review/service-decide.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["POST"],
    maxBodyBytes: 32_768,
    handle: ({ env, body }) =>
      bulkDecide({ db: env.DB, body: body ?? {}, secret: env.TEACHER_KEY, now: Date.now() }),
  }),
);
