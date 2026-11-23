/**
 * POST /api/studio/docx   body: { activity, part?: "student" | "key" | "all", lang?: "en" | "es" | "bi" }
 *
 * Turns the activity the caller sends into an editable Word file. It stores nothing, needs no class code and
 * reads nothing but the request: it only transforms. The activity is normalized (unknown fields dropped, sizes
 * capped, images limited to raster data: URLs) before anything is built.
 */

import { LIMITS, normalizeActivity } from "../../../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../../../access-practice-lab/src/studio/core/validate.js";
import { badRequest, handler, json } from "../../_lib/http.js";
import { buildDocx } from "../../_lib/studio/docx.js";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PARTS = ["student", "key", "all"];
const LANGS = ["en", "es", "bi"];

/** An ASCII file name from the title: letters, digits and hyphens only. */
export function safeFilename(title, part) {
  const slug =
    String(title || "")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "worksheet";
  const suffix = part === "key" ? "-answer-key" : part === "all" ? "-with-key" : "";
  return `${slug}${suffix}.docx`;
}

export const onRequest = handler({
  methods: ["POST"],
  rateLimit: { max: 20, windowMs: 60_000 },
  maxBodyBytes: LIMITS.totalBytes + 4096,
  async handle({ body }) {
    if (!body || typeof body !== "object" || Array.isArray(body))
      return badRequest("body must be an object");
    const { activity } = body;
    if (!activity || typeof activity !== "object" || Array.isArray(activity))
      return badRequest("activity is required");
    const part = body.part ?? "student";
    const lang = body.lang ?? "en";
    if (!PARTS.includes(part)) return badRequest('part must be "student", "key" or "all"');
    if (!LANGS.includes(lang)) return badRequest('lang must be "en", "es" or "bi"');
    if (JSON.stringify(activity).length > LIMITS.totalBytes)
      return json({ ok: false, error: "activity too large" }, 413);

    const clean = normalizeActivity(activity);
    let issues = "0/0";
    try {
      const v = validateActivity(clean);
      issues = `${v.errors.length}/${v.warnings.length}`; // for the caller's information only: never blocks export
    } catch {
      // validation is advisory here
    }

    const bytes = await buildDocx(clean, { part, lang });
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": DOCX_TYPE,
        "Content-Disposition": `attachment; filename="${safeFilename(clean.title, part)}"`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Studio-Issues": issues,
      },
    });
  },
});
