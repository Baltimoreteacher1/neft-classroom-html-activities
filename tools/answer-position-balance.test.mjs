#!/usr/bin/env node
/**
 * The right answer may not live in the same place every time.
 *
 * Measured on the committed tree before any of this ran: choice A was correct in
 * 79.9% of warm-up questions, 85.8% of Connect checks, 91.7% of exit tickets and
 * 93.7% of practice items. Across 1,426 multiple-choice items, clicking the
 * first choice every time scored about 90%, and 62 of the 84 core lessons had
 * EVERY warm-up answer in position A.
 *
 * No existing gate could see it, and each of them was right not to: every item
 * is well-formed, arithmetically true (`validate:math` checks 4,103 of them) and
 * carries authored feedback (`audit:distractor-feedback` says 1,420/1,420 are
 * clean). The defect lives only in the DISTRIBUTION across items, which is not a
 * property any single item has. That is the same shape as the copy-panel
 * incident — 84 individually valid panels, 39 of them quoting another lesson.
 *
 * Two things are pinned here.
 *
 * THE RATCHET. `WORST_SHARE` is the largest share any one position holds on any
 * surface. It may only shrink. Lowering it is the work of balancing another
 * unit; raising it means answers drifted back into a column, which is how this
 * started. Update it in the same commit as the content change, never alone.
 *
 * THE TOOL'S CONTRACT, proven on fixtures rather than on the live tree, because
 * the live tree stops exercising a branch as soon as it is fixed:
 *   - it reorders, it never rewrites — same choices, same feedback, same tags;
 *   - every parallel per-choice array travels with its own choice (a distractor
 *     message attached to the wrong distractor is worse than none at all);
 *   - it is IDEMPOTENT. The first version was not: moving one answer could turn
 *     a choice set into a sorted numeric run, which changed the skip set, which
 *     shifted the round-robin cursor for every later item — a second run churned
 *     26 more answers. A tool that writes lesson content must produce the same
 *     tree every time or nothing downstream of it can be verified.
 */
