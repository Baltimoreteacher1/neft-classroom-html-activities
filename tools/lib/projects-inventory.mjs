/**
 * projects-inventory.mjs — read-only, deterministic scan of the Projects surface.
 *
 * One scanner serves two callers so they cannot disagree:
 *   - tools/build-projects-baseline-inventory.mjs writes the scan to
 *     data/projects-baseline-inventory.json (the zero-loss baseline);
 *   - tools/validate-projects-registry.mjs re-scans the tree and compares it
 *     with that baseline and with data/project-registry.json.
 *
 * It reads files and never writes. Output has no timestamps, no absolute paths
 * and every collection is sorted, so reruns are byte-identical.
 *
 * Unit numbers in this module are CURRENT Reveal-TOC numbers. The folder name
 * under /math/ (`unit-1`, `unit-10`) is the legacy number and is kept only as
 * `legacyFolder`. Placement mirrors tools/generate-project-studio.mjs
 * `coursePlacement` and scripts/lib/download-taxonomy.mjs CANONICAL_UNIT.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { isTeacherSurface } from "../../functions/_lib/teacher-surface.js";
import { CANONICAL_UNIT } from "../../scripts/lib/download-taxonomy.mjs";
import { PROJECT_UNITS } from "./project-units.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const rd = (rel) => readFileSync(join(ROOT, rel), "utf8");
const has = (rel) => existsSync(join(ROOT, rel));
const sortedUnique = (a) => [...new Set(a)].sort();
const routeOf = (file) => `/${file.replace(/index\.html$/, "")}`;

/** Public pages outside the math project folders that belong to the Projects surface. */
export const SURFACE_PAGES = Object.freeze([
  ["gallery", "curriculum/projects/index.html"],
  ["gallery", "math/projects/index.html"],
  ["portfolio", "math/projects/portfolio/index.html"],
  ["studio", "curriculum/projects/studio/index.html"],
]);

/** Standalone project experiences that live outside the unit folders. */
export const STANDALONE_PAGES = Object.freeze([
  "math/statistics/statistics-of-my-life/index.html",
  "world-architect-math-project/index.html",
]);

/** Strip script/style bodies so text and attribute scans see only markup. */
const markupOnly = (html) =>
  html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");

