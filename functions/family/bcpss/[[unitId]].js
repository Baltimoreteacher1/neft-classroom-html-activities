// Clean SPA route for the bilingual BCPSS Family Guide: /family/bcpss/{unitId}?lang=es
// Serves /family/bcpss/index.html with HTTP 200 so the client hydrates from
// /api/bcpss/family-guide/{unitId}.
//
// This catch-all matches every path under /family/bcpss/, including the page's own CSS and
// JavaScript. Only the folder root and a bare unit id get the shell; anything else (a file with an
// extension, a nested path) falls through to the static asset with its own MIME type.

const SHELL_ROUTE = /^\/family\/bcpss\/?([A-Za-z0-9_-]{2,80}\/?)?$/;

export async function onRequestGet({ request, env, next }) {
  const { pathname } = new URL(request.url);
  if (!SHELL_ROUTE.test(pathname)) return next();
  const shellUrl = new URL("/family/bcpss/index.html", request.url);
  const res = await env.ASSETS.fetch(shellUrl);
  if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
    const redirectUrl = new URL(res.headers.get("location"), request.url);
    return env.ASSETS.fetch(redirectUrl);
  }
  return res;
}
