// functions/_middleware.js — teacher-only password gate for Cloudflare Pages.
//
// Policy (changed 2026-06-18): the site is STUDENT-FACING and open by default.
// Students reach every activity, lesson, game, and tool WITHOUT a password.
// Only teacher-facing surfaces (teacher notes, dashboards, answer keys, admin)
// stay behind the shared class password via HTTP Basic Auth.
//
// The password is NOT stored in this (public) repo — it is read from the
// Cloudflare environment variable SITE_PASSWORD. If that variable is not set,
// protected small-group routes fail closed rather than exposing facilitation.
//
//   Cloudflare dashboard -> Workers & Pages -> your Pages project
//   -> Settings -> Variables and Secrets -> add for Production:
//      Name = SITE_PASSWORD   Value = <the class/teacher password>
//
// Teachers sign in with ANY username plus the shared password. This is a casual
// gate to keep students/public out of teacher material, not strong security.

import { EXACT, PREFIX } from "./_lib/redirect-map.js";

// Resolve a path against the generated redirect map. Returns a Response or null.
//
// Cloudflare honours only the FIRST 100 rules of `_redirects` on this project —
// measured against production: rules at positions 90/95/100 return 301, and
// 101/102/105/110/150/200 return 404. The documented Pages limit is 2,000 static
// + 100 dynamic and this file holds 333 rules of which 12 are dynamic, so the
// cutoff is not what the docs describe; it is, however, exact and repeatable,
// and it had silently killed 231 short links including /unit-5-practice.
//
// This runs ONLY on a 404, so it cannot shadow anything that already resolves,
// and the first 100 rules still redirect through Pages before this is reached.
// Reordering the file was rejected as the fix: inserting a rule into the live
// first 100 pushes a different one off the end and kills it.
function redirectFor(url) {
  const path = url.pathname;
  // Match with and without the trailing slash: routes.json authors both forms
  // for most aliases, but not all, and a student typing the other one should
  // still land. Lowercase last — typed URLs are frequently mis-cased.
  const candidates = [
    path,
    path.endsWith("/") ? path.slice(0, -1) : `${path}/`,
    path.toLowerCase(),
  ];
  for (const key of candidates) {
    const hit = EXACT[key];
    if (hit) return { to: hit[0], status: hit[1] };
  }
  for (const [prefix, destination, status, takesSplat] of PREFIX) {
    if (!path.startsWith(prefix)) continue;
    const splat = path.slice(prefix.length);
    return { to: takesSplat ? destination.replace(":splat", splat) : destination, status };
  }
  return null;
}

// Serve the asset, and fall back to the redirect map when Pages 404s.
// Only GET/HEAD: replaying a POST to a new URL would silently drop its body.
async function nextWithRedirectFallback(next, request, url) {
  const response = await next();
  if (response.status !== 404) return response;
  if (request.method !== "GET" && request.method !== "HEAD") return response;
  // An /api/ 404 is an endpoint answering "no such resource" — never a route
  // alias, and turning it into a 301 would corrupt the API's own contract.
  if (url.pathname.startsWith("/api/")) return response;
  const hit = redirectFor(url);
  if (!hit) return response;
  const target = new URL(hit.to, url);
  target.search = url.search;
  return Response.redirect(target.toString(), hit.status);
}

function toStudentConfig(value) {
  if (Array.isArray(value)) return value.map(toStudentConfig);
  if (!value || typeof value !== "object") return value;
  const clean = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "smallGroup" || key === "listenFor") continue;
    clean[key] = toStudentConfig(child);
  }
  return clean;
}

function decodeBase64(value) {
  try {
    return atob(value);
  } catch (_error) {
    return "";
  }
}

async function privateTeacherResponse(next) {
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

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
  const isSharedStudentAsset = p.startsWith("/assets/") || p.startsWith("/data/");
  const isApiWithOwnPolicy =
    (p.startsWith("/api/") && !isFamilyPublishingApi) || p.endsWith("/config.json");
  const isTeacherSurface =
    !isSharedStudentAsset &&
    !isApiWithOwnPolicy &&
    (isFamilyPublishingApi ||
      p.includes("teacher") ||
      p.includes("dashboard") ||
      p.includes("answer-key") ||
      // Plan Notes is a teacher surface whose path contains none of the
      // substrings above, so it would otherwise serve to anyone. Matched as an
      // exact path PREFIX, never as a substring — a loose "plan" match would
      // 401 lesson-plan pages students legitimately open.
      p.startsWith("/curriculum/plan-notes") ||
      p.startsWith("/admin"));

  // Student small-group configs never include facilitation fields. The
  // authenticated teacher route reads the original asset directly.
  if (/^\/lessons\/\d{1,2}-\d{1,2}-(?:group[12]|catchup)\/config\.json$/.test(p)) {
    const asset = await next();
    if (!asset.ok) return asset;
    const config = toStudentConfig(await asset.json());
    const headers = new Headers(asset.headers);
    headers.set("content-type", "application/json; charset=utf-8");
    headers.set("x-content-type-options", "nosniff");
    return new Response(JSON.stringify(config), { status: asset.status, headers });
  }

  // Public pages remain open when the gate is unavailable. Publishing edits
  // are the exception and fail closed instead of becoming publicly writable.
  if (!password) {
    if (isTeacherSurface) {
      return new Response("Teacher access is not configured.", { status: 503 });
    }
    return nextWithRedirectFallback(next, request, url);
  }

  // APIs and lesson config JSON have their own auth / are fetched by external
  // automation (e.g. the Apps Script slide generator). Never gate them here.
  if (isApiWithOwnPolicy) return next();

  // Static bundles under /assets/ and curriculum data under /data/ are shared
  // code/content, not teacher pages. Some are named for the feature they serve
  // (e.g. curriculum-teacher-workflow.{js,json}) and are loaded/fetched
  // unconditionally by the PUBLIC curriculum hub as progressive enhancement —
  // the teacher features they enable are separately PIN-gated client-side, and
  // any sensitive data lives behind /api/ (exempted above). Gating them by
  // filename substring 401s every student on /curriculum/ and breaks the hub,
  // so never gate these dirs here. Sensitive surfaces are teacher *pages*,
  // matched below.
  if (isSharedStudentAsset) return next();

  // Teacher-only surfaces that STAY behind the password. These substrings cover
  // every teacher directory in the repo:
  //   .../teacher-notes, .../teacher, access-teacher, teacher-tools/*,
  //   teacher-data-dashboard, dashboard, */dashboard (class/curriculum/games),
  //   math/unit-N/projects/answer-key, and any /admin surface.
  // Everything else is student-facing -> open, no password.
  if (!isTeacherSurface) return nextWithRedirectFallback(next, request, url);

  // Teacher surface -> require the shared password.
  const header = request.headers.get("Authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = decodeBase64(encoded);
    const supplied = decoded.slice(decoded.indexOf(":") + 1);
    if (supplied === password) {
      context.data.teacherAccessConfigured = true;
      context.data.teacherAuthorized = true;
      return privateTeacherResponse(next);
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="EduWonderLab", charset="UTF-8"',
    },
  });
}
