#!/usr/bin/env node
// Family design system: computes every declared contrast pair for the light, dark and
// high-contrast themes from assets/design/family/tokens.css and writes
// docs/design/family-contrast-matrix.md.
//
//   node tools/build-family-tokens-report.mjs           write the matrix
//   node tools/build-family-tokens-report.mjs --check   fail if the matrix on disk is stale
//
// Exits 1 when any pair is under its floor (4.5:1 text, 3:1 UI, 7:1 text in high contrast),
// when the brand values drift from engine/design/tokens.json, when a token lands in the
// forbidden violet/purple/magenta range, or when a product cap (colors, sizes, radii, shadows)
// is exceeded. validate:family-design-tokens runs this in --check mode.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTokens } from "./build-design-tokens.mjs";
import {
  brandAlignment,
  capProblems,
  countTokens,
  evaluatePairs,
  failures,
  forbiddenHueTokens,
  loadTokens,
  MATRIX_MD,
  renderMatrix,
  TOKENS_CSS,
  unitGrayGap,
} from "./lib/family-tokens.mjs";

const ENGINE_TOKENS = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "engine/design/tokens.json",
);

/** Everything the report asserts, as a list of problems plus the rendered markdown. */
export function buildReport({ cssPath = TOKENS_CSS, css } = {}) {
  const loaded = loadTokens(cssPath, css);
  const problems = [...loaded.problems];
  if (!loaded.modes.light) return { problems, markdown: "" };
  const evaluated = evaluatePairs(loaded.modes);
  problems.push(...failures(evaluated));
  const counts = countTokens(loaded.declared);
  problems.push(...capProblems(counts));
  for (const t of forbiddenHueTokens(loaded.modes))
    problems.push(`token in the forbidden violet/purple/magenta hue range: ${t}`);
  const engine = buildTokens(JSON.parse(readFileSync(ENGINE_TOKENS, "utf8")));
  const brand = brandAlignment(loaded.modes, engine.colours);
  problems.push(...brand.problems);
  const gap = unitGrayGap(loaded.modes);
  if (gap < 0.02)
    problems.push(
      `adjacent unit accents are only ${gap.toFixed(3)} apart in luminance (need 0.02)`,
    );
  const markdown = renderMatrix({ modes: loaded.modes, evaluated, counts, brand });
  return { problems, markdown, counts, evaluated, modes: loaded.modes };
}

function main() {
  const { problems, markdown, evaluated } = buildReport();
  if (problems.length) {
    console.error(`FAIL build-family-tokens-report:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  const total = Object.values(evaluated).reduce((n, rows) => n + rows.length, 0);
  if (process.argv.includes("--check")) {
    let onDisk = "";
    try {
      onDisk = readFileSync(MATRIX_MD, "utf8");
    } catch {}
    if (onDisk !== markdown) {
      console.error(
        "FAIL build-family-tokens-report --check: docs/design/family-contrast-matrix.md is stale; run `node tools/build-family-tokens-report.mjs`",
      );
      process.exit(1);
    }
    console.log(`PASS build-family-tokens-report --check (${total} pairs across 3 themes)`);
    return;
  }
  writeFileSync(MATRIX_MD, markdown);
  console.log(`wrote ${MATRIX_MD} (${total} pairs across 3 themes)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
