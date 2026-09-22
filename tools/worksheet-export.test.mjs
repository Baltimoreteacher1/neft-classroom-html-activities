#!/usr/bin/env node
/**
 * Unit tests for assets/lib/worksheet-export.js — the PDF pack and Word
 * converter behind the downloader's format picker.
 *
 * Both conversions are silent when they go wrong: a mis-scoped stylesheet does
 * not throw, it just lets the last worksheet in a pack restyle the first, and a
 * Word document with collapsed fill lines still opens. So every check here is
 * against a REAL shipped worksheet as well as a fixture, and the fixtures are
 * the exact shapes that were observed breaking:
 *
 *   - `:root` custom properties (all three worksheet families define them, so
 *     stitching raw would give the whole pack the last sheet's palette),
 *   - `@media print` blocks (dropped by a naive scoper, and they are the rules
 *     that matter most in a document that exists to be printed),
 *   - an empty `<span>` whose only job is a `border-bottom` — the Name/Date/
 *     Period rules, which Word draws as nothing at all,
 *   - a `::before { content: " · " }` separator, which Word does not draw,
 *   - an inline-block pill badge, which Word welds to the sentence after it.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import {
  parseWorksheet,
  printHiddenSelectors,
  printPackHtml,
  scopeCss,
  stripCssComments,
  wordHtml,
} from "../assets/lib/worksheet-export.js";
import { lessonPath } from "./lib/curriculum-source.mjs";

const parser = new new JSDOM("").window.DOMParser();
let failures = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`   ✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`   ✗ ${name}\n     ${error.message}`);
  }
};

console.log("worksheet export (PDF pack + Word)");

/* --------------------------------------------------------------- scoping */

test("stripCssComments leaves a comment-looking string literal alone", () => {
  assert.equal(stripCssComments("a{content:'/* x */'}"), "a{content:'/* x */'}");
  assert.equal(stripCssComments("a{/* gone */color:red}"), "a{color:red}");
});

