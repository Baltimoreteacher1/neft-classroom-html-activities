#!/usr/bin/env node
/**
 * Live-site smoke test — checks the DEPLOYED site (not just source) so a broken
 * Cloudflare deploy is caught even when the source audits pass. Asserts that
 * public pages serve, gated pages stay gated, and the mailbox insights endpoint
 * responds. Exits non-zero on any mismatch (so the Site Health workflow fails
 * and notifies the owner).
 *
 * Run locally: `node tools/smoke-live-site.mjs`
 */
const BASE = "https://eduwonderlab.com";
const INSIGHTS =
  "https://script.google.com/macros/s/AKfycbxs4s0aA4LQCuIyrmdg6RIvv27eVm7PpbDrWR1SVmWsqvRVdfDWHEzFzaEpnorpPe7wrQ/exec";

// [label, url, expected status]. Gated pages must stay 401; public ones 200.
const CHECKS = [
  ["mailbox (public)", BASE + "/curriculum/student-digital-mailbox/", 200],
  ["mailbox CSS (public)", BASE + "/curriculum/student-digital-mailbox/mailbox.css", 200],
  ["mailbox links.js (public)", BASE + "/curriculum/student-digital-mailbox/mailbox-links.js", 200],
  ["teacher page (gated)", BASE + "/curriculum/student-digital-mailbox/teacher/", 401],
  ["curriculum hub (gated)", BASE + "/curriculum/", 401],
  ["insights endpoint", INSIGHTS, 200],
];

async function statusOf(url) {
  // Follow redirects (the Apps Script endpoint 302s to its final JSON host).
  const res = await fetch(url, { redirect: "follow" });
  return res.status;
}

const failures = [];
for (const [label, url, want] of CHECKS) {
  let got;
  try {
    got = await statusOf(url);
  } catch (e) {
    got = "ERR (" + e.message + ")";
  }
  const ok = got === want;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${got} (expected ${want})`);
  if (!ok) failures.push(`${label}: got ${got}, expected ${want}`);
}

if (failures.length) {
  console.error("\n✗ Live-site smoke FAILED:");
  failures.forEach((f) => console.error("   • " + f));
  process.exit(1);
}
console.log("\n✓ Live-site smoke passed — deployed site is healthy.");
