#!/usr/bin/env node
/**
 * ACCESS Learning Journey: inventory of existing student-facing resources, gap analysis and preservation checklist.
 *
 *   node tools/gen-journey-inventory.mjs           write docs/access-practice-lab/journey-inventory.{md,json}
 *   node tools/gen-journey-inventory.mjs --check   exit 1 when the committed report is stale (writes nothing)
 *
 * Deterministic: no clock, no randomness, sorted output. Content comes through tools/lib/access-lab-content.mjs (the
 * same reader the validator and gen-access-inventory.mjs use); the mapping comes from src/journey/resources.js, the
 * single source of truth for "which resource supports which mission step".
 */
import { deepStrictEqual } from "node:assert";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { BANDS, buildIndex, LAB_DIR, loadBand, REPO_ROOT } from "./lib/access-lab-content.mjs";
import { activityRows } from "./lib/journey-inventory-rows.mjs";
import { navPaths, routeFacts } from "./lib/journey-routes.mjs";

const OUT = join(REPO_ROOT, "docs", "access-practice-lab");
const MD = join(OUT, "journey-inventory.md");
const JSON_FILE = join(OUT, "journey-inventory.json");
const at = (rel) => import(pathToFileURL(join(LAB_DIR, rel)).href);
const WEAK_BELOW = 3; // fewer qualifying bank activities than this = "thin"

export async function build() {
  const [R, D, C] = await Promise.all([
    at("src/journey/resources.js"),
    at("src/journey/resources-data.js"),
    at("src/journey/curriculum.js"),
  ]);
  const index = buildIndex();
  const bank = BANDS.flatMap((band) =>
    loadBand(band).map((f) => ({ band, domain: f.domain, data: f.data })),
  );
  const activities = activityRows(index, bank, R, D);
  const surfaces = surfaceRows(index, R, D);
  const gaps = gapRows(index, R, C, D, activities);
  const checklist = await preservation(D);
  return {
    activities,
    surfaces,
    gaps,
    checklist,
    totals: totals(activities, surfaces, gaps, checklist),
  };
}

// ── surfaces: every studio, room, game, test and task ──────────────────────────
function surfaceRows(index, R, D) {
  const rows = [];
  const add = (x) =>
    rows.push({
      band: "both",
      klu: "all four",
      steps: [],
      mission: "",
      supports: "",
      verifies: "",
      next: "",
      ...x,
    });
  const nextOf = (steps) =>
    steps[0] ? `Journey step: ${steps[0]} (/journey/<mission>/${steps[0]})` : "";
  for (const r of D.ROUTES) {
    add({
      id: r.id,
      kind: r.kind,
      route: `/${r.path}`,
      domain: r.domain,
      klu: r.klus.join(", ") || "all four",
      objective: r.objective[0],
      steps: r.steps,
      mission: r.steps.length ? "any (by Key Language Use)" : "",
      supports: r.supports,
      verifies: r.verifies,
      next: nextOf(r.steps),
    });
  }
  for (const g of D.GAMES)
    add({
      id: g.id,
      kind: "game",
      route: `/games/${g.id}`,
      domain: g.domain,
      klu: g.klus.join(", ") || "all four",
      objective: g.objective[0],
      steps: g.steps,
      mission: "any (by Key Language Use)",
      supports: "Support mode chosen per session",
      verifies: "Transfer round in the learner's own words",
      next: nextOf(g.steps),
    });
  for (const e of D.EXTERNAL)
    add({
      id: e.id,
      kind: e.kind,
      route: e.path,
      domain: "All",
      objective: e.label[0],
      supports: "",
      verifies: "",
      next: "",
    });
  for (const p of D.PRINTABLES)
    add({
      id: p.id,
      kind: "printable",
      route: p.path.replace("/access-practice-lab", ""),
      domain: p.domain,
      objective: p.objective[0],
      steps: p.steps,
      supports: "Paper",
      verifies: "Teacher stamps the passport",
      next: "",
    });
  for (const f of readdirSync(join(LAB_DIR, "paper-passport")).sort())
    if (!D.PRINTABLES.some((p) => p.path.endsWith(f)))
      add({
        id: f.replace(/\.pdf$/, ""),
        kind: "printable",
        route: `/paper-passport/${f}`,
        domain: "All",
        objective: "Paper passport file (teacher key is teacher-gated)",
        supports: "Paper",
      });
  for (const t of index.tests) {
    const steps = ["show"];
    add({
      id: t.id,
      kind: "test",
      route: `/test/${t.id}`,
      band: t.band,
      domain: t.domain || "All four",
      objective: t.title,
      steps,
      mission: "end-of-unit checkpoint (optional)",
      supports: "Guided mode shows hints and frames; Independent Rehearsal shows none",
      verifies: "Independent Rehearsal is the on-your-own mode; never mixed into Journey scoring",
      next: "",
    });
  }
  for (const [list, base, domain] of [
    [index.studio.speaking, "speak", "Speaking"],
    [index.studio.writing, "write", "Writing"],
  ])
    for (const t of list)
      add({
        id: t.id,
        kind: "studio-task",
        route: `/${base}/${t.id}`,
        band: t.band,
        domain,
        klu: t.keyUse,
        objective: t.title,
        steps: ["communicate"],
        mission: R.missionFor(t.keyUse, `${t.title} ${t.taskType || t.form || ""}`),
        supports: "Frames, word bank, model are opt-in",
        verifies: "On my own is recorded as independent",
        next: "/journey (Improve step)",
      });
  for (const m of index.studio.missions)
    add({
      id: m.id,
      kind: "academic-mission",
      route: `/missions/${m.id}`,
      band: m.band,
      domain: "All four",
      klu: m.keyUses.join(", "),
      objective: m.summary.split(". ")[0],
      steps: ["show"],
      mission: R.missionFor(m.keyUses[0], m.title),
      supports: "Supports are opt-in",
      verifies: "Ends with a written recommendation",
      next: "",
    });
  for (const p of index.studio.patterns)
    add({
      id: p.id,
      kind: "detective-case",
      route: `/detective/${p.id}`,
      domain: "Writing",
      objective: `Find and fix: ${p.name}`,
      steps: ["build", "improve"],
      mission: "any (by language feature)",
      supports: "Hints and peek are opt-in",
      verifies: "Practice only",
    });
  return rows.sort(
    (a, b) =>
      a.kind.localeCompare(b.kind) ||
      a.route.localeCompare(b.route) ||
      a.band.localeCompare(b.band),
  );
}

