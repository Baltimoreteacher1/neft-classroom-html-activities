// Number Builder math suite: every skill x level x grade x 40 seeds is solved, checked and attacked against an
// INDEPENDENT oracle written in this file (scaled-integer arithmetic and brute-force search; it never calls the game's
// generator, solver or checker to produce an expected value). @fm2 FM-007 FM-017 FM-019 FM-020 FM-032 FM-033
// @fm2 FM-050 FM-051 FM-052 FM-054 FM-055 FM-059 FM-060 FM-061 FM-062 FM-063 FM-065
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { validateGame } from "../../math/fluency-lab/family/fm2/contract.js";
import game from "../../math/fluency-lab/family/fm2/games/number-builder/index.js";
import { pieceSolutions } from "../../math/fluency-lab/family/fm2/games/number-builder/logic.js";
import {
  intWords,
  wordsFor,
} from "../../math/fluency-lab/family/fm2/games/number-builder/words.js";
import { makeRng, seedFrom } from "../../math/fluency-lab/family/fm2/rng.js";
import {
  bigTarget,
  CATALOGUED,
  chartOracle,
  commas,
  fingerprint,
  hintMath,
  KIT_VALUES,
  LIMIT,
  oracleBuildOk,
  oracleSci,
  oracleSolutions,
  parseDecimalWords,
  parseEn,
  parseEs,
  permutations,
  places,
  proxy,
  SKILL_LIMIT,
  scaled,
  sciOracle,
  sciScaled,
} from "./number-builder.oracle.mjs";

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const same = (a, b, m) => {
  assert.deepEqual(a, b, m);
  checks += 1;
};

// ---------- structure ----------
same(validateGame(game), [], "game honors the contract");
ok(
  game.mechanic === "compose-to-target" && game.order === 1 && game.id === "number-builder",
  "identity and mechanic tag",
);
ok(game.skills.length >= 14, `at least 14 skills (${game.skills.length})`);
for (let g = 0; g <= 8; g += 1)
  ok(
    game.skills.filter((s) => s.grades[0] <= g && g <= s.grades[1]).length >= 2,
    `grade ${g} has two or more skills`,
  );
for (const s of game.skills)
  ok(
    /^[K0-8]\.[A-Z]{2,3}\.[A-Z]\.\d+[a-z]?$/.test(s.standard) ||
      /^[0-8]\.[A-Z]+\.[A-Z]\.\d+[a-z]?$/.test(s.standard),
    `standard code shape ${s.standard}`,
  );

// ---------- source rules: no timers, no external scripts, no other languages ----------
const folder = new URL("../../math/fluency-lab/family/fm2/games/number-builder/", import.meta.url);
for (const name of readdirSync(folder)) {
  const text = readFileSync(new URL(name, folder), "utf8");
  ok(
    !/setInterval|setTimeout|requestAnimationFrame|countdown|performance\.now/i.test(text),
    `${name}: no timers`,
  );
  ok(!/https?:\/\/(?!www\.w3\.org)/.test(text), `${name}: no external resources`);
  ok(text.split("\n").length <= 500, `${name}: at most 500 lines`);
}

// ---------- number words, parsed back by the oracle's independent inverse tables ----------
for (const n of [
  ...Array(1200).keys(),
  1999,
  2000,
  2001,
  2021,
  5100,
  10000,
  21000,
  31001,
  99999,
  100000,
  100001,
  101000,
  121121,
  500000,
  999999,
]) {
  same(parseEn(intWords(n, "en")), n, `English words for ${n}`);
  same(parseEs(intWords(n, "es")), n, `Spanish words for ${n}`);
}
for (const text of [
  "0.1",
  "0.01",
  "0.001",
  "2.35",
  "34.5",
  "0.35",
  "-2.5",
  "-0.75",
  "7.001",
  "12.021",
  "0.2",
  "100.201",
  "0.321",
  "-3.04",
]) {
  for (const lang of ["en", "es"])
    same(
      Number(parseDecimalWords(wordsFor(text, lang), lang)),
      Number(text),
      `${lang} words for ${text}`,
    );
}

