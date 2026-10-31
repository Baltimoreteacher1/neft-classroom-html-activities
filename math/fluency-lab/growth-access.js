// Loads the teacher workstream's growth log when it exists. growth-log.js is published by another workstream, so a page
// must keep working while it is absent: this returns { api: null, log: null } and the reports and achievements fall back
// to checkup evidence. After the workstreams merge this can become a plain static import.
import { profileKey, readLocal } from "./school-tools.js";

export async function loadGrowth(profile) {
  try {
    const file = "./growth-log.js";
    const api = await import(/* @vite-ignore */ file);
    if (typeof api.growthFor !== "function") return { api: null, log: null };
    const raw = typeof api.loadGrowthLog === "function" ? api.loadGrowthLog(profile) : readLocal(profileKey(api.GROWTH_LOG_KEY || "ewl-fluency-growth-v1", profile), null);
    return { api, log: typeof api.sanitizeGrowthLog === "function" ? api.sanitizeGrowthLog(raw) : raw };
  } catch {
    return { api: null, log: null };
  }
}
