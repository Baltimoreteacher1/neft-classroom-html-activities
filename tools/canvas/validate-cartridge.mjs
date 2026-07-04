#!/usr/bin/env node
/**
 * validate-cartridge.mjs — structural validator for the Common Cartridges this
 * repo builds (library, lessons, course). Institutionalizes the checks we'd
 * otherwise run by hand, and is called by build-library-cartridge.mjs to
 * self-validate a package BEFORE it ships (mirroring how build-course.mjs guards
 * answer keys). A passing run means the package is import-clean in structure.
 *
 * It checks a STAGED directory or a built .imscc:
 *   - imsmanifest.xml exists and is well-formed enough (xml decl, escaped &, no
 *     unfilled {{TEMPLATE}} tokens);
 *   - every <file href> / <resource href> in the manifest resolves on disk;
 *   - every module_meta.xml identifierref resolves to a declared resource;
 *   - every content/assignment HTML page carries at least one live link.
 *
 * Programmatic:  import { validateCartridgeDir } from "./validate-cartridge.mjs"
 *                const { ok, errors, stats } = validateCartridgeDir(dir);
 * CLI:           node tools/canvas/validate-cartridge.mjs <package.imscc | dir>
 *                node tools/canvas/validate-cartridge.mjs            # all canvas-packages/*.imscc
 */
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync } from "fs";
import { execSync } from "child_process";
import { tmpdir } from "os";
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

function walk(dir, base = dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, base, out);
    else out.push(p.slice(base.length + 1).replace(/\\/g, "/"));
  }
  return out;
}

/**
 * Validate a staged cartridge directory.
 * @returns {{ ok:boolean, errors:string[], warnings:string[], stats:object }}
 */
export function validateCartridgeDir(dir) {
  const errors = [];
  const warnings = [];
  const stats = {};

  const manifestPath = join(dir, "imsmanifest.xml");
  if (!existsSync(manifestPath)) {
    return { ok: false, errors: ["imsmanifest.xml missing"], warnings, stats };
  }
  const files = walk(dir);
  const fileSet = new Set(files);
  stats.files = files.length;

  // 1. XML well-formedness (lightweight: decl + escaping + no template tokens)
  const xmlFiles = files.filter((f) => f.endsWith(".xml"));
  stats.xmlFiles = xmlFiles.length;
  for (const f of xmlFiles) {
    const txt = readFileSync(join(dir, f), "utf8");
    if (!txt.startsWith("<?xml")) errors.push(`${f}: missing <?xml declaration`);
    const badAmp = txt.match(/&(?!amp;|lt;|gt;|apos;|quot;|#\d+;|#x[0-9a-fA-F]+;)/);
    if (badAmp)
      errors.push(`${f}: unescaped '&' near "${txt.slice(badAmp.index, badAmp.index + 24)}…"`);
    const tok = txt.match(/\{\{[A-Z0-9_]+\}\}/);
    if (tok) errors.push(`${f}: unfilled template token ${tok[0]}`);
  }

  // 2. Every manifest href resolves on disk
  const manifest = readFileSync(manifestPath, "utf8");
  const hrefs = [...manifest.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  stats.manifestHrefs = hrefs.length;
  let missing = 0;
  for (const h of hrefs) {
    if (!fileSet.has(h)) {
      errors.push(`manifest href has no file on disk: ${h}`);
      if (++missing >= 10) {
        errors.push(`… (${hrefs.length - hrefs.indexOf(h) - 1} more hrefs unchecked)`);
        break;
      }
    }
  }

  // 3. module_meta identifierrefs resolve to declared resources
  const resIds = new Set(
    [...manifest.matchAll(/<resource identifier="([^"]+)"/g)].map((m) => m[1]),
  );
  const mmPath = join(dir, "course_settings/module_meta.xml");
  if (existsSync(mmPath)) {
    const mm = readFileSync(mmPath, "utf8");
    const idrefs = [...mm.matchAll(/identifierref="([^"]+)"/g)].map((m) => m[1]);
    stats.moduleItems = idrefs.length;
    const dangling = idrefs.filter((id) => !resIds.has(id));
    for (const d of dangling.slice(0, 10))
      errors.push(`module item references unknown resource: ${d}`);
    if (dangling.length) stats.danglingModuleItems = dangling.length;
  }

  // 4. Every content/assignment HTML page has at least one live link
  const htmlFiles = files.filter((f) => f.endsWith(".html"));
  stats.htmlPages = htmlFiles.length;
  let linkless = 0;
  for (const f of htmlFiles) {
    if (!/https?:\/\//.test(readFileSync(join(dir, f), "utf8"))) {
      linkless++;
      if (linkless <= 5) warnings.push(`html page has no live link: ${f}`);
    }
  }
  if (linkless) errors.push(`${linkless} HTML page(s) have no live link`);

  return { ok: errors.length === 0, errors, warnings, stats };
}

/** Validate a built .imscc/.zip by unzipping to a temp dir first. */
export function validateCartridgeFile(file) {
  const dir = mkdtempSync(join(tmpdir(), "imscc-"));
  execSync(`unzip -q -o ${JSON.stringify(file)} -d ${JSON.stringify(dir)}`);
  return validateCartridgeDir(dir);
}

function report(label, res) {
  const tag = res.ok ? "✓ PASS" : "✗ FAIL";
  console.log(`${tag}  ${label}`);
  const s = res.stats;
  console.log(
    `        files ${s.files ?? "-"} · hrefs ${s.manifestHrefs ?? "-"} · ` +
      `module items ${s.moduleItems ?? "-"} · html ${s.htmlPages ?? "-"}`,
  );
  for (const w of res.warnings) console.log(`        ⚠ ${w}`);
  for (const e of res.errors) console.log(`        ✗ ${e}`);
  return res.ok;
}

// ---- CLI ----
if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2];
  let targets = [];
  if (arg) {
    targets = [resolve(arg)];
  } else {
    const pkgDir = resolve(repoRoot, "canvas-packages");
    targets = existsSync(pkgDir)
      ? readdirSync(pkgDir)
          .filter((f) => f.endsWith(".imscc") || f.endsWith(".zip"))
          .map((f) => join(pkgDir, f))
      : [];
    if (!targets.length) {
      console.log(
        "No packages in canvas-packages/. Build one first, e.g. npm run library-cartridge.",
      );
      process.exit(0);
    }
  }

  let allOk = true;
  for (const t of targets) {
    if (!existsSync(t)) {
      console.log(`✗ FAIL  ${t} (not found)`);
      allOk = false;
      continue;
    }
    const res = statSync(t).isDirectory() ? validateCartridgeDir(t) : validateCartridgeFile(t);
    allOk = report(t.replace(repoRoot + "/", ""), res) && allOk;
  }
  console.log(allOk ? "\n✅ cartridge validation passed" : "\n❌ cartridge validation failed");
  process.exit(allOk ? 0 : 1);
}
