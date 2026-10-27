// Number Line Quest math suite. Every answer is re-derived here by an INDEPENDENT oracle: the English prompt is parsed back
// into exact BigInt rationals (roots decided by integer powers), then EVERY marker position on the line is compared with
// the game's check(). Nothing here calls the game's generator or checker to produce an expected value.
// @fm2 FM-012 FM-017 FM-019 FM-020 FM-032 FM-033 FM-050 FM-051 FM-052 FM-053 FM-054 FM-055 FM-059 FM-060
// @fm2 FM-061 FM-062 FM-063 FM-065
import assert from "node:assert/strict";
import { numberLineSvg, PAD } from "../../math/fluency-lab/family/fm2/art/lines.js";
import { validateGame } from "../../math/fluency-lab/family/fm2/contract.js";
import { SAFE } from "../../math/fluency-lab/family/fm2/games/number-line-quest/copy-hints.js";
import game from "../../math/fluency-lab/family/fm2/games/number-line-quest/index.js";
import { baseConfig } from "../../math/fluency-lab/family/fm2/games/number-line-quest/ui-kit.js";
import { missingLanguages } from "../../math/fluency-lab/family/fm2/lang.js";
import { makeRng } from "../../math/fluency-lab/family/fm2/rng.js";

let checks = 0;
let ctx = "";
const ok = (c, m) => {
  assert.ok(c, `${ctx}: ${m}`);
  checks += 1;
};

const babs = (a) => (a < 0n ? -a : a);
const bgcd = (a, b) => (b ? bgcd(b, a % b) : babs(a) || 1n);
const Q = (n, d = 1n) => {
  const [a, b] = BigInt(d) < 0n ? [-BigInt(n), -BigInt(d)] : [BigInt(n), BigInt(d)];
  const g = bgcd(a, b);
  return { n: a / g, d: b / g };
};
const add = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => Q(a.n * b.n, a.d * b.d);
const div = (a, b) => Q(a.n * b.d, a.d * b.n);
const cmp = (a, b) => (a.n * b.d > b.n * a.d ? 1 : a.n * b.d < b.n * a.d ? -1 : 0);
const abs = (a) => Q(babs(a.n), a.d);
const neg = (a) => Q(-a.n, a.d);
const eq = (a, b) => cmp(a, b) === 0;
const G = (f) => Q(f.n, f.d);
const T = (q) => ({ n: Number(q.n), d: Number(q.d) });
const num = (q) => Number(q.n) / Number(q.d);
const pow10 = (e) => (e >= 0 ? Q(10n ** BigInt(e)) : Q(1n, 10n ** BigInt(-e)));
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹⁻";

// Learner-facing number text -> exact value, or { root: { index, radicand } } for a radical.
function parseNum(text) {
  const t = text.trim().replaceAll(" ", "").replaceAll("−", "-");
  let m = /^(√|∛)(\d+)$/.exec(t);
  if (m) return { root: { index: m[1] === "√" ? 2 : 3, radicand: BigInt(m[2]) } };
  m = /^(-?[\d.]+) ?× ?10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)$/.exec(t);
  const exp = (e) => Number([...e].map((c) => (c === "⁻" ? "-" : SUP.indexOf(c))).join(""));
  if (m) return mul(parseNum(m[1]), pow10(exp(m[2])));
  m = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(t);
  if (m) return mul(Q(m[1] ? -1 : 1), add(Q(m[2]), Q(m[3], m[4])));
  m = /^(-?\d+)\/(\d+)$/.exec(t);
  if (m) return Q(m[1], m[2]);
  m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(t);
  if (m) return mul(Q(m[1] ? -1 : 1), Q(m[2] + (m[3] || ""), 10n ** BigInt((m[3] || "").length)));
  throw new Error(`cannot parse number: ${text}`);
}
const V = (text) => parseNum(text);

// |x - target| <= tol, for a rational target or a root (decided by comparing integer powers).
function accepts(target, tol, x) {
  if (!target.root) return cmp(abs(sub(x, target)), tol) <= 0;
  const { index, radicand } = target.root;
  const [lo, hi] = [sub(x, tol), add(x, tol)];
  const p = BigInt(index);
  const aboveLow = lo.n <= 0n || lo.n ** p <= radicand * lo.d ** p;
  return aboveLow && hi.n > 0n && hi.n ** p >= radicand * hi.d ** p;
}
// Which side of the root is x on (1 above, -1 below), by integer powers.
const rootSide = (t, x) => {
  const p = BigInt(t.root.index);
  return x.n < 0n ? -1 : Math.sign(Number(x.n ** p - t.root.radicand * x.d ** p));
};
const rootFloat = (t) => Number(t.root.radicand) ** (1 / t.root.index);
const tolOf = (en) => (/Land exactly/.test(en) ? Q(0n) : V(/within ([\d. /]+) counts/.exec(en)[1]));

