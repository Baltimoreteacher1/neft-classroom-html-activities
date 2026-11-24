import { GRADES, SUBJECTS } from "../../../_lib/bcpss/db.js";
import { buildFamilyDirectory } from "../../../_lib/bcpss/family-guide.js";
import { badRequest, handler, json } from "../../../_lib/http.js";

// Chooser list for /family/bcpss/: ?grade=3&subject=Science -> units with a bilingual one-line summary.
export const onRequest = handler({
  methods: ["GET"],
  async handle({ request }) {
    const url = new URL(request.url);
    const grade = (url.searchParams.get("grade") || "").trim();
    const subject = (url.searchParams.get("subject") || "").trim();
    if (!GRADES.map(String).includes(grade)) return badRequest("Invalid grade.");
    if (!SUBJECTS.includes(subject)) return badRequest("Invalid subject.");
    return json({ grade, subject, units: await buildFamilyDirectory(grade, subject) }, 200, {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    });
  },
});
