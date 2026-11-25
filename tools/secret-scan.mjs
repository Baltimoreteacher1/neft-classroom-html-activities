#!/usr/bin/env node
/**
 * Secret scan: key-shaped strings plus an entropy check on secret-named assignments.
 *
 *   node tools/secret-scan.mjs [path ...]     (default: every git-tracked text file)
 *
 * Exit 0 clean, 1 findings, 3 could not run (bad path, git failure; CI treats 3 as failure).
 * Output never contains the secret: file, line, rule and the first 4 characters only.
 * A line may carry `secret-scan:allow` (with a reason) to accept a documented placeholder.
 *
 * Complements tools/validate-secrets.mjs (high-confidence shapes, part of `validate`): this adds
 * Anthropic/Stripe/JWT/database-URL shapes and an entropy-lite pass over `password = "..."` style
 * assignments, which is how a pasted credential usually looks. Rules are tested against fixtures
 * (tools/secret-scan.test.mjs): a rule that stops firing fails that test.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_BYTES = 1_000_000;
const SKIP_PATH =
  /(?:^|\/)(?:node_modules|dist|\.git|\.qa-logs|coverage|playwright-report)\/|(?:^|\/)package-lock\.json$/;
const ALLOW = "secret-scan:allow";

/** Files that hold deliberate fixtures for another scanner. Exact paths, each with its reason. */
export const ALLOWED_FILES = new Map([
  [
    "tools/validate-secrets.mjs",
    "self-test fixtures: known-bad key shapes the sibling scanner must still detect",
  ],
]);

/** Cloudflare Web Analytics site tokens are public by design (they ship in page HTML). */
const PUBLIC_TOKEN_CONTEXT = /data-cf-beacon/;

export const RULES = [
  {
    id: "pem-private-key",
    re: /-----BEGIN (?:RSA |OPENSSH |EC |DSA |ENCRYPTED )?PRIVATE KEY-----/,
  },
  { id: "aws-access-key", re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { id: "github-token", re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { id: "github-fine-grained", re: /\bgithub_pat_[A-Za-z0-9_]{60,}\b/ },
  { id: "slack-token", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: "anthropic-key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { id: "openai-key", re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/ },
  { id: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: "stripe-live-key", re: /\b[sr]k_live_[0-9A-Za-z]{20,}\b/ },
  { id: "jwt", re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  {
    id: "database-url-password",
    re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:/\s@]+:([^@\s/]{4,})@/,
    group: 1,
  },
  {
    // password = "...", "api_key": "...", TOKEN: '...'. Value must look random (see isSecretLike).
    id: "secret-assignment",
    re: /\b[\w.-]*(?:secret|passw(?:or)?d|passwd|api[_-]?key|access[_-]?key|auth[_-]?token|private[_-]?key|token)[\w.-]*["']?\s*[:=]\s*["']([^"'\s]{16,})["']/i,
    group: 1,
    entropy: true,
  },
];

const PLACEHOLDER =
  /example|placeholder|your[_-]|changeme|xxxx|\*{3,}|<[^>]+>|\$\{|process\.env|env\.|getenv|redacted|dummy|sample|fake|test[_-]?(?:key|token|secret)|\.\.\./i;

const DUMMY_PASSWORD = /^(?:pass(?:word)?|pwd|secret|root|admin|postgres|user|test|\*+)$/i;

/** Shannon entropy in bits per character. */
export function entropy(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  let h = 0;
  for (const n of counts.values()) {
    const p = n / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

/** Entropy-lite: 16+ chars, 3.5+ bits per character, mixed classes, not a path, URL or identifier-looking word. */
export function isSecretLike(value) {
  if (PLACEHOLDER.test(value)) return false;
  // kebab/snake identifiers made of short words ("fl2-tactile-token-host") are names, not credentials;
  // a UUID or hex run has digit-heavy segments and still passes through to the entropy test.
  const segments = value.split(/[-_]/);
  if (segments.length >= 3 && segments.every((seg) => /^[A-Za-z]+\d{0,2}$/.test(seg))) return false;
  if (/^(?:[./~]|https?:)/.test(value)) return false;
  if (!(/[a-z]/i.test(value) && /\d/.test(value))) return false;
  return entropy(value) >= 3.5;
}

/** Findings for one text: [{ line, rule, preview }]. */
export function scanText(text) {
  const findings = [];
  text.split("\n").forEach((line, i) => {
    if (line.includes(ALLOW) || PUBLIC_TOKEN_CONTEXT.test(line)) return;
    // Minified bundles (one huge line) are full of word-like tokens: only the exact key shapes apply there.
    const minified = line.length > 4000;
    for (const rule of RULES) {
      if (minified && (rule.entropy || rule.group)) continue;
      const m = rule.re.exec(line);
      if (!m) continue;
      const secret = rule.group ? m[rule.group] : m[0];
      if (rule.group && (PLACEHOLDER.test(secret) || DUMMY_PASSWORD.test(secret))) continue;
      if (rule.id === "database-url-password" && /@(?:localhost|127\.0\.0\.1)\b/.test(line))
        continue;
      if (rule.entropy && !isSecretLike(secret)) continue;
      if (!rule.entropy && /EXAMPLE/.test(secret)) continue; // vendor-documented sample keys
      findings.push({ line: i + 1, rule: rule.id, preview: `${secret.slice(0, 4)}***` });
    }
  });
  return findings;
}

function isText(buffer) {
  return !buffer.subarray(0, 8000).includes(0);
}

export function scanFile(path) {
  if (ALLOWED_FILES.has(relative(ROOT, path))) return [];
  const st = statSync(path);
  if (!st.isFile() || st.size > MAX_BYTES) return [];
  const buffer = readFileSync(path);
  return isText(buffer) ? scanText(buffer.toString("utf8")) : [];
}

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP_PATH.test(`${full}/`)) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
}

export function collectFiles(args) {
  if (args.length === 0) {
    const listed = execFileSync("git", ["ls-files", "-z"], {
      cwd: ROOT,
      maxBuffer: 64 * 1024 * 1024,
    });
    return listed
      .toString("utf8")
      .split("\0")
      .filter(Boolean)
      .map((f) => join(ROOT, f))
      .filter((f) => !SKIP_PATH.test(relative(ROOT, f)));
  }
  const out = [];
  for (const a of args) {
    const st = statSync(a); // throws for a missing path: surfaced as exit 3
    if (st.isDirectory()) walk(a, out);
    else out.push(a);
  }
  return out;
}

export function main(argv, { out = console.log, err = console.error } = {}) {
  let files;
  try {
    files = collectFiles(argv);
  } catch (e) {
    err(`secret-scan could not enumerate files (${e?.code || e?.name || "error"})`);
    return 3;
  }
  let total = 0;
  for (const f of files) {
    let findings;
    try {
      findings = scanFile(f);
    } catch {
      continue; // vanished or unreadable file: not a finding
    }
    for (const x of findings) {
      total++;
      out(`${relative(ROOT, f)}:${x.line}  ${x.rule}  ${x.preview}`);
    }
  }
  if (files.length === 0) {
    err("secret-scan swept zero files; refusing to report clean");
    return 3;
  }
  out(
    total
      ? `\n${total} possible secret(s) in ${files.length} files`
      : `clean: ${files.length} files scanned`,
  );
  return total ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  process.exit(main(process.argv.slice(2)));
}
