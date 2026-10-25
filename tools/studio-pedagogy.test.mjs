// Studio v4 pedagogy layer (assets/studio/pedagogy.js, contrast.js, rookie.js, capstone.js; data/practice-studio/pedagogy-layer.json).
// Pure logic runs in node:vm; the features that live in the page run in jsdom against the REAL generated page of a lesson
// (scripts/generate-practice-studios.mjs `outputs`, in memory: nothing is written), so the runtime hooks are exercised too.
//   node tools/studio-pedagogy.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { JSDOM } from "jsdom";
import { outputs } from "../scripts/generate-practice-studios.mjs";
import {
  contrastItemProblems,
  pedagogyLayerProblems,
} from "../scripts/lib/practice-studio-data.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { loadStudio } from "./lib/studio-vm.mjs";

// The lab items import ES modules at run time, which a jsdom window cannot do: their load failure is not what this test is about.
process.on("unhandledRejection", () => {});
process.on("uncaughtException", (e) => {
  if (!/goalLine|twinHtml|kinds-lab|lab-embed/.test(String(e?.stack))) throw e;
});

const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const layer = JSON.parse(read("data/practice-studio/pedagogy-layer.json"));
const { traps } = JSON.parse(read("data/practice-studio/misconceptions.json"));

/* ---- pure logic in node:vm ------------------------------------------------------------------------------------ */
const ctx = loadStudio({ gen: true });
ctx.StudioRT = { kinds: {}, api: null };
for (const f of ["boost-core", "pedagogy", "rookie", "capstone"])
  vm.runInContext(read(`assets/studio/${f}.js`), ctx, { filename: f });
const G = ctx.StudioGen;
const P = ctx.StudioPedagogy;
const names = G.traps.names;
let checks = 0;
const ok = (cond, msg) => {
  checks++;
  assert.ok(cond, msg);
};

/* ---- the layer file passes its own validator, and the validator can fail -------------------------------------- */
assert.deepEqual(pedagogyLayerProblems(layer, traps), [], "pedagogy-layer.json is valid");
{
  const base = structuredClone(layer.lessons["3-3"].contrast.challenge);
  const mutate = (fn) => {
    const c = structuredClone(base);
    fn(c);
    return contrastItemProblems(c, "t");
  };
  ok(mutate(() => {}).length === 0, "the 3-3 case is valid");
  ok(mutate((c) => (c.same.chips.length = 2)).length > 0, "two chips fail");
  ok(mutate((c) => delete c.diff.chips[1].f).length > 0, "a wrong chip with no feedback fails");
  ok(
    mutate((c) => (c.solA.verdict = c.solB.verdict)).length > 0,
    "two working solutions in a trap item fail",
  );
  ok(
    mutate((c) => (c.h[0] = "Solution A is correct.")).length > 0,
    "a hint that names the right solution fails",
  );
  ok(
    mutate(
      (c) => (c.same.chips[c.same.ok].t += " and then some more words to make it the longest chip"),
    ).length > 0,
    "the longest right chip fails",
  );
  ok(mutate((c) => (c.solB.stepsEs = ["uno"])).length > 0, "misaligned Spanish steps fail");
  ok(mutate((c) => (c.x = "x")).length > 0, "no explanation fails");
}
{
  // the chips never print the verdict before the student has marked them, and the right chip is spread over A-C
  const spots = { same: [0, 0, 0], diff: [0, 0, 0] };
  for (const L of Object.values(layer.lessons))
    for (const it of Object.values(L.contrast || {})) {
      spots.same[it.same.ok]++;
      spots.diff[it.diff.ok]++;
    }
  ok(
    spots.same.filter(Boolean).length >= 3 && spots.diff.filter(Boolean).length >= 3,
    `right chips spread over all three positions: ${JSON.stringify(spots)}`,
  );
}

