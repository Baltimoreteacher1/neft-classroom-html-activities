/**
 * /directory/ site partition (thelanguagepage.com vs the full Neft Teacher directory).
 *
 *   node --test tools/directory-partition.test.mjs
 *
 * directory/index.html holds no entries: it renders data/catalog.json in the browser. So this test runs the
 * page's own script in jsdom against the real catalog, once per host / ?site= mode, and checks which links
 * end up where. No browser.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HTML = readFileSync(resolve(ROOT, "directory/index.html"), "utf8");
const CATALOG = JSON.parse(readFileSync(resolve(ROOT, "data/catalog.json"), "utf8"));
const PARTNER_TITLE = "Partner Math Portal: EduWonderLab";

const allPaths = new Set(CATALOG.entries.map((e) => e.path));
const arcadePaths = new Set(
  CATALOG.entries.filter((e) => e.section === "arcade").map((e) => e.path),
);
const readingPaths = new Set(
  CATALOG.entries.filter((e) => e.section === "reading").map((e) => e.path),
);

/** Load the page at `url`, wait for the catalog render, and expand every "Show all" button. */
async function load(url, { query } = {}) {
  const dom = new JSDOM(HTML, {
    url,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.fetch = async () => ({ json: async () => CATALOG });
    },
  });
  const { document } = dom.window;
  for (
    let i = 0;
    i < 100 && document.querySelector("main").classList.contains("directory-loading");
    i++
  ) {
    await new Promise((r) => setTimeout(r, 5));
  }
  assert.ok(
    !document.querySelector("main").classList.contains("directory-loading"),
    "catalog render finished",
  );
  if (query !== undefined) {
    const input = document.getElementById("dirSearch");
    input.value = query;
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  }
  for (
    let btn = document.querySelector("[data-expand]");
    btn;
    btn = document.querySelector("[data-expand]")
  )
    btn.click();
  return { dom, document, site: document.documentElement.dataset.site };
}

