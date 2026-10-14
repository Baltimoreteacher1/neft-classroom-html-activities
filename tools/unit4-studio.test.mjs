// Unit 4 Practice Studio — the shared layer and the ten pages that use it.
//
// Two things can go wrong here that no render gate sees:
//   1. A Bonus Round tile that disagrees with its trio ("3/8 = 0.35 = 37.5%"). Tiles are generated
//      from numbers, so this test re-parses the GENERATED TEXT and recomputes the mathematics
//      independently of the generator that wrote it.
//   2. A page that quietly stops using the shared layer: init never called, sync() dropped from
//      updateProgressHeader (stars freeze), a token the stylesheet no longer defines (a colour
//      silently falls back to nothing), or a quiz whose last button calls a function the page
//      never defines (this shipped in 4-2 and 4-3 until the redesign).

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const UNIT = join(ROOT, "math/unit-4");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

const pages = readdirSync(UNIT)
  .filter((d) => d.endsWith("practice-studio") || d.endsWith("practice-studio-challenging"))
  .sort();
assert.equal(pages.length, 10, `expected the ten Unit 4 studio pages, found ${pages.length}`);

/* ---- load the shared scripts the way a page does (classic scripts, one global) ---------------- */
const sandbox = {};
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const f of ["assets/u4-studio.js", "assets/u4-studio-bonus.js"]) {
  vm.runInContext(read(f), sandbox, { filename: f });
}
const U = sandbox.U4Studio;
assert.ok(U?.bonus?.buildRound, "U4Studio.bonus.buildRound is exposed");
assert.equal(U.bonus.starsFor(0), 3);
assert.equal(U.bonus.starsFor(2), 2);
assert.equal(U.bonus.starsFor(3), 1);

