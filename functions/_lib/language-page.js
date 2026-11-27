// The Language Page (thelanguagepage.com) is the ACCESS Practice Lab served from this same Pages project and
// codebase under its own hostname: one engine, one deploy, no second copy to drift. This module is the single
// place that says which hostnames those are and which paths the lab host serves.
//
// Everything outside the lab's own surface (lessons, curriculum, teacher tools) lives on eduwonderlab.com, so
// the lab host redirects it there instead of serving a duplicate of the whole site. The Teacher Hub (/access-teacher/)
// IS served here, with no password (LAB_HOST_OPEN), so a teacher can run a class on thelanguagepage.com: its Class panel is
// backed by /api/class, which lives on this origin next to the students' progress. Its browser-local panels (rosters
// and typed scores) are per origin, as before. The WIDA Data Studio (/access-teacher/predictive/) is served here
// too, open like the Hub (Joel, 2026-11-17: "just this site").
//
// Redirects the other way (eduwonderlab.com/access-practice-lab -> thelanguagepage.com) are deliberately not
// here. Student progress lives in each origin's localStorage and does not cross origins, so the old origin must
// keep serving the lab until students have moved their progress (docs/language-page-migration.md).

import { STUDIO_APP_PAGES } from "../../access-practice-lab/src/studio-app.js";
import { STUDIOS, studioFor, studioPath } from "../../access-practice-lab/src/studios.js";
import { studioLabHtml } from "./language-page-studios.js";
import { isFrontPath } from "./lp-front.js";
import { LP_SITEMAP } from "./lp-routes.js";

export const LANGUAGE_PAGE_HOST = "thelanguagepage.com";
export const LEGACY_HOST = "eduwonderlab.com";
export const LAB_BASE = "/access-practice-lab";
/** The Language Page adventures app: a static export mounted here (tools/sync-static-apps.mjs). */
export const ADVENTURES_BASE = "/language-adventures";
/** The Language Studio app: a second static export mounted here, beside the adventures app. */
export const STUDIO_BASE = "/language-studio";
/** The Learning Studios landing page: a static page that lists every studio and links into /studios. */
export const LEARNING_STUDIOS_BASE = "/learning-studios";
/** The Learning Studios app, proxied from its own Worker (functions/_lib/studios-proxy.js). */
export const STUDIOS_APP_BASE = "/studios";

/** The live, presentable tour of The Language Page: the projector at /tour/, audience phones at /tour/join/. */
export const TOUR_BASE = "/tour";

/** Paths the lab itself loads, measured against the live lab (shell, fonts, Save/Resume, ping, Cloudflare). */
const LAB_PREFIXES = [
  `${LAB_BASE}/`,
  `${ADVENTURES_BASE}/`,
  `${STUDIO_BASE}/`,
  `${LEARNING_STUDIOS_BASE}/`,
  `${STUDIOS_APP_BASE}/`,
  "/assets/",
  "/data/",
  "/shared/",
  "/engine/",
  "/math/",
  "/cdn-cgi/",
  // The class platform (functions/api/class, docs/class-platform.md): class sync, live quiz and voice notes
  // must answer on the lab's own origin, because lab progress lives in that origin's storage.
  "/api/class/",
  // BCPSS Teachers Curriculum-to-Language Hub, Family Cards, and public/private APIs.
  "/bcpss-teachers/",
  "/api/bcpss/",
  "/family/bcpss/",
  "/api/public/",
  // The presented tour of the site (/tour/, generated nowhere: hand-built) and its live audience room. The room
  // must answer on this origin, next to the page whose phones call it.
  `${TOUR_BASE}/`,
  "/api/tour-room/",
];
const LAB_EXACT = new Set([
  LAB_BASE,
  TOUR_BASE,
  "/bcpss-teachers",
  "/family/bcpss",
  "/family-app/home-link.js",
  "/api/signal",
  "/api/signal/",
  // Mr. Neft, the guide on the teacher and family pages (functions/api/language-guide.js).
  "/api/language-guide",
  // Its anonymous question log, read with the teacher key (functions/api/language-guide/questions.js).
  "/api/language-guide/questions",
  // The same log grouped into themes and gaps by a model, teacher key only (functions/api/language-guide/insights.js).
  "/api/language-guide/insights",
  // The Book Studio writing coach; text is sent only on a learner's button press (functions/api/book-coach.js).
  "/api/book-coach",
  // The Experience Builder's teacher-only "Suggest improvements" (functions/api/experience-compile.js).
  "/api/experience-compile",
  STUDIOS_APP_BASE,
]);
/** The Teacher Hub and its WIDA Data Studio (/predictive). */
export const HUB_BASE = "/access-teacher";
const isHubPath = (p) => p === HUB_BASE || p.startsWith(`${HUB_BASE}/`);

