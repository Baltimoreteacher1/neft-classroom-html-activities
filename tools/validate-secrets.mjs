#!/usr/bin/env node
/* =============================================================================
 * validate-secrets.mjs — committed credentials must not reach the student site.
 * -----------------------------------------------------------------------------
 * A static scan over tracked text. It does not prove the absence of every
 * secret — it proves the absence of the shapes that have already shipped in
 * other classroom repos (PEM private keys, GitHub PATs, AWS access keys,
 * Slack tokens, OpenAI sk- keys). High-confidence patterns only; a noisy
 * scanner gets deleted, and a deleted scanner is how a key lands in git.
 *
 * Self-tests against a fixture string BEFORE scanning the tree, so a regex
 * that stops firing fails loudly instead of reporting a clean repo.
 * ============================================================================= */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const PATTERNS = [
  { id: "pem-private-key", re: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/ },
  { id: "github-pat", re: /\bghp_[A-Za-z0-9]{36}\b/ },
  { id: "github-fine-grained", re: /\bgithub_pat_[A-Za-z0-9_]{80,}\b/ },
  { id: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: "slack-bot", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: "openai-sk", re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { id: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
];

const SKIP_PATH = /(?:^|\/)(node_modules|dist|\.git|\.qa-logs|coverage|playwright-report)(?:\/|$)/;

function scanText(text) {
  const hits = [];
  for (const { id, re } of PATTERNS) {
    re.lastIndex = 0;
    if (re.test(text)) hits.push(id);
  }
  return hits;
}

/* --- Self-test: each detector must still fire on a known-bad fixture ------ */
const FIXTURES = {
  "pem-private-key": "-----BEGIN RSA PRIVATE KEY-----\nMIIE",
  "github-pat": "token ghp_" + "a".repeat(36),
  "github-fine-grained": "github_pat_" + "a".repeat(82),
  "aws-access-key": "AKIAIOSFODNN7EXAMPLE",
  "slack-bot": "xoxb-1234567890-abcdefghij",
  "openai-sk": "sk-" + "a".repeat(48),
  "google-api-key": "AIza" + "a".repeat(35),
};
const selfFails = [];
for (const { id } of PATTERNS) {
  const hit = scanText(FIXTURES[id]);
  if (!hit.includes(id)) selfFails.push(`${id} did not match its fixture`);
  const clean = scanText("no secrets here, just classroom copy");
  if (clean.length) selfFails.push(`${id} matched clean prose: ${clean.join(",")}`);
}
if (selfFails.length) {
  console.error("validate-secrets self-test FAILED:");
  for (const f of selfFails) console.error(`  ✗ ${f}`);
  process.exit(1);
}

const files = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "buffer" })
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .filter((f) => !SKIP_PATH.test(f))
  .filter((f) => !/\.(png|jpe?g|gif|webp|ico|woff2?|ttf|eot|mp3|mp4|zip|pdf|wasm)$/i.test(f));

const findings = [];
for (const rel of files) {
  let text;
  try {
    text = readFileSync(join(ROOT, rel), "utf8");
  } catch {
    continue; // binary or unreadable — skip, do not invent a pass
  }
  if (rel === relative(ROOT, fileURLToPath(import.meta.url))) continue;
  const hits = scanText(text);
  for (const id of hits) findings.push({ file: rel, id });
}

if (findings.length) {
  console.error("validate-secrets FAILED — possible committed credential:");
  for (const f of findings) console.error(`  ✗ ${f.file}  (${f.id})`);
  console.error("Redact the value, rotate it if it was ever real, and do not weaken this regex.");
  process.exit(1);
}
console.log(`✓ secrets: ${PATTERNS.length} detectors, ${files.length} tracked text files, 0 hits.`);
