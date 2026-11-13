// The Language Page (thelanguagepage.com) is the ACCESS Practice Lab served from this same Pages project and
// codebase under its own hostname: one engine, one deploy, no second copy to drift. This module is the single
// place that says which hostnames those are and which paths the lab host serves.
//
// Everything outside the lab's own surface (lessons, curriculum, teacher tools) lives on eduwonderlab.com, so
// the lab host redirects it there instead of serving a duplicate of the whole site. The Teacher Hub (/access-teacher/)
// IS served here, behind the same teacher gate, so a teacher can run a class on thelanguagepage.com: its Class panel is
// backed by /api/class, which lives on this origin next to the students' progress. Its browser-local panels (rosters
// and typed scores) are per origin, as before. The Hub's math Flight Deck and the score predictor stay on
// eduwonderlab.com.
//
// Redirects the other way (eduwonderlab.com/access-practice-lab -> thelanguagepage.com) are deliberately not
// here. Student progress lives in each origin's localStorage and does not cross origins, so the old origin must
// keep serving the lab until students have moved their progress (docs/language-page-migration.md).

import { STUDIOS, studioFor, studioPath } from "../../access-practice-lab/src/studios.js";
import { studioLabHtml } from "./language-page-studios.js";

export const LANGUAGE_PAGE_HOST = "thelanguagepage.com";
export const LEGACY_HOST = "eduwonderlab.com";
export const LAB_BASE = "/access-practice-lab";
/** The Language Page adventures app: a static export mounted here (tools/sync-static-apps.mjs). */
export const ADVENTURES_BASE = "/language-adventures";
/** The Language Studio app: a second static export mounted here, beside the adventures app. */
export const STUDIO_BASE = "/language-studio";
/** The Learning Studios landing page: a static page that points to studios.eduwonderlab.com. */
export const LEARNING_STUDIOS_BASE = "/learning-studios";

/** Paths the lab itself loads, measured against the live lab (shell, fonts, Save/Resume, ping, Cloudflare). */
const LAB_PREFIXES = [
  `${LAB_BASE}/`,
  `${ADVENTURES_BASE}/`,
  `${STUDIO_BASE}/`,
  `${LEARNING_STUDIOS_BASE}/`,
  "/graphic-novels/",
  "/assets/",
  "/data/",
  "/shared/",
  "/engine/",
  "/math/",
  "/cdn-cgi/",
  // The class platform (functions/api/class, docs/class-platform.md): class sync, live quiz and voice notes
  // must answer on the lab's own origin, because lab progress lives in that origin's storage.
  "/api/class/",
];
const LAB_EXACT = new Set([
  LAB_BASE,
  "/family-app/home-link.js",
  "/api/signal",
  "/api/signal/",
  // Mr. Neft, the guide on the teacher and family pages (functions/api/language-guide.js).
  "/api/language-guide",
  // Its anonymous question log, read with the teacher key (functions/api/language-guide/questions.js).
  "/api/language-guide/questions",
  // The same log grouped into themes and gaps by a model, teacher key only (functions/api/language-guide/insights.js).
  "/api/language-guide/insights",
  "/graphic-novels",
]);
/** The Teacher Hub, minus the two surfaces that are not language practice. */
export const HUB_BASE = "/access-teacher";
const HUB_EXCLUDED = [`${HUB_BASE}/predictive`, `${HUB_BASE}/flight-deck`];
const isHubPath = (p) =>
  (p === HUB_BASE || p.startsWith(`${HUB_BASE}/`)) &&
  !HUB_EXCLUDED.some((x) => p === x || p.startsWith(`${x}/`));

/** Public lab pages listed in the sitemap: clean URLs the SPA serves through the one rewrite rule. */
export const SITEMAP_PATHS = [
  `${LAB_BASE}/`,
  `${LAB_BASE}/access-prep`,
  `${LAB_BASE}/path`,
  `${LAB_BASE}/scaffold`,
  `${LAB_BASE}/learn`,
  `${LAB_BASE}/passport`,
  `${LAB_BASE}/growth`,
  `${LAB_BASE}/speak`,
  `${LAB_BASE}/voice`,
  `${LAB_BASE}/units`,
  `${LAB_BASE}/arena`,
  `${LAB_BASE}/mentor`,
  `${LAB_BASE}/sentences`,
  `${LAB_BASE}/wordlab`,
  `${LAB_BASE}/scenarios`,
  `${LAB_BASE}/newsroom`,
  `${LAB_BASE}/warmup`,
  `${LAB_BASE}/search`,
  `${LAB_BASE}/portfolio`,
  `${LAB_BASE}/collection`,
  `${LAB_BASE}/write`,
  `${LAB_BASE}/journey`,
  `${LAB_BASE}/vocabulary`,
  `${LAB_BASE}/grammar`,
  `${LAB_BASE}/reading-room`,
  `${LAB_BASE}/worlds`,
  `${LAB_BASE}/worlds/science-lab`,
  `${LAB_BASE}/class`,
  `${LAB_BASE}/move`,
  `${LAB_BASE}/science-of-reading`,
  `${LAB_BASE}/science-of-reading/path`,
  `${LAB_BASE}/science-of-reading/subject-reading`,
  `${LAB_BASE}/vocabulary/mastery`,
  `${LAB_BASE}/vocab-curriculum`,
  `${LAB_BASE}/language-studios`,
  // The introduction: one entrance (/start) for teachers, a family page and the Site Guide (src/intro/data.js ROUTES).
  `${LAB_BASE}/start`,
  `${LAB_BASE}/start/tour`,
  `${LAB_BASE}/start/explore`,
  `${LAB_BASE}/start/guide`,
  `${LAB_BASE}/start/lesson`,
  `${LAB_BASE}/practice-together`,
  `${LAB_BASE}/site-guide`,
  // Kindergarten, Grade 1 and Grades 2–3 home (access-practice-lab/src/views/early-hub.js).
  `${LAB_BASE}/early`,
  // The WIDA ACCESS practice studios (access-practice-lab/src/studios.js); the school dashboard and the portfolio
  // gradebook under /wida-access/ are not on this host.
  ...STUDIOS.map((s) => studioPath(s.slug)),
];

