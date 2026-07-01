/**
 * Generate the neft-lti tool RSA keypair (RS256) as JWKs.
 *
 *   node lti-worker/tools/gen-keypair.mjs
 *
 * Prints the PRIVATE JWK (store as the LTI_PRIVATE_JWK secret) and the PUBLIC
 * JWK (informational — the Worker serves it at /lti/jwks, derived from the
 * private one). Run ONCE; rotating the key means re-registering with IT.
 */
const kid = "neft-lti-" + Date.now();
const pair = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);
const priv = await crypto.subtle.exportKey("jwk", pair.privateKey);
const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
priv.kid = pub.kid = kid;
priv.alg = pub.alg = "RS256";
pub.use = "sig";

console.log("\n=== PRIVATE JWK — store as secret ===");
console.log("  npx wrangler secret put LTI_PRIVATE_JWK");
console.log("  (paste the single line below when prompted)\n");
console.log(JSON.stringify(priv));
console.log("\n=== PUBLIC JWK (informational) ===\n");
console.log(JSON.stringify({ keys: [pub] }, null, 2));
