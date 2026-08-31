/**
 * The Play tab of the family homework, held to the lesson it sits on.
 *
 * Two defects shipped here, both invisible to every other gate:
 *
 *   1. TOPIC. detectVisualTopic() let a loose title keyword outrank the
 *      lesson's own standard, so 6-1 and 6-2 — "Division Expressions with
 *      Fractions and …", standard 6.NOS.1 — matched /express/ and served their
 *      families an ALGEBRA homework: a Play-tab game asking a parent to
 *      evaluate 2x at x = 4 and name the coefficient of 5y, in a lesson about
 *      dividing fractions.
 *
 *   2. ANSWER POSITION. Rounds are authored answer-first and the runtime
 *      renders `choices` in order, so the first button was correct in every
 *      round of every family game. A student could clear the game without
 *      reading a question — the same bias already fixed across the lesson
 *      fleet, on the one surface that pass missed.
 *
 * Both are pinned here in the direction that matters: against the real
 * curriculum, not a fixture, so a regression in either shows up as a failure
 * rather than as a quietly worse homework.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { detectVisualTopic } from "../scripts/homework-alignment.mjs";
import { buildHomeworkGame } from "../scripts/homework-games.mjs";

const root = join(import.meta.dirname, "..");
const lessonsDir = join(root, "lessons");

const ids = readdirSync(lessonsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^\d+-\d+$/.test(e.name))
  .map((e) => e.name)
  .sort();

const configOf = (id) => JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));

/** The rounds a lesson's Play tab actually emits. */
function roundsFor(config) {
  const html = buildHomeworkGame(config).html;
  const match = html.match(/data-rounds='(.*?)'>/s);
  if (!match) return null; // this lesson's game is not multiple-choice
  return JSON.parse(match[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'"));
}

// ── 1. A number-system standard names its own topic. ───────────────────────
{
  const wrong = [];
  for (const id of ids) {
    const config = configOf(id);
    if (config.standard !== "6.NOS.1") continue;
    const topic = detectVisualTopic(config);
    if (topic !== "fractions") wrong.push(`${id} (${config.title}) → ${topic}`);
  }
  assert.deepEqual(
    wrong,
    [],
    `6.NOS.1 lessons routed away from the fractions homework:\n  ${wrong.join("\n  ")}`,
  );
}

// Negative control: the detector must still find algebra when it is really
// algebra, or assertion 1 would pass by returning "fractions" for everything.
{
  assert.equal(
    detectVisualTopic({ standard: "6.AT.7", title: "Write Equivalent Expressions" }),
    "expressions",
  );
}

// ── 2. 6-1 plays BOTH directions, including a numerator that is not 1. ─────
{
  const rounds = roundsFor(configOf("6-1"));
  assert.ok(rounds?.length, "6-1 has no multiple-choice Play round");
  const questions = rounds.map((r) => r.q).join(" | ");
  assert.match(questions, /\d+ ÷ 1\/\d/, `6-1 plays no whole ÷ fraction round: ${questions}`);
  assert.match(
    questions,
    /(?<!1)\d\/\d+ ÷ \d+(?!\/)/,
    `6-1 plays no non-unit fraction ÷ whole number round: ${questions}`,
  );
}

// ── 3. Every round has exactly one answer, and it is not always first. ─────
{
  const positions = new Map();
  let total = 0;
  for (const id of ids) {
    const rounds = roundsFor(configOf(id));
    if (!rounds) continue;
    for (const round of rounds) {
      const correct = round.choices.filter((c) => c.isCorrect);
      assert.equal(
        correct.length,
        1,
        `${id} round "${round.q}" has ${correct.length} correct choices`,
      );
      const at = round.choices.findIndex((c) => c.isCorrect);
      positions.set(at, (positions.get(at) || 0) + 1);
      total += 1;
    }
  }
  assert.ok(total > 100, `only ${total} Play rounds swept — the sweep found almost nothing`);
  const first = positions.get(0) || 0;
  assert.ok(
    first / total < 0.5,
    `the first button is the answer in ${first}/${total} Play rounds — ` +
      "a student can clear every family game without reading a question",
  );
}

console.log(
  `Play tab: ${ids.length} lessons — 6.NOS.1 routed to fractions, 6-1 plays both directions, answers spread across positions.`,
);
