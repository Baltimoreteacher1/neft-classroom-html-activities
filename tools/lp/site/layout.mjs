// Page shell: head, header with the five-item navigation, breadcrumbs, footer with the disclaimer.
import fs from "node:fs";
import { icon } from "./icons.mjs";
import { esc, html, jsonBlock, raw, SITE } from "./util.mjs";

// The reading font's files, read from the stylesheet so a re-hashed font cannot leave a stale preload behind.
const READ_FONTS = [
  ...fs
    .readFileSync(new URL("../../../lp/assets/site.css", import.meta.url), "utf8")
    .matchAll(/url\((\/assets\/fonts\/atkinson-hyperlegible-[0-9a-f]+\.woff2)\)/g),
].map((m) => m[1]);
if (READ_FONTS.length !== 2)
  throw new Error(`layout: expected 2 reading-font files in site.css, found ${READ_FONTS.length}`);

export const NAV = [
  { key: "practice", href: "/practice/", i18n: "nav.practice", label: "Practice" },
  { key: "tools", href: "/tools/", i18n: "nav.tools", label: "Teacher Tools" },
  { key: "content", href: "/content/", i18n: "nav.content", label: "Content + Language" },
  { key: "guide", href: "/access-guide/", i18n: "nav.guide", label: "ACCESS Guide" },
  { key: "about", href: "/about/", i18n: "nav.about", label: "About" },
];

export const DISCLAIMER =
  "The Language Page offers original practice inspired by the WIDA ELD Standards Framework. It is not affiliated with, endorsed by, or sponsored by WIDA or the WIDA Consortium. WIDA and WIDA ACCESS (formerly ACCESS for ELLs) are trademarks of the Board of Regents of the University of Wisconsin System.";

const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="2" y="2" width="17" height="17" rx="5.5" fill="#17324d"/><rect x="21" y="2" width="17" height="17" rx="5.5" fill="#1fa6a2"/><rect x="2" y="21" width="17" height="17" rx="5.5" fill="#f2765a"/><rect x="21" y="21" width="17" height="17" rx="5.5" fill="#f2c15b"/></svg>`;
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect x='2' y='2' width='17' height='17' rx='5.5' fill='%2317324d'/%3E%3Crect x='21' y='2' width='17' height='17' rx='5.5' fill='%231fa6a2'/%3E%3Crect x='2' y='21' width='17' height='17' rx='5.5' fill='%23f2765a'/%3E%3Crect x='21' y='21' width='17' height='17' rx='5.5' fill='%23f2c15b'/%3E%3C/svg%3E";

/** i18n helper: an element whose text is swapped by site.js when the interface language changes. */
export const t = (key, en, tag = "span", attrs = "") =>
  raw(`<${tag} data-i18n="${key}"${attrs ? ` ${attrs}` : ""}>${esc(en)}</${tag}>`);

function header(navKey) {
  return html`<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">${raw(LOGO)}<span>${SITE.name}<small data-i18n="brand.tagline">${SITE.promise}</small></span></a>
    <nav class="nav" id="site-nav" aria-label="Main" data-i18n-label="nav.label">
      <ul>${NAV.map((n) => raw(`<li><a href="${n.href}"${n.key === navKey ? ' aria-current="true"' : ""} data-i18n="${n.i18n}">${esc(n.label)}</a></li>`))}<li class="nav-search"><a href="/search/" data-i18n="header.search">Search</a></li></ul>
    </nav>
    <div class="header-tools">
      <a class="icon-btn search-btn" href="/search/" aria-label="Search" data-i18n-label="header.search">${raw(icon("search"))}</a>
      <button class="icon-btn" type="button" data-open-display aria-haspopup="dialog">${raw(icon("settings"))}<span class="label" data-i18n="header.display">Display</span></button>
      <button class="icon-btn" type="button" data-lang-toggle lang="es">${raw(icon("lang"))}<span class="label" data-i18n="header.lang">Español</span></button>
      <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" data-menu aria-label="Menu" data-i18n-label="header.menu">${raw(icon("menu"))}</button>
    </div>
  </div>