// ---- per-skill oracles: parse the English prompt into the exact expectation -----------------------------------------------
const placeTo = (en) => {
  const token = /Move the marker to (.+?)\. (?:Land|Anywhere)/.exec(en)[1];
  return { target: parseNum(token), token, tol: tolOf(en) };
};
const exact = (target) => ({ target, tol: Q(0n) });
const PLACE = {
  "k-next-on-line": (en) => {
    let m = /right (after|before) (\d+)/.exec(en);
    if (m) return exact(Q(BigInt(m[2]) + (m[1] === "after" ? 1n : -1n)));
    m = /is (\d+) (more|less) than (\d+)/.exec(en);
    return exact(Q(BigInt(m[3]) + (m[2] === "more" ? 1n : -1n) * BigInt(m[1])));
  },
  "g2-even-odd": (en) => {
    const m = /the (even|odd) number (right after|just before) (\d+)/.exec(en);
    const dir = m[2] === "right after" ? 1n : -1n;
    let n = BigInt(m[3]) + dir;
    while ((n % 2n === 0n) !== (m[1] === "even")) n += dir;
    return exact(Q(n));
  },
  "g6-opposite-absolute": (en) => {
    let m = /opposite of (.+?)\. Land/.exec(en);
    if (m) return exact(neg(V(m[1])));
    m = /number that is (.+?) units? from zero, on the (left|right) side of zero/.exec(en);
    return exact(m[2] === "left" ? neg(V(m[1])) : V(m[1]));
  },
  "g7-hop-place": (en) => {
    let m = /^Start at (.+?)\. Hop (.+?) units? to the (left|right)\./.exec(en);
    if (m) return exact((m[3] === "left" ? sub : add)(V(m[1]), V(m[2])));
    m = /^Start at (.+?)\. (Add|Subtract) (.+?)\. Move/.exec(en);
    return exact((m[2] === "Add" ? add : sub)(V(m[1]), V(m[3])));
  },
  "g7-distance-between": (en) => {
    const re =
      /^Point B is at (.+?)\. .* that is (.+?) units? from B, on the (left|right) side of B/;
    const m = re.exec(en);
    return exact((m[3] === "left" ? sub : add)(V(m[1]), V(m[2])));
  },
};
const ids = (list) => list.split(" ");
for (const id of ids("k-place-to-20 g1-place-100 g2-place-1000 g3-fractions-line g4-frac-dec"))
  PLACE[id] = placeTo;
for (const id of ids("g4-equivalent-positions g6-integers-rationals g8-square-roots g8-cube-roots"))
  PLACE[id] = placeTo;
PLACE["g8-scientific-positions"] = placeTo;
const KIND = {};
for (const id of Object.keys(PLACE)) KIND[id] = "place";
for (const id of ids("k-hop-count g1-hop-tens-ones g2-skip-hops g7-hop-rationals"))
  KIND[id] = "hop";
for (const id of ids("g3-round-nearest g5-round-decimals")) KIND[id] = "round";
for (const id of ids("g5-order-decimals g6-order-rationals")) KIND[id] = "order";
KIND["g5-zoom-decimals"] = "zoom";

// Declared per-grade limits (never read from the game), one row per grade 0..8: [maxAbs, maxLine, negatives,
// maxDenominator, maxDecimalPlaces]. maxAbs bounds every number in the prompt (counts such as "cut into 12 equal
// parts" included); maxLine bounds the line itself.
const LIMITS = [
  [20, 20, false, 0, 0],
  [100, 100, false, 0, 0],
  [1000, 1000, false, 0, 0],
  [1000, 1000, false, 8, 0],
  [100, 3, false, 100, 2],
  [10, 10, false, 0, 3],
  [10, 10, true, 4, 2],
  [20, 20, true, 4, 1],
  [1e7, 1e7, true, 0, 4],
].map(([maxAbs, maxLine, neg, maxDen, places]) => ({ maxAbs, maxLine, neg, maxDen, places }));
const NUMBER = /[√∛]\d+|[−-]?\d+(?:[. ]\d+)*(?: \d+\/\d+|\/\d+)?(?: ?× ?10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)?/g;
const tokensOf = (text) => text.match(NUMBER) || [];
const roundFor = (id, level, grade, seed) =>
  game.makeRound(id, level, makeRng(seed * 7919 + level * 104729 + grade), grade);
const bilingual = (c, m) => ok(c?.en?.trim() && c?.es?.trim(), `${m}: both languages`);
const leaks = (text, a) =>
  new RegExp(`(?<![\\d.,/])${a.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}(?![\\d/]|[.,]\\d)`).test(
    text,
  );
const stats = { rounds: 0, positions: 0, hops: 0, orders: 0, hints: 0, fallbacks: 0, claims: 0 };
const seen = new Map();
const note = (id, key) => seen.set(`${id}:${key}`, 1 + (seen.get(`${id}:${key}`) || 0));
const JUNK =
  '[{"x":null},{"x":"a"},{"x":{"n":1.5,"d":2}},{"x":{"n":1,"d":0}},{"hops":"no"},{"hops":[null]},{"xs":[]},{"xs":[{"n":1,"d":1}]},{"path":[]}]';