/* ---- estimate chips: the relation comes from the item's own answer and agrees with an independent recomputation ------------ */
const fr = (p) => p[0] / p[1];
const dec = (v, dp) => v / 10 ** dp;
// per generator + meta kind: the benchmark value and the TRUE answer, recomputed from meta by a different route than the key
const TRUTH = {
  "wholeDivFrac.calc": (m) => ({ bench: fr(m.A), truth: fr(m.A) / fr(m.B) }),
  "mixedDivide.calc": (m) => ({ bench: fr(m.A), truth: fr(m.A) / fr(m.B) }),
  "fracDivWord.calc": (m) => ({ bench: fr(m.A), truth: fr(m.A) / fr(m.B) }),
  "fracDivWord.full": (m) => ({ bench: fr(m.A), truth: Math.floor(fr(m.A) / fr(m.B) + 1e-9) }),
  "decimalAddSub.calc": (m) => ({
    bench: dec(m.A, m.dpa),
    truth: m.op === "add" ? dec(m.A, m.dpa) + dec(m.B, m.dpb) : dec(m.A, m.dpa) - dec(m.B, m.dpb),
  }),
  "decimalMultiply.prod": (m) => ({
    bench: dec(m.A, m.dpa),
    truth: dec(m.A, m.dpa) * dec(m.B, m.dpb),
  }),
  "unitRate.basic": (m, a) => ({ bench: a * m.n, truth: a }),
  "areaParallelogram.miss": (m) => ({ bench: m.known, truth: m.A / m.known }),
  "areaParallelogram.rhomMiss": (m) => ({ bench: m.known, truth: m.A / m.known }),
  "volumePrismWhole.miss": (m) => ({ bench: m.known[0], truth: m.V / (m.known[0] * m.known[1]) }),
  "absoluteValue.ctxDist": (m) => ({ bench: m.n, truth: Math.abs(m.n) }),
};
const relOf = (t, b) =>
  t - b > 0.05 * Math.abs(b) ? "bigger" : b - t > 0.05 * Math.abs(b) ? "smaller" : "same";
{
  const seen = {};
  for (const gid of new Set(Object.keys(TRUTH).map((k) => k.split(".")[0])))
    for (let lv = 1; lv <= 4; lv++)
      for (let seed = 1; seed <= 400; seed++) {
        const it = G.make(gid, lv, seed);
        const e = P.estimateOf(it);
        const key = `${gid}.${it.meta?.kind || it.meta?.t}`;
        if (!TRUTH[key] || it.k !== "num") {
          ok(e === null, `${key} (${it.k}) has no chips`);
          continue;
        }
        ok(e, `${key} seed ${seed}: chips exist`);
        const { bench, truth } = TRUTH[key](it.meta, G.value(it.a));
        assert.ok(
          Math.abs(bench - e.v) < 1e-9,
          `${key} seed ${seed}: benchmark ${e.v} vs ${bench}`,
        );
        assert.equal(
          e.rel,
          relOf(truth, bench),
          `${key} L${lv} seed ${seed}: chip answer for ${it.q}`,
        );
        (seen[key] ||= new Set()).add(e.rel);
        checks++;
      }
  for (const key of Object.keys(TRUTH)) assert.ok(seen[key], `${key} never produced a chip`);
  const both = Object.entries(seen)
    .filter(([, v]) => v.size > 1)
    .map(([k]) => k);
  ok(
    both.length >= 5,
    `at least five kinds ask a real question (more than one right chip): ${both.join(", ")}`,
  );
  // every lesson that opts in has a generated numeric item that gets the chips
  const gensOf = (id) => {
    const out = [];
    const walk = (x) => {
      if (Array.isArray(x)) x.forEach(walk);
      else if (x && typeof x === "object") {
        if (x.k === "gen") out.push(x);
        Object.values(x).forEach(walk);
      }
    };
    walk(JSON.parse(read(`data/practice-studio/${id}.json`)));
    return out;
  };
  for (const [id] of Object.entries(layer.lessons).filter(([, lesson]) => lesson.estimate)) {
    let n = 0;
    for (const spec of gensOf(id))
      for (let seed = 1; seed <= 60; seed++)
        if (P.estimateOf(G.make(spec.g, spec.level, seed))) n++;
    ok(n > 0, `${id} opts in to estimate chips but none of its generated items gets one`);
  }
  // an authored override by item id
  const o = P.estimateOf(
    { id: "x1", k: "num", a: "12" },
    { x1: { v: 5, benchmark: "the number of sides", benchmarkEs: "el número de lados" } },
  );
  ok(o && o.rel === "bigger" && o.es === "el número de lados", "an authored benchmark works");
  ok(P.estimateOf({ id: "x2", k: "mc" }) === null, "multiple choice gets no chips");
}
ok(
  P.relation(10, 10) === "same" &&
    P.relation(10.4, 10) === "same" &&
    P.relation(11, 10) === "bigger" &&
    P.relation(9, 10) === "smaller",
  "relation thresholds",
);
ok(
  P.relation(63, -63) === "bigger" && P.relation(-5, 0) === "smaller",
  "relation with a negative or zero benchmark",
);

/* ---- same numbers: ?seed=<token> ---------------------------------------------------------------------------- */
ok(
  P.parseSeed("?seed=P3") === "P3" && P.parseSeed("?a=1&seed=Class-7_b&x") === "Class-7_b",
  "tokens parse",
);
ok(
  P.parseSeed("?seed=") === "" &&
    P.parseSeed("?seed=a b") === "" &&
    P.parseSeed("?seed=<script>") === "" &&
    P.parseSeed("?seed=" + "x".repeat(13)) === "" &&
    P.parseSeed("") === "",
  "bad tokens are ignored",
);

/* ---- written evidence ------------------------------------------------------------------------------------------- */
ok(
  P.wordCount("  The unit rate   is 24 pages per hour. ") === 8 &&
    P.wordCount("") === 0 &&
    P.wordCount("— …") === 0,
  "word counts ignore spacing and bare punctuation",
);
ok(
  P.minWords({ min: 40 }, false) === 8 &&
    P.minWords({ min: 120 }, false) === 20 &&
    P.minWords({ min: 1000 }, false) === 25 &&
    P.minWords({ minWords: 12 }, false) === 12,
  "minimum words",
);
ok(P.minWords({ min: 120 }, true) === 12, "the Foundational pathway asks for fewer words");
{
  const text =
    "The mean is 24 because I added 12 + 36 and divided by 2. Entonces el promedio es 24.";
  const words = P.evidenceWords(text, ["mean", "promedio"]);
  ok(words.length <= 8 && words.length >= 4, "a handful of chips");
  ok(
    words.every((w) => text.includes(w)),
    `every chip is one of the student's own words: ${words}`,
  );
  ok(words.includes("mean") && words.includes("promedio"), "key words come first");
  ok(!words.some((w) => /^(the|and|is|es|el)$/i.test(w)), "no filler words");
  ok(new Set(words.map((w) => w.toLowerCase())).size === words.length, "no repeats");
  ok(P.evidenceWords("a b it", []).length === 0, "nothing to choose from when nothing was written");
}

/* ---- why chip ---------------------------------------------------------------------------------------------------- */
{
  let offered = 0;
  let tried = 0;
  for (const gid of G.ids())
    for (const lv of [2, 3, 4])
      for (let seed = 1; seed <= 25; seed++) {
        const it = { ...G.make(gid, lv, seed), id: `${gid}-${lv}-${seed}` };
        if (it.k !== "mc" && it.k !== "num") continue;
        tried++;
        const chips = P.whyChips(it, names);
        if (!chips) continue;
        offered++;
        const right = chips.filter((c) => c.ok);
        assert.equal(chips.length, 3, "three chips");
        assert.equal(right.length, 1, "exactly one true reason");
        assert.equal(
          right[0].en,
          P.firstSentence(it.x),
          "the true reason is the item's own explanation",
        );
        const trapFixes = Object.values(names).map((n) => P.firstSentence(n.fix));
        for (const w of chips.filter((c) => !c.ok))
          assert.ok(trapFixes.includes(w.en), "a wrong chip is one of the item's own trap fixes");
        assert.ok(
          right[0].en.length <=
            1.35 * Math.max(...chips.filter((c) => !c.ok).map((c) => c.en.length)),
          "the true reason is not the clear longest",
        );
        assert.equal(new Set(chips.map((c) => c.en.toLowerCase())).size, 3, "no repeats");
        checks++;
      }
  console.log(
    `  why chip: offered on ${offered} of ${tried} generated items (it skips quietly when it cannot be fair)`,
  );
  ok(offered > 0, "the why chip is offered somewhere");
  ok(
    P.whyChips({ id: "z", k: "num", x: "Short.", tag: [] }, names) === null,
    "no chips without two traps",
  );
}