/** Public lab pages listed in the sitemap: clean URLs the SPA serves through the one rewrite rule. */
export const SITEMAP_PATHS = [
  // The front layer (lp/, tools/lp/build-site.mjs): home, Practice, Teacher Tools, Content + Language, ACCESS Guide, About.
  ...LP_SITEMAP,
  `${LAB_BASE}/`,
  `${LAB_BASE}/access-prep`,
  `${LAB_BASE}/access-prep/daily-drill`,
  `${LAB_BASE}/access-prep/extempore-speak`,
  `${LAB_BASE}/twr`,
  `${LAB_BASE}/goals`,
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
  `${LAB_BASE}/reading-path`,
  `${LAB_BASE}/science-of-reading`,
  `${LAB_BASE}/science-of-reading/path`,
  `${LAB_BASE}/science-of-reading/subject-reading`,
  `${LAB_BASE}/vocabulary/mastery`,
  `${LAB_BASE}/vocab-curriculum`,
  `${LAB_BASE}/language-studios`,
  // The video hub: a generated static page (scripts/generate-studio-videos.mjs), not an app route.
  `${LAB_BASE}/videos/`,
  // The Learning Studios app (proxied at /studios), one public page each, from access-practice-lab/src/studio-app.js.
  // Teacher-only pages are left out of the crawler sitemap.
  ...STUDIO_APP_PAGES.filter((page) => page.for.some((who) => who !== "teacher")).map(
    (page) => page.path,
  ),
  // The introduction: one entrance (/start) for teachers, a family page and the Site Guide (src/intro/data.js ROUTES).
  `${LAB_BASE}/start`,
  `${LAB_BASE}/start/tour`,
  `${LAB_BASE}/start/explore`,
  `${LAB_BASE}/start/guide`,
  `${LAB_BASE}/start/lesson`,
  `${LAB_BASE}/family-tour/`,
  `${LAB_BASE}/practice-together`,
  `${LAB_BASE}/family-start`,
  `${LAB_BASE}/site-guide`,
  // The trust pages: how it works, privacy and accessibility (access-practice-lab/src/views/{method,privacy,accessibility}.js).
  `${LAB_BASE}/method`,
  `${LAB_BASE}/privacy`,
  `${LAB_BASE}/accessibility`,
  // Kindergarten, Grade 1 and Grades 2–3 home (access-practice-lab/src/views/early-hub.js) and studios.
  `${LAB_BASE}/early`,
  `${LAB_BASE}/early/story`,
  `${LAB_BASE}/early/phonics`,
  `${LAB_BASE}/early/rhyme`,
  `${LAB_BASE}/early/words`,
  `${LAB_BASE}/early/sight-words`,
  `${LAB_BASE}/early/sentences`,
  `${LAB_BASE}/early/discover`,
  `${LAB_BASE}/early/family`,
  // The WIDA ACCESS practice studios (access-practice-lab/src/studios.js); the school dashboard and the portfolio
  // gradebook under /wida-access/ are not on this host.
  ...STUDIOS.map((s) => studioPath(s.slug)),
  // BCPSS Teachers Curriculum-to-Language Hub.
  "/bcpss-teachers",
  "/bcpss-teachers/insights",
  "/bcpss-teachers/pathways",
  "/family/bcpss",
];

/**
 * The lab host has no username/password gate for now: every page it serves, teacher pages included, is open.
 * API routes keep their own key checks (class rosters, the question log), since those guard stored data.
 */
export const LAB_HOST_OPEN = true;

export const isLanguagePageHost = (hostname) =>
  hostname === LANGUAGE_PAGE_HOST || hostname === `www.${LANGUAGE_PAGE_HOST}`;

const servesOnLabHost = (pathname) => {
  const p = pathname.toLowerCase();
  return (
    LAB_EXACT.has(p) ||
    LAB_PREFIXES.some((prefix) => p.startsWith(prefix)) ||
    // The front layer's clean URLs, answered by functions/_lib/lp-front.js on this host only.
    isFrontPath(p) ||
    isHubPath(p) ||
    Boolean(studioFor(p))
  );
};

