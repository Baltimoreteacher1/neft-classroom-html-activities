// Serve the ACCESS Practice Lab app shell for clean activity URLs such as
// /access-practice-lab/Listening/A/classroom-directions while leaving static
// assets (app.js, access-data.js, styles.css) untouched.

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (/\.[a-z0-9]+$/i.test(url.pathname)) {
    return env.ASSETS.fetch(request);
  }

  const shellUrl = new URL("/access-practice-lab/app-shell", url.origin);
  const response = await env.ASSETS.fetch(new Request(shellUrl, request));
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(response.body, { status: response.status, headers });
}
