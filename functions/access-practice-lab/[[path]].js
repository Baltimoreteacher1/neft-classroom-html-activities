// Serve the ACCESS Practice Lab app shell for clean activity URLs such as
// /access-practice-lab/Listening/A/classroom-directions while leaving static
// assets (src/*.js, content/*.json, pictures/*.svg, styles.css) untouched.
//
// IMPORTANT: `app-shell` is an extensionless mirror of index.html — fetching it
// via ASSETS returns 200 directly, whereas fetching `/index.html` 308-redirects
// to `/` and loops. `app-shell` MUST be kept byte-identical to index.html (the
// build does this via tools/sync-access-shell.mjs). It previously drifted to a
// stale "6 activities" build with an empty panel while the hub was current.

/**
 * A module or stylesheet requested as `?v=<hash>` is addressed by the hash of its own bytes
 * (tools/sync-access-shell.mjs writes the hash; tools/access-module-cache.test.mjs pins it), so the URL
 * changes whenever the file does and the browser may keep it for a year without asking. Anything without a
 * version keeps the Pages default (revalidate on every load): an unhashed URL is not content-addressed.
 */
function withImmutableCaching(url, response) {
  if (!response.ok || !url.searchParams.has("v") || !/\.(?:js|css)$/i.test(url.pathname))
    return response;
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Static assets (have a file extension) and the generated printable packets
  // (under /printables/, served as real .html/.docx files) bypass the SPA shell.
  if (
    /\.[a-z0-9]+$/i.test(url.pathname) ||
    url.pathname.startsWith("/access-practice-lab/printables/")
  ) {
    const asset = await env.ASSETS.fetch(request);
    return withImmutableCaching(url, asset);
  }

  const shellUrl = new URL("/access-practice-lab/app-shell", url.origin);
  const response = await env.ASSETS.fetch(new Request(shellUrl, request));
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  // Never cache the HTML shell so a new deploy is seen immediately on deep links.
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}
