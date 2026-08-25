// Two student-facing vocabulary contracts, pinned so they cannot silently
// regress. Both come from the same classroom report (Joel, 2026-08-01):
//
//   1. TAPPING A VOCABULARY PICTURE MUST ENLARGE IT. A working lightbox already
//      existed in lesson-renderer.js and was wired to Notice & Wonder scenes,
//      Reveal Math slides and word-problem art — but NOT to the one picture a
//      student taps most, the vocabulary illustration. It was a private function
//      in a file the small-group word wall and the generated vocab.html page do
//      not load, so those surfaces had no way to reach it either. The affordance
//      now lives in engine/core/image-zoom.js and every vocabulary image path
//      attaches it.
//
//   2. WORD ↔ DEFINITION ACTIVITIES MUST STAY TWO COLUMNS. Words on one side,
//      meanings on the other, at ANY viewport width and ANY browser zoom level.
//      Browser zoom shrinks the effective viewport, so a `@media (max-width: …)`
//      collapse fires on a classroom desktop at 200% exactly as it does on a
//      phone — and a matcher that stacks every meaning under every word has
//      stopped being a matcher. `repeat(auto-fit, minmax(…))` collapses the same
//      way with no media query at all.
//
// This test asserts the DOM contract for the engine paths, the source contract
// for the page generator (lessons/*/vocab.html is GENERATED — the generator is
// the artifact under test, the shipped HTML is only its output), and the CSS
// contract for every layout pinned to two columns. It fails loudly if any sweep
// matches zero files, so a rename cannot quietly turn it into a no-op.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

// ───────────────────────────────────────────────────────────────────────────
// 1. DOM contract — attachImageZoom marks the image and opens the lightbox
// ───────────────────────────────────────────────────────────────────────────

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "https://example.test/lessons/6-13/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const { attachImageZoom, isLightboxOpen } = await import("../engine/core/image-zoom.js");

const img = document.createElement("img");
img.src = "/assets/vocab-images/ratio.svg";
img.alt = "Illustration of ratio";
document.body.append(img);
attachImageZoom(img);

assert.equal(img.dataset.zoomable, "1", "a zoomable vocabulary image must carry data-zoomable=1");
// The image must STAY an image to assistive tech — overriding its role with
// "button" hid every vocabulary illustration from the accessibility tree and
// read its alt text out as a button label (fixed 2026-08-04; the studio
// Playwright suite asserts the same contract via getByRole("img")).
assert.equal(img.getAttribute("role"), null, "it must keep its implicit img role");
assert.equal(img.getAttribute("tabindex"), "0", "it must be reachable by keyboard");
assert.equal(img.getAttribute("title"), "Click to enlarge", "it must say what tapping does");
assert.ok(img.classList.contains("is-zoomable"), "it must carry the zoom-in cursor class");

// Idempotent: re-attaching must not double-wire the singleton glossary picture.
attachImageZoom(img);
assert.equal(
  document.querySelectorAll("img[data-zoomable='1']").length,
  1,
  "attachImageZoom must be idempotent",
);

img.click();
const lightbox = document.querySelector(".lesson-lightbox");
assert.ok(lightbox, "clicking a vocabulary image must open the shared lightbox");
// The small-group vocabulary pop-up is a <dialog> opened with showModal(), which
// the browser promotes to the TOP LAYER — above every z-index. The lightbox has
// to be a <dialog> too, or it opens behind that pop-up and reads as a dead tap.
assert.equal(
  lightbox.tagName,
  "DIALOG",
  "the lightbox must be a <dialog> so it can out-stack a showModal() pop-up",
);
assert.equal(isLightboxOpen(), true, "the lightbox must report itself open");
assert.match(
  lightbox.querySelector("img").getAttribute("src"),
  /\/assets\/vocab-images\/ratio\.svg$/,
  "the enlarged picture must be the one that was clicked",
);

