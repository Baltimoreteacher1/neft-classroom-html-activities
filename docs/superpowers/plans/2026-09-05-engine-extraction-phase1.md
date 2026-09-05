# Engine Extraction Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Declare `engine/` as the in-place npm workspace package `@eduwonderlab/engine`, guarded by a byte-identical dist parity harness, with zero visible change to the live site.

**Architecture:** No files move. A parity harness (snapshot/compare of normalized `dist/` sha256 manifests) is built first and pinned to a baseline taken at the branch point. Then the workspace is declared (root `workspaces` field + `engine/package.json`), verified byte-identical, and documented.

**Tech Stack:** Node 26 ESM (`.mjs`), npm workspaces, `node:crypto`/`node:fs` only (no new deps), existing repo gates (`npm test`, `npm run lint`, `npm run typecheck`).

**Spec:** `docs/superpowers/specs/2026-09-05-engine-extraction-design.md`

## Global Constraints

- Byte-identical `dist/` (after documented normalizations) at every milestone — any diff is a stop-the-line failure.
- No new npm dependencies. Lockfile changes only from the intentional workspace declaration.
- No edits to: `lessons/**`, `shared/**`, `assets/**`, `functions/**`, `workers/**`, any committed HTML, `vite.config.js`, `data/**`.
- All commits on `feat/engine-extraction` in `/Users/joelneft/wt-engine-extract`. Never push, never deploy.
- The build mutates the working tree (inject-* steps rewrite committed HTML). After each build, `git status` churn in `lessons/**`/`curriculum/**` is expected; never commit that churn as part of this plan's commits — stage only this plan's files by explicit path.
- The pre-commit hook runs change-scoped QA; let it run.

---

### Task 1: Parity harness

**Files:**

- Create: `tools/parity/parity-check.mjs`
- Create: `tools/parity/parity-check.test.mjs`

**Interfaces:**

- Produces CLI: `node tools/parity/parity-check.mjs --snapshot <out.json>` and `--compare <baseline.json>`, both against `dist/`; exports `buildManifest(rootDir)` and `diffManifests(a, b)` for tests.
- Env var `PARITY_DIST` overrides the dist dir (tests use fixture dirs).

- [ ] **Step 1: Write the failing test**

```js
// tools/parity/parity-check.test.mjs — plain node script per repo test convention
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { buildManifest, diffManifests, normalizeContent } from "./parity-check.mjs";

const a = mkdtempSync(join(tmpdir(), "parity-a-"));
mkdirSync(join(a, "sub"));
writeFileSync(join(a, "x.html"), "<html>same</html>");
writeFileSync(join(a, "sub", "y.js"), "const n = 1;\n");

const b = mkdtempSync(join(tmpdir(), "parity-b-"));
mkdirSync(join(b, "sub"));
writeFileSync(join(b, "x.html"), "<html>same</html>");
writeFileSync(join(b, "sub", "y.js"), "const n = 2;\n");

const ma = buildManifest(a);
const mb = buildManifest(b);
assert.equal(Object.keys(ma).length, 2, "manifest lists every file");
assert.deepEqual(diffManifests(ma, ma), [], "identical trees diff empty");
const diff = diffManifests(ma, mb);
assert.equal(diff.length, 1, "one changed file detected");
assert.equal(diff[0].path, "sub/y.js");

// Normalization: the access-lab build stamp must not count as a diff.
const stampA = JSON.stringify({ builtAt: "2026-09-05T01:00:00Z", commit: "abc", files: 3 });
const stampB = JSON.stringify({ builtAt: "2026-09-06T02:00:00Z", commit: "def", files: 3 });
assert.equal(
  normalizeContent("access-practice-lab/config.json", stampA),
  normalizeContent("access-practice-lab/config.json", stampB),
  "build stamp fields are normalized away",
);

// Missing/extra files are reported, not ignored.
writeFileSync(join(b, "extra.txt"), "hi");
const diff2 = diffManifests(ma, buildManifest(b));
assert.ok(diff2.some((d) => d.path === "extra.txt" && d.kind === "added"));
console.log("parity-check tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/parity/parity-check.test.mjs`
Expected: FAIL — `Cannot find module './parity-check.mjs'`

- [ ] **Step 3: Write the implementation**

