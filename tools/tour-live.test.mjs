#!/usr/bin/env node
/**
 * tour-live.test.mjs — the live tour's shared data stays true to its sources.
 *
 *   - tour/upgrade-check.js copies the lab's Language Upgrade item and checker for the projector and phones:
 *     the item must equal "lu68-argue-phones" in the lab's bank, and the checker must give the lab's own
 *     answer (checks and messages) on every sentence below.
 *   - Every question in shared/tour-live/prompts.js sits on a real stop of tour/stops.js, and every stop's link
 *     is a real Language Page address.
 *   - Both pages import only modules that exist, load no third-party host, and the projector no longer embeds
 *     its own copy of the stops or the checker.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { UPGRADE_ITEMS } from "../access-practice-lab/src/content/scaffold-items.js";
import { checkUpgrade as labCheck } from "../access-practice-lab/src/lang/scaffold-check.js";
import { PROMPTS, STOP_COUNT } from "../shared/tour-live/prompts.js";
import { STOPS } from "../tour/stops.js";
import { checkUpgrade, ITEM, resultBits } from "../tour/upgrade-check.js";

let passed = 0;
const t = async (name, fn) => {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
};
const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

await t("the tour's Upgrade item is the lab's lu68-argue-phones item", () => {
  const src = UPGRADE_ITEMS.find((i) => i.id === "lu68-argue-phones");
  assert.ok(src, "the lab item is gone");
  for (const k of ["informal", "avoid", "precision", "connectors", "minAdded", "hint"])
    assert.deepEqual(ITEM[k], src[k], k);
});

await t("the tour's checker gives the lab checker's answer on every sentence", () => {
  const src = UPGRADE_ITEMS.find((i) => i.id === "lu68-argue-phones");
  const sentences = [
    "",
    "Phones in class are bad.",
    "phones in class are BAD",
    "Phones in class are really really bad.",
    "Phones in class can be harmful because notifications distract students and break their focus during lessons.",
    "Phones are harmful.",
    "Notifications distract students so they lose focus in math and science lessons every single day.",
    "Because phones, students lose concentration.",
    "Although phones help with research, notifications break concentration during group work in class.",
    "Phones in class are bad because they are bad and bad.",
  ];
  for (const s of sentences) {
    const a = checkUpgrade(ITEM, s),
      b = labCheck(src, s);
    assert.deepEqual(a.checks, b.checks, s);
    assert.deepEqual(a.messages, b.messages, s);
    assert.equal(a.ok, b.ok, s);
  }
  assert.equal(resultBits({ detail: true, precision: false, connector: true }), "101");
});

await t(
  "every question sits on a real stop, and every stop links to a Language Page address",
  () => {
    assert.equal(STOPS.length, STOP_COUNT);
    for (const [id, p] of Object.entries(PROMPTS))
      assert.ok(STOPS[p.stop], `${id} sits on stop ${p.stop}`);
    for (const [i, s] of STOPS.entries()) {
      assert.ok(s.t && s.s && s.n?.length, `stop ${i} needs a title, a phone summary and notes`);
      assert.match(
        s.u,
        /^https:\/\/thelanguagepage\.com\/access-(practice-lab|teacher)\//,
        `stop ${i} link`,
      );
      assert.ok(Number.isInteger(s.b) && s.b >= 0, `stop ${i} builds`);
    }
  },
);

await t("both pages import modules that exist and load nothing from another host", () => {
  for (const page of ["tour/index.html", "tour/join/index.html"]) {
    const html = read(page);
    const dir = new URL(page.replace(/[^/]+$/, ""), root);
    for (const [, spec] of html.matchAll(/import\s+(?:[^"']+from\s+)?["']([^"']+)["']/g)) {
      const target = spec.startsWith("/") ? new URL(`.${spec}`, root) : new URL(spec, dir);
      assert.ok(existsSync(target), `${page} imports ${spec}, which does not exist`);
    }
    for (const [, url] of html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)["']/g))
      assert.match(url, /^https:\/\/thelanguagepage\.com\//, `${page} loads ${url}`);
    assert.equal(
      /fonts\.googleapis|fonts\.gstatic|cdn\./.test(html),
      false,
      `${page} loads a third-party asset`,
    );
    for (const [, font] of html.matchAll(/url\((\/assets\/fonts\/[^)]+)\)/g))
      assert.ok(
        existsSync(new URL(`./public${font}`, root)),
        `${page} names a missing font ${font}`,
      );
  }
  const deck = read("tour/index.html");
  assert.equal(
    deck.includes("const STOPS = ["),
    false,
    "the projector carries its own copy of the stops again",
  );
  assert.equal(
    deck.includes("function checkUpgrade"),
    false,
    "the projector carries its own copy of the checker again",
  );
  for (const name of new Set([...deck.matchAll(/shots\/([a-z-]+\.jpg)/g)].map((m) => m[1])))
    assert.ok(existsSync(new URL(`tour/shots/${name}`, root)), `tour/shots/${name} is missing`);
});

await t(
  "the doors stop shows the live home page's doors, and every door's picture exists",
  async () => {
    const deck = read("tour/index.html");
    const block = /const D2 = \[([\s\S]*?)\];/.exec(deck)?.[1];
    assert.ok(block, "the doors list is gone");
    const rows = [...block.matchAll(/\["([^"]+)", "([^"]+)", "([a-z-]+)", "([^"]+)"\]/g)];
    const { AUDIENCE_DOORS, DISTRICT_DOOR } = await import(
      "../access-practice-lab/src/views/home-audience.js"
    );
    assert.deepEqual(
      rows.slice(0, 4).map((r) => [r[1], r[2]]),
      AUDIENCE_DOORS.map((d) => [d.title[0], d.text[0]]),
      "the tour's doors no longer match the live home page (access-practice-lab/src/views/home-audience.js)",
    );
    assert.deepEqual([rows[4][1], rows[4][2]], [DISTRICT_DOOR.title[0], DISTRICT_DOOR.text[0]]);
    for (const r of rows)
      assert.ok(existsSync(new URL(`tour/shots/${r[3]}.jpg`, root)), `door picture ${r[3]}.jpg`);
    assert.equal(rows.length - 1, STOPS[2].b, "one build per audience door");
  },
);

await t("every question, choice and stop the audience reads has Spanish", () => {
  for (const [id, p] of Object.entries(PROMPTS)) {
    assert.ok(p.qEs && p.qEs !== p.q, `${id} has no Spanish question`);
    if (id === "upgrade" || id === "place") continue; // result bits; product names
    for (const c of p.choices)
      assert.ok(
        (c[2] && c[2] !== c[1]) || c[1] === "WIDA Data Studio",
        `${id}:${c[0]} has no Spanish label`,
      );
  }
  for (const [i, s] of STOPS.entries())
    assert.ok(s.tEs && s.sEs, `stop ${i} has no Spanish title and summary`);
  const page = read("tour/join/index.html");
  for (const [, key] of page.matchAll(/data-t="([a-zA-Z0-9]+)"/g))
    assert.match(page, new RegExp(`\\b${key}: \\[`), `data-t="${key}" has no entry in TX`);
});

console.log(`tour-live: ${passed} checks passed`);
