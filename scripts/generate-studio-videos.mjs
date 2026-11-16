#!/usr/bin/env node
/**
 * generate-studio-videos.mjs: everything that shows a studio video is generated from
 * data/studio-videos.json (contract: tools/lib/studio-videos.mjs; author guide: docs/studio-videos.md).
 *
 *   1. Mapped static pages (`pages[]`) get one marked block per video (card, plus the stylesheet and module
 *      script once per page), under the title and lead or, with an `after` selector, inside the named section.
 *      A page that is not mapped is never touched, and a block whose page is no longer mapped is removed
 *      byte-for-byte, so the manifest alone decides where a card is.
 *   2. Pages on the Language Page app (/access-practice-lab/...) are rendered by the app, not static
 *      files: they read access-practice-lab/src/studio-video-routes.js, generated here.
 *   3. The two hubs, /videos/ (EduWonderLab) and /access-practice-lab/videos/ (The Language Page),
 *      list only their own brand's videos, concept clips apart from full films.
 *
 *   node scripts/generate-studio-videos.mjs           write
 *   node scripts/generate-studio-videos.mjs --check   exit 1 if anything is stale (validate:studio-videos)
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assetTags, cardHtml, esc } from "../assets/studio-video/studio-video-markup.mjs";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";
import { locateAnchor, stripBlocks } from "../tools/lib/studio-video-anchor.mjs";
import {
  BRANDS,
  isClip,
  isLabRoute,
  normalizePage,
  pageFile,
  parseVtt,
  placementOf,
  readManifest,
  validateManifest,
  videosFor,
} from "../tools/lib/studio-videos.mjs";

export const START = "studio-video:start";
export const ROUTES_FILE = "access-practice-lab/src/studio-video-routes.js";
const ANCHORS = ['<footer class="site-footer"', "</main>", "</body>"];

/** Manifest entry + its parsed captions + where "all videos" lives. */
export function hydrate(root, video) {
  const cues = parseVtt(readFileSync(join(root, video.vtt.slice(1)), "utf8")).map((c) => ({
    start: c.start,
    text: c.text,
  }));
  const brand = BRANDS[video.brand];
  return { ...video, cues, hub: { path: brand.hubPath, name: brand.name } };
}

/** One card block. `assets` adds the stylesheet and script: once per page, in its first block. */
export const blockFor = (entry, { assets = true } = {}) =>
  `<!-- ${START} ${entry.id} -->\n${assets ? `${assetTags()}\n` : ""}${cardHtml(entry)}\n<!-- studio-video:end -->`;

/** Pages whose lead paragraph sits inside a full-bleed hero banner: the film goes after the whole hero instead. */
export const AFTER_HERO_PAGES = new Set(["/math/games/"]);

/**
 * Default spot: the offset of the newline after which a block goes. Right under the page's <h1> and its lead
 * paragraph (before callouts, side cards and long hero content that can push the film far down on a phone);
 * else after the hero section/header; else before the footer, </main> or </body>.
 */
function defaultSpot(clean, afterHero) {
  const h1 = clean.indexOf("<h1");
  if (h1 !== -1) {
    const h1End = clean.indexOf("</h1>", h1);
    const lead =
      h1End === -1 || afterHero
        ? null
        : /^\s*<p[^>]*>[\s\S]*?<\/p>[ \t]*\n/.exec(clean.slice(h1End + 5));
    if (lead) return h1End + 5 + lead[0].length - 1;
    const ends = ["</section>", "</header>"]
      .map((t) => [clean.indexOf(t, h1), t])
      .filter(([i]) => i !== -1)
      .sort((a, b) => a[0] - b[0]);
    if (ends.length) {
      const [i, tag] = ends[0];
      const nl = clean.indexOf("\n", i + tag.length);
      if (nl !== -1) return nl;
    }
  }
  for (const anchor of ANCHORS) {
    const at = clean.indexOf(anchor);
    if (at === -1) continue;
    const lineStart = clean.lastIndexOf("\n", at) + 1;
    if (lineStart > 0) return lineStart - 1;
  }
  throw new Error("no insertion point (footer, </main> or </body>)");
}

