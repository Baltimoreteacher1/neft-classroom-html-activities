/* POST /api/review/releases/rollback { reviewer } — move the pointer back to the current release's previous
 * release, in one step. The release rows are never edited, so the manifest comes back byte for byte. */

import { handler } from "../../../_lib/http.js";
import { humanReviewer } from "../../../_lib/review/decide.js";
import { allowFields, reviewRoute } from "../../../_lib/review/endpoint.js";
import { rollback } from "../../../_lib/review/release-store.js";
import { todayOf } from "../../../_lib/review/service-decide.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["POST"],
    maxBodyBytes: 1024,
    async handle({ env, body }) {
      allowFields(body, ["reviewer"]);
      const now = Date.now();
      const who = humanReviewer(body?.reviewer, todayOf(now));
      return { ok: true, ...(await rollback(env.DB, { movedBy: who.name, now })) };
    },
  }),
);
