import { rejectIfPII } from "../../../shared/privacy/pii.mjs";
import { createSharedPlan, getUnitDetail } from "../../_lib/bcpss/db.js";
import { badRequest, handler, json, notFound } from "../../_lib/http.js";
import { LIMITS, TEACHER_NOTE_MAX, UNIT_ID_RE, WIDA_TIERS } from "../../_lib/security/schema.js";

const ALLOWED_FIELDS = new Set(["unit_id", "wida_tier", "teacher_note"]);

export const onRequest = handler({
  methods: ["POST"],
  requireObjectBody: true,
  ...LIMITS.plans,
  async handle({ body, env }) {
    if (Object.keys(body).some((k) => !ALLOWED_FIELDS.has(k))) {
      return badRequest("unexpected field in plan body.");
    }
    const unit_id = typeof body.unit_id === "string" ? body.unit_id.trim() : "";
    const wida_tier = typeof body.wida_tier === "string" ? body.wida_tier.trim() : "";
    const teacher_note = typeof body.teacher_note === "string" ? body.teacher_note.trim() : "";

    if (!UNIT_ID_RE.test(unit_id)) {
      return badRequest("unit_id is required and must be a valid unit identifier.");
    }
    if (!WIDA_TIERS.includes(wida_tier)) {
      return badRequest(`wida_tier must be one of: ${WIDA_TIERS.join(", ")}.`);
    }
    if (teacher_note.length < 1 || teacher_note.length > TEACHER_NOTE_MAX) {
      return badRequest(`teacher_note must be between 1 and ${TEACHER_NOTE_MAX} characters.`);
    }
    // A shared plan is readable by anyone with the link: no names, contact details or personal circumstances.
    const piiRejection = rejectIfPII(teacher_note, "teacher_note");
    if (piiRejection) return piiRejection;

    const { detail } = await getUnitDetail(env, unit_id);
    if (!detail) {
      return notFound(`Unit "${unit_id}" not found.`);
    }

    const { backend, plan } = await createSharedPlan(env, {
      unit_id,
      wida_tier,
      teacher_note,
    });

    return json(plan, 201, {
      "X-BCPSS-Backend": backend,
      "Cache-Control": "no-store",
    });
  },
});