```js
// tools/parity/parity-check.mjs
// Byte-parity gate for the engine extraction (spec: docs/superpowers/specs/
// 2026-09-05-engine-extraction-design.md). Snapshot dist/ as {path: sha256}
// after normalizing bytes that legitimately differ between builds of the same
// source. Every normalization rule carries a reason; add rules only from a
// double-build probe, never to make a failing compare pass.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";

// rule list: [pathMatcher, transform, reason]
const NORMALIZATIONS = [
  [
    (p) => p === "access-practice-lab/config.json",
    (text) => {
      // tools/stamp-build.mjs writes builtAt/commit here every build.
      try {
        const o = JSON.parse(text);
        delete o.builtAt;
        delete o.commit;
        delete o.buildStamp;
        return JSON.stringify(o);
      } catch {
        return text;
      }
    },
    "stamp-build.mjs build stamp (varies per build by design)",
  ],
  [
    (p) => p.endsWith(".html") || p === "sw.js",
    (text) =>
      text
        .replace(/data-build-stamp="[^"]*"/g, 'data-build-stamp=""')
        .replace(/BUILD_STAMP\s*=\s*["'][^"']*["']/g, 'BUILD_STAMP=""'),
    "HTML/service-worker build stamps re-stamped each build",
  ],
  // M0 double-build probe appends further rules here, each with its reason.
];

export function normalizeContent(relPath, text) {
  let out = text;
  for (const [match, transform] of NORMALIZATIONS) {
    if (match(relPath)) out = transform(out);
  }
  return out;
}

function walk(dir, root, acc) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, root, acc);
    else acc.push(relative(root, full));
  }
  return acc;
}

const TEXT_RE = /\.(html|js|mjs|css|json|svg|txt|xml|webmanifest|map)$/;

export function buildManifest(rootDir) {
  const manifest = {};
  for (const rel of walk(rootDir, rootDir, []).sort()) {
    const raw = readFileSync(join(rootDir, rel));
    const data = TEXT_RE.test(rel) ? Buffer.from(normalizeContent(rel, raw.toString("utf8"))) : raw;
    manifest[rel] = createHash("sha256").update(data).digest("hex");
  }
  return manifest;
}

export function diffManifests(baseline, candidate) {
  const diffs = [];
  for (const p of Object.keys(baseline)) {
    if (!(p in candidate)) diffs.push({ path: p, kind: "removed" });
    else if (candidate[p] !== baseline[p]) diffs.push({ path: p, kind: "changed" });
  }
  for (const p of Object.keys(candidate)) {
    if (!(p in baseline)) diffs.push({ path: p, kind: "added" });
  }
  return diffs.sort((a, b) => a.path.localeCompare(b.path));
}

const [, , mode, file] = process.argv;
if (mode === "--snapshot" || mode === "--compare") {
  const dist = process.env.PARITY_DIST ?? join(process.cwd(), "dist");
  const manifest = buildManifest(dist);
  if (mode === "--snapshot") {
    writeFileSync(file, JSON.stringify(manifest, null, 1));
    console.log(`snapshot: ${Object.keys(manifest).length} files -> ${file}`);
  } else {
    const baseline = JSON.parse(readFileSync(file, "utf8"));
    const diffs = diffManifests(baseline, manifest);
    if (diffs.length === 0) {
      console.log(`PARITY PASS — ${Object.keys(manifest).length} files identical to ${file}`);
    } else {
      console.error(`PARITY FAIL — ${diffs.length} difference(s) vs ${file}:`);
      for (const d of diffs) console.error(`  ${d.kind.padEnd(7)} ${d.path}`);
      process.exit(1);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tools/parity/parity-check.test.mjs`
Expected: `parity-check tests passed`

- [ ] **Step 5: Commit**

```bash
git add tools/parity/parity-check.mjs tools/parity/parity-check.test.mjs
git commit -m "feat(parity): byte-parity harness for the engine extraction"
```

---

### Task 2: M0 baseline + determinism probe

**Files:**

- Modify: `tools/parity/parity-check.mjs` (append probe-discovered normalization rules only)
- Create (untracked): `.qa-logs/parity-baseline.json` — `.qa-logs/` is already gitignored; also copy to the session scratchpad.

**Interfaces:**

- Consumes: Task 1 CLI.
- Produces: `.qa-logs/parity-baseline.json`, the baseline every later `--compare` uses.

- [ ] **Step 1: First full build and snapshot**

```bash
npm run build 2>&1 | tail -5
node tools/parity/parity-check.mjs --snapshot .qa-logs/parity-a.json
```

