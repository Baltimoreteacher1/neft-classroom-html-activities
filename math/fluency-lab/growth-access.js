// Loads the teacher workstream's growth log. If it fails to load, this returns { api: null, log: null } and the reports
// and achievements fall back to checkup evidence. The path is a literal so the dist bundler can follow it
// (tools/bundle-dist-modules.mjs refuses a computed import() path).
import { profileKey, readLocal } from "./school-tools.js";

export async function loadGrowth(profile) {
  try {
    const api = await import("./growth-log.js");
    if (typeof api.growthFor !== "function") return { api: null, log: null };
    const raw = typeof api.loadGrowthLog === "function" ? api.loadGrowthLog(profile) : readLocal(profileKey(api.GROWTH_LOG_KEY || "ewl-fluency-growth-v1", profile), null);
    return { api, log: typeof api.sanitizeGrowthLog === "function" ? api.sanitizeGrowthLog(raw) : raw };
  } catch {
    return { api: null, log: null };
  }
}
