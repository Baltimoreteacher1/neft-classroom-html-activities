/* Skill Quest model: climbs on clean streaks, steps back after help, ends honestly. Pure, no DOM. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ctx = { window: {} };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("assets/studio/quest-model.js", "utf8"), ctx);
const M = ctx.StudioQuestModel;
const skills = [
  { g: "a", label: "Skill A" },
  { g: "b", label: "Skill B" },
];

// start: level 2 (level 1 for the scaffold pathway)
assert.equal(M.start(skills).skills[0].level, 2);
assert.equal(M.start(skills, { scaffold: true }).skills[0].level, 1);

// three clean answers climb one level; mastery needs level 3 with a streak of 3
{
  const q = M.start([skills[0]]);
  for (let i = 0; i < 3; i++) M.record(q, 0, { clean: true });
  assert.equal(q.skills[0].level, 3, "climbed after three clean answers");
  assert.equal(q.skills[0].mastered, false, "not mastered the moment it arrives");
  for (let i = 0; i < 3; i++) M.record(q, 0, { clean: true });
  assert.equal(q.skills[0].mastered, true, "three clean at level 3 masters it");
  assert.ok(M.finished(q));
  assert.equal(M.summary(q).stars, 3);
}
// two helped answers in a row step back one level, never below 1
{
  const q = M.start([skills[0]]);
  M.record(q, 0, { clean: false });
  assert.equal(q.skills[0].level, 2, "one helped answer holds the level");
  M.record(q, 0, { clean: false });
  assert.equal(q.skills[0].level, 1, "two in a row step back");
  M.record(q, 0, { clean: false });
  M.record(q, 0, { clean: false });
  assert.equal(q.skills[0].level, 1, "floor at level 1");
}
// a clean answer between helped ones resets the run
{
  const q = M.start([skills[0]]);
  M.record(q, 0, { clean: false });
  M.record(q, 0, { clean: true });
  M.record(q, 0, { clean: false });
  assert.equal(q.skills[0].level, 2, "not consecutive, so no step back");
}
// pick: the least practised, lowest skill first; mastered skills wait their turn last
{
  const q = M.start(skills);
  assert.equal(M.pick(q).skill, 0);
  M.record(q, 0, { clean: true });
  assert.equal(M.pick(q).skill, 1, "the other skill is up next");
}
// the quest always ends: a student who is helped every time hits the cap
{
  const q = M.start(skills);
  let n = 0;
  while (!M.finished(q) && n < 100) {
    const { skill } = M.pick(q);
    M.record(q, skill, { clean: false });
    n++;
  }
  assert.ok(M.finished(q) && n === q.cap, `ended at the cap (${n})`);
  const s = M.summary(q);
  assert.equal(s.mastered, 0);
  assert.equal(s.stars, 0, "honest: no stars for no mastery and no clean answers");
}
console.log("studio-quest: climb, step back, pick order and the cap all behave.");
