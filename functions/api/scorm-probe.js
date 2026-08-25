/**
 * /api/scorm-probe — the SCORM Runtime v2 reachability contract.
 *
 * When a Canvas SCORM package cannot get the lesson to render, "it didn't load"
 * is not a diagnosis anyone can act on. This endpoint is the discriminator the
 * wrapper uses to tell the failure classes apart:
 *
 *   fetch resolves with {ok:true}  → the student origin is PUBLIC and healthy,
 *                                    so the failure was the lesson itself
 *                                    (slow render, transient error) → TIMEOUT.
 *   fetch is blocked / rewritten   → something sits in front of the origin. The
 *                                    wrapper then re-probes with `no-cors` to
 *                                    separate "host unreachable" (LOAD) from
 *                                    "host reachable but intercepted" (ACCESS).
 *
 * That second case is the one this exists for. A hostname-wide Cloudflare
 * Access app once broke every Canvas SCORM assignment in production, and it
 * presented to a student as a blank iframe. See docs/cloudflare-access.md.
 *
 * The response carries nothing but the runtime contract — no student data, no
 * environment, no build secrets — because it is readable by anyone, by design:
 * it is a liveness signal for a page that runs inside someone else's LMS.
 */

import { handler } from "../_lib/http.js";
import { SCORM_PROTOCOL_VERSION, SCORM_RUNTIME_VERSION } from "../_lib/scorm-sco.js";

export const onRequest = handler({
  methods: ["GET", "OPTIONS"],
  rateLimit: { max: 120, windowMs: 60_000 },
  handle() {
    return {
      ok: true,
      service: "eduwonderlab-scorm-runtime",
      runtime: SCORM_RUNTIME_VERSION,
      protocol: SCORM_PROTOCOL_VERSION,
    };
  },
});
