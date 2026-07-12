#!/usr/bin/env node
/**
 * Daily Do-Now → Class Board
 * ==========================
 * Generates a spaced spiral-review warm-up and (optionally) posts it to the
 * live Class Board's "🟢 Right Now" surface, so a bell-ringer is waiting for
 * students every morning without hand-authoring one.
 *
 * Reuses the existing spiral bank (spiral-review/bank.json) + weighting, and
 * the existing board API (PUT /api/board/save). It GETs the current board and
 * merges ONLY `focus` back, because the board replaces its whole state on load
 * — a partial post would blank every other panel.
 *
 * Usage:
 *   npm run do-now -- --section 601 --units upto:3            # preview only
 *   npm run do-now -- --section 601 --units upto:3 --publish  # go live
 *   npm run do-now -- --units range:5-6 --count 2 --publish
 *
 * Flags:
 *   --section <id>    board id: main | 601 | 602 | 603 (default main)
 *   --units <spec>    all | upto:N | range:a-b            (default all)
 *   --count <n>       questions (default 1)
 *   --seed <s>        reproducibility seed (default: today's date)
 *   --site <url>      site origin (default $NEFT_SITE or eduwonderlab.com)
 *   --key <k>         teacher key (default $TEACHER_KEY / $NEFT_TEACHER_KEY)
 *   --publish         actually write to the board (default: dry-run preview)
 *   --force           allow posting even if the board was never initialized
 *   --json            print the generated do-now as JSON and exit
 */

import { loadBank, pickSpiral } from "./lib/spiral-node.mjs";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const DEFAULT_SITE = process.env.NEFT_SITE || "https://eduwonderlab.com";
const DONOW_MARK = "🧠 Do-Now";

function parseArgs(argv) {
  const a = { flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (["--section", "--units", "--count", "--seed", "--site", "--key", "--sub"].includes(t)) {
      a[t.slice(2)] = argv[++i];
    } else if (t.startsWith("--")) a.flags.add(t.slice(2));
    else throw new Error(`Unexpected argument: ${t}`);
  }
  return a;
}

function parseScope(spec = "all") {
  if (spec === "all") return { mode: "all" };
  const upto = spec.match(/^upto:(\d+)$/);
  if (upto) return { mode: "upto", upto: Number(upto[1]) };
  const range = spec.match(/^range:(\d+)-(\d+)$/);
  if (range) return { mode: "range", from: Number(range[1]), to: Number(range[2]) };
  throw new Error(`--units must be all | upto:N | range:a-b (got "${spec}")`);
}

function today() {
  // Local calendar date; a normal CLI, so Date is fine here.
  return new Date().toISOString().slice(0, 10);
}

const lettered = (q) => q.choices.map((c, i) => `${LETTERS[i]}) ${c}`).join("   ");

function buildFocus(questions, subOverride) {
  const q1 = questions[0];
  if (questions.length === 1) {
    return {
      now: `🔥 Do Now: ${q1.stem}`,
      nowSub: subOverride || lettered(q1),
    };
  }
  return {
    now: `🔥 Do Now — Spiral Review (${questions.length} questions)`,
    nowSub: subOverride || "Solve all on your warm-up sheet — we'll review together.",
  };
}

/** Extra questions (beyond the first) become numbered board notes. */
function extraNotes(questions) {
  return questions.slice(1).map((q, i) => ({
    emoji: "🧠",
    text: `${DONOW_MARK} Q${i + 2}. ${q.stem}  —  ${lettered(q)}`,
  }));
}

function printPreview(questions, section, scopeSpec) {
  process.stdout.write(`\n📋 Do-Now preview — board "${section}", units ${scopeSpec}\n\n`);
  questions.forEach((q, i) => {
    process.stdout.write(`  Q${i + 1}. ${q.stem}\n`);
    q.choices.forEach((c, ci) => {
      const mark = ci === q.correctIndex ? " ✅" : "";
      process.stdout.write(`       ${LETTERS[ci]}) ${c}${mark}\n`);
    });
    process.stdout.write(`       ↳ answer: ${LETTERS[q.correctIndex]} · ${q.standard} · ${q.lessonTitle}\n`);
    if (q.explanation) process.stdout.write(`       ↳ ${q.explanation}\n`);
    process.stdout.write("\n");
  });
}

async function fetchBoard(site, section) {
  const r = await fetch(`${site}/api/board/get?board=${encodeURIComponent(section)}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`GET board failed: HTTP ${r.status}`);
  return r.json();
}

async function publishBoard(site, section, state, key) {
  const r = await fetch(`${site}/api/board/save?board=${encodeURIComponent(section)}`, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-teacher-key": key },
    body: JSON.stringify({ state, updatedAt: Date.now(), updatedBy: "do-now-bot" }),
  });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, ...d };
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const section = a.section || "main";
  const scopeSpec = a.units || "all";
  const scope = parseScope(scopeSpec);
  const count = Math.max(1, Number(a.count) || 1);
  const seed = a.seed || today();
  const site = (a.site || DEFAULT_SITE).replace(/\/$/, "");

  const bank = loadBank();
  const questions = pickSpiral(bank, { count, scope, seed });
  if (!questions.length) {
    process.stderr.write(`No spiral questions available for units "${scopeSpec}".\n`);
    process.exit(1);
  }

  if (a.flags.has("json")) {
    process.stdout.write(`${JSON.stringify({ section, scope: scopeSpec, seed, questions }, null, 2)}\n`);
    return;
  }

  printPreview(questions, section, scopeSpec);
  const focus = buildFocus(questions, a.sub);
  const notes = extraNotes(questions);

  if (!a.flags.has("publish")) {
    process.stdout.write(
      `Dry run. To post this to the live board:\n` +
        `  TEACHER_KEY=… npm run do-now -- --section ${section} --units ${scopeSpec}` +
        `${count > 1 ? ` --count ${count}` : ""} --publish\n`,
    );
    return;
  }

  const key = a.key || process.env.TEACHER_KEY || process.env.NEFT_TEACHER_KEY;
  if (!key) {
    process.stderr.write("--publish needs a teacher key (--key or $TEACHER_KEY).\n");
    process.exit(1);
  }

  process.stdout.write(`Fetching current board "${section}" from ${site} …\n`);
  const current = await fetchBoard(site, section);
  if (!current.state) {
    if (!a.flags.has("force")) {
      process.stderr.write(
        `Board "${section}" has no saved state yet. Open ${site}/math/student-board/ and\n` +
          `Publish once so other panels aren't blanked, then re-run — or pass --force.\n`,
      );
      process.exit(1);
    }
    current.state = { focus: {}, notes: [] };
  }

  const state = current.state;
  // Merge ONLY the warm-up surfaces; preserve every other panel.
  state.focus = { ...(state.focus || {}), ...focus };
  const kept = (state.notes || []).filter((n) => !(n && typeof n.text === "string" && n.text.startsWith(DONOW_MARK)));
  state.notes = [...notes, ...kept];

  const res = await publishBoard(site, section, state, key);
  if (res.status === 401) {
    process.stderr.write("Rejected: wrong teacher key (401).\n");
    process.exit(1);
  }
  if (res.ok && res.kept === "client") {
    process.stdout.write(`✓ Posted do-now to board "${section}" — students see it now.\n`);
  } else if (res.ok && res.kept === "server") {
    process.stdout.write("A newer board copy already exists; nothing overwritten.\n");
  } else {
    process.stderr.write(`Publish failed: ${res.error || res.status}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err.message}\n`);
  process.exit(1);
});
