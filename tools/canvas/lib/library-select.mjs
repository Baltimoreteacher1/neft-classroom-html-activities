/**
 * library-select.mjs — the single source of truth for "which library items are
 * student-safe, and which Canvas module each belongs to."
 *
 * Both the cartridge generator (build-library-cartridge.mjs) and the Canvas
 * Studio data builder (build-studio-index.mjs) import this, so the console a
 * teacher browses always matches the package that gets built. Pure functions,
 * no side effects.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

/** Normalize any url/path to a lowercase, leading+trailing-slashed key. */
export function norm(u) {
  if (!u) return "";
  let p = String(u).trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.endsWith("/") && !/\.[a-z0-9]+$/i.test(p)) p += "/";
  return p.toLowerCase();
}

/** Activity types that belong in a student course (Tools/Hubs excluded). */
export const STUDENT_TYPES = new Set([
  "Lesson",
  "Activity",
  "Game",
  "Project",
  "Assessment",
  "Review",
  "Bridge",
]);

/** Teacher-only / personal / infrastructure url prefixes — never to students. */
export const DENY_PREFIXES = [
  "/teacher-tools/",
  "/teacher-data-dashboard/",
  "/access-teacher/",
  "/dashboard/",
  "/neft-data-studio/",
  "/neft-school-hub/",
  "/personal/",
  "/futures/",
  "/noam-bar-mitzvah/",
  "/noam-school-v10/",
  "/living-school/",
  "/directory/",
  "/results-worker/",
  "/migrations/",
];

/** Personal/family substrings that live under otherwise-public sections. */
export const DENY_SUBSTRINGS = ["noamhebrew", "/hebrew-reading", "bar-mitzvah", "hebrewreview"];

/** Paths flagged non-public (private/teacher/admin/family) in data/routes.json. */
export function loadPrivatePaths(repoRoot) {
  const out = new Set();
  try {
    const routes = JSON.parse(readFileSync(resolve(repoRoot, "data/routes.json"), "utf8"));
    const list = Array.isArray(routes.routes) ? routes.routes : Array.isArray(routes) ? routes : [];
    for (const r of list) {
      const vis = String(r.visibility || "").toLowerCase();
      const aud = String(r.audience || "").toLowerCase();
      if ((vis && vis !== "public") || aud === "admin" || aud === "family") out.add(norm(r.path));
    }
  } catch {
    /* routes.json optional */
  }
  return out;
}

/** True when an item may appear in a student-facing Canvas export. */
export function isStudentSafe(item, privatePaths, includePrivate = false) {
  if (includePrivate) return true;
  const p = norm(item.url);
  if (!STUDENT_TYPES.has(item.activityType)) return false;
  if (privatePaths.has(p)) return false;
  if (DENY_PREFIXES.some((d) => p.startsWith(d))) return false;
  if (DENY_SUBSTRINGS.some((d) => p.includes(d))) return false;
  return true;
}

/**
 * Map an item to its Canvas module: { key, title, order }. Stable teacher order:
 * Math units (by unit), then Reading/ESOL, Games, Projects, Assessments, the
 * rest. Mirrors the modules a teacher sees in the Studio.
 */
export function moduleOf(item) {
  const p = norm(item.url);
  const unitMatch = p.match(/\/lessons\/(\d+)-\d+\//) || p.match(/\/math\/unit-(\d+)\//);
  if (unitMatch) {
    const u = Number(unitMatch[1]);
    return { key: `unit-${u}`, title: `Unit ${u} · Math`, order: 100 + u };
  }
  switch (item.activityType) {
    case "Game":
      return { key: "games", title: "Games & Arcade", order: 400 };
    case "Project":
      return { key: "projects", title: "Projects & Performance Tasks", order: 410 };
    case "Assessment":
      return { key: "assessments", title: "Assessments", order: 420 };
    case "Review":
    case "Bridge":
      return { key: "review", title: "Review & Bridges", order: 430 };
  }
  if (p.startsWith("/esol-reading-writing/") || p.startsWith("/graphic-novels/") || p.startsWith("/reading"))
    return { key: "reading-writing", title: "Reading & Writing", order: 300 };
  if (p.startsWith("/esol") || p.startsWith("/wida") || p.startsWith("/access"))
    return { key: "esol", title: "ESOL & WIDA ACCESS", order: 310 };
  if (p.startsWith("/math/") || p.startsWith("/lessons/"))
    return { key: "math-activities", title: "Math Activities & Labs", order: 320 };
  return { key: "explore", title: "Explore & Enrichment", order: 500 };
}

/**
 * Select + group the whole library.
 * @returns { items:[{title,url,activityType,standard,module}], modules:[{key,title,order,items:[]}] }
 */
export function selectLibrary(repoRoot, opts = {}) {
  const { typeFilter = null, sectionFilter = null, limit = 0, includePrivate = false, selectUrls = null } = opts;
  const registry = JSON.parse(readFileSync(resolve(repoRoot, "data/registry.json"), "utf8"));
  const all = Array.isArray(registry.activities) ? registry.activities : [];
  const privatePaths = loadPrivatePaths(repoRoot);

  let items = all.filter((it) => isStudentSafe(it, privatePaths, includePrivate));
  if (typeFilter) items = items.filter((i) => i.activityType === typeFilter);
  if (sectionFilter) items = items.filter((i) => norm(i.url).includes(String(sectionFilter).toLowerCase()));
  // Exact selection (from the Studio): keep only these urls, in the registry's
  // own order so module grouping stays stable.
  if (Array.isArray(selectUrls) && selectUrls.length) {
    const wanted = new Set(selectUrls.map(norm));
    items = items.filter((i) => wanted.has(norm(i.url)));
  }

  // de-dupe by normalized url
  const seen = new Set();
  items = items.filter((i) => {
    const k = norm(i.url);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (limit > 0) items = items.slice(0, limit);

  const modMap = new Map();
  const enriched = items.map((it) => {
    const m = moduleOf(it);
    if (!modMap.has(m.key)) modMap.set(m.key, { key: m.key, title: m.title, order: m.order, items: [] });
    const row = {
      title: it.title,
      url: it.url,
      activityType: it.activityType,
      standard: it.standard || null,
      module: m.title,
      moduleKey: m.key,
    };
    modMap.get(m.key).items.push(row);
    return row;
  });
  const modules = [...modMap.values()].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return { items: enriched, modules };
}