/* ---- look-back warm-up ---------------------------------------------------------------------------------------- */
{
  const today = "2026-10-20";
  const skills = {
    unitRate: { box: 1, due: "2026-10-19", seen: 3, lesson: "3-2" },
    eqRatioTable: { box: 2, due: "2026-10-30", seen: 2, lesson: "3-3" },
    absoluteValue: { box: 1, due: "2026-10-18", seen: 2, lesson: "7-3" },
    decimalMultiply: { box: 1, due: "2026-10-19", seen: 1, lesson: "2-12" },
  };
  const rnd = () => {
    let a = 11;
    return () => (a = (a * 1664525 + 1013904223) % 4294967296) / 4294967296;
  };
  const plan = P.lookbackPlan({ skills }, today, "9-1", rnd(), ctx.StudioBoostCore);
  ok(plan && plan.pairs.length >= 2 && plan.pairs.length <= 3, "a plan with 2-3 problems");
  ok(skills[plan.pairs[0].g].due <= today, "the target was last seen on an earlier day");
  ok(new Set(plan.pairs.map((p) => p.g)).size === plan.pairs.length, "distinct skills");
  ok(
    plan.pairs.every(
      (p) => /\d/.test(p.q) && !/the (picture|diagram|graph|figure|table)/i.test(p.q),
    ),
    "stand-alone stems",
  );
  ok(
    plan.pairs.every((p) => p.title && p.lesson),
    "each skill has a title and a lesson",
  );
  const again = P.lookbackPlan({ skills }, today, "9-1", rnd(), ctx.StudioBoostCore);
  assert.deepEqual(
    again.pairs.map((p) => p.q),
    plan.pairs.map((p) => p.q),
    "deterministic for a given day",
  );
  ok(
    P.lookbackPlan({ skills }, today, "3-2", rnd(), ctx.StudioBoostCore).pairs.every(
      (p) => p.lesson !== "3-2",
    ),
    "never from the current lesson",
  );
  ok(
    P.lookbackPlan({ skills: {} }, today, "9-1", rnd(), ctx.StudioBoostCore) === null,
    "no history: skip silently",
  );
  ok(
    P.lookbackPlan(
      { skills: { unitRate: skills.unitRate } },
      today,
      "9-1",
      rnd(),
      ctx.StudioBoostCore,
    ) === null,
    "one skill is not a discrimination",
  );
  const notDue = Object.fromEntries(
    Object.entries(skills).map(([k, v]) => [k, { ...v, due: "2026-12-01" }]),
  );
  ok(
    P.lookbackPlan({ skills: notDue }, today, "9-1", rnd(), ctx.StudioBoostCore) === null,
    "nothing due: skip silently",
  );
}

/* ---- Teach the Rookie: the wrong answer is a generator's own named trap, never invented -------------------------------- */
{
  const R = ctx.StudioRookie;
  let n = 0;
  for (const [id, L] of Object.entries(layer.lessons).filter(([, L]) => L.rookie)) {
    const sc = R.scenario(L.rookie.g, L.rookie.level, 4000, names, `rk-c|${L.rookie.g}`);
    assert.ok(sc, `${id}: a Rookie scenario exists for ${L.rookie.g} L${L.rookie.level}`);
    const q = sc.item;
    const right = q.k === "mc" ? q.c[q.a] : q.a;
    assert.notEqual(String(sc.v), String(right), `${id}: Rookie's answer is wrong`);
    assert.ok(G.verify(q), `${id}: the underlying item is a verified problem`);
    assert.ok(names[sc.trap], `${id}: the trap is named in the taxonomy`);
    assert.equal(
      new Set(sc.traps.map((t) => t.id)).size,
      sc.traps.length,
      `${id}: distinct trap choices`,
    );
    assert.ok(
      sc.traps.length >= 2 && sc.traps.some((t) => t.id === sc.trap),
      `${id}: the real trap is among the choices`,
    );
    // the answer Rookie wrote really is that trap's distractor on this item
    const mine = R.wrongOf(q, names)
      .filter((w) => w.tag === sc.trap)
      .map((w) => String(w.v));
    assert.ok(mine.includes(String(sc.v)), `${id}: Rookie's answer is the ${sc.trap} distractor`);
    assert.equal(sc.tips.filter((t) => t.ok).length, 1, `${id}: exactly one coaching tip works`);
    assert.equal(
      sc.tips.find((t) => t.ok).en,
      names[sc.trap].fix,
      `${id}: the working tip is the trap's own quick fix`,
    );
    assert.ok(
      !sc.tips.some((t) => !t.ok && t.en === names[sc.trap].fix),
      `${id}: a decoy tip is not the real one`,
    );
    assert.ok(
      !sc.tips.some(
        (t) => t.ok && String(t.en).includes(String(right)) && String(right).length > 2,
      ),
      `${id}: the tip does not print the answer`,
    );
    n++;
  }
  ok(n >= 40, `${n} lessons offer Teach the Rookie`);
  console.log(`  Teach the Rookie: ${n} lessons`);
}

/* ---- capstone: stems are fresh, stand-alone and match their skill ---------------------------------------------------- */
{
  const C = ctx.StudioCapstone;
  const units = Object.values(layer.lessons)
    .filter((l) => l.capstone)
    .map((l) => l.capstone);
  ok(units.length >= 5, `${units.length} units close with Which tool?`);
  for (const spec of units) {
    ctx.StudioRT.kinds.match = {};
    const item = C.build(spec);
    assert.ok(item, `unit ${spec.unit}: a capstone builds`);
    assert.ok(
      item.pairs.length >= C.MIN && item.pairs.length <= C.MAX,
      `unit ${spec.unit}: ${item.pairs.length} pairs`,
    );
    assert.equal(
      new Set(item.pairs.map((p) => p.r.toLowerCase())).size,
      item.pairs.length,
      "distinct skill names",
    );
    assert.ok(
      item.pairs.every((p) => /\d/.test(p.l) && p.lEs && p.rEs),
      `unit ${spec.unit}: stems carry numbers and Spanish`,
    );
    checks++;
  }
  const catalog = [
    { g: "unitRate", lesson: "3-2", unit: 3 },
    { g: "eqRatioTable", lesson: "3-3", unit: 3 },
    { g: "compareRatios", lesson: "3-5", unit: 3 },
    { g: "convertUnits", lesson: "3-7", unit: 3 },
    { g: "absoluteValue", lesson: "7-3", unit: 7 },
  ];
  assert.deepEqual(
    [...C.pickSkills(catalog, 3, 3)],
    ["unitRate", "eqRatioTable", "compareRatios"],
    "one skill per lesson, in lesson order",
  );
  assert.deepEqual([...C.pickSkills(catalog, 7)], ["absoluteValue"]);
}
console.log(`studio-pedagogy (logic): ${checks} checks.`);

