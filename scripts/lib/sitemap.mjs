// Shared rules for sitemap.xml — used by scripts/generate-sitemap.mjs to build
// it and by tools/sitemap.test.mjs to check it, so the two cannot disagree.
//
// A URL belongs in the sitemap only when ALL of these hold:
//   1. it is on the canonical host (SITE_ORIGIN) — never the *.pages.dev mirror;
//   2. a file for it exists in the build output (dist/), i.e. it answers 200;
//   3. it is written in its canonical, extensionless form — Cloudflare Pages
//      308s `/x/index.html` to `/x/` and `/x.html` to `/x`, and a sitemap that
//      lists a redirecting URL is a sitemap Search Console reports as broken;
//   4. it is not a teacher surface (functions/_lib/teacher-surface.js decides
//      that — imported, never copied) and not the Curriculum Hub index, which
//      redirects anonymous visitors;
//   5. no `_redirects` rule redirects it;
//   6. the page does not ask not to be indexed (<meta name="robots" noindex>).

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { isCurriculumHub, isTeacherSurface } from "../../functions/_lib/teacher-surface.js";

export const SITE_ORIGIN = "https://eduwonderlab.com";

/**
 * Canonical public form of a site path: strip query/fragment, drop a trailing
 * `index.html`, and drop a trailing `.html` (Pages serves `/x.html` at `/x`).
 */
export function canonicalPath(path) {
  let p = String(path || "")
    .split("#")[0]
    .split("?")[0];
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.endsWith("/index.html")) return p.slice(0, -"index.html".length);
  if (p.endsWith(".html")) return p.slice(0, -".html".length);
  return p;
}

/** The file in `outDir` that serves a canonical path, or null if none does. */
export function fileForPath(outDir, path) {
  const rel = decodeURIComponent(path).replace(/^\/+/, "");
  const candidates =
    rel === "" || rel.endsWith("/")
      ? [`${rel}index.html`]
      : /\.[a-z0-9]+$/i.test(rel)
        ? [rel]
        : [`${rel}.html`];
  for (const c of candidates) {
    const abs = join(outDir, c);
    if (existsSync(abs) && statSync(abs).isFile()) return c;
  }
  return null;
}

/**
 * Matcher for the source paths of every redirecting rule in a `_redirects`
 * file. Status-200 rules are rewrites (the URL still answers 200) and are not
 * counted. Supports Pages' `*` splat and `:placeholder` segments.
 */
export function redirectMatcher(redirectsText) {
  const res = [];
  for (const raw of String(redirectsText || "").split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [from, , status = "302"] = line.split(/\s+/);
    if (!from?.startsWith("/") || status === "200") continue;
    const re = from
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/:[A-Za-z0-9_]+/g, "[^/]+")
      .replace(/\*/g, ".*");
    res.push(new RegExp(`^${re}$`, "i"));
  }
  return (path) => res.some((re) => re.test(path));
}

/** True when the HTML asks search engines not to index it. */
export function isNoindexHtml(html) {
  return (
    /<meta[^>]+name=["']?robots["']?[^>]*content=["'][^"']*noindex/i.test(html) ||
    /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]*name=["']?robots/i.test(html)
  );
}

/** True when the path is behind (or redirected by) the teacher gate. */
export function isGatedPath(path) {
  return isTeacherSurface(path) || isCurriculumHub(path);
}

/**
 * Why `path` may not appear in the sitemap, or null if it may.
 * @param {string} path canonical site path, e.g. "/lessons/2-6/"
 * @param {{ outDir: string, isRedirected: (p: string) => boolean }} ctx
 */
export function exclusionReason(path, { outDir, isRedirected }) {
  if (canonicalPath(path) !== path) return `not canonical (use ${canonicalPath(path)})`;
  if (isGatedPath(path)) return "teacher-gated";
  if (isRedirected(path)) return "redirected by _redirects";
  const file = fileForPath(outDir, path);
  if (!file) return "no file in the build output";
  if (file.endsWith(".html") && isNoindexHtml(readFileSync(join(outDir, file), "utf8")))
    return "page is noindex";
  return null;
}

/** Parse the <loc>/<lastmod> pairs out of a sitemap. */
export function parseSitemap(xml) {
  return [...String(xml).matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
    loc: /<loc>([^<]*)<\/loc>/.exec(body)?.[1] ?? "",
    lastmod: /<lastmod>([^<]*)<\/lastmod>/.exec(body)?.[1] ?? "",
  }));
}

/**
 * Every problem with a sitemap, as human-readable strings (empty = valid).
 * @param {string} xml
 * @param {{ outDir: string, isRedirected: (p: string) => boolean }} ctx
 */
export function sitemapProblems(xml, ctx) {
  const problems = [];
  const urls = parseSitemap(xml);
  if (!urls.length) problems.push("sitemap lists no URLs");
  const seen = new Set();
  for (const { loc, lastmod } of urls) {
    if (!loc.startsWith(`${SITE_ORIGIN}/`)) {
      problems.push(`${loc}: not on ${SITE_ORIGIN}`);
      continue;
    }
    if (seen.has(loc)) problems.push(`${loc}: listed twice`);
    seen.add(loc);
    const path = loc.slice(SITE_ORIGIN.length);
    const why = exclusionReason(path, ctx);
    if (why) problems.push(`${loc}: ${why}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) problems.push(`${loc}: missing/invalid <lastmod>`);
  }
  return problems;
}
