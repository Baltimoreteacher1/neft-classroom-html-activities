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
 * (tools/sync-access-shell.mjs writes the first 12 hex of their SHA-256; tools/access-module-cache.test.mjs pins it),
 * so the URL changes whenever the file does and the browser may keep it for a year without asking. The year is
 * granted only after the served bytes are checked against that hash: while a deploy switches over, a new page can
 * ask for a new hash and still receive the previous build's file, and an unchecked `immutable` would pin those old
 * bytes at the edge for a year (2026-11-12: thelanguagepage.com kept old intro-tour.css under the new hash). A
 * mismatch is sent `no-store` so the next request fetches again. Anything without a 12-hex version keeps the Pages
 * default (revalidate on every load): it is not content-addressed.
 */
const CONTENT_HASH = /^[0-9a-f]{12}$/;

async function sha12(buffer) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buffer));
  return Array.from(digest.slice(0, 6), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function withImmutableCaching(url, response) {
  const version = url.searchParams.get("v") || "";
  if (!response.ok || !CONTENT_HASH.test(version) || !/\.(?:js|css)$/i.test(url.pathname))
    return response;
  const body = await response.arrayBuffer();
  const headers = new Headers(response.headers);
  headers.set(
    "Cache-Control",
    (await sha12(body)) === version ? "public, max-age=31536000, immutable" : "no-store",
  );
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // The arcade's relative ./src and ./assets paths only resolve from a trailing-slash URL.
  if (url.pathname === "/access-practice-lab/arcade") {
    return Response.redirect(new URL(`/access-practice-lab/arcade/${url.search}`, url.origin), 308);
  }

  // Static assets (have a file extension), the generated printable packets (under /printables/, real
  // .html/.docx files) and the video hub (/videos/, generated from data/studio-videos.json) bypass the SPA shell.
  if (
    /\.[a-z0-9]+$/i.test(url.pathname) ||
    url.pathname.startsWith("/access-practice-lab/printables/") ||
    url.pathname === "/access-practice-lab/videos" ||
    url.pathname.startsWith("/access-practice-lab/videos/") ||
    // The Family Tour is its own static page (family-tour/index.html), not an app route.
    url.pathname === "/access-practice-lab/family-tour" ||
    url.pathname === "/access-practice-lab/family-tour/" ||
    // The Activity Arcade is its own static page (arcade/index.html, hash-routed), not an app route.
    url.pathname === "/access-practice-lab/arcade/"
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
