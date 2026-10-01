#!/usr/bin/env node
/**
 * Write an UNGATED inventory of the ACCESS Lab content actually shipped to
 * dist/access-practice-lab/inventory/config.json (path ends in /config.json, so
 * _middleware.js leaves it open even behind the site password). This lets the
 * live deployment be audited from anywhere:
 *   curl https://eduwonderlab.com/access-practice-lab/inventory/config.json
 * Counts come from access-practice-lab/content/ through the shared reader, the
 * same files the app loads. Never fails the build.
 */
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BANDS, LAB_DIR, loadBand, loadTests, REPO_ROOT } from "./lib/access-lab-content.mjs";

try {
  const perBand = {};
  let total = 0;
  let withPicture = 0;
  for (const band of BANDS) {
    perBand[band] = {};
    for (const { domain, data } of loadBand(band)) {
      perBand[band][domain] = {};
      for (const [level, L] of Object.entries(data.levels || {})) {
        const acts = L.activities || [];
        perBand[band][domain][level] = acts.length;
        total += acts.length;
        withPicture += acts.filter((a) => a.picture || a.chart || a.table).length;
      }
    }
  }
  const tests = loadTests().map(({ data }) => ({ id: data.id, band: data.band, kind: data.kind }));
  const out = {
    builtAt: new Date().toISOString(),
    commit: process.env.CF_PAGES_COMMIT_SHA || "local",
    totals: {
      activities: total,
      activitiesWithVisuals: withPicture,
      tests: tests.length,
      pictures: readdirSync(join(LAB_DIR, "pictures")).filter((f) => f.endsWith(".svg")).length,
    },
    perBand,
    tests,
  };
  const dir = join(REPO_ROOT, "dist", "access-practice-lab", "inventory");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "config.json"), JSON.stringify(out, null, 1));
  console.log(
    `gen-access-inventory: ${total} activities · ${tests.length} tests → inventory/config.json`,
  );
} catch (e) {
  console.warn("gen-access-inventory: non-fatal —", e.message);
  process.exit(0);
}