- [ ] **Step 2: Second build and compare (the probe)**

```bash
npm run build 2>&1 | tail -5
node tools/parity/parity-check.mjs --compare .qa-logs/parity-a.json
```

Expected: either PARITY PASS (build is deterministic — done) or a finite FAIL list = the nondeterminism inventory.

- [ ] **Step 3: For each probe diff, inspect and encode a rule**

For every path in the FAIL list: `diff` the actual bytes between the two builds, identify the varying token (timestamp, hash, random id), append a `NORMALIZATIONS` entry with a reason. A diff that is NOT explainable as build nondeterminism (e.g. an injector that isn't idempotent) is a finding to report, not normalize.

- [ ] **Step 4: Re-verify determinism, then pin the baseline**

```bash
node tools/parity/parity-check.mjs --snapshot .qa-logs/parity-baseline.json
node tools/parity/parity-check.mjs --compare .qa-logs/parity-baseline.json   # trivially PASS
cp .qa-logs/parity-baseline.json "$CLAUDE_SCRATCHPAD_OR_TMP"/parity-baseline.json
node tools/parity/parity-check.test.mjs   # unit tests still pass with new rules
```

- [ ] **Step 5: Commit (only if rules were added)**

```bash
git add tools/parity/parity-check.mjs
git commit -m "feat(parity): normalization rules from the M0 double-build probe"
```

Note: the build mutates tracked files (inject-* churn in `lessons/**`, `curriculum/**`). Do NOT reset or commit that churn — leave it in the tree and stage this plan's files by explicit path only.

---

### Task 3: Declare the workspace package

**Files:**

- Modify: `package.json` (root — add `workspaces`)
- Modify: `package-lock.json` (via `npm install`, intentional)
- Create: `engine/package.json`

**Interfaces:**

- Produces: package name `@eduwonderlab/engine`, importable specifier for Phase 2; `npm test -w @eduwonderlab/engine` runs the engine's colocated tests.

- [ ] **Step 1: Root package.json — add after `"private": true` (or top-level if absent):**

```json
"workspaces": ["engine"]
```

- [ ] **Step 2: Create engine/package.json**

```json
{
  "name": "@eduwonderlab/engine",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Curriculum-agnostic lesson runtime: renderer, modes, manipulatives, notebook, misconceptions, i18n.",
  "exports": {
    ".": "./templates/flagship/flagship.js",
    "./core/*": "./core/*",
    "./components/*": "./components/*",
    "./styles/*": "./styles/*",
    "./templates/*": "./templates/*"
  },
  "scripts": {
    "test": "node ../tools/run-tests.mjs engine"
  }
}
```

If `tools/run-tests.mjs` does not accept a directory argument, check its argv handling first; if unsupported, set the script to `node --test --test-reporter=dot ./core ./components ./templates` and verify the colocated tests pass under `node --test` (they are plain assertion scripts, so plain `node --test` treats each as a test file). Whichever variant is used must exit non-zero on failure — prove it by temporarily breaking one assertion locally (do not commit the break).

- [ ] **Step 3: Install to register the workspace (updates lockfile — intentional)**

```bash
npm install 2>&1 | tail -3
git diff --stat package-lock.json
ls -la node_modules/@eduwonderlab
```

Expected: lockfile gains the `engine` workspace entry; `node_modules/@eduwonderlab/engine` is a symlink to `engine/`.

- [ ] **Step 4: Standalone engine test run**

Run: `npm test -w @eduwonderlab/engine`
Expected: engine's 36 colocated tests pass.

- [ ] **Step 5: Root gates unaffected**

```bash
npm test 2>&1 | tail -3
npm run lint 2>&1 | tail -3
npm run typecheck 2>&1 | tail -3
```

Expected: all pass exactly as at baseline.

- [ ] **Step 6: Build + parity (the milestone gate)**

```bash
npm run build 2>&1 | tail -5
node tools/parity/parity-check.mjs --compare .qa-logs/parity-baseline.json
```

Expected: PARITY PASS. Any diff = stop, root-cause, fix before proceeding. (Watch for: vite resolving `@engine` through the new `node_modules` symlink instead of the alias — if module ids change, chunk hashes change; the fix is ensuring the alias still wins, not normalizing.)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json engine/package.json
git commit -m "feat(engine): declare engine/ as the @eduwonderlab/engine workspace package"
```

---

### Task 4: Boundary docs + reference inventory

**Files:**

- Create: `engine/README.md`
- Create: `docs/superpowers/specs/2026-09-05-engine-reference-inventory.md`

**Interfaces:**

- Consumes: the Task 3 package; the 132-file grep inventory.
- Produces: the Phase 2 worklist and the boundary contract future contributors read.

- [ ] **Step 1: Write engine/README.md**

```markdown
# @eduwonderlab/engine

The browser-side lesson runtime: renderer (`core/lesson-renderer.js`), boot shell
(`core/app.js`, `templates/flagship/flagship.js` → `bootFlagship(config)`), present
mode, notebook checkpoints, teacher/tools/levels modes, misconceptions + hint ladder,
i18n/voice, score reporting, the small-group sub-engine, 77 manipulatives
(`components/`), and the design system styles (`styles/`).

## How lessons use it

Each lesson ships a 3-line `lesson.js`:
`import { bootFlagship } from "@engine/templates/flagship/flagship.js"` + its
`config.json`. The `@engine` Vite alias points here; Vite bundles from source. There
is no separate package build.

## Boundary contract (Phase 1 of the extraction — see

docs/superpowers/specs/2026-09-05-engine-extraction-design.md)

