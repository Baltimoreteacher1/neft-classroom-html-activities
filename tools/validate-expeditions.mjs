#!/usr/bin/env node
/**
 * validate-expeditions — every skill-game expedition is complete, bilingual and
 * mapped to lessons that really teach its skills.
 *
 * Each game in math/games/<slug>/ may register an expedition with the shared engine
 * (math/games/shared/expedition-engine.js) from its own expedition*.js files. This
 * gate loads those files exactly as the page orders them, inside jsdom, with a stub
 * engine that captures the definition, and checks:
 *
 *   STRUCTURE   ≥ 3 chapters of ≥ 3 missions; unique mission ids; every mission's type has
 *               a builder function and its skill exists; the LAST mission of each chapter is
 *               the chapter's mastery check and the only one; ≥ 3 distinct builder types.
 *   BILINGUAL   every {en, es} object in the definition has both, non-empty, and they differ
 *               unless the text is language-neutral (numbers, symbols, proper names).
 *   CURRICULUM  every skill names a standard; every lesson id it cites exists in
 *               data/curriculum-launch-manifest.json and that lesson's standard is one the
 *               skill names (6.AT.3 covers 6.AT.3a). This is the failure the games already
 *               shipped: labels citing lessons from other units because a folder said "u1".
 *   WIRING      the page loads the engine before the game's expedition files.
 *
 * Detectors self-test against known-bad fixtures before the sweep, and a sweep that finds
 * zero expeditions FAILS. Usage: node tools/validate-expeditions.mjs
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const GAMES = join(ROOT, "math/games");
const manifest = JSON.parse(
  readFileSync(join(ROOT, "data/curriculum-launch-manifest.json"), "utf8"),
);
const LESSON_STANDARD = new Map(manifest.lessons.map((l) => [l.id, String(l.standard || "")]));

// ── detectors (pure: def in, findings out) ─────────────────────────────────
const isBi = (v) => v && typeof v === "object" && ("en" in v || "es" in v) && !Array.isArray(v);
const NEUTRAL = /^[\s\d.,:;+\-−×÷=()/%★☆✓→←↑↓<>≤≥·?!'"]*$/;

export function bilingualFindings(def) {
  const out = [];
  const seen = new WeakSet();
  const walk = (v, path) => {
    if (!v || typeof v !== "object" || seen.has(v)) return;
    seen.add(v);
    if (isBi(v)) {
      const en = typeof v.en === "string" ? v.en.trim() : "";
      const es = typeof v.es === "string" ? v.es.trim() : "";
      if (!en) out.push(`${path}: missing English`);
      if (!es) out.push(`${path}: missing Spanish`);
      // Identical text is fine for numbers/symbols and for short labels (names, "Pump A").
      if (en && es && en === es && !NEUTRAL.test(en) && en.split(/\s+/).length > 2)
        out.push(`${path}: Spanish identical to English ("${en.slice(0, 40)}")`);
    }
    for (const [k, child] of Object.entries(v)) {
      if (typeof child === "function") continue;
      walk(child, path ? `${path}.${k}` : k);
    }
  };
  walk(
    {
      title: def.title,
      skills: def.skills,
      misconceptions: def.misconceptions,
      chapters: def.chapters,
    },
    "",
  );
  return out;
}

export function structureFindings(def) {
  const out = [];
  if (!isBi(def.title)) out.push("title must be {en, es}");
  if (!/^#[0-9a-f]{6}$/i.test(String(def.accent || ""))) out.push("accent must be #rrggbb");
  if (typeof def.paint !== "function") out.push("paint(scene, kit, ctx) is required");
  const chapters = Array.isArray(def.chapters) ? def.chapters : [];
  if (chapters.length < 3) out.push(`needs ≥ 3 chapters (has ${chapters.length})`);
  const ids = new Set();
  const types = new Set();
  chapters.forEach((ch, ci) => {
    const ms = Array.isArray(ch.missions) ? ch.missions : [];
    if (ms.length < 3) out.push(`chapter ${ci + 1}: needs ≥ 3 missions (has ${ms.length})`);
    if (!isBi(ch.name) || !isBi(ch.landmark))
      out.push(`chapter ${ci + 1}: name and landmark must be {en, es}`);
    const mastery = ms.map((m, i) => (m.mastery ? i : -1)).filter((i) => i >= 0);
    if (mastery.length !== 1 || mastery[0] !== ms.length - 1)
      out.push(`chapter ${ci + 1}: the last mission, and only it, must be the mastery check`);
    ms.forEach((m) => {
      if (ids.has(m.id)) out.push(`duplicate mission id ${m.id}`);
      ids.add(m.id);
      types.add(m.type);
      if (typeof def.builders?.[m.type] !== "function")
        out.push(`mission ${m.id}: no builder for type "${m.type}"`);
      if (!def.skills?.[m.skill]) out.push(`mission ${m.id}: unknown skill "${m.skill}"`);
      if (!isBi(m.name) || !isBi(m.brief))
        out.push(`mission ${m.id}: name and brief must be {en, es}`);
    });
  });
  if (types.size < 3) out.push(`needs ≥ 3 distinct mission mechanics (has ${types.size})`);
  return out;
}

/** "6.AT.1 / 6.AT.3a" covers lesson standard "6.AT.3a"; "6.AT.3" covers "6.AT.3c". */
export function covers(skillStandard, lessonStandard) {
  const codes = String(skillStandard)
    .split(/[\s/,;]+|–/)
    .map((c) => c.trim())
    .filter(Boolean);
  const want = String(lessonStandard).trim();
  return codes.some(
    (c) => want === c || (want.startsWith(c) && /^[a-z]$/.test(want.slice(c.length))),
  );
}