/**
 * Insert every placement (`{ entry, after?, up? }`) into a page's HTML, replacing whatever blocks it had.
 * Each block is spliced in after a newline as "\n<block>", so removing them restores the page byte for byte.
 */
export function withBlocks(html, placements, { afterHero = false } = {}) {
  const clean = withoutBlock(html);
  const spots = placements
    .map((pl, order) => ({
      pl,
      order,
      at: pl.after ? locateAnchor(clean, pl) : defaultSpot(clean, afterHero),
    }))
    .sort((a, b) => a.at - b.at || a.order - b.order);
  let out = "";
  let from = 0;
  for (const [i, { pl, at }] of spots.entries()) {
    out += `${clean.slice(from, at)}\n${blockFor(pl.entry, { assets: i === 0 })}`;
    from = at;
  }
  return out + clean.slice(from);
}

/** One default-placed card (the common case). */
export const withBlock = (html, entry, options) => withBlocks(html, [{ entry }], options);

/** Exactly undo `withBlocks`. */
export const withoutBlock = stripBlocks;

/* ---------------------------------------------------------------------------- hubs */

const HUBS = {
  eduwonderlab: {
    title: "Videos | EduWonderLab",
    lead: "Short animated lessons from EduWonderLab. Each one has captions and a written copy of its words.",
    fonts: "/assets/fonts/fraunces-hanken-grotesk-e8a3b5.css",
    nav: [
      ["/", "Neft Teacher home"],
      ["/math/", "Math"],
      ["/directory/", "Find anything"],
    ],
    canonical: "https://eduwonderlab.com/videos/",
  },
  languagepage: {
    title: "Videos | The Language Page",
    lead: "Short animated videos from The Language Page. Each one has captions and a written copy of its words.",
    fonts: "/assets/fonts/fraunces-87aa83.css",
    fontsExtra: "/assets/fonts/atkinson-hyperlegible-nunito-76729d.css",
    nav: [["/access-practice-lab/", "The Language Page home"]],
    canonical: null,
  },
};

const HUB_GROUPS = [
  [
    "clips",
    "Concept clips",
    "Short clips that show one idea. Each also appears on the pages where that idea is taught.",
    isClip,
  ],
  ["films", "Full films", "Longer videos that tell the whole story.", (e) => !isClip(e)],
];

export function hubHtml(brandId, entries) {
  const hub = HUBS[brandId];
  const brand = BRANDS[brandId];
  const groups = HUB_GROUPS.map(([kind, title, text, keep]) => [
    kind,
    title,
    text,
    entries.filter(keep),
  ]).filter(([, , , list]) => list.length);
  const sections = groups.map(([kind, title, text, list]) => {
    const id = `sv-group-${kind}`;
    const cards = list
      .map((e) => cardHtml({ ...e, hub: undefined }, { headingLevel: 3 }))
      .join("\n");
    return `<section class="sv-group" data-kind="${kind}" aria-labelledby="${id}">\n<h2 class="sv-group-title" id="${id}">${esc(title)}</h2>\n<p class="sv-group-lead">${esc(text)}</p>\n<div class="sv-list">\n${cards}\n</div>\n</section>`;
  });
  const body = sections.length
    ? sections.join("\n")
    : `<p class="sv-hub-empty">There are no videos here yet.</p>`;
  const links = hub.nav.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(hub.title)}</title>
<meta name="description" content="${esc(hub.lead)}">
${hub.canonical ? `<link rel="canonical" href="${hub.canonical}">\n` : ""}<link rel="stylesheet" href="${hub.fonts}">
${hub.fontsExtra ? `<link rel="stylesheet" href="${hub.fontsExtra}">\n` : ""}${assetTags()}
</head>
<body class="sv-page" data-brand="${brandId}">
<div class="sv-hub">
<header class="sv-hub-head">
<nav aria-label="${esc(brand.name)} sections"><ul class="sv-hub-nav">${links.join("")}</ul></nav>
<h1>Videos</h1>
<p class="sv-hub-lead">${esc(hub.lead)}</p>
</header>
<main id="main">
${body}
</main>
</div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ language app routes */