export function textOf(html) {
  return markupOnly(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Local (same-origin, absolute-path) asset references of a page, query stripped. */
export function localAssets(html) {
  const out = [];
  for (const m of html.matchAll(/\b(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) out.push(m[1]);
  return sortedUnique(
    out.filter((p) => /\.(?:js|mjs|css|json|svg|png|jpe?g|webp|woff2?)$/i.test(p)),
  );
}

export function externalLinks(html) {
  return sortedUnique(
    [...html.matchAll(/\b(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) =>
      m[1].replace(/[?#].*$/, ""),
    ),
  );
}

/** localStorage keys named by a string literal in a page's own inline scripts. */
export function pageStorageKeys(html) {
  const keys = [];
  for (const block of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const m of block[1].matchAll(
      /localStorage\.(?:get|set|remove)Item\(\s*["'`]([^"'`$]+)["'`]/g,
    ))
      keys.push(m[1]);
  }
  return sortedUnique(keys);
}

/** Storage key constants declared by each shared project layer. */
export function layerKeyMap() {
  const dir = "shared/projects";
  const map = {};
  for (const name of readdirSync(join(ROOT, dir)).sort()) {
    if (!name.endsWith(".js")) continue;
    const src = rd(`${dir}/${name}`);
    const keys = [...src.matchAll(/\bvar\s+([A-Z_]*(?:KEY|PREFIX))\s*=\s*["']([^"']+)["']/g)].map(
      (m) => m[2],
    );
    if (keys.length) map[`/${dir}/${name}`] = sortedUnique(keys);
  }
  return map;
}

/** Fetched companion data files: which shared script reads `./<name>.json`. */
export function companionConsumers() {
  const dir = "shared/projects";
  const out = {};
  for (const name of readdirSync(join(ROOT, dir)).sort()) {
    if (!name.endsWith(".js")) continue;
    for (const m of rd(`${dir}/${name}`).matchAll(/["']\.\/([a-z0-9-]+\.json)["']/g))
      (out[m[1]] ||= new Set()).add(`/${dir}/${name}`);
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v].sort()]));
}

/** District/Reveal standard codes printed on a page (6.AT.4, 6.GR.1, 6.NOS.2 …). */
export function standardsOf(html) {
  const text = textOf(html);
  return sortedUnique(
    text.match(/\b6\.[A-Z]{2,3}\.[A-Za-z0-9]{1,3}(?:\.[A-Za-z0-9]{1,3})?\b/g) || [],
  );
}

export function rubricOf(html) {
  const m = html.match(/<table\b[^>]*class="[^"]*\brubric\b[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (!m) return { table: false, rows: 0 };
  const rows = (m[1].match(/<tr\b/gi) || []).length;
  return { table: true, rows: Math.max(0, rows - 1) };
}

export function titleOf(html) {
  const t = html.match(/<title>([^<]*)/i);
  return t ? t[1].replace(/\s+/g, " ").trim() : "";
}

/** Canvas bridge activity id the injector stamped, if any. */
const bridgeActivityId = (html) => (html.match(/activityId:\s*"([^"]+)"/) || [])[1] || null;

/** Studio mission ids a page links to (`?project=<id>`). */
const studioLinks = (html) =>
  sortedUnique(
    [...html.matchAll(/\/curriculum\/projects\/studio\/\?project=([a-z0-9-]+)/g)].map((m) => m[1]),
  );

/** Everything one page can tell us. Pure function of the page text + shared maps. */
export function scanPage(file, ctx) {
  const html = rd(file);
  const assets = localAssets(html);
  const shared = assets.filter((a) => a.startsWith("/shared/projects/"));
  const layerKeys = sortedUnique(shared.flatMap((a) => ctx.layerKeys[a] || []));
  const folder = join(ROOT, dirname(file));
  const siblings = readdirSync(folder)
    .filter((n) => n !== "index.html" && statSync(join(folder, n)).isFile())
    .sort();
  const route = routeOf(file);
  const catalogPath = file.replace(/\/index\.html$/, "");
  const catalog = ctx.scormCatalog.get(catalogPath) || null;
  const rubric = rubricOf(html);
  return {
    file,
    route,
    title: titleOf(html),
    standards: standardsOf(html),
    studioMissionLinks: studioLinks(html),
    sharedLayers: shared,
    otherLocalAssets: assets.filter((a) => !a.startsWith("/shared/projects/")),
    externalLinks: externalLinks(html),
    companionData: siblings.map((name) => ({
      file: `${dirname(file)}/${name}`,
      consumers: ctx.consumers[name] || [],
    })),
    rubric: {
      ...rubric,
      selfScoring: shared.includes("/shared/projects/projects-complete.js"),
    },
    saveResume: {
      sentinel: html.includes("nsr-injected:begin"),
      engine: assets.includes("/shared/save-resume/save-resume-engine.js"),
      pageKeys: pageStorageKeys(html),
      layerKeys,
    },
    portfolio: {
      listedOnPortfolioPage: ctx.portfolioRoutes.has(route),
      completionRecord: shared.includes("/shared/projects/projects-complete.js"),
      certificate: shared.includes("/shared/projects/projects-award.js"),
    },
    exportPrint: {
      printCall: /window\.print\(\)/.test(html),
      reportBuilder: /\bbuildReport\b/.test(html),
    },
    canvas: {
      bridge: html.includes("canvas-bridge-injected:begin"),
      activityId: bridgeActivityId(html),
      scormCatalogEntry: catalog ? { title: catalog.title, grade: catalog.grade } : null,
    },
  };
}

function walkProjectPages() {
  const out = [];
  for (const unit of PROJECT_UNITS) {
    const base = `math/${unit}/projects`;
    if (!has(`${base}/index.html`)) continue;
    out.push({ kind: "unit-hub", file: `${base}/index.html`, folder: unit });
    for (const name of readdirSync(join(ROOT, base)).sort()) {
      const f = `${base}/${name}/index.html`;
      if (!has(f)) continue;
      const kind = name === "answer-key" ? "answer-key" : "project";
      out.push({ kind, file: f, folder: unit, slug: name });
    }
  }
  return out;
}

/** The portfolio page's inline UNITS table, evaluated without running the page. */
export function portfolioUnits() {
  const html = rd("math/projects/portfolio/index.html");
  const m = html.match(/var UNITS = (\[[\s\S]*?\n\s*\]);/);
  if (!m) throw new Error("portfolio page: inline UNITS table not found");
  return Function(`"use strict"; return ${m[1]};`)();
}

/** Current unit of a legacy project folder (Studio missions are the evidence). */
export function currentUnitOfFolder(folder, missions) {
  if (folder === "pre-unit") return 0;
  if (folder === "statistics") return 2;
  const canonical = CANONICAL_UNIT.get(`/math/${folder}/projects/`);
  if (canonical) return canonical.unit;
  const first = missions.find((p) => p.classic?.startsWith(`/math/${folder}/projects/`));
  return first ? first.unit : Number(folder.replace("unit-", ""));
}

export async function scanProjects() {
  const { PROJECTS, UNIT_NAMES } = await import("../../curriculum/projects/studio/projects.mjs");
  const { model, FAMILY, WORKED_EXAMPLES } = await import(
    "../../curriculum/projects/studio/math.mjs"
  );
  const units = portfolioUnits();
  const portfolioRoutes = new Set(units.flatMap((u) => u.projects.map((p) => p.path)));
  const catalog = JSON.parse(rd("tools/scorm/activity-catalog.json"));
  const scormCatalog = new Map(
    (catalog.activities || [])
      .filter((a) => /(^|\/)projects(\/|$)/.test(a.path) || /statistics-of-my-life/.test(a.path))
      .map((a) => [String(a.path).replace(/^\/+|\/+$/g, ""), a]),
  );
  const ctx = {
    layerKeys: layerKeyMap(),
    consumers: companionConsumers(),
    portfolioRoutes,
    scormCatalog,
  };

  const missions = PROJECTS.map((p) => {
    const result = model(p, p.defaults);
    return {
      id: p.id,
      title: p.title,
      unit: p.unit,
      unitName: UNIT_NAMES[p.unit],
      family: p.family,
      classic: p.classic || null,
      choices: p.choices.length,
      evidencePrompts: p.evidence.length,
      contextDesigns: p.contextDesigns?.length ?? 0,
      feedback: {
        engine: "curriculum/projects/studio/math.mjs",
        deterministic: result.errors.length === 0 && result.checks.length > 0,
        checks: result.checks.length,
        everyAnswerFinite: result.checks.every((c) => Number.isFinite(c.answer)),
        hasDecision: Boolean(result.decision),
        workedExample: Boolean(WORKED_EXAMPLES[p.family]),
      },
      ccss: p.crosswalk?.ccss ?? [],
    };
  });

  const pages = [];
  for (const entry of walkProjectPages()) {
    if (entry.kind === "answer-key") {
      pages.push({
        ...entry,
        route: routeOf(entry.file),
        teacherGated: isTeacherSurface(routeOf(entry.file)),
      });
      continue;
    }
    const scan = scanPage(entry.file, ctx);
    const mission = missions.find((m) => m.classic === scan.route) || null;
    pages.push({
      ...entry,
      legacyFolder: entry.folder,
      currentUnit: currentUnitOfFolder(entry.folder, PROJECTS),
      missionId: mission ? mission.id : null,
      ...scan,
    });
  }
  for (const file of STANDALONE_PAGES) {
    if (!has(file)) continue;
    const scan = scanPage(file, ctx);
    const mission = missions.find((m) => m.classic === scan.route) || null;
    pages.push({
      kind: "standalone",
      folder: null,
      legacyFolder: null,
      currentUnit: mission ? mission.unit : null,
      missionId: mission ? mission.id : null,
      ...scan,
    });
  }
  const surface = SURFACE_PAGES.filter(([, f]) => has(f)).map(([kind, file]) => ({
    kind,
    ...scanPage(file, ctx),
  }));

  const sorted = (a) => a.sort((x, y) => (x.file < y.file ? -1 : 1));
  const projectPages = pages.filter((p) => p.kind === "project");
  return {
    missions,
    pages: sorted(pages),
    surface: sorted(surface),
    portfolio: {
      sets: units.length,
      projects: units.reduce((n, u) => n + u.projects.length, 0),
      routes: [...portfolioRoutes].sort(),
    },
    layerKeys: ctx.layerKeys,
    consumers: ctx.consumers,
    familyCount: Object.keys(FAMILY).length,
    counts: {
      studioMissions: missions.length,
      studioFamilies: Object.keys(FAMILY).length,
      projectSets: pages.filter((p) => p.kind === "unit-hub").length,
      versionPages: projectPages.length,
      standalonePages: pages.filter((p) => p.kind === "standalone").length,
      answerKeyPages: pages.filter((p) => p.kind === "answer-key").length,
      missionsWithoutLegacyPage: missions.filter((m) => !m.classic).length,
    },
  };
}

export const relativeToRoot = (p) => relative(ROOT, p);
