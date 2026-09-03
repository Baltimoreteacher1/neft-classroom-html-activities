// ── Tagged / accessible PDF validator ────────────────────────────────────────
// Asserts that the notes PDFs emitted by generate-pdf.mjs are tagged (PDF/UA
// foundations): each PDF must carry a structure tree (/StructTreeRoot), be
// marked as tagged (/MarkInfo<</Marked true>>), and declare a language (/Lang).
// Untagged regressions fail loudly (non-zero exit) so screen-reader support
// never silently disappears from a future Chrome / flag change.
//
// Usage:
//   node scripts/validate-pdf-tagged.mjs            # all notes PDFs on disk
//   node scripts/validate-pdf-tagged.mjs 1-1 5-1    # only these lessons
//
// If no notes PDFs exist yet (e.g. PDF rendering was skipped because no Chrome
// binary was available), the validator reports that and exits 0 — there is
// nothing to regress against.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

const checks = [
  { name: "structure tree", re: /\/StructTreeRoot/ },
  { name: "marked tagged", re: /\/Marked\s+true/ },
  { name: "language", re: /\/Lang\s*\(/ },
];

function notesPdfsFor(id) {
  const dir = join(lessonsDir, id, "downloads");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /(-notes(-teacher)?(-l[123])?|-mstar-worksheet(-answer-key)?)\.pdf$/.test(f))
    .map((f) => join(dir, f));
}

function lessonIds(filter) {
  const all = readdirSync(lessonsDir).filter((d) => LESSON_DIR_RE.test(d));
  if (filter.length) return all.filter((id) => filter.includes(id));
  return all;
}

function main() {
  const filter = process.argv.slice(2);
  const ids = lessonIds(filter);

  let total = 0;
  const failures = [];

  for (const id of ids) {
    for (const pdf of notesPdfsFor(id)) {
      total++;
      let text;
      try {
        // latin1 keeps byte boundaries intact for the catalog/markinfo tokens.
        text = readFileSync(pdf).toString("latin1");
      } catch (e) {
        failures.push(`${pdf}: unreadable (${e.message})`);
        continue;
      }
      for (const c of checks) {
        if (!c.re.test(text)) {
          failures.push(`${pdf}: missing ${c.name}`);
        }
      }
    }
  }

  if (total === 0) {
    console.log(
      "validate-pdf-tagged: no notes PDFs found (rendering may have been skipped — no Chrome binary). Nothing to validate.",
    );
    return;
  }

  if (failures.length) {
    console.error(
      `validate-pdf-tagged: FAIL — ${failures.length} issue(s) across ${total} PDF(s):`,
    );
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log(
    `validate-pdf-tagged: PASS — ${total} notes PDF(s) are tagged, marked, and language-stamped.`,
  );
}

main();