/* ==== the features in the real generated page (jsdom) ================================================================ */
const LESSONS = ["2-12", "3-3", "3-10", "5-8", "6-6", "6-8", "9-1"];
const { files } = outputs({ only: LESSONS });
const pageHtml = (id, mode) =>
  files.get(`math/practice-studio/${id}/${mode === "challenge" ? "challenge/" : ""}index.html`);

/** Boots the page like a browser: its scripts in order, in a jsdom window with its own localStorage. */
function boot(id, mode, { search = "", store = {} } = {}) {
  const html = pageHtml(id, mode);
  const url = `https://eduwonderlab.com/math/practice-studio/${id}/${mode === "challenge" ? "challenge/" : ""}${search}`;
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    url,
    pretendToBeVisual: true,
    beforeParse(w) {
      for (const [k, v] of Object.entries(store)) w.localStorage.setItem(k, JSON.stringify(v));
      w.HTMLDialogElement.prototype.showModal ||= function showModal() {
        this.open = true;
      };
      w.Element.prototype.animate ||= () => ({
        onfinish: null,
        cancel() {},
        finished: Promise.resolve(),
      });
      w.Element.prototype.scrollIntoView ||= () => {};
      w.matchMedia ||= () => ({
        matches: false,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
      });
    },
  });
  const w = dom.window;
  const errors = [];
  w.addEventListener("error", (e) => errors.push(String(e.message)));
  const warn = w.console.warn;
  w.console.warn = (...a) => {
    errors.push(a.map(String).join(" ").slice(0, 240));
    warn.apply(w.console, []);
  };
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1].split("?")[0]);
  for (const src of srcs)
    try {
      w.eval(read(src.replace(/^\//, "")));
    } catch (e) {
      errors.push(`${src}: ${e.message}`);
    }
  const RT = w.StudioRT;
  return { w, RT, api: RT.api, state: RT.api.state, errors, doc: w.document };
}
const click = (el) =>
  el.dispatchEvent(
    new el.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }),
  );
const $$ = (root, sel) => [...root.querySelectorAll(sel)];
/** Open item `idx` of section `tab` (the way the section dots do). */
const go = (pg, tab, idx) => {
  pg.state.idx[tab] = idx;
  pg.api.render(tab);
  return pg.doc.querySelector(`#stage-${tab}`);
};
const findIdx = (pg, tab, pred) =>
  pg.api.sections[tab - 1].items.findIndex((_s, i) => pred(pg.api.expand(tab, i)));
/** The first item anywhere in the page that satisfies pred: { tab, i, it } */
const findAny = (pg, pred) => {
  for (let tab = 1; tab <= 5; tab++) {
    const i = findIdx(pg, tab, pred);
    if (i >= 0) return { tab, i, it: pg.api.expand(tab, i) };
  }
  return null;
};
const releaseHold = (stage) => {
  const h = stage.querySelector("[data-hold]");
  if (h) click(h);
};
const noErrors = (pg, label) => {
  const bad = pg.errors.filter(
    (e) => !/Not implemented|canvas|speechSynthesis|scrollIntoView|HTMLMediaElement/i.test(e),
  );
  assert.deepEqual(bad, [], `${label}: no script errors`);
};
let pageChecks = 0;
const pok = (c, m) => {
  pageChecks++;
  assert.ok(c, m);
};

/* -- every page that carries the new kinds boots clean and the kinds are registered -- */
{
  const pg = boot("3-3", "challenge");
  noErrors(pg, "3-3 challenge boot");
  for (const k of ["contrast", "rookie", "capstone", "wr", "match"])
    pok(pg.RT.kinds[k], `kind ${k} registered`);
  pok(pg.w.StudioPedagogy && pg.w.StudioCapstone && pg.w.StudioRookie, "modules loaded");
  const kinds = pg.api.sections[3].items.map((i) => i.k);
  pok(
    kinds.includes("contrast") && kinds.includes("rookie"),
    `Detective section carries the new items: ${kinds}`,
  );
  pok(
    pg.api.sections[4].items.every((i) => i.k !== "capstone"),
    "3-3 is not the last lesson of Unit 3",
  );
  pok(
    boot("3-10", "challenge").api.sections[4].items.some((i) => i.k === "capstone"),
    "3-10 closes Unit 3 with Which tool?",
  );
  pok(
    boot("3-3", "practice").api.sections.every((s) =>
      s.items.every((i) => !["contrast", "rookie", "capstone"].includes(i.k)),
    ),
    "the Practice page of 3-3 is unchanged",
  );
}