// ── gap analysis ────────────────────────────────────────────────────────────────
const ENGINE = {
  discover: "scene (Living Language World)",
  understand: "listen + read (Active Listening, Reading X-Ray)",
  build: "construct (Language Construction)",
  communicate: "converse | compose",
  improve: "mirror (Growth Mirror)",
  show: "mirror, independent mode",
};
const STRUCTURAL = {
  discover:
    "No bank activity opens a mission situation or asks a first question about it; the exhibition and worlds are one-scenario and not mission-aware.",
  understand:
    "Listening and Reading items exist, but none tie the text to the mission's language feature or ask the learner to explain what the text shows.",
  build:
    "No bank activity teaches a language feature (expand, combine, connect, word parts, pronouns, discourse) before it is used; Construction Lab and Word Builder are not mission-aware.",
  communicate:
    "Studio tasks fit a Key Language Use, but none follow the mission's situation, so the partner and audience do not carry over from Discover.",
  improve:
    "Error Detective and Evidence Studio work on case files, not on the learner's own communicate response; nothing shows a before/after of one target.",
  show: "Level C and Model-Test items test skill, but none are a NEW task in the mission's language feature after revision; practice tests are whole-skill, not mission-specific.",
};

function gapRows(index, R, C, D, activities) {
  const cells = [];
  for (const band of BANDS)
    for (const id of C.MISSION_IDS)
      for (const step of D.STEP_ORDER) {
        const mapped = R.candidatesFor(id, step, band, index).filter((x) => x.score >= R.STRONG);
        const list = R.resourcesFor(id, step, band, index);
        const surfaced = list.length;
        const routes = list.filter((r) => r.kind !== "activity").length;
        const weak = [];
        if (mapped.length < WEAK_BELOW) weak.push("thin");
        if (
          step === "show" &&
          mapped.filter((x) => x.row.level === "C" && x.row.type === "constructed").length < 2
        )
          weak.push("few-transfer");
        if (["discover", "build", "improve"].includes(step)) weak.push("no-instruction");
        cells.push({
          band,
          mission: id,
          step,
          mapped: mapped.length,
          surfaced,
          routes,
          weak,
          engine: ENGINE[step],
        });
      }
  const featureGaps = [];
  for (const band of BANDS)
    for (const id of C.MISSION_IDS)
      for (const f of C.MISSIONS[id].features) {
        const hits = activities.filter(
          (a) => a.band === band && a.domain !== "Model-Test" && a.features.includes(f),
        ).length;
        if (hits < WEAK_BELOW)
          featureGaps.push({ band, mission: id, feature: f, activities: hits });
      }
  return { cells, featureGaps, structural: STRUCTURAL, threshold: WEAK_BELOW };
}

