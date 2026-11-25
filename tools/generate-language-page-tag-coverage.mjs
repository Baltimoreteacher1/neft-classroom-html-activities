#!/usr/bin/env node
/* =============================================================================
 * generate-language-page-tag-coverage.mjs — how much of the activity bank carries a Key Language Use and a content-area tag.
 *
 * WHY. The audit (C3, 2026-11-24) found alignment metadata thin and inconsistent: no way to say "which activities build
 * Argue for grade 3-5?" without reading 933 files. This measures it from the data, against the controlled vocabulary in
 * access-practice-lab/content/metadata/vocab.json, writes docs/language-page/coverage-matrix.md, and holds the share per band to a
 * ratchet (data/language-page-tag-coverage-baseline.json) so new untagged content cannot quietly lower it.
 *
 * It does NOT invent tags. Backfilling 539 untagged activities is a content decision a WIDA-trained reviewer makes (H-03); this makes the
 * gap visible and stops it growing.
 *
 *   node tools/generate-language-page-tag-coverage.mjs           write the matrix
 *   node tools/generate-language-page-tag-coverage.mjs --check   fail when it is stale or coverage fell below the baseline
 * ========================================================================== */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CONTENT = join(ROOT, "access-practice-lab/content");
export const OUT = "docs/language-page/coverage-matrix.md";
export const BASELINE = "data/language-page-tag-coverage-baseline.json";
export const VOCAB = "access-practice-lab/content/metadata/vocab.json";

/** Every activity object under a band's domain files (same walk as tools/access-es-strings.test.mjs). */
export function loadActivities(vocab, root = CONTENT) {
  const acts = [];
  for (const band of vocab.bands) {
    const dir = join(root, band);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)
      .filter((n) => n.endsWith(".json"))
      .sort()) {
      const domain = f.replace(/\.json$/, "");
      const walk = (n) => {
        if (Array.isArray(n)) n.forEach(walk);
        else if (n && typeof n === "object") {
          if (n.id && (n.directions || n.prompt || n.question)) acts.push({ band, domain, a: n });
          else Object.values(n).forEach(walk);
        }
      };
      walk(JSON.parse(readFileSync(join(dir, f), "utf8")));
    }
  }
  return acts;
}

const norm = (s) => s.trim().toLowerCase();