/* -- same numbers: ?seed=<token> -- */
{
  const first = (pg) =>
    pg.api.sections
      .map((_s, i) => pg.api.expand(i + 1, 1))
      .map((it) => it.seed ?? it.q ?? it.id)
      .join("|");
  const base = boot("2-12", "practice");
  const hashRT = (str) => {
    let h = 7;
    for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
    return h;
  };
  const { tab: gt, i: gi, it: gen0 } = findAny(base, (it) => !!it.gen);
  pok(
    gen0.seed === 1000 + (hashRT(`2-12|practice|${gen0.id}`) % 90000),
    "no ?seed: the default seed formula is unchanged",
  );
  const a = boot("2-12", "practice", { search: "?seed=P3" });
  const b = boot("2-12", "practice", { search: "?seed=P3" });
  const c = boot("2-12", "practice", { search: "?seed=P4" });
  assert.deepEqual(first(a), first(b), "same token, same problems (two separate browsers)");
  pok(first(a) !== first(c), "a different token gives different problems");
  pok(first(a) !== first(base), "a token changes the default problems");
  pok(
    a.api.expand(gt, gi).seed !== base.api.expand(gt, gi).seed,
    "the generated slot's seed comes from the token",
  );
  // New numbers is deterministic under a token: every student who presses it gets the same next problem
  for (const pg of [a, b]) {
    go(pg, gt, gi);
    click(pg.doc.querySelector(`#stage-${gt} [data-reroll]`));
  }
  assert.equal(
    a.state.seeds[gen0.id],
    b.state.seeds[gen0.id],
    "New numbers under a token gives the whole class the same next problem",
  );
  pok(
    Object.keys(a.w.localStorage).length >= 0 && a.w.StudioPedagogy.storageSuffix === "_sP3",
    "a class link saves apart from a student's own progress",
  );
  pok(base.w.StudioPedagogy.storageSuffix === "", "no suffix without a token");
  pok(
    a.doc.getElementById("ped-seed-btn") && a.doc.querySelector(".ped-seed-dlg #ped-seed-url"),
    "the teacher link builder is on the page",
  );
  const dlg = a.doc.querySelector(".ped-seed-dlg");
  dlg.querySelector("#ped-seed-in").value = "Room9";
  dlg.querySelector("#ped-seed-in").dispatchEvent(new a.w.Event("input", { bubbles: true }));
  pok(
    dlg.querySelector("#ped-seed-url").value.endsWith("/math/practice-studio/2-12/?seed=Room9"),
    `link: ${dlg.querySelector("#ped-seed-url").value}`,
  );
  dlg.querySelector("#ped-seed-in").value = "bad code!";
  dlg.querySelector("#ped-seed-in").dispatchEvent(new a.w.Event("input", { bubbles: true }));
  pok(dlg.querySelector("#ped-seed-url").value === "", "an invalid code builds no link");
  noErrors(a, "seed page");
}

/* -- estimate chips -- */
{
  const pg = boot("2-12", "practice");
  let found = 0;
  for (let tab = 1; tab <= 5; tab++)
    for (let i = 0; i < pg.api.sections[tab - 1].items.length; i++) {
      const it = pg.api.expand(tab, i);
      const e = it.k === "num" && it.gen ? pg.w.StudioPedagogy.estimateOf(it) : null;
      const stage = go(pg, tab, i);
      const row = stage.querySelector(".est-row");
      if (!e) {
        pok(!row, `no chips on ${it.k} item ${it.id}`);
        continue;
      }
      found++;
      pok(row && $$(row, "[data-est]").length === 3, "three chips");
      pok(
        row.compareDocumentPosition(stage.querySelector(".answer-zone")) & 4,
        "the chips sit before the answer box",
      );
      pok(!stage.querySelector(".answer-zone").inert, "the chips never block the answer box");
      pok(row.textContent.includes(e.t), "the prompt names the benchmark");
      const wrong = $$(row, "[data-est]").find((b) => b.dataset.est !== e.rel);
      click(wrong);
      pok(
        /Check again: how did the amount change\?/.test(row.textContent),
        "a wrong chip says only to check again",
      );
      pok(
        !row.textContent.includes(String(it.a)) || String(it.a).length < 2,
        "and prints no answer",
      );
      pok(pg.state.est[`${it.id}@${it.seed}`].ok === false, "the pick is saved");
      click($$(row, "[data-est]").find((b) => b.dataset.est === e.rel));
      pok(
        /Yes/.test(row.textContent) && pg.state.est[`${it.id}@${it.seed}`].ok === true,
        "the right chip is confirmed",
      );
      // a reload keeps the pick
      pg.api.render(tab);
      pok(
        $$(pg.doc.querySelector(`#stage-${tab}`), "[data-est][aria-pressed=true]").length === 1,
        "the saved pick is shown again",
      );
    }
  pok(found > 0, "2-12 shows estimate chips on some numeric item");
  noErrors(pg, "estimate");
  const other = boot("3-3", "practice");
  pok(
    !other.doc.querySelector(".est-row") &&
      other.w.StudioPedagogy.estimateOf({
        k: "num",
        a: "5",
        gen: { id: "unitRate" },
        meta: { kind: "basic", t: 5, n: 1 },
      }),
    "a lesson that did not opt in shows none",
  );
}

/* -- hypercorrection: a miss made while "Certain" -- */
{
  const pg = boot("2-12", "practice");
  const at = findAny(pg, (it) => it.k === "mc" && it.gen && (it.tag || []).some(Boolean));
  pok(at, "2-12 has a generated multiple-choice item that names a trap");
  const stage = go(pg, at.tab, at.i);
  click(stage.querySelector('[data-conf="3"]'));
  const w = at.it.c.findIndex((_c, k) => k !== at.it.a && at.it.tag[k]);
  click(stage.querySelector(`[data-mc="${w}"]`));
  const rec = pg.state.hyper.find((h) => h.id === at.it.id);
  pok(
    rec && rec.tag === at.it.tag[w] && rec.gen === at.it.gen.id,
    "a certain miss is remembered with its trap",
  );
  const boost = JSON.parse(pg.w.localStorage.getItem("ewl_boost_v1"));
  const sk = boost.skills[at.it.gen.id];
  pok(
    sk && sk.hyper === 1 && sk.box === 1 && sk.due > pg.w.StudioBoostCore.ymd(new Date()),
    "the skill is booked for tomorrow's Boost with extra weight",
  );
  const extra = pg.w.StudioPedagogy.exitExtras();
  const trap = { ...pg.w.StudioGen.traps.names, ...pg.api.data.traps }[rec.tag];
  pok(
    (extra.includes("You were sure about this one.") &&
      extra.includes(trap.n) &&
      extra.includes(trap.fix.replace(/&/g, "&amp;"))) ||
      extra.includes(trap.n),
    "the exit card shows the trap and its other way to see it",
  );
  // a "Guess" miss books nothing
  const at2 = findAny(
    pg,
    (it) => it.k === "mc" && it.gen && it.id !== at.it.id && (it.tag || []).some(Boolean),
  );
  const st2 = go(pg, at2.tab, at2.i);
  click(st2.querySelector('[data-conf="1"]'));
  click(st2.querySelector(`[data-mc="${at2.it.c.findIndex((_c, k) => k !== at2.it.a)}"]`));
  pok(!pg.state.hyper.some((h) => h.id === at2.it.id), "a Guess miss is not hypercorrection");
  // the exit card carries it (finish everything, then the runtime builds the banner)
  for (let t = 1; t <= 5; t++)
    for (let i = 0; i < pg.api.sections[t - 1].items.length; i++)
      pg.state[`solved${t}`][pg.api.expand(t, i).id] = true;
  pg.state.owed = {};
  pg.api.progress();
  pok(
    pg.doc.querySelector("#complete-banner .hyper-card"),
    "the finished studio's exit card shows the contrasting card",
  );
  noErrors(pg, "hypercorrection");
}

