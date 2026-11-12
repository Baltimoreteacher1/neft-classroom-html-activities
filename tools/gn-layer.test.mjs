#!/usr/bin/env node
/* =============================================================================
 * gn-layer.test.mjs — the shared Axiom City layer is wired into all 41 books, and its data is true.
 * -----------------------------------------------------------------------------
 * graphic-novels/_shared/gn-layer.js adds vocabulary pop-ups, an Easy read switch and formatting fixes
 * to every book from ONE script plus a per-book sentinel block (tools/inject-gn-layer.mjs). What can go
 * wrong silently, and is pinned here: a book with zero or two blocks, a vocabulary term that no lesson
 * of that book defines, an injector that is not idempotent or cannot revert byte for byte, a layer that
 * does not parse, an extraction key that differs from the runtime key (the two must share ONE
 * normalization), a vocabulary matcher that drifts from engine/core/vocab-match.js, and an Easy-read
 * verifier that has stopped catching changed numbers. The browser half is tools/verify-gn-layer-browser.mjs.
 * ========================================================================== */
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
import { blockFor, inject, revert } from "./inject-gn-layer.mjs";
import { loadLessonConfig } from "./lib/curriculum-source.mjs";
import { verifyEasy } from "./lib/gn-easy-verify.mjs";
import { extractBook } from "./lib/gn-extract.mjs";
import {
  bookLessons,
  EASY_DIR,
  engineMatcher,
  LAYER_FILE,
  listBooks,
  loadLayer,
} from "./lib/gn-layer.mjs";

const books = listBooks();
assert.equal(books.length, 41, "expected 41 Axiom City books");
const layerSrc = readFileSync(LAYER_FILE, "utf8");
const layer = loadLayer();

/* 1. the layer parses as a classic script and exposes the shared functions */
new vm.Script(layerSrc, { filename: LAYER_FILE });
for (const fn of ["normalizeKey", "collectLeaves", "describe", "buildMatcher", "boot"])
  assert.equal(typeof layer[fn], "function", `layer.${fn}`);
assert.equal(layer.normalizeKey("  a \n b  c "), "a b c");
assert.equal(
  layerSrc.match(/const normalizeKey\s*=/g).length,
  1,
  "normalizeKey is defined exactly once",
);

/* 2. the extractor and the verifier use the layer's normalization, not their own */
for (const f of ["tools/lib/gn-extract.mjs", "tools/lib/gn-easy-verify.mjs"]) {
  const src = readFileSync(join(import.meta.dirname, "..", f), "utf8");
  assert.match(src, /loadLayer\(\)/, `${f} loads the shared layer`);
  assert.doesNotMatch(
    src,
    /const normalizeKey|function normalizeKey/,
    `${f} must not define its own normalization`,
  );
}

let terms = 0;
for (const book of books) {
  const html = readFileSync(book.file, "utf8");
  /* 3. exactly one block, at the end, with parseable data */
  assert.equal(html.split("<!-- gn-layer:begin").length - 1, 1, `${book.slug}: one gn-layer:begin`);
  assert.equal(html.split("<!-- gn-layer:end -->").length - 1, 1, `${book.slug}: one gn-layer:end`);
  assert.equal(
    html.split('src="/graphic-novels/_shared/gn-layer.js"').length - 1,
    1,
    `${book.slug}: one layer script tag`,
  );
  assert.match(
    html,
    /<!-- gn-layer:end -->\n<\/body>\n<\/html>\n?$/,
    `${book.slug}: block sits just before </body>`,
  );
  const read = (id) =>
    JSON.parse(
      html.match(new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)</script>`))[1],
    );
  const vocab = read("gn-vocab");
  const easy = read("gn-easy");
  assert.equal(easy.v, 1, `${book.slug}: gn-easy version`);
  assert.equal(typeof easy.map, "object");
  assert.ok(vocab.length > 0, `${book.slug}: vocabulary is empty`);

  /* 4. every term is defined by a lesson this book teaches */
  const { ids } = bookLessons(html);
  for (const v of vocab) {
    assert.ok(
      ids.includes(v.lesson),
      `${book.slug}: "${v.term}" from lesson ${v.lesson}, not one of ${ids}`,
    );
    const own = (loadLessonConfig(v.lesson).vocabulary || []).find((x) => x.term === v.term);
    assert.ok(own, `${book.slug}: lesson ${v.lesson} has no term "${v.term}"`);
    assert.equal(
      own.definition,
      v.definition,
      `${book.slug}: "${v.term}" definition differs from the lesson's`,
    );
    terms++;
  }
  const dupes = vocab.map((v) => v.term.toLowerCase());
  assert.equal(new Set(dupes).size, dupes.length, `${book.slug}: duplicate vocabulary terms`);

  /* 5. idempotent and exactly reversible */
  assert.equal(
    inject(html, blockFor(book, html)),
    html,
    `${book.slug}: injector is not idempotent`,
  );
  const bare = revert(html);
  assert.ok(!bare.includes("gn-layer"), `${book.slug}: revert left something behind`);
  assert.equal(
    inject(bare, blockFor(book, html)),
    html,
    `${book.slug}: revert then inject differs`,
  );

  /* 6. the layer's vocabulary matcher is the engine's matcher */
  const mine = layer.buildMatcher(vocab);
  const engine = engineMatcher(vocab);
  assert.equal(
    mine.regexSource,
    engine.regexSource,
    `${book.slug}: regexSource drifted from engine/core/vocab-match.js`,
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(mine.lookup)),
    engine.lookup,
    `${book.slug}: lookup drifted from engine/core/vocab-match.js`,
  );
}

