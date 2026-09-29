#!/usr/bin/env node
/** Exercise the real palette actions with denied browser capabilities and failed requests. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const source = readFileSync(
  new URL("../assets/curriculum-product-upgrades.js", import.meta.url),
  "utf8",
);
const code = (progress = {}, lastLesson = "3-2") =>
  Buffer.from(JSON.stringify({ v: 1, progress, lastLesson })).toString("base64url");
const tick = () => new Promise((resolve) => setImmediate(resolve));
const tests = [];
const test = (name, action) => tests.push({ name, action });
async function using(options, action) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://eduwonderlab.com/curriculum/",
    runScripts: "outside-only",
  });
  const { window } = dom;
  const catalog = { lessons: [{ id: "3-2", title: "Unit rates", resources: {} }] };
  window.NTJsonCache = {
    json: async () => {
      if (options.catalogFailure) throw new Error("Network unavailable");
      return catalog;
    },
  };
  window.CurriculumCockpit = { getSelected: () => "3-2" };
  window.requestAnimationFrame = () => 0;
  const timers = [];
  window.setTimeout = (callback, delay) => timers.push({ callback, delay });
  const writes = [];
  const requests = [];
  window.fetch = async (url) => {
    requests.push(url);
    if (options.fetchFailure) throw new Error("offline");
    return { ok: options.responseOk ? options.responseOk(url) : true };
  };
  if (!options.noCache)
    window.caches = {
      open: async () => {
        if (options.cacheFailure) throw new Error("Storage denied");
        return {
          put: async (url) => {
            if (options.putFailure) throw new Error("Quota");
            writes.push(url);
          },
        };
      },
    };
  if (options.clipboard)
    Object.defineProperty(window.navigator, "clipboard", { value: options.clipboard });
  if (options.storageDenied)
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw new Error("Denied");
      },
    });
  else if (options.writeDenied)
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("Quota");
        },
      },
    });
  window.prompt = () => options.importCode || null;
  window.eval(source);
  await tick();
  const status = window.document.querySelector(".cpu-palette-status");
  const click = async (label) => {
    const button = [...window.document.querySelectorAll(".cpu-quick-actions button")].find(
      (node) => node.textContent === label,
    );
    assert.ok(button, label);
    button.click();
    await tick();
    return button;
  };
  try {
    await action({ window, status, click, writes, requests, timers });
  } finally {
    window.close();
  }
}

test("clipboard success reports a completed copy", () =>
  using(
    {
      clipboard: {
        writeText: async (value) => {
          assert.equal(JSON.parse(Buffer.from(value, "base64url")).lastLesson, "3-2");
        },
      },
    },
    async ({ click, status, window }) => {
      await click("Copy continuity code");
      assert.match(status.textContent, /^Copied\./);
      assert.equal(window.document.getElementById("cpu-manual-copy"), null);
    },
  ));
for (const [name, clipboard] of [
  ["missing", undefined],
  [
    "denied",
    {
      writeText: async () => {
        throw new Error("Denied");
      },
    },
  ],
]) {
  test(`${name} clipboard offers the actual selected code without claiming success`, () =>
    using({ clipboard }, async ({ click, status, window }) => {
      await click("Copy continuity code");
      assert.match(status.textContent, /Automatic copying is unavailable/);
      assert.doesNotMatch(status.textContent, /^Copied/);
      const field = window.document.querySelector("#cpu-manual-copy textarea");
      assert.ok(field.readOnly);
      assert.equal(field.selectionEnd, field.value.length);
      assert.equal(window.document.activeElement, field);
      assert.equal(JSON.parse(Buffer.from(field.value, "base64url")).v, 1);
      window.document.querySelector("dialog").dispatchEvent(new window.Event("close"));
      assert.equal(window.document.getElementById("cpu-manual-copy"), null);
    }));
}
test("denied storage does not export invented empty progress", () =>
  using({ storageDenied: true }, async ({ click, status, window }) => {
    await click("Copy continuity code");
    assert.match(status.textContent, /could not be created/);
    assert.equal(window.document.getElementById("cpu-manual-copy"), null);
  }));
test("complete caching names exact files saved and limits the offline promise", () =>
  using({}, async ({ click, status, writes, requests }) => {
    const button = await click("Save lesson recovery files");
    assert.equal(writes.length, 6);
    assert.equal(requests.length, 6);
    assert.match(status.textContent, /^6 of 6 recovery files cached for lesson 3-2\./);
    assert.match(status.textContent, /may still need internet/);
    assert.equal(button.disabled, false);
  }));
test("partial HTTP failure reports partial caching", () =>
  using({ responseOk: (url) => !url.startsWith("/assets/") }, async ({ click, status, writes }) => {
    await click("Save lesson recovery files");
    assert.equal(writes.length, 4);
    assert.match(status.textContent, /^4 of 6/);
    assert.match(status.textContent, /Some files could not be saved/);
  }));
for (const [name, options] of [
  ["network", { fetchFailure: true }],
  ["HTTP", { responseOk: () => false }],
  ["cache writes", { putFailure: true }],
]) {
  test(`failed ${name} never reports successful saving`, () =>
    using(options, async ({ click, status, writes }) => {
      await click("Save lesson recovery files");
      assert.equal(writes.length, 0);
      assert.match(status.textContent, /^No recovery files were saved/);
    }));
}
for (const options of [{ noCache: true }, { cacheFailure: true }, { catalogFailure: true }]) {
  test(`unavailable recovery capability ${Object.keys(options)[0]} is recoverable`, () =>
    using(options, async ({ click, status, writes }) => {
      const button = await click("Save lesson recovery files");
      assert.equal(writes.length, 0);
      assert.match(status.textContent, /unavailable|could not be saved|not available yet/);
      assert.equal(button.disabled, false);
    }));
}
for (const options of [{ storageDenied: true }, { writeDenied: true }]) {
  test(`import with ${Object.keys(options)[0]} cannot claim restored or reload`, () =>
    using({ ...options, importCode: code() }, async ({ click, status, timers }) => {
      await click("Import continuity code");
      assert.match(status.textContent, /could not be saved/);
      assert.doesNotMatch(status.textContent, /Progress restored/);
      assert.equal(timers.length, 0);
    }));
}
test("valid import persists before scheduling reload", () =>
  using({ importCode: code({ "3-2": true }) }, async ({ click, status, window, timers }) => {
    await click("Import continuity code");
    assert.deepEqual(JSON.parse(window.localStorage.getItem("curriculumProgress")), {
      "3-2": true,
    });
    assert.equal(
      JSON.parse(window.localStorage.getItem("curriculumTeacherWorkflow:v1")).selected,
      "3-2",
    );
    assert.match(status.textContent, /^Progress restored/);
    assert.equal(timers[0].delay, 500);
  }));
for (const importCode of ["invalid-data", code([])]) {
  test("malformed import leaves existing progress and page intact", () =>
    using({ importCode }, async ({ click, status, window, timers }) => {
      window.localStorage.setItem("curriculumProgress", '{"1-1":true}');
      await click("Import continuity code");
      assert.match(status.textContent, /not valid/);
      assert.equal(window.localStorage.getItem("curriculumProgress"), '{"1-1":true}');
      assert.equal(timers.length, 0);
    }));
}
for (const savedWorkflow of ['"malformed workflow"', "[]"]) {
  test("import recovers from a malformed stored workflow", () =>
    using({ importCode: code() }, async ({ click, status, window, timers }) => {
      window.localStorage.setItem("curriculumTeacherWorkflow:v1", savedWorkflow);
      await click("Import continuity code");
      assert.equal(
        JSON.parse(window.localStorage.getItem("curriculumTeacherWorkflow:v1")).selected,
        "3-2",
      );
      assert.match(status.textContent, /^Progress restored/);
      assert.equal(timers[0].delay, 500);
    }));
}
let failed = 0;
for (const { name, action } of tests) {
  try {
    await action();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}`, error);
  }
}
console.log(`${tests.length - failed}/${tests.length} curriculum recovery action tests passed`);
process.exitCode = failed ? 1 : 0;
