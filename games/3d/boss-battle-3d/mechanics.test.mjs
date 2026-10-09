// Boss Battle 3D construction rounds: every generator's own answer must pass its
// checker, misses must be directional, and no hint or miss message may state
// the answer (scaffold-not-giveaway). Run: node games/3d/boss-battle-3d/mechanics.test.mjs
import assert from "node:assert/strict";
import { GENERATORS, makeRound } from "./generators.js";
import { checkBuild, makeRng, missMessage, parseAnswer, sameNum } from "./mechanics.js";
import { UNITS } from "./problems.js";

// parseAnswer
assert.equal(parseAnswer("7"), 7);
assert.equal(parseAnswer("-3"), -3);
assert.equal(parseAnswer("2.5"), 2.5);
assert.equal(parseAnswer("3/2"), 1.5);
assert.equal(parseAnswer("1 1/2"), 1.5);
assert.equal(parseAnswer("−4"), -4);
assert.ok(Number.isNaN(parseAnswer("")));
assert.ok(Number.isNaN(parseAnswer("abc")));
assert.ok(Number.isNaN(parseAnswer("3/0")));

// Every unit in UNITS has generators.
for (const { u } of UNITS) assert.ok(GENERATORS[u]?.length, `unit ${u} has generators`);

function fmtTokens(n) {
  const t = new Set();
  const dec = String(n);
  if (!/\.\d{5,}/.test(dec)) t.add(dec);
  if (!Number.isInteger(n)) {
    for (let d = 2; d <= 64; d++) {
      const num = n * d;
      if (Math.abs(num - Math.round(num)) < 1e-9) {
        t.add(`${Math.round(num)}/${d}`);
        break;
      }
    }
  }
  return [...t];
}
function mentions(text, token) {
  const esc = token.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`(?<![\\d./-])${esc}(?!\\d|[./]\\d|%)`).test(text);
}

let rounds = 0;
for (const { u } of UNITS) {
  const gens = GENERATORS[u];
  for (let seed = 1; seed <= 400; seed++) {
    const rng = makeRng(seed * 7919 + u);
    const r = makeRound(u, rng, seed % gens.length);
    rounds++;
    const where = `unit ${u} ${r.skill} seed ${seed}`;
    assert.ok(["beam", "pulses", "aim"].includes(r.mechanic), where);
    assert.ok(r.en && r.es && r.en !== r.es, `${where}: bilingual prompt`);
    assert.equal(r.hints.length, 2, where);
    for (const f of r.fields) {
      assert.ok(Number.isFinite(f.answer), `${where}: finite answer`);
      assert.ok(f.labelEn && f.labelEs, `${where}: labels`);
      if (r.mechanic === "aim") {
        assert.ok(f.axis === "x" || f.axis === "y", where);
        assert.ok(Math.abs(f.answer) <= 10, `${where}: aim fits the -10..10 grid`);
      }
    }
    // own answer passes
    const answers = r.fields.map((f) => f.answer);
    assert.ok(checkBuild(r, answers).ok, `${where}: answer passes`);
    // answer typed as text passes too (fraction / decimal forms)
    for (const f of r.fields) {
      for (const tok of fmtTokens(f.answer)) assert.ok(sameNum(parseAnswer(tok), f.answer), `${where}: parses ${tok}`);
    }
    // directional misses, no answer leak
    for (const delta of [-1, 1]) {
      const vals = answers.map((a, i) => (i === 0 ? a + delta : a));
      const res = checkBuild(r, vals);
      assert.equal(res.ok, false, where);
      assert.equal(res.dirs[0], delta < 0 ? "low" : "high", `${where}: direction`);
      const msg = missMessage(r, res);
      assert.ok(msg.en && msg.es, `${where}: bilingual miss`);
      for (const f of r.fields) for (const tok of fmtTokens(f.answer)) assert.ok(!mentions(msg.en, tok) || mentions(r.en, tok), `${where}: miss leaks ${tok}`);
    }
    // hints never state the answer unless that number is already a given
    for (const h of r.hints) {
      assert.ok(h.en && h.es, `${where}: bilingual hint`);
      for (const f of r.fields)
        for (const tok of fmtTokens(f.answer)) {
          const given = mentions(r.en, tok);
          assert.ok(given || (!mentions(h.en, tok) && !mentions(h.es, tok)), `${where}: hint states answer ${tok}: ${h.en}`);
        }
    }
  }
}
assert.ok(rounds >= 4000);
console.log(`boss-battle-3d mechanics: ${rounds} rounds OK`);
