// Which English strings in data/family-homework-notes/<id>.json a family reads, and how hard each one is.
// Shared by tools/validate-family-readability.mjs. The grade is `fleschKincaid` from tools/lib/copy-scan.mjs,
// the repo's one reading-level function; nothing here re-implements it.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fleschKincaid } from "./copy-scan.mjs";
import { REPO_ROOT } from "./curriculum-source.mjs";

export const NOTES_DIR = join(REPO_ROOT, "data/family-homework-notes");
export const BUDGET_PATH = join(REPO_ROOT, "data/family-readability-budget.json");

/** Add [field, path, text] for every family-facing English string of one sidecar. */
export function familyStrings(j) {
  const out = [];
  const add = (field, path, text) => {
    if (typeof text === "string" && text.trim()) out.push({ field, path, text });
  };
  add("learningTonight", "learningTonight.en", j.learningTonight?.en);
  add("bigIdea", "bigIdea.en", j.bigIdea?.en);
  const tt = j.tryTogether;
  if (tt) {
    add("tryTogether", "tryTogether.scenarioEn", tt.scenarioEn);
    (tt.steps || []).forEach((s, i) => {
      add("tryTogether", `tryTogether.steps.${i}.en`, s.en);
      add("tryTogether", `tryTogether.steps.${i}.hint`, s.hint);
      add("tryTogether", `tryTogether.steps.${i}.helpEn`, s.helpEn);
    });
  }
  (j.watchFor || []).forEach((w, i) => add("watchFor", `watchFor.${i}.en`, w.en));
  (j.stuckTips?.say || []).forEach((w, i) => add("stuckTips.say", `stuckTips.say.${i}.en`, w.en));
  (j.stuckTips?.dontSay || []).forEach((w, i) =>
    add("stuckTips.dontSay", `stuckTips.dontSay.${i}.en`, w.en),
  );
  for (const k of ["class", "before", "why"])
    add(`bridge.${k}`, `bridge.${k}.en`, j.bridge?.[k]?.en);
  const c = j.corner;
  if (c) {
    add("corner.mission", "corner.mission.en", c.mission?.en);
    add("corner.question", "corner.question.en", c.question?.en);
    add("corner.frame", "corner.frame.en", c.frame?.en);
    add("corner.spotlight", "corner.spotlight.factEn", c.spotlight?.factEn);
    add("corner.watchOut", "corner.watchOut.en", c.watchOut?.en);
    add("corner.powerUp", "corner.powerUp.qEn", c.powerUp?.qEn);
    add("corner.powerUp", "corner.powerUp.hintEn", c.powerUp?.hintEn);
  }
  const v = j.v3;
  if (v) {
    add("v3.hook", "v3.hook.en", v.hook?.en);
    add("v3.hook", "v3.hook.guess.en", v.hook?.guess?.en);
    add("v3.hook", "v3.hook.reveal.en", v.hook?.reveal?.en);
    add("v3.kitchenTable", "v3.kitchenTable.en", v.kitchenTable?.en);
    (v.vocab || []).forEach((x, i) => {
      add("v3.vocab", `v3.vocab.${i}.frame.en`, x.frame?.en);
      add("v3.vocab", `v3.vocab.${i}.example.en`, x.example?.en);
    });
    (v.confused || []).forEach((x, i) =>
      add("v3.confused.coach", `v3.confused.${i}.coach.en`, x.coach?.en),
    );
    add("v3.standardPlain", "v3.standardPlain.en", v.standardPlain?.en);
  }
  (j.conceptSteps || []).forEach((s, i) => add("conceptSteps", `conceptSteps.${i}.en`, s.en));
  return out;
}

export const wordCount = (text) =>
  (
    String(text)
      .replace(/<[^>]*>/g, " ")
      .match(/[A-Za-z']+/g) || []
  ).length;

/** Every family-facing English string of every sidecar, with its id, word count and grade. */
export function sweep(dir = NOTES_DIR) {
  const rows = [];
  for (const f of readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .sort()) {
    const id = f.replace(/\.json$/, "");
    const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
    for (const s of familyStrings(j))
      rows.push({ id, ...s, words: wordCount(s.text), grade: fleschKincaid(s.text) });
  }
  return rows;
}

export const readBudget = () => JSON.parse(readFileSync(BUDGET_PATH, "utf8"));

/** Strings above the grade limit. A string under `minWords` words is judged by eye, not by number:
 *  one technical term in a short sentence ("Equations and inequalities are interchangeable.") is a known
 *  false positive of every grade formula. */
export const tooHard = (rows, { threshold, minWords }) =>
  rows.filter((r) => r.words >= minWords && r.grade > threshold);
