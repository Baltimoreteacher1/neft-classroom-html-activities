#!/usr/bin/env node
/**
 * generate-studio-videos.mjs: everything that shows a studio video is generated from
 * data/studio-videos.json (contract: tools/lib/studio-videos.mjs; author guide: docs/studio-videos.md).
 *
 *   1. Mapped static pages (`pages[]`) get ONE marked block (stylesheet, module script, card) inserted
 *      before the page footer. A page that is not mapped is never touched, and a block whose page
 *      is no longer mapped is removed byte-for-byte, so the manifest alone decides where a card is.
 *   2. Pages on the Language Page app (/access-practice-lab/...) are rendered by the app, not static
 *      files: they read access-practice-lab/src/studio-video-routes.js, generated here.
 *   3. The two hubs, /videos/ (EduWonderLab) and /access-practice-lab/videos/ (The Language Page),
 *      list only their own brand's videos.
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
import {
  BRANDS,
  isLabRoute,
  LAB_ENABLED,
  normalizePage,
  pageFile,
  parseVtt,
  readManifest,
  validateManifest,
  videosFor,
} from "../tools/lib/studio-videos.mjs";

export const START = "<!-- studio-video:start -->";
export const END = "<!-- studio-video:end -->";
const BLOCK = /<!-- studio-video:start -->[\s\S]*?<!-- studio-video:end -->\n/;
const ANCHORS = ['<footer class="site-footer"', "</main>", "</body>"];
export const ROUTES_FILE = "access-practice-lab/src/studio-video-routes.js";

/** Manifest entry + its parsed captions + where "all videos" lives. */
export function hydrate(root, video) {
  const cues = parseVtt(readFileSync(join(root, video.vtt.slice(1)), "utf8")).map((c) => ({
    start: c.start,
    text: c.text,
  }));
  const brand = BRANDS[video.brand];
  return { ...video, cues, hub: { path: brand.hubPath, name: brand.name } };
}

export const blockFor = (entry) => `${START}\n${assetTags()}\n${cardHtml(entry)}\n${END}\n`;

/** Insert or replace the block in a page's HTML. Returns the new HTML. */
export function withBlock(html, entry) {
  const clean = withoutBlock(html);
  for (const anchor of ANCHORS) {
    const at = clean.indexOf(anchor);
    if (at === -1) continue;
    const lineStart = clean.lastIndexOf("\n", at) + 1;
    return `${clean.slice(0, lineStart)}${blockFor(entry)}${clean.slice(lineStart)}`;
  }
  throw new Error("no insertion point (footer, </main> or </body>)");
}

/** Exactly undo `withBlock`. */
export const withoutBlock = (html) => html.replace(BLOCK, "");

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

export function hubHtml(brandId, entries) {
  const hub = HUBS[brandId];
  const brand = BRANDS[brandId];
  const cards = entries.map((e) => cardHtml({ ...e, hub: undefined })).join("\n");
  const body = entries.length
    ? `<div class="sv-list">\n${cards}\n</div>`
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
    const labPages = e.pages.filter(isLabRoute);
    if (!labPages.length) continue;
    videos[e.id] = {
      id: e.id,
      brand: e.brand,
      title: e.title,
      description: e.description,
      mp4: e.mp4,
      poster: e.poster,
      vtt: e.vtt,
      durationSec: e.durationSec,
      width: e.width,
      height: e.height,
      cues: e.cues,
      hub: e.hub,
    };
    for (const page of labPages) routes[normalizePage(page)] = e.id;
  }
  return `// GENERATED by scripts/generate-studio-videos.mjs from data/studio-videos.json. Do not edit.
// The routes of the Language Page app that show a studio video card, so an unmapped route costs one
// object lookup and no network request.
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

  const mapped = new Map();
  for (const e of entries)
    for (const page of e.pages) if (!isLabRoute(page)) mapped.set(pageFile(page), e);
  for (const [file, entry] of mapped) {
    const html = readFileSync(join(root, file), "utf8");
    out.set(file, withBlock(html, entry));
  }
  // Pages that carry a block but are no longer mapped lose it.
  for (const file of pagesWithBlock(root)) {
    if (mapped.has(file) || file.startsWith("videos/") || file.endsWith("/videos/index.html"))
      continue;
    out.set(file, withoutBlock(readFileSync(join(root, file), "utf8")));
  }
  for (const [brandId, brand] of Object.entries(BRANDS))
    if (brand.enabled)
      out.set(brand.hubFile, hubHtml(brandId, videosFor({ videos: entries }, brandId)));
  if (LAB_ENABLED) out.set(ROUTES_FILE, routesModule(entries));
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
