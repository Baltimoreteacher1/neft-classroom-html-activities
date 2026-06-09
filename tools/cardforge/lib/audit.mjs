// CardForge card audit. Reports completeness of existing live Math lesson cards
// using the curriculum manifest (the canonical card catalog). Read-only.
import { resolve } from "node:path";
import { existsSync, readJSON, REPO_ROOT } from "./util.mjs";

const CARD_FIELDS = ["title", "standard", "objective", "languageObjective", "timeEstimate", "topic"];

export function auditCards() {
  const manifestPath = resolve(REPO_ROOT, "data/curriculum-manifest.json");
  if (!existsSync(manifestPath)) {
    return { ok: false, message: "data/curriculum-manifest.json not found. Run: npm run generate-curriculum-manifest", rows: [] };
  }
  const manifest = readJSON(manifestPath);
  const lessons = manifest.lessons || [];
  const rows = lessons.map((l) => {
    const missingFields = CARD_FIELDS.filter((f) => !l[f]);
    const res = l.resources || {};
    const applicable = Object.values(res).filter((r) => r.applicable);
    const missingRes = applicable.filter((r) => !r.exists).length;
    return {
      id: l.id, title: l.title, unit: l.unit,
      missingFields, missingResources: missingRes,
      resourceTotal: applicable.length,
      weak: missingFields.length > 0 || missingRes > 0,
    };
  });
  const weak = rows.filter((r) => r.weak);
  return {
    ok: true, total: rows.length, weakCount: weak.length, rows, weak,
    summary: `Audited ${rows.length} live lesson cards · ${weak.length} have missing card fields or resources.`,
  };
}
