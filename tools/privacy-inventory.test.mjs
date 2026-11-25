// Negative controls for the privacy inventory drift gate and the forbidden-data scan: each known-bad
// fixture below MUST make the real CLI exit 1, a clean fixture MUST exit 0, and a usage error MUST exit
// 3. The last two tests run both gates on the real repository.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INVENTORY = join(ROOT, "tools/privacy-inventory.mjs");
const FORBIDDEN = join(ROOT, "tools/privacy-forbidden-scan.mjs");

const SQL = `CREATE TABLE class_thing (
  code TEXT PRIMARY KEY, -- join code
  alias TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE other_thing (id TEXT, n INTEGER);
CREATE TABLE third_thing (id TEXT);
`;
const AT = "//" + " @data"; // built apart so this file is not itself read as an annotation
const ANNOTATIONS = `${AT} field=class_thing.{code,alias,created_at} store=d1 purpose="p" retention="r" delete="d"
${AT} field=other_thing.{id,n} store=d1 purpose="p" retention="r" delete="d"
${AT} field=third_thing.id store=d1 purpose="p" retention="r" delete="d"
${AT} field=ewl_demo_v1 store=device purpose="p" retention="r" delete="d" source=assets/demo.js
export {};
`;
const DEMO = `const KEY = "ewl_demo_v1";\nlocalStorage.setItem(KEY, "1");\n`;

function fixture(edit = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), "privacy-fixture-"));
  const put = (rel, text) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  put("migrations/0001_x.sql", SQL);
  put("shared/privacy/inventory-annotations/a.js", ANNOTATIONS);
  put("assets/demo.js", DEMO);
  put("docs/privacy/.keep", "");
  const files = { put, dir };
  edit(files);
  return files;
}

