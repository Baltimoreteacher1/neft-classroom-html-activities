// ACCESS Practice Lab 2.0: item model and validator, with negative controls (each bad shape MUST be rejected).
import assert from "node:assert/strict";
import { test } from "node:test";
import { BANDS, DOMAINS, RESPONSE_MODES, TASK_TYPES } from "../shared/access-lab2/constants.js";
import { DEMO_ITEMS } from "../shared/access-lab2/demo-items.js";
import { validateItem } from "../shared/access-lab2/item.js";
import { clone, HUMAN } from "./access-lab2-helpers.mjs";

const byId = (id) => clone(DEMO_ITEMS.find((i) => i.id === id));
const rejects = (item, pattern) => {
  const errs = validateItem(item);
  assert.ok(
    errs.some((e) => pattern.test(e)),
    `expected an error matching ${pattern}, got ${JSON.stringify(errs)}`,
  );
};

test("the demo set is 36 valid, clearly draft items: 3 per domain per practice band", () => {
  assert.equal(DEMO_ITEMS.length, 36);
  for (const item of DEMO_ITEMS) {
    assert.deepEqual(validateItem(item), [], item.id);
    assert.equal(item.reviewState, "draft", `${item.id} must be draft`);
  }
  for (const d of DOMAINS)
    for (const b of BANDS)
      assert.equal(DEMO_ITEMS.filter((i) => i.domain === d && i.band === b).length, 3, `${d}/${b}`);
  assert.equal(new Set(DEMO_ITEMS.map((i) => i.id)).size, 36);
  assert.equal(
    new Set(DEMO_ITEMS.map((i) => i.task.stimulus.id)).size,
    36,
    "every demo stimulus is distinct",
  );
});

test("the demo set exercises every task type and every response mode", () => {
  for (const d of DOMAINS)
    for (const type of Object.keys(TASK_TYPES[d]))
      assert.ok(
        DEMO_ITEMS.some((i) => i.domain === d && i.task.type === type),
        `${d}/${type} has no demo item`,
      );
  for (const m of RESPONSE_MODES)
    assert.ok(
      DEMO_ITEMS.some((i) => i.response.mode === m),
      `mode ${m} has no demo item`,
    );
});

test("negative controls: bad shapes are rejected", () => {
  assert.deepEqual(validateItem(null), ["item must be an object"]);
  const noAlt = byId("demo-s-early-1");
  noAlt.supports.images[0].alt = "";
  rejects(noAlt, /alt text/);
  const noImage = byId("demo-s-early-1");
  noImage.supports.images = [];
  rejects(noImage, /picture tasks need/);
  const manip = byId("demo-r-early-1");
  manip.task.prompt = "Use counters to show how many wagons there are.";
  rejects(manip, /manipulative/);
  const cubes = byId("demo-r-early-1");
  cubes.response.constraints.options[0].text = "Linking cubes";
  rejects(cubes, /manipulative/);
  const wrongType = byId("demo-r-early-1");
  wrongType.task.type = "listen-and-choose";
  rejects(wrongType, /not a Reading task type/);
  const badKey = byId("demo-r-early-1");
  badKey.scoring.key = "zzz";
  rejects(badKey, /scoring\.key must be an option id/);
  const dupText = byId("demo-r-early-1");
  dupText.response.constraints.options[1].text =
    dupText.response.constraints.options[0].text.toUpperCase();
  rejects(dupText, /same text/);
  const badOrder = byId("demo-l-early-3");
  badOrder.scoring.key = ["a", "b"];
  rejects(badOrder, /order key/);
  const badDrag = byId("demo-l-building-1");
  badDrag.scoring.key = { a: "sat" };
  rejects(badDrag, /drag key/);
  const noRubric = byId("demo-s-early-2");
  noRubric.scoring.rubric = noRubric.scoring.rubric.slice(0, 2);
  rejects(noRubric, /at least three criteria/);
  const keyedSpeaking = byId("demo-s-early-2");
  keyedSpeaking.scoring = { type: "key", key: "a" };
  rejects(keyedSpeaking, /selfcheck or rubric scoring|key scoring needs/);
  const selfcheckListen = byId("demo-l-early-1");
  selfcheckListen.scoring = { type: "selfcheck", rubric: byId("demo-s-early-2").scoring.rubric };
  rejects(selfcheckListen, /use key scoring/);
  const noAudio = byId("demo-l-early-1");
  noAudio.supports.audio = false;
  rejects(noAudio, /supports\.audio true/);
  const textListen = byId("demo-l-early-1");
  textListen.task.stimulus.kind = "text";
  rejects(textListen, /audio stimulus/);
  const badDomain = byId("demo-l-early-1");
  badDomain.domain = "Math";
  rejects(badDomain, /domain must be/);
});

test("negative controls: recordings never leave the device and nothing is timed", () => {
  const cloud = byId("demo-s-early-2");
  cloud.response.constraints.storage = "server";
  rejects(cloud, /never leave the device/);
  const timed = byId("demo-s-early-2");
  timed.response.constraints.maxSeconds = 30;
  rejects(timed, /no recording timers/);
});

test("negative controls: provenance and review use the v2 vocabulary and only a human can approve", () => {
  const noProv = byId("demo-r-early-1");
  noProv.provenance.origin = "magic";
  rejects(noProv, /provenance\.origin/);
  const generated = byId("demo-r-early-1");
  generated.provenance.origin = "generated";
  rejects(generated, /name their generator/);
  const badHash = byId("demo-r-early-1");
  badHash.provenance.contentHash = "abc";
  rejects(badHash, /contentHash/);
  const unsigned = byId("demo-r-early-1");
  unsigned.reviewState = "reviewed";
  rejects(unsigned, /needs a human reviewer/);
  const model = byId("demo-r-early-1");
  model.reviewState = "reviewed";
  model.reviewers = [{ ...HUMAN, actor: "model" }];
  rejects(model, /actor: "human"/);
  const state = byId("demo-r-early-1");
  state.reviewState = "approved";
  rejects(state, /reviewState must be/);
  const good = byId("demo-r-early-1");
  good.reviewState = "reviewed";
  good.reviewers = [{ ...HUMAN }];
  assert.deepEqual(validateItem(good), []);
});

test("negative controls: frames fade by band, honesty wording, label wording", () => {
  const early = byId("demo-w-early-2");
  early.response.constraints.frameLevel = "none";
  rejects(early, /frames fade by band/);
  const strong = byId("demo-w-strong-1");
  strong.response.constraints.frameLevel = "full";
  rejects(strong, /frames fade by band/);
  const noFrames = byId("demo-w-building-1");
  noFrames.response.constraints.frames = [];
  rejects(noFrames, /needs constraints\.frames/);
  const parity = byId("demo-r-early-1");
  parity.task.prompt = "This question is just like the real ACCESS test.";
  rejects(parity, /parity/);
  const label = byId("demo-r-early-1");
  label.task.prompt = "Read this ESOL story.";
  rejects(label, /program labels/);
  const noEx = byId("demo-r-early-1");
  noEx.exercises = [];
  rejects(noEx, /exercises/);
});
