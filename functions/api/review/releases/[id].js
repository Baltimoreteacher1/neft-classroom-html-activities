/* GET /api/review/releases/:id — one release with its full manifest (block id -> content hash). */
import { handler } from "../../../_lib/http.js";
import { reviewRoute } from "../../../_lib/review/endpoint.js";
import { releaseDetail } from "../../../_lib/review/service-read.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["GET"],
    handle: ({ env, params }) => releaseDetail({ db: env.DB, id: String(params.id) }),
  }),
);
