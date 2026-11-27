// The Learning Studios (language studios for grades 3-8 and the Grade 6 math studios) are a Next.js app on their
// own Worker. This module serves that app at /studios on thelanguagepage.com and eduwonderlab.com, on the visitor's
// own origin, so it reads as part of the site: same address bar, same saved progress origin, no second domain.
//
// It is a plain reverse proxy and nothing more:
//   - the upstream is one fixed address, never derived from the request (no way to point it elsewhere);
//   - only GET, HEAD and POST are forwarded (POST carries the app's server-side answer grading);
//   - only an explicit list of request headers goes upstream, so the site's teacher cookie and any
//     Authorization header never reach another service, and no upstream cookie reaches the visitor;
//   - the visitor's host and Origin go along so the app's server-action origin check sees the real site;
//   - an unreachable upstream answers 502 for /studios only; every other path on the site is untouched.

import { STUDIO_APP_PAGES } from "../../access-practice-lab/src/studio-app.js";
import { isLanguagePageHost, LAB_BRAND } from "./language-page.js";

export const STUDIOS_BASE = "/studios";
export const STUDIOS_UPSTREAM = "https://learning-studios.neftjd.workers.dev";

const PROXY_HOSTS = new Set(["thelanguagepage.com", "eduwonderlab.com"]);
const METHODS = new Set(["GET", "HEAD", "POST"]);
// Next.js navigation and server-action protocol headers, plus ordinary content negotiation.
const FORWARDED_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "if-none-match",
  "if-modified-since",
  "range",
  "next-action",
  "next-router-state-tree",
  "next-router-prefetch",
  "next-router-segment-prefetch",
  "next-url",
  "rsc",
];

export const isStudiosPath = (pathname) =>
  pathname === STUDIOS_BASE || pathname.startsWith(`${STUDIOS_BASE}/`);

/** True when this request belongs to the studios app on a host that serves it. */
export const isStudiosRequest = (url) =>
  PROXY_HOSTS.has(url.hostname) && isStudiosPath(url.pathname);

const text = (status, body, extra = {}) =>
  new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/**
 * The studios app sets one title for every page ("Learning Studios · The Language Page"), so a browser tab, a bookmark and
 * a search result cannot tell Speaking from Writing. The listing the lab already keeps (access-practice-lab/src/studio-app.js)
 * names each page; this puts that name in the <title> (and og:title when the app sets one). Pages the listing does not
 * name, such as a math lesson, keep the app's own title.
 */
const titleFor = (page, hostname) =>
  isLanguagePageHost(hostname) ? `${page.title[0]} · ${LAB_BRAND.name}` : page.title[0];
const trimPath = (pathname) => (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname);

/**
 * A script that keeps each listed studio page's title. The app sets its own title again once it has loaded, which puts the
 * generic name back in the browser tab even though the HTML the server sent was right, and its in-app links change the
 * address without loading a new page. The script re-applies the title for whatever path the address shows, whenever the
 * title changes. For a path the listing does not name it does nothing, so the app's own titles stay.
 */
export function studioTitleGuard(hostname) {
  const table = {};
  for (const page of STUDIO_APP_PAGES) table[page.path] = titleFor(page, hostname);
  const json = JSON.stringify(table).replace(/</g, "\\u003c");
  return `<script>(function(){var T=${json};function f(){var t=T[location.pathname.replace(/\\/+$/,"")||"/"];if(t&&document.title!==t)document.title=t}f();new MutationObserver(f).observe(document.head,{childList:true,subtree:true,characterData:true})})()</script>`;
}

export function studioPageTitle(html, pathname, hostname) {
  const key = trimPath(pathname);
  const page = STUDIO_APP_PAGES.find((p) => p.path === key);
  let out = html;
  if (page) {
    const title = esc(titleFor(page, hostname));
    out = out
      .replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`)
      .replace(
        /(<meta\s+property=["']og:title["']\s+content=)["'][^"']*["']/,
        (_, a) => `${a}"${title}"`,
      );
  }
  return out.includes("</head>")
    ? out.replace("</head>", () => `${studioTitleGuard(hostname)}</head>`)
    : out;
}

export async function proxyStudios(request, url, upstreamFetch = fetch) {
  if (!METHODS.has(request.method))
    return text(405, "Method not allowed.", { Allow: "GET, HEAD, POST" });

  const target = new URL(STUDIOS_UPSTREAM);
  target.pathname = url.pathname;
  target.search = url.search;

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-forwarded-host", url.host);
  headers.set("x-forwarded-proto", "https");
  const origin = request.headers.get("origin");
  if (origin) headers.set("origin", origin);

  const init = { method: request.method, headers, redirect: "manual" };
  if (request.method === "POST") {
    init.body = request.body;
    init.duplex = "half";
  }

  let upstream;
  try {
    upstream = await upstreamFetch(target, init);
  } catch (_error) {
    return text(502, "The studios are unavailable right now. Please try again in a minute.");
  }

  const out = new Headers(upstream.headers);
  // The body is already decoded by fetch; the edge compresses it again for the visitor.
  out.delete("content-encoding");
  out.delete("content-length");
  out.delete("set-cookie");
  const location = out.get("location");
  if (location) {
    try {
      const next = new URL(location, target);
      if (next.origin === target.origin)
        out.set("location", `${url.origin}${next.pathname}${next.search}${next.hash}`);
    } catch (_error) {
      out.delete("location");
    }
  }
  // Pages are re-checked on every visit so a new deploy is seen at once; the hashed /_next/static files
  // keep the long cache the app gives them.
  const isHtml = (out.get("content-type") || "").includes("text/html");
  if (isHtml) {
    out.set("cache-control", "public, max-age=0, must-revalidate");
  }
  if (isHtml && request.method === "GET" && upstream.status === 200) {
    return new Response(studioPageTitle(await upstream.text(), url.pathname, url.hostname), {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: out,
    });
  }
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}
