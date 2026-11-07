// Avatar/world unlocks from finished missions (Language Page #17) and the non-numeric shield display (#18).
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const un = await import("../access-practice-lab/src/lang/unlocks.js");
const sh = await import("../access-practice-lab/src/lang/shields.js");

const missionIds = readdirSync(new URL("content/missions/", LAB)).map((f) =>
  f.replace(/\.json$/, ""),
);
const studio = (ids) => ({ missions: Object.fromEntries(ids.map((id) => [id, { done: true }])) });

test("one avatar piece per real mission, one scene per real Language World, all bilingual", () => {
  assert.deepEqual([...un.AVATAR_ITEMS.map((i) => i.mission)].sort(), [...missionIds].sort());
  for (const w of un.WORLD_SCENES)
    assert.ok(existsSync(new URL(`pictures/worlds/${w.id}.svg`, LAB)), w.id);
  for (const x of [...un.AVATAR_ITEMS, ...un.WORLD_SCENES])
    assert.ok(x.name.en && x.name.es && x.name.en !== x.name.es);
});

test("only finished missions unlock; scenes open at 1, 3, 5 and 7 finished missions", () => {
  assert.equal(un.unlocks({}).count, 0);
  const st = {
    missions: { "space-colony": { done: true }, "harbor-petition": { done: false, started: "x" } },
  };
  const u = un.unlocks(st);
  assert.deepEqual(
    u.items.filter((i) => i.unlocked).map((i) => i.id),
    ["space-suit"],
  );
  assert.deepEqual(
    u.scenes.filter((w) => w.unlocked).map((w) => w.id),
    ["signal-station"],
  );
  assert.equal(
    un.unlocks(studio(missionIds.slice(0, 7))).scenes.every((w) => w.unlocked),
    true,
  );
});

test("a saved look survives only while it is known and unlocked", () => {
  assert.deepEqual(
    un.normalizeLook({ item: "space-suit", scene: "storyworks" }, studio(["space-colony"])),
    {
      item: "space-suit",
      scene: "",
    },
  );
  assert.deepEqual(un.cleanLook({ item: "crown", scene: "evidence-city" }), {
    item: "",
    scene: "evidence-city",
  });
});

test("shields are earned from evidence and never need a number on screen", () => {
  const records = [
    {
      domain: "Reading",
      record: {
        complete: ["a", "b"],
        results: { a: { evidence: "independent", date: "2026-11-01T10:00:00Z" } },
      },
    },
  ];
  const entries = [
    { domain: "Writing", kind: "first", stage: "independent", t: "2026-11-01T10:00:00Z" },
    { domain: "Writing", kind: "first", stage: "independent", t: "2026-11-03T10:00:00Z" },
    { domain: "Writing", kind: "revision", stage: "supported", t: "2026-11-03T11:00:00Z" },
  ];
  const board = sh.shieldBoard(entries, records);
  const earned = (d) =>
    board
      .find((r) => r.domain === d)
      .shields.filter((x) => x.earned)
      .map((x) => x.id);
  assert.deepEqual(earned("Reading"), ["practised", "on-my-own"]);
  assert.deepEqual(earned("Writing"), ["practised", "on-my-own", "two-days", "made-better"]);
  assert.deepEqual(earned("Speaking"), []);
  for (const s of sh.SHIELDS) assert.doesNotMatch(`${s.name.en} ${s.how.en}`, /level|score|%/i);
});

test("the shield board renders words and pictures, no digits, in all three language modes", async () => {
  const dom = new JSDOM("<body></body>");
  globalThis.document = dom.window.document;
  const { shieldsHTML } = await import("../access-practice-lab/src/views/shields.js");
  const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
  const { toHtml } = await import("../access-practice-lab/src/util.js");
  const entries = [{ domain: "Speaking", kind: "first", stage: "independent", t: "2026-11-01" }];
  for (const mode of ["en", "es", "bi"]) {
    document.body.innerHTML = toHtml(shieldsHTML(makeI18n(mode), entries, []));
    assert.equal(document.querySelectorAll(".shield-row").length, 4, mode);
    assert.equal(document.querySelectorAll(".shield.is-earned").length, 2, mode);
    assert.doesNotMatch(document.querySelector(".shield-board").textContent, /\d/, mode);
  }
});

test("the avatar panel renders on the missions page in all three language modes", async () => {
  const dom = new JSDOM("<body></body>");
  globalThis.document = dom.window.document;
  const { avatarPanelHTML } = await import("../access-practice-lab/src/views/avatar-panel.js");
  const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
  const { toHtml } = await import("../access-practice-lab/src/util.js");
  for (const mode of ["en", "es", "bi"]) {
    document.body.innerHTML = toHtml(
      avatarPanelHTML(makeI18n(mode), studio(["space-colony"]), { item: "space-suit" }, "6-8"),
    );
    assert.equal(document.querySelectorAll("[data-avatar-item]:not([disabled])").length, 1, mode);
    assert.equal(
      document.querySelectorAll("[data-avatar-item][disabled]").length,
      missionIds.length - 1,
      mode,
    );
    assert.equal(document.querySelectorAll("[data-avatar-scene]:not([disabled])").length, 1, mode);
    assert.ok(document.querySelector('[data-avatar-item="space-suit"][aria-pressed="true"]'), mode);
  }
});
