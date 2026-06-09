// CardForge publish guard (v1). Honest by design: it does NOT write live
// curriculum data or move files into live routes. It validates the staged
// package, checks for collisions, and prints the exact manual steps.
import { resolve } from "node:path";
import { existsSync, readJSON, readdirSync, REPO_ROOT } from "./util.mjs";

export function publishGuard(pkgDir) {
  const dir = resolve(pkgDir);
  const lines = [];
  const blockers = [];

  if (!existsSync(resolve(dir, "card.json"))) {
    blockers.push(`No card.json in ${dir}.`);
    return { ok: false, blockers, lines };
  }
  const card = readJSON(resolve(dir, "card.json"));
  const files = readdirSync(dir);

  if (card.demo) blockers.push("Card is marked demo:true — demo cards are never published to live curriculum.");
  if (card.qaStatus !== "pass") blockers.push(`QA status is "${card.qaStatus}". Publish requires a clean QA pass (npm run cardforge:qa).`);
  if (!files.includes("qa-report.md")) blockers.push("No qa-report.md — run QA first.");

  // Duplicate / route-collision check against the live manifest.
  const manifestPath = resolve(REPO_ROOT, "data/curriculum-manifest.json");
  if (existsSync(manifestPath)) {
    const ids = (readJSON(manifestPath).lessons || []).map((l) => l.id);
    if (card.lesson != null && card.unit != null) {
      const liveId = `${card.unit}-${card.lesson}`;
      if (ids.includes(liveId)) blockers.push(`Live lesson "${liveId}" already exists in the manifest — publishing would risk a duplicate card. Resolve first.`);
    }
  }

  lines.push("CardForge publish (v1) is a guarded MANUAL procedure. Nothing was written to live data.");
  lines.push("");
  lines.push("To publish this card safely:");
  lines.push("  1. Move/author the lesson under lessons/<unit>-<lesson>/ (config.json + resources).");
  lines.push("  2. Run: npm run generate-curriculum-manifest   (regenerates data/curriculum-manifest.json)");
  lines.push("  3. Run: npm run validate && npm run audit       (link/structure + curriculum audit)");
  lines.push("  4. Add the hub card anchor to math/index.html if it should be surfaced there.");
  lines.push("  5. Review the diff, commit, push to main (Cloudflare Git deploy).");

  return { ok: blockers.length === 0, blockers, lines, card };
}
