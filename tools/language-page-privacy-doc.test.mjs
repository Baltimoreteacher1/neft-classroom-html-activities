#!/usr/bin/env node
/* docs/language-page/privacy.md is built from the privacy page and the third-party list: it may not drift from them.
 * Also pins that a declared third-party host reaches the document, and that the page text reaches both languages. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OUT, renderPrivacyDoc } from "./generate-language-page-privacy-doc.mjs";

const onDisk = readFileSync(new URL(`../${OUT}`, import.meta.url), "utf8");
assert.equal(
  onDisk,
  renderPrivacyDoc(),
  `${OUT} is stale: run node tools/generate-language-page-privacy-doc.mjs`,
);
const withHost = renderPrivacyDoc({
  hosts: [{ host: "x.example", purpose: "p", dataSent: "d", retention: "r" }],
});
assert.match(
  withHost,
  /\| x\.example \| p \| d \| r \|/,
  "a declared host must appear in the document",
);
assert.match(
  onDisk,
  /### AI helpers: what they get and what they keep/,
  "the AI section is missing from English",
);
assert.match(
  onDisk,
  /### Ayudantes de IA: lo que reciben y lo que guardan/,
  "the AI section is missing from Spanish",
);
assert.match(onDisk, /DRAFT FOR LEGAL REVIEW|draft for legal review/i);
console.log(
  "language-page-privacy-doc: PASS (privacy.md matches its sources; a declared host reaches it)",
);
