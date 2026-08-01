// Keep injected layers alive across a regeneration.
//
// Two systems write the same HTML files here, and they do not know about each
// other. GENERATORS (generate-notes, generate-homework, the support-page
// builders …) render a page from a lesson's config.json and overwrite it whole.
// INJECTORS (tools/inject-save-resume, inject-mobile-access, inject-math-workbench,
// inject-enterprise-head …) then splice sentinel-delimited blocks into that
// output:
//
//   <!-- nsr-injected:begin (multi-day save/resume …) -->
//   <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css">
//   <!-- nsr-injected:end -->
//
// Whoever writes last wins, so re-running a generator silently deletes every
// injected block on every page it touches — Save/Resume, the mobile a11y layer,
// the Math Workbench launcher, the canonical/OG head. Nothing catches it:
// `validate:injection` only checks that begin/end sentinels are BALANCED, and
// zero blocks balance perfectly. The page still builds, still parses, still
// serves 200, and quietly loses features on ~74 lessons at a time.
//
// This module closes that hole from the generator side. `writeGenerated()` is a
// drop-in for writeFileSync: it reads whatever is on disk first, lifts out every
// injected block, and splices them back into the freshly rendered HTML at the
// same anchor they were living behind — head blocks before </head>, body blocks
// before the last </body>, in their original order. A page with no injected
// blocks is written back byte-for-byte unchanged, so this can be adopted by any
// generator without moving a single unrelated file.
//
// It is deliberately not a substitute for running the injectors: it preserves
// what is already there, it does not add what was never injected. Run the
// injectors when a page is NEW.

import { existsSync, readFileSync, writeFileSync } from "node:fs";

// A sentinel pair, with the family name back-referenced so two different
// families can never be spliced together into one bogus block.
const BLOCK = /<!--\s*([a-z0-9-]+)-injected:begin[\s\S]*?<!--\s*\1-injected:end\s*-->/g;

// Everything a generator needs to know about one injected block: which layer it
// belongs to, whether it lived in the head or the body, and its exact text.
export function readInjectedBlocks(html) {
  const src = String(html || "");
  const headEnd = src.search(/<\/head\s*>/i);
  const out = [];
  // The indentation the anchor tags carry HERE. The injectors re-indent the
  // closing tag they splice above ("  </body>"), so a generator that emits it at
  // column 0 would otherwise show up as a one-line diff on every page it writes.
  const anchorIndent = (at) => {
    if (at < 0) return "";
    const lead = src.slice(src.lastIndexOf("\n", at) + 1, at);
    return /^[ \t]*$/.test(lead) ? lead : "";
  };
  const anchors = {
    head: anchorIndent(headEnd),
    body: anchorIndent(src.toLowerCase().lastIndexOf("</body>")),
  };
  BLOCK.lastIndex = 0;
  let m;
  while ((m = BLOCK.exec(src)) !== null) {
    // The block's own leading indentation belongs to the block, not to whatever
    // line follows it — the injectors indent their blocks independently of the
    // anchor they sit above. Carrying it makes a re-splice byte-identical.
    const lineStart = src.lastIndexOf("\n", m.index) + 1;
    const lead = src.slice(lineStart, m.index);
    const zone = headEnd >= 0 && m.index < headEnd ? "head" : "body";
    // Blank lines separating this block from the one above belong to the block
    // too. Without them, re-splicing two adjacent blocks joins them tight and
    // every page differs from itself by a blank line — 437 shells of whitespace
    // noise that would drown the one real content change, and would make an
    // "is this page stale?" check permanently, uselessly red.
    let blankStart = lineStart;
    while (blankStart > 0) {
      const prevEnd = blankStart - 1; // the "\n" ending the previous line
      const prevStart = src.lastIndexOf("\n", prevEnd - 1) + 1;
      if (!/^[ \t]*$/.test(src.slice(prevStart, prevEnd))) break;
      blankStart = prevStart;
    }
    out.push({
      family: m[1],
      zone,
      indent: /^[ \t]*$/.test(lead) ? lead : "",
      blankBefore: src.slice(blankStart, lineStart),
      anchorIndent: anchors[zone],
      text: m[0],
    });
  }
  return out;
}

// Splice `blocks` back into `html`. Any family already present in a zone is left
// alone — a generator that emits its own placeholder for a layer keeps it, and
// nothing is ever duplicated.
export function preserveInjected(html, blocks) {
  let out = String(html || "");
  if (!blocks || !blocks.length) return out;

  const present = new Set(readInjectedBlocks(out).map((b) => `${b.family}:${b.zone}`));
  const wanted = blocks.filter((b) => !present.has(`${b.family}:${b.zone}`));
  if (!wanted.length) return out;

  for (const zone of ["head", "body"]) {
    const add = wanted.filter((b) => b.zone === zone);
    if (!add.length) continue;
    // Head blocks go before </head>; body blocks before the LAST </body>, since
    // an example page can print a literal </body> inside a code sample.
    const at =
      zone === "head" ? out.search(/<\/head\s*>/i) : out.toLowerCase().lastIndexOf("</body>");
    if (at < 0) continue; // no anchor — better to drop than to corrupt the document

    // Splice whole lines, each block re-indented exactly as it was. Matching
    // what the injectors themselves write matters more than it looks: it makes a
    // re-run a byte-for-byte no-op, so "did this generator change anything?"
    // stays an honest question instead of 300 files of whitespace noise hiding
    // one real edit.
    const lineStart = out.lastIndexOf("\n", at) + 1;
    const here = out.slice(lineStart, at);
    const ownLine = /^[ \t]*$/.test(here);
    const cut = ownLine ? lineStart : at;
    // Restore the anchor tag's own indentation too, when the source had one and
    // the freshly rendered page does not.
    const anchor = ownLine && !here ? add[0].anchorIndent || "" : "";
    const payload = `${add
      .map((b, i) => (i === 0 ? "" : b.blankBefore || "") + (b.indent || "") + b.text)
      .join("\n")}\n${anchor}`;
    out = out.slice(0, cut) + payload + out.slice(cut);
  }
  return out;
}

// The exact bytes `writeGenerated` would put on disk, without writing them.
// Split out so a generator's --check mode and its write path can never disagree
// about what "up to date" means.
export function renderGenerated(file, html) {
  const prev = existsSync(file) ? readFileSync(file, "utf8") : "";
  return prev ? preserveInjected(html, readInjectedBlocks(prev)) : String(html);
}

// Drop-in replacement for writeFileSync(file, html) in any generator that
// overwrites a page the injectors also write to.
export function writeGenerated(file, html) {
  const next = renderGenerated(file, html);
  writeFileSync(file, next);
  return next;
}

// True when the committed page already equals what the generator would produce.
//
// This is the ONLY sound way to ask "is this page stale?". The obvious
// alternative — grep the page for a field's text from config.json — is not an
// invariant here and produces false alarms: slides.html renders `commonMistake`
// REWORDED, learn.html renders Notice & Wonder CONDITIONALLY (present in 1-4,
// absent in 1-1), and a naive presence check flagged 74 lessons that were
// perfectly in sync. Comparing against the generator's own output has no such
// ambiguity, and it covers every field at once instead of a hand-listed few.
//
// Injected blocks are excluded from the comparison by construction, because
// renderGenerated re-splices the ones already on disk.
export function isGeneratedFresh(file, html) {
  if (!existsSync(file)) return false;
  return readFileSync(file, "utf8") === renderGenerated(file, html);
}
