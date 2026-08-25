// A character the shipped fonts cannot draw must not reach a student.
//
// WHY THIS EXISTS. The long-division bracket U+27CC (⟌) shipped to production
// inside `typedDivision` and inside the authored prose of six lesson configs
// and their Spanish. It is absent from Outfit — the `--sg-mono` face every
// small-group practice model is set in — and from the mono fallbacks after it,
// so the browser fell through to whatever the operating system had: on macOS a
// hairline hook with no bar attached to it, on a device with no cover at all a
// tofu box. Joel's report was simply that division "does not have the division
// symbol in the practice."
//
// Nothing could see it. It parses, it lints, it types, it renders, it serves
// 200, and every screenshot gate is blind because a hairline hook IS pixels. A
// missing glyph is only visible to someone who knows what the symbol should
// look like, which is the reader — after it is live.
//
// So the rule is a character rule, checked at the only place it can be: the
// source. Draw the bracket instead (`divisionHouse` in
// engine/core/small-group-visual-practice.js draws it with borders, which every
// device renders identically), or write it in words — "63 into 189" / "189 ÷
// 63" — which every font covers and every screen reader can say.
//
// The list is DELIBERATELY SHORT. It holds only characters whose failure was
// observed in this stack, never ones assumed unsafe from their Unicode block: a
// gate that flags a character somebody had a good reason to use gets an
// allowlist, and an allowlist is how a gate stops meaning anything.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);

/** Observed-unrenderable characters, with the remedy that replaced each one. */
const BANNED = [
  {
    char: "⟌",
    name: "U+27CC LONG DIVISION",
    why: "absent from Outfit and the mono fallbacks — drew a hairline hook or a tofu box",
    instead:
      'draw it (divisionHouse() in small-group-visual-practice.js) or write "<dividend> ÷ <divisor>"',
  },
];

/* ── the corpus: everything a student's browser is handed ────────────────── */

// Tracked files only, and only the kinds that reach a page — the same discovery
// rule validate:secrets uses. `dist/` is build output and `node_modules` is not
// ours; both are excluded by asking git rather than by walking the tree, so a
// file nobody committed cannot quietly satisfy this check either.
const tracked = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
})
  .split("\0")
  .filter(Boolean);

const TEXT = /\.(js|mjs|cjs|json|html|css|md)$/i;
const SKIP = /^(node_modules|dist|coverage)\//;
// This file names the characters it bans, and the memory of the incident is
// worth keeping in prose. Neither is content a student is served.
const SELF = /^(tools\/unrenderable-glyphs\.test\.mjs|docs\/)/;

const corpus = tracked.filter((p) => TEXT.test(p) && !SKIP.test(p) && !SELF.test(p));

assert.ok(
  corpus.length >= 3000,
  `swept only ${corpus.length} tracked text files — discovery is broken, and a shrunken sweep ` +
    "cannot report a clean tree",
);

/* ── 1 · the detector fires (proven before it is trusted) ────────────────── */

// A gate that has quietly stopped firing and a gate watching a clean tree print
// the same line, so the detector is run against the exact string that shipped.
const SHIPPED =
  'shell.appendChild(el("div", "sg-div-bracket", `${esc(divisor)} ⟌ ${esc(dividend)}`));';
for (const entry of BANNED) {
  assert.ok(
    entry.char.length === 1,
    `${entry.name}: BANNED entries are single characters, not sequences`,
  );
}
assert.ok(
  BANNED.some((entry) => SHIPPED.includes(entry.char)),
  "the detector no longer recognises the line that caused this test to exist",
);
assert.equal(
  BANNED.some((entry) => "6 into 468".includes(entry.char)),
  false,
  "the detector flags the replacement text, which would make the remedy unusable",
);

/* ── 2 · no banned character is anywhere in the shipped corpus ───────────── */

const findings = [];
for (const path of corpus) {
  let text;
  try {
    text = readFileSync(new URL(path, root), "utf8");
  } catch {
    continue; // unreadable or vanished mid-run; not this test's subject
  }
  for (const entry of BANNED) {
    if (!text.includes(entry.char)) continue;
    const line = text.slice(0, text.indexOf(entry.char)).split("\n").length;
    findings.push(`${path}:${line} — ${entry.name} (${entry.why}); instead: ${entry.instead}`);
  }
}

assert.deepEqual(
  findings,
  [],
  `unrenderable character(s) in shipped content:\n  ${findings.join("\n  ")}`,
);

console.log(
  `unrenderable glyphs: ${BANNED.length} banned character(s), ${corpus.length} tracked text files, 0 hits.`,
);
