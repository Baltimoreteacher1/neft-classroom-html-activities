/* Star messages and the lab stamp: no replay of old progress, one stamp per lab, and accessible markup. */
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<body><div id='host'></div></body>");
globalThis.document = dom.window.document;
const { createCelebrator, diff } = await import("../curriculum/learning-labs/shared/celebrate.mjs");

const ids = ["brief", "learn", "investigate", "practice", "create", "games"];
const progress = (done) => ({
  items: ids.map((id, i) => ({ id, status: i < done ? "done" : "new" })),
  done,
  total: 6,
});
const lab = { icon: "🟦", title: "Hundred-Square Studio", finale: "Pixel Passport", unit: 4 };

assert.deepEqual(diff(new Map(ids.map((id) => [id, "new"])), progress(2)), {
  finished: ["brief", "learn"],
  complete: false,
});
assert.equal(
  diff(new Map(ids.map((id) => [id, "done"])), progress(6)).complete,
  false,
  "nothing new, nothing to celebrate",
);

// 1. a lab finished long ago is stamped silently, never replayed
{
  document.body.innerHTML = "<div id='host'></div>";
  const state = { stamped: 0 };
  const c = createCelebrator(document.getElementById("host"), lab, state);
  c.update(progress(6));
  assert.ok(state.stamped, "already-complete lab is marked stamped");
  assert.equal(document.querySelector(".lab-stamp"), null, "no stamp card replayed on load");
  assert.equal(document.querySelector(".cheer-toast").textContent, "", "no toast replayed on load");
}
// 2. live progress: stars, then the stamp exactly once
{
  document.body.innerHTML = "<div id='host'></div>";
  const state = { stamped: 0 };
  let saved = 0;
  const c = createCelebrator(document.getElementById("host"), lab, state, () => {
    saved++;
  });
  c.update(progress(0));
  c.update(progress(1));
  const toast = document.querySelector(".cheer-toast");
  assert.match(toast.textContent, /Mission set/);
  assert.match(toast.textContent, /1 of 6 stars/);
  assert.equal(toast.getAttribute("role"), "status");
  c.update(progress(5));
  assert.equal(document.querySelector(".lab-stamp"), null, "no stamp before the last activity");
  c.update(progress(6));
  const card = document.querySelector(".lab-stamp");
  assert.ok(card, "stamp card appears");
  assert.match(card.textContent, /Pixel Passport/);
  assert.ok(
    card.querySelector('a[href="/curriculum/learning-labs/#unit-4"]'),
    "links back to the passport",
  );
  assert.equal(saved, 1, "stamp is persisted once");
  c.update(progress(6));
  c.update(progress(5));
  c.update(progress(6));
  assert.equal(document.querySelectorAll(".lab-stamp").length, 1, "never a second stamp");
  card.querySelector(".stamp-close").click();
  assert.equal(document.querySelector(".lab-stamp"), null, "can be dismissed");
}
console.log("learning-labs-celebrate: stars, silent catch-up, single stamp OK.");