/**
 * What the lab host should do with a request before the normal gate runs.
 * Returns null for a host that is not the lab host, otherwise one of:
 *   { kind: "redirect", status, location, cacheControl? }   www -> apex, "/" -> the lab, everything else -> eduwonderlab.com
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
  // "/" is the front-layer home page (lp/index.html via functions/index.js); it was a 302 to the lab until the
  // 2026-11-27 front-layer release, which Joel asked for ("three large entry cards" on the home page).
  if (url.pathname === "/access-prep" || url.pathname === "/access-prep/")
    return {
      kind: "redirect",
      status: 302,
      location: `${url.origin}${LAB_BASE}/access-prep${url.search}`,
    };
  // The old Family Expedition address opens the Family Tour, which lives inside the lab.
  if (url.pathname === "/access-family-tour" || url.pathname === "/access-family-tour/")
    return {
      kind: "redirect",
      status: 302,
      location: `${url.origin}${LAB_BASE}/family-tour/${url.search}`,
    };
  // Short Language Page entry points for the practice library and Reading Path letter cards.
  if (url.pathname === "/library" || url.pathname === "/library/")
    return {
      kind: "redirect",
      status: 302,
      location: `${url.origin}${LAB_BASE}/library${url.search}`,
    };
  if (
    url.pathname === "/letters" ||
    url.pathname === "/letters/" ||
    url.pathname.startsWith("/letters/")
  )
    return {
      kind: "redirect",
      status: 302,
      location: `${url.origin}${LAB_BASE}/reading-path${url.pathname.replace(/\/$/, "")}${url.search}`,
    };
  // thelanguagepage.com/twr is the TWR card's short address.
  if (url.pathname === "/twr" || url.pathname.startsWith("/twr/"))
    return {
      kind: "redirect",
      status: 302,
      location: `${url.origin}${LAB_BASE}${url.pathname.replace(/\/$/, "")}${url.search}`,
    };
  // Activity Studio: a teacher's short address and the student links they share (/do/<id>) live inside the lab.
  if (
    url.pathname === "/activity-studio" ||
    url.pathname.startsWith("/activity-studio/") ||
    /^\/do\/[a-z0-9]+\/?$/.test(url.pathname)
  )
    return {
      kind: "redirect",
      status: 302,
      location: `${url.origin}${LAB_BASE}${url.pathname.replace(/\/$/, "")}${url.search}`,
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
 * The Family Tour is for thelanguagepage.com only. Every other host served by this project (eduwonderlab.com and
 * its previews) sends the tour's paths to its own Family Corner instead. Returns the redirect target or null.
 */
export function familyTourElsewhere(url) {
  if (isLanguagePageHost(url.hostname)) return null;
  const p = url.pathname.toLowerCase();
  if (p !== `${LAB_BASE}/family-tour` && !p.startsWith(`${LAB_BASE}/family-tour/`)) return null;
  return `${url.origin}${LAB_BASE}/family`;
}

/**
 * The HTML the lab host serves names The Language Page for crawlers and link previews, not only after
 * JavaScript runs: the shell is one file shared with eduwonderlab.com, so the rename happens on the way out.
 */
export const LAB_BRAND = {
  name: "The Language Page",
  poweredBy: "Powered by EduWonderLab",
  // Joel, 2026-11-24 (data/product-decisions.json "lp-site-name-the-language-page"): one name and one plain promise.
  // "ACCESS Practice Lab" names one section, the test-practice area, not the site.
  descriptor: "English for school, in your language, K–8",
};

