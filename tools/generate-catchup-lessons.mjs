#!/usr/bin/env node
// Generate catch-up lessons: one per band of 3-4 lessons per unit.
// Clone the band's LAST lesson config as structural base (renderer requires all
// 5 phase sections), replace content: Big Ideas conceptIntro, merged vocab,
// mixed practice sampled from every band lesson, middle lesson's exit ticket.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeGenerated } from "../scripts/lib/preserve-injected.mjs";
import { LESSON_JS, shellHtml } from "./lib/compact-shell.mjs";
import { buildParallelPractice } from "./lib/small-group-parallel-practice.mjs";

// Order items so the compact renderer's rich interactions come first.
const RICH = new Set(["multiple-choice", "error-analysis", "open-response"]);
const preferRich = (arr) =>
  [...(arr || [])].sort((x, y) => (RICH.has(y.type) ? 1 : 0) - (RICH.has(x.type) ? 1 : 0));

const ROOT = process.env.REPO || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const DRY = process.argv.includes("--dry");

const BASE_RE = /^(\d+)-(\d+)$/;
const byUnit = new Map();
for (const d of readdirSync(LESSONS)) {
  const m = d.match(BASE_RE);
  if (!m || !existsSync(join(LESSONS, d, "config.json"))) continue;
  const u = +m[1];
  if (!byUnit.has(u)) byUnit.set(u, []);
  byUnit.get(u).push(+m[2]);
}

const bands = [];
for (const [u, lessons] of [...byUnit.entries()].sort((a, b) => a[0] - b[0])) {
  lessons.sort((a, b) => a - b);
  bands.push({ unit: u, lessons: lessons.slice(0, 3) });
  bands.push({ unit: u, lessons: lessons.slice(3) });
}

const cfg = (id) => JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
const dots = (u, n) => `${u}.${n}`;

// Prefix a practice item's student-facing lead field with its source lesson tag.
function tagItem(item, tag) {
  const it = JSON.parse(JSON.stringify(item));
  const p = `(Lesson ${tag}) `;
  if (it.stem) it.stem = p + it.stem;
  else if (it.instructions) it.instructions = p + it.instructions;
  else if (it.label) it.label = p + it.label;
  else if (it.prompt) it.prompt = p + it.prompt;
  else if (it.title) it.title = p + it.title;
  else it.title = `${p}Review problem`;
  return it;
}

