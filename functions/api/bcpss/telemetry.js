import { recordTelemetry, TELEMETRY_EVENT_TYPES } from "../../_lib/bcpss/db.js";
import { badRequest, handler, json } from "../../_lib/http.js";

// Strictly FERPA-safe anonymous usage telemetry (ZERO PII, no user IDs, no IPs).
export const onRequest = handler({
  methods: ["POST"],
  async handle({ body, env }) {
    const unit_id = typeof body?.unit_id === "string" ? body.unit_id.trim() : "";
    const wida_tier = typeof body?.wida_tier === "string" ? body.wida_tier.trim() : "";
    const event_type = typeof body?.event_type === "string" ? body.event_type.trim() : "";

    if (!unit_id || !/^[a-zA-Z0-9_-]{2,80}$/.test(unit_id)) {
      return badRequest("unit_id is required and must be a valid unit identifier.");
    }
    if (!wida_tier || wida_tier.length > 40) {
      return badRequest("wida_tier is required (1 to 40 characters).");
    }
    if (!TELEMETRY_EVENT_TYPES.includes(event_type)) {
      return badRequest(`event_type must be one of: ${TELEMETRY_EVENT_TYPES.join(", ")}.`);
    }

    const { backend } = await recordTelemetry(env, { unit_id, wida_tier, event_type });
    return json({ ok: true }, 202, {
      "X-BCPSS-Backend": backend,
      "Cache-Control": "no-store",
    });
  },
});
