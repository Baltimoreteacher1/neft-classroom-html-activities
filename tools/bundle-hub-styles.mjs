#!/usr/bin/env node
/* =============================================================================
 * bundle-hub-styles — collapse contiguous runs of the curriculum pages'
 * stylesheet links into one request each, in dist/ only.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * /curriculum/ loads 17 stylesheets and /curriculum/units/ 14. The styling grew
 * one file per feature pass (enhancements, sidebar, polish, top1, teacher
 * workflow, guided path, studio journey, navigator, home, resources …), and
 * every one is a separate render-blocking request on a school Chromebook. The
 * scripts on the same page were collapsed for exactly this reason
 * (tools/bundle-hub-scripts.mjs); this is the stylesheet half.
 *
 * WHY dist/ ONLY
 * Source keeps its individual <link> tags, so `npm run dev` and the content-hash
 * stamps that tools/curriculum-hub-assets.test.mjs enforces are unchanged, and
 * there is no generated artifact in the repo that can go stale.
 *
 * WHY CONTIGUOUS RUNS AND NOT "ALL THE STYLESHEETS"
 * The cascade is order-dependent. Between the link runs on these pages sit
 * inline <style> blocks and other tags; merging across them would reorder the
 * sheets relative to those blocks and silently change which rule wins a
 * specificity tie. A run is only merged when nothing but whitespace separates
 * its tags, so the concatenation occupies exactly the position of the run.
 *
 * WHAT IS DELIBERATELY EXCLUDED
 *   - Any sheet that starts with @import (curriculum-system.css). @import is
 *     only valid at the top of a stylesheet; concatenated mid-file it is
 *     ignored and the fonts it loads vanish.
 *   - Sheets outside /assets/ root (/assets/fonts/…). Relative url() values
 *     resolve against the sheet's own URL, so a bundle may only hold sheets
 *     that already live in the same directory it is written to.
 *   - Sheets with media= or non-stylesheet rel. Only plain <link rel="stylesheet">.
 *
 * Runs after `vite build` and tools/bundle-hub-scripts.mjs, before
 * tools/stamp-build.mjs, which leaves `/assets/curriculum-hub*` names alone.
 * Idempotent; safe to run on an already-bundled dist.
 * ========================================================================== */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PAGES = ["curriculum/index.html", "curriculum/units/index.html"];
const MARK = "curriculum-hub.styles.";

const LINK_RE =
  /<link\b(?=[^>]*\brel="stylesheet")(?![^>]*\bmedia=)[^>]*\bhref="(\/assets\/[^"/]+\.css)(?:\?[^"]*)?"[^>]*\/?>/g;

function bundleable(href, distPath) {
  if (!existsSync(distPath)) return false;
  const head = readFileSync(distPath, "utf8").slice(0, 400);
  if (/^\s*(\/\*[\s\S]*?\*\/\s*)*@import\b/.test(head)) return false;
  if (/^\s*(\/\*[\s\S]*?\*\/\s*)*@charset\b/.test(head)) return false;
  return /^\/assets\/[^/]+\.css$/.test(href);
}

function bundlePage(rel) {
  const pagePath = join(DIST, rel);
  if (!existsSync(pagePath)) {
    console.log(`bundle-hub-styles: no ${rel} in dist — skipped.`);
    return;
  }
  let html = readFileSync(pagePath, "utf8");
  if (html.includes(MARK)) {
    console.log(`bundle-hub-styles: ${rel} already bundled — nothing to do.`);
    return;
  }

  const tags = [...html.matchAll(LINK_RE)]
    .map((m) => ({ text: m[0], href: m[1], index: m.index }))
    .filter((t) => bundleable(t.href, join(DIST, t.href.replace(/^\//, ""))));

  // Group into runs separated by whitespace only.
  const runs = [];
  for (const tag of tags) {
    const current = runs[runs.length - 1];
    if (current) {
      const prev = current[current.length - 1];
      const gap = html.slice(prev.index + prev.text.length, tag.index);
      if (/^\s*$/.test(gap)) {
        current.push(tag);
        continue;
      }
    }
    runs.push([tag]);
  }

  let merged = 0;
  let removed = 0;
  // Replace from the end so earlier indices stay valid.
  for (const run of runs.reverse()) {
    if (run.length < 2) continue;
    const parts = run.map(
      (t) =>
        `/* ===== ${t.href} ===== */\n${readFileSync(join(DIST, t.href.replace(/^\//, "")), "utf8")}`,
    );
    const css = parts.join("\n");
    const hash = createHash("sha256").update(css).digest("hex").slice(0, 10);
    const name = `${MARK}${hash}.css`;
    writeFileSync(join(DIST, "assets", name), css);
    const first = run[0];
    const last = run[run.length - 1];
    const replacement = `<link rel="stylesheet" href="/assets/${name}" />`;
    html = html.slice(0, first.index) + replacement + html.slice(last.index + last.text.length);
    merged += 1;
    removed += run.length - 1;
  }
  writeFileSync(pagePath, html);
  console.log(
    `bundle-hub-styles: ${rel} — ${tags.length} sheets, ${merged} bundle(s) written, ${removed} fewer requests.`,
  );
}

for (const rel of PAGES) bundlePage(rel);
