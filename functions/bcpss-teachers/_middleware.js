// Adds the nonce-based Content-Security-Policy (report-only by default) to /bcpss-teachers/ HTML.
// Scoped here, not in the root functions/_middleware.js, which is pinned by validate:auth-contract
// and must stay an auth-only file. Policy and mode switch: functions/_lib/security/csp.js.
import { applyBcpssCsp } from "../_lib/security/csp.js";

export async function onRequest(context) {
  const response = await context.next();
  return applyBcpssCsp(response, new URL(context.request.url), context.env);
}