export function routesModule(entries) {
  const videos = {};
  const routes = {};
  for (const e of entries) {
    const labPages = e.pages.map(placementOf).filter((p) => isLabRoute(p.path));
    if (!labPages.length) continue;
    videos[e.id] = { id: e.id, html: cardHtml(e) };
    for (const { path, after, up } of labPages)
      routes[normalizePage(path)] = {
        id: e.id,
        ...(after ? { after, ...(up ? { up } : {}) } : {}),
      };
  }
  return `// GENERATED by scripts/generate-studio-videos.mjs from data/studio-videos.json. Do not edit.
// The routes of the Language Page app that show a studio video card, so an unmapped route costs one
// object lookup and no network request. STUDIO_VIDEOS holds each card pre-rendered (the same builder as the static
// pages); a route is { id, after?, up? }: which card, and where on the screen it goes.
export const STUDIO_VIDEOS = ${JSON.stringify(videos, null, 2)};
export const STUDIO_VIDEO_ROUTES = ${JSON.stringify(routes, null, 2)};
`;
}

/* ------------------------------------------------------------------------------ driver */

function pagesWithBlock(root) {
  try {
    return execFileSync("git", ["grep", "-l", "-I", START, "--", "*.html"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    })
      .split("\n")
      .filter(Boolean);
  } catch (error) {
    if (error.status === 1) return []; // no match
    throw error;
  }
}

/** The files this manifest implies, as `{ path: content }` for new/changed, `null` = nothing to do. */
export function plan(root) {
  const manifest = readManifest(root);
  const problems = validateManifest(manifest, { root, isTeacherSurface });
  if (problems.length)
    throw new Error(`data/studio-videos.json is invalid:\n  ${problems.join("\n  ")}`);
  const entries = manifest.videos.map((v) => hydrate(root, v));
  const out = new Map();

  const mapped = new Map(); // page file -> placements, in manifest order
  for (const e of entries)
    for (const item of e.pages) {
      const { path, after, up } = placementOf(item);
      if (isLabRoute(path)) continue;
      const file = pageFile(path);
      mapped.set(file, [...(mapped.get(file) ?? []), { entry: e, after, up }]);
    }
  for (const [file, placements] of mapped) {
    const html = readFileSync(join(root, file), "utf8");
    out.set(
      file,
      withBlocks(html, placements, {
        afterHero: [...AFTER_HERO_PAGES].some((pg) => pageFile(pg) === file),
      }),
    );
  }
  // Pages that carry a block but are no longer mapped lose it.
  for (const file of pagesWithBlock(root)) {
    if (mapped.has(file) || file.startsWith("videos/") || file.endsWith("/videos/index.html"))
      continue;
    out.set(file, withoutBlock(readFileSync(join(root, file), "utf8")));
  }
  for (const brandId of Object.keys(BRANDS))
    out.set(BRANDS[brandId].hubFile, hubHtml(brandId, videosFor({ videos: entries }, brandId)));
  out.set(ROUTES_FILE, routesModule(entries));
  return out;
}

export function run(root, { check = false } = {}) {
  const stale = [];
  for (const [file, content] of plan(root)) {
    const path = join(root, file);
    const current = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (current === content) continue;
    stale.push(file);
    if (!check) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
    }
  }
  return stale;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const check = process.argv.includes("--check");
  try {
    const stale = run(root, { check });
    if (check && stale.length) {
      console.error(
        `generate-studio-videos: stale (run npm run generate:studio-videos):\n  ${stale.join("\n  ")}`,
      );
      process.exit(1);
    }
    console.log(
      check
        ? "generate-studio-videos: up to date"
        : `generate-studio-videos: ${stale.length ? `wrote ${stale.join(", ")}` : "already up to date"}`,
    );
  } catch (error) {
    console.error(`generate-studio-videos: ${error.message}`);
    process.exit(1);
  }
}
