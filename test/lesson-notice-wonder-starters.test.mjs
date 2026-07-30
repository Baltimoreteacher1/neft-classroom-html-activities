/* Notice & Wonder starters must be about THIS lesson.
 *
 * The chips under "What do you notice?" / "What do you wonder?" are the only
 * scaffold a student has when the image goes up. For most of the corpus they
 * were the generator defaults — "I notice that…", "I see…", "I wonder why…" —
 * which name nothing in the picture and give a struggling reader no way in.
 *
 * These checks lock the rewrite in: no lesson may fall back to the vacuous
 * phrasings, every set must be substantial and carry a fill-in blank, and no two
 * different lessons may share a set (a shared set means someone pasted generic
 * copy instead of writing about the actual image).
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = path.join(ROOT, "lessons");

// Phrasings that say nothing about any particular image. These were the corpus
// defaults; they must never come back.
const BANNED = new Set([
  "I notice that…",
  "I notice ___, so…",
  "I see…",
  "I notice…",
  "I wonder why…",
  "I wonder how…",
  "I wonder what would happen if…",
  "I wonder…",
]);

const baseId = (dir) => dir.replace(/-group\d$/, "");

const configs = [];
for (const dir of readdirSync(LESSONS)) {
  const file = path.join(LESSONS, dir, "config.json");
  try {
    if (!statSync(file).isFile()) continue;
  } catch {
    continue;
  }
  const doc = JSON.parse(readFileSync(file, "utf8"));
  if (doc && doc.noticeAndWonder) configs.push({ dir, doc });
}

let passed = 0;
const ok = (n) => {
  console.log(`  ✓ ${n}`);
  passed += 1;
};

assert.ok(configs.length > 150, `expected the whole lesson corpus, found ${configs.length}`);

{
  const offenders = [];
  for (const { dir, doc } of configs) {
    for (const key of ["noticeStarters", "wonderStarters"]) {
      for (const s of doc.noticeAndWonder[key] || []) {
        if (BANNED.has(s)) offenders.push(`${dir}:${key} → "${s}"`);
      }
    }
  }
  assert.deepEqual(offenders, [], `generic starters are back in:\n${offenders.join("\n")}`);
  ok(`no lesson uses a content-free starter (${configs.length} lessons checked)`);
}

{
  const offenders = [];
  for (const { dir, doc } of configs) {
    const nw = doc.noticeAndWonder;
    for (const key of ["noticeStarters", "wonderStarters"]) {
      const arr = nw[key];
      if (!Array.isArray(arr) || arr.length < 3) {
        offenders.push(`${dir}:${key} has ${arr ? arr.length : 0} starters`);
        continue;
      }
      for (const s of arr) {
        if (typeof s !== "string" || s.trim().length < 25) {
          offenders.push(`${dir}:${key} → too short to be about anything: "${s}"`);
        }
        if (typeof s === "string" && s.length > 130) {
          offenders.push(`${dir}:${key} → too long to read off a chip: "${s.slice(0, 40)}…"`);
        }
      }
    }
    // A notice starter is a frame, not a sentence — at least one has to leave
    // the student something to fill in.
    if (!(nw.noticeStarters || []).some((s) => s.includes("___"))) {
      offenders.push(`${dir}: no notice starter has a ___ blank`);
    }
  }
  assert.deepEqual(offenders, [], `starter shape problems:\n${offenders.join("\n")}`);
  ok("every lesson has 3+ notice and 3+ wonder starters, sized to read off a chip");
}

{
  // Variants of one lesson share an image, so they should share the starters.
  // Different lessons must not — an identical set across two lessons means the
  // copy is generic, which is exactly the bug this test exists to prevent.
  const byBase = new Map();
  for (const { dir, doc } of configs) {
    const key = (doc.noticeAndWonder.noticeStarters || []).join("|");
    const base = baseId(dir);
    if (!byBase.has(key)) byBase.set(key, new Set());
    byBase.get(key).add(base);
  }
  const shared = [...byBase.entries()]
    .filter(([, bases]) => bases.size > 1)
    .map(([key, bases]) => `${[...bases].join(", ")} share "${key.slice(0, 50)}…"`);
  assert.deepEqual(shared, [], `different lessons share one starter set:\n${shared.join("\n")}`);
  ok("no two different lessons share a notice-starter set");
}

{
  // The real property: a starter has to talk about THIS lesson. Every set must
  // share at least one meaningful word or number with the lesson's own Notice &
  // Wonder prompt, title, or vocabulary. Prose that could sit on any lesson in
  // the corpus fails here even if it isn't one of the banned phrasings.
  const STOP = new Set(
    `i notice wonder that would happen this these those what when where which about
     could there here they them their have than then with from into more most less
     some many much each every other same different look looks like just only also
     because tell tells make makes give gives find finds show shows using used
     still even both after before your yours does think really actually`.split(/\s+/),
  );
  const tokens = (s) => {
    const out = new Set();
    for (const w of String(s).toLowerCase().match(/[a-z0-9']{4,}/g) || []) {
      if (!STOP.has(w)) out.add(w);
    }
    for (const n of String(s).match(/\d+/g) || []) out.add(n);
    return out;
  };
  const offenders = [];
  for (const { dir, doc } of configs) {
    const nw = doc.noticeAndWonder;
    const anchor = tokens(
      [nw.context || "", doc.title || "", ...(doc.vocabulary || []).map((v) => v.term || "")].join(
        " ",
      ),
    );
    for (const key of ["noticeStarters", "wonderStarters"]) {
      const grounded = (nw[key] || []).some((s) => [...tokens(s)].some((t) => anchor.has(t)));
      if (!grounded) offenders.push(`${dir}:${key} says nothing about this lesson`);
    }
  }
  assert.deepEqual(offenders, [], `ungrounded starter sets:\n${offenders.join("\n")}`);
  ok("every starter set is grounded in its own lesson's prompt, title, or vocabulary");
}

console.log(`\nlesson notice/wonder starters: ${passed}/4 checks passed`);