</header>`;
}

function breadcrumbs(crumbs) {
  if (!crumbs?.length) return "";
  const items = [{ label: "Home", href: "/", i18n: "crumb.home" }, ...crumbs];
  return html`<nav class="breadcrumb wrap" aria-label="Breadcrumb" data-i18n-label="crumb.label"><ol>${items.map(
    (c, i) =>
      i === items.length - 1
        ? raw(
            `<li><span aria-current="page"${c.i18n ? ` data-i18n="${c.i18n}"` : ""}>${esc(c.label)}</span></li>`,
          )
        : raw(
            `<li><a href="${c.href}"${c.i18n ? ` data-i18n="${c.i18n}"` : ""}>${esc(c.label)}</a></li>`,
          ),
  )}</ol></nav>`;
}

function footer() {
  const col = (key, title, links) =>
    html`<div><h2 data-i18n="${key}">${title}</h2><ul>${links.map(([href, label, k]) => raw(`<li><a href="${href}"${k ? ` data-i18n="${k}"` : ""}>${esc(label)}</a></li>`))}</ul></div>`;
  return html`<footer class="site-footer">
  <div class="wrap">
    <div class="footer-cols">
      ${col("footer.practice", "Practice", [
        ["/practice/grades-2-3/", "Grades 2–3"],
        ["/practice/grades-4-5/", "Grades 4–5"],
        ["/practice/grades-6-8/", "Grades 6–8"],
        ["/access-practice-lab/", "Full Practice Lab", "footer.lab"],
      ])}
      ${col("footer.teachers", "Teachers", [
        ["/tools/", "Teacher Tools", "nav.tools"],
        ["/content/", "Content + Language", "nav.content"],
        ["/access-teacher/", "Teacher Hub", "footer.hub"],
        ["/bcpss-teachers", "BCPSS curriculum bridges", "footer.bcpss"],
      ])}
      ${col("footer.families", "Families", [
        ["/access-guide/families/", "Guide for families", "footer.familyGuide"],
        ["/access-practice-lab/family-start", "Practice together", "footer.familyPractice"],
      ])}
      ${col("footer.site", "This site", [
        ["/about/", "About", "nav.about"],
        ["/about/privacy/", "Privacy", "footer.privacy"],
        ["/about/accessibility/", "Accessibility", "footer.accessibility"],
        ["/about/#contact", "Contact", "footer.contact"],
      ])}
    </div>
    <p class="disclaimer" data-disclaimer><span data-i18n="disclaimer">${DISCLAIMER}</span> <span data-i18n="footer.powered">Powered by EduWonderLab</span>.</p>
  </div>
</footer>`;
}

function displayDialog() {
  const seg = (setting, opts) =>
    raw(
      `<div class="seg" role="group" data-setting="${setting}">${opts
        .map(
          ([value, key, label]) =>
            `<button type="button" data-value="${value}" aria-pressed="false" data-i18n="${key}">${esc(label)}</button>`,
        )
        .join("")}</div>`,
    );
  return html`<dialog class="modal" id="display-dialog" aria-labelledby="display-title">
  <div class="modal-head"><h2 id="display-title" data-i18n="display.title">Display and reading</h2><button type="button" class="icon-btn" data-close aria-label="Close" data-i18n-label="display.close">${raw(icon("close"))}</button></div>
  <div class="modal-body settings-grid">
    <div><p class="label" data-i18n="display.size">Text size</p>${seg("size", [
      ["16", "display.size", "A−"],
      ["18", "display.size", "A"],
      ["21", "display.size", "A+"],
      ["24", "display.size", "A++"],
    ])}</div>
    <div><p class="label" data-i18n="display.theme">Colors</p>${seg("theme", [
      ["light", "display.light", "Light"],
      ["dark", "display.dark", "Dark"],
      ["contrast", "display.contrast", "High contrast"],
    ])}</div>
    <div><p class="label" data-i18n="display.font">Font</p>${seg("font", [
      ["standard", "display.fontStandard", "Standard"],
      ["readable", "display.fontReadable", "Reading-friendly"],
    ])}</div>
    <div><p class="label" data-i18n="display.spacing">Spacing</p>${seg("spacing", [
      ["normal", "display.spacingNormal", "Normal"],
      ["roomy", "display.spacingRoomy", "Roomy"],
    ])}</div>
    <div><p class="label" data-i18n="display.ruler">Line focus</p>${seg("ruler", [
      ["off", "display.off", "Off"],
      ["on", "display.on", "On"],
    ])}</div>
    <div><p class="label" data-i18n="display.tapHear">Tap a sentence to hear it</p>${seg(
      "tapHear",
      [
        ["off", "display.off", "Off"],
        ["on", "display.on", "On"],
      ],
    )}</div>
    <div class="field"><label for="voice-select" data-i18n="display.voice">Voice</label><select id="voice-select"></select></div>
    <div class="field"><label for="rate-range" data-i18n="display.rate">Reading speed</label><input id="rate-range" type="range" min="0.6" max="1.3" step="0.1" value="0.9"></div>
    <div class="btn-row"><button type="button" class="btn small" data-read-page>${raw(icon("speaker"))}<span data-i18n="display.readPage">Read this page aloud</span></button><button type="button" class="btn small secondary" data-reset-display data-i18n="display.reset">Reset all</button></div>
    <p class="muted" data-i18n="display.saved">Settings are saved on this device only.</p>
    <p class="muted" data-es-note hidden data-i18n="display.esNote">Spanish interface text is a draft awaiting review by a native speaker.</p>
  </div>
