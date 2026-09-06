/* Tenant teacher surface — auth contracts, provable without infrastructure.
 * Signs a real RS256 JWT with a locally generated key and serves the matching
 * JWKS through a stub fetch, so the verifier's positive path is tested for
 * real — not mocked away.
 */
import assert from "node:assert/strict";

const { verifyAccessJwt } = await import("../_lib/access-jwt.js");
const { onRequest: teachApi } = await import("./[tenant]/teach/api/[[path]].js");

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const TEAM = "example.cloudflareaccess.com";
const AUD = "test-aud-tag";
const ENV = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD_TEACH: AUD };

// -- craft a real signed token + stub JWKS ----------------------------------
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
  true,
  ["sign", "verify"],
);
const jwk = { ...(await crypto.subtle.exportKey("jwk", publicKey)), kid: "k1", alg: "RS256", use: "sig" };
const stubFetch = async () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });

async function sign(payload) {
  const h = b64url(JSON.stringify({ alg: "RS256", kid: "k1" }));
  const p = b64url(JSON.stringify(payload));
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(`${h}.${p}`),
  );
  return `${h}.${p}.${b64url(sig)}`;
}

const good = {
  aud: [AUD],
  iss: `https://${TEAM}`,
  exp: Math.floor(Date.now() / 1000) + 600,
  email: "colleague@example.org",
};

const reqWith = (token) =>
  new Request("https://eduwonderlab.com/t/staging/teach/api/progress/digest", {
    headers: token ? { "Cf-Access-Jwt-Assertion": token } : {},
  });

// 1. Unconfigured deployment -> not-configured, and no network is attempted.
{
  const r = await verifyAccessJwt(reqWith(await sign(good)), {}, () => {
    throw new Error("must not fetch when unconfigured");
  });
  assert.deepEqual(r, { ok: false, reason: "not-configured" });
}

// 2. A genuinely signed, matching token verifies and yields the email.
{
  const r = await verifyAccessJwt(reqWith(await sign(good)), ENV, stubFetch);
  assert.deepEqual(r, { ok: true, email: "colleague@example.org" });
}

// 3. Wrong audience, expired, wrong issuer, and garbage all refuse.
for (const bad of [
  { ...good, aud: ["other-app"] },
  { ...good, exp: Math.floor(Date.now() / 1000) - 10 },
  { ...good, iss: "https://evil.example.com" },
]) {
  const r = await verifyAccessJwt(reqWith(await sign(bad)), ENV, stubFetch);
  assert.equal(r.ok, false, `must refuse: ${JSON.stringify(bad.aud)}`);
}
{
  const r = await verifyAccessJwt(reqWith("garbage.token.here"), ENV, stubFetch);
  assert.equal(r.ok, false);
}

// 4. A tampered payload fails signature verification.
{
  const token = await sign(good);
  const [h, , s] = token.split(".");
  const forged = `${h}.${b64url(JSON.stringify({ ...good, email: "attacker@example.org" }))}.${s}`;
  const r = await verifyAccessJwt(reqWith(forged), ENV, stubFetch);
  assert.equal(r.ok, false, "signature must bind the payload");
}

// -- the wrapper's own gates ------------------------------------------------
const ctx = (tenant, path, env = {}, token = null) => ({
  request: reqWith(token),
  env,
  params: { tenant, path },
});

// 5. Unknown tenant -> 404 even before auth questions arise.
assert.equal((await teachApi(ctx("nope", ["progress", "digest"]))).status, 404);

// 6. Known tenant, unconfigured Access -> 503 (inert, like an unbound D1).
assert.equal((await teachApi(ctx("staging", ["progress", "digest"]))).status, 503);

// 7. Configured Access, no/garbage token -> 401.
{
  const res = await teachApi(ctx("staging", ["progress", "digest"], ENV, "garbage.token.here"));
  assert.equal(res.status, 401);
}

console.log("teach-endpoint: 7/7 auth contracts hold (real RS256 sign/verify)");
