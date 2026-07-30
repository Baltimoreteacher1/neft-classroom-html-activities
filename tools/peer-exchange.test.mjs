#!/usr/bin/env node
/* ==========================================================================
 * peer-exchange.test.mjs
 *
 * Peer exchange is the one feature in this wave where a mistake reaches another
 * child. Three properties are therefore asserted directly against the server
 * source and the moderation screen, not inferred from the UI:
 *
 *   1. WRITE BEFORE READ is enforced server-side. If it only lived in the
 *      client, the ordering that makes this an exchange rather than a copying
 *      exercise would be one devtools console away.
 *   2. SEAT NUMBERS NEVER LEAVE. In a group of four, "seat 3" names a person.
 *      The peer route must return the text and nothing that identifies who.
 *   3. MODERATION BLOCKS CONTACT DETAILS AND SLURS — AND NOTHING ELSE. The
 *      inverse assertion matters as much as the positive one: a filter that also
 *      suppressed wrong or confused explanations would delete the routine, since
 *      critiquing flawed reasoning IS the learning.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("../functions/api/sg-room/[[path]].js", import.meta.url), "utf8");
const client = readFileSync(new URL("../engine/core/peer-exchange.js", import.meta.url), "utf8");

let checks = 0;

// ── 1. Write-before-read is server-enforced ────────────────────────────────
{
  const start = api.indexOf('if (route === "peer"');
  checks += 1;
  assert.ok(start > 0, "the peer route exists");
  const route = api.slice(start, api.indexOf('if (route === "state"', start));

  checks += 1;
  assert.ok(
    /rows\.some\(\(row\) => Number\(row\.seat\) === seat\)/.test(route),
    "the peer route checks that THIS seat has already written",
  );
  checks += 1;
  assert.ok(/write-first/.test(route), "and refuses with a specific, actionable error");
  checks += 1;
  assert.ok(
    route.indexOf("write-first") < route.indexOf("others"),
    "the refusal happens BEFORE any peer text is selected",
  );
}

// ── 2. No identity crosses the wire ────────────────────────────────────────
{
  const start = api.indexOf('if (route === "peer"');
  const route = api.slice(start, api.indexOf('if (route === "state"', start));
  const returnLine = route.slice(route.lastIndexOf("return json("));

  checks += 1;
  assert.ok(/peer: next\.answer/.test(returnLine), "the peer's text is returned");
  checks += 1;
  assert.equal(
    /seat:\s*(?:next|Number)/.test(returnLine),
    false,
    "the peer's SEAT must never be returned — in a group of four it identifies a person",
  );
  checks += 1;
  assert.equal(/name|student|alias/i.test(returnLine), false, "and no identity of any other kind");
}

// ── 3. Moderation: the screen, extracted and exercised ─────────────────────
//
// screenExplanation is module-private in a Pages Function, so it is lifted out
// of the source and evaluated. That keeps ONE definition of the rules — pinning
// a copy here would let the real screen drift while these tests stayed green.
{
  const start = api.indexOf("function screenExplanation(");
  checks += 1;
  assert.ok(start > 0, "screenExplanation exists");
  const end = api.indexOf("\nasync function ensureSchema", start);
  const source = api.slice(start, end);

  const screenExplanation = new Function(
    "MAX_EXPLANATION",
    "MIN_EXPLANATION",
    `${source}; return screenExplanation;`,
  )(600, 15);

  const blocked = [
    ["too-short", "no"],
    ["too-short", "because yes"],
    ["contact", "It works because you add them. email me at kid@example.com"],
    ["contact", "Multiply them together, text me 410 555 1212"],
    ["contact", "I explained it at https://example.com/my-notes"],
    ["contact", "You divide first — add me on snap for the rest"],
    ["language", "you divide first you idiot, this is shit"],
  ];
  for (const [reason, text] of blocked) {
    checks += 1;
    const r = screenExplanation(text);
    assert.equal(r.ok, false, `must block (${reason}): ${text}`);
    assert.equal(r.reason, reason, `must block for the right reason: ${text}`);
  }

  // The inverse. These are confused, wrong, or blunt — and every one of them
  // must go through, because arguing with them is the point of the routine.
  const allowed = [
    "You add the denominators together because the pieces get bigger.",
    "I think it is 3/16 because you multiply straight across.",
    "I do not really get it but I think you flip the second fraction over.",
    "This is wrong I think but I divided 12 by 4 and got 3.",
    "The answer is bigger because multiplying always makes things bigger.",
  ];
  for (const text of allowed) {
    checks += 1;
    const r = screenExplanation(text);
    assert.equal(r.ok, true, `a wrong or confused explanation must NOT be suppressed: ${text}`);
  }

  // Whitespace is normalised and the cap applied.
  checks += 1;
  assert.equal(
    screenExplanation("It   works\n\nbecause you divide.").text,
    "It works because you divide.",
    "whitespace is normalised",
  );
  checks += 1;
  assert.equal(
    screenExplanation(`because ${"x".repeat(900)}`).text.length,
    600,
    "the length cap is applied",
  );
}

// ── 4. Explanations cannot corrupt the answer-reveal gate ──────────────────
{
  checks += 1;
  assert.ok(
    /const EXPLAIN_PREFIX = "x:"/.test(api),
    "explanations live under their own item-key namespace",
  );
  const start = api.indexOf('if (route === "explain"');
  const route = api.slice(start, api.indexOf('if (route === "peer"', start));
  checks += 1;
  assert.ok(
    (route.match(/EXPLAIN_PREFIX \+ itemKey/g) || []).length >= 2,
    "every write and count in the explain route is namespaced, so a table with three explanations is never mistaken for three committed answers",
  );
}

// ── 5. The critique stays with its author ──────────────────────────────────
{
  checks += 1;
  assert.ok(
    /does not go back to them/.test(client),
    "the student is told plainly that their critique is not sent to the peer",
  );
  // There must be no route that posts a critique anywhere.
  checks += 1;
  assert.equal(
    /room\.(?:explain|commit)\([^)]*critique/i.test(client),
    false,
    "a critique is never transmitted — anonymous written criticism of a child's thinking is a different, riskier feature",
  );
  checks += 1;
  assert.ok(
    /saveResponse\?\.\(phaseId, `pe_critique_/.test(client),
    "the critique is saved to the author's own lesson state",
  );
}

// ── 6. Every server error has student-facing copy ──────────────────────────
{
  const reasons = ["too-short", "contact", "language", "write-first", "no-room", "no-seat"];
  for (const reason of reasons) {
    checks += 1;
    assert.ok(
      new RegExp(`["']?${reason}["']?:`).test(client),
      `"${reason}" needs a sentence a twelve-year-old can act on`,
    );
  }
}

console.log(`peer explanation exchange: ${checks} checks passed.`);
