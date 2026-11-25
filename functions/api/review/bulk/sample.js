/* POST /api/review/bulk/sample { items, reviewer: { name } } — for more than 10 items, the server picks 3 at
 * random and signs a token over (the item set, the sample, the reviewer, an expiry). */
import { handler } from "../../../_lib/http.js";
import { reviewRoute } from "../../../_lib/review/endpoint.js";
import { requestSample } from "../../../_lib/review/service-decide.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["POST"],
    maxBodyBytes: 32_768,
    handle: ({ body, env }) =>
      requestSample({ body: body ?? {}, secret: env.TEACHER_KEY, now: Date.now() }),
  }),
);