// ── preservation checklist ──────────────────────────────────────────────────────
async function preservation(D) {
  const facts = routeFacts();
  const nav = await navPaths("6-8");
  const patterns = [
    "/<Domain>/<Level>/<activity-id>  (Listening, Reading, Speaking, Writing)",
    "/Model-Test/6-8/<A|B>[/<id>]",
    "/test/<id>[?rehearsal=guided|independent]",
    "/play?ids=…&i=&t=&sid=",
    "/road[/<week>]",
    "/worlds/<world>/<mission>",
    "/reading-room/<lesson | adventure-<id> | strategy-<id>>",
    "?grades=3-5|6-8 on any URL",
  ];
  const features = [
    "Independent attempts are recorded separately from supported ones (state.js, ledger stage).",
    "No screen states a proficiency level, WIDA/ACCESS score or prediction (PLATFORM.md rules).",
    "All student work stays on the device; Passport share codes and Save and resume unchanged.",
    "Existing storage keys keep their meaning; the Journey adds `accessPracticeLab:v1:journey` only.",
    'English and Spanish only; authored task content stays English with lang="en".',
    "Practice tests are unchanged: guided mode keeps supports, independent rehearsal renders none.",
    "Teacher-assigned Journey links (`?assigned=1`) keep working and do not change other progress.",
  ];
  return {
    roots: facts.roots,
    domains: facts.domains,
    journeySub: facts.journeySub,
    nav,
    patterns,
    features,
    externals: D.EXTERNAL.map((e) => e.path),
  };
}

function totals(activities, surfaces, gaps, checklist) {
  const byBand = {};
  for (const a of activities) byBand[a.band] = (byBand[a.band] || 0) + 1;
  return {
    activities: activities.length,
    byBand,
    withKlu: activities.filter((a) => a.klu !== "none").length,
    surfaces: surfaces.length,
    cells: gaps.cells.length,
    thinCells: gaps.cells.filter((c) => c.weak.includes("thin")).length,
    fewTransferCells: gaps.cells.filter((c) => c.weak.includes("few-transfer")).length,
    featureGaps: gaps.featureGaps.length,
    preserved: checklist.roots.length + checklist.nav.length + checklist.patterns.length,
  };
}