export function curriculumFindings(def) {
  const out = [];
  for (const [id, s] of Object.entries(def.skills || {})) {
    if (!s.standard) {
      out.push(`skill ${id}: no standard`);
      continue;
    }
    const lessons = String(s.lessons || "")
      .split(/[,\s]+/)
      .filter(Boolean);
    if (!lessons.length) out.push(`skill ${id}: no lessons (cite the manifest lesson ids)`);
    for (const l of lessons) {
      if (!LESSON_STANDARD.has(l))
        out.push(`skill ${id}: lesson ${l} is not in the curriculum manifest`);
      else if (!covers(s.standard, LESSON_STANDARD.get(l)))
        out.push(`skill ${id}: lesson ${l} teaches ${LESSON_STANDARD.get(l)}, not ${s.standard}`);
    }
  }
  return out;
}

// ── loading a game's expedition the way its page does ──────────────────────
function expeditionScripts(slug) {
  const html = readFileSync(join(GAMES, slug, "index.html"), "utf8");
  const srcs = [...html.matchAll(/<script[^>]+src="([^"?]+)(?:\?[^"]*)?"/g)].map((m) => m[1]);
  const engineAt = srcs.indexOf("/math/games/shared/expedition-engine.js");
  const own = srcs
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.startsWith(`/math/games/${slug}/expedition`) && s.endsWith(".js"));
  return { html, engineAt, own };
}

