#!/usr/bin/env node
/**
 * canonical-host.test.mjs — authentication must never be issued on a hostname
 * the next page will not be served from.
 *
 * THE BUG THIS PINS. www.eduwonderlab.com and eduwonderlab.com were two fully
 * independent, equally functional hosts: both served every page, both minted
 * teacher sessions, and neither redirected to the other. The session cookie is
 * host-only — deliberately, because a host-only cookie is the stronger default
 * — so a teacher who signed in on www and then reached the apex by ANY route
 * (a bookmark, an omnibox completion, a search result, the canonical <link>
 * that every page already advertises) arrived with no cookie and was told to
 * sign in again. Authentication was working the whole time. It just did not
 * travel, and from the teacher's side that is indistinguishable from a rejected
 * password.
 *
 * WHY THE EARLIER VERIFICATION MISSED IT. Every check — curl, the API probe,
 * even the real-browser E2E — started from ONE host and stayed there, because
 * each began by navigating straight to a full URL. Within a single host the
 * flow is flawless, which is exactly what those tests reported. Nothing ever
 * crossed the boundary the teacher crossed.
 *
 * So these assertions are about the boundary itself, and they need no
 * credential to run.
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

t("the query survives, so ?next= still points where the teacher was going", () => {
  // If this is dropped, a teacher who clicked a protected page is canonicalized
  // to a sign-in form that then sends them to the wrong place afterwards.
  assert.equal(
    at("https://www.eduwonderlab.com/teacher-login/?next=%2Fcurriculum%2Fplanning%2F"),
    "https://eduwonderlab.com/teacher-login/?next=%2Fcurriculum%2Fplanning%2F",
  );
});

t("the sign-in endpoint itself canonicalizes, so a POST cannot mint a www cookie", () => {
  assert.equal(
    at("https://www.eduwonderlab.com/api/teacher-auth/login"),
    "https://eduwonderlab.com/api/teacher-auth/login",
  );
});

t("the apex is left alone — no redirect loop", () => {
  assert.equal(at("https://eduwonderlab.com/"), null);
  assert.equal(at("https://eduwonderlab.com/teacher-login/"), null);
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
  // 301/302 turn a POST into a GET and drop the body, which would break the
  // sign-in POST itself rather than fixing it.
  const src = readFileSync(new URL("./_middleware.js", import.meta.url), "utf8");
  assert.match(src, /status:\s*308/, "the canonical redirect is no longer method-preserving");
});

/* ── The document-request test that decides which gate a person sees ───────── */

t("a browser that omits Sec-Fetch-Mode is still treated as a person", () => {
  // Safari and the in-app webviews in Gmail/Classroom/Teams may send no
  // Sec-Fetch metadata. When that made `wantsHtml` false, the middleware
  // answered a teacher with `WWW-Authenticate: Basic` — the SITE-ENTRY gate,
  // which checks a different secret from the one they were typing.
  const src = readFileSync(new URL("./_middleware.js", import.meta.url), "utf8");
  assert.match(
    src,
    /!fetchMode && accepts\.includes\("text\/html"\)/,
    "the Accept fallback is gone — browsers without Sec-Fetch-Mode will get a Basic dialog again",
  );
  assert.match(src, /fetchMode === "navigate"/, "the Sec-Fetch-Mode signal is no longer trusted");
});

console.log(`canonical host: ${passed} assertions passed.`);
