#!/usr/bin/env node
/**
 * validate:projects-registry — the Projects surface is registered, counted from
 * one place, and loses nothing.
 *
 * Holds (all decidable facts; `analyze` is pure so the self-test can mutate it):
 *   1. SHAPE      every registry project has the required fields and enums; ids
 *                 are unique; classification is one of the declared four; each
 *                 current unit 0-10 has exactly one flagship.
 *   2. MISSIONS   registry ids == Studio mission ids (projects.mjs), and the
 *                 mirrored title / unit / family equal the mission's.
 *   3. UNITS      a page-backed project's unit equals the unit its legacy folder
 *                 is placed in today (CANONICAL_UNIT: unit-1 -> 6, unit-10 -> 5).
 *   4. BASELINE   every route in data/projects-baseline-inventory.json is still on
 *                 disk AND mapped by the registry (project launchUrl, hub,
 *                 answer-key, surface or companion), and no capability the
 *                 baseline recorded (save/resume, canvas bridge, completion
 *                 record, certificate, rubric table, print/report) has gone.
 *   5. DECLARED   what the registry says a project has (rubric, save/resume,
 *                 portfolio, certificate, SCORM) is what the scan finds.
 *   6. PUBLIC     the counts printed on /curriculum/projects/, /math/projects/
 *                 and the portfolio page equal the registry-derived counts; no
 *                 project is missing from either index page; the portfolio's
 *                 inline UNITS table lists exactly the registry's listed projects.
 *   7. HTTP       every registry launch URL, hub, surface and companion route
 *                 answers 200 from dist/ (answer-key routes must stay teacher
 *                 gated instead). A missing dist/ FAILS: run `npm run build`.
 *   8. GENERATOR  tools/generate-project-studio.mjs is idempotent: run against a throwaway
 *                 copy of every file it can write, it changes none of them (and so
 *                 never touches curriculum/units/index.html, which belongs to the
 *                 curriculum hub). A rerun that changes any committed file fails.
 *
 * Self-tests every detector against a mutated copy first (remove a project,
 * move a URL, drop a capability, change a printed count, orphan a card).
 */
import { execFileSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";
import { assertNonEmpty } from "./lib/non-empty.mjs";
import { loadRegistry, registryCounts } from "./lib/project-registry.mjs";
import { portfolioRoutes, ROOT, scanProjects, textOf } from "./lib/projects-inventory.mjs";

const CLASSES = ["flagship", "version", "stretch", "companion"];
const RUBRIC_KINDS = ["in-page-table", "studio-teacher-mode", "none"];
const REQUIRED = [
  "id",
  "title",
  "unit",
  "legacyFolder",
  "family",
  "classification",
  "classificationBasis",
  "launchUrl",
  "studioUrl",
  "hubUrl",
  "standards",
  "requirements",
  "files",
  "rubric",
  "expectedArtifact",
  "saveResume",
  "portfolio",
  "scorm",
  "printExport",
];
/** Files the project generator may read or write, relative to the repo root. */
function generatorFiles() {
  const out = [];
  const walk = (rel) => {
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) return;
    for (const name of readdirSync(abs, { withFileTypes: true })) {
      const child = `${rel}/${name.name}`;
      if (name.isDirectory()) walk(child);
      else out.push(child);
    }
  };
  walk("curriculum/projects");
  walk("math/projects");
  for (const dir of readdirSync(join(ROOT, "math")))
    if (/^(pre-unit|statistics|unit-\d+)$/.test(dir)) walk(`math/${dir}/projects`);
  walk("math/statistics/statistics-of-my-life");
  walk("world-architect-math-project");
  out.push("curriculum/units/index.html");
  return out;
}

/** Pure: every path whose content differs between two {path -> text} maps. */
export function treeDrift(before, after) {
  const problems = [];
  for (const [path, text] of before)
    if (after.get(path) !== text) problems.push(`GENERATOR: a rerun changes ${path}`);
  return problems;
}