const FUZZ = [null, undefined, 3, "x", [], {}, ...JSON.parse(JUNK)];

ctx = "contract";
ok(validateGame(game).length === 0, `validateGame: ${validateGame(game)}`);
ok(game.id === "number-line-quest" && game.order === 6, "id and shelf order");
const others = [];
const SIBLINGS =
  "number-builder math-match fraction-kitchen math-market array-architect pattern-detective".split(
    " ",
  );
SIBLINGS.push(..."ratio-recipe-lab math-puzzle-studio family-math-duel".split(" "));
for (const id of SIBLINGS) {
  try {
    others.push(
      (await import(`../../math/fluency-lab/family/fm2/games/${id}/index.js`)).default.mechanic,
    );
  } catch {
    // a sibling that is not built yet has no mechanic to compare
  }
}
ok(
  game.mechanic === "place-and-hop-on-line" && !others.includes(game.mechanic),
  `mechanic is distinct from ${others.join(", ")}`,
);
ok(game.skills.length >= 14, "at least 14 skills");
for (let g = 0; g <= 8; g += 1)
  ok(
    game.skills.filter((s) => s.grades[0] <= g && g <= s.grades[1]).length >= 2,
    `grade ${g}: 2+ skills`,
  );
const STD = /^[K0-9]\.[A-Z]+\.[A-Z]\.\d+[a-z]?$/;
const named = (s) =>
  !missingLanguages({ a: s.strand, b: s.title }).length && s.title.en !== s.title.es;
ok(
  game.skills.every((s) => STD.test(s.standard) && named(s) && KIND[s.id]),
  "skills: standard, names, oracle",
);
const how = game.howTo;
const same = (x, i) => x !== how.es[i];
ok(how.en.length === how.es.length && how.en.every(same), "how to play translated");

function generic(skill, level, grade, round) {
  ctx = `${skill.id} L${level} g${grade}`;
  const { prompt, line: raw } = round;
  ok(
    JSON.stringify(JSON.parse(JSON.stringify(round))) === JSON.stringify(round),
    "JSON round trip",
  );
  bilingual(prompt, "prompt");
  ok(prompt.en !== prompt.es, "Spanish prompt differs");
  const norm = (t) => new Set(tokensOf(t).map((x) => x.replaceAll("\u00a0", "")));
  ok(
    [...norm(prompt.en)].every((t) => norm(prompt.es).has(t)),
    "Spanish prompt has the same numbers",
  );
  ok(round.skill === skill.id && round.level === level, "round names its skill and level");
  const lim = LIMITS[grade];
  const line = { min: G(raw.min), max: G(raw.max), step: G(raw.step) };
  const within = (v, bound) => cmp(abs(v), Q(BigInt(bound))) <= 0;
  ok(
    cmp(line.min, line.max) < 0 && within(line.min, lim.maxLine) && within(line.max, lim.maxLine),
    "line range",
  );
  const count = div(sub(line.max, line.min), line.step);
  ok(count.d === 1n && count.n >= 1n && line.step.n > 0n, "whole number of steps");
  const ticks = raw.ticks ? div(sub(line.max, line.min), G(raw.ticks)) : Q(1n);
  ok(ticks.d === 1n && ticks.n <= 40n, `readable ticks (${ticks.n})`);
  ok(
    raw.labels.every((v) => cmp(G(v), line.min) >= 0 && cmp(G(v), line.max) <= 0),
    "labels on line",
  );
  if (!lim.neg)
    ok(cmp(line.min, Q(0n)) >= 0 && !/−/.test(prompt.en), "no negatives before grade 6");
  if (!lim.maxDen) ok(!/\d\/\d/.test(prompt.en), "no fractions before grade 3");
  for (const token of tokensOf(prompt.en)) {
    if (/^[√∛]/.test(token)) ok(BigInt(token.slice(1)) <= 300n, "radicand within limit");
    if (/[√∛×]/.test(token)) continue;
    ok(within(V(token), lim.maxAbs), `${token} within the grade range`);
    ok((token.split(".")[1] || "").length <= lim.places, `${token} decimal places`);
    if (token.includes("/")) ok(Number(token.split("/")[1]) <= lim.maxDen, `${token} denominator`);
  }
  const answer = game.answerText(round);
  ok(typeof answer === "string" && answer.length > 0 && answer.length < 80, "short answer text");
  const tiers = [0, 1, 2, 3].map((t) => game.hint(round, t, null));
  tiers.forEach((h, t) => bilingual(h, `hint ${t}`));
  for (const t of [0, 1, 2]) {
    const { en, es } = tiers[t];
    ok(!leaks(en, answer) && !leaks(es, answer), `hint ${t} must not state ${answer}`);
    ok(en !== es, `hint ${t} translated`);
    if (SAFE[t].en === en) stats.fallbacks += 1;
  }
  ok(tiers[3].en.includes(answer) && tiers[3].es.includes(answer), `tier 3 states ${answer}`);
  ok(new Set(tiers.map((h) => h.en)).size === 4, "four different tiers");
  stats.hints += 3;
  for (const junk of FUZZ) {
    const r = game.check(round, junk);
    ok(
      r.correct === false && r.feedback.en && r.feedback.es,
      `garbage ${JSON.stringify(junk)} is a miss`,
    );
  }
  return { line, count: Number(count.n), t3: tiers[3].en };
}
const ranks = (vs) => vs.map((v) => vs.filter((w) => cmp(w, v) < 0).length);