import { execFileSync } from "node:child_process";
import { globSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const failures = [];
const check = (name, fn) => {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
};
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

/* --------------------------------------------------------------- the ratchet */

/**
 * The largest share any single answer position holds, on any surface, across the
 * core lessons. Balanced would be ~25-33% depending on choice count; a surface
 * where one position holds most of the answers is a surface a student can pass
 * without reading.
 *
 * 2026-08-29: all 84 core lessons balanced. The worst single-position share fell
 * from 93.7% (practice) to 34.5% (exit ticket), across 1,426 items.
 *
 * It stays a RATCHET rather than becoming a fixed threshold because the number
 * it guards is a property of authored content, and content keeps being written.
 * A newly authored lesson that puts all four answers in column A pushes this up,
 * and that is exactly the moment someone should be told — before it is 84
 * lessons again. The floor below stops it from being quietly relaxed.
 */
const WORST_SHARE = 0.36;

const VARIANT = /-(group1|group2|part2|catchup)$/;

function surfaceCounts(root) {
  const counts = {};
  const bump = (s, i) => {
    (counts[s] ||= [0, 0, 0, 0, 0, 0])[i]++;
  };
  for (const file of globSync(join(root, "lessons/*/config.json"))) {
    const id = file.split("/").at(-2);
    if (VARIANT.test(id)) continue;
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    for (const q of cfg.warmup?.questions || [])
      if (Array.isArray(q.choices) && Number.isInteger(q.correctIndex))
        bump("warmup", q.correctIndex);
    const ck = cfg.connect?.check;
    for (const q of Array.isArray(ck) ? ck : ck ? [ck] : [])
      if (Array.isArray(q.choices) && Number.isInteger(q.answer)) bump("connect", q.answer);
    const et = cfg.reflect?.exitTicket;
    for (const q of Array.isArray(et) ? et : et ? [et] : [])
      if (Array.isArray(q.choices) && Number.isInteger(q.correctIndex))
        bump("exit", q.correctIndex);
    const walk = (n) => {
      if (Array.isArray(n)) return n.forEach(walk);
      if (!n || typeof n !== "object") return;
      if (Array.isArray(n.choices) && Number.isInteger(n.correctIndex))
        bump("practice", n.correctIndex);
      for (const v of Object.values(n)) walk(v);
    };
    walk(cfg.practice);
  }
  return counts;
}

console.log("answer position");

const counts = surfaceCounts(process.cwd());
let worst = 0;
let worstName = "";
for (const [surface, d] of Object.entries(counts)) {
  const total = d.reduce((a, b) => a + b, 0);
  if (!total) continue;
  const share = Math.max(...d) / total;
  if (share > worst) {
    worst = share;
    worstName = `${surface} (n=${total})`;
  }
}

check(`no surface exceeds ${(WORST_SHARE * 100).toFixed(0)}% in one position`, () => {
  assert(
    worst <= WORST_SHARE + 1e-9,
    `${worstName} has ${(worst * 100).toFixed(1)}% of its answers in one position, over the ` +
      `pinned ${(WORST_SHARE * 100).toFixed(0)}%. Answers drifted back into a column. ` +
      "Re-run `node tools/answer-position-balance.mjs --fix --unit <n>`; " +
      "do not raise WORST_SHARE to make this pass.",
  );
});

check("the ratchet is not slack — it tracks the real worst share", () => {
  assert(
    worst > WORST_SHARE - 0.08,
    `the worst share is now ${(worst * 100).toFixed(1)}% but WORST_SHARE is still ` +
      `${(WORST_SHARE * 100).toFixed(0)}%. Lower it to ${Math.ceil(worst * 100)}% in this ` +
      "commit, or the ratchet stops holding the ground that was won.",
  );
});

/* ------------------------------------------------------ the tool's contract */

const dir = mkdtempSync(join(tmpdir(), "answer-balance-"));
const run = (args) =>
  execFileSync("node", [join(process.cwd(), "tools/answer-position-balance.mjs"), ...args], {
    cwd: dir,
    encoding: "utf8",
  });

try {
  // The fixtures below are the whole world this half of the test needs: the
  // tool globs `lessons/*/config.json` relative to its cwd, so an otherwise
  // empty tree exercises it exactly. An earlier version copied the real
  // `lessons/` in first — 595 MB and 6,488 files, on every `npm test` — which
  // bought nothing and helped push the suite past the deploy gate's 900s
  // timeout, aborting a push.
  const fixture = (id, cfg) => {
    const d = join(dir, "lessons", id);
    execFileSync("mkdir", ["-p", d]);
    writeFileSync(join(d, "config.json"), `${JSON.stringify(cfg, null, 2)}\n`);
    return join(d, "config.json");
  };

  // Non-numeric choices, full metadata — the shape that must be carried intact.
  const carried = fixture("99-1", {
    warmup: {
      questions: [
        {
          id: "warmup-99-1-1",
          stem: "Which pair does the ratio compare?",
          choices: ["Two different quantities", "A number and its opposite", "The same twice"],
          correctIndex: 0,
          choiceFeedback: ["", "feedback-for-opposite", "feedback-for-same"],
          choicesEs: ["Dos cantidades", "Un número y su opuesto", "La misma dos veces"],
          misconceptionTags: [null, "tag-opposite", "tag-same"],
        },
      ],
    },
  });

  // A choice that talks ABOUT the other choices — must not move.
  const positional = fixture("99-2", {
    warmup: {
      questions: [
        {
          id: "warmup-99-2-1",
          stem: "Which is true?",
          choices: ["It is a ratio", "It is a rate", "All of the above"],
          correctIndex: 0,
        },
      ],
    },
  });

  run(["--fix", "--only", "99-1,99-2"]);

  check("reorders without rewriting a single word", () => {
    const q = JSON.parse(readFileSync(carried, "utf8")).warmup.questions[0];
    assert(
      JSON.stringify([...q.choices].sort()) ===
        JSON.stringify(
          ["Two different quantities", "A number and its opposite", "The same twice"].sort(),
        ),
      `the choice set changed: ${JSON.stringify(q.choices)}`,
    );
    assert(
      q.choices[q.correctIndex] === "Two different quantities",
      `the correct answer is now ${JSON.stringify(q.choices[q.correctIndex])}`,
    );
  });

  check("every parallel array follows its own choice", () => {
    const q = JSON.parse(readFileSync(carried, "utf8")).warmup.questions[0];
    const i = q.choices.indexOf("A number and its opposite");
    assert(
      q.choiceFeedback[i] === "feedback-for-opposite",
      `feedback desynchronised: index ${i} holds ${JSON.stringify(q.choiceFeedback[i])}`,
    );
    assert(
      q.misconceptionTags[i] === "tag-opposite",
      `misconception tag desynchronised at index ${i}`,
    );
    assert(q.choicesEs[i] === "Un número y su opuesto", `Spanish desynchronised at index ${i}`);
    assert(
      q.choiceFeedback[q.correctIndex] === "",
      "the correct choice gained distractor feedback",
    );
  });

  check("an item whose choices reference each other is left alone", () => {
    const q = JSON.parse(readFileSync(positional, "utf8")).warmup.questions[0];
    assert(
      q.choices.at(-1) === "All of the above",
      `"All of the above" moved to position ${q.choices.indexOf("All of the above")}`,
    );
    assert(q.correctIndex === 0, "a positional item was reordered");
  });

  check("running it again changes nothing", () => {
    const before = readFileSync(carried, "utf8");
    const out = run(["--fix", "--only", "99-1,99-2"]);
    assert(
      readFileSync(carried, "utf8") === before,
      "a second run rewrote the config — the pass is not idempotent",
    );
    assert(
      /moved 0 answer/.test(out),
      `a second run reported work: ${out.trim().split("\n").pop()}`,
    );
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nanswer position: balanced within the ratchet, tool contract holds");
