// The header grade switch (access-practice-lab/src/wayfinding.js): where each kind of page sends the learner when the
// grade changes. Band-neutral pages stay put; band-specific pages go to their section hub; nothing dead-ends.
import assert from "node:assert/strict";
import { test } from "node:test";

const { toHtml } = await import(new URL("../access-practice-lab/src/util.js", import.meta.url));
const { gradeSwitchTarget, gradeSelectHTML } = await import(
  new URL("../access-practice-lab/src/wayfinding.js", import.meta.url)
);
const BASE = "/access-practice-lab";
const open = (r) =>
  ["home", "explore", "early", "activity", "room", "library", "passport"].includes(r.view);

test("home goes home for the new grade", () => {
  assert.equal(gradeSwitchTarget({ view: "home" }, "3-5"), `${BASE}/?grades=3-5`);
});
test("band-neutral pages stay on the same page", () => {
  assert.equal(gradeSwitchTarget({ view: "library", id: "" }, "3-5"), `${BASE}/library?grades=3-5`);
  assert.equal(gradeSwitchTarget({ view: "explore", id: "" }, "6-8"), `${BASE}/explore?grades=6-8`);
  assert.equal(
    gradeSwitchTarget({ view: "site-guide", id: "" }, "6-8"),
    `${BASE}/site-guide?grades=6-8`,
  );
});
test("the family hub keeps a grade choice when the header grade changes", () => {
  assert.equal(
    gradeSwitchTarget({ view: "family-start" }, "6-8"),
    `${BASE}/family-start?pick=6-8&grades=6-8`,
  );
  assert.equal(
    gradeSwitchTarget({ view: "family-start" }, "3-5"),
    `${BASE}/family-start?pick=4-5&grades=3-5`,
  );
});
test("the Resource Finder keeps its query and filters when the header grade changes", () => {
  const target = gradeSwitchTarget({ view: "search" }, "6-8", {
    currentSearch: "?for=family&kind=practice&q=reading%20stories&grades=3-5",
  });
  const url = new URL(target, "https://thelanguagepage.com");
  assert.equal(url.pathname, `${BASE}/search`);
  assert.equal(url.searchParams.get("grades"), "6-8");
  assert.equal(url.searchParams.get("for"), "family");
  assert.equal(url.searchParams.get("kind"), "practice");
  assert.equal(url.searchParams.get("q"), "reading stories");
});
test("an explore hub keeps its section", () => {
  assert.equal(
    gradeSwitchTarget({ view: "explore", id: "practice" }, "3-5", { canOpen: open }),
    `${BASE}/explore/practice?grades=3-5`,
  );
});
test("a band-specific activity goes to its section hub, never to another band's activity", () => {
  const to = gradeSwitchTarget({ view: "activity", domain: "Listening", id: "l-1" }, "3-5");
  assert.match(to, /^\/access-practice-lab\/(explore\/[a-z]+\?grades=3-5|\?grades=3-5)$/);
});
test("a page an early band cannot open falls back to a hub it can open, or home", () => {
  assert.match(
    gradeSwitchTarget({ view: "start", id: "" }, "K", { canOpen: open }),
    /^\/access-practice-lab\/(explore\/teach\?grades=K|\?grades=K)$/,
  );
  assert.equal(
    gradeSwitchTarget({ view: "start", id: "" }, "K", { canOpen: () => false }),
    `${BASE}/?grades=K`,
  );
});
test("the select lists every band and marks the current one", () => {
  const I = { T: (a) => a, S: (a) => a };
  const out = toHtml(gradeSelectHTML({ band: "6-8", bands: ["K", "3-5", "6-8"] }, I));
  assert.equal((out.match(/<option/g) || []).length, 3);
  assert.match(out, /value="6-8" selected/);
  assert.equal(toHtml(gradeSelectHTML({ band: "6-8", bands: ["6-8"] }, I)), "");
});