// ── markdown ───────────────────────────────────────────────────────────────────
const esc = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
const table = (head, rows) =>
  [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.map(esc).join(" | ")} |`),
  ].join("\n");

export function markdown(inv) {
  const t = inv.totals;
  const out = [
    "# ACCESS Learning Journey: inventory of existing resources",
    "",
    "Generated by `node tools/gen-journey-inventory.mjs` (check: `--check`). Do not edit by hand. The mapping rules live in `access-practice-lab/src/journey/resources.js`;",
    "Key Language Use (KLU) for a bank activity is `inferred` from its skill text (`keyUseForSkill`) because the index carries no explicit tag.",
    "",
    "## Totals",
    "",
    `- Bank activities: ${t.activities} (${Object.entries(t.byBand)
      .map(([b, n]) => `${b}: ${n}`)
      .join(", ")}); with a Key Language Use ${t.withKlu}, without ${t.activities - t.withKlu}.`,
    `- Other surfaces (routes, games, tests, studio tasks, missions, detective cases, printables): ${t.surfaces}.`,
    `- Mission x band x step cells: ${t.cells}. Thin (fewer than ${inv.gaps.threshold} strongly matched bank activities): ${t.thinCells}. Show cells with fewer than 2 level-C constructed items: ${t.fewTransferCells}.`,
    `- Mission features with fewer than ${inv.gaps.threshold} matching activities in a band: ${t.featureGaps}.`,
    "",
    "## 1. Surfaces (studios, rooms, games, tests, tasks, printables)",
    "",
    table(
      [
        "Kind",
        "Route",
        "Band",
        "Domain",
        "KLU",
        "Objective",
        "Journey step",
        "Mission",
        "Supports",
        "Independent verification",
        "Next",
      ],
      inv.surfaces.map((s) => [
        s.kind,
        s.route,
        s.band,
        s.domain,
        s.klu || "all four",
        s.objective,
        s.steps.join(", "),
        s.mission,
        s.supports,
        s.verifies,
        s.next,
      ]),
    ),
    "",
    "## 2. Bank activities",
    "",
    "Columns: id, level (A supported, C least support), strand (category in the domain file), KLU (inferred), type, supports available, recommended mission and step, independent verification, next activity (teaching order).",
    "",
  ];
  for (const band of BANDS)
    for (const domain of [
      ...new Set(inv.activities.filter((a) => a.band === band).map((a) => a.domain)),
    ]) {
      const rows = inv.activities.filter((a) => a.band === band && a.domain === domain);
      out.push(
        `### ${band} ${domain} (${rows.length})`,
        "",
        table(
          [
            "Id",
            "Lv",
            "Strand",
            "KLU",
            "Type",
            "Objective (skill)",
            "Supports",
            "Mission / step",
            "Independent",
            "Next",
          ],
          rows.map((a) => [
            a.id,
            a.level,
            a.strand,
            a.klu,
            a.type,
            a.skill,
            a.supports,
            a.mission ? `${a.mission} / ${a.step}` : "none (test item)",
            a.verifies,
            a.next,
          ]),
        ),
        "",
      );
    }
  out.push(
    "## 3. Gap analysis",
    "",
    "Each cell is `strongly matched bank activities (score >= " +
      3 +
      ": same Key Language Use, or a mission feature in the skill text) / resources surfaced (max 4)`. `!` thin (< " +
      inv.gaps.threshold +
      "), `T` few transfer items, `I` no instruction in the bank (structural, every mission). The new journey engines fill the structural gaps: " +
      Object.entries(ENGINE)
        .map(([s, e]) => `${s} = ${e}`)
        .join("; ") +
      ".",
    "",
  );
  for (const band of BANDS) {
    const missions = [
      ...new Set(inv.gaps.cells.filter((c) => c.band === band).map((c) => c.mission)),
    ];
    out.push(
      `### Grades ${band}`,
      "",
      table(
        ["Mission", ...Object.keys(ENGINE)],
        missions.map((m) => [
          m,
          ...Object.keys(ENGINE).map((s) => {
            const c = inv.gaps.cells.find(
              (x) => x.band === band && x.mission === m && x.step === s,
            );
            return `${c.mapped}/${c.surfaced}${c.weak.includes("thin") ? " !" : ""}${c.weak.includes("few-transfer") ? " T" : ""}${c.weak.includes("no-instruction") ? " I" : ""}`;
          }),
        ]),
      ),
      "",
    );
  }
  out.push(
    "### Structural gaps (existing resources, every mission)",
    "",
    table(
      ["Step", "What is missing in existing resources", "Filled by"],
      Object.keys(ENGINE).map((s) => [s, inv.gaps.structural[s], ENGINE[s]]),
    ),
    "",
  );
  out.push(
    "### Features with weak activity coverage (missing logical connection)",
    "",
    inv.gaps.featureGaps.length
      ? table(
          ["Band", "Mission", "Feature", "Matching activities"],
          inv.gaps.featureGaps.map((g) => [g.band, g.mission, g.feature, g.activities]),
        )
      : "None.",
    "",
  );
  const c = inv.checklist;
  out.push(
    "## 4. Preservation checklist",
    "",
    "Every route and behavior below must keep working. Roots are read from `parseRoute` in `src/main.js`; nav links are rendered from `src/nav.js`.",
    "",
    "### parseRoute first segments",
    "",
    ...c.roots.map((r) => `- [ ] \`/${r}\``),
    "",
    "### Content domains",
    "",
    ...c.domains.map((r) => `- [ ] \`/${r}\``),
    "",
    "### Journey sub-routes",
    "",
    ...["", "map", "<mNN>", "<mNN>/<step>", ...c.journeySub].map(
      (r) => `- [ ] \`/journey${r ? `/${r}` : ""}\``,
    ),
    "",
    "### URL patterns that must still resolve",
    "",
    ...c.patterns.map((r) => `- [ ] \`${r}\``),
    "",
    "### Navigation links (top bar and More menu)",
    "",
    ...c.nav.map((r) => `- [ ] \`${r}\``),
    "",
    "### Behaviors",
    "",
    ...c.features.map((r) => `- [ ] ${r}`),
    "",
  );
  return out.join("\n");
}

async function main() {
  const inv = await build();
  const md = markdown(inv);
  const json = `${JSON.stringify(inv, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    let stale = [];
    if (!existsSync(MD) || readFileSync(MD, "utf8") !== md) stale.push("journey-inventory.md");
    try {
      deepStrictEqual(JSON.parse(readFileSync(JSON_FILE, "utf8")), JSON.parse(json));
    } catch {
      stale.push("journey-inventory.json");
    }
    if (stale.length) {
      console.error(
        `gen-journey-inventory: STALE ${stale.join(", ")}. Run: node tools/gen-journey-inventory.mjs`,
      );
      process.exit(1);
    }
    console.log(
      `gen-journey-inventory: up to date (${inv.totals.activities} activities, ${inv.totals.surfaces} surfaces)`,
    );
    return;
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(MD, md);
  writeFileSync(JSON_FILE, json);
  console.log(
    `gen-journey-inventory: wrote ${inv.totals.activities} activities, ${inv.totals.surfaces} surfaces, ${inv.totals.cells} cells`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
