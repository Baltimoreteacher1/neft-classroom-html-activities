/**
 * neft-lti — Canvas LTI 1.3 / LTI Advantage tool (Cloudflare Worker).
 *
 * Collapses the four Canvas seams into one IMS-standard integration:
 *   - OIDC third-party launch  → SSO (student is already identified)
 *   - LtiResourceLinkRequest   → open the live lesson inside Canvas
 *   - LtiDeepLinkingRequest     → teacher places any lesson as an assignment
 *   - AGS (Assignment & Grade Services) → the finished lesson's score posts
 *     itself into the Canvas gradebook
 *
 * DORMANT BY DESIGN. Until IT registers a Developer Key and the two returned
 * values (LTI_CLIENT_ID + LTI_DEPLOYMENT_ID) plus the tool keypair are set as
 * secrets, launches fail closed with a clear message and NOTHING in Canvas
 * points here — zero effect on students. /health and /lti/jwks come up as soon
 * as the keypair exists, so IT can register against real, live URLs.
 *
 * Endpoints:
 *   GET|POST /lti/login    OIDC third-party-initiated login → redirect to Canvas
 *   POST     /lti/launch    receive id_token, verify, branch by message type
 *   GET      /lti/jwks      tool public JWKS (Canvas verifies our signed JWTs)
 *   POST     /lti/deeplink  Deep Linking response (place chosen lessons)
 *   POST     /lti/score     lesson-completion hook → mint AGS token → post score
 *   GET      /health        liveness + dormant/active status (no secrets leaked)
 *
 * Bindings (wrangler.toml): DB (D1, nonce/replay + audit), KV (JWKS + token cache).
 * Secrets/vars: LTI_PRIVATE_JWK, LTI_CLIENT_ID, LTI_DEPLOYMENT_ID, PLATFORM_ISS,
 *   PLATFORM_AUTH_URL, PLATFORM_TOKEN_URL, PLATFORM_JWKS_URL, TOOL_URL, LESSON_BASE.
 */

const CLAIM = {
  messageType: "https://purl.imsglobal.org/spec/lti/claim/message_type",
  version: "https://purl.imsglobal.org/spec/lti/claim/version",
  deploymentId: "https://purl.imsglobal.org/spec/lti/claim/deployment_id",
  targetLinkUri: "https://purl.imsglobal.org/spec/lti/claim/target_link_uri",
  resourceLink: "https://purl.imsglobal.org/spec/lti/claim/resource_link",
  roles: "https://purl.imsglobal.org/spec/lti/claim/roles",
  context: "https://purl.imsglobal.org/spec/lti/claim/context",
  custom: "https://purl.imsglobal.org/spec/lti/claim/custom",
  agsEndpoint: "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint",
  dlSettings:
    "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings",
  dlContentItems: "https://purl.imsglobal.org/spec/lti-dl/claim/content_items",
  dlData: "https://purl.imsglobal.org/spec/lti-dl/claim/data",
};
const AGS_SCORE_SCOPE = "https://purl.imsglobal.org/spec/lti-ags/scope/score";
const LESSON_HOST = "eduwonderlab.com";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    try {
      if (request.method === "OPTIONS")
        return cors(new Response(null, { status: 204 }));
      if (pathname === "/health") return health(env);
      if (pathname === "/lti/jwks") return jwks(env);
      if (pathname === "/lti/login") return login(request, url, env);
      if (pathname === "/lti/launch") return launch(request, env);
      if (pathname === "/lti/deeplink") return deeplink(request, env);
      if (pathname === "/lti/score") return score(request, env, ctx);
      return text("Not found", 404);
    } catch (err) {
      return text("LTI error: " + ((err && err.message) || err), 500);
    }
  },
};

/* ------------------------------------------------------------------ status */

function isActive(env) {
  return !!(env.LTI_PRIVATE_JWK && env.LTI_CLIENT_ID && env.LTI_DEPLOYMENT_ID);
}

function health(env) {
  return json({
    ok: true,
    tool: "neft-lti",
    status: isActive(env) ? "active" : "dormant",
    keypair: !!env.LTI_PRIVATE_JWK,
    registered: !!(env.LTI_CLIENT_ID && env.LTI_DEPLOYMENT_ID),
    endpoints: {
      login: "/lti/login",
      launch: "/lti/launch",
      jwks: "/lti/jwks",
      deeplink: "/lti/deeplink",
    },
  });
}

/* --------------------------------------------------------------- JWKS (pub) */