// ---- PLACE ----------------------------------------------------------------------------------------------------------------
function swaps(token) {
  if (!/^\d+(\.\d+)?$/.test(token)) return null;
  const digits = [...token.replace(".", "")];
  const out = [];
  for (let i = 0; i < digits.length; i += 1)
    for (let j = i + 1; j < digits.length; j += 1) {
      const d = [...digits];
      [d[i], d[j]] = [d[j], d[i]];
      out.push(Number(d.join("")) / 10 ** (token.split(".")[1] || "").length);
    }
  return out;
}
const TRAPS = {
  "sign-flip": (o) => neg(o.target),
  "same-number": (o) => V(/opposite of (.+?)\. Land/.exec(o.en)[1]),
  "radicand-as-position": (o) => Q(o.target.root.radicand),
  "radicand-halved": (o) => div(Q(o.target.root.radicand), Q(2n)),
  "lower-square": (o) => {
    let r = 0n;
    while ((r + 1n) ** BigInt(o.target.root.index) <= o.target.root.radicand) r += 1n;
    return Q(r);
  },
  stayed: (o) => Q(/The marker is on (\d+)/.exec(o.en)[1]),
  "digit-swap": (o) => swaps(o.token),
  flipped: (o) => (o.target.n > 0n ? Q(o.target.d, o.target.n) : null),
};

function claim(cond, msg) {
  ok(cond, msg);
  stats.claims += 1;
}
function placeHints(round, o, t3, en) {
  const t = o.target;
  const rooted = /is between (\d+) and (\d+), because \d+[²³] is (\d+) and \d+[²³] is (\d+)/.exec(
    t3,
  );
  if (t.root) {
    const [p, n] = [BigInt(t.root.index), t.root.radicand];
    const e = /is exactly (\d+)/.exec(t3);
    if (rooted) {
      const [lo, hi, lp, hp] = rooted.slice(1).map(BigInt);
      claim(
        lo ** p === lp && hi ** p === hp && lp < n && n < hp,
        "root hint: stated powers bracket the radicand",
      );
    } else claim(e && BigInt(e[1]) ** p === n, "perfect power stated exactly");
  }
  const eqv = /Each part of \S+ is (\d+) small parts, so \S+ is (\d+) small parts/.exec(t3);
  if (eqv) {
    const parts = Q(/cut into (\d+) equal parts/.exec(en)[1]);
    claim(
      eq(Q(eqv[1]), div(parts, Q(t.d))) && eq(Q(eqv[2]), mul(t, parts)),
      "equivalent parts claim",
    );
  }
  const gap = /It is (\d+) past the labelled mark (\d+)/.exec(t3);
  if (gap) {
    const onLabel = round.line.labels.some((l) => eq(G(l), Q(gap[2])));
    claim(eq(add(Q(gap[1]), Q(gap[2])), t) && onLabel, "gap past a labelled mark");
  }
  const dec = /Count (\d+) tenths(?:, then (\d+) more hundredths)?/.exec(t3);
  if (dec) {
    const f = sub(t, Q(t.n / t.d));
    const tenths = (f.n * 10n) / f.d;
    const hundredths = (f.n * 100n) / f.d - tenths * 10n;
    claim(BigInt(dec[1]) === tenths && BigInt(dec[2] || 0) === hundredths, "decimal digits");
  }
}