// Closing returns focus to the picture the student tapped.
lightbox.querySelector(".lesson-lightbox-close").click();
assert.equal(isLightboxOpen(), false, "closing must clear the open state");
assert.equal(document.activeElement, img, "closing must return focus to the image");

// Keyboard parity: Enter opens it too.
img.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
assert.equal(isLightboxOpen(), true, "Enter on a zoomable image must open the lightbox");
lightbox.querySelector(".lesson-lightbox-close").click();

// ───────────────────────────────────────────────────────────────────────────
// 2. DOM contract — every image built by the shared vocabulary configurator is
//    zoomable. This is what covers the small-group word wall AND its <dialog>
//    pop-up, neither of which goes through lesson-renderer.js.
// ───────────────────────────────────────────────────────────────────────────

const { configureVocabImage } = await import("../engine/core/vocab-images.js");
const wallImg = configureVocabImage(document.createElement("img"), {
  term: "unit rate",
  definition: "a rate for one unit",
});
assert.equal(wallImg.dataset.zoomable, "1", "small-group vocabulary cards must enlarge on tap");
assert.equal(wallImg.getAttribute("role"), null, "word-wall image keeps its img role");
assert.equal(wallImg.getAttribute("tabindex"), "0");

// ───────────────────────────────────────────────────────────────────────────
// 3. Source contract — every code path that renders a vocabulary image wires it
// ───────────────────────────────────────────────────────────────────────────

const ZOOM_PATHS = [
  {
    file: "engine/core/lesson-renderer.js",
    what: "the glossary pop-up picture (.obj-popup-img) in the interactive lesson",
    // Also covers the be-curious / ESOL support panel and the Notice & Wonder
    // academic-word chips: both open this same pop-up.
    must: [
      // Both names must be imported from the module; the list is deliberately
      // not pinned to exactly two, since the renderer also pulls in the
      // document-wide observer (observeContentImageZoom).
      /import \{[^}]*\battachImageZoom\b[^}]*\}\s*from\s*"\.\/image-zoom\.js"/,
      /import \{[^}]*\bisLightboxOpen\b[^}]*\}\s*from\s*"\.\/image-zoom\.js"/,
      /class="obj-popup-img"/,
    ],
    inFunction: { name: "openObjectiveTermPopup", must: /attachImageZoom\(img\)/ },
  },
  {
    file: "engine/core/vocab-images.js",
    what: "the shared vocabulary-image configurator (small-group word wall + pop-up)",
    must: [/import \{ attachImageZoom \} from "\.\/image-zoom\.js"/],
    inFunction: { name: "configureVocabImage", must: /attachImageZoom\(image\)/ },
  },
  {
    file: "scripts/generate-notes.mjs",
    what: "the generated Vocab Explorer page (lessons/*/vocab.html)",
    must: [
      /function vocabImageZoomScript\(\)/,
      /\$\{vocabImageZoomScript\(\)\}/,
      /\$\{vocabImageZoomStyles\(\)\}/,
      // The generated script must reproduce the same affordance contract.
      /'\.vx-figure img, \.vocab-figure img'/,
      /setAttribute\('data-zoomable','1'\)/,
      /setAttribute\('role','button'\)/,
      /setAttribute\('tabindex','0'\)/,
      /Click to enlarge/,
    ],
  },
];

let zoomChecks = 0;
for (const path of ZOOM_PATHS) {
  const src = read(path.file);
  for (const re of path.must) {
    assert.match(src, re, `${path.file} — ${path.what}: expected ${re}`);
    zoomChecks++;
  }
  if (path.inFunction) {
    const at = src.indexOf(`function ${path.inFunction.name}(`);
    assert.notEqual(at, -1, `${path.file}: ${path.inFunction.name}() has disappeared`);
    // Read to the next top-level function so the assertion cannot be satisfied
    // by an attachImageZoom call somewhere else in the file.
    const end = src.indexOf("\nfunction ", at + 1);
    const body = src.slice(at, end === -1 ? src.length : end);
    assert.match(
      body,
      path.inFunction.must,
      `${path.file}: ${path.inFunction.name}() must attach the zoom affordance to the vocabulary image`,
    );
    zoomChecks++;
  }
}
assert.ok(zoomChecks > 0, "the vocabulary-image sweep matched nothing — the contract is unpinned");