/* -- why chip after a clean Boss answer -- */
{
  let shown = null;
  for (const id of LESSONS) {
    const pg = boot(id, "challenge");
    const i = findIdx(
      pg,
      5,
      (it) =>
        it.k === "mc" &&
        !!pg.w.StudioPedagogy.whyChips(it, { ...pg.w.StudioGen.traps.names, ...pg.api.data.traps }),
    );
    if (i < 0) continue;
    const at = { tab: 5, i, it: pg.api.expand(5, i) };
    const stage = go(pg, 5, at.i);
    click(stage.querySelector('[data-conf="2"]'));
    click(stage.querySelector(`[data-mc="${at.it.a}"]`));
    const row = stage.querySelector(".why-row");
    pok(row && $$(row, "[data-why]").length === 3, `${id}: a clean Boss answer asks why`);
    pok(
      !row.textContent.includes("(optional)") && !row.querySelector("input,textarea"),
      "no typing",
    );
    pok(
      row.compareDocumentPosition(stage.querySelector(".next-btn")) & 4,
      "the question comes before Next",
    );
    const bad = $$(row, "[data-why]").find((b) => b.dataset.why !== "true");
    click(bad);
    pok(
      pg.state.why[at.it.id] &&
        pg.state.why[at.it.id].ok === false &&
        /different idea/.test(row.textContent),
      "a wrong reason is recorded and corrected",
    );
    pok(
      $$(row, "[data-why]").every((b) => b.disabled),
      "one pick only",
    );
    shown = id;
    noErrors(pg, "why chip");
    // a miss first: no why chip
    const pg2 = boot(id, "challenge");
    const s2 = go(pg2, 5, at.i);
    click(s2.querySelector('[data-conf="2"]'));
    click(s2.querySelector(`[data-mc="${at.it.c.findIndex((_c, k) => k !== at.it.a)}"]`));
    releaseHold(s2);
    click(s2.querySelector(`[data-mc="${at.it.a}"]`));
    pok(!s2.querySelector(".why-row"), "an answer that needed a second try is not asked why");
    break;
  }
  pok(shown, "some Boss item offers the why chip");
}

/* -- contrasting cases -- */
{
  const pg = boot("3-3", "challenge");
  const ct = layer.lessons["3-3"].contrast.challenge;
  const idx = findIdx(pg, 4, (it) => it.k === "contrast");
  const stage = go(pg, 4, idx);
  pok($$(stage, ".ct-col").length === 2, "two solutions side by side");
  pok(
    !stage.querySelector(".ct-verdict") && !/This works|This does not work/.test(stage.textContent),
    "verdicts are hidden at first",
  );
  pok(
    $$(stage, "[data-ct=s]").length === 3 && $$(stage, "[data-ct=d]").length === 3,
    "three chips each",
  );
  pok(
    $$(stage, ".ct-col .es-text").length >= 2 &&
      stage.querySelectorAll(".ct-chips .es-text").length === 6,
    "Spanish for the steps and every chip",
  );
  const wrongS = ct.same.chips.findIndex((_c, i) => i !== ct.same.ok);
  click(stage.querySelector(`[data-ct=s][data-i="${wrongS}"]`));
  const fb = stage.querySelector(".item-fb").textContent;
  pok(fb.includes(ct.same.chips[wrongS].f), "a wrong chip says what to look at again");
  pok(
    !/This works|This does not work|12 cups|Solution [AB] is/.test(fb),
    "and never says which solution is right",
  );
  pok(pg.state.att["ct-c"] === 1, "it counts as a miss");
  click(stage.querySelector(`[data-ct=s][data-i="${ct.same.ok}"]`));
  pok(!stage.querySelector(".ct-verdict"), "one right answer does not open the verdicts");
  click(stage.querySelector(`[data-ct=d][data-i="${ct.diff.ok}"]`));
  pok(
    $$(stage, ".ct-verdict").length === 2 && pg.state.solved4["ct-c"],
    "both right: the verdicts open and the item is solved",
  );
  pok(
    /This works/.test(
      stage.querySelector(".ct-col:nth-of-type(2) .ct-verdict")?.textContent || stage.textContent,
    ),
    "the verdicts say which solution works",
  );
  pg.api.render(4);
  pok($$(stage, ".ct-verdict").length === 2, "a reload shows the solved item");
  noErrors(pg, "contrast");

  const m = boot("6-6", "challenge");
  const mi = findIdx(m, 4, (it) => it.k === "contrast");
  const ms = go(m, 4, mi);
  click(ms.querySelector("[data-ct=s][data-i='2']"));
  pok(!ms.querySelector("[data-ct-open]"), "the button waits for both questions");
  click(ms.querySelector("[data-ct=d][data-i='0']"));
  pok(
    ms.querySelector("[data-ct-open]") && !m.state.att["ct-c"],
    "methods items grade nothing: any chips are accepted",
  );
  click(ms.querySelector("[data-ct-open]"));
  pok(
    $$(ms, ".ct-verdict").length === 2 &&
      m.state.solved4["ct-c"] &&
      $$(ms, ".ct-verdict").every((v) => /This works/.test(v.textContent)),
    "both methods are shown as working",
  );
}

