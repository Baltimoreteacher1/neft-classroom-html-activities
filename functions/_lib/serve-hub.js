// Serve the Neft Hub at its short links.
//
// /hub, /neft-hub, /home and /start were 301s to `/` in data/routes.json. That
// reads correctly against this repo — index.html IS the hub — and is wrong
// against production: eduwonderlab.com/ is answered by a Cloudflare Worker in
// the eduwonderlab-home repo, so all four delivered that worker's personal
// portal instead of the classroom front door.
//
// The worker's route is the apex root ONLY, so a non-root path like /hub is
// still ours to answer. It just has to be answered with CONTENT rather than
// with a redirect to a URL this project does not control.
//
// WHY A PAGES FUNCTION, and not any of the alternatives:
//
//   - a 200 rewrite in _redirects: writeRedirects emits rewrites after all 382
//     redirects, past the 100-rule cutoff measured on this project, where they
//     are silently dead.
//   - a 301 to /index.html: Pages canonicalizes that straight back to /, i.e.
//     back into the worker.
//   - a branch in functions/_middleware.js: it works, but that file is the
//     site-wide AUTH gate. validate:auth-contract pins it by content precisely
//     so an auth boundary cannot move as a side effect of an unrelated edit,
//     and re-pinning demands `npm run e2e:auth` in both engines. Putting a
//     public routing concern there means every future reader of a four-path
//     alias has to reason about the teacher password gate, and one careless
//     edit to it can 401 or 503 the whole site.
//
// A per-route function is the narrow tool: it cannot affect any path but its
// own, and it leaves the auth baseline untouched.
//
// Functions are matched before the static asset pipeline, so this also takes
// precedence over the 301 those paths still carry in _redirects. That 301 is
// deliberately left in place as the bypass fallback — see the notes on those
// four rules in data/routes.json.

/**
 * Answer with the root asset, keeping the alias in the address bar.
 *
 * Degrades to the old behaviour instead of inventing a new failure: if the root
 * asset does not come back 200, fall through to the 301 these paths have always
 * had. A short link that lands on the wrong page is a papercut; one that 500s in
 * front of a class is not.
 */
export async function serveHub({ request, next }) {
  const url = new URL(request.url);
  const root = new URL("/", url);

  // Serving a GET body in answer to a POST would silently discard the request.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return Response.redirect(root.toString(), 301);
  }

  let response;
  try {
    response = await next(new Request(root, request));
  } catch {
    return Response.redirect(root.toString(), 301);
  }
  if (response.status !== 200) return Response.redirect(root.toString(), 301);

  const headers = new Headers(response.headers);
  // The alias and the canonical page are one document. Say so, rather than
  // letting four URLs compete as duplicate content.
  headers.set("Link", `<${root.toString()}>; rel="canonical"`);
  return new Response(response.body, { status: 200, headers });
}

export const onRequest = serveHub;
