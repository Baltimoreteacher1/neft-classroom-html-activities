/* GET /api/review/releases/current[?drift=1] — the release the pointer names, with its changelog and the
 * verifiers that ran. drift=1 also counts live blocks added, removed or changed since that release. */
import { handler } from "../../../_lib/http.js";
import { reviewRoute } from "../../../_lib/review/endpoint.js";
import { currentWithDrift } from "../../../_lib/review/service-read.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["GET"],
    handle: ({ request, env }) =>
      currentWithDrift({
        db: env.DB,
        drift: new URL(request.url).searchParams.get("drift") === "1",
      }),
  }),
);