- This package must stay curriculum-agnostic: no imports from `lessons/`, `data/`,
  `curriculum/`, or anything Reveal-aligned. Curriculum flows in through
  `bootFlagship(config)` only.
- Known Phase 1 leaks (do not add more): 132 files in `tools/` and `scripts/` import
  engine internals by path (inventory:
  docs/superpowers/specs/2026-09-05-engine-reference-inventory.md). Phase 2 reroutes
  them through this package's exports map.
- Runtime siblings that are NOT part of this package (loaded by absolute URL from
  committed HTML): `shared/save-resume/`, `assets/learning-supports/`,
  `assets/lesson-shell-guard.js`, `assets/edupulse-bridge.js`.

## Tests

`npm test -w @eduwonderlab/engine` — colocated `*.test.mjs`, also picked up by the
root `npm test` tree walk.
```

- [ ] **Step 2: Generate the inventory appendix**

````bash
{
  echo "# Engine reference inventory — Phase 2 worklist (generated 2026-09-05)"
  echo
  echo "Files outside engine/ that reference engine internals by path."
  echo
  echo '```'
  rg -l '\bengine/' tools scripts --glob '*.mjs' --glob '*.js' | sort
  echo '```'
} > docs/superpowers/specs/2026-09-05-engine-reference-inventory.md
````

Then open it and drop any false positives (files whose only match is e.g. `games/engine3d` or `graphic-novels/_engine` — different engines; verify each with `rg -n '\bengine/' <file> | head -3`).

- [ ] **Step 3: Commit**

```bash
git add engine/README.md docs/superpowers/specs/2026-09-05-engine-reference-inventory.md
git commit -m "docs(engine): boundary contract and phase-2 reference inventory"
```

---

### Task 5: Final verification + handoff

**Files:**

- Modify: `docs/superpowers/specs/2026-09-05-engine-extraction-design.md` (status line only)

- [ ] **Step 1: Full gates**

```bash
npm test 2>&1 | tail -3
npm run lint 2>&1 | tail -3
npm run typecheck 2>&1 | tail -3
npm run validate:route-contract 2>&1 | tail -2
npm run validate:css-integrity 2>&1 | tail -2
```

Expected: all PASS.

- [ ] **Step 2: Final build + parity**

```bash
npm run build 2>&1 | tail -5
node tools/parity/parity-check.mjs --compare .qa-logs/parity-baseline.json
```

Expected: PARITY PASS.

- [ ] **Step 3: Diff review**

```bash
git log --oneline main..HEAD
git diff main..HEAD --stat
```

Confirm: only the plan's files changed; no `lessons/**`, `shared/**`, `assets/**`, `vite.config.js`, committed HTML.

- [ ] **Step 4: Mark spec status, commit, report**

Change spec `**Status:**` line to `Phase 1 implemented on feat/engine-extraction; awaiting Joel's review + ship`. Commit:

```bash
git add docs/superpowers/specs/2026-09-05-engine-extraction-design.md
git commit -m "docs: mark phase 1 engine extraction implemented"
```

Report to Joel: branch name, commit list, parity result, gates run, and that shipping stays manual via `ALLOW_DEPLOY=1 npm run ship`.
