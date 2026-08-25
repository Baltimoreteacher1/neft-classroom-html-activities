#!/usr/bin/env node
/**
 * canonical-host.test.mjs — a credential must never be entered on a hostname
 * the next page will not be served from.
 *
 * THE BUG THIS PINS. www.eduwonderlab.com and eduwonderlab.com were two fully
 * independent, equally functional hosts: both served every page, both issued
 * their own authentication challenge, and neither redirected to the other. A
 * browser scopes a stored Basic Auth credential to the host it was entered on,
 * so a teacher who authenticated on www and then reached the apex by ANY route
 * (a bookmark, an omnibox completion, a search result, the canonical <link>
 * that every page already advertises) was challenged a second time.
 * Authentication was working the whole time. It just did not travel, and from
 * the teacher's side that is indistinguishable from a rejected password.
 *
 * WHY THE EARLIER VERIFICATION MISSED IT. Every check — curl, the API probe,
 * even the real-browser E2E — started from ONE host and stayed there, because
 * each began by navigating straight to a full URL. Within a single host the
 * flow is flawless, which is exactly what those tests reported. Nothing ever
 * crossed the boundary the teacher crossed.
 *
 * So these assertions are about the boundary itself, and they need no
 * credential to run. This is the ONE piece of the 2026-08-16 auth work kept
 * through the rollback to the known-good gate: it depends on nothing the
 * rollback removed, and the bug it fixes is real under Basic Auth too.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canonicalRedirect } from "./_middleware.js";

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
};

const at = (u) => canonicalRedirect(new URL(u));

t("www is redirected to the apex", () => {
  assert.equal(at("https://www.eduwonderlab.com/"), "https://eduwonderlab.com/");
});

t("the path survives canonicalization", () => {
  assert.equal(
    at("https://www.eduwonderlab.com/curriculum/planning/"),
    "https://eduwonderlab.com/curriculum/planning/",
  );
});

t("the query survives canonicalization", () => {
  // A teacher-tools deep link carries its state in the query string; dropping
  // it canonicalizes them to the right page in the wrong state.
  assert.equal(
    at("https://www.eduwonderlab.com/curriculum/planning/?unit=3"),
    "https://eduwonderlab.com/curriculum/planning/?unit=3",
  );
});

t("the apex is left alone — no redirect loop", () => {
  assert.equal(at("https://eduwonderlab.com/"), null);
  assert.equal(at("https://eduwonderlab.com/curriculum/planning/"), null);
});

t("preview deployments are left alone", () => {
  // ship.sh smoke-tests preview builds; canonicalizing them would send those
  // checks at production and quietly stop testing the thing being deployed.
  assert.equal(at("https://neft-classroom-html-activities.pages.dev/curriculum/"), null);
  assert.equal(at("https://abc123.neft-classroom-html-activities.pages.dev/"), null);
});

t("an unrelated host is not captured", () => {
  assert.equal(at("https://noam.eduwonderlab.com/"), null);
  assert.equal(at("https://example.com/"), null);
});

t("the redirect is method-preserving in the middleware, not a 301", () => {
  // 301/302 turn a POST into a GET and drop the body, which would break any
  // form that happens to arrive on www rather than fixing it.
  const src = readFileSync(new URL("./_middleware.js", import.meta.url), "utf8");
  assert.match(src, /status:\s*308/, "the canonical redirect is no longer method-preserving");
});

t("canonicalization runs BEFORE the password gate", () => {
  // If the gate ran first, www would issue its own Basic challenge and the
  // credential would be stored against the wrong host — the original bug.
  const src = readFileSync(new URL("./_middleware.js", import.meta.url), "utf8");
  const canonical = src.indexOf("const canonical = canonicalRedirect(url)");
  const gate = src.indexOf("WWW-Authenticate");
  assert.ok(canonical > 0, "the canonical redirect is gone from onRequest");
  assert.ok(gate > 0, "the Basic Auth gate is gone from onRequest");
  assert.ok(canonical < gate, "the password gate now runs before canonicalization");
});

console.log(`canonical host: ${passed} assertions passed.`);