// The affordance must have exactly one implementation. design-system.css used to
// carry a second copy of the lightbox CSS; the small-group and generated pages
// never load that stylesheet, so the two copies could only drift.
assert.doesNotMatch(
  read("engine/styles/design-system.css"),
  /^\.lesson-lightbox\s*\{/m,
  "the lightbox stylesheet belongs to engine/core/image-zoom.js only",
);

// ───────────────────────────────────────────────────────────────────────────
// 4. CSS contract — pinned two-column layouts
// ───────────────────────────────────────────────────────────────────────────

// Count top-level tracks in a grid-template-columns value, ignoring commas that
// belong to minmax()/repeat()/clamp() arguments.
function countTracks(rawValue) {
  const value = String(rawValue).replace(/!\s*important/gi, "");
  let depth = 0;
  let tracks = 0;
  let current = "";
  const flush = () => {
    if (current.trim()) tracks++;
    current = "";
  };
  for (const ch of value) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth === 0 && /\s/.test(ch)) flush();
    else current += ch;
  }
  flush();
  return tracks;
}

assert.equal(countTracks("minmax(0, 1fr) minmax(0, 1fr)"), 2);
assert.equal(countTracks("1fr"), 1);
assert.equal(countTracks("minmax(0,1fr) 40px minmax(0,1fr)"), 3);
assert.equal(countTracks("repeat(auto-fit, minmax(200px, 280px))"), 1);

// Every `grid-template-columns` declaration that applies to `selector`, wherever
// it lives — a real stylesheet, a CSS-in-template-literal block, or an inline
// style string assigned right after the class is set.
function gridDeclsFor(source, selector) {
  const cls = selector.replace(".", "");
  const out = [];
  // (a) rule blocks whose selector list mentions the class
  const RULE = new RegExp(`([^{}]*\\.${cls}\\b[^{}]*)\\{([^{}]*)\\}`, "g");
  let m;
  while ((m = RULE.exec(source)) !== null) {
    const decl = /grid-template-columns\s*:\s*([^;}]+)/.exec(m[2]);
    if (decl) out.push({ where: m[1].trim().replace(/\s+/g, " "), value: decl[1].trim() });
  }
  // (b) inline style strings near a `className = "<cls>"` assignment
  const INLINE = new RegExp(
    `className\\s*=\\s*"${cls}"[\\s\\S]{0,400}?grid-template-columns\\s*:\\s*([^;"']+)`,
    "g",
  );
  while ((m = INLINE.exec(source)) !== null) {
    out.push({ where: `${selector} (inline style)`, value: m[1].trim() });
  }
  return out;
}

// Word ↔ definition / prompt ↔ match layouts. These are two-sided by definition:
// collapsing them to one column destroys the pairing the activity teaches.
const PINNED = [
  {
    file: "engine/components/matching-game.js",
    selector: ".mg-board",
    what: "the core matcher (matching-game / matching problem types)",
    minTracks: 2,
  },
  {
    file: "engine/components/vocab-drag-match.js",
    selector: ".vdm-board",
    what: "Term Match — drag a term onto its definition",
    // 3 at desktop (term · arrow · definition); the arrow column is hidden when
    // narrow, leaving 2. Never fewer than 2.
    minTracks: 2,
  },
  {
    file: "scripts/generate-notes.mjs",
    selector: ".vx-mcols",
    what: "'② Match it' on the generated Vocab Explorer page (= the lesson's Vocab tab)",
    minTracks: 2,
  },
];

