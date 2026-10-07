import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";

const source = readFileSync(new URL("../assets/curriculum-resources.js", import.meta.url), "utf8");
const hub = readFileSync(new URL("../curriculum/index.html", import.meta.url), "utf8");
const data = JSON.parse(
  readFileSync(new URL("../data/curriculum-resource-guide.json", import.meta.url)),
);
const markup = hub.slice(
  hub.indexOf('<section id="curriculum-resources"'),
  hub.indexOf('<details class="hub-collection" id="hub-workflows"'),
);
const KEY = "ewl:curriculum:resource-pins:v1";
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
}
async function setup(options = {}) {
  const dom = new JSDOM(markup, {
    url: "https://eduwonderlab.com/curriculum/" + (options.hash || ""),
    runScripts: "outside-only",
  });
  const { window } = dom;
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 0);
  window.HTMLElement.prototype.scrollIntoView = function () {
    this.dataset.scrolled = "true";
  };
  if (options.busy) {
    const desk = window.document.createElement("section");
    desk.id = "curriculum-navigator";
    desk.setAttribute("aria-busy", "true");
    window.document.body.prepend(desk);
  }
  if (options.teacher) window.document.body.classList.add("teacher-mode");
  if (options.saved) window.localStorage.setItem(KEY, options.saved);
  window.fetch =
    options.fetch || (async () => ({ ok: true, json: async () => structuredClone(data) }));
  window.eval(source);
  await tick();
  const $ = (id) => window.document.getElementById(id);
  const query = (value) => {
    $("cr-search").value = value;
    $("cr-search").dispatchEvent(new window.Event("input"));
  };
  return {
    dom,
    window,
    $,
    query,
    cards: () => [...$("cr-results").querySelectorAll("li[data-resource]")],
  };
}

