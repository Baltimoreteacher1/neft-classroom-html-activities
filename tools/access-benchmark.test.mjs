// Benchmark windows (Language Page feature #10): forms A/B/C as fall/winter/spring, saved by an explicit press,
// growth by domain as questions right out of the same number, never a level, band or percentage.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const bm = await import("../access-practice-lab/src/lang/benchmark.js");

const record = (date, sections) => ({ results: { meaningful: true, date, sections } });
const sec = (domain, correct, total, openDone = 0) => ({
  domain,
  correct,
  total,
  open: openDone ? 1 : 0,
  openDone,
});

test("each window is an existing practice form; 3-5 spring repeats Form A and says so", () => {
  for (const band of ["6-8", "3-5"])
    for (const w of bm.windowsFor(band))
      assert.ok(
        existsSync(
          new URL(`../access-practice-lab/content/tests/${w.testId}.json`, import.meta.url),
        ),
        w.testId,
      );
  assert.deepEqual(
    bm.windowsFor("6-8").map((w) => w.testId),
    ["model-form-a", "model-form-b", "model-form-c"],
  );
  assert.deepEqual(
    bm.windowsFor("3-5").map((w) => w.repeat),
    [false, false, true],
  );
});

test("a finished form is saveable once, and a retake never overwrites the earlier window", () => {
  let records = { "g35-form-a": record("2026-10-01", [sec("Reading", 3, 6)]) };
  const load = (id) => records[id] || {};
  let snaps = bm.normalizeSnapshots({});
  assert.deepEqual(
    bm.saveableWindows("3-5", snaps, load).map((w) => w.id),
    ["fall", "spring"],
  );
  snaps = bm.saveWindow(snaps, "3-5", "fall", load);
  assert.deepEqual(
    bm.saveableWindows("3-5", snaps, load),
    [],
    "the same result cannot fill spring too",
  );
  records = { "g35-form-a": record("2026-04-20", [sec("Reading", 5, 6)]) };
  snaps = bm.saveWindow(snaps, "3-5", "spring", load);
  assert.equal(snaps["3-5"].fall.domains.Reading.correct, 3);
  assert.equal(snaps["3-5"].spring.domains.Reading.correct, 5);
});

test("growth compares questions right out of the same number; speaking and writing are never scored", () => {
  const snaps = bm.normalizeSnapshots({
    "6-8": {
      fall: {
        date: "a",
        domains: {
          Reading: { correct: 2, total: 6 },
          Listening: { correct: 4, total: 6 },
          Speaking: { openDone: 1 },
        },
      },
      winter: {
        date: "b",
        domains: {
          Reading: { correct: 5, total: 6 },
          Listening: { correct: 3, total: 5 },
          Speaking: { openDone: 1 },
        },
      },
    },
  });
  const g = bm.benchmarkGrowth("6-8", snaps);
  const row = (d) => g.rows.find((r) => r.domain === d);
  assert.deepEqual(row("Reading").change, { from: "fall", to: "winter", diff: 3, of: 6 });
  assert.deepEqual(row("Listening").change, { withheld: true });
  assert.equal(row("Speaking").change, null);
  assert.equal(row("Speaking").cells[0].state, "review");
  assert.equal(row("Writing").cells[0].state, "none");
});

test("broken saved data never throws and never invents a window", () => {
  assert.deepEqual(bm.normalizeSnapshots("nope"), { "6-8": {}, "3-5": {} });
  assert.deepEqual(bm.normalizeSnapshots({ "6-8": { fall: { domains: null } } })["6-8"], {});
  assert.equal(bm.windowResult({ results: { meaningful: false, sections: [] } }), null);
});

test("the panel renders on the Practice tests page with no level, percentage or prediction wording", async () => {
  const dom = new JSDOM("<body></body>", { url: "https://example.test/access-practice-lab/tests" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "localStorage", {
    value: dom.window.localStorage,
    configurable: true,
  });
  dom.window.localStorage.setItem(
    bm.BENCHMARK_KEY,
    JSON.stringify({
      "6-8": {
        fall: { date: "2026-10-01T00:00:00Z", domains: { Reading: { correct: 2, total: 6 } } },
        winter: { date: "2026-01-20T00:00:00Z", domains: { Reading: { correct: 4, total: 6 } } },
      },
    }),
  );
  const { benchmarkPanelHTML } = await import(
    "../access-practice-lab/src/views/benchmark-panel.js"
  );
  const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
  const { toHtml } = await import("../access-practice-lab/src/util.js");
  for (const mode of ["en", "es", "bi"]) {
    document.body.innerHTML = toHtml(benchmarkPanelHTML(makeI18n(mode), "6-8"));
    const text = document.body.textContent;
    assert.ok(document.querySelector("table.benchmark-table"), mode);
    assert.doesNotMatch(text, /%|WIDA level|nivel de WIDA|predict/i, mode);
    assert.equal(document.querySelectorAll("a[href$='/test/model-form-c']").length, 1);
  }
  assert.match(document.body.textContent, /2 more right \(of 6\)/);
  const page = readFileSync(
    new URL("../access-practice-lab/src/views/tests.js", import.meta.url),
    "utf8",
  );
  assert.match(page, /benchmarkPanelHTML\(I, ctx\.band\)/);
});
