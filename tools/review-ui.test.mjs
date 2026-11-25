// Studio review UI: badges, the "Reviewed units only" toggle, the side-by-side diff, and the reviewer queue and
// detail views driven in jsdom against a stubbed /api/review. Negative controls: a failed summary must not hide
// units, and a decision request must never carry a hash, date or non-human actor.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><main id=root></main>", {
  url: "https://test.local/bcpss-teachers/studio/",
});
for (const k of ["window", "document", "localStorage", "sessionStorage", "Node", "Blob", "URL"]) {
  if (k === "URL") continue;
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });
}
const calls = [];
let routes = {};
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  const handler = routes[String(url).split("?")[0]];
  if (!handler) return new Response("{}", { status: 404 });
  const out = await handler(String(url), init);
  return new Response(JSON.stringify(out.body), { status: out.status || 200 });
};

const { REVIEWED_ONLY_KEY, badge, loadUnitStates, reviewedOnly, setReviewedOnly, visibleUnits } =
  await import("../bcpss-teachers/studio/views/review/badges.js");
const { changedCount, diffLines, linesOf } = await import(
  "../bcpss-teachers/studio/views/review/diff.js"
);
const { render } = await import("../bcpss-teachers/studio/views/review/queue.js");
const { parseHash, VIEW_FOR } = await import("../bcpss-teachers/studio/core/router.js");

const UNITS = [{ id: "u1" }, { id: "u2" }, { id: "u3" }];
const tick = () => new Promise((r) => setTimeout(r, 20));

test("toggle: ewl_ key, default OFF, persists, never throws when storage is blocked", () => {
  assert.match(REVIEWED_ONLY_KEY, /^ewl_/);
  assert.equal(reviewedOnly(), false); // decision D19: default OFF
  setReviewedOnly(true);
  assert.equal(localStorage.getItem(REVIEWED_ONLY_KEY), "1");
  assert.equal(reviewedOnly(), true);
  setReviewedOnly(false);
  assert.equal(reviewedOnly(), false);
  const real = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("blocked");
    },
  });
  assert.equal(reviewedOnly(), false);
  assert.doesNotThrow(() => setReviewedOnly(true));
  Object.defineProperty(globalThis, "localStorage", real);
});

test("visibleUnits: reviewed only hides drafts; unknown state never hides anything", () => {
  const states = { u1: "reviewed", u2: "draft", u3: "in_review" };
  assert.deepEqual(visibleUnits(UNITS, states, false), UNITS);
  assert.deepEqual(visibleUnits(UNITS, states, true), [{ id: "u1" }]);
  assert.deepEqual(visibleUnits(UNITS, null, true), UNITS); // summary unavailable: fail open
  assert.deepEqual(visibleUnits(UNITS, {}, true), []); // known and empty: nothing is reviewed
});

test("badge: written state with an explanation; a failed summary yields null, not a draft", async () => {
  const b = badge("in_review", { detail: "2 of 9 parts reviewed." });
  assert.equal(b.textContent, "In review");
  assert.match(b.title, /2 of 9 parts reviewed/);
  assert.equal(b.dataset.state, "in_review");
  assert.equal(badge("nonsense"), null);
  routes = { "/api/review/summary": () => ({ status: 503, body: { ok: false } }) };
  assert.equal(await loadUnitStates(), null);
  routes = { "/api/review/summary": () => ({ body: { ok: true, units: { u1: "reviewed" } } }) };
  assert.deepEqual(await loadUnitStates(), { u1: "reviewed" });
});

test("review.css uses the design tokens only: no raw colors, so no purple or violet can appear", () => {
  const css = readFileSync(
    new URL("../bcpss-teachers/studio/views/review/review.css", import.meta.url),
    "utf8",
  );
  assert.deepEqual(css.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi), null);
  assert.ok(!/purple|violet|indigo|magenta/i.test(css));
});