const run = (script, args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

function withFixture(edit, fn) {
  const f = fixture(edit);
  try {
    const written = run(INVENTORY, ["--write", "--root", f.dir]);
    return fn(f, written);
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
}

test("inventory: a complete fixture writes, then checks clean", () => {
  withFixture(
    () => {},
    (f, written) => {
      assert.equal(written.status, 0, written.stderr);
      const check = run(INVENTORY, ["--check", "--root", f.dir]);
      assert.equal(check.status, 0, check.stderr);
    },
  );
});

test("inventory: a D1 column with no annotation fails the check", () => {
  withFixture(
    () => {},
    (f) => {
      f.put("migrations/0002_x.sql", "ALTER TABLE class_thing ADD COLUMN birthday TEXT;");
      const check = run(INVENTORY, ["--check", "--root", f.dir]);
      assert.equal(check.status, 1);
      assert.match(check.stderr, /unannotated D1 column: class_thing\.birthday/);
    },
  );
});

test("inventory: an annotation naming a column that does not exist fails", () => {
  withFixture(
    () => {},
    (f) => {
      f.put(
        "shared/privacy/inventory-annotations/b.js",
        `${AT} field=class_thing.ghost store=d1 purpose="p" retention="r" delete="d"\n`,
      );
      const check = run(INVENTORY, ["--check", "--root", f.dir]);
      assert.equal(check.status, 1);
      assert.match(check.stderr, /does not exist: class_thing\.ghost/);
    },
  );
});

test("inventory: a localStorage key found in source with no annotation fails", () => {
  withFixture(
    () => {},
    (f) => {
      f.put(
        "assets/other.js",
        'const SECRET_KEY = "ewl_new_thing_v1";\nlocalStorage.setItem(SECRET_KEY, "x");\n',
      );
      const check = run(INVENTORY, ["--check", "--root", f.dir]);
      assert.equal(check.status, 1);
      assert.match(check.stderr, /unannotated localStorage key: ewl_new_thing_v1/);
    },
  );
});

test("inventory: an annotation whose source file lost the key fails", () => {
  withFixture(
    () => {},
    (f) => {
      f.put("assets/demo.js", "// the key was removed\n");
      const check = run(INVENTORY, ["--check", "--root", f.dir]);
      assert.equal(check.status, 1);
      assert.match(check.stderr, /no longer contains ewl_demo_v1/);
    },
  );
});

test("inventory: a stale generated doc fails the check", () => {
  withFixture(
    () => {},
    (f) => {
      const doc = join(f.dir, "docs/privacy/data-inventory.md");
      writeFileSync(doc, `${readFileSync(doc, "utf8")}\nhand edit\n`);
      const check = run(INVENTORY, ["--check", "--root", f.dir]);
      assert.equal(check.status, 1);
      assert.match(check.stderr, /stale or missing/);
    },
  );
});

test("inventory: an annotation missing a required field fails", () => {
  withFixture(
    () => {},
    (f) => {
      f.put(
        "shared/privacy/inventory-annotations/c.js",
        `${AT} field=ewl_x store=device purpose="p"\n`,
      );
      const check = run(INVENTORY, ["--check", "--root", f.dir]);
      assert.equal(check.status, 1);
      assert.match(check.stderr, /missing retention=/);
    },
  );
});

test("inventory: a usage error exits 3, not 0 or 1", () => {
  assert.equal(run(INVENTORY, []).status, 3);
});

test("inventory: the real repository has no drift", () => {
  const check = run(INVENTORY, ["--check"]);
  assert.equal(check.status, 0, check.stderr);
});

// ---- forbidden-data scan (G-44) -------------------------------------------------------------

function scanFixture(edit) {
  const f = fixture(edit);
  // The scan refuses a sweep of fewer than 5 files; pad with harmless API files.
  for (let i = 0; i < 4; i++)
    f.put(`functions/api/pad${i}.js`, "export const ok = { alias: 1 };\n");
  return f;
}

function scan(edit) {
  const f = scanFixture(edit);
  try {
    return run(FORBIDDEN, ["--root", f.dir]);
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
}

test("forbidden: a clean fixture passes", () => {
  const r = scan(() => {});
  assert.equal(r.status, 0, r.stderr);
});

test("forbidden: a never-collect SQL column fails", () => {
  const r = scan((f) =>
    f.put("migrations/0002_x.sql", "ALTER TABLE class_thing ADD COLUMN country_of_birth TEXT;"),
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /country_of_birth/);
});

test("forbidden: a never-collect field in API code fails", () => {
  const r = scan((f) =>
    f.put("functions/api/leak.js", "export const row = { immigrationStatus: body.status };\n"),
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /immigrationStatus/);
});

test("forbidden: a never-collect schema property fails", () => {
  const r = scan((f) =>
    f.put("schemas/x.schema.json", '{"properties":{"familyIncome":{"type":"number"}}}'),
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /familyIncome/);
});

test("forbidden: a table created lazily in API code is scanned", () => {
  const r = scan((f) =>
    f.put(
      "functions/api/lazy.js",
      "db.exec(`CREATE TABLE IF NOT EXISTS roster (id TEXT, iep_items TEXT)`);\n",
    ),
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /roster\.iep_items/);
});

test("forbidden: a baseline entry that no longer fires fails (no stale absolutions)", () => {
  const r = scan((f) =>
    f.put(
      "shared/privacy/inventory-forbidden-baseline.json",
      JSON.stringify([{ key: "api-field|gone.js|iep", reason: "x".repeat(60) }]),
    ),
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /STALE/);
});

test("forbidden: a reviewed baseline hit passes, but only with a real reason", () => {
  const edit = (reason) => (f) => {
    f.put("functions/api/leak.js", "export const row = { passportId: 1 };\n");
    f.put(
      "shared/privacy/inventory-forbidden-baseline.json",
      JSON.stringify([{ key: "api-field|functions/api/leak.js|passportId", reason }]),
    );
  };
  assert.equal(
    scan(edit("Reviewed by the owner: this is a lesson prop, not an identity document.")).status,
    0,
  );
  const weak = scan(edit("ok"));
  assert.equal(weak.status, 1);
  assert.match(weak.stderr, /WEAK/);
});

test("forbidden: whole words only (incomplete is not income)", () => {
  const r = scan((f) =>
    f.put("functions/api/words.js", "export const x = { incomplete: 1, tripod: 2 };\n"),
  );
  assert.equal(r.status, 0, r.stderr);
});

test("forbidden: the real repository has no unreviewed hit", () => {
  const r = run(FORBIDDEN, []);
  assert.equal(r.status, 0, r.stderr);
});
