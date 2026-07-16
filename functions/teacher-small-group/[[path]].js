import { FACILITATION_BY_LESSON } from "./_facilitation-data.js";

const LESSON_ID = /^\d{1,2}-\d{1,2}-(?:group[12]|catchup)$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function onRequest({ request, params }) {
  if (request.method !== "GET") return json({ ok: false, error: "method-not-allowed" }, 405);
  const path = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
  const lessonId = path[0] || "";
  if (!LESSON_ID.test(lessonId)) return json({ ok: false, error: "invalid-lesson" }, 400);
  if (path.length === 1) {
    return Response.redirect(new URL(`/lessons/${lessonId}/?teacher=1`, request.url), 302);
  }
  if (path.length !== 2 || path[1] !== "data") {
    return json({ ok: false, error: "not-found" }, 404);
  }
  const facilitation = FACILITATION_BY_LESSON[lessonId];
  if (!facilitation) return json({ ok: false, error: "facilitation-not-found" }, 404);
  return json({
    ok: true,
    lessonId,
    facilitation,
  });
}