/* ---- independent verification of every generated trio ------------------------------------------ */
const num = (s) => Number(String(s).replace(/%/g, "").trim());
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} != ${b}`);

const verifiers = {
  fdp([frac, dec, pct]) {
    const [n, d] = frac.text.split("/").map(Number);
    assert.equal(gcd(n, d), 1, `${frac.text} is not in lowest terms`);
    close(n / d, num(dec.text), `${frac.text} vs decimal ${dec.text}`);
    close((n / d) * 100, num(pct.text), `${frac.text} vs percent ${pct.text}`);
  },
  pctMeaning([pct, per100, dec]) {
    const p = num(pct.text);
    assert.equal(per100.text, `${p} out of 100`);
    close(p / 100, num(dec.text), `${pct.text} vs decimal ${dec.text}`);
  },
  partOf([expr, method, value]) {
    const m = expr.text.match(/^([\d.]+)% of ([\d.]+)$/);
    assert.ok(m, `unreadable expression ${expr.text}`);
    const [p, w] = [Number(m[1]), Number(m[2])];
    close((p * w) / 100, num(value.text), `${expr.text} vs part ${value.text}`);
    const div = method.text.match(/^([\d.]+) ÷ ([\d.]+)$/);
    const mul = method.text.match(/^([\d.]+) × ([\d.]+)$/);
    if (div) {
      close(Number(div[1]), w, `${method.text} starts from the whole`);
      close(100 / p, Number(div[2]), `${method.text} divides by 100/p`);
    } else {
      assert.ok(mul, `unreadable method ${method.text}`);
      close(Number(mul[1]), p / 100, `${method.text} multiplies by the decimal`);
      close(Number(mul[2]), w, `${method.text} multiplies the whole`);
    }
  },
  wholeOf([question, method, whole]) {
    const m = question.text.match(/^([\d.]+) is ([\d.]+)% of \?$/);
    assert.ok(m, `unreadable question ${question.text}`);
    const [part, p] = [Number(m[1]), Number(m[2])];
    close((num(whole.text) * p) / 100, part, `${question.text} vs whole ${whole.text}`);
    const d = method.text.match(/^([\d.]+) ÷ ([\d.]+)$/);
    assert.ok(d, `unreadable method ${method.text}`);
    close(Number(d[1]), part, `${method.text} starts from the part`);
    close(Number(d[2]), p / 100, `${method.text} divides by the decimal`);
  },
};

/** Pull the JSON object that follows `key:` out of a page's U4Studio.init call. */
function initObject(html, key) {
  const init = html.indexOf("U4Studio.init(");
  assert.ok(init > -1, "page calls U4Studio.init");
  const at = html.indexOf(`${key}:`, init) + key.length + 1;
  let i = html.indexOf("{", at);
  const start = i;
  for (let depth = 0; i < html.length; i++) {
    if (html[i] === "{") depth++;
    if (html[i] === "}" && --depth === 0) break;
  }
  return JSON.parse(html.slice(start, i + 1));
}

/* ---- the shared stylesheet owns every token the pages use -------------------------------------- */
const sharedCss = [read("assets/u4-studio.css"), read("assets/u4-studio-percent.css")].join("\n");
const defined = new Set([...sharedCss.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

let trios = 0;
for (const name of pages) {
  const html = read(`math/unit-4/${name}/index.html`);
  const tag = `[${name}]`;

  // wiring
  const order = [
    html.indexOf('href="/assets/u4-studio.css"'),
    html.indexOf('src="/assets/u4-studio.js"'),
    html.indexOf('src="/assets/u4-studio-bonus.js"'),
    html.indexOf("U4Studio.init("),
  ];
  assert.ok(
    order.every((x) => x > -1),
    `${tag} links the shared stylesheet and both scripts and calls init`,
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
    `${tag} loads the shared files before its own script runs`,
  );
  assert.equal(html.split("U4Studio.init(").length, 2, `${tag} calls init exactly once`);

  const header = html.match(/id="header-progress-count">0 \/ (\d+)</);
  assert.ok(header, `${tag} shows a progress total`);
  const totals = initObject(html, "totals");
  const need = initObject(html, "need");
  assert.equal(
    Object.values(totals).reduce((a, b) => a + b, 0),
    Number(header[1]),
    `${tag} init totals add up to the header total`,
  );
  for (const k of Object.keys(totals))
    assert.ok(need[k] <= totals[k], `${tag} section ${k} need <= total`);

  const fn = html.match(/function updateProgressHeader\(\)\s*\{/);
  assert.ok(fn, `${tag} has updateProgressHeader`);
  let depth = 0;
  let end = fn.index + fn[0].length - 1;
  for (; end < html.length; end++) {
    if (html[end] === "{") depth++;
    if (html[end] === "}" && --depth === 0) break;
  }
  assert.match(
    html.slice(fn.index, end),
    /U4Studio\.sync\(\)/,
    `${tag} syncs stars from updateProgressHeader`,
  );
  assert.ok(
    /state\.play = /.test(html) || /Object\.assign\(state, JSON\.parse/.test(html),
    `${tag} restores state.play on load`,
  );

  // one source of truth
  assert.ok(!/<style[^>]*>[^]*?:root\s*\{/.test(html), `${tag} keeps no private :root token block`);
  for (const legacy of [
    "var(--navy",
    "var(--teal",
    "var(--amber",
    "var(--green",
    "var(--red",
    "btn-teal",
    "btn-amber",
    "var(--font-mono)",
  ]) {
    assert.ok(!html.includes(legacy), `${tag} still uses retired ${legacy}`);
  }
  const used = new Set([...html.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
  const pageDefined = new Set([...html.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  for (const t of used)
    assert.ok(defined.has(t) || pageDefined.has(t), `${tag} uses ${t}, which nothing defines`);

  // a call with no definition throws at the moment a student finishes the quiz
  for (const f of ["renderResults"]) {
    if (html.includes(`${f}(`))
      assert.ok(html.includes(`function ${f}`), `${tag} calls ${f} but never defines it`);
  }

  // Bonus Round
  const bonus = initObject(html, "bonus");
  assert.ok(verifiers[bonus.gen], `${tag} bonus generator ${bonus.gen} has a verifier`);
  assert.equal(bonus.rounds.length, 4, `${tag} has four rounds`);
  bonus.rounds.forEach((specs, r) => {
    assert.equal(specs.length, 3, `${tag} round ${r + 1} has three trios`);
    const tiles = U.bonus.buildRound(bonus.gen, specs);
    assert.equal(tiles.length, 9, `${tag} round ${r + 1} has nine tiles`);
    const texts = tiles.map((t) => t.text);
    assert.equal(
      new Set(texts).size,
      9,
      `${tag} round ${r + 1} repeats a tile: ${texts.join(" | ")}`,
    );
    for (let g = 0; g < 3; g++) {
      verifiers[bonus.gen](tiles.filter((t) => t.group === g));
      trios++;
    }
  });
}

console.log(
  `unit4-studio: ${pages.length} pages wired, ${trios} Bonus Round trios re-verified from their own text`,
);
