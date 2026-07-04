/**
 * neft-lti conformance test — drives the Worker with a MOCK Canvas platform:
 * a local RSA keypair stands in for Canvas, global fetch is stubbed to serve the
 * platform JWKS + token endpoint and to capture the AGS score POST.
 *
 *   node lti-worker/src/worker.test.mjs
 *
 * Covers: /health dormant→active, /lti/jwks, a full LtiResourceLinkRequest
 * launch (id_token verify → ltik mint → 302 into the lesson), and the score
 * flow (ltik verify → client-credentials token → AGS Score POST shape).
 */
import assert from "node:assert";

const te = new TextEncoder();
const td = new TextDecoder();
function b64url(bytes) {
  let s = "";
  const b = typeof bytes === "string" ? te.encode(bytes) : bytes;
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function signWith(privateKey, header, payload) {
  const input = b64url(JSON.stringify(header)) + "." + b64url(JSON.stringify(payload));
  const sig = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, privateKey, te.encode(input));
  return input + "." + b64url(new Uint8Array(sig));
}

let passed = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  console.log("  PASS " + name);
  passed++;
}

async function main() {
  // --- Mock Canvas keypair (the "platform") ---
  const platform = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const platPub = await crypto.subtle.exportKey("jwk", platform.publicKey);
  platPub.kid = "canvas-kid-1";
  platPub.alg = "RS256";
  platPub.use = "sig";

  // --- Tool keypair (neft-lti) ---
  const tool = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const toolPriv = await crypto.subtle.exportKey("jwk", tool.privateKey);
  toolPriv.kid = "neft-lti-test";
  toolPriv.alg = "RS256";

  // --- In-memory KV + env ---
  const store = new Map();
  const KV = {
    async get(k, t) {
      const v = store.get(k);
      return v == null ? null : t === "json" ? JSON.parse(v) : v;
    },
    async put(k, v) {
      store.set(k, v);
    },
    async delete(k) {
      store.delete(k);
    },
  };
  const env = {
    LTI_PRIVATE_JWK: JSON.stringify(toolPriv),
    LTI_CLIENT_ID: "10000000000123",
    LTI_DEPLOYMENT_ID: "1:abcdef",
    PLATFORM_ISS: "https://canvas.instructure.com",
    PLATFORM_AUTH_URL: "https://sso.canvaslms.com/api/lti/authorize_redirect",
    PLATFORM_TOKEN_URL: "https://sso.canvaslms.com/login/oauth2/token",
    PLATFORM_JWKS_URL: "https://sso.canvaslms.com/api/lti/security/jwks",
    TOOL_URL: "https://neft-lti.neftjd.workers.dev",
    LESSON_BASE: "https://eduwonderlab.com",
    KV,
  };

  // --- Stub global fetch: platform JWKS, token grant, capture AGS score ---
  let agsPost = null;
  globalThis.fetch = async (url, opts = {}) => {
    url = String(url);
    if (url === env.PLATFORM_JWKS_URL) return new Response(JSON.stringify({ keys: [platPub] }), { status: 200 });
    if (url === env.PLATFORM_TOKEN_URL)
      return new Response(JSON.stringify({ access_token: "AGS-TOKEN", expires_in: 3600 }), { status: 200 });
    if (url.endsWith("/scores")) {
      agsPost = { url, headers: opts.headers, body: JSON.parse(opts.body) };
      return new Response("", { status: 200 });
    }
    return new Response("nope", { status: 404 });
  };

  const { default: worker } = await import("./worker.js");

  // --- /health: active (keypair + client_id + deployment set) ---
  const h = await (await worker.fetch(new Request("https://t/health"), env)).json();
  ok("health reports active", h.status === "active" && h.keypair && h.registered);

  // --- /lti/jwks serves the tool public key ---
  const jw = await (await worker.fetch(new Request("https://t/lti/jwks"), env)).json();
  ok("jwks serves one public key with kid", jw.keys.length === 1 && jw.keys[0].kid === "neft-lti-test");

  // --- Seed a login nonce, then drive a ResourceLink launch ---
  const nonce = "nonce-123";
  store.set("nonce:" + nonce, JSON.stringify({ state: "S1", targetLinkUri: "" }));
  const nowS = Math.floor(Date.now() / 1000);
  const idToken = await signWith(
    platform.privateKey,
    { alg: "RS256", typ: "JWT", kid: "canvas-kid-1" },
    {
      iss: env.PLATFORM_ISS,
      aud: env.LTI_CLIENT_ID,
      exp: nowS + 300,
      iat: nowS,
      nonce,
      sub: "student-abc",
      name: "Ada Lovelace",
      "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest",
      "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
      "https://purl.imsglobal.org/spec/lti/claim/deployment_id": env.LTI_DEPLOYMENT_ID,
      "https://purl.imsglobal.org/spec/lti/claim/target_link_uri": "https://eduwonderlab.com/lessons/3-1/",
      "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint": {
        lineitem: "https://canvas.instructure.com/api/lti/courses/1/line_items/99",
        scope: ["https://purl.imsglobal.org/spec/lti-ags/scope/score"],
      },
    },
  );
  const launchReq = new Request("https://t/lti/launch", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, state: "S1" }).toString(),
  });
  const launchResp = await worker.fetch(launchReq, env);
  ok("launch 302 redirects", launchResp.status === 302 || launchResp.status === 301);
  const loc = new URL(launchResp.headers.get("location"));
  ok("redirect points to the lesson", loc.origin + loc.pathname === "https://eduwonderlab.com/lessons/3-1/");
  ok("redirect carries lms=lti", loc.searchParams.get("lms") === "lti");
  ok("redirect auto-identifies student (sn)", loc.searchParams.get("sn") === "Ada Lovelace");
  const ltik = loc.searchParams.get("ltik");
  ok("redirect carries an ltik", !!ltik && ltik.split(".").length === 3);

  // --- Nonce is single-use: replaying the same launch is rejected ---
  const replay = await worker.fetch(
    new Request("https://t/lti/launch", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: idToken, state: "S1" }).toString(),
    }),
    env,
  );
  ok("replayed nonce is rejected", replay.status === 401);

  // --- Score flow: ltik → AGS Score POST ---
  const scoreResp = await worker.fetch(
    new Request("https://t/lti/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ltik, scoreGiven: 8, scoreMaximum: 10 }),
    }),
    env,
  );
  const sj = await scoreResp.json();
  ok("score endpoint acks ok", scoreResp.status === 200 && sj.ok);
  ok("AGS score POST fired", !!agsPost);
  ok("AGS posts to <lineitem>/scores", agsPost.url.endsWith("/line_items/99/scores"));
  ok("AGS uses the score content-type", agsPost.headers["Content-Type"] === "application/vnd.ims.lis.v1.score+json");
  ok("AGS bearer token attached", agsPost.headers["Authorization"] === "Bearer AGS-TOKEN");
  ok(
    "AGS body: right user + score + FullyGraded",
    agsPost.body.userId === "student-abc" &&
      agsPost.body.scoreGiven === 8 &&
      agsPost.body.scoreMaximum === 10 &&
      agsPost.body.gradingProgress === "FullyGraded",
  );

  // --- Tampered ltik is rejected ---
  const badLtik = ltik.slice(0, -3) + "AAA";
  const bad = await worker.fetch(
    new Request("https://t/lti/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ltik: badLtik, scoreGiven: 5, scoreMaximum: 5 }),
    }),
    env,
  );
  ok("tampered ltik rejected", bad.status === 401);

  // --- Dormant guard: no keypair/registration → launch fails closed ---
  const dormant = await worker.fetch(
    new Request("https://t/lti/launch", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: idToken, state: "S1" }).toString(),
    }),
    { KV: { get: async () => null, put: async () => {}, delete: async () => {} } },
  );
  ok("dormant tool fails closed (503)", dormant.status === 503);

  console.log(`\n${passed} passed, 0 failed`);
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