function privateJwk(env) {
  if (!env.LTI_PRIVATE_JWK)
    throw new Error("tool keypair not configured (LTI_PRIVATE_JWK)");
  return typeof env.LTI_PRIVATE_JWK === "string"
    ? JSON.parse(env.LTI_PRIVATE_JWK)
    : env.LTI_PRIVATE_JWK;
}

function publicFromPrivate(jwk) {
  return {
    kty: jwk.kty,
    n: jwk.n,
    e: jwk.e,
    alg: jwk.alg || "RS256",
    use: "sig",
    kid: jwk.kid || "neft-lti-1",
  };
}

function jwks(env) {
  if (!env.LTI_PRIVATE_JWK) return json({ keys: [] });
  return json({ keys: [publicFromPrivate(privateJwk(env))] });
}

/* ------------------------------------------------------------ OIDC login */

async function login(request, url, env) {
  const p =
    request.method === "POST" ? await formParams(request) : url.searchParams;
  const iss = p.get("iss") || "";
  const loginHint = p.get("login_hint") || "";
  const targetLinkUri = p.get("target_link_uri") || "";
  const clientId = p.get("client_id") || env.LTI_CLIENT_ID || "";
  const messageHint = p.get("lti_message_hint") || "";
  if (!env.PLATFORM_AUTH_URL)
    return text("Platform not configured (PLATFORM_AUTH_URL).", 503);
  if (env.PLATFORM_ISS && iss && iss !== env.PLATFORM_ISS)
    return text("Unknown issuer.", 401);

  const state = randomId();
  const nonce = randomId();
  await putNonce(env, nonce, { state, targetLinkUri }, 600);

  const auth = new URL(env.PLATFORM_AUTH_URL);
  const q = auth.searchParams;
  q.set("response_type", "id_token");
  q.set("response_mode", "form_post");
  q.set("scope", "openid");
  q.set("prompt", "none");
  q.set("client_id", clientId);
  q.set("redirect_uri", toolUrl(env, "/lti/launch"));
  q.set("login_hint", loginHint);
  if (messageHint) q.set("lti_message_hint", messageHint);
  q.set("state", state);
  q.set("nonce", nonce);
  return Response.redirect(auth.toString(), 302);
}

/* --------------------------------------------------------------- launch */

async function launch(request, env) {
  const p = await formParams(request);
  const idToken = p.get("id_token") || "";
  const state = p.get("state") || "";
  if (!idToken) return text("Missing id_token.", 400);
  if (!isActive(env))
    return text(
      "neft-lti is dormant: awaiting IT registration (client_id / deployment_id) and keypair.",
      503,
    );

  const claims = await verifyIdToken(idToken, env);

  // Nonce single-use + state match (replay protection).
  const stored = await takeNonce(env, claims.nonce);
  if (!stored) return text("Invalid or replayed nonce.", 401);
  if (state && stored.state && state !== stored.state)
    return text("State mismatch.", 401);
  if (
    claims[CLAIM.deploymentId] &&
    env.LTI_DEPLOYMENT_ID &&
    claims[CLAIM.deploymentId] !== env.LTI_DEPLOYMENT_ID
  )
    return text("Unknown deployment.", 401);

  const messageType = claims[CLAIM.messageType];
  if (messageType === "LtiDeepLinkingRequest") return renderPicker(claims, env);
  if (messageType === "LtiResourceLinkRequest")
    return resourceLaunch(claims, env);
  return text("Unsupported LTI message type: " + messageType, 400);
}

async function resourceLaunch(claims, env) {
  const lessonUrl = resolveLessonUrl(claims, env);
  if (!lessonUrl)
    return text("This assignment has no valid lesson target.", 400);

  const ags = claims[CLAIM.agsEndpoint] || {};
  const lineitem = ags.lineitem || "";
  const name = String(claims.name || claims.given_name || "").trim();
  const sub = String(claims.sub || "").trim();

  // Mint a short-lived tool-signed launch token (ltik) carrying only what
  // /lti/score needs. No platform secrets ride to the browser.
  const ltik = await signJwt(
    {
      iss: "neft-lti",
      aud: env.LTI_CLIENT_ID,
      sub,
      lineitem,
      scopes: ags.scope || [],
      deployment_id: claims[CLAIM.deploymentId] || env.LTI_DEPLOYMENT_ID,
      iat: now(),
      exp: now() + 3 * 3600,
      jti: randomId(),
    },
    env,
  );

  const out = new URL(lessonUrl);
  out.searchParams.set("lms", "lti");
  out.searchParams.set("ltik", ltik);
  if (name) out.searchParams.set("sn", name);
  if (sub) out.searchParams.set("si", sub);
  await audit(env, "launch", { sub, lessonUrl, lineitem: !!lineitem });
  return Response.redirect(out.toString(), 302);
}

