#!/usr/bin/env node
/**
 * `npm audit`, with accepted advisories written down instead of endured.
 *
 * The gate used to be `npm audit --audit-level=high`, which is binary: every
 * advisory blocks, whether or not a fix exists. Two image-size advisories have
 * no fixed version at all — the whole published range is affected, and npm's
 * "fix" is a three-major DOWNGRADE of pptxgenjs — so that gate could not go
 * green by any action anyone could take.
 *
 * A required check that cannot pass is worse than no check. People stop reading
 * it, and it stops carrying information about the advisories that DO have fixes.
 * This session already found two things rotting behind exactly that: the audit
 * step skipping every functional check below it, and a Bash guard wired to a
 * script nobody had noticed was missing.
 *
 * So: accepted advisories live in tools/audit-allowlist.json with a reason and a
 * reviewBy date, and everything else still fails. An exception expires by
 * itself in three ways, each of which fails the build rather than lapsing
 * quietly:
 *
 *   - a fix becomes available for it (npm says fixAvailable, and not merely a
 *     semver-major downgrade of the parent);
 *   - its reviewBy date passes;
 *   - it stops appearing in the audit at all, so the entry is now dead weight
 *     claiming to justify something.
 *
 *   node tools/audit-allowlist.mjs
 *   node tools/audit-allowlist.mjs --json    # raw npm audit passthrough
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const BLOCKING = new Set(["high", "critical"]);
/* A real calendar date, not merely a string that sorts. "9999-99-99" matches
   the shape but Date.parse rejects it, so both tests have to pass. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const allowlist = JSON.parse(readFileSync(resolve(HERE, "audit-allowlist.json"), "utf8"));
const accepted = new Map(allowlist.accepted.map((a) => [a.id, a]));

/* `npm run` exports every npm config as an npm_config_* variable, and the
   nested `npm audit` re-reads them as its OWN flags. One unsupported key in a
   developer's ~/.npmrc — allow-scripts — therefore reached this child as
   --allow-scripts and killed it with EALLOWSCRIPTS, so the gate's verdict
   depended on who ran it and how. Strip them: this audit answers to the
   lockfile, not to the shell that happened to spawn it. */
const CHILD_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !k.startsWith("npm_config")),
);

let report;
try {
  // npm audit exits non-zero when it finds anything, so the throw is expected
  // and the payload still arrives on stdout.
  report = execFileSync("npm", ["audit", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
    env: CHILD_ENV,
  });
} catch (error) {
  report = error.stdout;
}

if (!report) {
  console.error("✗ npm audit produced no output — refusing to report a pass on nothing.");
  process.exit(1);
}

/* A FAILED audit is not a clean audit. npm answers a broken invocation with
   `{"error":{...}}` and exit 1 — and `.vulnerabilities ?? {}` read that as
   zero findings, so the gate announced "0 blocking" and, seeing none of its
   own accepted advisories in the empty report, demanded that every live
   exception be deleted. Deleting them would have made the next working run
   fail on advisories that were already understood and accepted. Refuse the
   report instead. */
let parsed;
try {
  parsed = JSON.parse(report);
} catch {
  console.error("✗ npm audit did not return JSON — refusing to report a pass on nothing.");
  process.exit(1);
}
if (parsed.error || (!parsed.vulnerabilities && !parsed.metadata)) {
  const e = parsed.error ?? {};
  console.error(
    `✗ npm audit failed${e.code ? ` (${e.code})` : ""} — refusing to report a pass on nothing.`,
  );
  if (e.summary) console.error(`  ${e.summary}`);
  process.exit(1);
}

if (process.argv.includes("--json")) {
  console.log(report);
  process.exit(0);
}

const vulns = parsed.vulnerabilities ?? {};

const blocking = [];
const honoured = [];
const stale = [];
const seen = new Set();
const today = new Date().toISOString().slice(0, 10);

for (const [name, v] of Object.entries(vulns)) {
  if (!BLOCKING.has(v.severity)) continue;
  for (const via of v.via ?? []) {
    if (typeof via !== "object" || via.source == null) continue;
    seen.add(via.source);
    const entry = accepted.get(via.source);
    if (!entry) {
      blocking.push({ name, id: via.source, title: via.title, url: via.url });
      continue;
    }

    // A real fix is one that does not mean demoting the parent a major version.
    const fix = v.fixAvailable;
    const realFix = fix === true || (fix && typeof fix === "object" && !fix.isSemVerMajor);
    if (realFix) {
      stale.push({ id: via.source, why: `a fix is now available (${JSON.stringify(fix)})` });
      continue;
    }
    // The date must be real before it can be compared. `entry.reviewBy &&`
    // meant a missing date skipped the check entirely and accepted the
    // advisory forever, and a malformed string can sort after every ISO date
    // and do the same — either way the "expires by itself" guarantee this file
    // advertises would be quietly void. An entry without a valid date is not a
    // decision with an expiry; it is a permanent pass, so it fails.
    if (!ISO_DATE.test(entry.reviewBy ?? "") || !Number.isFinite(Date.parse(entry.reviewBy))) {
      stale.push({
        id: via.source,
        why: `reviewBy is ${JSON.stringify(entry.reviewBy)} — must be a real YYYY-MM-DD date`,
      });
      continue;
    }
    if (entry.reviewBy < today) {
      stale.push({ id: via.source, why: `reviewBy ${entry.reviewBy} has passed` });
      continue;
    }
    honoured.push({ id: via.source, name, title: via.title, reviewBy: entry.reviewBy });
  }
}

for (const entry of allowlist.accepted) {
  if (!seen.has(entry.id)) {
    stale.push({ id: entry.id, why: "no longer reported by npm audit — remove the entry" });
  }
}

console.log(
  `dependency audit: ${blocking.length} blocking, ${honoured.length} accepted, ${stale.length} needing review`,
);
for (const h of honoured) {
  console.log(`   · accepted until ${h.reviewBy}: ${h.name} — ${h.title}`);
}

if (stale.length) {
  console.error("\n✗ allowlist entries that must be revisited:");
  for (const s of stale) console.error(`   · ${s.id}: ${s.why}`);
  console.error(
    "\n  An accepted risk is a decision with an expiry, not a permanent pass.\n" +
      "  Update or remove the entry in tools/audit-allowlist.json.",
  );
}

if (blocking.length) {
  console.error(`\n✗ ${blocking.length} advisory(ies) not accepted:`);
  for (const b of blocking) console.error(`   · ${b.name}: ${b.title}\n     ${b.url}`);
  console.error(
    "\n  Fix them, or — if there is genuinely no fix and the exposure is\n" +
      "  understood — add an entry to tools/audit-allowlist.json saying why,\n" +
      "  with a date to look again. Do not add one just to go green.",
  );
}

process.exit(blocking.length || stale.length ? 1 : 0);