test("diff: changed, added and removed lines are paired; identical content has no change", () => {
  const before = linesOf({ a: 1, list: ["x", "y"], z: "same" });
  const after = linesOf({ z: "same", a: 2, list: ["x", "y", "w"] });
  const rows = diffLines(before, after);
  assert.ok(changedCount(rows) >= 3);
  assert.ok(rows.some((r) => r.kind === "removed" && /"a": 1/.test(r.left)));
  assert.ok(rows.some((r) => r.kind === "added" && /"a": 2/.test(r.right)));
  assert.ok(rows.some((r) => r.kind === "added" && /"w"/.test(r.right)));
  assert.equal(changedCount(diffLines(before, before)), 0); // control
  assert.equal(linesOf({ b: 1, a: 2 }).join(""), linesOf({ a: 2, b: 1 }).join("")); // key order is irrelevant
});

test("route: #/review and #/review/<blockId> reach the queue view", () => {
  assert.equal(VIEW_FOR.review, "review/queue");
  assert.equal(parseHash("#/review").view, "review/queue");
  const r = parseHash("#/review/g6-math-u1%3Astudio");
  assert.equal(r.view, "review/queue");
  assert.equal(r.params.id, "g6-math-u1:studio");
});

const ITEM = {
  id: "g6-math-u1-l01",
  kind: "lesson",
  unitId: "g6-math-u1",
  grade: "6",
  subject: "math",
  title: "Meet decompose",
  badge: "in_review",
  states: { pedagogy: "in_review", language_qa: "draft" },
  age_days: 2,
  verifierFailures: {},
  verifierFailureTotal: 0,
};

function labelled(root) {
  const bad = [];
  for (const el of root.querySelectorAll("input, select, textarea")) {
    const ok =
      el.getAttribute("aria-label") || (el.id && root.querySelector(`label[for="${el.id}"]`));
    if (!ok) bad.push(el.outerHTML.slice(0, 80));
  }
  return bad;
}

test("queue view: asks for the key first, then lists blocks; every control is labelled", async () => {
  sessionStorage.clear();
  routes = {
    "/api/review/queue": () => ({
      body: { ok: true, total: 1, limit: 50, offset: 0, items: [ITEM] },
    }),
  };
  const root = document.getElementById("root");
  await render({ root, params: {}, shell: {} });
  assert.match(root.textContent, /Reviewer sign-in/);
  assert.equal(root.querySelector("input[type=password]").required, true);
  assert.deepEqual(labelled(root), []);

  sessionStorage.setItem("ewl.review.teacherKey", "k");
  sessionStorage.setItem(
    "ewl.review.reviewer",
    JSON.stringify({ name: "Pat Reviewer", role: "language" }),
  );
  await render({ root, params: {}, shell: {} });
  assert.match(root.textContent, /Meet decompose/);
  assert.match(root.textContent, /Pedagogy: in review/);
  assert.equal(calls.at(-1).init.headers["x-teacher-key"], "k");
  assert.deepEqual(labelled(root), []);
  assert.ok(root.querySelector("a[href='#/review/g6-math-u1-l01']"));

  // a 401 clears the key and returns to sign-in
  routes = {
    "/api/review/queue": () => ({ status: 401, body: { ok: false, error: "unauthorized" } }),
  };
  await render({ root, params: {}, shell: {} });
  assert.match(root.textContent, /not accepted/);
  assert.equal(sessionStorage.getItem("ewl.review.teacherKey") || "", "");
});

