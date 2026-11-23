import { matchBlueprintVector } from "../../_lib/bcpss/db.js";
import { deconstructPassage, SUPPORTED_L1S } from "../../_lib/bcpss/embeddings.js";
import { badRequest, handler, json } from "../../_lib/http.js";

export const onRequest = handler({
  methods: ["POST"],
  async handle({ body, env }) {
    const passage = typeof body?.passage === "string" ? body.passage : "";
    const l1 = typeof body?.l1 === "string" ? body.l1.trim() : "Spanish";

    if (passage.trim().length < 1 || passage.trim().length > 1500) {
      return badRequest("passage must be between 1 and 1500 characters.");
    }
    if (!SUPPORTED_L1S.includes(l1)) {
      return badRequest(`l1 must be one of: ${SUPPORTED_L1S.join(", ")}.`);
    }

    const { backend, blueprints, matched_blueprint } = await matchBlueprintVector(env, passage);
    const analysis = deconstructPassage(passage, l1, blueprints, matched_blueprint);

    return json(analysis, 200, {
      "X-BCPSS-Backend": backend,
      "Cache-Control": "no-store",
    });
  },
});
