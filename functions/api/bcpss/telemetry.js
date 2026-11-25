import {
  TELEMETRY_BODY_KEYS,
  TELEMETRY_EVENT_TYPES,
} from "../../../shared/bcpss-telemetry-schema.js";
import { recordTelemetry } from "../../_lib/bcpss/db.js";
import { badRequest, handler, json } from "../../_lib/http.js";
import { LIMITS, UNIT_ID_RE, WIDA_TIERS } from "../../_lib/security/schema.js";
import { registeredUnit } from "../../_lib/security/unit-registry.js";

// Strictly FERPA-safe anonymous usage telemetry (ZERO PII, no user IDs, no IPs, no free text).
// Every field is an enum or a registry lookup; the unit's grade is derived here, never accepted from the client.
// A device flagged `internal` (a teacher testing) is acknowledged but not stored, so it never inflates usage counts.
export const onRequest = handler({
  methods: ["POST"],
  requireObjectBody: true,
  ...LIMITS.telemetry,
  async handle({ body, env }) {
    const unexpected = Object.keys(body).filter((k) => !TELEMETRY_BODY_KEYS.includes(k));
    if (unexpected.length) return badRequest("unexpected field in telemetry body.");

    const unit_id = typeof body.unit_id === "string" ? body.unit_id.trim() : "";
    const wida_tier = typeof body.wida_tier === "string" ? body.wida_tier.trim() : "";
    const event_type = typeof body.event_type === "string" ? body.event_type.trim() : "";

    if (!UNIT_ID_RE.test(unit_id)) {
      return badRequest("unit_id is required and must be a valid unit identifier.");
    }
    if (!WIDA_TIERS.includes(wida_tier)) {
      return badRequest(`wida_tier must be one of: ${WIDA_TIERS.join(", ")}.`);
    }
    if (!TELEMETRY_EVENT_TYPES.includes(event_type)) {
      return badRequest(`event_type must be one of: ${TELEMETRY_EVENT_TYPES.join(", ")}.`);
    }
    if (body.internal !== undefined && typeof body.internal !== "boolean") {
      return badRequest("internal must be a boolean.");
    }
    const unit = registeredUnit(unit_id);
    if (!unit) return json({ ok: false, error: "unit_id is not a registered unit." }, 422);
    if (body.internal === true) {
      return json({ ok: true, recorded: false }, 202, { "Cache-Control": "no-store" });
    }

    const { backend } = await recordTelemetry(env, { unit_id: unit.id, wida_tier, event_type });
    return json({ ok: true, grade: unit.grade }, 202, {
      "X-BCPSS-Backend": backend,
      "Cache-Control": "no-store",
    });
  },
});