/** Run the generator in a throwaway copy of the tree and report any file it would change. */
export function generatorDrift() {
  const files = generatorFiles();
  const before = new Map(files.map((f) => [f, read(f)]));
  const tmp = mkdtempSync(join(tmpdir(), "projects-generator-"));
  try {
    for (const f of files) {
      mkdirSync(dirname(join(tmp, f)), { recursive: true });
      writeFileSync(join(tmp, f), before.get(f));
    }
    try {
      execFileSync(process.execPath, [join(ROOT, "tools/generate-project-studio.mjs")], {
        cwd: tmp,
        stdio: "pipe",
      });
    } catch (error) {
      return [
        `GENERATOR: tools/generate-project-studio.mjs failed: ${String(
          error.stderr || error.message,
        )
          .split("\n")
          .slice(0, 3)
          .join(" ")}`,
      ];
    }
    const after = new Map(files.map((f) => [f, readFileSync(join(tmp, f), "utf8")]));
    return treeDrift(before, after);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const INDEX_PAGES = ["curriculum/projects/index.html", "math/projects/index.html"];
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

/** Numbers each public page prints, extracted by pattern. null = not found. */
export function publicNumbers(html) {
  const n = (re) => {
    const m = html.match(re);
    return m ? m.slice(1).map(Number) : null;
  };
  return {
    descriptionMissions: n(/content="(\d+) Grade 6 design projects/)?.[0] ?? null,
    bodyMissions: n(/<strong>(\d+)<\/strong> projects ·/)?.[0] ?? null,
    portfolioHeader: n(/(\d+) projects in (\d+) units\./),
    portfolioMeta: n(/across all (\d+) Grade 6 math projects in (\d+) units/),
    portfolioStatTotal: n(/id="stat-total">(\d+)</)?.[0] ?? null,
    portfolioStatUnits: n(/id="stat-unit-total">(\d+)</)?.[0] ?? null,
  };
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/** Pure: every problem, as a string. `in` is a plain object so tests can clone it. */
export function analyze(input) {
  const { registry, baseline, scan, missions, pages, portfolioRoutes } = input;
  const out = [];
  const add = (code, msg) => out.push(`${code}: ${msg}`);
  const regIds = registry.projects.map((p) => p.id);

  // 1 SHAPE
  if (new Set(regIds).size !== regIds.length) add("SHAPE", "duplicate project id in the registry");
  for (const p of registry.projects) {
    for (const key of REQUIRED) if (!(key in p)) add("SHAPE", `${p.id || "?"} is missing "${key}"`);
    if (!CLASSES.includes(p.classification))
      add("SHAPE", `${p.id}: classification "${p.classification}" is not one of ${CLASSES}`);
    if (!RUBRIC_KINDS.includes(p.rubric?.kind)) add("SHAPE", `${p.id}: unknown rubric kind`);
    if (!p.launchUrl?.startsWith("/")) add("SHAPE", `${p.id}: launchUrl must be an absolute path`);
  }
  for (let u = 0; u <= 10; u++) {
    const n = registry.projects.filter(
      (p) => p.unit === u && p.classification === "flagship",
    ).length;
    if (n !== 1) add("SHAPE", `current unit ${u} has ${n} flagship projects, expected exactly 1`);
  }

  // 2 MISSIONS
  const missionIds = missions.map((m) => m.id);
  for (const id of missionIds)
    if (!regIds.includes(id)) add("MISSIONS", `Studio mission "${id}" has no registry entry`);
  for (const id of regIds)
    if (!missionIds.includes(id))
      add("MISSIONS", `registry project "${id}" is not a Studio mission`);
  for (const p of registry.projects) {
    const m = missions.find((x) => x.id === p.id);
    if (!m) continue;
    for (const k of ["title", "unit", "family"])
      if (m[k] !== p[k])
        add("MISSIONS", `${p.id}: ${k} "${p[k]}" differs from projects.mjs "${m[k]}"`);
    if (p.studioUrl !== `/curriculum/projects/studio/?project=${encodeURIComponent(p.id)}`)
      add("MISSIONS", `${p.id}: studioUrl does not open this mission`);
  }

  // 3 UNITS + 5 DECLARED (against the scan)
  const scanByMission = new Map(scan.pages.filter((p) => p.missionId).map((p) => [p.missionId, p]));
  for (const p of registry.projects) {
    const page = scanByMission.get(p.id);
    if (!page) {
      if (p.files.page)
        add("DECLARED", `${p.id}: registry names page ${p.files.page} but the scan found none`);
      continue;
    }
    if (p.launchUrl !== page.route)
      add("DECLARED", `${p.id}: launchUrl ${p.launchUrl} != page ${page.route}`);
    if (p.files.page !== page.file)
      add("DECLARED", `${p.id}: files.page ${p.files.page} != ${page.file}`);
    if (p.unit !== page.currentUnit)
      add(
        "UNITS",
        `${p.id}: unit ${p.unit} but folder ${page.legacyFolder} is placed in unit ${page.currentUnit}`,
      );
    if (p.legacyFolder !== page.legacyFolder) add("DECLARED", `${p.id}: legacyFolder mismatch`);
    const eq = (label, a, b) =>
      a !== b && add("DECLARED", `${p.id}: ${label} registry=${a} scan=${b}`);
    eq("rubric.kind", p.rubric.kind, page.rubric.table ? "in-page-table" : "none");
    eq("rubric.rows", p.rubric.rows, page.rubric.rows);
    eq("rubric.selfScoring", p.rubric.selfScoring, page.rubric.selfScoring);
    eq("saveResume.sentinel", p.saveResume.sentinel, page.saveResume.sentinel);
    eq("portfolio.listed", p.portfolio.listed, page.portfolio.listedOnPortfolioPage);
    eq("portfolio.completionRecord", p.portfolio.completionRecord, page.portfolio.completionRecord);
    eq("portfolio.certificate", p.portfolio.certificate, page.portfolio.certificate);
    eq("scorm.canvasActivityId", p.scorm.canvasActivityId, page.canvas.activityId);
    eq("scorm.catalog", Boolean(p.scorm.catalogPath), Boolean(page.canvas.scormCatalogEntry));
    eq("printExport.report", p.printExport.report, page.exportPrint.reportBuilder);
    eq("printExport.print", p.printExport.print, page.exportPrint.printCall);
    if (!sameSet(p.saveResume.legacyPageKeys, page.saveResume.pageKeys))
      add("DECLARED", `${p.id}: page storage keys differ from the registry`);
    if (
      !sameSet(
        p.files.companionData,
        page.companionData.map((c) => c.file),
      )
    )
      add("DECLARED", `${p.id}: companion data files differ from the registry`);
    if (!sameSet(p.standards.pageCodes, page.standards))
      add("DECLARED", `${p.id}: standard codes on the page differ from the registry`);
  }

  // 4 BASELINE: routes present + mapped, capabilities not lost
  const mapped = new Set([
    ...registry.projects.map((p) => p.launchUrl),
    ...registry.hubs.flatMap((h) => [h.route, h.answerKeyRoute]),
    ...registry.surfaces.map((s) => s.route),
    ...registry.companions.filter((c) => c.route).map((c) => c.route),
  ]);
  const nowByRoute = new Map([...scan.pages, ...scan.surface].map((p) => [p.route, p]));
  for (const b of [...baseline.pages, ...baseline.surface]) {
    const now = nowByRoute.get(b.route);
    if (!now) add("BASELINE", `${b.route} existed in the baseline and is gone`);
    if (!mapped.has(b.route))
      add("BASELINE", `${b.route} existed in the baseline and the registry does not map it`);
    if (!now || b.kind === "answer-key") continue;
    const lost = (label, was, is) => was && !is && add("BASELINE", `${b.route}: lost ${label}`);
    lost("save/resume", b.saveResume?.sentinel, now.saveResume?.sentinel);
    lost("canvas bridge", b.canvas?.bridge, now.canvas?.bridge);
    lost("SCORM catalog entry", b.canvas?.scormCatalogEntry, now.canvas?.scormCatalogEntry);
    lost("completion record", b.portfolio?.completionRecord, now.portfolio?.completionRecord);
    lost("certificate", b.portfolio?.certificate, now.portfolio?.certificate);
    lost(
      "portfolio listing",
      b.portfolio?.listedOnPortfolioPage,
      now.portfolio?.listedOnPortfolioPage,
    );
    lost("rubric table", b.rubric?.table, now.rubric?.table);
    lost("print button", b.exportPrint?.printCall, now.exportPrint?.printCall);
    lost("report builder", b.exportPrint?.reportBuilder, now.exportPrint?.reportBuilder);
    for (const f of b.sharedLayers || [])
      if (!now.sharedLayers.includes(f)) add("BASELINE", `${b.route}: no longer loads ${f}`);
    for (const c of b.companionData || [])
      if (!now.companionData.some((x) => x.file === c.file))
        add("BASELINE", `${b.route}: companion data ${c.file} is gone`);
  }
  for (const h of registry.hubs)
    if (
      !sameSet(
        h.projects,
        registry.projects.filter((p) => p.legacyFolder === h.legacyFolder).map((p) => p.id),
      )
    )
      add("SHAPE", `hub ${h.id}: project list differs from the projects that name this folder`);

  // 6 PUBLIC
  const counts = registryCounts(registry);
  for (const file of INDEX_PAGES) {
    const num = publicNumbers(pages[file]);
    if (num.descriptionMissions !== counts.missions)
      add(
        "PUBLIC",
        `${file}: meta description says ${num.descriptionMissions} missions, registry has ${counts.missions}`,
      );
    if (num.bodyMissions !== counts.missions)
      add(
        "PUBLIC",
        `${file}: page says ${num.bodyMissions} missions, registry has ${counts.missions}`,
      );
    for (const p of registry.projects)
      if (!pages[file].includes(`?project=${encodeURIComponent(p.id)}`))
        add("PUBLIC", `${file}: project "${p.id}" has no card (orphaned from this index)`);
    const linked = [...pages[file].matchAll(/\?project=([a-z0-9-]+)/g)].map((m) => m[1]);
    for (const id of new Set(linked))
      if (!regIds.includes(id))
        add("PUBLIC", `${file}: card links to unregistered project "${id}"`);
  }
  const pf = publicNumbers(pages["math/projects/portfolio/index.html"]);
  const want = [counts.portfolioProjects, counts.units];
  for (const [label, got] of [
    ["header", pf.portfolioHeader],
    ["meta description", pf.portfolioMeta],
  ])
    if (!got || got[0] !== want[0] || got[1] !== want[1])
      add(
        "PUBLIC",
        `portfolio ${label} says ${got}, registry has ${want[0]} projects / ${want[1]} units`,
      );
  if (pf.portfolioStatTotal !== want[0])
    add(
      "PUBLIC",
      `portfolio "Projects finished" tile totals ${pf.portfolioStatTotal}, registry has ${want[0]}`,
    );
  if (pf.portfolioStatUnits !== want[1])
    add(
      "PUBLIC",
      `portfolio "Units" tile totals ${pf.portfolioStatUnits}, registry has ${want[1]}`,
    );
  const listed = registry.projects.filter((p) => p.portfolio.listed).map((p) => p.launchUrl);
  if (!sameSet(listed, [...portfolioRoutes]))
    add(
      "PUBLIC",
      "portfolio cards list different projects than the registry marks portfolio.listed",
    );
  return out;
}

/** Mutations that MUST each produce at least one problem containing `expect`. */
export function selfTest(base) {
  const clone = () => structuredClone(base);
  const cases = [
    ["a project removed from the registry", "MISSIONS", (i) => i.registry.projects.pop()],
    [
      "a launch URL changed",
      "BASELINE",
      (i) => {
        i.registry.projects[3].launchUrl = "/math/moved/";
      },
    ],
    [
      "a classification invented",
      "SHAPE",
      (i) => {
        i.registry.projects[3].classification = "bonus";
      },
    ],
    [
      "two flagships in one unit",
      "SHAPE",
      (i) => {
        i.registry.projects.find((p) => p.classification === "version").classification = "flagship";
      },
    ],
    [
      "a mission title drifting",
      "MISSIONS",
      (i) => {
        i.registry.projects[5].title += " (v2)";
      },
    ],
    [
      "a unit pinned to the legacy folder number",
      "UNITS",
      (i) => {
        i.registry.projects.find((p) => p.id === "unit-1-a").unit = 1;
      },
    ],
    [
      "a page deleted from disk",
      "BASELINE",
      (i) => {
        i.scan.pages = i.scan.pages.filter((p) => p.missionId !== "unit-4-a");
      },
    ],
    [
      "save/resume lost from a page",
      "BASELINE",
      (i) => {
        i.scan.pages.find((p) => p.missionId === "unit-4-a").saveResume.sentinel = false;
      },
    ],
    [
      "a certificate layer dropped",
      "BASELINE",
      (i) => {
        i.scan.pages.find((p) => p.missionId === "unit-4-a").portfolio.certificate = false;
      },
    ],
    [
      "a registry claim the page does not back",
      "DECLARED",
      (i) => {
        i.registry.projects.find((p) => p.id === "statistics-life").portfolio.certificate = true;
      },
    ],
    [
      "a mission count changed on an index page",
      "PUBLIC",
      (i) => {
        i.pages[INDEX_PAGES[0]] = i.pages[INDEX_PAGES[0]].replace(
          "<strong>30</strong> projects",
          "<strong>31</strong> projects",
        );
      },
    ],
    [
      "a project orphaned from an index page",
      "PUBLIC",
      (i) => {
        i.pages[INDEX_PAGES[1]] = i.pages[INDEX_PAGES[1]].replaceAll(
          "?project=unit-4-a",
          "?project=gone",
        );
      },
    ],
    [
      "a stale portfolio tile",
      "PUBLIC",
      (i) => {
        i.pages["math/projects/portfolio/index.html"] = i.pages[
          "math/projects/portfolio/index.html"
        ].replace('id="stat-total">30<', 'id="stat-total">23<');
      },
    ],
    [
      "a portfolio list drifting",
      "PUBLIC",
      (i) => {
        i.portfolioRoutes = new Set([...i.portfolioRoutes].slice(1));
      },
    ],
  ];
  const failures = [];
  // Judge each mutation by the NEW problems it adds, so a tree that is already
  // red cannot make a blind detector look alive.
  const before = new Set(analyze(clone()));
  for (const [name, expect, mutate] of cases) {
    const input = clone();
    mutate(input);
    const added = analyze(input).filter((f) => !before.has(f));
    if (!added.some((f) => f.startsWith(expect)))
      failures.push(
        `detector blind to: ${name} (wanted ${expect}, got ${added.length ? added[0] : "nothing"})`,
      );
  }
  return { failures, cases: cases.length };
}

/** Minimal static server over dist/ with Pages-style clean URLs. */
function serveDist(distDir) {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(distDir, p.endsWith("/") ? `${p}index.html` : p);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200);
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` }),
    ),
  );
}

async function httpProblems(registry) {
  const dist = join(ROOT, "dist");
  if (!existsSync(join(dist, "index.html")))
    return ["HTTP: dist/ is missing. Run `npm run build` first (this check serves dist/)."];
  const routes = new Set([
    ...registry.projects.flatMap((p) => [p.launchUrl, p.hubUrl].filter(Boolean)),
    ...registry.hubs.map((h) => h.route),
    ...registry.surfaces.map((s) => s.route),
    ...registry.companions.filter((c) => c.route).map((c) => c.route),
    ...registry.projects.map((p) => p.studioUrl.split("?")[0]),
  ]);
  const { server, base } = await serveDist(dist);
  const out = [];
  try {
    for (const route of [...routes].sort()) {
      const res = await fetch(base + route);
      await res.arrayBuffer();
      if (res.status !== 200) out.push(`HTTP: ${route} answered ${res.status}, expected 200`);
    }
    for (const h of registry.hubs)
      if (!isTeacherSurface(h.answerKeyRoute))
        out.push(`HTTP: ${h.answerKeyRoute} is no longer a teacher-gated surface`);
  } finally {
    server.close();
  }
  assertNonEmpty("registry routes probed over HTTP", routes, "data/project-registry.json", 40);
  return out;
}

async function gather() {
  const { PROJECTS } = await import("../curriculum/projects/studio/projects.mjs");
  const scan = await scanProjects();
  const pages = Object.fromEntries(
    [...INDEX_PAGES, "math/projects/portfolio/index.html"].map((f) => [f, read(f)]),
  );
  return {
    registry: loadRegistry(),
    baseline: JSON.parse(read("data/projects-baseline-inventory.json")),
    scan,
    missions: PROJECTS.map(({ id, title, unit, family }) => ({ id, title, unit, family })),
    pages,
    portfolioRoutes: new Set(portfolioRoutes()),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = await gather();
  assertNonEmpty("registry projects", input.registry.projects, "data/project-registry.json");
  assertNonEmpty(
    "baseline pages",
    input.baseline.pages,
    "data/projects-baseline-inventory.json",
    50,
  );
  const stRun = selfTest(input);
  const drift = treeDrift(new Map([["x", "1"]]), new Map([["x", "2"]]));
  if (drift.length !== 1)
    stRun.failures.push("generator drift detector is blind to a changed file");
  const problems = [
    ...analyze(input),
    ...(await httpProblems(input.registry)),
    ...generatorDrift(),
  ];
  for (const f of stRun.failures) console.error(`SELF-TEST FAIL ${f}`);
  if (!stRun.failures.length) console.log(`self-test: ${stRun.cases} mutations all detected`);
  const c = registryCounts(input.registry);
  console.log(
    `registry: ${c.missions} missions · ${c.projectSets} project sets · ${c.versionPages} version pages · ${c.portfolioProjects} on the portfolio · ${c.companions} companions · ${JSON.stringify(c.byClassification)}`,
  );
  if (problems.length || stRun.failures.length) {
    for (const p of problems) console.error(`FAIL ${p}`);
    console.error(
      `validate:projects-registry: ${problems.length} problem(s), ${stRun.failures.length} self-test failure(s)`,
    );
    process.exit(1);
  }
  console.log("validate:projects-registry: PASS");
}
