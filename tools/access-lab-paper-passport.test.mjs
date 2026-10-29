import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import {
  PAPER_PASSPORT_FILES,
  paperPassportMenu,
} from "../access-practice-lab/src/paper-passport.js";

const DIR = new URL("../access-practice-lab/paper-passport/", import.meta.url);
// html`` returns { [Symbol("raw")]: string }; the symbol is private to util.js.
const text = (wrapped) => wrapped[Object.getOwnPropertySymbols(wrapped)[0]];

test("every paper-passport link points at a committed PDF", () => {
  for (const { file } of PAPER_PASSPORT_FILES) {
    const bytes = readFileSync(new URL(file, DIR));
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-", `${file} is not a PDF`);
  }
});

test("the menu offers Open and Download for each file, in both languages", () => {
  for (const mode of ["en", "es"]) {
    const out = text(paperPassportMenu(makeI18n(mode)));
    for (const { file } of PAPER_PASSPORT_FILES) {
      assert.ok(
        out.includes(`href="/access-practice-lab/paper-passport/${file}"`),
        `${mode}: link to ${file}`,
      );
    }
    assert.equal(out.match(/ download>/g).length, PAPER_PASSPORT_FILES.length);
    assert.equal(out.match(/target="_blank" rel="noopener"/g).length, PAPER_PASSPORT_FILES.length);
  }
});
