import { createSharedPlan, getUnitDetail } from "../../_lib/bcpss/db.js";
import { badRequest, handler, json, notFound } from "../../_lib/http.js";

export const onRequest = handler({
  methods: ["POST"],
  async handle({ body, env }) {
    const unit_id = typeof body?.unit_id === "string" ? body.unit_id.trim() : "";
    const wida_tier = typeof body?.wida_tier === "string" ? body.wida_tier.trim() : "";
    const teacher_note = typeof body?.teacher_note === "string" ? body.teacher_note.trim() : "";

    if (!unit_id || !/^[a-zA-Z0-9_-]{2,80}$/.test(unit_id)) {
      return badRequest("unit_id is required and must be a valid unit identifier.");
    }
    if (!wida_tier || wida_tier.length > 40) {
      return badRequest("wida_tier is required (1 to 40 characters).");
    }
    if (teacher_note.length < 1 || teacher_note.length > 500) {
      return badRequest("teacher_note must be between 1 and 500 characters.");
    }

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
