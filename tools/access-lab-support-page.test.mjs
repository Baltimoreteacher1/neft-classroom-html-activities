// The Language Page contact page: both languages, one real address, and the app's Help section points at it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("access-practice-lab/support/index.html", "utf8");
const strings = readFileSync("access-practice-lab/native-app/strings.js", "utf8");
const sheet = readFileSync("access-practice-lab/native-app/sheet.js", "utf8");
const EMAIL = "neftjd@gmail.com";

test("support page has English and Spanish sections, each marked with its language", () => {
  assert.match(page, /<section lang="en"[^>]*>/);
  assert.match(page, /<section lang="es"[^>]*>/);
  assert.match(page, /<h1 id="h-en">Contact and help<\/h1>/);
  assert.match(page, /<h1 id="h-es">Contacto y ayuda<\/h1>/);
});

test("support page offers one email address in both languages and no other contact", () => {
  assert.equal((page.match(/mailto:/g) || []).length, 2);
  assert.equal((page.match(new RegExp(`mailto:${EMAIL.replace(".", "\\.")}`, "g")) || []).length, 2);
  assert.ok(!/\b[\w.+-]+@(?!gmail\.com)[\w-]+\.[a-z]{2,}/i.test(page.replace(/@media/g, "")), "only the one address");
});

test("support page asks families not to send a child's name, school or voice (both languages)", () => {
  assert.match(page, /child's full name, school, address/);
  assert.match(page, /nombre completo de un niño o niña|nombre completo de un niño/);
});

test("support page links home and to the privacy page, and has a title and description", () => {
  assert.ok(page.includes('href="/access-practice-lab/"'));
  assert.ok(page.includes('href="/access-practice-lab/privacy"'));
  assert.match(page, /<title>Contact and help \| The Language Page<\/title>/);
  assert.match(page, /<meta\s+name="description"\s+content="[^"]{20,}"\s*\/?>/);
});

test("the app's Help section names the same address and links the support page", () => {
  assert.equal((strings.match(new RegExp(EMAIL.replace(".", "\\."), "g")) || []).length, 2, "en and es help text");
  assert.match(sheet, /SUPPORT_PATH = "\/access-practice-lab\/support\/"/);
  assert.match(sheet, /"support\.link"/);
  assert.match(strings, /"support\.link": "Contact and help"/);
  assert.match(strings, /"support\.link": "Contacto y ayuda"/);
});
