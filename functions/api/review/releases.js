/* GET  /api/review/releases            list releases (newest first, without manifests)
 * POST /api/review/releases { reviewer, verifiersRan: [name] }
 *      snapshot every block's content hash as a new release (content-YYYY.M.N), changelog vs the current
 *      release, and make it current. Teacher gate. */

import { VERIFIER_NAME_RE, VERIFIERS_MAX } from "../../../shared/content-schema/review-rules.js";
import { handler } from "../../_lib/http.js";
import { indexRows } from "../../_lib/review/blocks.js";
import { DecisionError, humanReviewer } from "../../_lib/review/decide.js";
import { allowFields, reviewRoute } from "../../_lib/review/endpoint.js";
import { createRelease, listReleases } from "../../_lib/review/release-store.js";
import { todayOf } from "../../_lib/review/service-decide.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["GET", "POST"],
    maxBodyBytes: 4096,
    async handle({ request, env, body }) {
      if (request.method === "GET") {
        const releases = (await listReleases(env.DB)).map(
          ({ changelog_json: c, verifiers_ran_json: v, ...r }) => ({
            ...r,
            changelog: JSON.parse(c).counts,
            verifiers_ran: JSON.parse(v),
          }),
        );
        return { ok: true, releases };
      }
      allowFields(body, ["reviewer", "verifiersRan"]);
      const now = Date.now();
      const who = humanReviewer(body?.reviewer, todayOf(now));
      const ran = body?.verifiersRan;
      if (
        !Array.isArray(ran) ||
        ran.length > VERIFIERS_MAX ||
        !ran.every((n) => typeof n === "string" && VERIFIER_NAME_RE.test(n))
      ) {
        throw new DecisionError(
          "verifiers-invalid",
          `verifiersRan must be an array of up to ${VERIFIERS_MAX} verifier names`,
          400,
        );
      }
      const release = await createRelease(env.DB, {
        rows: await indexRows(),
        verifiersRan: [...new Set(ran)].sort(),
        createdBy: who.name,
        now,
      });
      return { ok: true, release };
    },
  }),
);
