// Studio #/packets view driven in jsdom against a stubbed /api/bcpss/units: picker, three count inputs, and the export links.
// Negative controls: bad counts must remove every link; the form must have no name, alias or initial input.
// Run: node --test tools/packet-ui.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><main id=root></main>", {
  url: "https://test.local/bcpss-teachers/studio/",
});
for (const k of ["window", "document", "localStorage", "sessionStorage", "Node", "HTMLElement"]) {
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });
}
const calls = [];
globalThis.fetch = async (url) => {
  calls.push(String(url));
  const q = new URL(String(url), "https://test.local").searchParams;
  const body = {
    units: [
      {
        id: `g${q.get("grade")}-math-u1`,
        unit_number: 1,
        unit_title: "Area, Surface Area & Volume",
      },
      { id: `g${q.get("grade")}-math-u2`, unit_number: 2, unit_title: "Rates" },
    ],
  };
  return new Response(JSON.stringify(body), { status: 200 });
};

const { render } = await import("../bcpss-teachers/studio/views/packets/packets.js");
const { KIT_PARTS, packetHref, paperRows, unitFacts, GRADES } = await import(
  "../bcpss-teachers/studio/views/packets/links.js"
);
const { parseHash, VIEW_FOR, VIEW_TITLES } = await import(
  "../bcpss-teachers/studio/core/router.js"
);
const { PACKET_UNIT_IDS } = await import("../functions/_lib/bcpss/packet-parts.js");
const { BCPSS_UNITS } = await import("../data/bcpss-curriculum-seed.mjs");
const { variantCodes } = await import("../shared/packets/bands.js");

const tick = () => new Promise((r) => setTimeout(r, 30));
const root = document.getElementById("root");
const set = (id, value) => {
  const el = document.getElementById(id);
  el.value = value;
  el.dispatchEvent(
    new dom.window.Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }),
  );
};
const hrefs = () =>
  [...root.querySelectorAll("a[href^='/api/bcpss/packet']")].map((a) => a.getAttribute("href"));

test("the route is registered and titled", () => {
  assert.equal(parseHash("#/packets").view, "packets/packets");
  assert.equal(VIEW_FOR.packets, "packets/packets");
  assert.equal(VIEW_TITLES["packets/packets"], "Class packets");
});

test("unitFacts places every one of the 162 unit ids on its grade and subject", () => {
  for (const id of PACKET_UNIT_IDS) {
    const u = BCPSS_UNITS.find((x) => x.id === id);
    assert.deepEqual(unitFacts(id), { grade: String(u.grade), subject: u.subject }, id);
  }
  assert.equal(unitFacts("nope"), null);
  assert.equal(GRADES.length, 9);
});

test("links carry only unit, part, format, band and counts", () => {
  const u = new URL(
    packetHref({
      unit: "g6-math-u1",
      part: "cover",
      format: "docx",
      counts: { "1_2": 8, "3_4": 12, "5_6": 5 },
    }),
    "https://x.test",
  );
  assert.deepEqual([...u.searchParams.keys()].sort(), ["counts", "format", "part", "unit"]);
  assert.equal(u.searchParams.get("counts"), "1_2:8,3_4:12,5_6:5");
  assert.equal(
    new URL(
      packetHref({ unit: "g6-math-u1", part: "student", band: "5_6" }),
      "https://x.test",
    ).searchParams.get("band"),
    "5_6",
  );
  assert.deepEqual(
    paperRows("g6-math-u1", { "1_2": 2, "3_4": 0, "5_6": 1 }).map((r) => r.copies),
    [2, 0, 1],
  );
});

test("the form: picker, three count inputs, no identity field, then the packet files", async () => {
  await render({ root, params: { unit: "g6-math-u1", counts: "1_2:8,3_4:12,5_6:5" } });
  await tick();
  assert.ok(calls.at(-1).includes("grade=6") && calls.at(-1).includes("subject=Math"));
  assert.equal(document.getElementById("st-pk-unit").value, "g6-math-u1");
  for (const band of ["1_2", "3_4", "5_6"]) assert.ok(document.getElementById(`st-pk-${band}`));
  const inputs = [...root.querySelectorAll("input")].map((i) => i.id);
  assert.deepEqual(inputs.sort(), ["st-pk-1_2", "st-pk-3_4", "st-pk-5_6"]);
  assert.equal(root.querySelectorAll("textarea").length, 0);
  assert.equal(
    root.querySelectorAll("label").length,
    root.querySelectorAll("input, select").length,
  );
  const codes = variantCodes("g6-math-u1");
  const text = root.textContent;
  for (const c of Object.values(codes)) assert.ok(text.includes(`Paper ${c}`), c);
  assert.ok(text.includes("Print 8 copies"));
  const links = hrefs();
  // 3 papers + key + cover + 4 kits, each as PDF and Word
  assert.equal(links.length, (3 + 1 + 1 + KIT_PARTS.length) * 2);
  const cover = links.filter((h) => h.includes("part=cover"));
  assert.equal(cover.length, 2);
  assert.ok(cover.every((h) => h.includes("counts=1_2%3A8%2C3_4%3A12%2C5_6%3A5")));
  assert.equal(links.filter((h) => h.includes("part=student")).length, 6);
  assert.ok(links.filter((h) => h.includes("part=student")).every((h) => !h.includes("counts=")));
  assert.ok(text.includes("Not official, not a score, not a placement tool"));
  for (const a of root.querySelectorAll("a"))
    assert.ok(a.textContent.trim(), "every link has a name");
});

test("changing grade reloads the unit list and clears the files until a unit is chosen", async () => {
  set("st-pk-grade", "7");
  await tick();
  assert.ok(calls.at(-1).includes("grade=7"));
  assert.equal(hrefs().length, 0);
  set("st-pk-unit", "g7-math-u2");
  assert.equal(hrefs().length, 18);
  assert.ok(hrefs().every((h) => h.includes("unit=g7-math-u2")));
});

test("negative control: bad counts remove every link and say why", async () => {
  await render({ root, params: { unit: "g6-math-u1" } });
  await tick();
  set("st-pk-1_2", "-3");
  assert.equal(hrefs().length, 0, "links survived bad counts");
  assert.ok(root.querySelector("[role=alert]")?.textContent.includes("whole number"));
  set("st-pk-1_2", "0");
  assert.equal(hrefs().length, 0, "zero students everywhere is not a packet");
  set("st-pk-3_4", "4");
  assert.equal(hrefs().length, 18);
  set("st-pk-5_6", "61");
  assert.equal(hrefs().length, 0);
});

test("view source: no inline script, no external call, no purple", () => {
  for (const f of ["packets.js", "links.js", "packets.css"]) {
    const src = readFileSync(
      new URL(`../bcpss-teachers/studio/views/packets/${f}`, import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(src, /<script|https?:\/\/|purple|violet|indigo/i, f);
    assert.doesNotMatch(src, /localStorage|document\.cookie/, f);
  }
});