/* 7. extraction: unique, normalized, non-empty keys; same keys the runtime computes */
for (const book of books) {
  const { items } = extractBook(book.file);
  assert.ok(items.length > 20, `${book.slug}: only ${items.length} extracted strings`);
  const keys = items.map((i) => i.key);
  assert.equal(new Set(keys).size, keys.length, `${book.slug}: duplicate extraction keys`);
  const ids = items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, `${book.slug}: duplicate extraction ids`);
  for (const i of items)
    assert.equal(layer.normalizeKey(i.key), i.key, `${book.slug}: ${i.id} key is not normalized`);
}

/* 8. the Easy-read verifier still catches what it exists to catch */
const dir = mkdtempSync(join(tmpdir(), "gn-easy-"));
const probe = books.find((b) => b.slug.includes("u6-e2"));
const probeItems = extractBook(probe.file).items;
const mathy = probeItems.find((i) => /\d/.test(i.key) && i.kind === "balloon");
const withTerm = probeItems.find((i) => /exponent/i.test(i.key) && i.kind === "balloon");
const run = (map) => {
  const f = join(dir, "easy.json");
  writeFileSync(f, JSON.stringify({ v: 1, map }));
  return verifyEasy(probe.file, f).errors;
};
assert.deepEqual(run({ [mathy.key]: mathy.html }), [], "an unchanged string must verify clean");
assert.ok(
  run({ [mathy.key]: mathy.html.replace(/\d/, (d) => String((Number(d) + 1) % 10)) }).some((e) =>
    /math or numbers/.test(e),
  ),
  "a changed digit must fail",
);
assert.ok(
  run({ [withTerm.key]: withTerm.html.replace(/exponent/gi, "small number") }).some((e) =>
    /vocabulary/.test(e),
  ),
  "a dropped vocabulary term must fail",
);
assert.ok(
  run({ [mathy.key]: `${mathy.html} ${mathy.html}` }).some((e) => /easy text is/.test(e)),
  "text over 110% must fail",
);
assert.ok(
  run({ [mathy.key]: `${mathy.html}<img src=x onerror=1>` }).some((e) =>
    /tags not allowed/.test(e),
  ),
  "block markup must fail",
);
assert.ok(
  run({ "no such text anywhere in this book": "x" }).some((e) => /not in this book/.test(e)),
  "an unknown key must fail",
);

/* 9. every authored easy file passes its own verifier and is embedded as-is in its book */
let easyStrings = 0;
for (const book of books) {
  const file = join(EASY_DIR, `${book.slug}.json`);
  if (!existsSync(file)) continue;
  const { errors, checked } = verifyEasy(book.file, file);
  assert.deepEqual(errors, [], `${book.slug}: easy file fails --verify`);
  easyStrings += checked;
  const embedded = JSON.parse(
    readFileSync(book.file, "utf8").match(/id="gn-easy">([\s\S]*?)<\/script>/)[1],
  );
  assert.deepEqual(
    embedded.map,
    JSON.parse(readFileSync(file, "utf8")).map,
    `${book.slug}: embedded easy map differs from easy/${book.slug}.json`,
  );
}

console.log(
  `gn-layer: ${books.length} books, ${terms} vocabulary entries, injector idempotent and reversible, matcher == engine, extraction keys unique, ${easyStrings} easy strings verified`,
);
