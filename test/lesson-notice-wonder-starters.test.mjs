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
 *
 * The opposite failure is just as bad and is what the corpus drifted into next:
 * starters that are complete observations. "I notice the route length is a mixed
 * number but each segment is a fraction" is not a sentence starter — it is the
 * noticing, done for the student, and there is nothing left to say out loud. A
 * starter hands over the opening and the grammar and stops. So every starter is
 * also held to a SHAPE contract: it opens with its frame, it is short enough to
 * read off a chip in one breath, and it ENDS in the blank the student fills.
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
  // THE STARTER CONTRACT. A starter opens the sentence and then gets out of the
  // way. Each clause below is one way the corpus has actually broken:
  //   opener   — the chip is captioned "I notice…"/"I wonder…", so a starter
  //              that opens any other way reads as a stray sentence.
  //   blank    — no ___ means nothing was left for the student.
  //   trailing — a blank in the MIDDLE lets the author finish the thought after
  //              it ("I notice the route is ___ miles but each segment is a
  //              fraction"), which is the defect wearing a blank as a disguise.
  //   length   — 12-19 words was the old median/max, and every one of those was
  //              a full explanation. Nine is the ceiling; most sit at 6-8.
  //   distinct — three identical frames in one array is one frame, not three.
  const LIMIT = 9;
  const FRAMES = { noticeStarters: "I notice", wonderStarters: "I wonder" };
  const offenders = [];
  let checked = 0;
  for (const { dir, doc } of configs) {
    for (const [key, opener] of Object.entries(FRAMES)) {
      const arr = doc.noticeAndWonder[key] || [];
      const seen = new Set();
      for (const s of arr) {
        if (typeof s !== "string") continue;
        checked += 1;
        const where = `${dir}:${key}`;
        if (!s.startsWith(opener)) offenders.push(`${where} → must open "${opener}…": "${s}"`);
        if (!s.includes("___")) offenders.push(`${where} → no ___ for the student: "${s}"`);
        else if (!/___\s*[.?!]?$/.test(s)) {
          offenders.push(`${where} → the blank must come last, not mid-sentence: "${s}"`);
        }
        const words = s.trim().split(/\s+/).length;
        if (words > LIMIT) {
          offenders.push(`${where} → ${words} words (max ${LIMIT}) — that is an explanation: "${s}"`);
        }
        if (seen.has(s)) offenders.push(`${where} → repeats "${s}"`);
        seen.add(s);
      }
    }
  }
  assert.deepEqual(offenders, [], `starters are not sentence starters:\n${offenders.join("\n")}`);
  // A sweep that silently matches nothing reports a clean corpus forever.
  assert.ok(checked > 1000, `expected the whole corpus of starters, checked only ${checked}`);
  ok(`every starter opens its frame, stays ≤${LIMIT} words, and ends in ___ (${checked} starters)`);
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

console.log(`\nlesson notice/wonder starters: ${passed}/5 checks passed`);
assert.equal(passed, 5, `expected 5 checks to run, ${passed} did`);