function resolveLessonUrl(claims, env) {
  const base = (env.LESSON_BASE || "https://eduwonderlab.com").replace(
    /\/$/,
    "",
  );
  // Prefer an explicit lesson id in custom params, else the target_link_uri.
  const custom = claims[CLAIM.custom] || {};
  if (custom.lesson) {
    const id = String(custom.lesson).replace(/[^a-z0-9-]/gi, "");
    if (id) return `${base}/lessons/${id}/`;
  }
  const target = claims[CLAIM.targetLinkUri] || "";
  if (target) {
    try {
      const u = new URL(target);
      if (u.hostname === LESSON_HOST || u.hostname === "www." + LESSON_HOST)
        return u.toString();
    } catch {
      /* fall through */
    }
  }
  return "";
}

/* ---------------------------------------------------------- Deep Linking */

async function renderPicker(claims, env) {
  const settings = claims[CLAIM.dlSettings] || {};
  const returnUrl = settings.deep_link_return_url || "";
  const data = settings.data || "";
  const lessons = await lessonCatalog(env);
  const opts = lessons
    .map(
      (l) =>
        `<label class="row"><input type="checkbox" name="lesson" value="${esc(l.id)}"><span><b>${esc(l.id)}</b> — ${esc(l.title)}</span></label>`,
    )
    .join("\n");
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Add Neft lessons</title>
<style>
 body{font:16px/1.5 system-ui,sans-serif;margin:0;background:#f6f4ee;color:#12355b}
 header{background:#1fa6a2;color:#fff;padding:16px 20px}h1{margin:0;font-size:1.2rem}
 form{padding:16px 20px;max-width:760px}.row{display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid #e2ddd0;border-radius:10px;margin:6px 0;background:#fff}
 button{background:#1fa6a2;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:12px}
 .hint{color:#5b6b7b;font-size:.9rem}
</style></head><body>
<header><h1>Add Neft Grade 6 Math lessons</h1></header>
<form method="POST" action="${esc(toolUrl(env, "/lti/deeplink"))}">
 <p class="hint">Tick the lessons to place in this Canvas module. Each becomes an assignment that grades itself when the student finishes.</p>
 <input type="hidden" name="return_url" value="${esc(returnUrl)}">
 <input type="hidden" name="dl_data" value="${esc(data)}">
 ${opts || '<p class="hint">Lesson catalog unavailable — set LESSON_CATALOG_URL.</p>'}
 <button type="submit">Add selected to Canvas</button>
</form></body></html>`;
  return htmlResp(body);
}

async function deeplink(request, env) {
  const p = await formParams(request);
  const returnUrl = p.get("return_url") || "";
  const data = p.get("dl_data") || "";
  const chosen = p.getAll("lesson");
  const base = (env.LESSON_BASE || "https://eduwonderlab.com").replace(
    /\/$/,
    "",
  );
  const catalog = await lessonCatalog(env);
  const titleOf = (id) =>
    (catalog.find((l) => l.id === id) || {}).title || `Lesson ${id}`;

  const contentItems = chosen.map((id) => ({
    type: "ltiResourceLink",
    title: `Math ${id} — ${titleOf(id)}`,
    url: `${base}/lessons/${id}/`,
    custom: { lesson: id },
    lineItem: {
      scoreMaximum: 100,
      label: `Math ${id}`,
      resourceId: `neft-${id}`,
    },
  }));

  const jwt = await signJwt(
    {
      iss: env.LTI_CLIENT_ID,
      aud: env.PLATFORM_ISS,
      sub: env.LTI_CLIENT_ID,
      iat: now(),
      exp: now() + 600,
      nonce: randomId(),
      [CLAIM.messageType]: "LtiDeepLinkingResponse",
      [CLAIM.version]: "1.3.0",
      [CLAIM.deploymentId]: env.LTI_DEPLOYMENT_ID,
      [CLAIM.dlContentItems]: contentItems,
      ...(data ? { [CLAIM.dlData]: data } : {}),
    },
    env,
  );
  // Auto-post the signed response back to Canvas.
  const form = `<!doctype html><html><body onload="document.forms[0].submit()">
<form method="POST" action="${esc(returnUrl)}"><input type="hidden" name="JWT" value="${esc(jwt)}"></form>
<noscript><button>Return to Canvas</button></noscript></body></html>`;
  return htmlResp(form);
}

/* --------------------------------------------------------------- AGS score */

async function score(request, env, ctx) {
  const b = await request.json().catch(() => null);
  if (!b || !b.ltik) return cors(json({ error: "missing ltik" }, 400));
  let tok;
  try {
    tok = await verifyToolJwt(b.ltik, env);
  } catch (e) {
    return cors(json({ error: "invalid ltik: " + (e.message || e) }, 401));
  }
  if (!tok.lineitem)
    return cors(json({ ok: true, note: "no line item (ungraded launch)" }));

  const given = Number(b.scoreGiven);
  const max = Number(b.scoreMaximum) || 1;
  const scoreBody = {
    userId: tok.sub,
    scoreGiven: isFinite(given) ? given : 0,
    scoreMaximum: max,
    activityProgress: "Completed",
    gradingProgress: "FullyGraded",
    timestamp: b.timestamp || new Date().toISOString(),
  };

  const doPost = async () => {
    const accessToken = await agsToken(env);
    const endpoint = tok.lineitem.replace(/\/$/, "") + "/scores";
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/vnd.ims.lis.v1.score+json",
      },
      body: JSON.stringify(scoreBody),
    });
    await audit(env, "score", { sub: tok.sub, status: r.status, given, max });
  };
  // Ack the browser immediately; finish the AGS post in the background.
  if (ctx && ctx.waitUntil) ctx.waitUntil(doPost().catch(() => {}));
  else await doPost().catch(() => {});
  return cors(json({ ok: true }));
}

let agsTokenCache = null;
async function agsToken(env) {
  if (agsTokenCache && agsTokenCache.exp > now() + 30)
    return agsTokenCache.token;
  const assertion = await signJwt(
    {
      iss: env.LTI_CLIENT_ID,
      sub: env.LTI_CLIENT_ID,
      aud: env.PLATFORM_TOKEN_URL,
      iat: now(),
      exp: now() + 300,
      jti: randomId(),
    },
    env,
  );
  const form = new URLSearchParams();
  form.set("grant_type", "client_credentials");
  form.set(
    "client_assertion_type",
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
  );
  form.set("client_assertion", assertion);
  form.set("scope", AGS_SCORE_SCOPE);
  const r = await fetch(env.PLATFORM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!r.ok) throw new Error("token grant failed: " + r.status);
  const j = await r.json();
  agsTokenCache = {
    token: j.access_token,
    exp: now() + (j.expires_in || 3600),
  };
  return j.access_token;
}

/* ------------------------------------------------------------------ crypto */

async function signJwt(payload, env) {
  const jwk = privateJwk(env);
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const header = { alg: "RS256", typ: "JWT", kid: jwk.kid || "neft-lti-1" };
  const signingInput =
    b64url(JSON.stringify(header)) + "." + b64url(JSON.stringify(payload));
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput),
  );
  return signingInput + "." + b64urlBytes(new Uint8Array(sig));
}

/** Verify a JWT the TOOL signed (the ltik) against the tool's own public key. */
async function verifyToolJwt(jwtStr, env) {
  const pub = publicFromPrivate(privateJwk(env));
  const claims = await verifySignature(jwtStr, pub);
  if (claims.exp && claims.exp < now()) throw new Error("expired");
  if (claims.iss !== "neft-lti") throw new Error("bad issuer");
  return claims;
}

/** Verify a platform id_token: signature via platform JWKS + core claims. */
async function verifyIdToken(jwtStr, env) {
  const { header } = decodeJwt(jwtStr);
  const jwk = await platformKey(env, header.kid);
  const claims = await verifySignature(jwtStr, jwk);
  if (env.PLATFORM_ISS && claims.iss !== env.PLATFORM_ISS)
    throw new Error("issuer mismatch");
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (env.LTI_CLIENT_ID && !aud.includes(env.LTI_CLIENT_ID))
    throw new Error("audience mismatch");
  if (claims.exp && claims.exp < now()) throw new Error("id_token expired");
  if (claims.iat && claims.iat > now() + 300)
    throw new Error("id_token issued in the future");
  if (!claims.nonce) throw new Error("missing nonce");
  return claims;
}

async function verifySignature(jwtStr, jwk) {
  const parts = jwtStr.split(".");
  if (parts.length !== 3) throw new Error("malformed jwt");
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    b64urlToBytes(parts[2]),
    new TextEncoder().encode(parts[0] + "." + parts[1]),
  );
  if (!ok) throw new Error("bad signature");
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
}

async function platformKey(env, kid) {
  const keys = await platformJwks(env);
  const k = keys.find((x) => x.kid === kid) || keys[0];
  if (!k) throw new Error("no platform key");
  return k;
}

async function platformJwks(env) {
  const cacheKey = "jwks:" + (env.PLATFORM_JWKS_URL || "");
  if (env.KV) {
    const cached = await env.KV.get(cacheKey, "json");
    if (cached) return cached;
  }
  if (!env.PLATFORM_JWKS_URL) throw new Error("PLATFORM_JWKS_URL not set");
  const r = await fetch(env.PLATFORM_JWKS_URL);
  if (!r.ok) throw new Error("jwks fetch failed: " + r.status);
  const j = await r.json();
  const keys = j.keys || [];
  if (env.KV)
    await env.KV.put(cacheKey, JSON.stringify(keys), { expirationTtl: 3600 });
  return keys;
}

function decodeJwt(jwtStr) {
  const parts = jwtStr.split(".");
  if (parts.length !== 3) throw new Error("malformed jwt");
  return {
    header: JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0]))),
    payload: JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1]))),
  };
}

/* ------------------------------------------------------------- nonce store */

async function putNonce(env, nonce, val, ttl) {
  if (env.KV)
    return env.KV.put("nonce:" + nonce, JSON.stringify(val), {
      expirationTtl: ttl,
    });
  if (env.DB)
    await env.DB.prepare(
      "INSERT OR REPLACE INTO nonces (nonce, data, exp) VALUES (?, ?, ?)",
    )
      .bind(nonce, JSON.stringify(val), now() + ttl)
      .run();
}

async function takeNonce(env, nonce) {
  if (!nonce) return null;
  if (env.KV) {
    const v = await env.KV.get("nonce:" + nonce, "json");
    if (v) await env.KV.delete("nonce:" + nonce);
    return v || null;
  }
  if (env.DB) {
    const row = await env.DB.prepare(
      "SELECT data, exp FROM nonces WHERE nonce = ?",
    )
      .bind(nonce)
      .first();
    if (!row) return null;
    await env.DB.prepare("DELETE FROM nonces WHERE nonce = ?")
      .bind(nonce)
      .run();
    if (row.exp && row.exp < now()) return null;
    return JSON.parse(row.data);
  }
  return null;
}

async function audit(env, event, meta) {
  try {
    if (env.DB)
      await env.DB.prepare(
        "INSERT INTO launch_audit (event, meta, ts) VALUES (?, ?, ?)",
      )
        .bind(event, JSON.stringify(meta || {}), now())
        .run();
  } catch {
    /* audit is best-effort */
  }
}

/* --------------------------------------------------------------- catalog */

async function lessonCatalog(env) {
  const url =
    env.LESSON_CATALOG_URL ||
    (env.LESSON_BASE || "https://eduwonderlab.com").replace(/\/$/, "") +
      "/data/curriculum-manifest.json";
  try {
    const r = await fetch(url, { cf: { cacheTtl: 300 } });
    if (!r.ok) return [];
    const j = await r.json();
    const lessons = j.lessons || j.items || [];
    return lessons
      .map((l) => ({
        id: String(l.lessonId || l.id || "").trim(),
        title: String(l.title || "").trim(),
      }))
      .filter((l) => l.id);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ utils */

function now() {
  return Math.floor(Date.now() / 1000);
}
function randomId() {
  return crypto.randomUUID().replace(/-/g, "");
}
function toolUrl(env, path) {
  return (
    (env.TOOL_URL || "https://neft-lti.neftjd.workers.dev").replace(/\/$/, "") +
    path
  );
}
function b64url(str) {
  return b64urlBytes(new TextEncoder().encode(str));
}
function b64urlBytes(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function cors(resp) {
  resp.headers.set("Access-Control-Allow-Origin", "*");
  resp.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return resp;
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
function text(s, status = 200) {
  return new Response(s, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
function htmlResp(s, status = 200) {
  return new Response(s, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
async function formParams(request) {
  const ct = request.headers.get("content-type") || "";
  if (
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data")
  ) {
    const fd = await request.formData();
    const p = new URLSearchParams();
    for (const [k, v] of fd.entries())
      p.append(k, typeof v === "string" ? v : "");
    return p;
  }
  return new URL(request.url).searchParams;
}
