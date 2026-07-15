#!/usr/bin/env node
// Generate catch-up lessons: one per band of 3-4 lessons per unit.
// Clone the band's LAST lesson config as structural base (renderer requires all
// 5 phase sections), replace content: Big Ideas conceptIntro, merged vocab,
// mixed practice sampled from every band lesson, middle lesson's exit ticket.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
  const keyIdeaOf = (s) =>
    s.c.launch?.conceptIntro?.keyIdea || s.c.contentObjective || s.c.title;

  const out = base;
  out.lessonId = id;
  out.title = `${range} Catch-Up`;
  out.themeEmoji = "\u{1F9ED}";
  out.timeEstimate = "~25 min";
  out.readiness = false;
  delete out.googleForms;
  delete out.printables;
  delete out.graphicNovel;
  delete out.familyNotes;
  delete out.flagship;

  out.contentObjective = `I can show I am caught up on Lessons ${range} by using each lesson's big idea in mixed practice.`;
  out.languageObjective = `I can explain which lesson's big idea I used and how, using key vocabulary from Lessons ${range}.`;

  // Merged vocab: top 2 terms per lesson, deduped.
  const seen = new Set();
  out.vocabulary = [];
  for (const s of srcs) {
    for (const v of (s.c.vocabulary || []).slice(0, 2)) {
      const k = v.term.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.vocabulary.push(v);
    }
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

  if (out.noticeAndWonder?.context)
    out.noticeAndWonder.context = `Quick review from Lesson ${dots(u, last)}: ${out.noticeAndWonder.context}`;
  if (out.revealWordProblem?.title)
    out.revealWordProblem.title = `(Review from ${dots(u, last)}) ${out.revealWordProblem.title}`;
  if (out.explore?.instructions)
    out.explore.instructions = `Review from Lesson ${dots(u, last)}: ${out.explore.instructions}`;

  const sample = (tier, per) =>
    srcs.flatMap((s) =>
      (s.c.practice?.[tier] || []).slice(0, per).map((it) => tagItem(it, dots(u, s.n))),
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

  const baseId = `${u}-${last}`;
  if (!DRY) {
    mkdirSync(join(LESSONS, id), { recursive: true });
    writeFileSync(join(LESSONS, id, "config.json"), JSON.stringify(out, null, 2) + "\n");
    // Shell: copy base lesson's index.html, patch identity strings.
    let html = readFileSync(join(LESSONS, baseId, "index.html"), "utf8");
    html = html.replace(`data-ewl-supports-lesson="${baseId}"`, `data-ewl-supports-lesson="${id}"`);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${range} Catch-Up — Neft Teacher</title>`);
    html = html.replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1Grade 6 Reveal Math catch-up review — Lessons ${range}$2`,
    );
    html = html.replace(`Lesson ${baseId}:`, `Lesson ${id} (catch-up covering ${range}):`);
    writeFileSync(join(LESSONS, id, "index.html"), html);
    writeFileSync(join(LESSONS, id, "lesson.js"), readFileSync(join(LESSONS, baseId, "lesson.js")));
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
    },
  });
}

writeFileSync(
  new URL("./catchup-rows.json", import.meta.url),
  JSON.stringify(rows, null, 2),
);
console.log(`${DRY ? "[dry] " : ""}bands: ${rows.length}`);
for (const r of rows)
  console.log(
    `${r.id.padEnd(14)} after ${r.afterLesson.padEnd(5)} ${r.range.padEnd(9)} v${r.counts.vocab} a${r.counts.approaching} o${r.counts.onLevel} e${r.counts.extending} opt${r.counts.optional}`,
  );
