/**
 * Detect a Cloudflare Access login interstitial.
 *
 * smoke:live used to classify that 200 HTML as "Basic Auth gate is OFF" and
 * "assets served HTML instead of the asset" — eleven false production-degraded
 * findings, plus rollback advice, when this client never reached Pages at all.
 * The student site is supposed to be open; Access wrapping `/` is either an
 * IP/policy restriction on *this* client or an operational accident. Either
 * way it is NOT a Basic Auth regression.
 */
export function isCloudflareAccess(body) {
  if (typeof body !== "string" || !body) return false;
  if (/<title>\s*Sign in\s*[^<]*Cloudflare Access/i.test(body)) return true;
  return /Cloudflare Access/i.test(body) && /<title>\s*Sign in/i.test(body);
}
