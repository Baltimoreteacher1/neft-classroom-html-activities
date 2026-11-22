// Book Studio render regression: every template and the saved-book fixtures must keep producing identical page
// HTML, alt text and reading order. Teacher-authored books and share links depend on this. Re-pin deliberately with
// `node tools/book-render-regression.test.mjs --update` and explain the change in the commit.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { bookFromTemplate, migrate, readingOrder } from "../access-practice-lab/src/book/model.js";
import { pageAltText, pageHTML } from "../access-practice-lab/src/book/render.js";
import { TEMPLATES } from "../access-practice-lab/src/book/templates.js";

const GOLDEN = "tools/fixtures/book-render/golden.json";
const legacy = JSON.parse(
  fs.readFileSync("tools/fixtures/book-render/legacy-v1-v2.json", "utf8"),
).books;
// Ids embed a timestamp; the layout must not depend on them.
const stable = (html) => html.replace(/(data-(?:page|el|hotspot)=")[^"]+/g, "$1X");
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);

function fingerprint(book) {
  const out = {};
  for (const mode of ["read", "print", "thumb"])
    out[mode] = sha(
      book.pages
        .map((p, i) =>
          stable(pageHTML(book, p, { mode, lang: book.lang || "en", pageNumber: i + 1 })),
        )
        .join("\n"),
    );
  out.alt = sha(book.pages.map((p) => pageAltText(p)).join("\n"));
  out.order = sha(
    book.pages
      .map((p) =>
        readingOrder(p, book.dir)
          .map((e) => e.html || e.alt || e.type)
          .join("|"),
      )
      .join("\n"),
  );
  out.pages = book.pages.length;
  return out;
}

const current = {};
for (const t of TEMPLATES)
  for (const lang of ["en", "es"])
    current[`template:${t.id}:${lang}`] = fingerprint(
      bookFromTemplate(t, { title: "Fixture", lang }),
    );
for (const [id, raw] of Object.entries(legacy))
  current[`fixture:${id}`] = fingerprint(migrate(raw));

if (process.argv.includes("--update")) {
  fs.writeFileSync(GOLDEN, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`pinned ${Object.keys(current).length} books`);
} else {
  const golden = JSON.parse(fs.readFileSync(GOLDEN, "utf8"));
  assert.deepEqual(
    Object.keys(current).sort(),
    Object.keys(golden).sort(),
    "template or fixture set changed: re-pin deliberately",
  );
  for (const k of Object.keys(golden))
    assert.deepEqual(current[k], golden[k], `${k} renders differently from the pinned output`);
  // Migration keeps every element of the old shapes.
  const v1 = migrate(legacy["v1-draft"]);
  assert.equal(v1.format, "landscape");
  assert.equal(v1.pages[0].elements.length, 2);
  const v2 = migrate(legacy["v2-picture-book"]);
  assert.deepEqual(
    v2.pages.map((p) => p.elements.length),
    [3, 2],
  );
  assert.equal(v2.pages[0].narration, "A story about rain.");
  console.log(
    `PASS book render regression: ${Object.keys(golden).length} pinned books (${TEMPLATES.length} templates x en/es + saved-book fixtures)`,
  );
}
