#!/usr/bin/env node
// Builds docs/motion-manifest.json: for every unit and lesson, what the Practice, Challenge and Family surfaces
// carry today (read from the real data and pages, never typed) and what the motion work plans for them.
//   node scripts/generate-motion-manifest.mjs           write
//   node scripts/generate-motion-manifest.mjs --check   fail if the committed manifest is stale
// Status fields are held in data/motion/status.json (authored, updated as lessons are verified); everything else is derived.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const has = (p) => existsSync(join(ROOT, p));
const OUT = "docs/motion-manifest.json";

const launch = read("data/curriculum-launch-manifest.json");
const families = read("data/motion/representation-families.json");
const status = has("data/motion/status.json") ? read("data/motion/status.json") : { lessons: {} };
const labs = read("data/learning-labs.json").labs;

const familyOf = new Map();
for (const [fid, f] of Object.entries(families.families))
  for (const l of f.lessons) familyOf.set(l, fid);

const U4_DIR = {
  1: "percent-practice-studio",
  2: "4-2-practice-studio",
  3: "4-3-practice-studio",
  4: "4-4-practice-studio",
  5: "4-5-practice-studio",
};

/** Every `"viz":{"t":"..."}`, `act` kind and `gen` id an authored studio file references. */
function scanStudio(file) {
  const d = read(file);
  const acts = new Set();
  const gens = new Set();
  const viz = new Set();
  let mc = 0;
  let tagged = 0;
  let hinted = 0;
  let items = 0;
  (function walk(o) {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== "object") return;
    if (o.k === "act" && o.kind) acts.add(o.kind);
    if (o.k === "gen" && o.g) gens.add(o.g);
    if (o.viz?.t) viz.add(o.viz.t);
    if (o.k && o.k !== "gen" && o.k !== "act" && o.k !== "pool") {
      items++;
      if (Array.isArray(o.h) && o.h.length) hinted++;
    }
    if (o.k === "mc") {
      mc++;
      if (Array.isArray(o.tag) && o.tag.some(Boolean)) tagged++;
    }
    for (const v of Object.values(o)) walk(v);
  })(d);
  const bench = d.bench?.model ? `${d.bench.model.kind}:${d.bench.model.mode}` : null;
  return {
    acts: [...acts].sort(),
    gens: [...gens].sort(),
    viz: [...viz].sort(),
    bench,
    lab: d.bench?.lab ?? null,
    items,
    mc,
    tagged,
    hinted,
  };
}

function familyMeta(id) {
  const f = `data/family-homework-notes/${id}.json`;
  if (!has(f)) return null;
  const d = read(f);
  return { topicKey: d.v3?.topicKey ?? null, modelKind: d.v3?.model?.kind ?? null };
}

const PERSIST = {
  standard:
    "StudioStore key neft_studio_<lesson>_<mode>_v2 (schema 2, versioned migration in assets/studio/store.js)",
  challenge: "StudioStore key neft_studio_<lesson>_challenge_v2 (same schema)",
  family:
    "hw_* localStorage keys per homework page (scripts/lib/homework-flow-js.mjs); route and language saved per device",
};

