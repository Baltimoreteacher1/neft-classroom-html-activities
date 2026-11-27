// The Language Page front layer (lp/, built by tools/lp/build-site.mjs) on thelanguagepage.com.
//
// Clean URLs (/, /practice/..., /tools/..., /content/..., /access-guide/..., /about/..., /search/, /styleguide/)
// are served from the static lp/ folder on the Language Page host ONLY. On every other host (eduwonderlab.com and
// its previews) these paths keep answering exactly as before: the handler calls next() untouched. The files that
// mount this handler are thin re-exports (functions/index.js, functions/practice/[[path]].js, ...), so the frozen
// auth middleware (functions/_middleware.js, pinned by validate:auth-contract) is not edited: it already lets the
// lab host through for these paths because functions/_lib/language-page.js lists them (isFrontPath).
import { LP_MIC_ROUTES, LP_ROUTES } from "./lp-routes.js";

const LP_HOST = "thelanguagepage.com";
const ROUTES = new Set(LP_ROUTES);
const MIC = new Set(LP_MIC_ROUTES);
const FRONT_PREFIXES = [
  "/practice",
  "/tools",
  "/content",
  "/access-guide",
  "/about",
  "/search",
  "/styleguide",
];

const isLpHost = (hostname) => hostname === LP_HOST || hostname === `www.${LP_HOST}`;

/** True for a path the front layer owns on the Language Page host (used by language-page.js routing). */
export function isFrontPath(pathname) {
  const p = pathname.toLowerCase();
  if (p === "/") return true;
  if (p.startsWith("/lp/")) return true;
  return FRONT_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/** Pure routing decision for a Language Page host request. */
export function frontRoute(pathname) {
  // Old-style direct asset paths stay as they are.
  if (pathname.startsWith("/lp/assets/")) return { kind: "asset" };
  if (pathname === "/lp/sw.js") return { kind: "sw" };
  // /lp/<route> is the storage path, not an address: send people to the clean URL.
  if (pathname.startsWith("/lp/")) {
    const clean = pathname.slice(3) || "/";
    if (ROUTES.has(clean)) return { kind: "redirect", status: 301, location: clean };
    return { kind: "next" };
  }
  if (ROUTES.has(pathname))
    return { kind: "page", asset: pathname === "/" ? "/lp/" : `/lp${pathname}` };
  if (!pathname.endsWith("/") && ROUTES.has(`${pathname}/`))
    return { kind: "redirect", status: 308, location: `${pathname}/` };
  const lower = pathname.toLowerCase();
  if (lower !== pathname && ROUTES.has(lower.endsWith("/") ? lower : `${lower}/`))
    return { kind: "redirect", status: 308, location: lower.endsWith("/") ? lower : `${lower}/` };
  return { kind: "missing" };
}

export const FRONT_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self'",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function frontHeaders(pathname, base = new Headers()) {
  const h = new Headers(base);
  h.set("Content-Security-Policy", FRONT_CSP);
  h.set("Strict-Transport-Security", "max-age=31536000");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set(
    "Permissions-Policy",
    `camera=(), microphone=${MIC.has(pathname) ? "(self)" : "()"}, geolocation=(), payment=(), usb=(), interest-cohort=()`,
  );
  // Cloudflare does not inject its analytics beacon into a no-transform response (decision lp-no-third-party-analytics).
  h.set("Cache-Control", "no-cache, no-transform");
  h.delete("content-length");
  h.delete("etag");
  return h;
}

async function fetchAsset(context, assetPath) {
  const url = new URL(context.request.url);
  const target = new URL(assetPath, url.origin);
  if (context.env?.ASSETS?.fetch)
    return context.env.ASSETS.fetch(
      new Request(target, { method: "GET", headers: context.request.headers }),
    );
  return context.next(target.toString());
}

/** Pages Function handler shared by every front-layer mount point. */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (!isLpHost(url.hostname)) {
    // Another host: the /lp/ storage folder points at the Language Page; everything else is untouched.
    if (
      url.pathname.startsWith("/lp/") &&
      !url.pathname.startsWith("/lp/assets/") &&
      url.pathname !== "/lp/sw.js"
    ) {
      const clean = url.pathname.slice(3) || "/";
      if (ROUTES.has(clean)) return Response.redirect(`https://${LP_HOST}${clean}`, 301);
    }
    return context.next();
  }
  if (context.request.method !== "GET" && context.request.method !== "HEAD") return context.next();
  const route = frontRoute(url.pathname);
  switch (route.kind) {
    case "asset":
    case "next":
      return context.next();
    case "missing":
      // Not a front-layer page: keep the answer this host gave before the front layer existed (language-page.js
      // sent every path outside the lab to eduwonderlab.com), so an old link still lands where it used to.
      return new Response(null, {
        status: 308,
        headers: {
          Location: `https://eduwonderlab.com${url.pathname}${url.search}`,
          "Cache-Control": "no-store",
        },
      });
    case "redirect":
      return new Response(null, {
        status: route.status,
        headers: { Location: `${route.location}${url.search}`, "Cache-Control": "no-store" },
      });
    case "sw": {
      const res = await context.next();
      const h = new Headers(res.headers);
      h.set("Service-Worker-Allowed", "/");
      h.set("Cache-Control", "no-cache");
      return new Response(res.body, { status: res.status, headers: h });
    }
    case "page": {
      const res = await fetchAsset(context, route.asset);
      if (!res.ok) return res;
      return new Response(context.request.method === "HEAD" ? null : res.body, {
        status: 200,
        headers: frontHeaders(url.pathname, res.headers),
      });
    }
  }
  return context.next();
}
