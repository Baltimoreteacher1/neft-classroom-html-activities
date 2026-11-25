#!/usr/bin/env node
/**
 * secret-scan negative controls. Fixtures are assembled at runtime so this file contains no
 * key-shaped literal (the repo-wide scan must stay clean, including this file).
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { entropy, isSecretLike, main, RULES, scanText } from "./secret-scan.mjs";

const rep = (c, n) => c.repeat(n);
const RANDOM = "q8Zr3KfV9xLm2PwYt6Nb4HcJd1Sa7Ue"; // 31 mixed chars, high entropy
const BAD = {
  "pem-private-key": `-----BEGIN ${"RSA"} PRIVATE KEY-----`,
  "aws-access-key": `${"AKIA"}${rep("Q7", 8)}`,
  "github-token": `${"ghp"}_${RANDOM}abcde`,
  "github-fine-grained": `${"github_pat"}_${rep("aB3", 25)}`,
  "slack-token": `${"xoxb"}-123456789012-${rep("a", 12)}`,
  "anthropic-key": `${"sk-ant"}-${RANDOM}`,
  "openai-key": `${"sk"}-${RANDOM}${RANDOM}`,
  "google-api-key": `${"AIza"}${RANDOM}abcd`,
  "stripe-live-key": `${"sk_live"}_${RANDOM}`,
  jwt: `${"eyJ"}${rep("a", 12)}.${"eyJ"}${rep("b", 12)}.${rep("c", 14)}`,
  "database-url-password": `${"postgres"}://app:${"s3cretPw9"}@db.internal/prod`,
  "secret-assignment": `const apiKey = "${RANDOM}";`,
};

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`   ✓ ${name}`);
};
console.log("tools/secret-scan.mjs");

check("every rule fires on its known-bad fixture (and every rule has one)", () => {
  for (const rule of RULES) assert.ok(BAD[rule.id], `no fixture for ${rule.id}`);
  for (const [id, text] of Object.entries(BAD)) {
    const rules = scanText(text).map((f) => f.rule);
    assert.ok(rules.includes(id), `${id} not detected in fixture (got ${rules})`);
  }
});

check("findings never carry the secret itself", () => {
  for (const text of Object.values(BAD)) {
    for (const f of scanText(text)) {
      assert.ok(f.preview.length === 7 && f.preview.endsWith("***"), f.preview);
    }
  }
});

check("known-good text is clean: placeholders, env reads, identifiers, plain prose", () => {
  const good = [
    "const apiKey = process.env.OPENAI_API_KEY;",
    'password = "your-password-here-please"',
    'token: "<paste-token-here-now>"',
    "DATABASE_URL=postgres://user:password@localhost:5432/db",
    "postgres://${USER}:${PASS}@host/db",
    'tokenHost.id = "fl2-tactile-token-host";',
    'const secretName = "student-progress-secret-name";',
    'const api_key = "https://api.example.test/v1/endpoint/long";',
    "See sk-learn for the lesson about skills.",
    "The AKIA prefix is explained in the docs.",
    `${"AKIA"}IOSFODNN7EXAMPLE`,
    '<script data-cf-beacon=\'{"token":"70d0f16e89e149969ae26b879257bf36"}\'></script>',
    'secret = "aaaaaaaaaaaaaaaaaaaaaaaa"',
    'const token = "1234567890123456"',
  ];
  for (const line of good) assert.deepEqual(scanText(line), [], `false positive: ${line}`);
  assert.deepEqual(
    scanText(`const apiKey = "${RANDOM}"; // secret-scan:allow documented test credential`),
    [],
  );
});

check("entropy helpers: random-looking passes the bar, repetitive and words do not", () => {
  assert.ok(entropy(RANDOM) > 4);
  assert.equal(isSecretLike(RANDOM), true);
  assert.equal(isSecretLike("aaaaaaaaaaaaaaaaaaaa1"), false);
  assert.equal(isSecretLike("students-read-every-day-1"), false);
});

check("minified lines: only exact key shapes apply (no entropy false positives)", () => {
  const minified = `${rep('x={n:"PASSWORD"},', 400)}var a="Zq8Rk3Vf9Xl2Pw";`;
  assert.deepEqual(scanText(minified), []);
  assert.ok(scanText(`${rep("y", 5000)} ${BAD["aws-access-key"]}`).length > 0);
});

check("CLI exit codes: 0 clean, 1 finding, 3 cannot run", () => {
  const dir = mkdtempSync(join(tmpdir(), "secret-scan-"));
  const quiet = { out: () => {}, err: () => {} };
  try {
    mkdirSync(join(dir, "ok"));
    writeFileSync(join(dir, "ok", "a.txt"), "plain text\nconst x = 1;\n");
    assert.equal(main([join(dir, "ok")], quiet), 0);
    mkdirSync(join(dir, "bad"));
    writeFileSync(join(dir, "bad", "b.env"), `KEY=1\napi_key = "${RANDOM}"\n`);
    const lines = [];
    assert.equal(main([join(dir, "bad")], { out: (l) => lines.push(l), err: () => {} }), 1);
    assert.ok(lines.join("\n").includes("secret-assignment") && !lines.join("\n").includes(RANDOM));
    mkdirSync(join(dir, "empty"));
    assert.equal(
      main([join(dir, "empty")], quiet),
      3,
      "a sweep of zero files must not report clean",
    );
    assert.equal(main([join(dir, "missing")], quiet), 3);
    writeFileSync(
      join(dir, "ok", "bin.dat"),
      Buffer.from([0, 1, 2, ...Buffer.from(BAD["aws-access-key"])]),
    );
    assert.equal(main([join(dir, "ok")], quiet), 0, "binary files are skipped");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

console.log(`\n✓ secret-scan: ${passed} checks`);
