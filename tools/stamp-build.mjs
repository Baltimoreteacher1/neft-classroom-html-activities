#!/usr/bin/env node
/**
 * Write a tiny, PUBLIC build stamp so the live deployment can be verified at a
 * glance — functions/_middleware.js leaves any path ending in /config.json
 * ungated, so this is fetchable without the site password:
 *   curl https://eduwonderlab.com/access-practice-lab/config.json
 * Shows the commit + build time actually serving in production. Runs in the
 * build, after dist exists. Never fails the build.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

try {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const dir = join(root, "dist", "access-practice-lab");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  // Content proof: read the DEPLOYED index.html to confirm the new app + data
  // modules actually shipped (not just that the build ran).
  let appVersion = "",
    dataModules = 0;
  try {
    const idx = readFileSync(join(dir, "index.html"), "utf8");
    appVersion = (idx.match(/app\.js\?v=([a-z0-9-]+)/i) || [])[1] || "";
    dataModules = (idx.match(/access-data(?:-v\d+)?\.js/g) || []).length;
  } catch {}
  const stamp = {
    app: "access-practice-lab",
    commit: process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "local",
    branch: process.env.CF_PAGES_BRANCH || "",
    builtAt: new Date().toISOString(),
    appVersion,
    dataModules,
  };
  // Write the public build stamp. This line was accidentally dropped in
  // c86637562 while adding SW cache-key stamping, which left every build
  // shipping without a fresh config.json — so the live stamp went stale and
  // ship:verify falsely reported production as "frozen" while the site was
  // actually current. Restored so deploy verification works again.
  writeFileSync(join(dir, "config.json"), JSON.stringify(stamp, null, 2));

  // The stamp for cache keys. On Cloudflare this is the deploying commit, so
  // every asset URL below changes exactly once per deploy and is reproducible
  // from the sha. Locally there is no sha, so it degrades to a timestamp —
  // which is why nothing below may write into the TRACKED tree (see the
  // dist-only note on currFiles).
  const stampKey = (
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    Date.now().toString(36)
  ).slice(0, 10);

  // NOTE: Service Worker cache keys are NOT stamped here. `vite.config.js`
  // (closeBundle → bustSwCaches) already rewrites `const CACHE = "…"` in EVERY
  // sw.js under dist/, recursively, and it runs before this script — so the
  // block that used to live here was dead twice over: by the time it ran, the
  // constant no longer matched its `eduwonderlab-v…` regex, and its only
  // surviving effect was rewriting the tracked `public/sw.js`, which nothing
  // reads (Vite copies public/ into dist/, then re-stamps the copy). Two
  // systems stamping one value is the bug; vite owns it because it finds all of
  // them, not just the root one.

  // Every page that loads a /assets/curriculum-*.{css,js} with a ?v= belongs
  // here. student-launch was missing, so its two assets sat pinned at
  // ?v=20260709 while curriculum-student-launch.js changed three times in July
  // 2026 -- students kept getting the cached July 9 copy. A page absent from
  // this list does not fail loudly; it just silently stops being cache-busted.
  //
  // dist/ ONLY. These paths used to include the tracked source copies, which
  // nothing serves: Cloudflare rebuilds dist/ from a clean checkout, so the
  // committed ?v= is dead text. All it did was dirty three tracked files on
  // every local build — in a repo that auto-commits during sessions, which is
  // how a stamp lands in an unrelated commit made by someone who never ran the
  // build. Pinned by tools/build-injectors-idempotent.test.mjs.
  const currFiles = [
    join(root, "dist", "curriculum", "index.html"),
    join(root, "dist", "curriculum", "student-launch", "index.html"),
    // Added 2026-08-24, the same way student-launch was: units/index.html loads
    // curriculum-teacher-workflow.css with a ?v= and was never in this list, so
    // that stylesheet has never been cache-busted on the browse hub. Found by
    // editing the file and noticing dist/curriculum/units kept the source
    // placeholder while dist/curriculum got a build id.
    join(root, "dist", "curriculum", "units", "index.html"),
  ];

  for (const currPath of currFiles) {
    if (existsSync(currPath)) {
      try {
        let currContent = readFileSync(currPath, "utf8");
        currContent = currContent.replace(
          /(\/assets\/curriculum-[^"']+\.(?:css|js))\?v=[^"']+/g,
          (match, asset) =>
            // curriculum-hub-*.{js,css} are stamped with their own CONTENT
            // HASH (see tools/curriculum-hub-assets.test.mjs), which is a
            // strictly better cache key than a build id: it changes when the
            // file changes and not on every build. Overwriting it here also
            // broke that test, because the stamp in the HTML no longer matched
            // the file it names.
            /\/assets\/curriculum-hub[^"']*$/.test(asset) ? match : `${asset}?v=${stampKey}`,
        );
        writeFileSync(currPath, currContent, "utf8");
      } catch (_e) {}
    }
  }

  console.log(`stamp-build: wrote config.json and stamped curriculum assets ?v=${stampKey}`);
} catch (e) {
  console.warn("stamp-build: non-fatal —", e.message);
  process.exit(0);
}