test("detail view: shows the diff and sends a decision with a human actor and no hash or date", async () => {
  sessionStorage.setItem("ewl.review.teacherKey", "k");
  sessionStorage.setItem(
    "ewl.review.reviewer",
    JSON.stringify({ name: "Pat Reviewer", role: "language" }),
  );
  const detail = {
    ok: true,
    block: {
      id: ITEM.id,
      kind: "lesson",
      unitId: "g6-math-u1",
      grade: "6",
      subject: "math",
      content: { title: "New title", n: 2 },
      provenance: { origin: "generated", version: 3 },
      review: {},
    },
    states: { pedagogy: "in_review", language_qa: "draft" },
    badge: "in_review",
    lastReviewed: {
      snapshot: { title: "Old title", n: 2 },
      reviewer_name: "Sam Rivera",
      reviewer_date: "2026-11-01",
    },
    history: [
      {
        reviewer_date: "2026-11-01",
        reviewer_name: "Sam Rivera",
        reviewer_role: "pedagogy",
        dimension: "pedagogy",
        from_state: "in_review",
        to_state: "reviewed",
        comment: "",
      },
    ],
  };
  let posted = null;
  routes = {
    [`/api/review/block/${ITEM.id}`]: () => ({ body: detail }),
    "/api/review/decide": (_u, init) => {
      posted = JSON.parse(init.body);
      return { body: { ok: true, event: { to: "reviewed" } } };
    },
  };
  const root = document.getElementById("root");
  await render({ root, params: { id: ITEM.id }, shell: {} });
  assert.match(root.textContent, /changed since Sam Rivera approved it on 2026-11-01/);
  assert.ok(root.querySelector(".st-rv-diff [data-kind=removed]"));
  assert.ok(root.querySelector(".st-rv-diff [data-kind=added]"));
  assert.deepEqual(labelled(root), []);
  const approve = [...root.querySelectorAll("button")].find((b) => b.textContent === "Approve");
  approve.click();
  await tick();
  assert.deepEqual(Object.keys(posted).sort(), ["blockId", "dimension", "reviewer", "state"]);
  assert.deepEqual(posted.reviewer, { name: "Pat Reviewer", role: "language", actor: "human" });
  assert.equal(posted.state, "reviewed");
  assert.ok(!/hash|date/i.test(JSON.stringify(posted)));
});

test("Find results: unit cards carry badges; the toggle hides drafts; a failed summary hides nothing", async () => {
  const { unitsBlock } = await import("../bcpss-teachers/studio/views/find-results.js");
  const seed = [1, 2, 3].map((n) => ({
    id: `u${n}`,
    unit_number: n,
    unit_title: `Unit ${n} title`,
    unit_summary: "",
    core_standards: [],
    grade: "6",
  }));
  const shell = {
    catalog: { seedUnits: async () => seed },
    library: { addRecent() {}, isFavorite: () => false, toggleFavorite() {} },
  };
  const st = { grade: "6", subject: "math", q: "" };
  const cards = (box) => [...box.querySelectorAll(".st-card-title a")].map((a) => a.textContent);
  const badges = (box) => [...box.querySelectorAll(".st-rv-badge")].map((b) => b.textContent);

  localStorage.clear();
  const realNow = Date.now;
  const later = (ms) => {
    const base = realNow();
    Date.now = () => base + ms; // the summary is cached for 60 s; step past it so each phase fetches afresh
  };
  later(200_000);
  routes = {
    "/api/review/summary": () => ({
      body: { ok: true, units: { u1: "reviewed", u2: "draft", u3: "in_review" } },
    }),
  };
  let box = unitsBlock(st, shell, () => true);
  await tick();
  assert.equal(cards(box).length, 3); // default OFF shows everything
  assert.deepEqual(badges(box), ["Reviewed", "Draft", "In review"]);
  const toggle = box.querySelector("#st-rv-only");
  assert.equal(toggle.checked, false);
  toggle.checked = true;
  toggle.dispatchEvent(new dom.window.Event("change"));
  assert.deepEqual(cards(box), ["Unit 1: Unit 1 title"]);
  assert.equal(localStorage.getItem(REVIEWED_ONLY_KEY), "1");

  // negative control: summary unreachable and the toggle ON -> every unit still shows, with no badges
  localStorage.setItem(REVIEWED_ONLY_KEY, "1");
  routes = {};
  later(400_000);
  box = unitsBlock(st, shell, () => true);
  await tick();
  Date.now = realNow;
  assert.equal(cards(box).length, 3);
  assert.deepEqual(badges(box), []);
  localStorage.clear();
});
