import { GRADES, getPublicBridge, SUBJECTS } from "../../_lib/bcpss/db.js";
import { badRequest, handler, json, notFound } from "../../_lib/http.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = handler({
  methods: ["GET"],
  async handle({ request, env }) {
    const url = new URL(request.url);
    const grade = (url.searchParams.get("grade") || "6").trim();
    const subject = (url.searchParams.get("subject") || "Math").trim();
    const unitParam = (url.searchParams.get("unit") || "1").trim();
    const unitNumber = Number.parseInt(unitParam, 10);

    const validGrades = GRADES.map(String);
    if (validGrades.length && !validGrades.includes(grade)) {
      return badRequest(`Invalid grade "${grade}". Expected one of: ${validGrades.join(", ")}.`);
    }
    if (SUBJECTS.length && !SUBJECTS.includes(subject)) {
      return badRequest(`Invalid subject "${subject}". Expected one of: ${SUBJECTS.join(", ")}.`);
    }
    if (!Number.isInteger(unitNumber) || unitNumber < 1 || unitNumber > 30) {
      return badRequest(`Invalid unit "${unitParam}". Expected a positive integer.`);
    }

    const { backend, bridge } = await getPublicBridge(env, grade, subject, unitNumber);
    if (!bridge) {
      return notFound(`No BCPSS unit found for Grade ${grade} ${subject} Unit ${unitNumber}.`);
    }

    return json(bridge, 200, {
      ...CORS_HEADERS,
      "X-BCPSS-Backend": backend,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    });
  },
});
