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
  "/assets/curriculum-fluency.js",
  "/assets/curriculum-teacher-workflow.js",
  "/assets/curriculum-guided-path.js",
  "/assets/curriculum-studio-journey.js",
  "/assets/curriculum-lesson-merge.js",
  "/assets/curriculum-teacher-bar.js",
  "/assets/curriculum-product-upgrades.js",
  "/assets/curriculum-navigator.js",
  "/assets/curriculum-resources.js",
  "/assets/pacing-days.generated.js",
  "/assets/curriculum-home.js",
  "/assets/ewl/rational.js",
  "/assets/ewl/state-store.js",
  "/assets/ewl/ui.js",
  "/assets/ewl/fluency.js",
  "/assets/my-progress/progress-stores.js",
  "/assets/my-progress/progress-sections.js",
  "/assets/my-progress/progress-atlas-store.js",
  "/assets/my-progress/progress-atlas-model.js",
  "/assets/my-progress/progress-atlas-ui.js",
  "/assets/my-progress/progress-atlas.js",
  "/assets/ewl/cockpit-core.js",
  "/assets/ewl/cockpit-check.js",
  "/assets/ewl/cockpit.js",
  "/assets/ewl/reference-core.js",
  "/assets/ewl/reference-icons.js",
  "/assets/ewl/reference.js",
  "/assets/futures-lab.js",
  "/assets/gradebook-embed.js",
];

/* Further hub-only runs. Each is bundled separately because something that is
 * NOT in the run sits on either side of it (an inline block, a site-wide
 * asset, the defer bundle above), and each must be contiguous on the page with
 * nothing but whitespace between its tags -- these are held to a stricter test
 * than the main run, because a blocking script that moves past an inline
 * script changes what that inline script sees.
 *
 *   head      four classic blocking <script src> tags (generated lesson maps).
 *             They were four render-blocking round trips before first paint.
 *   presets   two defer scripts that run before the main bundle.
 *   pacing    three hub-only defer scripts separated only by inline blocks.
 *   identity  the identity scripts, in the order the page comment requires
 *             (shared-identity.js first).
 *   tail      hub-only scripts that close the page. formula-popup.js is on 859
 *             pages and stays separate for the cross-page cache hit.
 *
 * Every file here is referenced by the hub and at most one other page
 * (checked by `rg -l`), so bundling costs no cross-page cache hit. */
const EXTRA_RUNS = [
  {
    label: "head",
    defer: false,
    files: [
      "/curriculum/lesson-context.js",
      "/curriculum/lesson-bonus-activities.js",
      "/curriculum/lesson-family-homework.js",
      "/curriculum/lesson-mstar-worksheets.js",
    ],
  },
  {
    label: "presets",
    defer: true,
    files: ["/assets/math-workbench-presets.js", "/assets/project-readiness-pathways.js"],
  },
  {
    label: "pacing",
    defer: true,
    // Inline blocks and one classic blocking script sit between these three, and
    // that is safe: defer scripts all run after parsing, in document order, and
    // no other defer script lies between them (checked below).
    loose: true,
    files: [
      "/assets/nt-signal.js",
      "/assets/curriculum-hub-pacing.js",
      "/assets/curriculum-hub-options.js",
    ],
  },
  {
    label: "identity",
    defer: true,
    files: [
      "/assets/shared-identity.js",
      "/assets/curriculum-supports-identity.js",
      "/assets/class-board-strip.js",
    ],
  },
  {
    label: "tail",
    defer: true,
    files: [
      "/assets/practice-workbook-links.js",
      "/assets/reveal-document-links.js",
      "/assets/curriculum-hub-pedagogy.js",
    ],
  },
];

const fail = (m) => {
  console.error(`bundle-hub-scripts: ${m}`);
  process.exit(1);
};

if (!existsSync(PAGE)) fail(`no ${PAGE} — run \`vite build\` first.`);
let html = readFileSync(PAGE, "utf8");

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* Locate each tag. Matching on src ignoring any ?v= stamp, since vite rewrites
 * those. A tag that is missing means the page changed shape; refuse rather than
 * bundle a partial run, because a partial run is the reordering hazard. */
