import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../access-practice-lab/content/", import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const bank = new Map();
for (const band of ["3-5", "6-8"]) {
  for (const file of await readdir(new URL(`g${band}/`, root))) {
    if (!file.endsWith(".json")) continue;
    const domain = await read(`g${band}/${file}`);
    for (const [level, data] of Object.entries(domain.levels || {})) {
      for (const a of data.activities || [])
        bank.set(a.id, { ...a, band, domain: domain.domain, level });
    }
  }
}
test("all 24 weekly playlists contain existing, correctly banded tasks with individual goal explanations", async () => {
  const road = await read("road.json");
  let slots = 0;
  for (const [band, plan] of Object.entries(road)) {
    assert.equal(plan.weeks.length, 12);
    for (const week of plan.weeks) {
      assert.equal(week.activities.length, week.n === 8 ? 2 : 4);
      assert.equal(new Set(week.activities).size, week.activities.length);
      const domains = [];
      for (const id of week.activities) {
        const activity = bank.get(id);
        assert.ok(activity, `${band} week ${week.n}: ${id}`);
        assert.equal(activity.band, band);
        assert.ok(
          week.activityRationale[id]?.length > 20,
          `Missing instructional connection: ${id}`,
        );
        domains.push(activity.domain);
        slots++;
      }
      assert.deepEqual(
        domains,
        week.n === 8 ? ["Speaking", "Writing"] : ["Listening", "Reading", "Speaking", "Writing"],
      );
    }
  }
  assert.equal(slots, 92);
});
test("constructed practice offers task success criteria and annotations for each model", () => {
  for (const a of bank.values()) {
    if (a.type !== "constructed" || !a.prompt) continue;
    assert.ok(a.successCriteria?.length >= 3, a.id);
    for (const [level, model] of Object.entries(a.models || {})) {
      if (typeof model === "string") assert.ok(a.modelNotes?.[level], `${a.id} model ${level}`);
    }
  }
});
test("park examples honor the one or two sentence task and teach precision over length", () => {
  const park = bank.get("g35-w-a-park-scene");
  for (const model of Object.values(park.models))
    assert.ok(model.split(/[.!?]+/).filter((s) => s.trim()).length <= 2);
  assert.match(park.modelNotes.C, /one sentence/);
});
test("test metadata does not claim numerical WIDA proficiency calibration", async () => {
  for (const file of await readdir(new URL("tests/", root))) {
    if (!file.endsWith(".json")) continue;
    const practice = await read(`tests/${file}`);
    assert.equal(practice.tier, "Classroom practice; not an ACCESS tier");
    assert.doesNotMatch(practice.overview || "", /ACCESS order|WIDA\s+\d/);
  }
});
test("paragraph and personal narrative criteria do not invent a graph requirement", () => {
  for (const id of [
    "wrt-v11-b-describe-character",
    "wrt-v11-b-narrative-helped-someone",
    "g35-w-c-history-helper",
  ]) {
    assert.doesNotMatch(
      bank.get(id).successCriteria.join(" "),
      /displayed data|bar graph|labeled values/,
    );
  }
  assert.match(bank.get("g35-s-a-ask-for-help").successCriteria.join(" "), /politely/);
  assert.match(bank.get("v10-w-a-caption").successCriteria.join(" "), /short sentence/);
});