function placeChecks(skill, level, grade, round) {
  const en = round.prompt.en;
  const o = { ...PLACE[skill.id](en), en };
  const { line, count, t3 } = generic(skill, level, grade, round);
  const { target, tol } = o;
  if (round.radical)
    ok(target.root && BigInt(round.radical.radicand) === target.root.radicand, "radical");
  else ok(!target.root && eq(G(round.target), target), `stored target matches "${en}"`);
  ok(eq(G(round.tol), tol), "stated tolerance is the stored tolerance");
  if (!target.root)
    ok(cmp(target, line.min) >= 0 && cmp(target, line.max) <= 0, "target on the line");
  if (skill.id === "g4-equivalent-positions") {
    const parts = Q(/cut into (\d+) equal parts/.exec(en)[1]);
    ok(
      eq(G(round.line.ticks), div(Q(1n), parts)) && eq(line.step, div(Q(1n), parts)),
      "line cut as stated",
    );
    ok(mul(target, parts).d === 1n, "the fraction lands on a tick");
  }
  ok(!accepts(target, tol, G(round.start)), "marker does not start on an answer");
  const span = sub(line.max, line.min);
  let accepted = 0;
  const trapKeys = new Set(round.traps.map((t) => t.key));
  for (let k = 0; k <= count; k += 1) {
    const x = add(line.min, mul(line.step, Q(k)));
    const res = game.check(round, { x: T(x) });
    const want = accepts(target, tol, x);
    ok(res.correct === want, `position ${k} (${num(x)}) should be ${want} for "${en}"`);
    stats.positions += 1;
    if (want) {
      accepted += 1;
      continue;
    }
    ok(res.mistake, "a miss names its mistake");
    bilingual(res.feedback, "feedback");
    ok(res.feedback.en !== res.feedback.es, "feedback translated");
    note(skill.id, res.mistake);
    const side = target.root
      ? rootSide(target, x) * Math.abs(num(x) - rootFloat(target))
      : num(sub(x, target));
    if (/^too-/.test(res.mistake)) {
      ok((res.mistake === "too-right") === side > 0, "direction of the miss");
      ok(
        new RegExp(res.mistake === "too-right" ? "right" : "left").test(res.feedback.en),
        "names the side",
      );
      const about = /about (\S+) too (big|small)/.exec(res.feedback.en);
      if (about) {
        ok((about[2] === "big") === side > 0, "big/small agrees with the side");
        ok(
          Math.abs(Math.abs(num(V(about[1]))) - Math.abs(side)) <= num(span) / 10 + num(line.step),
          "fair estimate",
        );
      }
    } else ok(trapKeys.has(res.mistake), `unexpected mistake ${res.mistake}`);
    ok(
      !/(?:target|answer) (?:is|at)/i.test(res.feedback.en),
      "feedback never announces the target",
    );
  }
  ok(accepted >= 1, "solvable");
  ok(game.check(round, game.solve(round)).correct, "solve() accepted");
  for (const trap of round.traps) {
    const res = game.check(round, { x: trap.x });
    ok(!res.correct && res.mistake === trap.key, `trap ${trap.key} is named`);
    ok(
      !/^(A little|Too far|Much too far)/.test(res.feedback.en),
      `trap ${trap.key} feedback is specific`,
    );
    const want = TRAPS[trap.key]?.({ ...o });
    const near = (c) => Math.abs(c - num(G(trap.x))) <= num(line.step) / 2 + 1e-9;
    if (Array.isArray(want)) ok(want.some(near), "digit swap");
    else if (want) ok(eq(G(trap.x), want), `trap ${trap.key} is the slip it claims`);
  }
  placeHints(round, o, t3, en);
  ok(
    game.check(round, { x: T(add(line.max, line.step)) }).mistake === "off-line",
    "off-line refused",
  );
  return count / (2 * num(div(tol, line.step)) + 1);
}

// ---- HOP --------------------------------------------------------------------------------------------------------------------
function bfsMin(min, max, start, target, hops) {
  const unit = [min, max, start, target, ...hops].reduce((a, v) => (a / bgcd(a, v.d)) * v.d, 1n);
  const sc = (q) => (q.n * unit) / q.d;
  const [lo, hi, to] = [sc(min), sc(max), sc(target)];
  let layer = new Set([sc(start)]);
  const seenPos = new Set(layer);
  for (let depth = 0; depth <= 14; depth += 1) {
    if (layer.has(to)) return depth;
    const next = new Set();
    for (const p of layer)
      for (const h of hops.map(sc))
        if (p + h >= lo && p + h <= hi && !seenPos.has(p + h))
          seenPos.add(p + h) && next.add(p + h);
    layer = next;
  }
  return null;
}

