#!/usr/bin/env node
/**
 * sitemap.xml contract.
 *
 * On 2026-10-08 the sitemap listed 268 URLs on the *.pages.dev mirror (not the
 * canonical eduwonderlab.com), no /curriculum/ page, 26 fewer lessons than the
 * curriculum has, 18 readiness URLs that 404 and 12 that redirect, and no
 * <lastmod>. Each of those is now a failure here. The rules themselves live in
 * scripts/lib/sitemap.mjs, shared with scripts/generate-sitemap.mjs.
 *
 * Files are checked against dist/ when a build exists, else the source tree.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { redirectMatcher, SITE_ORIGIN, sitemapProblems } from "../scripts/lib/sitemap.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = existsSync(join(ROOT, "dist", "index.html")) ? join(ROOT, "dist") : ROOT;
const ctx = {
  outDir,
  isRedirected: redirectMatcher(readFileSync(join(ROOT, "_redirects"), "utf8")),
};

console.log(`sitemap.xml contract (files checked in ${outDir === ROOT ? "source tree" : "dist/"})`);

/* 1. The real sitemap. */
const xml = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
const problems = sitemapProblems(xml, ctx);
assert.deepEqual(problems.slice(0, 25), [], `sitemap.xml has ${problems.length} problem(s)`);

const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
// Every taught lesson the curriculum lists must be present.
const launch = JSON.parse(
  readFileSync(join(ROOT, "data", "curriculum-launch-manifest.json"), "utf8"),
);
for (const l of launch.lessons) {
  assert.ok(
    locs.includes(`${SITE_ORIGIN}${l.resources.lesson}`),
    `lesson ${l.id} (${l.resources.lesson}) is missing from sitemap.xml`,
  );
}
assert.ok(
  locs.some((l) => l.startsWith(`${SITE_ORIGIN}/curriculum/`)),
  "sitemap.xml lists no public /curriculum/ page",
);

/* 2. robots.txt advertises the canonical sitemap. */
const robots = readFileSync(join(ROOT, "robots.txt"), "utf8");
assert.match(robots, new RegExp(`^Sitemap: ${SITE_ORIGIN}/sitemap\\.xml$`, "m"));

/* 3. The checker catches each failure it exists for (so it cannot go quiet). */
const one = (loc, lastmod = "2026-10-08") =>
  `<urlset><url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url></urlset>`;
const expectProblem = (loc, pattern, lastmod) => {
  const got = sitemapProblems(one(loc, lastmod), ctx).join("\n");
  assert.match(got, pattern, `checker should reject ${loc}`);
};
assert.deepEqual(sitemapProblems(one(`${SITE_ORIGIN}/`), ctx), [], "the home page must pass");
expectProblem(
  "https://neft-classroom-html-activities.pages.dev/",
  /not on https:\/\/eduwonderlab\.com/,
);
expectProblem(`${SITE_ORIGIN}/teacher-tools/`, /teacher-gated/);
expectProblem(`${SITE_ORIGIN}/curriculum/`, /teacher-gated/);
expectProblem(`${SITE_ORIGIN}/lessons/10-1/readiness/`, /no file in the build output/);
expectProblem(`${SITE_ORIGIN}/no-such-page/`, /no file in the build output/);
expectProblem(`${SITE_ORIGIN}/lessons/1-1/homework.html`, /not canonical/);
expectProblem(`${SITE_ORIGIN}/map`, /redirected/);
expectProblem(`${SITE_ORIGIN}/`, /lastmod/, "");

console.log(`   ✓ ${locs.length} URLs, all canonical, public, present, and dated`);
