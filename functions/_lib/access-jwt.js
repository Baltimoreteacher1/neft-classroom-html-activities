/* Cloudflare Access JWT verification for tenant teacher surfaces (Phase 3
 * milestone 2, Decision 4: tenant teachers sign in with Google through
 * Cloudflare Access; the classroom's own Basic-auth path is untouched).
 *
 * Access, when configured in front of a path, injects Cf-Access-Jwt-Assertion
 * on every request that passed its login. This verifies that assertion against
 * the team's public keys, so the application never trusts the header blindly —
 * defense in depth against a misconfigured or bypassed edge policy.
 *
 * Configuration (Pages vars, both non-secret):
 *   ACCESS_TEAM_DOMAIN  e.g. "neft.cloudflareaccess.com"
 *   ACCESS_AUD_TEACH    the Access application's audience tag
 *
 * Unconfigured -> { ok:false, reason:"not-configured" } and callers answer 503,
 * the same inert-until-provisioned contract the tenant D1 bindings use.
 */

const b64urlToBytes = (s) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

// Team certs change rarely; cache per isolate.
let certsCache = { url: null, keys: null, fetchedAt: 0 };

async function teamKeys(teamDomain, fetchImpl) {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;
  const fresh = certsCache.url === url && Date.now() - certsCache.fetchedAt < 6 * 3600 * 1000;
  if (!fresh) {
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`certs fetch ${res.status}`);
    certsCache = { url, keys: (await res.json()).keys || [], fetchedAt: Date.now() };
  }
  return certsCache.keys;
}

/**
 * @returns {Promise<{ok:true, email:string} | {ok:false, reason:"not-configured"|"unauthorized"}>}
 */
export async function verifyAccessJwt(request, env, fetchImpl = fetch) {
  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD_TEACH;
  if (!teamDomain || !aud) return { ok: false, reason: "not-configured" };

  const token = request.headers.get("Cf-Access-Jwt-Assertion") || "";
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "unauthorized" };

  try {
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));

    const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const now = Math.floor(Date.now() / 1000);
    if (
      !audList.includes(aud) ||
      typeof payload.exp !== "number" ||
      payload.exp <= now ||
      payload.iss !== `https://${teamDomain}`
    ) {
      return { ok: false, reason: "unauthorized" };
    }

    const jwk = (await teamKeys(teamDomain, fetchImpl)).find((k) => k.kid === header.kid);
    if (!jwk) return { ok: false, reason: "unauthorized" };
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return { ok: false, reason: "unauthorized" };
    return { ok: true, email: payload.email || "" };
  } catch {
    return { ok: false, reason: "unauthorized" };
  }
}
