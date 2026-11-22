#!/usr/bin/env node
// Are the site's Google Forms open to someone who is NOT signed in? Read-only: one GET per responder link, nothing is
// submitted and nothing is changed. A responder link (…/viewform) that answers 200 opens for anyone; 401 means the form
// still requires a Google sign-in (the "restricted" setting) and is blocked for students and families who are not
// signed in to the school account; 404 means the form no longer exists.
//
//   node teacher-tools/post-forms/check-forms-open.mjs            summary only
//   node teacher-tools/post-forms/check-forms-open.mjs --list     also list every form that is not open
//
// Exit code 0 only when every responder link is open. Owner links (…/edit) are for the form's owner and are not checked.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const LIST = process.argv.includes("--list");
const PATTERN = /https:\/\/docs\.google\.com\/forms\/d\/(?:e\/)?[A-Za-z0-9_-]{20,}\/viewform/g;
const SKIP = /^(node_modules|dist)\/|\.(png|jpe?g|pdf|docx|pptx|zip|woff2?|mp[34]|xlsx|gz)$/i;

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 }).split("\0").filter((f) => f && !SKIP.test(f));
const where = new Map();
for (const f of files) {
  let text;
  try {
    text = readFileSync(`${root}/${f}`, "utf8");
  } catch {
    continue;
  }
  for (const m of text.matchAll(PATTERN)) where.set(m[0], (where.get(m[0]) || new Set()).add(f));
}
const urls = [...where.keys()];
if (!urls.length) {
  console.log("No responder links found.");
  process.exit(2);
}

async function probe(url) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(25_000) });
    return { url, status: res.status };
  } catch (error) {
    return { url, status: 0, error: error.name };
  }
}
const results = [];
let next = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (next < urls.length) results.push(await probe(urls[next++]));
  }),
);

const by = { open: [], signin: [], gone: [], other: [] };
for (const r of results) (r.status === 200 ? by.open : r.status === 401 || r.status === 403 ? by.signin : r.status === 404 ? by.gone : by.other).push(r);
console.log(`Checked ${results.length} responder links (anonymous, read-only)`);
console.log(`  open to anyone:              ${by.open.length}`);
console.log(`  still require Google sign-in: ${by.signin.length}`);
console.log(`  form not found (404):         ${by.gone.length}`);
console.log(`  other / network problem:      ${by.other.length}`);
if (LIST) for (const [label, list] of [["REQUIRE SIGN-IN", by.signin], ["NOT FOUND", by.gone], ["OTHER", by.other]]) for (const r of list) console.log(`${label}  ${r.status}  ${r.url}  (${[...where.get(r.url)][0]})`);
process.exit(by.open.length === results.length ? 0 : 1);