function hopChecks(skill, level, grade, round, rng) {
  const m = /Start at (.+?)\. Land on (.+?) in at most (\d+) hops/.exec(round.prompt.en);
  const [start, target, cap] = [V(m[1]), V(m[2]), Number(m[3])];
  const { line, t3 } = generic(skill, level, grade, round);
  const hops = round.hops.map(G);
  ok(eq(G(round.start), start) && eq(G(round.target), target) && round.cap === cap, "stored data");
  const min = bfsMin(line.min, line.max, start, target, hops);
  ok(min !== null && min === round.minHops, `minimum hops ${min} vs ${round.minHops}`);
  ok(cap >= min && cap <= min + 3, "cap is the minimum plus a small slack");
  const skip = /Skip count by (\d+)s/.exec(round.prompt.en);
  if (skip) {
    const k = Q(skip[1]);
    ok(
      hops.some((h) => eq(h, k)) && eq(div(sub(target, start), k), Q(min)) && cap === min,
      "skip count",
    );
  }
  ok(grade >= 6 || hops.every((h) => h.d === 1n), "whole-number hops before grade 6");
  const run = (list) => {
    const res = game.check(round, { hops: list.map(T) });
    stats.hops += 1;
    const pos = list.reduce((p, h) => add(p, h), start);
    let want = "ok";
    if (!list.length) want = "no-hops";
    else if (eq(pos, target)) want = list.length > cap ? "too-many" : "ok";
    else if (eq(pos, start)) want = "no-progress";
    else if (cmp(pos, start) !== cmp(target, start)) want = "wrong-way";
    else want = cmp(pos, target) === cmp(target, start) ? "overshot" : "short";
    ok(res.correct === (want === "ok"), `hops ${list.map(num).join(" ")} should be ${want}`);
    if (want !== "ok") {
      ok(res.mistake === want, `mistake ${res.mistake} should be ${want}`);
      bilingual(res.feedback, "hop feedback");
      note(skill.id, res.mistake);
    }
    return want === "ok";
  };
  ok(run(round.plan.map(G)), "the stored plan lands on the goal");
  run([...round.plan.map(G)].reverse());
  ok(game.check(round, game.solve(round)).correct, "solve() accepted");
  for (let i = 0; i < 70; i += 1)
    run(
      Array.from(
        { length: 1 + Math.floor(rng() * (cap + 2)) },
        () => hops[Math.floor(rng() * hops.length)],
      ),
    );
  ok(run([...round.plan.map(G)].sort(() => rng() - 0.5)), "another order of the same hops lands");
  ok(!game.check(round, { hops: [{ n: 99999, d: 1 }] }).correct, "a non-button hop is refused");
  const signed = ([, sign, v]) => (sign === "−" ? neg(V(v)) : V(v));
  const listed = [...t3.matchAll(/([+−])(\d+(?:\.\d+)?(?:\/\d+)?)/g)].map(signed);
  const lands =
    eq(
      listed.reduce((p, h) => add(p, h), start),
      target,
    ) && listed.length <= cap;
  claim(
    lands && listed.every((h) => hops.some((b) => eq(b, h))),
    "the hinted path lands, with real buttons",
  );
  return min + hops.length - (cap - min) + 2 * Math.log10(num(sub(line.max, line.min)));
}

// ---- ROUND ----------------------------------------------------------------------------------------------------------------
const WIDTH = { ten: "10", hundred: "100", "whole number": "1", tenth: "0.1", hundredth: "0.01" };
function roundChecks(skill, level, grade, round) {
  const m =
    /^Round (\S+) to the nearest (.+?): drop the marker on \S+ between (\S+) and (\S+?)\. /.exec(
      round.prompt.en,
    );
  const [value, lo, hi, tol] = [V(m[1]), V(m[3]), V(m[4]), tolOf(round.prompt.en)];
  const { line, count, t3 } = generic(skill, level, grade, round);
  ok(eq(sub(hi, lo), V(WIDTH[m[2]])), `benchmarks are one ${m[2]} apart`);
  ok(cmp(value, lo) > 0 && cmp(value, hi) < 0, "value strictly between the benchmarks");
  ok(
    [round.lo, round.hi, round.value, round.tol].every((f, i) => eq(G(f), [lo, hi, value, tol][i])),
    "stored",
  );
  const mid = div(add(lo, hi), Q(2n));
  const first = G(round.start);
  ok(
    cmp(abs(sub(first, value)), tol) > 0 && cmp(first, lo) >= 0 && cmp(first, hi) <= 0,
    "marker starts off the value",
  );
  ok(
    !eq(value, mid) && cmp(abs(sub(value, mid)), tol) > 0,
    "never halfway; range never reaches it",
  );
  const nearest = cmp(value, mid) < 0 ? lo : hi;
  const half = / is (before|past) halfway, so it is nearest to (\S+)\./.exec(t3);
  claim(
    half && (half[1] === "before") === cmp(value, mid) < 0 && eq(V(half[2]), nearest),
    "tier 3",
  );
  for (let k = 0; k <= count; k += 1) {
    const x = add(line.min, mul(line.step, Q(k)));
    for (const pick of [lo, hi]) {
      const res = game.check(round, { x: T(x), pick: T(pick) });
      const markerOk = cmp(abs(sub(x, value)), tol) <= 0;
      ok(res.correct === (markerOk && eq(pick, nearest)), `marker ${num(x)} pick ${num(pick)}`);
      stats.positions += 1;
      if (res.correct) continue;
      bilingual(res.feedback, "round feedback");
      note(skill.id, res.mistake);
      const wantPick = eq(pick, hi) ? "rounded-up-early" : "rounded-down-late";
      ok(
        res.mistake === (markerOk ? wantPick : `too-${cmp(x, value) > 0 ? "right" : "left"}`),
        "named",
      );
    }
  }
  ok(game.check(round, game.solve(round)).correct, "solve() accepted");
  ok(!game.check(round, { x: T(value) }).correct, "a marker alone is not an answer");
  return String(num(value)).replace(/[.-]/g, "").length + (round.line.labels.length === 3 ? 0 : 1);
}

