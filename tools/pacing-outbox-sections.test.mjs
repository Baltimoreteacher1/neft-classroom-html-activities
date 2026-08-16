#!/usr/bin/env node
/**
 * The offline outbox must not replay one class's edit into another.
 *
 * THE FAILURE THIS PREVENTS, concretely: a teacher edits Monday for 601 on
 * classroom wifi that has just dropped. The write goes into localStorage. They
 * switch to 602 to set up the next period. The network comes back, the outbox
 * drains — and if the queued operation is sent to "whatever class is selected
 * now", 601's change lands in 602. Both classes are then wrong, silently, and
 * the planner reported Saved.
 *
 * The fix is that the operation is STAMPED with its class when it is queued, and
 * drain() sends each entry to the section recorded on it. This file proves that
 * by driving the real store module against a fake localStorage and a fake fetch,
 * so the assertion is about the shipped code path rather than a description of
 * it.
 *
 * It also pins the cache-key separation: overlays are stored per layer
 * (`nt-pacing:overlay:shared`, `:601`, …), because a single cache key would
 * serve 601's plan to 602 on the next open, offline, with nothing to contradict
 * it.
 */
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

/* planning-store.js imports "/shared/pacing/sections.js" — a browser-absolute
 * path the site serves and node cannot resolve. Rather than weaken the shipped
 * import to a relative one just so a test can load it (which would make the
 * source worse to satisfy the harness), map site-absolute specifiers onto the
 * repo. This is the same class of problem as the @engine/* Vite aliases. */
const ROOT = new URL("..", import.meta.url).href;
register(
  `data:text/javascript,
   export function resolve(specifier, context, next) {
     if (specifier.startsWith("/shared/") || specifier.startsWith("/assets/")) {
       return next(${JSON.stringify(ROOT)} + specifier.slice(1), context);
     }
     return next(specifier, context);
   }`,
  pathToFileURL("./"),
);

/* ── Minimal browser surface the store needs ───────────────────────────────── */

class FakeStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    this.map.set(k, String(v));
  }
  removeItem(k) {
    this.map.delete(k);
  }
}

const sent = [];
let failNext = false;

globalThis.localStorage = new FakeStorage();
globalThis.window = { addEventListener() {} };
globalThis.location = { search: "" };
globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(url, "https://example.test");
  sent.push({
    path: u.pathname,
    section: u.searchParams.get("section"),
    body: opts.body ? JSON.parse(opts.body) : null,
  });
  if (failNext) {
    failNext = false;
    return { ok: false, status: 503, json: async () => ({ error: "offline" }) };
  }
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true, overlay: {}, sharedOverlay: {}, classOverlay: {} }),
  };
};

const store = await import("../curriculum/planning/planning-store.js");

let passed = 0;
function t(name, fn) {
  return Promise.resolve(fn()).then(() => {
    passed++;
    console.log(`  ok  ${name}`);
  });
}

const reset = () => {
  globalThis.localStorage = new FakeStorage();
  sent.length = 0;
};

const op = (date, lessonId) => ({
  writes: [{ date, plan: { dayType: "Core Lesson", lessonId } }],
  inverse: [],
  kind: "edit",
  summary: `set ${lessonId}`,
});

/* ── Section context ───────────────────────────────────────────────────────── */

await t("the active class is read from and written to the shared teacher key", () => {
  reset();
  assert.equal(store.activeSection(), "", "no stored class should mean the shared plan");
  store.setActiveSection("602");
  assert.equal(store.activeSection(), "602");
  const raw = JSON.parse(localStorage.getItem("curriculumTeacherWorkflow:v1"));
  assert.equal(raw.section, "602", "the planner wrote to its own private key instead");
});

await t("an unknown class is not adopted", () => {
  reset();
  store.setActiveSection("604");
  assert.equal(store.activeSection(), "", "an invalid class became the active class");
});

await t("switching class preserves any unrelated teacher state", () => {
  reset();
  localStorage.setItem(
    "curriculumTeacherWorkflow:v1",
    JSON.stringify({ section: "601", lessonId: "5-3", unit: "5" }),
  );
  store.setActiveSection("603");
  const raw = JSON.parse(localStorage.getItem("curriculumTeacherWorkflow:v1"));
  assert.equal(raw.section, "603");
  assert.equal(raw.lessonId, "5-3", "switching class discarded the selected lesson");
  assert.equal(raw.unit, "5");
});

