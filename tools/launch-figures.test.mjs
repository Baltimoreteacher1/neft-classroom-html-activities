/**
 * launch-figures.test.mjs — a launch figure may only state what its lesson states.
 *
 * 73 of 84 opening problems are text-only. The temptation is to fill all 73,
 * and that is the one thing this must not do: validate:learn-figures already
 * records why — a picture that disagrees with the paragraph is worse than no
 * picture, because a student trusts the picture. So the property under test is
 * not coverage. It is that every number a generated figure prints appears in
 * the narrative it was drawn from, and that a narrative stating no usable
 * quantity produces NOTHING.
 *
 * Negative controls run first: a reader that has stopped firing, or a value
 * guard that has stopped guarding, would otherwise report a clean fleet.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  narrativeOf,
  readLaunch,
  standaloneSvg,
  valuesAreInText,
} from "../scripts/generate-launch-figures.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const lessons = readdirSync(join(ROOT, "lessons")).filter((d) => /^\d+-\d+$/.test(d));

test("the sweep sees the fleet — a zero sweep verifies nothing", () => {
  assert.ok(lessons.length >= 80, `found ${lessons.length} lessons; the sweep is broken`);
});

test("a figure never prints a number its narrative does not state", () => {
  const wrong = [];
  for (const id of lessons) {
    const p = join(ROOT, "lessons", id, "config.json");
    if (!existsSync(p)) continue;
    const config = JSON.parse(readFileSync(p, "utf8"));
    const text = narrativeOf(config);
    const fig = readLaunch(text);
    if (!fig) continue;
    for (const v of fig.values) {
      if (!valuesAreInText([v], text)) wrong.push(`${id}: figure states ${v}, narrative does not`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join("\n  "));
});

test("every committed launch SVG is a standalone document a browser will render", () => {
  const bad = [];
  for (const id of lessons) {
    const f = join(ROOT, "lessons", id, "reveal-assets", "launch-problem.svg");
    if (!existsSync(f)) continue;
    const src = readFileSync(f, "utf8");
    if (!/^<\?xml/.test(src)) bad.push(`${id}: no XML declaration`);
    if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(src)) bad.push(`${id}: no SVG namespace`);
    if (/<div/.test(src)) bad.push(`${id}: still wrapped in HTML — not a standalone SVG`);
    if (!/<\/svg>/.test(src)) bad.push(`${id}: truncated`);
  }
  assert.deepEqual(bad, [], bad.join("\n  "));
});

test("every lesson claiming a generated figure has the file and real alt text", () => {
  const bad = [];
  for (const id of lessons) {
    const p = join(ROOT, "lessons", id, "config.json");
    if (!existsSync(p)) continue;
    const fig = JSON.parse(readFileSync(p, "utf8")).launch?.figure;
    if (!fig || !fig.url || !fig.url.endsWith(".svg")) continue;
    const disk = join(ROOT, fig.url.replace(/^\//, ""));
    if (!existsSync(disk)) bad.push(`${id}: config points at ${fig.url}, which is not on disk`);
    if (!fig.alt || fig.alt.length < 40)
      bad.push(`${id}: alt text is missing or too thin to read aloud`);
  }
  assert.deepEqual(bad, [], bad.join("\n  "));
});

/* ── negative controls ─────────────────────────────────────────────────── */

test("a narrative stating no quantity draws nothing", () => {
  assert.equal(
    readLaunch("Math is everywhere in our community and we are all doers of math."),
    null,
  );
});

test("the value guard rejects a number the narrative never states", () => {
  assert.equal(valuesAreInText([42], "the box holds 21 pieces"), false);
  assert.equal(valuesAreInText([21], "the box holds 21 pieces"), true);
});

test("readers still fire on the shapes they were written for", () => {
  const eq = readLaunch("She writes the equation 3x = 21 to find how many are in each box.");
  assert.equal(eq?.kind, "balance-scale");
  const ineq = readLaunch("The detective writes the inequality a ≥ 18, where a is the age.");
  assert.equal(ineq?.kind, "inequality-number-line");
  const signed = readLaunch("Badwater Basin: 86 meters below sea level, where sea level is 0.");
  assert.equal(signed?.kind, "vertical-number-line");
});

test("standaloneSvg unwraps the builder's HTML and adds the namespace", () => {
  const out = standaloneSvg('<div class="ws-figure-wrap"><svg width="10" height="10"></svg></div>');
  assert.match(out, /^<\?xml/);
  assert.match(out, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.ok(!out.includes("<div"), "the wrapper must be gone");
  assert.equal(standaloneSvg("<div>no svg here</div>"), null);
});
