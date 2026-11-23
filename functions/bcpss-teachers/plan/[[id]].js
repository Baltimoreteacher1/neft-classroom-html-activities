// Clean SPA route for shared BCPSS teacher lesson plans: /bcpss-teachers/plan/{id}
// Serves the BCPSS Teachers Hub HTML shell with HTTP 200 so the client router can
// hydrate the shared plan from /api/bcpss/plans/{id}.

export async function onRequestGet({ request, env }) {
  const shellUrl = new URL("/bcpss-teachers/index.html", request.url);
  const res = await env.ASSETS.fetch(shellUrl);
  if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
    const redirectUrl = new URL(res.headers.get("location"), request.url);
    return env.ASSETS.fetch(redirectUrl);
  }
  return res;
}