// ---- ORDER ------------------------------------------------------------------------------------------------------------------
function orderChecks(skill, level, grade, round, rng) {
  const list = /: (.+)\. Only the order matters/.exec(round.prompt.en)[1].split(", ");
  const values = list.map((s) => V(/^[A-Z] = (.+)$/.exec(s)[1]));
  const { line, count } = generic(skill, level, grade, round);
  ok(
    values.every((v, i) => eq(v, G(round.items[i].v))),
    "stored values match the prompt",
  );
  ok(new Set(values.map((v) => `${v.n}/${v.d}`)).size === values.length, "distinct values");
  const at = (k) => add(line.min, mul(line.step, Q(k)));
  const truth = ranks(values);
  const good = (ks) =>
    ks.every((a, i) => ks.every((b, j) => i === j || (a !== b && a < b === truth[i] < truth[j])));
  const spread = (r) => Math.round(((r + 1) * count) / (values.length + 1));
  const run = (ks) => {
    const res = game.check(round, { xs: ks.map((k) => T(at(k))) });
    stats.orders += 1;
    ok(res.correct === good(ks), `placement ${ks.join(",")} should be ${good(ks)}`);
    if (!res.correct) {
      bilingual(res.feedback, "order feedback");
      note(skill.id, res.mistake);
      ok(res.mistake === "tied" || new Set(ks).size === ks.length, "ties are named as ties");
    }
    return res;
  };
  for (let i = 0; i < 80; i += 1) run(values.map(() => Math.floor(rng() * (count + 1))));
  run(truth.map(spread));
  ok(
    run(truth.map((r) => spread(values.length - 1 - r))).mistake === "reversed",
    "backwards is named",
  );
  // by size without the sign (a number and its opposite keep their input order)
  const order = values
    .map((_, i) => i)
    .sort((p, q) => cmp(abs(values[p]), abs(values[q])) || p - q);
  const bySize = values.map((_, i) => spread(order.indexOf(i)));
  if (values.some((v) => v.n < 0) && !good(bySize))
    ok(
      ["abs-order", "reversed"].includes(run(bySize).mistake),
      "by size without the sign is named",
    );
  ok(game.check(round, game.solve(round)).correct, "solve() accepted");
  const starts = round.starts.map((s) => Number(div(sub(G(s), line.min), line.step).n));
  ok(starts.length === values.length && !good(starts), "markers do not start in order");
  const hint = game.hint(round, 3).en;
  const claimed = hint.split("go ")[1]?.replace(/\.$/, "").split(" < ").map(V) || [];
  claim(
    claimed.length === values.length && claimed.every((v, i) => !i || cmp(claimed[i - 1], v) < 0),
    "hint",
  );
  return values.length + (values.some((v) => v.n < 0) ? 1 : 0);
}

// ---- ZOOM -------------------------------------------------------------------------------------------------------------------
function zoomChecks(skill, level, grade, round) {
  const text = /^Zoom in to place (\S+)\./.exec(round.prompt.en)[1];
  const target = V(text);
  generic(skill, level, grade, round);
  const places = (text.split(".")[1] || "").length;
  ok(
    places >= 2 && places <= 3 && !text.endsWith("0"),
    "hundredths or thousandths, last digit nonzero",
  );
  ok(eq(G(round.target), target) && round.zoom.z === places - 1, "stored target and depth");
  const floorTo = (d) => Q((target.n * 10n ** BigInt(d)) / target.d, 10n ** BigInt(d));
  const path = Array.from({ length: places - 1 }, (_, i) => floorTo(i + 1));
  const [low, step] = [path.at(-1), pow10(-places)];
  const send = (p, x) => game.check(round, { path: p.map(T), x: T(x) });
  ok(
    send(path, target).correct && game.check(round, game.solve(round)).correct,
    "digit path accepted",
  );
  for (let k = 0n; k <= 10n; k += 1n) {
    const x = add(low, mul(step, Q(k)));
    const res = send(path, x);
    ok(res.correct === eq(x, target), `final spot ${num(x)}`);
    if (!res.correct) {
      ok(res.mistake === (cmp(x, target) > 0 ? "too-right" : "too-left"), "final miss direction");
      bilingual(res.feedback, "zoom feedback");
      note(skill.id, res.mistake);
    }
  }
  for (const delta of [-1n, 1n]) {
    const wrong = [add(path[0], mul(pow10(-1), Q(delta))), ...path.slice(1)];
    const index = mul(sub(wrong[0], G(round.zoom.outerMin)), Q(10n));
    if (cmp(index, Q(0n)) < 0 || cmp(index, Q(9n)) > 0) continue;
    const res = send(wrong, add(wrong.at(-1), step));
    ok(
      res.mistake === (delta > 0n ? "slice-right" : "slice-left"),
      `wrong stretch is named (${res.mistake})`,
    );
    ok(
      res.feedback.en.includes("stretch") && res.feedback.en !== res.feedback.es,
      "stretch feedback",
    );
    note(skill.id, res.mistake);
  }
  ok(
    game.check(round, { path: [], x: T(target) }).mistake === "incomplete",
    "unzoomed is incomplete",
  );
  const pairs = [...game.hint(round, 3).en.matchAll(/(\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)/g)];
  const stretches = pairs.map((m) => [V(m[1]), V(m[2])]);
  const holds = ([a, b], i) =>
    eq(sub(b, a), pow10(-(i + 1))) && cmp(a, target) <= 0 && cmp(target, b) <= 0;
  claim(stretches.length === places - 1 && stretches.every(holds), "tier 3 names every stretch");
  return 2 * (places - 1) + places + (cmp(target, Q(1n)) >= 0 ? 1 : 0);
}