let pinnedDecls = 0;
for (const pin of PINNED) {
  const src = read(pin.file);
  const decls = gridDeclsFor(src, pin.selector);
  assert.ok(
    decls.length > 0,
    `${pin.file}: found no grid-template-columns for ${pin.selector} — ${pin.what} may have been renamed; re-pin it.`,
  );
  for (const decl of decls) {
    assert.doesNotMatch(
      decl.value,
      /auto-fit|auto-fill/,
      `${pin.file} — ${pin.what}: "${decl.where}" uses a collapsing ${decl.value}. auto-fit/auto-fill drops to one column when the container is narrow OR the student zooms in.`,
    );
    assert.ok(
      countTracks(decl.value) >= pin.minTracks,
      `${pin.file} — ${pin.what}: "${decl.where}" declares ${countTracks(decl.value)} column(s) (${decl.value}). It must stay at least ${pin.minTracks} at every width and zoom level.`,
    );
    pinnedDecls++;
  }
}
assert.ok(pinnedDecls >= PINNED.length, "the two-column sweep matched nothing");

// Long words must wrap rather than widen their track — otherwise two columns
// still hold but the page scrolls sideways, which the repo forbids.
for (const [file, selector] of [
  ["engine/components/matching-game.js", ".mg-item"],
  ["engine/components/vocab-drag-match.js", ".vocab-dm-def"],
  ["scripts/generate-notes.mjs", ".vx-mdef"],
]) {
  assert.match(
    read(file),
    /overflow-wrap\s*:\s*anywhere/,
    `${file}: ${selector} must allow long text to wrap so two columns never overflow horizontally`,
  );
}

// ───────────────────────────────────────────────────────────────────────────
// 5. ALLOW-LIST — grids deliberately left responsive.
//
// These are NOT two-sided pairings, so forcing them to two columns would make
// them worse. Each entry is a decision, recorded here so a future sweep does not
// "fix" them by accident. The assertion is that they still exist: if one is
// renamed or removed, this fails and the decision gets revisited rather than
// silently lost.
// ───────────────────────────────────────────────────────────────────────────

const RESPONSIVE_BY_DESIGN = [
  {
    file: "scripts/generate-notes.mjs",
    marker: ".vx-wall{display:grid;grid-template-columns:repeat(auto-fit,",
    why: "'① Word Wall' is a gallery of self-contained cards (picture + word + meaning in ONE card), not a two-sided pairing. One card per row on a phone is the readable layout.",
  },
  {
    file: "scripts/generate-notes.mjs",
    marker: ".twr-word-grid{display:grid;grid-template-columns:repeat(auto-fit,",
    why: "The Write-About-the-Math word chips are a single checkbox list, not word↔definition.",
  },
  {
    file: "scripts/generate-notes.mjs",
    marker: ".vocab-grid{display:grid;grid-template-columns:repeat(auto-fit,",
    why: "A printable vocabulary card gallery (one card holds both word and meaning).",
  },
  {
    file: "engine/core/small-group-ui.js",
    marker: ".sg-vgrid{display:grid;grid-template-columns:repeat(auto-fit,",
    why: "The small-group word wall is a card gallery, same shape as .vx-wall.",
  },
  {
    file: "engine/core/small-group-ui.js",
    marker: ".sg-match-options{display:grid;grid-template-columns:repeat(2,1fr)",
    why: "'Quick word match' shows ONE meaning and a set of term buttons to choose from — a multiple-choice answer grid, not a two-sided board.",
  },
];

for (const entry of RESPONSIVE_BY_DESIGN) {
  assert.ok(
    read(entry.file).includes(entry.marker),
    `${entry.file}: "${entry.marker}" is gone. It was deliberately left responsive because: ${entry.why} Re-confirm the decision and update this allow-list.`,
  );
}

console.log(
  `Vocabulary contracts: ${zoomChecks} zoom-affordance checks across ${ZOOM_PATHS.length} render paths, ` +
    `${pinnedDecls} two-column declarations pinned across ${PINNED.length} activities, ` +
    `${RESPONSIVE_BY_DESIGN.length} grids allow-listed as responsive by design.`,
);
