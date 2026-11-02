/**
 * The family design system as the page loads it: tokens, components and the page body sheet are
 * three shared files under assets/design/family/, versioned by content hash so a family on a phone
 * caches them across all 166 lessons. The only per-lesson styling is `data-unit` on <html>, which
 * family.css maps to --unit-accent / --unit-accent-tint / --unit-accent-ink.
 *
 * LEGACY_SHELL_CSS is the one remaining legacy sheet: the hero, the top bar and the print rules, owned
 * by the hero and print workstreams, which delete it as they replace those surfaces.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const stamp = (text) => createHash("sha256").update(text).digest("hex").slice(0, 10);

export const DESIGN_SHEETS = ["tokens", "family", "body"];

export const DESIGN_CSS_LINKS = DESIGN_SHEETS.map((name) => {
  const file = `assets/design/family/${name}.css`;
  return `<link rel="stylesheet" href="/${file}?v=${stamp(read(file))}">`;
}).join("\n");

export const LEGACY_SHELL_CSS = read("scripts/lib/homework-legacy-shell.css").trim();
