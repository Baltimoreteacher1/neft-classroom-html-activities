#!/usr/bin/env node
/*!
 * tools/validate-level3.mjs — structural gate for Level 3 · Adaptive Small Group.
 *
 * Self-tests its own detectors first, because a gate that silently stops firing
 * reports a clean feature. Then it asserts, over the shipped config:
 *
 *   - the committed data/level3-adaptive.json is in sync with the authoring
 *     source (a stale build would ship yesterday's items),
 *   - no plaintext answer reaches the student bundle,
 *   - every configured lesson id exists on disk and pins THAT lesson's own
 *     learning target and standard,
 *   - the launch link is only offered for lessons that are actually configured,
 *   - the workspace route and its module exist and reference each other.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = path.join(ROOT, "data", "level3-adaptive.json");

let failures = 0;
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failures += 1;
};
const pass = (msg) => console.log(`  ✓ ${msg}`);

/* ── detector self-test ─────────────────────────────────────────────────────── */
const looksHashed = (item) => {
  const hashes = (item.answer && item.answer.hashes) || [];
  if (!hashes.length && item.kind !== "explanation") return false;
  return hashes.every((h) => /^[0-9a-f]{64}$/.test(h));
};
{
  let selfOk = 0;
  const good = { kind: "response", answer: { hashes: ["a".repeat(64)] } };
  const bare = { kind: "response", answer: { hashes: ["3:5"] } };
  const none = { kind: "response", answer: { hashes: [] } };
  if (looksHashed(good)) selfOk += 1;
  if (!looksHashed(bare)) selfOk += 1;
  if (!looksHashed(none)) selfOk += 1;
  if (selfOk !== 3) {
    console.error("✗ validate:level3 self-test FAILED — the detector is not working");
    process.exit(1);
  }
  console.log("level3 gate self-test: 3/3 detectors firing");
}

/* ── the config must exist and be current ───────────────────────────────────── */
if (!existsSync(CONFIG_PATH)) {
  console.error("✗ data/level3-adaptive.json is missing — run: node tools/build-level3-config.mjs");
  process.exit(1);
}
try {
  execFileSync("node", [path.join(ROOT, "tools", "build-level3-config.mjs"), "--check"], {
    stdio: "pipe",
  });
  pass("shipped config is in sync with tools/level3-source.mjs");
} catch (err) {
  fail(`shipped config is stale — run: node tools/build-level3-config.mjs (${err.status})`);
}

const doc = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
const lessons = Object.entries(doc.lessons || {});
if (!lessons.length) fail("no lessons configured — the gate would pass vacuously");

/* ── per-lesson contracts ───────────────────────────────────────────────────── */
let itemCount = 0;
for (const [id, lesson] of lessons) {
  const lessonConfig = path.join(ROOT, "lessons", id, "config.json");
  if (!existsSync(lessonConfig)) {
    fail(`${id}: configured for Level 3 but lessons/${id}/config.json does not exist`);
    continue;
  }
  const src = JSON.parse(readFileSync(lessonConfig, "utf8"));
  if (lesson.standard !== src.standard) {
    fail(`${id}: standard "${lesson.standard}" != lesson standard "${src.standard}"`);
  }
  if (lesson.learningTarget !== (src.contentObjective || "")) {
    fail(`${id}: learning target drifted from the lesson's contentObjective`);
  }
  if (!lesson.diagnostic || lesson.diagnostic.length < 1 || lesson.diagnostic.length > 3) {
    fail(`${id}: diagnostic must be 1-3 tasks, found ${(lesson.diagnostic || []).length}`);
  }
  if ((lesson.representations || []).length < 2) {
    fail(`${id}: needs 2+ representations so the runtime has something to switch to`);
  }
  if (!(lesson.transfer || []).length) fail(`${id}: no transfer task — support could never fade`);

  const items = [
    ...(lesson.diagnostic || []),
    ...(lesson.bank || []),
    ...(lesson.transfer || []),
    ...(lesson.prerequisites || []).flatMap((p) => p.bridge || []),
  ];
  const seen = new Set();
  for (const item of items) {
    itemCount += 1;
    if (seen.has(item.id)) fail(`${id}: duplicate item id ${item.id}`);
    seen.add(item.id);
    if (!looksHashed(item)) fail(`${id}: item ${item.id} does not carry SHA-256 answer digests`);
    if ((item.hints || []).length !== 5) {
      fail(`${id}: item ${item.id} has ${(item.hints || []).length} hint rungs, expected 5`);
    }
    for (const d of item.distractors || []) {
      if (!d.misconception) fail(`${id}: item ${item.id} has an untagged distractor`);
      const known = (lesson.misconceptions || []).some((m) => m.id === d.misconception);
      const anyItem = items.some((i) => (i.targets || []).includes(d.misconception));
      if (!known && !anyItem) {
        fail(`${id}: item ${item.id} tags unknown misconception "${d.misconception}"`);
      }
    }
    if (item.representation) {
      const ok = (lesson.representations || []).some((r) => r.id === item.representation);
      if (!ok)
        fail(
          `${id}: item ${item.id} uses representation "${item.representation}" that the lesson does not offer`,
        );
    }
  }
}
if (!failures) pass(`${lessons.length} lessons, ${itemCount} items — rigor pinned, answers hashed`);

/* ── no plaintext answers in anything a student can fetch ───────────────────── */
{
  const raw = readFileSync(CONFIG_PATH, "utf8");
  if (/"answers"\s*:/.test(raw)) fail("shipped config contains an `answers` array");
  else pass("shipped config exposes no answer key");
}

/* ── route + module wiring ──────────────────────────────────────────────────── */
{
  const page = path.join(ROOT, "small-group-level-3", "index.html");
  const mod = path.join(ROOT, "assets", "level3", "workspace.js");
  const launcher = path.join(ROOT, "engine", "core", "level3-launch.js");
  if (!existsSync(page)) fail("small-group-level-3/index.html is missing");
  if (!existsSync(mod)) fail("assets/level3/workspace.js is missing");
  if (!existsSync(launcher)) fail("engine/core/level3-launch.js is missing");
  if (existsSync(page) && existsSync(mod)) {
    const html = readFileSync(page, "utf8");
    if (!html.includes("/assets/level3/workspace.js"))
      fail("workspace page does not load workspace.js");
    if (!/<html[^>]*lang=/.test(html)) fail("workspace page has no lang attribute");
    if (!html.includes('id="l3-learning-target"'))
      fail("workspace page never shows the learning target");
  }
  if (existsSync(launcher)) {
    const js = readFileSync(launcher, "utf8");
    if (!js.includes("isTeacherMode")) fail("launch link is not gated behind Teacher Mode");
    if (!js.includes("ids.has(config.lessonId)")) {
      fail("launch link is not gated behind a validated configuration");
    }
  }
  const renderer = readFileSync(path.join(ROOT, "engine", "core", "lesson-renderer.js"), "utf8");
  if (!renderer.includes("mountLevel3Launch")) fail("the renderer never mounts the launch link");
  if (!failures) pass("workspace route, module, and teacher-gated launch link are wired");
}

if (failures) {
  console.error(`\n✗ validate:level3 — ${failures} problem(s)`);
  process.exit(1);
}
console.log(
  `\n✓ validate:level3 — ${lessons.length} adaptive lessons, ${itemCount} items, all contracts hold`,
);
