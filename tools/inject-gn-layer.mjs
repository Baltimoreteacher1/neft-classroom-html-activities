#!/usr/bin/env node
/**
 * Inject the shared Axiom City layer into every graphic novel, idempotently and reversibly.
 *
 * Each of the 39 books gets ONE sentinel block just before the final </body>:
 *   <!-- gn-layer:begin ... -->  #gn-vocab JSON  #gn-easy JSON  <script src=gn-layer.js defer>  <!-- gn-layer:end -->
 *
 *   #gn-vocab  the vocabulary of the lessons the book teaches (lessons/<id>/config.json), with the
 *              picture already resolved, so the pop-up needs no build-time module.
 *   #gn-easy   {"v":1,"map":{<key>: <easy html>}} from graphic-novels/axiom-city/easy/<slug>.json
 *              (empty until an author writes one; the layer hides the switch for an empty map).
 *
 * Nothing outside the sentinel block is touched; existing boot guards and script tags keep their order.
 *
 *   node tools/inject-gn-layer.mjs            write
 *   node tools/inject-gn-layer.mjs --check    exit 1 if any book is stale
 *   node tools/inject-gn-layer.mjs --revert   remove the block from every book
 *   node tools/inject-gn-layer.mjs --report   per-book lesson source and term counts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BEGIN, bookLessons, EASY_DIR, END, listBooks, vocabFor } from "./lib/gn-layer.mjs";

const BLOCK_RE = new RegExp(`${BEGIN}[\\s\\S]*?${END}\\n?`, "g");
// JSON inside <script>: "<" must never appear raw, or "</script>" / "<!--" would end or confuse the tag.
const json = (v) =>
  JSON.stringify(v)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

/** Allowed Easy-read markup: inline tags only, so an easy string can never add structure or script. */
export const EASY_TAGS = new Set([
  "b",
  "i",
  "em",
  "strong",
  "span",
  "code",
  "sup",
  "sub",
  "u",
  "br",
]);

export function easyFor(slug) {
  const file = join(EASY_DIR, `${slug}.json`);
  if (!existsSync(file)) return { v: 1, map: {} };
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (data.v !== 1 || typeof data.map !== "object" || !data.map)
    throw new Error(`${file}: expected {"v":1,"map":{...}}`);
  return { v: 1, map: data.map };
}

export function blockFor(book, html) {
  const { source, ids } = bookLessons(html);
  const vocab = vocabFor(ids);
  return `${BEGIN} (shared layer: vocabulary pop-ups, Easy read switch, formatting; vocabulary from ${source} ${ids.join(",")} — tools/inject-gn-layer.mjs) -->
<script type="application/json" id="gn-vocab">${json(vocab)}</script>
<script type="application/json" id="gn-easy">${json(easyFor(book.slug))}</script>
<script src="/graphic-novels/_shared/gn-layer.js" defer></script>
${END}
`;
}

export function inject(html, block) {
  const clean = html.replace(BLOCK_RE, "");
  const at = clean.lastIndexOf("</body>");
  if (at < 0) throw new Error("no </body>");
  const head = clean.slice(0, at);
  return `${head.endsWith("\n") ? head : `${head}\n`}${block}${clean.slice(at)}`;
}

export const revert = (html) => html.replace(BLOCK_RE, "");

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = new Set(process.argv.slice(2));
  const stale = [];
  for (const book of listBooks()) {
    const html = readFileSync(book.file, "utf8");
    if (args.has("--report")) {
      const { source, ids, unit } = bookLessons(html);
      console.log(
        `${book.slug}\t${source}\t${ids.join(",")}\t${vocabFor(ids).length} terms\t${unit}`,
      );
      continue;
    }
    const next = args.has("--revert") ? revert(html) : inject(html, blockFor(book, html));
    if (next === html) continue;
    stale.push(book.slug);
    if (!args.has("--check")) writeFileSync(book.file, next);
  }
  if (args.has("--report")) process.exit(0);
  if (args.has("--check")) {
    if (stale.length) {
      console.error(
        `gn-layer block is stale in ${stale.length} book(s); run node tools/inject-gn-layer.mjs\n  ${stale.join("\n  ")}`,
      );
      process.exit(1);
    }
    console.log("gn-layer blocks current in all books");
  } else console.log(`${args.has("--revert") ? "Reverted" : "Updated"} ${stale.length} book(s)`);
}
