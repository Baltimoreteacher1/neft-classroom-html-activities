#!/usr/bin/env node
/* =============================================================================
 * bundle-hub-scripts — collapse one contiguous run of the curriculum hub's
 * defer scripts into a single request, in dist/ only.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * /curriculum is what a student opens first on a school Chromebook, and it was
 * 68 requests against a 60 budget. Every other metric was comfortably green
 * (LCP 532ms of 4000, transfer 446KB of 900) -- only the count was over,
 * because the hub gained ~19 requests of real feature work since the budget was
 * set on 2026-07-28. That is growth, not a regression, and the honest fix is
 * fewer round trips rather than a bigger budget.
 *
 * WHY dist/ ONLY
 * Source keeps its individual <script> tags, so `npm run dev` is unchanged and
 * there is no generated artifact in the repo that can silently go stale against
 * its sources. The bundle is rebuilt from the files every single build.
 *
 * WHY A CONTIGUOUS RUN AND NOT "ALL THE DEFER SCRIPTS"
 * defer scripts execute in DOCUMENT ORDER after parsing. Collapsing a set that
 * is not contiguous in that order silently reorders execution against the tags
 * left behind. curriculum/index.html carries a comment saying
 * "shared-identity.js must load first; `defer` keeps document order" -- pulling
 * curriculum-supports-identity.js into an earlier bundle would invert exactly
 * that. So: one unbroken run, and everything outside it keeps its own tag and
 * its position.
 *
 * WHAT IS DELIBERATELY EXCLUDED (each of these bit, or would have)
 *   - nt-usage.js. It carries data-nt-usage="1", and nt-page-enhance.js does
 *     `if (document.querySelector("script[data-nt-usage]")) return;` before
 *     injecting its own copy. Remove the tag and the page loads usage telemetry
 *     TWICE, double-counting every view. tools/inject-usage-signal.mjs also owns
 *     that tag and would re-add it.
 *   - Anything inside an `*-injected:begin/end` block. Those regions belong to
 *     their injector; editing them starts a fight the injector wins on its next
 *     run.
 *   - Site-wide assets. formula-popup.js is on 859 pages and
 *     math-workbench-launcher.js on 1096. Bundling them into a hub-only file
 *     means every student re-downloads ~49KB on the next lesson page and loses
 *     the cross-page cache hit -- slower overall while the gate number improves.
 *     A request budget is a proxy for "fast", never the goal itself.
 *
 * Runs after `vite build`. Idempotent; safe to run on an already-bundled dist.
 * ========================================================================== */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PAGE = join(DIST, "curriculum", "index.html");

/* The run, named explicitly rather than inferred. An inferred run silently
 * changes shape when someone adds a script in the middle, and the failure mode
 * is reordered execution on the most-trafficked page -- the kind of bug that
 * shows up as "the sidebar is sometimes empty". Listing them means a new script
 * is simply not bundled until someone adds it here on purpose. Order here is
 * the required execution order and is asserted against the page below. */
const RUN = [
  "/assets/curriculum-hub-search.js",
  "/assets/curriculum-progress-bridge.js",
  "/assets/vendor/minisearch-7.1.2.min.js",
  "/assets/curriculum-json-cache.js",
  "/assets/curriculum-enhancements.js",
  "/assets/curriculum-ready-next.js",
  "/assets/curriculum-audit-badges.js",
  "/assets/curriculum-sidebar.js",
  "/assets/curriculum-top1.js",
  "/assets/curriculum-teacher-planning.js",
  "/assets/curriculum-live-signal.js",
  "/assets/curriculum-next-move.js",
  "/assets/curriculum-teacher-workflow.js",
  "/assets/curriculum-guided-path.js",
  "/assets/curriculum-studio-journey.js",
  "/assets/curriculum-lesson-merge.js",
  "/assets/curriculum-product-upgrades.js",
  "/assets/futures-lab.js",
  "/assets/gradebook-embed.js",
];

const fail = (m) => {
  console.error(`bundle-hub-scripts: ${m}`);
  process.exit(1);
};

if (!existsSync(PAGE)) fail(`no ${PAGE} — run \`vite build\` first.`);
let html = readFileSync(PAGE, "utf8");

if (html.includes("curriculum-hub.bundle.")) {
  console.log("bundle-hub-scripts: already bundled — nothing to do.");
  process.exit(0);
}

/* Locate each tag. Matching on src ignoring any ?v= stamp, since vite rewrites
 * those. A tag that is missing means the page changed shape; refuse rather than
 * bundle a partial run, because a partial run is the reordering hazard. */
const tags = [];
for (const src of RUN) {
  const re = new RegExp(
    `[ \\t]*<script\\b[^>]*\\bsrc="${src.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}(?:\\?[^"]*)?"[^>]*></script>\\n?`,
  );
  const m = html.match(re);
  if (!m)
    fail(
      `expected <script src="${src}"> on the hub and did not find it. The page changed shape — re-check the run before bundling.`,
    );
  tags.push({ src, text: m[0], index: m.index });
}

/* Assert the run really is contiguous IN THE PAGE and in the listed order.
 * Everything this tool is safe to do depends on that. */
for (let i = 1; i < tags.length; i++) {
  if (tags[i].index < tags[i - 1].index) {
    fail(
      `${tags[i].src} appears before ${tags[i - 1].src} on the page — the listed order is not the page order.`,
    );
  }
}
const first = tags[0];
const last = tags[tags.length - 1];
const between = html.slice(first.index, last.index + last.text.length);
const strayDefer = [...between.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/g)]
  .filter(([, a, src, b]) => {
    const attrs = `${a} ${b}`;
    if (!attrs.includes("defer") || attrs.includes('type="module"')) return false;
    return !RUN.some((r) => src.split("?")[0] === r);
  })
  .map((m) => m[2]);
if (strayDefer.length) {
  fail(
    `a defer script that is not in the run sits inside it: ${strayDefer.join(", ")}. Bundling would move it. Update RUN deliberately or exclude it.`,
  );
}

/* Concatenate in execution order. `;` between files so a file ending in an
 * unterminated expression cannot swallow the next one. */
const parts = [];
for (const src of RUN) {
  const p = join(DIST, src.replace(/^\//, ""));
  if (!existsSync(p)) fail(`${src} is on the page but missing from dist/.`);
  parts.push(`/* ===== ${src} ===== */\n${readFileSync(p, "utf8")}`);
}
const bundle = parts.join("\n;\n");
const hash = createHash("sha256").update(bundle).digest("hex").slice(0, 10);
const name = `curriculum-hub.bundle.${hash}.js`;
writeFileSync(join(DIST, "assets", name), bundle);

/* Replace the first tag in place -- preserving the run's position in the defer
 * queue relative to every tag outside it -- and drop the rest. */
html = html.replace(first.text, `    <script src="/assets/${name}" defer></script>\n`);
for (const t of tags.slice(1)) html = html.replace(t.text, "");
writeFileSync(PAGE, html);

const kb = (bundle.length / 1024).toFixed(0);
console.log(
  `bundle-hub-scripts: ${RUN.length} scripts -> assets/${name} (${kb} KB); ${RUN.length - 1} fewer requests on /curriculum/.`,
);