/* ── The isolation property ────────────────────────────────────────────────── */

await t("an offline 601 edit replays into 601 even after switching to 602", async () => {
  reset();
  store.setActiveSection("601");
  failNext = true; // the write fails: it stays in the outbox
  const first = await store.enqueue(op("2026-09-14", "5-3"), "601");
  assert.equal(first.status, "pending", "the failed write was reported as saved");
  assert.equal(store.pendingCount(), 1);

  // The teacher moves on to the next period before the network returns.
  store.setActiveSection("602");
  assert.equal(store.activeSection(), "602");

  sent.length = 0;
  const drained = await store.drain();
  assert.equal(drained.status, "saved");
  const writes = sent.filter((r) => r.path.endsWith("/writes"));
  assert.equal(writes.length, 1);
  assert.equal(
    writes[0].section,
    "601",
    "the queued 601 edit was replayed into the class that happened to be selected",
  );
});

await t("queued edits from two classes each go to their own class, in order", async () => {
  reset();
  failNext = true;
  await store.enqueue(op("2026-09-14", "5-1"), "601");
  failNext = true;
  await store.enqueue(op("2026-09-15", "5-2"), "603");
  assert.equal(store.pendingCount(), 2);

  sent.length = 0;
  await store.drain();
  const writes = sent.filter((r) => r.path.endsWith("/writes"));
  assert.deepEqual(
    writes.map((w) => w.section),
    ["601", "603"],
    "queued operations lost their class, or their order",
  );
});

/* ── Cache separation ──────────────────────────────────────────────────────── */

await t("each layer is cached under its own key", async () => {
  reset();
  await store.enqueue(op("2026-09-14", "5-1"), "601");
  await store.enqueue(op("2026-09-14", "5-9"), "602");
  assert.ok(localStorage.getItem("nt-pacing:overlay:601"), "601 has no cache of its own");
  assert.ok(localStorage.getItem("nt-pacing:overlay:602"), "602 has no cache of its own");
  const c601 = JSON.parse(localStorage.getItem("nt-pacing:overlay:601"));
  const c602 = JSON.parse(localStorage.getItem("nt-pacing:overlay:602"));
  assert.equal(c601["2026-09-14"].plan.lessonId, "5-1");
  assert.equal(c602["2026-09-14"].plan.lessonId, "5-9", "602's cache holds 601's lesson");
});

await t("the composed overlay is shared-plus-class, per class", async () => {
  reset();
  await store.enqueue(op("2026-09-14", "5-0"), ""); // a shared-plan edit
  await store.enqueue(op("2026-09-15", "5-7"), "601"); // 601 only

  const shared = store.cachedOverlay("");
  assert.equal(shared["2026-09-14"].plan.lessonId, "5-0");
  assert.equal(shared["2026-09-15"], undefined, "a class edit leaked into the shared plan");

  const c601 = store.cachedOverlay("601");
  assert.equal(c601["2026-09-14"].plan.lessonId, "5-0", "601 did not inherit the shared plan");
  assert.equal(c601["2026-09-15"].plan.lessonId, "5-7");

  const c602 = store.cachedOverlay("602");
  assert.equal(c602["2026-09-14"].plan.lessonId, "5-0", "602 did not inherit the shared plan");
  assert.equal(c602["2026-09-15"], undefined, "601's own edit is visible from 602");
});

await t("reads and writes carry the class on the query string", async () => {
  reset();
  sent.length = 0;
  await store.fetchState("603");
  const state = sent.find((r) => r.path.endsWith("/state"));
  assert.equal(state.section, "603");

  sent.length = 0;
  await store.resetDay("2026-09-14", "602");
  const del = sent.find((r) => r.path.includes("/day/"));
  assert.equal(del.section, "602", "a day reset was not scoped to its class");
});

await t("the shared plan sends no section, which is what v1 callers did", async () => {
  reset();
  sent.length = 0;
  await store.fetchState("");
  const state = sent.find((r) => r.path.endsWith("/state"));
  assert.equal(state.section, null, "the shared plan invented a section parameter");
});

console.log(`\npacing outbox sections: ${passed} assertions passed.`);