await test("all curated resources resolve; public links honor the shared teacher gate", () => {
  assert.ok(data.resources.length >= 32);
  assert.equal(new Set(data.resources.map((r) => r.id)).size, data.resources.length);
  const categories = new Set(data.categories.map((c) => c.id));
  for (const r of data.resources) {
    assert.ok(categories.has(r.category));
    assert.ok(["all", "student", "teacher"].includes(r.audience));
    for (const href of [r.href, ...r.links.map((l) => l.href)]) {
      const url = new URL(href, "https://eduwonderlab.com");
      assert.equal(url.origin, "https://eduwonderlab.com");
      assert.ok(
        existsSync(
          new URL(
            `..${url.pathname}${url.pathname.endsWith("/") ? "index.html" : ""}`,
            import.meta.url,
          ),
        ),
        href,
      );
      if (r.audience !== "teacher") assert.equal(isTeacherSurface(url.pathname), false, href);
    }
  }
  const page = new JSDOM(hub);
  const section = page.window.document.querySelector("#curriculum-resources");
  assert.equal(section.closest("details"), null);
  assert.ok(page.window.document.querySelector('header a[href="#curriculum-resources"]'));
  assert.ok(
    page.window.document.querySelector('header a[href="/curriculum/fluency/teacher/#view=studio"]'),
  );
  page.window.close();
});
await test("teacher discovery, search synonyms, category counts, and clear filters", async () => {
  const { dom, $, query, cards } = await setup({ teacher: true });
  assert.equal(cards().length, 6);
  assert.equal(cards()[0].dataset.resource, "fluency-guide");
  assert.equal($("cr-controls").hidden, false);
  assert.equal($("cr-fallback").hidden, true);
  query("publisher");
  assert.deepEqual(
    cards().map((c) => c.dataset.resource),
    ["fluency-guide", "notes-studio"],
  );
  query("small groups");
  // The retired standalone studio was removed from the course in 5e1daf0be4.
  assert.ok(!cards().some((c) => c.dataset.resource === "small-group-studio"));
  assert.ok(cards().some((c) => c.dataset.resource === "rotations"));
  query("worksheets");
  assert.ok(cards().length >= 2);
  $("cr-filters").querySelector('[data-category="support"]').click();
  assert.match($("cr-status").textContent, /^0 resources/);
  $("cr-reset").click();
  assert.equal(cards().length, 6);
  assert.equal(dom.window.document.activeElement, $("cr-search"));
  query("wida");
  assert.equal(cards()[0].dataset.resource, "supports");
  dom.window.close();
});
await test("student view excludes teacher resources, even with saved teacher IDs", async () => {
  const { dom, $, window, query, cards } = await setup({
    saved: JSON.stringify(["fluency-guide", "gradebook", "made-up", "fluency-practice"]),
  });
  assert.equal(cards()[0].dataset.resource, "fluency-practice");
  assert.equal($("cr-pinned").textContent, "Pinned (1)");
  $("cr-more").click();
  $("cr-more").click();
  for (const c of cards())
    assert.notEqual(data.resources.find((r) => r.id === c.dataset.resource).audience, "teacher");
  query("gradebook");
  assert.equal(cards().length, 0);
  window.document.body.classList.add("teacher-mode");
  await tick();
  assert.equal(cards()[0].dataset.resource, "gradebook");
  window.document.body.classList.remove("teacher-mode");
  await tick();
  assert.equal(cards().length, 0);
  dom.window.close();
});
await test("pins persist and unpinning in Pinned view leaves focus on its filter", async () => {
  const { dom, $, window, query, cards } = await setup({ teacher: true });
  query("canvas");
  const first = cards()[0];
  const id = first.dataset.resource;
  const button = first.querySelector("button");
  button.focus();
  button.click();
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.equal(window.document.activeElement, button);
  assert.deepEqual(JSON.parse(window.localStorage.getItem(KEY)), [id]);
  $("cr-reset").click();
  $("cr-pinned").click();
  assert.equal(cards().length, 1);
  cards()[0].querySelector("button").click();
  assert.equal(cards().length, 0);
  assert.equal(window.document.activeElement, $("cr-pinned"));
  assert.match($("cr-results").textContent, /No pinned resources/);
  dom.window.close();
});
await test("load more exposes the next items and focuses the first new link", async () => {
  const { dom, $, cards } = await setup({ teacher: true });
  $("cr-more").click();
  assert.equal(cards().length, 12);
  assert.equal(dom.window.document.activeElement, cards()[6].querySelector("a"));
  dom.window.close();
});
await test("malformed or unavailable storage never breaks browsing or claims a save", async () => {
  const { dom, $, window, cards } = await setup({ teacher: true, saved: "{bad json" });
  assert.equal(cards().length, 6);
  assert.match($("cr-notice").textContent, /could not be restored/);
  window.Storage.prototype.setItem = () => {
    throw new Error("blocked");
  };
  const pin = cards()[0].querySelector("button");
  pin.click();
  assert.equal(pin.getAttribute("aria-pressed"), "false");
  assert.match($("cr-notice").textContent, /could not save/);
  dom.window.close();
});
await test("failed load keeps direct links, and retry restores search", async () => {
  const { dom, $, window, cards } = await setup({
    fetch: async () => {
      throw new Error("offline");
    },
  });
  assert.equal($("cr-fallback").hidden, false);
  assert.equal($("cr-controls").hidden, true);
  assert.equal($("cr-retry").hidden, false);
  window.fetch = async () => ({ ok: true, json: async () => data });
  $("cr-retry").click();
  await tick();
  assert.equal(cards().length, 6);
  assert.equal($("cr-retry").hidden, true);
  assert.equal(window.document.activeElement, $("cr-search"));
  dom.window.close();
});
await test("unsafe resource URLs are rejected instead of creating executable links", async () => {
  for (const href of ["javascript:alert(1)", "//example.com/", "/\\example.com/"]) {
    const bad = structuredClone(data);
    bad.resources[0].href = href;
    const { dom, $, cards } = await setup({
      fetch: async () => ({ ok: true, json: async () => bad }),
    });
    assert.equal(cards().length, 0);
    assert.equal($("cr-fallback").hidden, false);
    assert.equal($("cr-retry").hidden, false);
    dom.window.close();
  }
});
await test("query text stays text and carries into the exhaustive directory search", async () => {
  const { dom, $, query } = await setup();
  const q = '<img src=x onerror="alert(1)">';
  query(q);
  assert.equal($("cr-results").querySelector("img"), null);
  assert.equal($("cr-status").querySelector("img"), null);
  const url = new URL($("cr-directory").href);
  assert.equal(url.searchParams.get("q"), q);
  assert.equal(url.searchParams.get("lane"), "student");
  dom.window.close();
});
await test("cold resource links settle after lessons load, without overriding user input", async () => {
  for (const cancel of [false, true]) {
    const { dom, $, window } = await setup({ hash: "#curriculum-resources", busy: true });
    assert.equal($("curriculum-resources").dataset.scrolled, undefined);
    if (cancel) window.dispatchEvent(new window.Event("wheel"));
    $("curriculum-navigator").setAttribute("aria-busy", "false");
    await tick();
    await tick();
    assert.equal($("curriculum-resources").dataset.scrolled, cancel ? undefined : "true");
    dom.window.close();
  }
});
console.log(`${passed}/${passed} curriculum resource-discovery checks passed.`);