</dialog>`;
}

/**
 * Render a full page.
 * page: { path, title, description, navKey, crumbs, body, assets: {css, prefs, site}, scripts: [src], data: {id: obj},
 *         bodyClass, jsonld, speaking, i18n (strings for client), noindex }
 */
export function page(p) {
  const canonical = `${SITE.origin}${p.path}`;
  const title = p.path === "/" ? `${SITE.name} · ${SITE.promise}` : `${p.title} · ${SITE.name}`;
  const v = p.assets;
  const scripts = (p.scripts || []).map((s) => raw(`<script type="module" src="${s}"></script>`));
  const data = Object.entries(p.data || {}).map(([id, obj]) =>
    raw(`<script type="application/json" id="${id}">${jsonBlock(obj)}</script>`),
  );
  // Pages that set reading text (passages, practice) preload the reading font so its late swap cannot shift the page.
  const readFont = /class="(?:[^"]* )?(?:reading|passage|out)[" ]/.test(String(p.body))
    ? raw(
        READ_FONTS.map(
          (f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`,
        ).join("\n"),
      )
    : "";
  const ld = p.jsonld
    ? raw(`<script type="application/ld+json">${jsonBlock(p.jsonld)}</script>`)
    : "";
  return `<!doctype html>
${html`<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${p.description}">
<meta name="lp-front" content="1">
${p.noindex ? raw('<meta name="robots" content="noindex">') : ""}
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#17324d">
<link rel="icon" href="${raw(FAVICON)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${p.description}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE.origin}${SITE.ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${SITE.name}: ${SITE.promise}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/assets/fonts/inter-1dc044f4.woff2" as="font" type="font/woff2" crossorigin>
${readFont}
<link rel="stylesheet" href="/lp/assets/site.css?v=${v.css}">
<script src="/lp/assets/prefs.js?v=${v.prefs}"></script>
<script type="module" src="/lp/assets/site.js?v=${v.site}"></script>
${scripts}
${ld}
</head>
<body${p.bodyClass ? raw(` class="${p.bodyClass}"`) : ""}>
<a class="skip-link" href="#main" data-i18n="skip">Skip to main content</a>
${header(p.navKey)}
${breadcrumbs(p.crumbs)}
<main id="main" tabindex="-1">
${raw(String(p.body))}
</main>
${footer()}
${displayDialog()}
<div class="ruler" data-ruler-top hidden></div><div class="ruler" data-ruler-bottom hidden></div>
<div class="toast" role="status" aria-live="polite" hidden data-toast></div>
<script type="application/json" id="lp-i18n">${raw(jsonBlock(p.i18n))}</script>
${data}
</body>
</html>`}
`;
}