test("every selector is confined to the scope", () => {
  const css = scopeCss(".ws-title{font-size:22px}.a,.b{color:red}", "#s1");
  assert.match(css, /#s1 \.ws-title\{/);
  assert.match(css, /#s1 \.a,#s1 \.b\{/);
});

test(":root, html and body land on the scope element itself", () => {
  // Otherwise the worksheet's custom properties are declared on a node that is
  // not an ancestor of its own content and every var() falls back to nothing.
  for (const root of [":root", "html", "body"]) {
    assert.match(scopeCss(`${root}{--navy:#1f3864}`, "#s1"), /^#s1\{--navy:#1f3864\}$/);
  }
  assert.match(scopeCss("body .x{color:red}", "#s1"), /^#s1 \.x\{/);
});

test("the universal selector reaches the scope and everything under it", () => {
  assert.match(scopeCss("*{box-sizing:border-box}", "#s1"), /^#s1, #s1 \*\{/);
});

test("@media blocks survive and their rules are scoped too", () => {
  const css = scopeCss("@media print{.ws-page{margin:0}}", "#s1");
  assert.match(css, /@media print\{#s1 \.ws-page\{margin:0\}\}/);
});

test("@font-face is copied through unscoped", () => {
  const css = scopeCss('@font-face{font-family:"X";src:url(x.woff2)}', "#s1");
  assert.match(css, /@font-face\{/);
  assert.doesNotMatch(css, /#s1 *@font-face/);
});

test("@page is dropped, because the pack owns page geometry", () => {
  assert.equal(scopeCss("@page{size:Letter;margin:0}", "#s1"), "");
  assert.match(scopeCss("@page{margin:0}", "#s1", { keepPageRules: true }), /@page\{/);
});

test("a comma inside :is() is not a selector boundary", () => {
  const css = scopeCss(":is(.a,.b) .c{color:red}", "#s1");
  assert.equal(css, "#s1 :is(.a,.b) .c{color:red}");
});

test("two worksheets in one pack cannot restyle each other", () => {
  const a = scopeCss(":root{--ink:#000}.ws-page{padding:1in}", "#wsx-1");
  const b = scopeCss(":root{--ink:#fff}.ws-page{padding:0}", "#wsx-2");
  assert.ok(!a.includes("#wsx-2") && !b.includes("#wsx-1"));
  assert.match(a, /#wsx-1 \.ws-page\{padding:1in\}/);
  assert.match(b, /#wsx-2 \.ws-page\{padding:0\}/);
});

/* --------------------------------------------------------------- parsing */

test("parseWorksheet keeps the printable main and drops runtime chrome", () => {
  const sheet = parseWorksheet(
    `<html><head><title>T</title><style>.a{color:red}</style></head>
     <body><div class="topbar">nav</div>
     <main><section class="ws-page">Q1</section><script>boom()</script></main></body></html>`,
    {},
    parser,
  );
  assert.equal(sheet.title, "T");
  assert.match(sheet.css, /\.a\{color:red\}/);
  assert.match(sheet.body, /ws-page/);
  assert.doesNotMatch(sheet.body, /boom|topbar/);
});

test("the page's own print rules say what must not be exported", () => {
  const css = "@media print{.no-print{display:none}.ws-action-bar{display:none}}.x{display:none}";
  assert.deepEqual(printHiddenSelectors(css), [".no-print", ".ws-action-bar"]);
});

test("a print rule on the page itself cannot delete the worksheet", () => {
  // Several sheets carry `@media print { body { ... } }`; a careless reading of
  // a display:none there would return an empty export rather than a worksheet.
  assert.deepEqual(printHiddenSelectors("@media print{body{display:none}*{display:none}}"), []);
});

test("parseWorksheet drops what the page hides in print", () => {
  const sheet = parseWorksheet(
    `<html><head><style>@media print{.no-print{display:none}}</style></head>
     <body><main><div class="no-print"><button onclick="window.print()">Print</button></div>
     <section class="ws-page">Q1</section></main></body></html>`,
    {},
    parser,
  );
  assert.doesNotMatch(sheet.body, /no-print|window\.print/);
  assert.match(sheet.body, /Q1/);
});

/* ------------------------------------------------------------- print pack */

test("a pack gives every sheet its own wrapper and a page break between them", () => {
  const html = printPackHtml(
    [
      { title: "A", css: ":root{--x:1px}", body: "<p>a</p>" },
      { title: "B", css: ":root{--x:2px}", body: "<p>b</p>" },
    ],
    { title: "Pack" },
  );
  assert.match(html, /<section class="wsx-sheet">/);
  assert.match(html, /<div class="wsx-body" id="wsx-1">/);
  assert.match(html, /<div class="wsx-body" id="wsx-2">/);
  assert.match(html, /#wsx-1\{--x:1px\}/);
  assert.match(html, /#wsx-2\{--x:2px\}/);
  assert.match(html, /\.wsx-sheet \+ \.wsx-sheet \{[^}]*break-before: page/);
});

test("a pack escapes the titles it prints", () => {
  const html = printPackHtml([{ title: '<img src=x onerror="1">', css: "", body: "" }], {});
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});

test("a worksheet's own reset cannot reach the page wrapper around it", () => {
  // `* { margin: 0 }` scopes to `#wsx-1, #wsx-1 *`, and an id outranks the
  // `.wsx-sheet` class — so the scope must sit INSIDE the wrapper it styles.
  const html = printPackHtml([{ title: "A", css: "*{margin:0;padding:0}", body: "<p>a</p>" }], {});
  const sheet = html.indexOf('<section class="wsx-sheet">');
  const scope = html.indexOf('id="wsx-1"');
  assert.ok(sheet !== -1 && scope > sheet, "the scoped element is inside .wsx-sheet");
  assert.match(html, /#wsx-1, #wsx-1 \*\{margin:0;padding:0\}/);
});

test("the pack toolbar and spine labels are hidden in print", () => {
  const html = printPackHtml([{ title: "A", css: "", body: "" }], {});
  assert.match(html, /@media print \{[\s\S]*\.wsx-toolbar, \.wsx-label \{ display: none/);
});

test("the pack adds no padding of its own around a sheet", () => {
  // Each worksheet's page element already carries the print margins it was
  // designed with; a second set reflows every sheet off its own layout.
  const html = printPackHtml([{ title: "A", css: "", body: "" }], {});
  assert.match(html, /\.wsx-sheet \{[^}]*padding: 0;/);
});

/* -------------------------------------------------------------------- Word */

const wordFixture = {
  title: "Fixture",
  css: `.ws-fill-line{display:inline-block;border-bottom:1.2px solid #000;min-width:90px}
        .ws-kicker{display:block;font-size:11px}
        .ws-band{display:flex}
        .ws-tag{display:inline-block;padding:1px 7px}
        .ws-note::before{content:" · "}`,
  body: `<p><b>Name</b> <span class="ws-fill-line" style="width:210px;"></span></p>
         <h2><span class="ws-kicker">Start here</span>Words for this lesson</h2>
         <div class="ws-band"><span>Left</span><span>Right</span></div>
         <p><span class="ws-tag">Same steps</span>Finish what the group started.</p>
         <p>Edition<span class="ws-note">note</span></p>`,
};

test("a ruled blank becomes underscores Word can actually draw", () => {
  const out = wordHtml(wordFixture, { parser });
  assert.match(out, /<b>Name<\/b>\s+_{20,}/);
  assert.doesNotMatch(out, /class="ws-fill-line"/);
});

test("a block-level span becomes a div, so its text does not run together", () => {
  const out = wordHtml(wordFixture, { parser });
  assert.match(out, /<div class="ws-kicker">Start here<\/div>Words for this lesson/);
});

test("children of a flex row are separated", () => {
  const out = wordHtml(wordFixture, { parser });
  assert.match(out, /<div>Left<\/div><div>Right<\/div>/);
});

test("an inline-block badge keeps a space from the sentence after it", () => {
  const out = wordHtml(wordFixture, { parser });
  assert.match(out, /Same steps<\/span> Finish what the group started\./);
});

test("::before content is materialized, since Word never draws it", () => {
  const out = wordHtml(wordFixture, { parser });
  assert.match(out, /Edition<span class="ws-note"> · note<\/span>/);
});

test("the document declares itself to Word", () => {
  const out = wordHtml(wordFixture, { parser });
  assert.match(out, /urn:schemas-microsoft-com:office:word/);
  assert.match(out, /@page WordSection1/);
  assert.match(out, /class="WordSection1"/);
});

/* ------------------------------------------------- against real worksheets */

/** One of each family: the tiered worksheet, the small-group practice set, and
 *  the MSTAR sheet. They have three different stylesheets and three different
 *  class vocabularies, which is the whole reason the conversions are driven by
 *  the stylesheet rather than by a list of class names.
 *  Addressed through the curriculum-source seam, never by a lessons/ path —
 *  see tools/curriculum-source-ratchet.test.mjs. */
const REAL = [
  ["3-1-group1", "worksheet.html"],
  ["3-1-group1", "practice.html"],
  ["3-2", "mstar-worksheet.html"],
];

for (const [lesson, file] of REAL) {
  const relative = `${lesson}/${file}`;
  const html = readFileSync(lessonPath(lesson, file), "utf8");
  const sheet = parseWorksheet(html, { url: `/${relative}` }, parser);

  test(`${relative} parses to a titled sheet with styles and content`, () => {
    assert.ok(sheet.title.length > 3, "took a title");
    assert.ok(sheet.css.length > 1000, "took the stylesheet");
    assert.ok(sheet.body.length > 1000, "took the printable body");
    assert.doesNotMatch(sheet.body, /<script/i, "no runtime chrome reaches the export");
  });

  test(`${relative} scopes without losing rules`, () => {
    const scoped = scopeCss(sheet.css, "#wsx-1");
    // Every rule that survives is inside the scope; none escaped it.
    const preludes = [...scoped.matchAll(/(?:^|[{}])([^{}]*)\{/g)].map((m) => m[1].trim());
    const rules = preludes.filter((p) => p && !p.startsWith("@"));
    assert.ok(rules.length > 20, `expected many rules, got ${rules.length}`);
    for (const prelude of rules) {
      assert.ok(prelude.includes("#wsx-1"), `selector escaped the scope: ${prelude.slice(0, 90)}`);
    }
  });

  test(`${relative} converts to a Word document with real content`, () => {
    const out = wordHtml(sheet, { parser, sourceUrl: `/${relative}` });
    assert.match(out, /<div class="WordSection1">/);
    assert.ok(out.length > 5000, "the document carries the worksheet");
    assert.doesNotMatch(out, /<script/i);
  });
}

test("a pack of all three families keeps each one's palette", () => {
  const sheets = REAL.map(([lesson, file]) =>
    parseWorksheet(readFileSync(lessonPath(lesson, file), "utf8"), { url: `/${lesson}` }, parser),
  );
  const html = printPackHtml(sheets, { title: "Three families" });
  for (let i = 1; i <= sheets.length; i++) assert.match(html, new RegExp(`id="wsx-${i}"`));
  // Each family declares its own :root palette; after scoping, each must land
  // on its own wrapper rather than on a shared one.
  const roots = [...html.matchAll(/#wsx-(\d)\s*\{\s*\n?\s*--/g)].map((m) => m[1]);
  assert.equal(new Set(roots).size, sheets.length, "each sheet kept its own palette");
});

if (failures) {
  console.error(`\nFAIL: ${failures} test${failures === 1 ? "" : "s"}`);
  process.exit(1);
}
