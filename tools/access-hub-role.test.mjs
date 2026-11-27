// The Teacher Hub follows the teacher's role: the home's Classroom and ESOL Teacher doors link to /access-teacher/?role=…,
// and "Go straight to" (access-teacher/hub-role.js) puts that role's resources first. Order and heading change only:
// every role still reaches every card, and an unknown ?role= changes nothing.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { roleFromSearch, TEACHER_ROLES } from "../access-practice-lab/src/audience.js";

const HUB = readFileSync(new URL("../access-teacher/index.html", import.meta.url), "utf8");
const dom = new JSDOM(HUB, { url: "https://thelanguagepage.com/access-teacher/" });
globalThis.window ??= dom.window;
globalThis.localStorage ??= dom.window.localStorage;
const { applyRole, orderLibrary } = await import("../access-teacher/hub-role.js");

const cardIds = (doc) =>
  [...doc.querySelectorAll("#thLibrary .th-lib-grid > li")].map((li) => li.dataset.libId);

test("?role= names a known role or nothing", () => {
  assert.equal(roleFromSearch("?role=esol"), "esol");
  assert.equal(roleFromSearch("?grades=6-8&role=classroom"), "classroom");
  assert.equal(roleFromSearch("?role=admin"), "");
  assert.equal(roleFromSearch(""), "");
});

test("every role orders every hub card, and hides none", () => {
  const all = cardIds(dom.window.document);
  assert.equal(all.length, 10, "the hub has ten Go straight to cards, each with a data-lib-id");
  assert.equal(new Set(all).size, all.length);
  for (const role of TEACHER_ROLES) {
    assert.deepEqual(
      [...role.library].sort(),
      [...all].sort(),
      `${role.id} lists exactly the hub's cards`,
    );
    assert.ok(
      role.heading?.[0] && role.heading?.[1],
      `${role.id} has an English and Spanish heading`,
    );
  }
});

test("the ESOL role puts WIDA data and practice tests first; the classroom role the curriculum bridges", () => {
  const doc = new JSDOM(HUB, { url: "https://thelanguagepage.com/access-teacher/" }).window
    .document;
  assert.deepEqual(applyRole(doc, "esol").slice(0, 2), ["data", "tests"]);
  assert.deepEqual(cardIds(doc).slice(0, 2), ["data", "tests"]);
  assert.equal(doc.getElementById("thLibraryTitle").textContent, "Your ESOL toolkit");
  assert.equal(applyRole(doc, "classroom")[0], "bcpss");
  assert.equal(doc.getElementById("thLibraryTitle").textContent, "For your classroom");
  assert.equal(cardIds(doc).length, 10, "reordering never drops a card");
});

test("unknown cards keep their place at the end", () => {
  const doc = new JSDOM(
    `<ul><li data-lib-id="x"></li><li data-lib-id="b"></li><li data-lib-id="a"></li></ul>`,
  ).window.document;
  assert.deepEqual(orderLibrary(doc.querySelector("ul"), ["a", "b"]), ["a", "b", "x"]);
});

test("the home links both teacher doors to their role", () => {
  const src = readFileSync(
    new URL("../access-practice-lab/src/views/home-audience.js", import.meta.url),
    "utf8",
  );
  assert.match(src, /"\/access-teacher\/classroom\/"/);
  assert.match(src, /"\/access-teacher\/\?role=esol"/);
  assert.match(HUB, /hub-role\.js"\)\.then\(\(m\) => m\.mountHubRole\(document\)\)/);
});