function captureDef(slug, html, files) {
  const dom = new JSDOM(`<!doctype html><body></body>`, {
    url: `http://localhost/math/games/${slug}/`,
    runScripts: "outside-only",
  });
  const w = dom.window;
  let captured = null;
  w.EWLExpedition = {
    W: 820,
    H: 600,
    register: (_game, def) => (captured = def),
    mountStandalone: (_host, def) => (captured = def),
    t: (v) => (typeof v === "string" ? v : (v?.en ?? "")),
    lang: () => "en",
    setLang() {},
    rng: () => ({ next: () => 0.5, int: (a) => a, pick: (a) => a[0], shuffle: (a) => a.slice() }),
    audio: { sfx: {} },
    load: () => ({}),
    readIndex: () => ({}),
    achievements: {},
    _internals: {
      chapterDone: () => false,
      restoredFraction: () => 0,
      allMissions: () => [],
      unlocked: () => true,
    },
  };
  // Game handles (const xxGame = new Phaser.Game) as stand-ins.
  for (const m of html.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*new Phaser\.Game/g)) w[m[1]] = {};
  w.Phaser = { Game: function () {}, Math: {}, Scale: {}, BlendModes: {}, Curves: {}, Display: {} };
  for (const f of files) w.eval(readFileSync(join(ROOT, f.s.replace(/^\//, "")), "utf8"));
  dom.window.close();
  return captured;
}

// ── self-tests ─────────────────────────────────────────────────────────────
function selfTest() {
  const bi = (en, es = en + " (es)") => ({ en, es });
  const mission = (id, type, mastery) => ({
    id,
    type,
    skill: "s",
    name: bi("M " + id),
    brief: bi("B " + id),
    ...(mastery ? { mastery: true } : {}),
  });
  const good = {
    title: bi("World"),
    accent: "#a8ef93",
    paint() {},
    builders: { a() {}, b() {}, c() {} },
    skills: { s: { ...bi("Skill"), standard: "6.AT.3", lessons: "3-3, 3-5" } },
    misconceptions: { add: bi("Adding") },
    chapters: [0, 1, 2].map((c) => ({
      name: bi("C" + c),
      landmark: bi("the place " + c),
      missions: [mission(c + "a", "a"), mission(c + "b", "b"), mission(c + "c", "c", true)],
    })),
  };
  const cases = [
    [
      "good definition passes",
      () =>
        [...structureFindings(good), ...bilingualFindings(good), ...curriculumFindings(good)]
          .length === 0,
    ],
    [
      "missing Spanish is caught",
      () => bilingualFindings({ ...good, title: { en: "World", es: "" } }).length === 1,
    ],
    [
      "English copied into Spanish is caught",
      () =>
        bilingualFindings({ ...good, title: { en: "Restore the grid", es: "Restore the grid" } })
          .length === 1,
    ],
    [
      "numbers-only text may match",
      () => bilingualFindings({ ...good, title: { en: "3 : 4", es: "3 : 4" } }).length === 0,
    ],
    [
      "mastery not last is caught",
      () =>
        structureFindings({
          ...good,
          chapters: [
            {
              ...good.chapters[0],
              missions: [mission("x", "a", true), mission("y", "b"), mission("z", "c")],
            },
            good.chapters[1],
            good.chapters[2],
          ],
        }).some((f) => /mastery/.test(f)),
    ],
    [
      "unknown builder type is caught",
      () =>
        structureFindings({ ...good, builders: { a() {}, b() {} } }).some((f) =>
          /no builder/.test(f),
        ),
    ],
    [
      "lesson from another standard is caught",
      () =>
        curriculumFindings({
          ...good,
          skills: { s: { ...bi("S"), standard: "6.NOS.3", lessons: "6-5" } },
        }).length === 1,
    ],
    [
      "unknown lesson id is caught",
      () =>
        curriculumFindings({
          ...good,
          skills: { s: { ...bi("S"), standard: "6.AT.3", lessons: "3-99" } },
        }).length === 1,
    ],
    [
      "sub-standard is covered by its parent",
      () =>
        covers("6.AT.3", "6.AT.3a") &&
        covers("6.AT.1 / 6.AT.3a", "6.AT.3a") &&
        !covers("6.AT.3", "6.AT.4"),
    ],
  ];
  const failed = cases.filter(([, fn]) => !fn()).map(([name]) => name);
  if (failed.length) {
    console.error("validate-expeditions: SELF-TEST FAILED — " + failed.join("; "));
    process.exit(1);
  }
  return cases.length;
}

// ── sweep ──────────────────────────────────────────────────────────────────
const selfTests = selfTest();
const slugs = readdirSync(GAMES, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(GAMES, d.name, "index.html")))
  .map((d) => d.name)
  .filter((slug) => expeditionScripts(slug).own.length > 0)
  .sort();
if (!slugs.length) {
  console.error(
    "validate-expeditions: FAIL — found no game with an expedition; the sweep checked nothing.",
  );
  process.exit(1);
}
let failures = 0;
const summary = [];
for (const slug of slugs) {
  const { html, engineAt, own } = expeditionScripts(slug);
  const findings = [];
  if (engineAt < 0) findings.push("page does not load /math/games/shared/expedition-engine.js");
  else if (own.some(({ i }) => i < engineAt))
    findings.push("an expedition file loads before the engine");
  let def = null;
  try {
    def = captureDef(slug, html, own);
  } catch (e) {
    findings.push("loading the expedition files threw: " + e.message);
  }
  if (!def && !findings.length) findings.push("no expedition was registered");
  if (def)
    findings.push(...structureFindings(def), ...bilingualFindings(def), ...curriculumFindings(def));
  const missions = def ? def.chapters.reduce((n, c) => n + c.missions.length, 0) : 0;
  summary.push(
    `${slug}: ${def ? `${def.chapters.length} chapters, ${missions} missions, ${new Set(def.chapters.flatMap((c) => c.missions.map((m) => m.type))).size} mechanics` : "—"}`,
  );
  if (findings.length) {
    failures += findings.length;
    console.error(`FAIL ${slug}`);
    for (const f of findings) console.error("  - " + f);
  }
}
if (failures) {
  console.error(
    `validate-expeditions: FAIL — ${failures} finding(s) across ${slugs.length} expedition(s).`,
  );
  process.exit(1);
}
console.log(summary.map((s) => "  " + s).join("\n"));
console.log(
  `validate-expeditions: ${slugs.length} expedition(s) complete, bilingual and mapped to their lessons (${selfTests} self-tests).`,
);