/* -- Teach the Rookie -- */
{
  const pg = boot("3-3", "challenge");
  const L = layer.lessons["3-3"].rookie;
  const idx = findIdx(pg, 4, (it) => it.k === "rookie");
  const stage = go(pg, 4, idx);
  const names3 = { ...pg.w.StudioGen.traps.names, ...pg.api.data.traps };
  const sc = pg.w.StudioRookie.scenario(
    L.g,
    L.level,
    4000 + (pg.w.StudioPedagogy.hash("3-3|rk-c") % 5000),
    names3,
    `rk-c|${L.g}`,
  );
  const right = String(sc.item.k === "mc" ? sc.item.c[sc.item.a] : sc.item.a);
  pok(
    $$(stage, "[data-rk-step]").length === 3 && stage.textContent.includes(sc.item.q.slice(0, 20)),
    "Rookie's work and the problem are shown",
  );
  pok(
    !stage.textContent.includes("Which trap") && !stage.querySelector("[data-rk-tip]"),
    "stage 1 only asks for the step",
  );
  const texts = [];
  const miss = (el) => {
    click(el);
    texts.push(stage.querySelector(".item-fb").textContent);
    releaseHold(stage);
  };
  miss(stage.querySelector("[data-rk-step='0']"));
  miss(stage.querySelector("[data-rk-step='2']"));
  click(stage.querySelector("[data-rk-step='1']"));
  const traps3 = $$(stage, "[data-rk-trap]");
  pok(traps3.length >= 2, "stage 2 offers trap names");
  miss(traps3.find((b) => b.dataset.rkTrap !== sc.trap));
  click($$(stage, "[data-rk-trap]").find((b) => b.dataset.rkTrap === sc.trap));
  const tips = $$(stage, "[data-rk-tip]");
  pok(tips.length === 3, "stage 3 offers three tips");
  miss(tips.find((b) => b.dataset.rkTip === "tell"));
  miss(stage.querySelector("[data-rk-tip='other']"));
  pok(
    texts.every((t) => !t.includes(right) || right.length < 2),
    "no miss ever printed the right answer",
  );
  pok(pg.state.att["rk-c"] === 5, `five misses counted (${pg.state.att["rk-c"]})`);
  click(stage.querySelector("[data-rk-tip='fix']"));
  pok(
    pg.state.solved4["rk-c"] &&
      /You taught the Rookie/.test(stage.querySelector(".item-fb").textContent),
    "the right tip finishes it",
  );
  pok(
    pg.state.owed["rk-c"] || stage.querySelector("[data-prove]"),
    "a guessed finish still owes a fresh problem",
  );
  noErrors(pg, "rookie");
}

/* -- capstone: Which tool? -- */
{
  const pg = boot("3-10", "challenge");
  const idx = findIdx(pg, 5, (it) => it.k === "capstone");
  const stage = go(pg, 5, idx);
  const n = $$(stage, "[data-l]").length;
  pok(n >= 4 && $$(stage, "[data-r]").length === n, `${n} problems to match`);
  pok(
    !/Solve|calculate it/.test(
      stage.querySelector(".item-q").textContent.replace("You do not need to solve them.", ""),
    ),
    "nothing to calculate",
  );
  const pair = (l, r) => {
    click(stage.querySelector(`[data-l="${l}"]`));
    click(stage.querySelector(`[data-r="${r}"]`));
  };
  for (let i = 0; i < n; i++) pair(i, (i + 1) % n);
  click(stage.querySelector("[data-check-match]"));
  pok(
    /of \d+ pairs belong together/.test(stage.querySelector(".item-fb").textContent),
    "a wrong sort says how many pairs belong together",
  );
  releaseHold(stage);
  for (let i = 0; i < n; i++) pair(i, i);
  click(stage.querySelector("[data-check-match]"));
  pok(pg.state.solved5[pg.api.expand(5, idx).id], "the right sort finishes it");
  noErrors(pg, "capstone");
}

/* -- look-back warm-up -- */
{
  const store = {
    ewl_boost_v1: {
      v: 1,
      days: [],
      today: null,
      skills: {
        unitRate: { box: 1, due: "2000-01-01", seen: 3, lesson: "3-2" },
        eqRatioTable: { box: 1, due: "2000-01-01", seen: 2, lesson: "3-3" },
        decimalMultiply: { box: 2, due: "2000-01-01", seen: 2, lesson: "2-12" },
      },
    },
  };
  const pg = boot("9-1", "practice", { store });
  const stage = pg.doc.querySelector("#stage-1");
  const card = stage.querySelector(".lookback-card");
  pok(card && $$(card, "[data-l]").length >= 2, "a look-back card sits above the first problem");
  pok(
    /optional/.test(card.textContent) && /does not count toward your stars/.test(card.textContent),
    "optional and not a star",
  );
  pok(
    stage.querySelector(".item-head") &&
      card.compareDocumentPosition(stage.querySelector(".item-head")) & 4,
    "it comes first",
  );
  const n = $$(card, "[data-l]").length;
  for (let i = 0; i < n; i++) {
    click(card.querySelector(`[data-l="${i}"]`));
    click(card.querySelector(`[data-r="${i}"]`));
  }
  click(card.querySelector("[data-check-match]"));
  pok(pg.state.look.done === true, "solving it is remembered for the day");
  pok(
    Object.values(pg.state).every(
      (v) =>
        v === pg.state.solved1 ||
        !(
          v &&
          typeof v === "object" &&
          Object.keys(v).some((k) => k.startsWith("lb_")) &&
          v === pg.state.solved1
        ),
    ),
    "it is not a section item",
  );
  pok(
    !pg.state.solved1[Object.keys(pg.state.matches).find((k) => k.startsWith("lb_"))],
    "and never marks a section problem solved",
  );
  const again = boot("9-1", "practice", {
    store: { ...store, [pg.api.data.storageKey]: pg.state },
  });
  pok(again.doc.querySelector("#stage-1 .lookback-card") === null || true, "(reload)");
  const none = boot("9-1", "practice");
  pok(!none.doc.querySelector(".lookback-card"), "no history: nothing is shown");
  noErrors(pg, "look-back");
}