const rows = [];
// What regeneration carried forward rather than dropping — reported at the end,
// because a preservation step that works silently looks exactly like one that
// has stopped running.
const preserved = [];
for (const band of bands) {
  const { unit: u, lessons } = band;
  const first = lessons[0];
  const last = lessons[lessons.length - 1];
  const id = `${u}-${last}-catchup`;
  const range = `${dots(u, first)}–${dots(u, last)}`;
  const srcs = lessons.map((n) => ({ n, c: cfg(`${u}-${n}`) }));
  const base = JSON.parse(JSON.stringify(srcs[srcs.length - 1].c));
  const mid = srcs[Math.floor((srcs.length - 1) / 2)];

  const titles = srcs.map((s) => `${dots(u, s.n)} ${s.c.title}`).join(", ");
  const keyIdeaOf = (s) => s.c.launch?.conceptIntro?.keyIdea || s.c.contentObjective || s.c.title;

  const out = base;
  out.lessonId = id;
  out.variant = "catchup";
  out.title = `${range} Catch-Up`;
  out.themeEmoji = "\u{1F9ED}";
  out.timeEstimate = "~20 min";
  out.readiness = false;
  delete out.googleForms;
  delete out.printables;
  delete out.graphicNovel;
  delete out.familyNotes;
  delete out.flagship;
  // Compact review only — strip discovery scaffolding (no notice/wonder, no
  // turn & talk). The reveal word problem STAYS: the compact renderer's Apply
  // Lab turns it into the Polya workbench, giving catch-ups an apply phase.
  // `base` is a clone of the band's last lesson, so this is that parent's
  // authored problem — on-topic for the band it reviews.
  delete out.noticeAndWonder;
  delete out.turnAndTalk;
  if (out.launch) {
    delete out.launch.beCurious;
    delete out.launch.noticePrompts;
    delete out.launch.wonderPrompts;
    delete out.launch.contextImage;
    delete out.launch.visual;
  }

  out.contentObjective = `I can show I am caught up on Lessons ${range} by using each lesson's big idea in mixed practice.`;
  out.languageObjective = `I can explain which lesson's big idea I used and how, using key vocabulary from Lessons ${range}.`;

  // Merged vocab: top terms per lesson, deduped.
  const seen = new Set();
  out.vocabulary = [];
  for (const s of srcs) {
    for (const v of s.c.vocabulary || []) {
      const k = v.term ? v.term.toLowerCase() : "";
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.vocabulary.push(v);
      if (out.vocabulary.length >= 8) break;
    }
  }

  /* Regeneration must never DELETE vocabulary that is already published.
   *
   * The committed catch-ups carry more terms than this rule produces — 56 of
   * them across the 20 stations, e.g. 5-3-catchup lost Parallelogram, Parallel,
   * Base 1 (b1), Height and Perpendicular. They were curated past what the
   * generator emits, so a plain re-run to propagate an unrelated base-lesson
   * change silently stripped them (found 2026-08-04, reverted before shipping).
   *
   * Raising the "top 2" cap does not fix it: even at 8 terms per lesson one
   * term is still lost, and catch-up lists balloon to 24 entries, which is a
   * worse review station than the curated 5–13. So the cap stays, and anything
   * already on disk is carried forward instead. A term is only ever removed by
   * deliberately editing the config.
   */
  const priorPath = join(LESSONS, id, "config.json");
  if (existsSync(priorPath)) {
    let carried = 0;
    for (const v of JSON.parse(readFileSync(priorPath, "utf8")).vocabulary || []) {
      const k = String(v.term || "").toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.vocabulary.push(v);
      carried++;
    }
    if (carried) preserved.push(`${id}: kept ${carried} curated term(s)`);
  }

  out.launch.badge = "Catch-Up Station";
  out.launch.narrative = `Missed a lesson — or just want a refresher? This catch-up station reviews Lessons ${range}: ${titles}. Read the Big Ideas, warm up with the review problem, then prove you're caught up in the mixed practice.`;
  out.launch.conceptIntro = {
    heading: `The Big Ideas — Lessons ${range}`,
    intro:
      "Here is the one thing to remember from each lesson, plus a quick guided example. If one of these feels shaky, that lesson is right above this one in the menu — you can open it any time.",
    keyIdea: srcs.map((s) => `${dots(u, s.n)}: ${keyIdeaOf(s)}`).join(" • "),
    iDo: {
      title: "The Big Ideas (one per lesson)",
      lines: srcs.map((s) => `Lesson ${dots(u, s.n)} — ${s.c.title}: ${keyIdeaOf(s)}`),
    },
    weDo: {
      title: "Quick guided checks — one from each lesson",
      lines: srcs
        .map((s) => {
          const l = s.c.launch?.conceptIntro?.weDo?.lines?.[0];
          return l ? `From ${dots(u, s.n)}: ${l}` : null;
        })
        .filter(Boolean),
    },
    youDo: {
      title: "Show you're caught up",
      lines: [
        `The practice below mixes problems from Lessons ${range}. Each problem is tagged with its lesson number.`,
        "Stuck on one lesson's problems? Open that lesson from the curriculum menu for the full re-teach.",
      ],
    },
  };

  const sample = (tier, per) =>
    srcs.flatMap((s) =>
      preferRich(s.c.practice?.[tier] || [])
        .slice(0, per)
        .map((it) => tagItem(it, dots(u, s.n))),
    );
  out.practice.approaching = sample("approaching", 2);
  out.practice.onLevel = sample("onLevel", 2);
  out.practice.extending = sample("extending", 1);
  out.practice.optional = sample("optional", 1);
  out.practice.optionalActivity = {
    name: "Catch-Up Challenge",
    emoji: "\u{1F9ED}",
    intro:
      "Mix it up: pick the right lesson's big idea for each problem — that's the real catch-up skill.",
    stepLabel: "Review",
  };

  // Parallel practice: 12 typed-in guided problems (same contract as the
  // small-group lessons) drawn evenly from each band lesson's support-level
  // builder, in band order. A lesson with no builder just yields its share to
  // the remaining lessons — the total is always exactly 12.
  const parallelSources = [];
  for (const s of srcs) {
    try {
      // A lesson whose practice was authored against its own objective has no
      // generated guided-fill family (see small-group-authored-banks.mjs). A
      // catch-up reviewing it simply draws its spiral items from the OTHER
      // lessons in the range rather than crashing on a null bank.
      const items = buildParallelPractice(s.c, `${u}-${s.n}`, 1);
      if (items) parallelSources.push({ n: s.n, items });
    } catch {
      // No parallel-practice builder for this lesson; skip it.
    }
  }
  if (!parallelSources.length) throw new Error(`${id}: no parallel-practice builders in band`);
  const per = Math.floor(12 / parallelSources.length);
  const rem = 12 % parallelSources.length;
  out.parallelPractice = parallelSources.flatMap((src, i) =>
    src.items.slice(0, per + (i < rem ? 1 : 0)).map((it) => tagItem(it, dots(u, src.n))),
  );
  out.parallelPractice.forEach((it, i) => {
    it.id = `${id}-parallel-${String(i + 1).padStart(2, "0")}`;
  });

  if (mid.c.reflect?.exitTicket) {
    out.reflect = JSON.parse(JSON.stringify(mid.c.reflect));
    out.reflect.exitTicket.stem = `(Catch-up check, from Lesson ${dots(u, mid.n)}) ${out.reflect.exitTicket.stem}`;
  }

  // Sanity: every tier non-empty, all 5 phases present.
  for (const k of ["launch", "explore", "practice", "connect", "reflect"])
    if (!out[k]) throw new Error(`${id}: missing phase ${k}`);
  for (const t of ["approaching", "onLevel", "extending"])
    if (!out.practice[t].length) throw new Error(`${id}: empty tier ${t}`);
  if (out.vocabulary.length < 3) throw new Error(`${id}: thin vocab`);
  if (out.parallelPractice.length !== 12)
    throw new Error(`${id}: expected 12 parallel items, got ${out.parallelPractice.length}`);
  if (new Set(out.parallelPractice.map((it) => it.stem)).size !== 12)
    throw new Error(`${id}: duplicate parallel-practice stems`);

  const baseId = `${u}-${last}`;
  if (!DRY) {
    mkdirSync(join(LESSONS, id), { recursive: true });
    writeFileSync(join(LESSONS, id, "config.json"), JSON.stringify(out, null, 2) + "\n");
    // writeGenerated, not writeFileSync — see tools/generators-preserve-injected.test.mjs.
    // These catch-up shells carry injected sentinel blocks; a plain overwrite
    // strips them. No-op on a brand-new lesson, which has nothing to preserve.
    writeGenerated(
      join(LESSONS, id, "index.html"),
      shellHtml(id, `${range} Catch-Up`, `Grade 6 Reveal Math catch-up review — Lessons ${range}`),
    );
    writeFileSync(join(LESSONS, id, "lesson.js"), LESSON_JS);
  }

  rows.push({
    id,
    afterLesson: baseId,
    range,
    unit: u,
    search:
      `${baseId} catch-up catchup review lessons ${range.replace("–", "-")} ` +
      srcs.map((s) => s.c.title.toLowerCase()).join(" "),
    counts: {
      vocab: out.vocabulary.length,
      approaching: out.practice.approaching.length,
      onLevel: out.practice.onLevel.length,
      extending: out.practice.extending.length,
      optional: out.practice.optional.length,
      parallel: out.parallelPractice.length,
    },
  });
}

writeFileSync(new URL("./catchup-rows.json", import.meta.url), JSON.stringify(rows, null, 2));
console.log(`${DRY ? "[dry] " : ""}bands: ${rows.length}`);
if (preserved.length) {
  console.log(`carried forward (not regenerable, would otherwise be deleted):`);
  for (const p of preserved) console.log(`  ${p}`);
}
for (const r of rows)
  console.log(
    `${r.id.padEnd(14)} after ${r.afterLesson.padEnd(5)} ${r.range.padEnd(9)} v${r.counts.vocab} a${r.counts.approaching} o${r.counts.onLevel} e${r.counts.extending} opt${r.counts.optional} p${r.counts.parallel}`,
  );