function locate(files) {
  return files.map((src) => {
    const re = new RegExp(
      `[ \\t]*<script\\b[^>]*\\bsrc="${escapeRe(src)}(?:\\?[^"]*)?"[^>]*></script>\\n?`,
    );
    const m = html.match(re);
    if (!m)
      fail(
        `expected <script src="${src}"> on the hub and did not find it. The page changed shape — re-check the run before bundling.`,
      );
    return { src, text: m[0], index: m.index };
  });
}

/* Concatenate in execution order. `;` between files so a file ending in an
 * unterminated expression cannot swallow the next one. */
function concatenate(files) {
  const parts = [];
  for (const src of files) {
    const p = join(DIST, src.replace(/^\//, ""));
    if (!existsSync(p)) fail(`${src} is on the page but missing from dist/.`);
    parts.push(`/* ===== ${src} ===== */\n${readFileSync(p, "utf8")}`);
  }
  return parts.join("\n;\n");
}

/* Replace the first tag in place -- preserving the run's position in the
 * queue relative to every tag outside it -- and drop the rest. */
function writeRun(tags, prefix, bundle, defer) {
  const hash = createHash("sha256").update(bundle).digest("hex").slice(0, 10);
  const name = `${prefix}.${hash}.js`;
  writeFileSync(join(DIST, "assets", name), bundle);
  html = html.replace(
    tags[0].text,
    `    <script src="/assets/${name}"${defer ? " defer" : ""}></script>\n`,
  );
  for (const t of tags.slice(1)) html = html.replace(t.text, "");
  return name;
}

/* Assert the run really is in the listed order IN THE PAGE. */
function assertOrder(tags) {
  for (let i = 1; i < tags.length; i++) {
    if (tags[i].index < tags[i - 1].index) {
      fail(
        `${tags[i].src} appears before ${tags[i - 1].src} on the page — the listed order is not the page order.`,
      );
    }
  }
}

let removedTotal = 0;
const summaries = [];

/* ---- the main defer run (non-contiguous allowed: inline blocks may sit between) */
if (html.includes("curriculum-hub.bundle.")) {
  summaries.push("main run already bundled");
} else {
  const tags = locate(RUN);
  assertOrder(tags);
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
  const bundle = concatenate(RUN);
  const name = writeRun(tags, "curriculum-hub.bundle", bundle, true);
  removedTotal += RUN.length - 1;
  summaries.push(
    `${RUN.length} scripts -> assets/${name} (${(bundle.length / 1024).toFixed(0)} KB)`,
  );
}

/* ---- the extra runs: whitespace-only gaps, no exceptions */
for (const run of EXTRA_RUNS) {
  const marker = `curriculum-hub.${run.label}.`;
  if (html.includes(`/assets/${marker}`)) {
    summaries.push(`${run.label} run already bundled`);
    continue;
  }
  const tags = locate(run.files);
  assertOrder(tags);
  if (run.loose) {
    const span = html.slice(
      tags[0].index,
      tags[tags.length - 1].index + tags[tags.length - 1].text.length,
    );
    const stray = [...span.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/g)]
      .filter(
        ([, a, src, b]) => `${a} ${b}`.includes("defer") && !run.files.includes(src.split("?")[0]),
      )
      .map((m) => m[2]);
    if (stray.length)
      fail(
        `a defer script that is not in the "${run.label}" run sits inside it: ${stray.join(", ")}.`,
      );
  } else {
    for (let i = 1; i < tags.length; i++) {
      const prev = tags[i - 1];
      const gap = html.slice(prev.index + prev.text.length, tags[i].index);
      if (gap.trim() !== "")
        fail(
          `the "${run.label}" run is not contiguous: ${JSON.stringify(gap.trim().slice(0, 80))} sits between ${prev.src} and ${tags[i].src}. Bundling would reorder execution.`,
        );
    }
  }
  const bundle = concatenate(run.files);
  const name = writeRun(tags, `curriculum-hub.${run.label}`, bundle, run.defer);
  removedTotal += run.files.length - 1;
  summaries.push(`${run.label}: ${run.files.length} -> assets/${name}`);
}

writeFileSync(PAGE, html);
console.log(
  `bundle-hub-scripts: ${summaries.join("; ")}; ${removedTotal} fewer requests on /curriculum/.`,
);
