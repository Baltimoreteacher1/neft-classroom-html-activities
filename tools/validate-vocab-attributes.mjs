#!/usr/bin/env node
/* =============================================================================
 * validate-vocab-attributes.mjs — a glossary link must never eat an attribute.
 *
 * WHAT WENT WRONG. The glossary decoration on these pages was originally
 * applied by a one-shot regex pass (`scripts/decorate_objectives_vocab.py`,
 * deleted 2026-08-23) that matched vocabulary terms anywhere in the file,
 * INCLUDING inside an HTML open tag. Two of the glossary terms — `width` and `height` — are also the
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
 * this. Both legacy Python passes have been deleted (recoverable from git
 * history), because the companion named `fix_vocab_attributes.py` was not a
 * fix — it was the second cause. Its cleanup regex
 *
 *     ="[^"]*<span[^>]*vocab-word[^>]*>(.*?)</span>[^"]*"
 *
 * stops `[^"]*` at the first quote INSIDE the span it is matching, so on an
 * attribute holding two linked terms it truncated the value and left the rest
 * of the second span stranded in the tag. Replaying it on the injector's own
 * output reproduces the surviving damage byte-for-byte. It also re-ran the
 * injector afterwards, so every run both damaged pages and printed success.
 *
 * THE RULE. A `.vocab-word` span is a glossary link around a word in prose. It
 * is therefore never immediately followed by `=`. That single condition
 * separates the 1,808 corrupted attributes from the one legitimate use in the
 * repo — Spanish prose reading `un triángulo de base=3, altura=5`, where the
 * `=` belongs to the sentence and a quote does not follow it. Requiring the
 * quote keeps that line untouched.
 *
 * TWO FURTHER SHAPES, both from the same cleanup regex, both now repaired.
 *
 *   2. The span's own opening tag destroyed:
 *        aria-label="base"vocab-word" data-vocab="height" ...>height</span> of 6 feet."
 *   3. The attribute consumed entirely, leaving only the glossary term:
 *        <div class="card" style="height">      <button onclick="factor">
 *
 * Shape 3 is the dangerous one: it carries no marker, so no search for "vocab"
 * finds it. 114 of them were live — invalid CSS on layout containers, and
 * read-aloud buttons that threw ReferenceError the moment a student pressed
 * them.
 *
 * ALL OF IT WAS RECOVERABLE, and none of it was guessed. Every pre-damage file
 * is still in git history: the injector landed in a single commit, so the
 * revision before it holds the original text verbatim. 50 of 50 shape-2 cases
 * and 93 of 114 shape-3 cases were restored from those revisions, each one
 * gated on the surviving fragments still corroborating the recovered value.
 * The 14 that remain sit in files whose attribute counts have drifted since,
 * so positional recovery is unproven; they are pinned in
 * data/vocab-attribute-debt.json rather than guessed at.
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
import { VOCAB_TERMS } from "../scripts/lib/vocab-linkify.mjs";
import { assertNonEmpty } from "./lib/non-empty.mjs";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIX = process.argv.includes("--fix");
const TERMS = new Set(VOCAB_TERMS.map((t) => t.toLowerCase()));

/* A vocab span in ATTRIBUTE POSITION: immediately followed by `="` or `='`.
 * The quote is what makes this unambiguous — see THE RULE above. */
const CORRUPT = /<span class="vocab-word"[^<>]*>([^<]*)<\/span>(?=="|=')/g;

/* The lossy shape: a `vocab-word"` marker whose `<span class="` opener was
 * destroyed. Well-formed spans are excluded by the lookbehind. */
const MALFORMED = /(?<!<span class=")(?<!class=")vocab-word"/g;

const DEBT = JSON.parse(readFileSync(join(ROOT, "data", "vocab-attribute-debt.json"), "utf8"));

/* THE THIRD SHAPE, and the one with no marker at all. Where the cleanup regex
 * consumed the whole attribute value it left only the glossary term behind:
 *
 *     <div class="card" style="height">        (was a full CSS declaration)
 *     <button class="btn-tts" onclick="factor"> (was speakText('...'))
 *
 * Nothing here says "vocab" — the damage is invisible to any marker search, so
 * it hid behind the other two shapes. A JS-bearing or URL-bearing attribute
 * whose entire value is a bare glossary noun is always broken: invalid CSS, or
 * a handler that throws ReferenceError the moment a student clicks it. */
const JS_ATTRS =
  /^(onclick|onchange|oninput|onsubmit|onkeydown|onkeyup|onfocus|onblur|onmouseover|onmouseout|href|src|style)$/;
const ATTR = /([a-zA-Z-]+)="([^"]{1,20})"/g;

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
  const bareTerm = [];
  let repaired = 0;

  for (const rel of files) {
    const abs = join(ROOT, rel);
    const src = readFileSync(abs, "utf8");
    // NB: the bare-term shape leaves no "vocab-word" text, so this file cannot
    // be skipped on that marker — every page has to be scanned.

    MALFORMED.lastIndex = 0;
    const broken = (src.match(MALFORMED) || []).length;
    if (broken) malformed.push({ rel, broken });

    ATTR.lastIndex = 0;
    let bare = 0;
    for (const a of src.matchAll(ATTR)) {
      if (JS_ATTRS.test(a[1]) && TERMS.has(a[2].toLowerCase().trim())) bare++;
    }
    if (bare) bareTerm.push({ rel, bare });

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

  const bareTotal = bareTerm.reduce((n, h) => n + h.bare, 0);
  const bareCeiling = DEBT.bareTermAttributes.ceiling;
  if (bareTotal > bareCeiling) {
    console.error(
      `FAIL  validate:vocab-attributes: ${bareTotal} JS/URL attribute(s) hold nothing but a ` +
        `glossary term, above the pinned ceiling of ${bareCeiling}.`,
    );
    console.error('      e.g. style="width" (invalid CSS) or onclick="factor" (throws on click).');
    for (const h of bareTerm) console.error(`      ${h.rel}  (${h.bare})`);
    process.exit(1);
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
    const part = (n, c, label) =>
      n < c ? `${label} ${n} — below the pinned ${c}, lower it` : `${n} ${label}, at ceiling`;
    const note = `  (${part(brokenTotal, ceiling, "malformed spans")}; ${part(bareTotal, bareCeiling, "bare-term attrs")})`;
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