const lessons = launch.lessons.map((l) => {
  const id = l.id;
  const u4 = l.unit === 4;
  const studioFile = has(`data/practice-studio/${id}.json`)
    ? `data/practice-studio/${id}.json`
    : has(`data/practice-studio-u4/${id}.json`)
      ? `data/practice-studio-u4/${id}.json`
      : null;
  const stdRoute = u4 ? `/math/unit-4/${U4_DIR[l.lesson]}/` : `/math/practice-studio/${id}/`;
  const chRoute = u4
    ? `/math/unit-4/${U4_DIR[l.lesson]}-challenging/`
    : `/math/practice-studio/${id}/challenge/`;
  const stdOn = has(stdRoute.slice(1) + "index.html");
  const chOn = has(`${chRoute.slice(1)}index.html`);
  const scan = studioFile && !u4 ? scanStudio(studioFile) : null;
  const fam = familyOf.get(id) ?? "unassigned";
  const famDef = families.families[fam];
  const labEntry = labs.find((x) => x.lessons.includes(id));
  const st = status.lessons[id] ?? {};
  const fm = familyMeta(id);
  return {
    id,
    unit: l.unit,
    lesson: l.lesson,
    title: l.title,
    objective: l.objective,
    standard: l.standard,
    pathways: {
      standard: { route: stdRoute, exists: stdOn },
      challenge: { route: chRoute, exists: chOn },
      advanced: {
        route: null,
        exists: false,
        note: "No route named Advanced exists. Nearest: small-group Group 2 (Challenge) at /lessons/<id>-group2/.",
      },
      family: { route: `/lessons/${id}/homework.html`, exists: has(`lessons/${id}/homework.html`) },
    },
    currentVisualization: {
      lab: labEntry ? { id: labEntry.id, model: `${labEntry.model}:${labEntry.mode}` } : null,
      practiceStudio: scan
        ? { bench: scan.bench, activities: scan.acts, generators: scan.gens, figures: scan.viz }
        : u4
          ? { note: "hand-built Unit 4 studio pages (data/practice-studio-u4)" }
          : null,
      family: fm,
    },
    feedbackMechanism: scan
      ? {
          multipleChoiceItems: scan.mc,
          withNamedMisconceptionTags: scan.tagged,
          itemsWithHintLadder: scan.hinted,
          itemsAuthored: scan.items,
          contract:
            "wrong choice explains the mistake; the answer is never printed (docs/specs/practice-studio-v2.md)",
        }
      : {
          contract: u4
            ? "U4Studio.miss(): tags[] and one bilingual help line per wrong choice"
            : "none",
        },
    persistence: {
      standard: PERSIST.standard,
      challenge: PERSIST.challenge,
      family: PERSIST.family,
    },
    representationFamily: fam,
    plannedEnhancement: famDef?.planned ?? "unassigned",
    implementationStatus:
      st.implementation ?? (famDef?.status === "n/a" ? "not-applicable" : "not-started"),
    verificationStatus:
      st.verification ?? (famDef?.status === "n/a" ? "not-applicable" : "unverified"),
    surfacesUpgraded: st.surfaces ?? [],
  };
});

const units = [...new Set(lessons.map((l) => l.unit))].map((u) => ({
  unit: u,
  lessons: lessons.filter((l) => l.unit === u).map((l) => l.id),
}));
const tally = (key) => lessons.reduce((a, l) => ((a[l[key]] = (a[l[key]] || 0) + 1), a), {});
const manifest = {
  schemaVersion: 1,
  generatedBy: "scripts/generate-motion-manifest.mjs",
  sources: [
    "data/curriculum-launch-manifest.json",
    "data/practice-studio/*.json",
    "data/practice-studio-u4/*.json",
    "data/learning-labs.json",
    "data/family-homework-notes/*.json",
    "data/motion/representation-families.json",
    "data/motion/status.json",
  ],
  summary: {
    lessons: lessons.length,
    implementation: tally("implementationStatus"),
    verification: tally("verificationStatus"),
    byFamily: tally("representationFamily"),
  },
  flags: families.flags,
  units,
  lessons,
};
const text = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const cur = has(OUT) ? readFileSync(join(ROOT, OUT), "utf8") : "";
  if (cur !== text) {
    console.error(`FAIL ${OUT} is stale: run node scripts/generate-motion-manifest.mjs`);
    process.exit(1);
  }
  console.log(`PASS ${OUT} is fresh (${lessons.length} lessons)`);
} else {
  writeFileSync(join(ROOT, OUT), text);
  console.log(`wrote ${OUT}: ${lessons.length} lessons`, manifest.summary.implementation);
}