const LEVELS = [1, 2, 3];
const SEEDS = 40;
const proxies = {};
const prints = {};
let rounds = 0;
let wrongSeen = 0;
const mistakesSeen = new Set();

function expectWrong(round, response, label) {
  const verdict = game.check(round, response);
  ok(verdict.correct === false, `${label}: oracle says wrong`);
  ok(
    typeof verdict.mistake === "string" && verdict.mistake.length > 2,
    `${label}: names the mistake`,
  );
  ok(
    verdict.feedback.en.length > 20 &&
      verdict.feedback.es.length > 20 &&
      verdict.feedback.en !== verdict.feedback.es,
    `${label}: bilingual feedback`,
  );
  mistakesSeen.add(verdict.mistake);
  wrongSeen += 1;
  return verdict;
}

for (const skill of game.skills) {
  const [lo, hi] = skill.grades;
  for (const level of LEVELS) {
    for (let grade = lo; grade <= hi; grade += 1) {
      const [maxValue, maxPlaces] = SKILL_LIMIT[skill.id] ?? LIMIT[grade];
      for (let s = 1; s <= SEEDS; s += 1) {
        const seed = seedFrom("nb-test", skill.id, level, grade, s);
        const round = game.makeRound(skill.id, level, makeRng(seed), grade);
        rounds += 1;
        const label = `${skill.id} L${level} g${grade} #${s}`;
        // FM-065: serializable, reproducible
        same(JSON.parse(JSON.stringify(round)), round, `${label}: JSON round trip`);
        same(
          game.makeRound(skill.id, level, makeRng(seed), grade),
          round,
          `${label}: same seed, same round`,
        );
        ok(
          round.skill === skill.id && round.level === level && round.grade === grade,
          `${label}: round carries its identity`,
        );
        // prompt: both languages, ES differs from EN
        ok(
          round.prompt.en.length > 15 &&
            round.prompt.es.length > 15 &&
            round.prompt.en !== round.prompt.es,
          `${label}: prompt in both languages`,
        );
        // FM-051 / FM-055: ranges
        const absTarget = Math.abs(Number(round.target));
        if (round.mode !== "chart")
          ok(
            absTarget <= maxValue && places(round.target) <= maxPlaces,
            `${label}: target ${round.target} within grade limits`,
          );
        if (grade < 6 || skill.id === "g7-exponent-discs")
          ok(
            Number(round.target) >= 0 &&
              (round.pieces || []).every((p) => !p.value.startsWith("-")),
            `${label}: no negatives below grade 6`,
          );
        if (round.mode === "chart")
          ok(
            round.tiles.length === level + 3 &&
              round.tiles.every((d) => Number.isInteger(d) && d >= 0 && d <= 9),
            `${label}: tiles are digits`,
          );
        // FM-059: pieces carry the values their pictures claim
        for (const p of round.pieces || []) {
          if (p.kind === "chip")
            ok(/^-?\d+(\.\d+)?$/.test(p.value) && Number(p.value) !== 0, `${label}: chip value`);
          else if (p.kind === "expdisc")
            ok(
              scaled(p.value, 3) === Math.round(10 ** p.exp * 1000) || p.exp < -3,
              `${label}: 10^${p.exp} disc value ${p.value}`,
            );
          else
            ok(
              KIT_VALUES[round.kit][p.kind]?.includes(p.value),
              `${label}: ${p.kind} is worth ${p.value} in ${round.kit}`,
            );
        }
        // prompt content matches the numbers (independent decoding)
        const form = round.form?.type;
        if (round.mode === "pieces" && form === "numeral")
          ok(
            round.prompt.en.includes(
              commas(round.target.replace("-", "")).replace(
                /^/,
                round.target.startsWith("-") ? "−" : "",
              ),
            ) || round.target === "0",
            `${label}: prompt shows the target`,
          );
        if (form === "words") {
          same(
            parseEn(round.prompt.en.match(/number ([a-z -]+)\./)[1]),
            Number(round.target),
            `${label}: English words`,
          );
          same(
            parseEs(round.prompt.es.match(/número ([a-záéíóúñ -]+)\./)[1]),
            Number(round.target),
            `${label}: Spanish words`,
          );
        }
        if (form === "expanded")
          same(
            round.form.terms.reduce((a, b) => a + Number(b), 0),
            Number(round.target),
            `${label}: expanded form sums to the target`,
          );
        if (form === "unit")
          same(
            round.form.terms.reduce((a, t2) => a + t2.n * t2.p, 0),
            Number(round.target),
            `${label}: unit form sums to the target`,
          );
        if (round.expr)
          ok(
            bigTarget(round.target) ===
              sciScaled(
                [0, 0, 0, 0, 0].map((_, i) =>
                  Number(String(Math.round(Number(round.expr.c) * 100)).padStart(5, "0")[i]),
                ),
                round.expr.e,
              ),
            `${label}: the expression equals the target`,
          );

        const sol = game.solve(round);
        const verdictOfSolve = game.check(round, sol);
        ok(verdictOfSolve.correct === true, `${label}: solve() is accepted`);
        ok(
          verdictOfSolve.feedback.en.length > 3 &&
            verdictOfSolve.feedback.es.length > 3 &&
            verdictOfSolve.feedback.en !== verdictOfSolve.feedback.es,
          `${label}: success feedback in both languages`,
        );
        ok(
          Array.isArray(sol.builds) && sol.builds.length === round.ways,
          `${label}: solve returns ${round.ways} build(s)`,
        );
        const answer = game.answerText(round);
        ok(
          typeof answer === "string" && answer.length > 2 && answer.length < 200,
          `${label}: answerText is short text`,
        );

        // oracle: solvability, validity of the game's own solution, acceptance of every correct build
        const wrongResponses = [];
        let cheapest = 0;
        const rng = makeRng(seed ^ 0x5bd1e995);
        if (round.mode === "pieces") {
          const found = oracleSolutions(round, 3000);
          const effort = found
            .map((b) => Object.values(b).reduce((x, y) => x + y, 0))
            .sort((x, y) => x - y);
          cheapest = effort.slice(0, round.ways).reduce((x, y) => x + y, 0);
          ok(found.length >= round.ways, `${label}: oracle finds ${round.ways} distinct build(s)`);
          for (const b of sol.builds)
            ok(oracleBuildOk(round, b.counts), `${label}: solve() is a correct build`);
          if (round.ways === 2)
            ok(
              JSON.stringify(sol.builds[0].counts) !== JSON.stringify(sol.builds[1].counts),
              `${label}: two different builds`,
            );
          // every oracle-correct build is accepted (ways 2: with the first as partner)
          for (const b of found.slice(0, 4)) {
            if (round.ways === 1)
              ok(
                game.check(round, { builds: [{ counts: b }] }).correct,
                `${label}: correct build accepted`,
              );
            else {
              const partner = found.find((o) => JSON.stringify(o) !== JSON.stringify(b));
              ok(
                game.check(round, { builds: [{ counts: b }, { counts: partner }] }).correct,
                `${label}: correct pair accepted`,
              );
            }
          }
          if (s <= 4)
            same(
              oracleSolutions(round).length,
              pieceSolutions(round, 1e9).length,
              `${label}: the game's search misses nothing`,
            );
          // mutations of the solution and random builds: the game must agree with the oracle both ways
          const base = sol.builds[0].counts;
          const candidates = [];
          for (const p of round.pieces) {
            for (const d of [1, -1, 2]) candidates.push({ ...base, [p.id]: base[p.id] + d });
            for (const q of round.pieces)
              if (q !== p)
                candidates.push({ ...base, [p.id]: base[p.id] + 1, [q.id]: base[q.id] - 1 });
          }
          for (let k = 0; k < 8; k += 1)
            candidates.push(
              Object.fromEntries(
                round.pieces.map((p) => [
                  p.id,
                  Math.floor(rng() * Math.min(p.max, 5) + 1) - (rng() < 0.4 ? 1 : 0),
                ]),
              ),
            );
          for (const counts of candidates) {
            if (round.pieces.some((p) => counts[p.id] < 0 || counts[p.id] > p.max)) {
              ok(
                game.check(round, { builds: [{ counts }] }).correct === false,
                `${label}: out-of-range counts are refused`,
              );
              continue;
            }
            const response =
              round.ways === 1
                ? { builds: [{ counts }] }
                : { builds: [{ counts }, { counts: sol.builds[1].counts }] };
            const expected =
              round.ways === 1
                ? oracleBuildOk(round, counts)
                : oracleBuildOk(round, counts) &&
                  JSON.stringify(counts) !== JSON.stringify(sol.builds[1].counts);
            const verdict = game.check(round, response);
            same(
              verdict.correct,
              expected,
              `${label}: game and oracle agree on ${JSON.stringify(counts)}`,
            );
            if (!expected) wrongResponses.push(response);
          }
          if (round.ways === 2) {
            wrongResponses.push(
              { builds: [sol.builds[0], sol.builds[0]] },
              { builds: [sol.builds[0]] },
            );
            ok(
              game.check(round, { builds: [sol.builds[0], sol.builds[0]] }).mistake === "sameBuild",
              `${label}: identical builds are named`,
            );
            ok(
              game.check(round, { builds: [sol.builds[0]] }).mistake === "needTwo",
              `${label}: one build is not enough`,
            );
          }
        } else if (round.mode === "chart") {
          const arrangements = permutations(round.tiles);
          let accepted = 0;
          for (const perm of arrangements) {
            const expected = chartOracle(round, perm);
            const verdict = game.check(round, { builds: [{ slots: perm }] });
            same(verdict.correct, expected, `${label}: chart verdict for ${perm.join("")}`);
            if (expected) accepted += 1;
            else wrongResponses.push({ builds: [{ slots: perm }] });
          }
          ok(accepted >= 1, `${label}: some arrangement is right`);
          ok(chartOracle(round, sol.builds[0].slots), `${label}: solve() is a right arrangement`);
          wrongResponses.push({ builds: [{ slots: round.tiles.map(() => null) }] });
        } else {
          const found = oracleSci(round);
          ok(found.length >= round.ways, `${label}: oracle finds ${round.ways} form(s)`);
          for (const b of sol.builds)
            ok(sciOracle(round, b), `${label}: solve() is a correct form`);
          if (round.ways === 2)
            ok(sol.builds[0].exp !== sol.builds[1].exp, `${label}: two different exponents`);
          for (const b of found.slice(0, 4)) {
            const partner = found.find((o) => o.exp !== b.exp);
            ok(
              game.check(round, { builds: round.ways === 1 ? [b] : [b, partner] }).correct,
              `${label}: correct form accepted`,
            );
          }
          const base = sol.builds[0];
          const tries = [];
          for (let i = 0; i < 5; i += 1)
            for (const d of [1, -1])
              tries.push({
                digits: base.digits.map((x, k) => (k === i ? x + d : x)),
                exp: base.exp,
              });
          for (const d of [1, -1, 2, -2]) tries.push({ digits: base.digits, exp: base.exp + d });
          tries.push({ digits: base.digits, exp: -base.exp }, { digits: [0, 0, 0, 0, 0], exp: 0 });
          for (const b of tries) {
            if (b.digits.some((x) => x < 0 || x > 9) || b.exp < -9 || b.exp > 9) continue;
            const response = { builds: round.ways === 1 ? [b] : [b, sol.builds[1]] };
            const expected =
              round.ways === 1
                ? sciOracle(round, b)
                : sciOracle(round, b) && b.exp !== sol.builds[1].exp;
            same(
              game.check(round, response).correct,
              expected,
              `${label}: game and oracle agree on ${JSON.stringify(b)}`,
            );
            if (!expected) wrongResponses.push(response);
          }
        }
        // wrong answers: specific feedback that does not print the worked solution
        for (const response of wrongResponses.slice(0, 12)) {
          const v = expectWrong(round, response, label);
          for (const lang of ["en", "es"])
            ok(!v.feedback[lang].includes(answer), `${label}: feedback does not print the answer`);
        }
        // malformed responses are refused, never thrown
        for (const junk of [
          null,
          undefined,
          {},
          { builds: [] },
          { builds: [{}] },
          { builds: "x" },
          { builds: [{ counts: "x" }] },
          7,
        ])
          ok(game.check(round, junk).correct === false, `${label}: junk response refused`);

        // hints: tiers 0-2 never give the answer; tier 3 does; each tier differs; both languages
        const tiers = [0, 1, 2, 3].map((tier) => game.hint(round, tier, null));
        tiers.forEach((h, tier) => {
          ok(
            h.en.length > 20 && h.es.length > 20 && h.en !== h.es,
            `${label}: hint ${tier} in both languages`,
          );
          if (tier < 3)
            for (const lang of ["en", "es"])
              ok(
                !h[lang].includes(answer),
                `${label}: hint ${tier} (${lang}) does not state the answer`,
              );
          else
            for (const lang of ["en", "es"])
              ok(h[lang].includes(answer), `${label}: tier 3 (${lang}) states the full solution`);
        });
        ok(new Set(tiers.slice(0, 3).map((h) => h.en)).size === 3, `${label}: hint tiers differ`);
        hintMath(round, tiers[2].en, label);

        if (s === 1 || s === 2) (prints[`${skill.id}:${level}`] ||= []).push(round);
        (proxies[`${skill.id}:${level}`] ||= []).push(proxy(round, cheapest));
      }
      // FM-061: variety across 100 seeds at each level
      const prints100 = new Set();
      const designs100 = new Set();
      for (let s = 1; s <= 100; s += 1) {
        const r = game.makeRound(
          skill.id,
          level,
          makeRng(seedFrom("variety", skill.id, level, grade, s)),
          grade,
        );
        prints100.add(fingerprint(r));
        designs100.add(fingerprint({ ...r, start: undefined }));
      }
      ok(
        prints100.size >= 30,
        `${skill.id} L${level} g${grade}: ${prints100.size} distinct rounds in 100 seeds`,
      );
      ok(
        designs100.size >= 15,
        `${skill.id} L${level} g${grade}: ${designs100.size} distinct puzzles even without the starting mat`,
      );
    }
  }
  // FM-019: level 3 demands more than level 1, level 2 at least as much
  const mean = (lv) =>
    proxies[`${skill.id}:${lv}`].reduce((a, b) => a + b, 0) / proxies[`${skill.id}:${lv}`].length;
  ok(
    mean(3) > mean(1) && mean(2) >= mean(1) - 0.25,
    `${skill.id}: difficulty rises (${mean(1).toFixed(2)} / ${mean(2).toFixed(2)} / ${mean(3).toFixed(2)})`,
  );
}

for (const key of mistakesSeen)
  ok(CATALOGUED.includes(key), `mistake ${key} met in the property run is catalogued`);

// ---------- the grade argument tunes a spanning skill ----------
{
  const exps = (grade) =>
    new Set(
      Array.from({ length: 40 }, (_, s) =>
        game.makeRound("g7-exponent-discs", 2, makeRng(s + 1), grade),
      ).flatMap((r) => r.pieces.map((p) => p.exp)),
    );
  ok(
    [...exps(6)].every((e) => e >= 0) && [...exps(7)].some((e) => e < 0),
    "grade 6 uses whole powers of ten, grade 7 adds negative exponents",
  );
}
assert.throws(() => game.makeRound("nope", 1, makeRng(1), 3), RangeError);
checks += 1;

console.log(
  `number-builder math: ${checks} checks passed over ${rounds} rounds (${wrongSeen} wrong responses attacked, ${game.skills.length} skills).`,
);
