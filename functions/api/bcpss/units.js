import { GRADES, listUnits, SUBJECTS } from "../../_lib/bcpss/db.js";
import { badRequest, handler, json } from "../../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  async handle({ request, env }) {
    const url = new URL(request.url);
    // Both are required: the API never guesses a grade or content area for the caller.
    const grade = (url.searchParams.get("grade") || "").trim();
    const subject = (url.searchParams.get("subject") || "").trim();
    if (!grade || !subject) return badRequest("Both grade and subject are required.");

    const validGrades = GRADES.map(String);
    if (!validGrades.includes(grade)) {
      return badRequest(`Invalid grade "${grade}". Expected one of: ${validGrades.join(", ")}.`);
    }
    if (!SUBJECTS.includes(subject)) {
      return badRequest(`Invalid subject "${subject}". Expected one of: ${SUBJECTS.join(", ")}.`);
    }

    const { backend, units } = await listUnits(env, grade, subject);
    return json({ grade, subject, units }, 200, {
      "X-BCPSS-Backend": backend,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    });
  },
});
