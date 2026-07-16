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

  // Small-group facilitation must never ship in the student config response.
  // The authenticated /teacher-small-group/:id/data route reads the original
  // asset directly and returns only the teacher fields after HTTP auth.
  if (/^\/lessons\/\d{1,2}-\d{1,2}-(?:group[12]|catchup)\/config\.json$/.test(p)) {
    const asset = await next();
    if (!asset.ok) return asset;
    const config = await asset.json();
    delete config.smallGroup;
    const headers = new Headers(asset.headers);
    headers.set("content-type", "application/json; charset=utf-8");
    headers.set("x-content-type-options", "nosniff");
    return new Response(JSON.stringify(config), { status: asset.status, headers });
  }

  // Facilitation fails closed until server-side access protection is enabled.
  if (!password && p.startsWith("/teacher-small-group/")) {
    return new Response("Teacher access is not configured.", { status: 503 });
  }
  if (!password) return next();

  // APIs and other lesson config JSON have their own auth / are fetched by
  // external automation (e.g. the Apps Script slide generator).
  if (p.startsWith("/api/") || p.endsWith("/config.json")) return next();

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
    if (supplied === password) return next(); // correct password -> allow
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="EduWonderLab", charset="UTF-8"',
    },
  });
}
