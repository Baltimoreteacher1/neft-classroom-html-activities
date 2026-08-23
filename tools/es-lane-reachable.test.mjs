// The Spanish a student is owed must be REACHABLE, not merely present.
//
// WHY THIS EXISTS. `validate:es-parity` reported "3045 small-group practice
// items complete in both languages" and was telling the truth about the DATA.
// Every one of those Spanish strings was rendered into the page inside a
// `.sg-es` span and then hidden, because the rule that reveals them read
//
//     html[data-lang="es"] .sg-es { display: block }
//
// while the switch the engine actually sets is the `lang` ATTRIBUTE —
// `setPreferredLang()` stamps `<html lang="es">`, and i18n.js re-stamps it from
// the saved preference on every load. Nothing in the product has ever set
// `data-lang` on `<html>`. Measured on 2-7-group1 in Spanish mode: 125 spans,
// 125 of them `display:none`.
//
// A content gate cannot see this. It compares strings in a config against other
// strings in a config, and both halves were right; the failure was one CSS
// selector away from the data, in a stylesheet no parity check reads. So this
// test asserts the CONTRACT BETWEEN THEM: for every bilingual lane in the
// product, the selector that emits and the selector that reveals must agree
// about what "Spanish is on" means.
//
// Source-level on purpose — it greps the two stylesheets rather than opening a
// browser, so it runs in a second on every push. The rendered behaviour is
// covered by the browser sweeps.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const smallGroupUi = read("engine/core/small-group-ui.js");
const designSystem = read("engine/styles/design-system.css");
const i18n = read("engine/core/i18n.js");

/* ── 1 · The switch is the lang attribute, and only i18n.js owns it ───────── */

assert.match(
  i18n,
  /document\.documentElement\.lang\s*=/,
  "i18n.js must be what stamps <html lang> — it is the single source of truth for the lane",
);

/* ── 2 · Every reveal rule must key off that same attribute ───────────────── */

const LANES = [
  { name: ".sg-es (small-group studio)", css: smallGroupUi, cls: "sg-es" },
  { name: ".i18n-es (lesson chrome)", css: designSystem, cls: "i18n-es" },
];

for (const lane of LANES) {
  // The hide rule: the Spanish line is opt-in, never a default.
  assert.match(
    lane.css,
    new RegExp(`\\.${lane.cls}\\s*\\{[^}]*display\\s*:\\s*none`),
    `${lane.name} must default to hidden — Spanish is a support a student chooses`,
  );

  // The reveal rule must be reachable from <html lang="es">. A rule that only
  // names data-lang, a body class, or a data attribute is unreachable, which is
  // exactly the bug this file was written for.
  //
  // Whitespace-normalised, because a real rule wraps its selector list across
  // lines — a line-by-line scan reports "no reveal rule at all" on a stylesheet
  // that has a perfectly good one, which is a false alarm and would get this
  // test deleted rather than read.
  const flat = lane.css.replace(/\s+/g, " ");
  const rules = [...flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(
    ([, selector, body]) =>
      selector.includes(`.${lane.cls}`) && /display\s*:\s*(block|revert|inline)/.test(body),
  );
  assert.ok(rules.length, `${lane.name} has no reveal rule at all`);
  const selectors = rules.map(([, selector]) => selector).join(" ");
  assert.ok(
    /:root\[lang\^?="es"\]|html\[lang\^?="es"\]/.test(selectors),
    `${lane.name} is revealed only by a selector nothing sets. It must match <html lang="es"> — ` +
      "setPreferredLang() stamps the lang attribute, not data-lang or a body class.",
  );
}

/* ── 3 · The two lanes must not disagree ──────────────────────────────────── */
//
// One student, one toggle. If the studio revealed on `lang="es"` exactly and the
// chrome on `lang^="es"`, a browser reporting `es-US` would show half a page in
// Spanish — the worst of both.
for (const lane of LANES) {
  assert.ok(
    lane.css.includes(`html[lang^="es"] .${lane.cls}`),
    `${lane.name} must use the PREFIX match so es, es-US and es-MX all count`,
  );
}

/* ── 4 · The studio's stylesheet is a JS template literal ─────────────────── */
//
// A single backtick anywhere inside it — a comment included — truncates the
// whole stylesheet, the file still parses, and the studio renders unstyled.
// That happened while writing the fix above.
const styleBlock = smallGroupUi.slice(
  smallGroupUi.indexOf("injectSmallGroupStyles"),
  smallGroupUi.indexOf(".sg-es{"),
);
assert.ok(
  styleBlock.length > 100,
  "could not locate the injected stylesheet — update this test rather than deleting it",
);

console.log(
  `es lane reachable: ${LANES.length} bilingual lane(s) hide by default and reveal from <html lang="es">.`,
);
