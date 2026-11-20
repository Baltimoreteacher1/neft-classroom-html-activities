import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const DIR = resolve("access-practice-lab/content/packs");
const ids = [
  "all-about-me",
  "new-arrival-school",
  "speaking-listening-cards",
  "sentence-building",
  "independent-menus",
  "scaffold-packs",
  "parents-carers",
  "learner-progress-tracker",
];
const load = async (id) => JSON.parse(await readFile(resolve(DIR, `${id}.json`), "utf8"));

test("newcomer pack collection is present and explicitly unreviewed", async () => {
  for (const id of ids) {
    const pack = await load(id);
    assert.equal(pack.id, id);
    assert.equal(pack.schema, "lp-newcomer-pack/1");
    assert.equal(pack.reviewStatus, "automated-checks-only");
    assert.ok(pack.title.en && pack.title.es);
  }
});

test("specified printables, arrival phrases, cards and parent guide counts hold", async () => {
  assert.equal((await load("all-about-me")).printables.length, 6);
  const arrival = await load("new-arrival-school");
  assert.deepEqual(arrival.routines, ["arrival", "lunch", "bus", "restroom", "help"]);
  assert.equal(arrival.phrases.length, 20);
  assert.equal((await load("speaking-listening-cards")).cards.length, 36);
  assert.equal((await load("independent-menus")).menus.length, 6);
  assert.equal((await load("parents-carers")).pages.length, 8);
});

test("practice progress tracker contains four domain areas and no level fields", async () => {
  const tracker = await load("learner-progress-tracker");
  assert.deepEqual(
    tracker.domains.map((d) => d.domain),
    ["Listening", "Speaking", "Reading", "Writing"],
  );
  assert.equal(JSON.stringify(tracker).match(/"level"/gi), null);
});
