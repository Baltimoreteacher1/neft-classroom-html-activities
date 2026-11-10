// Practice Together copy: every { en, es } pair is complete and different, adult lines use "ustedes", routes come from
// data.js, and the Start links carry the return hint. Pure logic: no browser.
import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVITIES,
  ACTIVITY_BY_ID,
  FACTS,
  SUPPLEMENTAL,
} from "../access-practice-lab/src/intro/data.js";
import {
  FAMILY,
  FAMILY_ACTIVITIES,
  FAMILY_MORE,
  practiceAtHome,
} from "../access-practice-lab/src/intro/family-data.js";
import { RETURNS, withReturn } from "../access-practice-lab/src/intro/return-bar.js";

/** Every object that has an `en` or `es` key, with its path. */
function pairs(node, path = "", out = []) {
  if (Array.isArray(node)) node.forEach((v, i) => pairs(v, `${path}[${i}]`, out));
  else if (node && typeof node === "object") {
    if ("en" in node || "es" in node) out.push([path, node]);
    else for (const [k, v] of Object.entries(node)) pairs(v, `${path}.${k}`, out);
  }
  return out;
}
const ALL = pairs({ FAMILY, FAMILY_ACTIVITIES, FAMILY_MORE, practiceAtHome });

test("the walk finds the page copy", () => {
  assert.ok(ALL.length > 60, `expected many pairs, found ${ALL.length}`);
});

test("every pair has English and a different Spanish", () => {
  for (const [path, p] of ALL) {
    assert.equal(typeof p.en, "string", `${path}.en`);
    assert.equal(typeof p.es, "string", `${path}.es`);
    assert.ok(p.en.trim() && p.es.trim(), `${path} is empty`);
    assert.notEqual(p.es, p.en, `${path}: Spanish is identical to English`);
  }
});

test("Spanish follows the style guide: no usted, no tú, no vosotros, percent and ranges plain", () => {
  for (const [path, p] of ALL) {
    assert.ok(!/\busted\b|\bvosotros\b|\bvos\b/i.test(p.es), `${path}: usted/vos/vosotros`);
    assert.ok(
      !/\b(tú|tu|te|ti)\b/i.test(p.es.replace(/«[^»]*»/g, "")),
      `${path}: tú form in an adult line`,
    );
    assert.ok(!/\d %/.test(p.es), `${path}: spaced percent`);
  }
});

test("two choices: talk (hallway) and write (upgrade), routes from data.js", () => {
  assert.deepEqual(
    FAMILY_ACTIVITIES.map((a) => [a.id, a.activityId]),
    [
      ["talk", "hallway"],
      ["write", "upgrade"],
    ],
  );
  for (const a of FAMILY_ACTIVITIES) {
    assert.equal(a.route, ACTIVITY_BY_ID[a.activityId].route);
    assert.equal(a.activityName, ACTIVITY_BY_ID[a.activityId].name);
    assert.equal(a.steps.length, 3, `${a.id} has three steps`);
    assert.ok(a.example.label, `${a.id} example is labeled`);
  }
  assert.equal(FAMILY_ACTIVITIES[0].route, "/voice/ladder/school-hallway");
  assert.ok(
    FAMILY_ACTIVITIES[1].route.startsWith("/scaffold/language-upgrade?item=lu68-argue-phones"),
  );
  assert.ok(
    ACTIVITIES.some((a) => a.id === "hallway") && ACTIVITIES.some((a) => a.id === "upgrade"),
  );
});

test("the three steps follow the routine: look, try, share", () => {
  for (const a of FAMILY_ACTIVITIES)
    assert.deepEqual(
      a.steps.map((s) => s.head.en),
      ["Look at the example", "Try it together", "Share what you did"],
    );
});

test("More Practice lists exactly the supplemental resources, with their routes", () => {
  assert.deepEqual(
    FAMILY_MORE.map((m) => [m.id, m.route]),
    SUPPLEMENTAL.map((s) => [s.id, s.route]),
  );
});

test("account, saving, audio and microphone answers reuse data.js facts", () => {
  const by = Object.fromEntries(FAMILY.help.items.map((i) => [i.id, i.a.en]));
  assert.equal(by.account, FACTS.account);
  assert.ok(by.sound.startsWith(FACTS.audio));
  assert.equal(by.mic, FACTS.microphone);
});

test("help covers return, stop and sound, and links the device check", () => {
  const ids = FAMILY.help.items.map((i) => i.id);
  for (const id of ["account", "sound", "back", "stop"]) assert.ok(ids.includes(id), id);
  assert.equal(FAMILY.help.items.find((i) => i.id === "sound").link.route, "/tools");
  assert.match(FAMILY.help.items.find((i) => i.id === "back").a.en, /Back to Practice Together/);
});

test("practice at home has the four bullets", () => {
  assert.deepEqual(
    practiceAtHome.map((b) => b.id),
    ["choose", "together", "language", "stop"],
  );
});

test("no path or route contains 'teacher'; links stay in the lab", () => {
  const routes = [
    ...FAMILY_ACTIVITIES.map((a) => a.route),
    ...FAMILY_MORE.map((m) => m.route),
    FAMILY.links.siteGuide.route,
    FAMILY.links.familyCorner.route,
    ...FAMILY.help.items.filter((i) => i.link).map((i) => i.link.route),
  ];
  for (const r of routes) {
    assert.ok(r.startsWith("/"), r);
    assert.ok(!/teacher/i.test(r), r);
  }
  assert.equal(FAMILY.links.siteGuide.route, "/site-guide?for=family");
  assert.equal(FAMILY.links.familyCorner.route, "/family");
});

test("withReturn keeps the query and adds the together hint", () => {
  assert.ok(RETURNS.together);
  const href = withReturn(
    "/access-practice-lab/scaffold/language-upgrade?item=lu68-argue-phones",
    "together",
  );
  assert.equal(
    href,
    "/access-practice-lab/scaffold/language-upgrade?item=lu68-argue-phones&intro=together",
  );
  assert.equal(
    withReturn("/access-practice-lab/voice/ladder/school-hallway", "together"),
    "/access-practice-lab/voice/ladder/school-hallway?intro=together",
  );
});

test("copy never claims what the lab does not do", () => {
  const { spanishNote, ...page } = FAMILY; // the machine-assisted note names "translator" on purpose
  const text = JSON.stringify([page, FAMILY_ACTIVITIES, FAMILY_MORE]).toLowerCase();
  for (const bad of [
    "translat",
    "wida level",
    "proficiency",
    "score",
    "points",
    "streak",
    "certificate",
    "automatic",
  ])
    assert.ok(!text.includes(bad), `claims "${bad}"`);
  assert.ok(spanishNote.es.includes("máquina"));
});
