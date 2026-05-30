/* Optional cloud sync for the Noam School planner.
 *
 * Cloudflare Pages Function. Stores one JSON blob per sync code in a KV
 * namespace bound as NOAM_SCHOOL_KV. If the binding is not configured the
 * endpoint returns 503 and the client silently falls back to local-only
 * storage (file backup still works). Last-write-wins by `updatedAt`.
 *
 * To enable: create a KV namespace and bind it as NOAM_SCHOOL_KV in the
 * Pages project settings.
 */

// Only the app's own origin should be able to read/write via a browser, so we
// reflect the Origin only when it matches the request host (same-origin). This
// blocks other websites from scripting mass reads against guessed codes.
function corsFor(request) {
  const origin = request.headers.get("Origin");
  let allow = "null";
  try {
    if (origin && new URL(origin).host === new URL(request.url).host)
      allow = origin;
  } catch {}
  return {
    "access-control-allow-origin": allow,
    "access-control-allow-methods": "GET,PUT,OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "Origin",
  };
}

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(request ? corsFor(request) : {}),
    },
  });
}

// Sync codes are the only thing protecting a blob, so require real length.
function keyFor(code) {
  const clean = String(code || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 64);
  return clean.length >= 10 ? "sync:" + clean : null;
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsFor(request) });
}

export async function onRequestGet({ request, env }) {
  if (!env.NOAM_SCHOOL_KV)
    return json({ error: "cloud sync not configured" }, 503, request);
  const code = new URL(request.url).searchParams.get("code");
  const key = keyFor(code);
  if (!key) return json({ error: "invalid code" }, 400, request);
  const stored = await env.NOAM_SCHOOL_KV.get(key);
  if (!stored) return json({ updatedAt: 0, state: null }, 200, request);
  return new Response(stored, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...corsFor(request),
    },
  });
}

export async function onRequestPut({ request, env }) {
  if (!env.NOAM_SCHOOL_KV)
    return json({ error: "cloud sync not configured" }, 503, request);
  const code = new URL(request.url).searchParams.get("code");
  const key = keyFor(code);
  if (!key) return json({ error: "invalid code" }, 400, request);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid body" }, 400, request);
  }
  if (!body || typeof body !== "object" || !body.state)
    return json({ error: "missing state" }, 400, request);

  // Clamp client-supplied updatedAt so it can't be set far in the future to
  // permanently pin a poisoned copy (last-write-wins is otherwise spoofable).
  const now = Date.now();
  const updatedAt = Math.min(Number(body.updatedAt) || now, now + 60_000);

  // Reject absurd payloads (KV value cap is 25MB; we keep planners small).
  const serialized = JSON.stringify({ updatedAt, state: body.state });
  if (serialized.length > 2_000_000)
    return json({ error: "payload too large" }, 413, request);

  // Last-write-wins: only overwrite if the incoming copy is newer.
  const existing = await env.NOAM_SCHOOL_KV.get(key);
  if (existing) {
    try {
      const prev = JSON.parse(existing);
      if ((prev.updatedAt || 0) > updatedAt) {
        return json(
          { ok: true, kept: "server", updatedAt: prev.updatedAt },
          200,
          request,
        );
      }
    } catch {}
  }
  await env.NOAM_SCHOOL_KV.put(key, serialized, {
    expirationTtl: 60 * 60 * 24 * 365,
  });
  return json({ ok: true, kept: "client" }, 200, request);
}
