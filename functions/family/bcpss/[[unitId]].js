// Clean SPA route for multilingual BCPSS Family Cards: /family/bcpss/{unitId}?lang=es
// Serves /family/bcpss/index.html with HTTP 200 so the client hydrates from
// /api/bcpss/family/{unitId}.

export async function onRequestGet({ request, env }) {
  const shellUrl = new URL("/family/bcpss/index.html", request.url);
  const res = await env.ASSETS.fetch(shellUrl);
  if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
    const redirectUrl = new URL(res.headers.get("location"), request.url);
    return env.ASSETS.fetch(redirectUrl);
  }
  return res;
}
