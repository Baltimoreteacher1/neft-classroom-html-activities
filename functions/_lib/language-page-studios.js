// The WIDA ACCESS practice studios (/wida-access/<studio>/) as The Language Page serves them. The pages are the same
// files eduwonderlab.com serves; on the lab host they are re-dressed on the way out so they read as part of the lab:
// the lab's top bar and breadcrumb replace the "Neft Hub / WIDA Center" chrome, the studio takes its skill's lab
// colour and the lab's typefaces, links that pointed at the school dashboard point back into the lab, and the math
// tools and classroom score bridge (which post to eduwonderlab.com's backend) are left out.
import { LAB_BASE, LAB_BRAND, LANGUAGE_PAGE_HOST } from "./language-page.js";

// The lab's own domain colours (access-practice-lab/acc.css --acc-d-*), with a darker hover shade and a soft tint.
const SKILL_COLOURS = {
  listening: ["#075568", "#04404e", "#e2f3f0"],
  reading: ["#2e4a94", "#223873", "#eceef8"],
  speaking: ["#8a3a5c", "#6c2c48", "#f8ebf0"],
  writing: ["#9a4a26", "#7a3a1d", "#fbefe3"],
  brand: ["#075568", "#04404e", "#e2f3f0"],
};

const DROPPED_SCRIPTS = [
  "/assets/math-workbench-launcher.js",
  "/assets/formula-popup.js",
  "/assets/edupulse-config.js",
  "/assets/edupulse-bridge.js",
];

// A function, not a constant: this module and language-page.js import each other, so nothing here may read
// their bindings while the modules are still evaluating.
const studiosHub = () => `${LAB_BASE}/library#studios`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const LOGO =
  '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="2" y="2" width="17" height="17" rx="5.5" fill="#075568"/><rect x="21" y="2" width="17" height="17" rx="5.5" fill="#2e4a94"/><rect x="2" y="21" width="17" height="17" rx="5.5" fill="#8a3a5c"/><rect x="21" y="21" width="17" height="17" rx="5.5" fill="#9a4a26"/><path d="M6.5 14.5v-2a4 4 0 0 1 8 0v2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M26 7.5h8M26 11h8M26 14.5h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><rect x="8.3" y="25" width="4.4" height="7" rx="2.2" fill="#fff"/><path d="M26.5 33.5l7-7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>';

function chromeHtml(studio) {
  const nav = [
    ["My Home", `${LAB_BASE}/`],
    ["Learn", `${LAB_BASE}/learn`],
    ["Practice", `${LAB_BASE}/library`],
    ["Play", `${LAB_BASE}/games`],
    ["My Growth", `${LAB_BASE}/growth`],
  ];
  const links = nav
    .map(
      ([label, href]) =>
        `<a class="lp-link"${label === "Practice" ? ' aria-current="true"' : ""}${label === "Learn" || label === "Play" ? " data-low" : ""} href="${href}">${label}</a>`,
    )
    .join("");
  return `<a class="lp-skip" href="#lp-studio">Skip to the studio</a>
<header class="lp-top">
  <a class="lp-brand" href="${LAB_BASE}/"><span class="lp-logo">${LOGO}</span><span class="lp-wordmark"><strong>${LAB_BRAND.name}</strong><small>${LAB_BRAND.poweredBy}</small></span></a>
  <nav class="lp-nav" aria-label="Lab navigation">${links}</nav>
</header>
<nav class="lp-crumbs" aria-label="Breadcrumb"><a href="${LAB_BASE}/">${LAB_BRAND.name}</a><span aria-hidden="true">/</span><a href="${studiosHub()}">Practice studios</a><span aria-hidden="true">/</span><span aria-current="page">${esc(studio.title)}</span></nav>
<div id="lp-studio" tabindex="-1"></div>`;
}

function themeHtml(studio) {
  const [main, dark, soft] = SKILL_COLOURS[studio.skill] || SKILL_COLOURS.brand;
  return `<link rel="stylesheet" href="${LAB_BASE}/studio-chrome.css" />
<style id="lp-studio-theme">:root{--primary:${main};--primary-dark:${dark};--primary-light:${soft};--navy-deep:${dark};--lp-skill:${main};--font-outfit:"Atkinson Hyperlegible",system-ui,sans-serif;--font-space:"Fraunces",Georgia,serif}</style>`;
}

/** Re-dress one studio page for the lab host. `studio` is an entry of access-practice-lab/src/studios.js. */
export function studioLabHtml(html, studio, pathname) {
  const canonical = `https://${LANGUAGE_PAGE_HOST}${pathname}`;
  let out = html
    // The old chrome: a top-nav header (directions, word builder, reward shop) or a bare breadcrumb (the rest).
    .replace(/<header class="top-nav">[\s\S]*?<\/header>/, "")
    .replace(/<nav class="breadcrumb"[^>]*>[\s\S]*?<\/nav>/, "")
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(studio.title)} · ${LAB_BRAND.name}</title>`)
    .replace(/<body([^>]*)>/, (_, attrs) => `<body${attrs}>\n${chromeHtml(studio)}`)
    .replace(
      "</head>",
      `${themeHtml(studio)}\n<link rel="canonical" href="${canonical}" />\n<meta property="og:site_name" content="${LAB_BRAND.name}" />\n<meta property="og:url" content="${canonical}" />\n</head>`,
    )
    .replaceAll('href="/wida-access/"', `href="${studiosHub()}"`)
    .replaceAll('href="/"', `href="${LAB_BASE}/"`)
    // The studios' own copy names the hub they were written for ("... across Neft Hub").
    .replaceAll("Neft Hub", LAB_BRAND.name);
  for (const src of DROPPED_SCRIPTS) {
    out = out.replace(
      new RegExp(
        `<script[^>]*src="${src.replace(/[.]/g, "\\.")}[^"]*"[^>]*>\\s*</script>\\n?`,
        "g",
      ),
      "",
    );
  }
  return out;
}
