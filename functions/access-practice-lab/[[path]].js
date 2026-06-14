// Serve the ACCESS Practice Lab app shell for clean activity URLs such as
// /access-practice-lab/Listening/A/classroom-directions while leaving static
// assets (app.js, access-data.js, styles.css) untouched.
//
// IMPORTANT: `app-shell` is an extensionless mirror of index.html — fetching it
// via ASSETS returns 200 directly, whereas fetching `/index.html` 308-redirects
// to `/` and loops. `app-shell` MUST be kept byte-identical to index.html (the
// build does this via tools/sync-access-shell.mjs). It previously drifted to a
// stale "6 activities" build with an empty panel while the hub was current.

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Static assets (have a file extension) and the generated printable packets
  // (under /printables/, served as real .html/.docx files) bypass the SPA shell.
  if (
    /\.[a-z0-9]+$/i.test(url.pathname) ||
    url.pathname.startsWith("/access-practice-lab/printables/")
  ) {
    return env.ASSETS.fetch(request);
  }

  const shellUrl = new URL("/access-practice-lab/app-shell", url.origin);
  const response = await env.ASSETS.fetch(new Request(shellUrl, request));
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(response.body, { status: response.status, headers });
}
