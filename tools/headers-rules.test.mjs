#!/usr/bin/env node
/**
 * _headers structural contract.
 *
 * Cloudflare Pages does NOT let the most specific rule win. From the Pages
 * docs: "An incoming request which matches multiple rules' URL patterns will
 * inherit all rules' headers", and "if a header is applied twice in the
 * _headers file, the values are joined with a comma separator."
 *
 * So two rules that can both match the same URL and set the same header
 * produce a concatenated value. For Cache-Control that is not a cosmetic
 * problem — it is parsed by its strictest directive. Production served this
 * on 2026-07-31:
 *
 *   cache-control: public, max-age=0, must-revalidate, no-store, no-cache,
 *                  must-revalidate, max-age=0, no-store, no-cache, ...
 *
 * because `/*`, `/curriculum`, `/curriculum/`, `/curriculum/index.html` and
 * `/curriculum*` all matched /curriculum/ and all set Cache-Control. The
 * effective policy became no-store, and the 580 KB hub re-downloaded on every
 * visit with its ETag unusable.
 *
 * This test fails if any two rules that can match the same URL set the same
 * header, so the regression cannot be reintroduced by hand-editing.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HEADERS_PATH = resolve(ROOT, "_headers");

let failures = 0;
function check(ok, msg) {
  if (ok) return;
  failures++;
  console.error(`   ✗ ${msg}`);
}

/** Parse _headers into [{ pattern, headers: Map<lowerName, rawValue>, line }]. */
export function parseHeaders(text) {
  const rules = [];
  let current = null;
  text.split("\n").forEach((raw, i) => {
    const line = raw.replace(/#.*$/, "").trimEnd();
    if (!line.trim()) return;
    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: new Map(), line: i + 1 };
      rules.push(current);
      return;
    }
    const m = /^\s+([A-Za-z0-9-]+):\s*(.*)$/.exec(line);
    if (!m || !current) return;
    current.headers.set(m[1].toLowerCase(), m[2]);
  });
  return rules;
}

/**
 * Can these two Pages URL patterns match a common URL?
 *
 * Pages patterns are literal paths with optional `*` wildcards (and optional
 * :placeholders, which we treat as a single-segment wildcard). We answer the
 * question conservatively: anything we cannot prove disjoint counts as
 * overlapping, so an unusual pattern fails loudly rather than slipping through.
 */
export function patternsCanOverlap(a, b) {
  if (a === b) return true;
  const toRe = (p) =>
    new RegExp(
      `^${p
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/:[A-Za-z0-9_]+/g, "[^/]+")
        .replace(/\*/g, ".*")}$`,
    );
  const hasWildcard = (p) => /[*:]/.test(p);
  // Two exact literals overlap only if identical (handled above).
  if (!hasWildcard(a) && !hasWildcard(b)) return false;
  // A wildcard pattern vs a literal: does the wildcard match the literal?
  if (hasWildcard(a) && !hasWildcard(b)) return toRe(a).test(b);
  if (!hasWildcard(a) && hasWildcard(b)) return toRe(b).test(a);
  // Both wildcarded: compare their literal prefixes. `/a*` and `/b*` are
  // disjoint; `/a*` and `/a/b*` are not.
  const prefix = (p) => p.slice(0, p.search(/[*:]/));
  const [pa, pb] = [prefix(a), prefix(b)];
  return pa.startsWith(pb) || pb.startsWith(pa);
}

const text = readFileSync(HEADERS_PATH, "utf8");
const rules = parseHeaders(text);

console.log("_headers structural contract");

check(rules.length > 0, "_headers parsed to zero rules — the parser or the file is broken");

// 1. No two overlapping rules may set the same header.
for (let i = 0; i < rules.length; i++) {
  for (let j = i + 1; j < rules.length; j++) {
    const [a, b] = [rules[i], rules[j]];
    if (!patternsCanOverlap(a.pattern, b.pattern)) continue;
    for (const name of a.headers.keys()) {
      if (!b.headers.has(name)) continue;
      check(
        false,
        `"${name}" is set by both "${a.pattern}" (line ${a.line}) and "${b.pattern}" ` +
          `(line ${b.line}), which can match the same URL. Pages JOINS these with a comma ` +
          `instead of overriding. Put the header on exactly one matching rule.`,
      );
    }
  }
}

// 2. Surfaces whose HTML must never be shown without a server check.
for (const pattern of ["/curriculum/", "/access-practice-lab/"]) {
  const rule = rules.find((r) => r.pattern === pattern);
  check(rule !== undefined, `expected an explicit "${pattern}" rule in _headers`);
  const cc = rule?.headers.get("cache-control") ?? "";
  check(
    /\bno-(cache|store)\b/i.test(cc),
    `"${pattern}" must force revalidation (no-cache or no-store); got "${cc}"`,
  );
  check(
    !/\bmax-age=[1-9]/i.test(cc),
    `"${pattern}" must not carry a positive max-age; got "${cc}"`,
  );
}

// 3. Security headers stay on the catch-all.
const catchAll = rules.find((r) => r.pattern === "/*");
check(catchAll !== undefined, 'expected a "/*" catch-all rule');
for (const required of [
  "x-content-type-options",
  "referrer-policy",
  "content-security-policy",
  "permissions-policy",
]) {
  check(catchAll?.headers.has(required) === true, `"/*" must still set ${required}`);
}
// The catch-all must NOT set Cache-Control: it matches every URL, so doing so
// re-creates the concatenation bug against every per-path rule below it.
check(
  catchAll?.headers.has("cache-control") !== true,
  '"/*" must not set Cache-Control — it matches every URL and Pages would join ' +
    "its value onto every per-path Cache-Control. Pages' own default is already " +
    "public, max-age=0, must-revalidate.",
);

// 4. Self-test the overlap detector, so a detector that stops detecting fails
//    loudly instead of reporting a clean file.
const overlapCases = [
  ["/*", "/curriculum/", true],
  ["/curriculum*", "/curriculum/index.html", true],
  ["/curriculum", "/curriculum/", false],
  ["/curriculum/", "/access-practice-lab/", false],
  ["/assets/*", "/lessons/sw.js", false],
  ["/assets/*", "/assets/app.js", true],
  ["/lessons/*", "/lessons/sw.js", true],
  ["/a*", "/b*", false],
  ["/a*", "/a/b*", true],
  ["/*", "/anything/at/all", true],
];
for (const [a, b, want] of overlapCases) {
  check(
    patternsCanOverlap(a, b) === want,
    `overlap self-test failed: ("${a}", "${b}") should be ${want ? "overlapping" : "disjoint"}`,
  );
}

if (failures) {
  console.error(`\n✗ _headers contract: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`   ✓ ${rules.length} rules, no header set by two overlapping patterns`);