// ---- the seeded sweep -----------------------------------------------------------------------------------------------------
const CHECK = {
  place: placeChecks,
  hop: hopChecks,
  round: roundChecks,
  order: orderChecks,
  zoom: zoomChecks,
};
const demand = new Map();
const variety = new Map();
const started = Date.now();
for (const skill of game.skills) {
  for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1)
    for (let level = 1; level <= 3; level += 1)
      for (let seed = 1; seed <= 40; seed += 1) {
        const round = roundFor(skill.id, level, grade, seed);
        ctx = skill.id;
        const again = JSON.stringify(roundFor(skill.id, level, grade, seed));
        ok(
          round.kind === KIND[skill.id] && again === JSON.stringify(round),
          "kind; same seed, same round",
        );
        const d = CHECK[round.kind](skill, level, grade, round, makeRng(seed + 17));
        stats.rounds += 1;
        demand.set(`${skill.id}|${level}`, [...(demand.get(`${skill.id}|${level}`) || []), d]);
      }
  ctx = skill.id;
  const pooled = new Set();
  for (let level = 1; level <= 3; level += 1) {
    const each = new Set();
    for (let seed = 1; seed <= 100; seed += 1) {
      const fp = JSON.stringify(roundFor(skill.id, level, skill.grades[1], seed + 5000));
      each.add(fp);
      pooled.add(fp);
    }
    variety.set(`${skill.id}|${level}`, each.size);
  }
  ok(pooled.size >= 30, `at least 30 distinct rounds over 100 seeds per level (${pooled.size})`);
  const mean = (l) => demand.get(`${skill.id}|${l}`).reduce((a, b) => a + b, 0) / 40;
  ok(
    mean(3) > mean(1),
    `level 3 demands more than level 1 (${mean(1).toFixed(1)} -> ${mean(3).toFixed(1)})`,
  );
}

// ---- FM-059: the drawn model matches the numbers ---------------------------------------------------------------------------
let drawn = 0;
for (const skill of game.skills)
  for (const level of [1, 2, 3])
    for (let seed = 1; seed <= 6; seed += 1) {
      ctx = `${skill.id} L${level} model`;
      const round = roundFor(skill.id, level, skill.grades[0], seed);
      const cfg = baseConfig(round, "en");
      const svg = numberLineSvg({ width: 760, ...cfg, text: cfg.labelText, baseline: 100 });
      const [min, max] = [G(round.line.min), G(round.line.max)];
      const xOf = (v) => PAD + (num(sub(v, min)) / num(sub(max, min))) * (760 - 2 * PAD);
      const texts = [...svg.matchAll(/<text x="([\d.]+)" y="[\d.]+"[^>]*>([^<]*)<\/text>/g)];
      const labels = texts.map((t) => [Number(t[1]), t[2]]).filter(([, t]) => !/^[A-Z]$/.test(t));
      ok(labels.length === round.line.labels.length, `every label is drawn (${labels.length})`);
      for (const [x, text] of labels) {
        const v = V(text);
        ok(
          round.line.labels.some((l) => eq(G(l), v)) && Math.abs(x - xOf(v)) < 0.6,
          `label ${text} at its value`,
        );
        drawn += 1;
      }
      const ticks = (svg.match(/stroke="#5d6683" stroke-width="2"/g) || []).length;
      const want = round.line.ticks ? Number(div(sub(max, min), G(round.line.ticks)).n) + 1 : 0;
      ok(ticks === want, `one tick per grid value (${ticks} of ${want})`);
      ok(/role="img" aria-label="[^"]+"/.test(svg), "the figure is described in words");
    }

// ---- every catalogued mistake was exercised -------------------------------------------------------------------------------
ctx = "mistakes";
const kinds = new Set([...seen.keys()].map((k) => k.split(":")[1]));
const NEEDED = (
  "too-right too-left tied overshot short wrong-way too-many slice-left slice-right " +
  "rounded-up-early rounded-down-late abs-order reversed sign-flip digit-swap counted-zero flipped " +
  "radicand-as-position lower-square"
).split(" ");
for (const k of NEEDED) ok(kinds.has(k), `the catalogued mistake ${k} was exercised and named`);
const low = Math.min(...variety.values());
const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(
  `number-line-quest math: ${checks} checks over ${stats.rounds} rounds (${stats.positions} marker positions, ` +
    `${stats.hops} hop paths, ${stats.orders} order placements, ${drawn} drawn labels, ${stats.claims} hint claims ` +
    `re-derived); ${stats.fallbacks} of ${stats.hints} tier 0-2 hints used the answer-free fallback; ` +
    `${kinds.size} mistake kinds; least per-level variety ${low}; ${seconds}s.`,
);