export const isLanguagePageHost = (hostname) =>
  hostname === LANGUAGE_PAGE_HOST || hostname === `www.${LANGUAGE_PAGE_HOST}`;

const servesOnLabHost = (pathname) => {
  const p = pathname.toLowerCase();
  return (
    LAB_EXACT.has(p) ||
    LAB_PREFIXES.some((prefix) => p.startsWith(prefix)) ||
    isHubPath(p) ||
    Boolean(studioFor(p))
  );
};

/**
 * What the lab host should do with a request before the normal gate runs.
 * Returns null for a host that is not the lab host, otherwise one of:
 *   { kind: "redirect", status, location }   www -> apex, "/" -> the lab, everything else -> eduwonderlab.com
 *   { kind: "robots" } | { kind: "sitemap" } generated per host (the static files name eduwonderlab.com)
 *   { kind: "serve" }                        fall through to the lab
 */
export function languagePageRoute(url) {
  if (!isLanguagePageHost(url.hostname)) return null;
  // www and the apex are one site: a stored sign-in or bookmark must not split across them.
  if (url.hostname !== LANGUAGE_PAGE_HOST) {
    const target = new URL(url);
    target.hostname = LANGUAGE_PAGE_HOST;
    return { kind: "redirect", status: 308, location: target.toString() };
  }
  if (url.pathname === "/robots.txt") return { kind: "robots" };
  if (url.pathname === "/sitemap.xml") return { kind: "sitemap" };
  if (url.pathname === "/")
    return { kind: "redirect", status: 302, location: `${url.origin}${LAB_BASE}/` };
  if (url.pathname === "/access-prep" || url.pathname === "/access-prep/")
    return {
      kind: "redirect",
      status: 302,
      location: `${url.origin}${LAB_BASE}/access-prep${url.search}`,
    };
  if (url.pathname.startsWith("/access-prep/"))
    return {
      kind: "redirect",
      status: 302,
      location: `${url.origin}${LAB_BASE}${url.pathname}${url.search}`,
    };
  if (servesOnLabHost(url.pathname)) return { kind: "serve" };
  return {
    kind: "redirect",
    status: 308,
    location: `https://${LEGACY_HOST}${url.pathname}${url.search}`,
  };
}

/**
 * The HTML the lab host serves names The Language Page for crawlers and link previews, not only after
 * JavaScript runs: the shell is one file shared with eduwonderlab.com, so the rename happens on the way out.
 */
export const LAB_BRAND = { name: "The Language Page", poweredBy: "Powered by EduWonderLab" };

export function brandLabHtml(html, pathname) {
  const studio = studioFor(pathname);
  if (studio) return studioLabHtml(html, studio, pathname);
  const canonical = `https://${LANGUAGE_PAGE_HOST}${pathname}`;
  return html
    .replace(
      "<title>ACCESS Practice Lab</title>",
      `<title>${LAB_BRAND.name} · ACCESS Practice Lab</title>`,
    )
    .replace(
      "<strong>ACCESS Practice Lab</strong><small>EduWonderLab</small>",
      `<strong>${LAB_BRAND.name}</strong><small>${LAB_BRAND.poweredBy}</small>`,
    )
    .replace(
      "</head>",
      `<link rel="canonical" href="${canonical}" />\n<meta property="og:site_name" content="${LAB_BRAND.name}" />\n<meta property="og:url" content="${canonical}" />\n</head>`,
    );
}

export async function brandLabResponse(response, url) {
  if (!isLanguagePageHost(url.hostname) || !response.ok) return response;
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("etag");
  return new Response(brandLabHtml(await response.text(), url.pathname), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function robotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: https://${LANGUAGE_PAGE_HOST}/sitemap.xml\n`;
}

export function sitemapXml() {
  const urls = SITEMAP_PATHS.map(
    (path) => `  <url><loc>https://${LANGUAGE_PAGE_HOST}${path}</loc></url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