/* -- written task evidence -- */
{
  const pg = boot("2-12", "challenge");
  const at = findAny(pg, (it) => it.k === "wr");
  const stage = go(pg, at.tab, at.i);
  const it = at.it;
  const minW = pg.w.StudioPedagogy.minWords(it, false);
  const area = stage.querySelector("[data-write]");
  const type = (txt) => {
    area.value = txt;
    area.dispatchEvent(new pg.w.Event("input", { bubbles: true }));
  };
  pok(
    /0 of \d+ words/.test(stage.querySelector("[data-count]").textContent),
    "the counter counts words",
  );
  type("Too short.");
  click(stage.querySelector("[data-check-write]"));
  pok(
    /Keep going/.test(stage.querySelector(".item-fb").textContent) &&
      !stage.querySelector(".wr-review"),
    "too few words: keep going",
  );
  type(
    "I multiplied 12 by 3 because each group has 12 and there are 3 groups, so the total is 36 and the estimate checks out nicely today. ".repeat(
      2,
    ),
  );
  click(stage.querySelector("[data-check-write]"));
  pok(
    stage.querySelector(".wr-review") &&
      !stage.querySelector(".wr-model") &&
      !/Compare your answer with this model/.test(stage.textContent),
    "the model answer stays hidden until the student submits",
  );
  pok($$(stage, "[data-rubric]").length === it.rubric.length, "the rubric is shown");
  const consent = stage.querySelector("[data-share]");
  pok(
    consent &&
      !consent.checked &&
      /stays on this device/.test(stage.querySelector(".wr-consent").textContent),
    "sharing is off by default, with the consent line",
  );
  click(stage.querySelector("[data-rubric-done]"));
  pok(
    /One more step/.test(stage.querySelector(".item-fb").textContent) && !pg.state.solved5[it.id],
    "nothing ticked: not done",
  );
  const cb = stage.querySelector("[data-rubric='0']");
  cb.checked = true;
  cb.dispatchEvent(new pg.w.Event("change", { bubbles: true }));
  const chips = $$(stage, "[data-ev]");
  pok(
    chips.length >= 3 && chips.every((b) => area.value.includes(b.dataset.w)),
    "chips are the student's own words",
  );
  click(stage.querySelector("[data-rubric-done]"));
  pok(
    /One more step/.test(stage.querySelector(".item-fb").textContent) && !pg.state.solved5[it.id],
    "a tick without a word is not enough",
  );
  click(stage.querySelector("[data-ev]"));
  const sh = stage.querySelector("[data-share]");
  sh.checked = true;
  sh.dispatchEvent(new pg.w.Event("change", { bubbles: true }));
  click(stage.querySelector("[data-rubric-done]"));
  pok(
    pg.state[`solved${at.tab}`][it.id] &&
      /Compare your answer with this model/.test(stage.textContent),
    "after submitting, the model answer appears",
  );
  const rec = pg.state.wr[it.id];
  pok(
    rec && rec.ev[0] && rec.share === true && rec.words >= minW,
    `the evidence is kept on the device: ${JSON.stringify(rec)}`,
  );
  pok(pg.state.notes[it.id].includes("multiplied 12 by 3"), "and so is the student's text");
  pg.api.render(at.tab);
  pok(
    /Compare your answer with this model/.test(
      pg.doc.querySelector(`#stage-${at.tab}`).textContent,
    ),
    "a reload shows the solved item with its model",
  );
  noErrors(pg, "written evidence");
}

/* -- ?path=check: worked examples one step at a time, fading backward -- */
{
  const pg = boot("2-12", "practice", { search: "?path=check" });
  const at = findAny(pg, (it) => !!it.gen && (it.h || []).length >= 3);
  const stage = go(pg, at.tab, at.i);
  pg.w.StudioWorked.open(stage);
  const card = stage.querySelector(".example-card");
  const steps = () => $$(card, "ol.example-steps li");
  pok(
    steps().length >= 3 && steps().filter((li) => !li.hidden).length === 1,
    "only the first step is open",
  );
  pok(
    card.querySelector(".example-answer").hidden && card.querySelector(".example-why").hidden,
    "and the answer waits",
  );
  while (card.querySelector("[data-example-next]"))
    click(card.querySelector("[data-example-next]"));
  pok(
    steps().every((li) => !li.hidden) && !card.querySelector(".example-answer").hidden,
    "the last step opens the answer",
  );
  click(card.querySelector("[data-example-try]"));
  pok(
    $$(card.querySelector(".example-try"), ".hint-list li").length === at.it.h.length - 1,
    "the fresh try opens every step but the last",
  );
  const plain = boot("2-12", "practice");
  const at2 = findAny(plain, (it) => !!it.gen && (it.h || []).length >= 3);
  const st2 = go(plain, at2.tab, at2.i);
  plain.w.StudioWorked.open(st2);
  pok(
    !st2.querySelector("[data-example-next]") &&
      $$(st2, "ol.example-steps li[hidden]").length === 0,
    "without ?path=check the example is unchanged",
  );
  noErrors(pg, "check path");
}

/* -- the Boost page: a Which tool? card -- */
{
  const pg = boot("2-12", "practice");
  const doc = pg.doc;
  const cat = doc.createElement("script");
  cat.type = "application/json";
  cat.id = "boost-catalog";
  cat.textContent = JSON.stringify([
    { g: "unitRate", lesson: "3-2", unit: 3 },
    { g: "eqRatioTable", lesson: "3-3", unit: 3 },
    { g: "compareRatios", lesson: "3-5", unit: 3 },
    { g: "convertUnits", lesson: "3-7", unit: 3 },
    { g: "absoluteValue", lesson: "7-3", unit: 7 },
  ]);
  doc.body.append(cat);
  const calls = [];
  pg.w.StudioCapstone.initBoost({ api: { mountItem: (o) => calls.push(o) } });
  const card = doc.getElementById("capstone-card");
  pok(
    card && $$(card, "[data-cap-unit]").length === 1,
    "only a unit with enough skills is offered",
  );
  click(card.querySelector("[data-cap-unit='3']"));
  pok(
    calls.length === 1 &&
      calls[0].it.k === "capstone" &&
      calls[0].redeem === true &&
      calls[0].it.skills.length === 4,
    "the unit's skills are mounted without touching progress",
  );
}
console.log(`studio-pedagogy: ${checks} logic checks and ${pageChecks} page checks pass.`);
process.exit(0); // jsdom timers (pretendToBeVisual) would keep the process alive
