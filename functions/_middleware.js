// functions/_middleware.js — teacher-only password gate for Cloudflare Pages.
//
// Policy (changed 2026-06-18): the site is STUDENT-FACING and open by default.
// Students reach every activity, lesson, game, and tool WITHOUT a password.
// Only teacher-facing surfaces (teacher notes, dashboards, answer keys, admin)
// stay behind the shared class password via HTTP Basic Auth.
//
// The password is NOT stored in this (public) repo — it is read from the
// Cloudflare environment variable SITE_PASSWORD. If that variable is not set,
// the whole site is open (including teacher pages), so deploying this file
// changes nothing until SITE_PASSWORD is configured in the dashboard.
//
//   Cloudflare dashboard -> Workers & Pages -> your Pages project
//   -> Settings -> Variables and Secrets -> add for Production:
//      Name = SITE_PASSWORD   Value = <the class/teacher password>
//
// Teachers sign in with ANY username plus the shared password. This is a casual
// gate to keep students/public out of teacher material, not strong security.

export async function onRequest(context) {
  const { request, env, next } = context;
  const password = env.SITE_PASSWORD;

  const url = new URL(request.url);
  const p = url.pathname.toLowerCase();
  const isFamilyPublishedFeed = p === "/api/family-connections/canvas-feed";
  const isPublicFamilySchedulingApi = [
    "/api/family-connections/schedule-availability",
    "/api/family-connections/schedule-request",
    "/api/family-connections/schedule-response",
  ].includes(p);
  const isFamilyPublishingApi =
    p.startsWith("/api/family-connections/") &&
    !p.endsWith("/published") &&
    !isFamilyPublishedFeed &&
    !isPublicFamilySchedulingApi;

  // Public pages remain open when the gate is unavailable. Publishing edits
  // are the exception and fail closed instead of becoming publicly writable.
  if (!password) {
    if (isFamilyPublishingApi) {
      return new Response("Teacher access is not configured.", { status: 503 });
    }
    return next();
  }

  // APIs and lesson config JSON have their own auth / are fetched by external
  // automation (e.g. the Apps Script slide generator). Never gate them here.
  if ((p.startsWith("/api/") && !isFamilyPublishingApi) || p.endsWith("/config.json"))
    return next();

  // Static bundles under /assets/ and curriculum data under /data/ are shared
  // code/content, not teacher pages. Some are named for the feature they serve
  // (e.g. curriculum-teacher-workflow.{js,json}) and are loaded/fetched
  // unconditionally by the PUBLIC curriculum hub as progressive enhancement —
  // the teacher features they enable are separately PIN-gated client-side, and
  // any sensitive data lives behind /api/ (exempted above). Gating them by
  // filename substring 401s every student on /curriculum/ and breaks the hub,
  // so never gate these dirs here. Sensitive surfaces are teacher *pages*,
  // matched below.
  if (p.startsWith("/assets/") || p.startsWith("/data/")) return next();

  // Teacher-only surfaces that STAY behind the password. These substrings cover
  // every teacher directory in the repo:
  //   .../teacher-notes, .../teacher, access-teacher, teacher-tools/*,
  //   teacher-data-dashboard, dashboard, */dashboard (class/curriculum/games),
  //   math/unit-N/projects/answer-key, and any /admin surface.
  const isTeacherSurface =
    isFamilyPublishingApi ||
    p.includes("teacher") ||
    p.includes("dashboard") ||
    p.includes("answer-key") ||
    p.startsWith("/admin");

  // Everything else is student-facing -> open, no password.
  if (!isTeacherSurface) return next();

  // Teacher surface -> require the shared password.
  const header = request.headers.get("Authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const supplied = decoded.slice(decoded.indexOf(":") + 1);
    if (supplied === password) {
      context.data.teacherAccessConfigured = true;
      context.data.teacherAuthorized = true;
      return next();
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="EduWonderLab", charset="UTF-8"',
    },
  });
}
