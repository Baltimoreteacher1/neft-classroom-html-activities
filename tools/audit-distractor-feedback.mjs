// Distractor-feedback audit — can a wrong choice be answered in the student's
// own terms? Reports coverage of authored `choiceFeedback` across every
// multiple-choice pool the engine surfaces it on: practice tiers, warm-up
// questions, Connect checks, and the exit ticket (warm-up and Connect learned
// to read it on 2026-08-29). `--strict` fails on any leak or duplicate so the
// authoring waves cannot ship a giveaway; `--floor N` fails when covered items
// fall below N (a ratchet, pinned by tools/distractor-feedback.test.mjs).
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const argv = process.argv.slice(2);
const STRICT = argv.includes("--strict");
const floorArg = argv.indexOf("--floor");
const FLOOR = floorArg >= 0 ? Number(argv[floorArg + 1]) : 0;

// Operators survive normalisation on purpose: "80 − 1.5" and "80 + 1.5" are
// different choices, and collapsing both to "80 1.5" reported honest coaching
// ("80 + 1.5 moves the wrong direction") as a leak of the correct one.
const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9./%$+\-−×÷*=]+/g, " ")
    .trim();

/** Every multiple-choice-shaped item in one config, with where it lives. */
export function collectItems(cfg) {
  const out = [];
  const push = (loc, arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((item, i) => {
      if (!item || !Array.isArray(item.choices) || item.choices.length < 2) return;
      const correct = Number(item.correctIndex ?? item.answer ?? item.correct ?? item.answerIndex);
      out.push({ loc: `${loc}[${i}]`, item, correct: Number.isInteger(correct) ? correct : -1 });
    });
  };
  for (const tier of ["approaching", "onLevel", "extending", "optional"])
    push(`practice.${tier}`, cfg.practice?.[tier]);
  push("warmup.questions", cfg.warmup?.questions);
  push("connect.check", cfg.connect?.check);
  push("reflect.exitTicket", cfg.reflect?.exitTicket ? [cfg.reflect.exitTicket] : []);
  return out;
}

/** Problems with one item's feedback. Empty array = covered and clean. */
export function auditItem({ item, correct }) {
  const fb = item.choiceFeedback;
  const problems = [];
  if (!Array.isArray(fb)) return ["missing"];
  if (fb.length !== item.choices.length)
    problems.push(`length ${fb.length} != ${item.choices.length} choices`);
  const seen = new Map();
  item.choices.forEach((choice, i) => {
    const text = String(fb[i] ?? "").trim();
    if (i === correct) {
      if (text) problems.push(`slot ${i} is the correct choice but carries feedback`);
      return;
    }
    if (!text) {
      problems.push(`slot ${i} empty`);
      return;
    }
    if (text.length > 220) problems.push(`slot ${i} is ${text.length} chars (max 220)`);
    const t = norm(text);
    const answer = norm(item.choices[correct]);
    // A leak is the correct choice quoted, or the letter named. Short numeric
    // answers ("4") appear inside honest coaching ("4 groups of..."), so only
    // whole-token matches of answers with ≥2 characters count.
    if (
      answer.length >= 2 &&
      new RegExp(`(^|\\s)${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(t)
    )
      problems.push(`slot ${i} quotes the correct choice`);
    // Naming the LETTER, or stating "the answer is <correct choice>". Prose
    // about answers ("the answer is only half the story") is not a reveal.
    const quoted = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const answerRe = new RegExp(
      `\\b(answer|correct(?: answer| choice)?|choose|pick|select)(?: is| it'?s|:)?\\s*(?:\\(?[a-d]\\)?(?=\\s|$|[.,;])|"?${quoted}(?=\\s|$|[.,;"]))`,
      "i",
    );
    if (answer.length >= 1 && answerRe.test(t)) problems.push(`slot ${i} names the answer`);
    if (seen.has(t)) problems.push(`slot ${i} duplicates slot ${seen.get(t)}`);
    seen.set(t, i);
  });
  return problems;
}

export function audit() {
  const rows = [];
  for (const id of readdirSync(LESSONS)
    .filter((d) => /^\d+-\d+$/.test(d))
    .sort()) {
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
    } catch {
      continue;
    }
    for (const entry of collectItems(cfg)) rows.push({ id, ...entry, problems: auditItem(entry) });
  }
  return rows;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rows = audit();
  const covered = rows.filter((r) => r.problems.length === 0).length;
  const missing = rows.filter((r) => r.problems[0] === "missing");
  const broken = rows.filter((r) => r.problems.length && r.problems[0] !== "missing");
  const byLoc = {};
  for (const r of missing) {
    const loc = r.loc.replace(/\[\d+\]$/, "");
    byLoc[loc] = (byLoc[loc] || 0) + 1;
  }
  console.log(
    `distractor-feedback: ${covered}/${rows.length} multiple-choice items carry clean authored feedback` +
      ` (${missing.length} missing, ${broken.length} with problems)`,
  );
  for (const [loc, n] of Object.entries(byLoc).sort((a, b) => b[1] - a[1]))
    console.log(`  missing in ${loc}: ${n}`);
  for (const r of broken.slice(0, 40))
    console.log(`  ✗ ${r.id} ${r.loc}: ${r.problems.join("; ")}`);
  if (broken.length > 40) console.log(`  … ${broken.length - 40} more`);
  let fail = false;
  if (STRICT && broken.length) fail = true;
  if (FLOOR && covered < FLOOR) {
    console.log(`  ✗ coverage ${covered} is below the pinned floor ${FLOOR}`);
    fail = true;
  }
  process.exit(fail ? 1 : 0);
}
