#!/usr/bin/env node
/**
 * Write a tiny, PUBLIC build stamp so the live deployment can be verified at a
 * glance — functions/_middleware.js leaves any path ending in /config.json
 * ungated, so this is fetchable without the site password:
 *   curl https://eduwonderlab.com/access-practice-lab/config.json
 * Shows the commit + build time actually serving in production. Runs in the
 * build, after dist exists. Never fails the build.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

try {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const dir = join(root, "dist", "access-practice-lab");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const stamp = {
    app: "access-practice-lab",
    commit: process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "local",
    branch: process.env.CF_PAGES_BRANCH || "",
    builtAt: new Date().toISOString(),
  };
  writeFileSync(join(dir, "config.json"), JSON.stringify(stamp, null, 2));
  console.log(`stamp-build: wrote config.json (commit ${stamp.commit.slice(0, 7)})`);
} catch (e) {
  console.warn("stamp-build: non-fatal —", e.message);
  process.exit(0);
}
