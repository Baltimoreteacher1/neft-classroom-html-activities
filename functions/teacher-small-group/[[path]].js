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

function collectListenFor(value, found = []) {
  if (Array.isArray(value)) {
    for (const child of value) collectListenFor(child, found);
    return found;
  }
  if (!value || typeof value !== "object") return found;
  for (const [key, child] of Object.entries(value)) {
    if (key === "listenFor" && typeof child === "string" && !found.includes(child)) {
      found.push(child);
    } else {
      collectListenFor(child, found);
    }
  }
  return found;
}

export async function onRequest({ request, env, params }) {
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
  if (!env.ASSETS?.fetch) return json({ ok: false, error: "assets-unavailable" }, 503);
  const configResponse = await env.ASSETS.fetch(
    new Request(new URL(`/lessons/${lessonId}/config.json`, request.url)),
  );
  if (!configResponse.ok) return json({ ok: false, error: "lesson-not-found" }, 404);
  const config = await configResponse.json();
  if (!config.smallGroup) return json({ ok: false, error: "facilitation-not-found" }, 404);
  return json({
    ok: true,
    lessonId,
    facilitation: {
      ...config.smallGroup,
      listenFor: collectListenFor(config),
    },
  });
}