/** What one tag string is: a Key Language Use, a content area, or free text. */
export function classifyTag(tag, vocab) {
  if (typeof tag !== "string") return { kind: "other" };
  const t = norm(tag);
  for (const k of vocab.klu)
    if (new RegExp(`^${k.toLowerCase()}\\b`).test(t)) return { kind: "klu", id: k };
  for (const area of vocab.contentAreas) {
    for (const name of [area.label, ...area.aliases]) {
      const n = norm(name);
      if (
        t === n ||
        new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*(:|—|–|-|·)\\s`).test(t)
      )
        return { kind: "area", id: area.id, variant: name !== area.label };
    }
  }
  return { kind: "other" };
}

export function compute(acts, vocab) {
  const bands = {};
  const variants = {};
  const kluById = {};
  for (const { band, domain, a } of acts) {
    const b = (bands[band] ||= { total: 0, klu: 0, area: 0, both: 0, domains: {} });
    b.total += 1;
    b.domains[domain] = (b.domains[domain] || 0) + 1;
    let hasK = false;
    let hasA = false;
    for (const tag of a.wida || []) {
      const c = classifyTag(tag, vocab);
      if (c.kind === "klu") {
        hasK = true;
        kluById[`${band}|${c.id}`] = (kluById[`${band}|${c.id}`] || 0) + 1;
      }
      if (c.kind === "area") {
        hasA = true;
        if (c.variant) variants[tag.trim()] = (variants[tag.trim()] || 0) + 1;
      }
    }
    if (hasK) b.klu += 1;
    if (hasA) b.area += 1;
    if (hasK && hasA) b.both += 1;
  }
  return { bands, variants, kluById };
}

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

export function render(m, vocab) {
  const rows = vocab.bands
    .filter((b) => m.bands[b])
    .map((b) => {
      const x = m.bands[b];
      return `| ${b} | ${x.total} | ${x.klu} (${pct(x.klu, x.total)}%) | ${x.area} (${pct(x.area, x.total)}%) | ${x.both} |`;
    });
  const t = Object.values(m.bands).reduce(
    (s, x) => ({
      total: s.total + x.total,
      klu: s.klu + x.klu,
      area: s.area + x.area,
      both: s.both + x.both,
    }),
    { total: 0, klu: 0, area: 0, both: 0 },
  );
  const kluRows = vocab.bands
    .filter((b) => m.bands[b])
    .map((b) => `| ${b} | ${vocab.klu.map((k) => m.kluById[`${b}|${k}`] || 0).join(" | ")} |`);
  const domRows = vocab.bands
    .filter((b) => m.bands[b])
    .map((b) => `| ${b} | ${vocab.domains.map((d) => m.bands[b].domains[d] || 0).join(" | ")} |`);
  const variantRows = Object.entries(m.variants)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `| ${k} | ${n} |`);
  return `# Activity tag coverage

> **GENERATED FILE.** Built by \`tools/generate-language-page-tag-coverage.mjs\` from the activity bank
> (\`access-practice-lab/content/<band>/<Domain>.json\`) and the vocabulary in \`${VOCAB}\`. Do not edit; change the data and regenerate.
> \`tools/language-page-tag-coverage.test.mjs\` fails when this is stale or a band's share falls below \`${BASELINE}\`.

**What is counted.** An activity is *KLU-tagged* when one of its \`wida\` tags starts with ${vocab.klu.join(", ")}, and *content-area tagged* when a tag
names a content area in the vocabulary. Other tags are free-text can-do statements; they are fine and are not counted here.
**Nothing here is inferred or backfilled.** Closing the gap is a content decision for a WIDA-trained reviewer (H-03).

## Coverage by band
| Band | Activities | With a Key Language Use | With a content area | With both |
| --- | --- | --- | --- | --- |
${rows.join("\n")}
| **All** | **${t.total}** | **${t.klu} (${pct(t.klu, t.total)}%)** | **${t.area} (${pct(t.area, t.total)}%)** | **${t.both}** |

## Key Language Use balance (activities tagged, by band)
| Band | ${vocab.klu.join(" | ")} |
| --- | ${vocab.klu.map(() => "---").join(" | ")} |
${kluRows.join("\n")}

## Activities by domain
| Band | ${vocab.domains.join(" | ")} |
| --- | ${vocab.domains.map(() => "---").join(" | ")} |
${domRows.join("\n")}

## Spellings that differ from the vocabulary's label
These name a content area correctly but not in the canonical spelling.

| As written | Uses |
| --- | --- |
${variantRows.length ? variantRows.join("\n") : "| _none_ | |"}
`;
}

export function baselineFrom(m, vocab) {
  const bands = {};
  for (const b of vocab.bands)
    if (m.bands[b])
      bands[b] = {
        kluShare: pct(m.bands[b].klu, m.bands[b].total),
        areaShare: pct(m.bands[b].area, m.bands[b].total),
      };
  return bands;
}

/** Shares may not fall below the baseline by more than rounding (0.1 point). */
export function ratchetProblems(m, baseline) {
  const out = [];
  for (const [b, base] of Object.entries(baseline.bands)) {
    const x = m.bands[b];
    if (!x) {
      out.push(`${b}: the band is no longer in the data`);
      continue;
    }
    if (pct(x.klu, x.total) < base.kluShare - 0.1)
      out.push(
        `${b}: Key Language Use share ${pct(x.klu, x.total)}% fell below the baseline ${base.kluShare}%`,
      );
    if (pct(x.area, x.total) < base.areaShare - 0.1)
      out.push(
        `${b}: content-area share ${pct(x.area, x.total)}% fell below the baseline ${base.areaShare}%`,
      );
  }
  return out;
}

export function build() {
  const vocab = JSON.parse(readFileSync(join(ROOT, VOCAB), "utf8"));
  const m = compute(loadActivities(vocab), vocab);
  return { vocab, m, doc: render(m, vocab) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { vocab, m, doc } = build();
  const path = join(ROOT, OUT);
  if (process.argv.includes("--check")) {
    const base = JSON.parse(readFileSync(join(ROOT, BASELINE), "utf8"));
    const problems = ratchetProblems(m, base);
    if (!existsSync(path) || readFileSync(path, "utf8") !== doc)
      problems.push(`${OUT} is stale: run node tools/generate-language-page-tag-coverage.mjs`);
    if (problems.length) {
      for (const p of problems) console.error(`  ${p}`);
      process.exit(1);
    }
    console.log(
      `generate-language-page-tag-coverage: ${OUT} is current and no band is below its baseline`,
    );
  } else if (process.argv.includes("--print-baseline")) {
    console.log(JSON.stringify({ bands: baselineFrom(m, vocab) }, null, 2));
  } else {
    writeFileSync(path, doc);
    console.log(`generate-language-page-tag-coverage: wrote ${OUT}`);
  }
}