const hrefs = (root) =>
  new Set([...root.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")));

test("static markup: partner block has the exact title and original links are untouched", () => {
  const doc = new JSDOM(HTML).window.document;
  const summaries = [...doc.querySelectorAll("details > summary")].filter(
    (s) => s.textContent.trim() === PARTNER_TITLE,
  );
  assert.equal(summaries.length, 1, "exactly one partner <details> with the exact title");
  assert.equal(summaries[0].parentElement.id, "partnerMath");
  // The page's own anchors before the partition: Home breadcrumb and footer. The only new one is the scope link.
  const anchors = [...doc.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).sort();
  assert.deepEqual(anchors, ["/", "/", "?site=all"]);
  assert.match(HTML, /\[data-site="language"\] \[data-partner="math"\]/);
  assert.match(HTML, /thelanguagepage\\\.com/);
});

test("catalog sanity: Reading & Language has 49 entries and arcade is disjoint from it", () => {
  assert.equal(readingPaths.size, 49);
  assert.equal(arcadePaths.size, 49);
  for (const p of arcadePaths) assert.ok(!readingPaths.has(p), p);
});

test("default host: no data-site, full directory, math rows tagged data-partner, partner block hidden", async () => {
  const { document, site } = await load("https://eduwonderlab.com/directory/");
  assert.equal(site, undefined);
  assert.deepEqual([...hrefs(document.getElementById("dirResults"))].sort(), [...allPaths].sort());
  assert.ok(document.getElementById("partnerMath").hidden);
  assert.equal(document.getElementById("partnerResults").children.length, 0);
  assert.equal(document.getElementById("dirScope").hidden, true);
  const tagged = document.querySelectorAll('#dirResults .dir-row[data-partner="math"]');
  assert.equal(tagged.length, arcadePaths.size);
  for (const row of tagged)
    assert.ok(arcadePaths.has(row.querySelector("a.row-main").getAttribute("href")));
});

for (const url of [
  "https://teacher.example.org/directory/",
  "https://thelanguagepage.com.evil.example/directory/",
  "https://eduwonderlab.com/directory/?site=bogus",
  "https://thelanguagepage.com/directory/?site=all",
  "https://www.thelanguagepage.com/directory/?site=all",
]) {
  test(`full directory unchanged: ${url}`, async () => {
    const { document } = await load(url);
    assert.deepEqual(
      [...hrefs(document.getElementById("dirResults"))].sort(),
      [...allPaths].sort(),
    );
    assert.ok(document.getElementById("partnerMath").hidden);
  });
}

for (const url of [
  "https://thelanguagepage.com/directory/",
  "https://www.thelanguagepage.com/directory/",
  "https://eduwonderlab.com/directory/?site=language",
]) {
  test(`language partition: ${url}`, async () => {
    const { document, site } = await load(url);
    assert.equal(site, "language");
    const primary = hrefs(document.getElementById("dirResults"));
    const partner = hrefs(document.getElementById("partnerResults"));
    // Math arcade: exactly the arcade section, only inside the partner block, collapsed.
    assert.deepEqual([...partner].sort(), [...arcadePaths].sort());
    for (const p of arcadePaths) assert.ok(!primary.has(p), `${p} leaked into the primary list`);
    assert.equal(document.querySelectorAll('#dirResults [data-partner="math"]').length, 0);
    const block = document.getElementById("partnerMath");
    assert.ok(!block.hidden && !block.open);
    assert.equal(block.querySelector("summary").textContent.trim(), PARTNER_TITLE);
    for (const h of block.querySelectorAll(".dir-section-head > *:first-child"))
      assert.equal(h.tagName, "H3");
    // Primary: all of Reading & Language plus ESOL / WIDA / ACCESS Practice Lab pages; nothing from lessons.
    for (const p of readingPaths) assert.ok(primary.has(p), p);
    for (const p of [
      "/esol/",
      "/wida-access/",
      "/wida-access/writing/",
      "/access-practice-lab/",
      "/access-teacher/",
    ]) {
      assert.ok(primary.has(p), p);
    }
    assert.ok(!primary.has("/lessons/1-1/"));
    // Nothing is lost: primary + partner + (hidden, reachable via ?site=all) covers the catalog, no overlap.
    for (const p of partner) assert.ok(!primary.has(p));
    assert.ok(primary.size + partner.size < allPaths.size);
    assert.ok([...primary].every((p) => allPaths.has(p)));
    assert.equal(document.querySelector("#dirScope a").getAttribute("href"), "?site=all");
    assert.equal(document.getElementById("dirScope").hidden, false);
  });
}

test("?site=math: partition with the partner block expanded", async () => {
  const { document, site } = await load("https://eduwonderlab.com/directory/?site=math");
  assert.equal(site, "math");
  const block = document.getElementById("partnerMath");
  assert.ok(!block.hidden && block.open);
  assert.deepEqual(
    [...hrefs(document.getElementById("partnerResults"))].sort(),
    [...arcadePaths].sort(),
  );
});

test("search on the language host never resurfaces math entries in the primary list", async () => {
  const { document } = await load("https://thelanguagepage.com/directory/", {
    query: "number realm",
  });
  assert.equal(document.getElementById("dirResults").querySelectorAll("a").length, 0);
  assert.ok(document.getElementById("partnerResults").querySelectorAll("a").length > 0);
  assert.ok(document.getElementById("partnerMath").open, "search match opens the partner block");
  assert.equal(document.getElementById("dirEmpty").hidden, true);

  const lang = await load("https://thelanguagepage.com/directory/", { query: "wida" });
  const primary = hrefs(lang.document.getElementById("dirResults"));
  assert.ok(primary.has("/wida-access/"));
  assert.equal(
    lang.document.getElementById("partnerMath").hidden,
    true,
    "no partner matches, block hidden",
  );
});

test("section filters on the language host omit the partner section", async () => {
  const { document } = await load("https://thelanguagepage.com/directory/");
  const chips = [...document.querySelectorAll("#sectionFilters .chip-btn")].map(
    (b) => b.textContent,
  );
  assert.ok(chips.includes("Reading & Language"));
  assert.ok(!chips.includes("Games & Arcade"));
});
