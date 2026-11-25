/* GET /api/review/verify — recompute every digest in the review log and check the chain links. A row that
 * was edited or removed outside the API shows up here. Teacher gate. */
import { handler } from "../../_lib/http.js";
import { reviewRoute } from "../../_lib/review/endpoint.js";
import { verifyLog } from "../../_lib/review/service-read.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["GET"],
    handle: ({ env }) => verifyLog({ db: env.DB }),
  }),
);
