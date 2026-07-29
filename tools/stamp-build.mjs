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

  // Stamp Service Worker cache key & curriculum assets with build timestamp
  const buildStamp =
    process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || Date.now().toString(36);
  const swCacheName = `eduwonderlab-v${buildStamp.slice(0, 10)}`;

  const swFiles = [
    join(root, "public", "sw.js"),
    join(root, "dist", "sw.js"),
    join(root, "dist", "public", "sw.js"),
  ];

  for (const swPath of swFiles) {
    if (existsSync(swPath)) {
      try {
        let swContent = readFileSync(swPath, "utf8");
        swContent = swContent.replace(
          /const CACHE = "eduwonderlab-v[^"]+";/,
          `const CACHE = "${swCacheName}";`,
        );
        writeFileSync(swPath, swContent, "utf8");
      } catch (_e) {}
    }
  }

  const currFiles = [
    join(root, "curriculum", "index.html"),
    join(root, "dist", "curriculum", "index.html"),
  ];

  for (const currPath of currFiles) {
    if (existsSync(currPath)) {
      try {
        let currContent = readFileSync(currPath, "utf8");
        currContent = currContent.replace(
          /(\/assets\/curriculum-[^"']+\.(?:css|js))\?v=[^"']+/g,
          `$1?v=${buildStamp.slice(0, 10)}`,
        );
        writeFileSync(currPath, currContent, "utf8");
      } catch (_e) {}
    }
  }

  console.log(`stamp-build: wrote config.json and updated SW cache to ${swCacheName}`);
} catch (e) {
  console.warn("stamp-build: non-fatal —", e.message);
  process.exit(0);
}