/** The share card (tools/generate-og-card.mjs), served from the lab's own prefix so no other host is involved. */
export const OG_IMAGE_PATH = `${LAB_BASE}/pictures/og-the-language-page.png`;
const OG_ALT = `${LAB_BRAND.name}: ${LAB_BRAND.descriptor}`;
const attr = (v) => String(v).replace(/"/g, "&quot;");

/**
 * Open Graph and Twitter tags for a page, from the page's own (already branded) <title> and meta description, so a link
 * pasted into a chat or a post shows a title, a sentence and a picture. Nothing is added when the page already sets
 * og:image, and a page with no description gets the product's plain promise and its honesty line.
 */
export function shareMeta(html) {
  if (/property=["']og:image["']/.test(html)) return "";
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] || LAB_BRAND.name;
  const description =
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/.exec(
      html.replace(/\s+/g, " "),
    )?.[1] || `${LAB_BRAND.descriptor}. Original practice, not an official WIDA or ACCESS test.`;
  const image = `https://${LANGUAGE_PAGE_HOST}${OG_IMAGE_PATH}`;
  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${attr(title)}" />`,
    `<meta property="og:description" content="${attr(description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${attr(OG_ALT)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join("\n");
}

/** Hub pages are the teacher area of The Language Page, not "ACCESS Practice Lab". */
export function hubTitle(html) {
  return html.replace(/<title>([^<]*?) — (?:ACCESS )?Teacher Hub<\/title>/, (_, page) =>
    /^ACCESS Practice Lab$/.test(page)
      ? `<title>Teacher Hub · ${LAB_BRAND.name}</title>`
      : `<title>${page} · Teacher Hub · ${LAB_BRAND.name}</title>`,
  );
}

export function brandLabHtml(html, pathname) {
  // Front-layer pages carry their own title, canonical and share tags (tools/lp/site/layout.mjs).
  if (html.includes('<meta name="lp-front"')) return html;
  const studio = studioFor(pathname);
  if (studio) return studioLabHtml(html, studio, pathname);
  const canonical = `https://${LANGUAGE_PAGE_HOST}${pathname}`;
  const titled = hubTitle(html)
    .replace(
      /<title>(?:ELL Lab|ACCESS Practice Lab)<\/title>/,
      `<title>${LAB_BRAND.name} · ${LAB_BRAND.descriptor}</title>`,
    )
    .replace(
      /<strong>(?:ELL Lab|ACCESS Practice Lab)<\/strong><small>EduWonderLab<\/small>/,
      `<strong>${LAB_BRAND.name}</strong><small>${LAB_BRAND.descriptor}</small>`,
    )
    // The Teacher Hub's own masthead and kicker, and the BCPSS Teacher Studio's home crumb: the teacher area of
    // The Language Page, not a second product (decision lp-site-name-the-language-page).
    .replace(
      /<strong>ACCESS Practice Lab<\/strong><small>Teacher Hub<\/small>/,
      `<strong>${LAB_BRAND.name}</strong><small>Teacher Hub</small>`,
    )
    .replace(
      /<p class="th-kicker">ACCESS Practice Lab · EduWonderLab<\/p>/,
      `<p class="th-kicker">${LAB_BRAND.name} · for teachers</p>`,
    )
    .replace(
      /(<a href="\/access-practice-lab\/" class="bh-home-link">[\s\S]*?<\/span>\s*)<span>ACCESS Practice Lab<\/span>/,
      `$1<span>${LAB_BRAND.name}</span>`,
    );
  return titled.replace(
    "</head>",
    `<link rel="canonical" href="${canonical}" />\n<meta property="og:site_name" content="${LAB_BRAND.name}" />\n<meta property="og:url" content="${canonical}" />\n${shareMeta(titled)}\n</head>`,
  );
}

/**
 * Joel, 2026-11-24 (data/product-decisions.json "lp-no-third-party-analytics"): thelanguagepage.com loads no third-party
 * analytics. Cloudflare Web Analytics is switched on for the zone and injects its beacon into HTML AT THE EDGE
 * (static.cloudflareinsights.com plus a POST to /cdn-cgi/rum), so it is not in the repository and cannot be removed
 * from source. Cloudflare does not rewrite a response marked `no-transform`, so the lab host's HTML carries it.
 * tools/validate-language-page-network.mjs measures the result in a browser; if the beacon ever returns, turn Web Analytics
 * off for this hostname in the Cloudflare dashboard.
 */
export function setNoTransform(headers) {
  const current = headers.get("cache-control") || "";
  if (/(^|,)\s*no-transform\s*(,|$)/i.test(current)) return;
  headers.set("Cache-Control", current ? `${current}, no-transform` : "no-transform");
}

const isHtml = (response) => (response.headers.get("content-type") || "").includes("text/html");

/**
 * `no-transform` has a cost: Cloudflare's edge will not compress the response either. Measured 2026-11-27, the lab shell
 * went out as 208,906 bytes on thelanguagepage.com and 30,646 (brotli) on eduwonderlab.com, the same page. So the lab
 * host asks the Workers runtime to encode its HTML: a Content-Encoding header with the default encodeBody "automatic"
 * makes the runtime compress the body for the visitor's real Accept-Encoding (measured in workerd: brotli 29,732 bytes for a
 * br client, gzip 34,102 for gzip, the plain 208,906 for `identity`). The header is a request to the runtime, not a claim
 * about the bytes, which is why it is not paired with a pre-compressed body.
 */
export async function brandLabResponse(response, url) {
  if (!isLanguagePageHost(url.hostname) || !response.ok) return response;
  if (!isHtml(response)) return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("etag");
  setNoTransform(headers);
  headers.set("Content-Encoding", "gzip");
  const vary = headers.get("vary");
  if (!/(^|,)\s*accept-encoding\s*(,|$)/i.test(vary || ""))
    headers.set("Vary", vary ? `${vary}, Accept-Encoding` : "Accept-Encoding");
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
