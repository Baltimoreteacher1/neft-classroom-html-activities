#!/usr/bin/env node
/* =============================================================================
 * validate-vocab-attributes.mjs — a glossary link must never eat an attribute.
 *
 * WHAT WENT WRONG. The glossary decoration on these pages was originally
 * applied by a one-shot regex pass (`scripts/decorate_objectives_vocab.py`)
 * that matched vocabulary terms anywhere in the file, INCLUDING inside an HTML
 * open tag. Two of the glossary terms — `width` and `height` — are also the
 * two commonest SVG attribute names, so the pass rewrote the ATTRIBUTE:
 *
 *     <svg width="28" height="28" viewBox="0 0 24 24">
 *
 * became
 *
 *     <svg <span class="vocab-word" data-vocab="width" ...>width</span>="28" ...>
 *
 * A browser does not reject that. It recovers: `class`, `style` and `onclick`
 * from the span are absorbed as attributes of the `<svg>` itself, the element
 * loses the size it declared, and the leftover `>width</span>="28"` becomes
 * TEXT — so a student sees the literal characters `width="28"` sitting next to
 * a collapsed icon. Nothing throws, nothing logs, and 1,808 of these shipped
 * across 85 live pages before anyone looked.
 *
 * WHY A GATE AND NOT JUST A FIX. The generator in use today
 * (`scripts/lib/vocab-linkify.mjs`) is a real tokenizer and cannot produce
 * this — but the two legacy Python passes are still in `scripts/`, and the one
 * named `fix_vocab_attributes.py` only cleans spans that landed INSIDE an
 * attribute VALUE (`alt="<span…>"`). It is blind to the shape that actually
 * shipped, where the span replaced the attribute NAME. Re-running it would
 * reintroduce the defect and report success.
 *
 * THE RULE. A `.vocab-word` span is a glossary link around a word in prose. It
 * is therefore never immediately followed by `=`. That single condition
 * separates the 1,808 corrupted attributes from the one legitimate use in the
 * repo — Spanish prose reading `un triángulo de base=3, altura=5`, where the
 * `=` belongs to the sentence and a quote does not follow it. Requiring the
 * quote keeps that line untouched.
 *
 * A SECOND, LOSSY SHAPE. 50 spans in 20 files are damaged differently: their
 * own opening tag is broken, e.g.
 *
 *     aria-label="base"vocab-word" data-vocab="height" ...>height</span> of 6 feet."
 *
 * Here a cleanup pass has already eaten `<span class="` AND the connector text
 * that ran between `base` and `height`. The surviving characters do not
 * determine the original sentence — reconstructing it means inventing words,
 * and for a `style` attribute (`style="width"vocab-word" ...>height</span>:auto"`)
 * any mechanical join produces invalid CSS. These are therefore NOT repaired
 * here. They are counted against a pinned ceiling in data/vocab-attribute-debt.json
 * so the number can only ever go down: the gate stays honest about known damage
 * instead of being blind to it, and a new one fails the build immediately.
 *
 *   node tools/validate-vocab-attributes.mjs         # gate: report and fail
 *   node tools/validate-vocab-attributes.mjs --fix   # repair the repairable shape
 *
 * The repair is the inverse of the damage: the span collapses back to the bare
 * word it wrapped, which is the attribute name that was there to begin with.
 * ========================================================================== */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertNonEmpty } from "./lib/non-empty.mjs";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIX = process.argv.includes("--fix");

/* A vocab span in ATTRIBUTE POSITION: immediately followed by `="` or `='`.
 * The quote is what makes this unambiguous — see THE RULE above. */
const CORRUPT = /<span class="vocab-word"[^<>]*>([^<]*)<\/span>(?=="|=')/g;

/* The lossy shape: a `vocab-word"` marker whose `<span class="` opener was
 * destroyed. Well-formed spans are excluded by the lookbehind. */
const MALFORMED = /(?<!<span class=")(?<!class=")vocab-word"/g;

const DEBT = JSON.parse(readFileSync(join(ROOT, "data", "vocab-attribute-debt.json"), "utf8"));

function trackedHtml() {
  const out = execFileSync("git", ["ls-files", "-z", "*.html"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split("\0").filter((f) => f && !f.startsWith("dist/"));
}

function main() {
  const files = trackedHtml();
  assertNonEmpty("tracked HTML pages", files, "git ls-files '*.html'", 100);
  assertSweptEnough("validate:vocab-attributes", files, "git ls-files '*.html'");

  const hits = [];
  const malformed = [];
  let repaired = 0;

  for (const rel of files) {
    const abs = join(ROOT, rel);
    const src = readFileSync(abs, "utf8");
    if (!src.includes("vocab-word")) continue;

    MALFORMED.lastIndex = 0;
    const broken = (src.match(MALFORMED) || []).length;
    if (broken) malformed.push({ rel, broken });

    CORRUPT.lastIndex = 0;
    let m;
    const words = [];
    while ((m = CORRUPT.exec(src))) words.push(m[1]);
    if (!words.length) continue;

    if (FIX) {
      writeFileSync(abs, src.replace(CORRUPT, "$1"));
      repaired += words.length;
    }
    hits.push({ rel, words });
  }

  if (FIX) {
    console.log(
      `Repaired ${repaired} swallowed attribute${repaired === 1 ? "" : "s"} ` +
        `across ${hits.length} page${hits.length === 1 ? "" : "s"}.`,
    );
    return;
  }

  const brokenTotal = malformed.reduce((n, h) => n + h.broken, 0);
  const ceiling = DEBT.malformedSpans.ceiling;
  if (brokenTotal > ceiling) {
    console.error(
      `FAIL  validate:vocab-attributes: ${brokenTotal} malformed glossary spans, ` +
        `above the pinned ceiling of ${ceiling}.`,
    );
    console.error("      This debt may only shrink. See data/vocab-attribute-debt.json.");
    for (const h of malformed) console.error(`      ${h.rel}  (${h.broken})`);
    process.exit(1);
  }

  if (!hits.length) {
    const note =
      brokenTotal < ceiling
        ? `  (malformed spans ${brokenTotal} — below the pinned ${ceiling}; lower the ceiling)`
        : `  (${brokenTotal} malformed spans, at the pinned ceiling)`;
    console.log(
      `PASS  validate:vocab-attributes — ${files.length} pages, no swallowed attributes.${note}`,
    );
    return;
  }

  const total = hits.reduce((n, h) => n + h.words.length, 0);
  console.error(
    `FAIL  validate:vocab-attributes: ${total} glossary link${total === 1 ? " sits" : "s sit"} ` +
      `in attribute position across ${hits.length} page${hits.length === 1 ? "" : "s"}.`,
  );
  console.error(
    "      Each one replaced an attribute NAME, so the element loses that " +
      "attribute and the leftover markup renders as visible text.",
  );
  for (const h of hits.slice(0, 20)) {
    console.error(`      ${h.rel}  (${h.words.length}: ${[...new Set(h.words)].join(", ")})`);
  }
  if (hits.length > 20) console.error(`      … and ${hits.length - 20} more pages`);
  console.error("      Repair: node tools/validate-vocab-attributes.mjs --fix");
  process.exit(1);
}

main();
