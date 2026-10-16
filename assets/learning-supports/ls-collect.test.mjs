// Read-aloud must speak what a student can SEE, in the language they asked for,
// and nothing else.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang='en'><body></body></html>", { url: "http://localhost/" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document });
const { collectTokens, resolveTarget } = await import("./ls-collect.js");

/** @param {string} html */
function page(html) {
  document.body.innerHTML = html;
  return document.body;
}
const say = (tokens) => tokens.map((t) => t.text).join(" ");

test("reads visible text in order and turns notation into words", () => {
  const root = page("<main><h1>Ratios</h1><p>Write 3:4 as a fraction, then find 40% of 12.</p></main>");
  const tokens = collectTokens(root);
  assert.equal(say(tokens), "Ratios Write 3 to 4 as a fraction, then find 40 percent of 12.");
});

test("a heading or paragraph ends a spoken phrase", () => {
  const tokens = collectTokens(page("<h2>Step 1</h2><p>Add</p><p>Subtract</p>"));
  const breaks = tokens.filter((t) => t.breakAfter).map((t) => t.text);
  assert.deepEqual(breaks, ["1", "Add", "Subtract"]);
});

test("hidden, decorative and control content is never read", () => {
  const tokens = collectTokens(
    page(`
      <p>Shown</p>
      <p hidden>Hidden attribute</p>
      <p style="display:none">Hidden style</p>
      <div style="visibility:hidden">Invisible</div>
      <span aria-hidden="true">Decoration</span>
      <script>var x = "code"</script><style>.a{}</style>
      <nav>Menu link</nav>
      <input value="typed answer"><textarea>notes</textarea>
      <svg><text>Diagram label</text></svg>
      <div data-ls-ui>Our own panel</div>
      <p data-ls-skip>Skipped on purpose</p>
      <p>Also shown</p>`),
  );
  assert.equal(say(tokens), "Shown Also shown");
});

test("a line shown in both languages is read once, in the language asked for", () => {
  const html =
    "<p><span class='i18n-stack'><span class='i18n-en' lang='en'>Find the ratio.</span><span class='i18n-es' lang='es'>Encuentra la razón.</span></span></p>";
  const en = collectTokens(page(html), { want: "en" });
  assert.equal(say(en), "Find the ratio.");
  assert.deepEqual([...new Set(en.map((t) => t.lang))], ["en"]);
  const es = collectTokens(page(html), { want: "es" });
  assert.equal(say(es), "Encuentra la razón.");
  assert.deepEqual([...new Set(es.map((t) => t.lang))], ["es"]);
});

test("a short Spanish gloss beside English is read only when Spanish is asked for", () => {
  const html = "<p><span>Highlight words <span lang='es'>· Resaltar palabras</span></span></p>";
  assert.equal(say(collectTokens(page(html), { want: "en" })), "Highlight words");
  const es = collectTokens(page(html), { want: "es" });
  assert.equal(say(es), "Resaltar palabras");
});

test("a whole Spanish paragraph is read in Spanish, whichever language was asked for", () => {
  const tokens = collectTokens(page("<p>English first.</p><p lang='es'>Un párrafo en español.</p>"), { want: "en" });
  assert.deepEqual(
    tokens.map((t) => [t.text, t.lang]),
    [
      ["English", "en"],
      ["first.", "en"],
      ["Un", "es"],
      ["párrafo", "es"],
      ["en", "es"],
      ["español.", "es"],
    ],
  );
});

test("pictures and separators are skipped, not read out as their names", () => {
  assert.equal(say(collectTokens(page("<p>🎮 Play · now</p>"))), "Play now");
});

test("a selection reads only the selected words", () => {
  const root = page("<p id='p'>one two three four five</p>");
  const text = document.getElementById("p").firstChild;
  const range = document.createRange();
  range.setStart(text, 4); // "two"
  range.setEnd(text, 13); // ... "three"
  assert.equal(say(collectTokens(root, { range })), "two three");
});

test("each token points back at its place on the page", () => {
  const root = page("<p>Find 3/4 of 12</p>");
  const [find, frac] = collectTokens(root);
  assert.equal(find.node.data.slice(find.start, find.end), "Find");
  assert.equal(frac.node.data.slice(frac.start, frac.end), "3/4");
  assert.equal(frac.text, "3 over 4");
});

test("what to read: the selection, then the problem being worked on, then the page", () => {
  page(`<h1>Lesson</h1><main><article class="problem-card" id="q"><p>Question <input id="a"></p></article><p>Other</p></main>`);
  const input = document.getElementById("a");
  assert.equal(resolveTarget(document, input).kind, "problem");
  assert.equal(resolveTarget(document, input).root, document.getElementById("q"));
  const page_ = resolveTarget(document, document.body);
  assert.equal(page_.kind, "page");
  assert.equal(page_.root, document.body, "a title above <main> is still read");
});
