// Comic-art books: the atlas, its coordinates and the book agree, and every panel the book shows is
// described for a screen reader. Pure file checks plus one jsdom boot per illustrated book.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";
import { artBooks, blocks, inject, problems, usedFrames } from "./inject-gn-art.mjs";

const books = artBooks();
assert.ok(books.length >= 1, "expected at least one illustrated book under _engine/art/");

for (const b of books) {
  assert.deepEqual(problems(b), [], `${b.dir}: art data problems`);
  const html = readFileSync(b.file, "utf8");
  assert.equal(
    inject(html, blocks(b)),
    html,
    `${b.dir}: gn-art block stale; run node tools/inject-gn-art.mjs`,
  );
  const used = usedFrames(html);
  for (const p of b.spec.panels)
    assert.ok(used.has(p.id), `${b.dir}/${p.id}: packed but never shown`);
  for (const id of used) assert.ok(b.atlas.frames[id], `${b.dir}: book uses unknown frame ${id}`);
  assert.equal(html.split("<!-- gn-art:begin").length - 1, 1, `${b.dir}: one head block`);
  assert.equal(html.split("/* gn-art:begin").length - 1, 1, `${b.dir}: one script block`);

  // Boot the book and render every page: each art element is a labelled image cropped from the atlas.
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(String(e.message || e)));
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "http://localhost/graphic-novels/axiom-city/book.html",
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = (q) => ({
        matches: /max-width:\s*820px/.test(q),
        media: q,
        addEventListener() {},
        removeEventListener() {},
      });
    },
  });
  const w = dom.window;
  const cover = w.document.querySelector("#coverCard .gn-art");
  assert.ok(cover, `${b.dir}: cover art not rendered`);
  assert.equal(
    w.document.querySelectorAll("[data-gn-art]").length,
    0,
    `${b.dir}: unreplaced art slot`,
  );
  const seen = new Set();
  const pages = w.eval("PAGES.length");
  for (let i = 0; i < pages; i++) {
    w.eval(`page=${i};renderSpread()`);
    for (const el of w.document.querySelectorAll("#pageL .gn-art")) {
      const label = el.getAttribute("aria-label") || "";
      assert.equal(el.getAttribute("role"), "img", `${b.dir} p${i + 1}: art without role=img`);
      assert.ok(
        label.split(/\s+/).length >= 6,
        `${b.dir} p${i + 1}: art without a scene description`,
      );
      assert.match(
        el.getAttribute("style"),
        /background-image:url\(\/graphic-novels\/axiom-city\/art\/[\w-]+\.webp\?v=[0-9a-f]{10}\)/,
      );
      seen.add(label);
      assert.ok(el.closest(".panel.gn-panel"), `${b.dir} p${i + 1}: art outside a comic panel`);
    }
    for (const bal of w.document.querySelectorAll("#pageL .gn-panel > .balloon"))
      assert.ok(bal.querySelector(".who"), `${b.dir} p${i + 1}: balloon without a speaker`);
  }
  assert.ok(seen.size >= b.spec.panels.length - 1, `${b.dir}: only ${seen.size} panels rendered`);
  assert.deepEqual(errors, [], `${b.dir}: script errors while rendering`);
  w.close();
}
console.log(`gn-art: ${books.length} illustrated book(s) consistent`);
