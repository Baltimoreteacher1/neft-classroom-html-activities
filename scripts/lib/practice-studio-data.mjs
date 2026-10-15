// Contract checks for data/practice-studio/<lesson>.json (docs/specs/practice-studio-v2.md section 7).
// Pure functions: validateLessonData(id, data) -> string[] of problems (empty = clean).

export const GEN_IDS = new Set(
  `dotplotRead histogramRead medianFind meanFind meanMissing rangeIqr boxplotRead madCalc chooseMeasure
longDivision decimalDivision decimalAddSub decimalMultiply factorsMultiples lcmFind gcfFind primeFactorization exponentEval orderOfOps
fracDivWhole fracDivMixed wholeDivFrac mixedDivide fracDivWord
ratioWrite unitRate eqRatioTable ratioGraphRead compareRatios convertUnits convertBetween unitRateWord eqRatioMissing
areaParallelogram areaTriangle areaTrapezoid areaComposite volumePrism surfaceAreaPrism surfaceAreaPyramid areaRegularPolygon
evalExpression equivalentExpr combineLikeTerms distribute simplifyExpr solutionCheck solveAddSub solveMulDiv writeInequality
ineqSolutionCheck solveInequality writeEquationWord twoVarTable graphRelationship twoVarProblem
integerOpposites rationalNumberLine absoluteValue compareOrder quadrantId coordDistance polygonCoordinates reflectPoint`.split(
    /\s+/,
  ),
);
export const ACT_KINDS = new Set(
  "plot nline ineq sizer areabox barcut ldiv dotbalance chartbuild ratiomix convchain balance ftree hops tiles".split(
    " ",
  ),
);
export const VIZ_TYPES = new Set(
  "dots hist box bars coord nline shape prism tape dnl table bar1".split(" "),
);
export const WORLD_IDS = new Set(
  "reef orbit trail kitchen studio arcade lab harbor garden sports mystery workshop".split(" "),
);

const PICTURE_WORDS =
  /\b(the (picture|diagram|graph|figure|image|table|plot|number line|box plot|histogram|dot plot|net)\b|shown (above|below)|see (above|below)|in the (picture|diagram|graph|figure))/i;
const TIMER_WORDS =
  /\b(timer|countdown|count down|beat the clock|seconds left|race against the clock|against the clock)\b/i;
const BAD_TIMES = /\d\s[x*]\s\d/;
const str = (v, min = 2) => typeof v === "string" && v.trim().length >= min;
const num = (v) => {
  const t = String(v ?? "")
    .trim()
    .replace(/[$,%\s]/g, "")
    .replace(/−/g, "-");
  if (/^-?\d+\s*\/\s*\d+$/.test(t)) return true;
  if (/^-?\d+\s+\d+\/\d+$/.test(String(v).trim())) return true;
  return /^-?(\d+\.?\d*|\.\d+)$/.test(t);
};

/** Problems with one authored item. */
export function itemProblems(it, where, { needViz = true } = {}) {
  const p = [];
  const bad = (m) => p.push(`${where}: ${m}`);
  if (!it || typeof it !== "object") return [`${where}: not an object`];
  const k = it.k;
  const hints = (h) => {
    if (!Array.isArray(h) || h.length < 2 || h.length > 3 || h.some((x) => !str(x, 4)))
      bad("needs a hint ladder h[] of 2-3 hints");
  };
  const words = [it.q, it.p, it.t, it.x, ...(it.h || []), ...(it.f || [])]
    .filter(Boolean)
    .join(" ");
  if (TIMER_WORDS.test(words)) bad("timer language is banned");
  if (BAD_TIMES.test(words)) bad('use "×" between numbers, not "x" or "*"');
  const stem = [it.q, it.p, it.t].filter(Boolean).join(" ");
  if (needViz && PICTURE_WORDS.test(stem) && !it.viz && k !== "act")
    bad('mentions a figure ("the diagram/graph/table…") but has no viz');
  if (it.viz && !VIZ_TYPES.has(it.viz.t)) bad(`unknown viz type "${it.viz.t}"`);
  switch (k) {
    case "mc": {
      if (!str(it.q) || !str(it.qEs)) bad("needs q and qEs");
      if (!Array.isArray(it.c) || it.c.length < 2 || it.c.length > 5) bad("needs 2-5 choices");
      else {
        if (new Set(it.c.map((c) => String(c).trim().toLowerCase())).size !== it.c.length)
          bad("duplicate choices");
        if (!Number.isInteger(it.a) || it.a < 0 || it.a >= it.c.length)
          bad("answer index out of range");
        if (!Array.isArray(it.f) || it.f.length !== it.c.length) bad("f[] must align with c[]");
        else
          it.f.forEach(
            (f, i) => i !== it.a && !str(f, 8) && bad(`choice ${i} has no feedback line`),
          );
        if (Array.isArray(it.f) && it.f[it.a]) bad("the right choice must have empty feedback");
        if (it.tag && (!Array.isArray(it.tag) || it.tag.length !== it.c.length))
          bad("tag[] must align with c[]");
        if (it.cEs && (!Array.isArray(it.cEs) || it.cEs.length !== it.c.length))
          bad("cEs[] must align with c[]");
        const right = String(it.c[it.a] ?? "")
          .trim()
          .toLowerCase();
        if (right.length >= 3 && (it.h || []).some((h) => String(h).toLowerCase().includes(right)))
          bad("a hint contains the right answer text");
      }
      if (!str(it.x) || !str(it.xEs)) bad("needs x and xEs");
      hints(it.h);
      break;
    }
    case "num": {
      if (!str(it.q) || !str(it.qEs)) bad("needs q and qEs");
      if (!num(it.a)) bad(`answer "${it.a}" is not numeric`);
      if (!str(it.x) || !str(it.xEs)) bad("needs x and xEs");
      hints(it.h);
      if (
        num(it.a) &&
        String(it.a).length >= 2 &&
        (it.h || []).some((h) =>
          new RegExp(
            `(^|[^\\d.])${String(it.a).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\d]|$)`,
          ).test(h),
        )
      )
        bad("a hint states the answer");
      break;
    }
    case "err": {
      if (!str(it.t) || !str(it.tEs)) bad("needs t and tEs");
      if (!Array.isArray(it.s) || it.s.length < 3 || it.s.some((s) => !str(s.l, 1) || !str(s.w, 1)))
        bad("needs 3+ steps with l and w");
      else if (!Number.isInteger(it.e) || it.e < 0 || it.e >= it.s.length)
        bad("errorStep e out of range");
      if (!str(it.fix) || !str(it.x) || !str(it.xEs)) bad("needs fix, x and xEs");
      hints(it.h);
      break;
    }
    case "tbl": {
      if (!str(it.t) || !str(it.tEs)) bad("needs t and tEs");
      if (
        !Array.isArray(it.hd) ||
        !Array.isArray(it.rows) ||
        !Array.isArray(it.cells) ||
        !it.cells.length
      )
        bad("table shape");
      else
        for (const c of it.cells) {
          if (!it.rows[c.r] || c.c < 0 || c.c >= it.hd.length || !str(String(c.a), 1))
            bad("cell out of range");
          else if (String(it.rows[c.r][c.c] ?? "").trim() !== "")
            bad(`cell ${c.r}:${c.c} is already filled`);
        }
      if (!str(it.x) || !str(it.xEs)) bad("needs x and xEs");
      hints(it.h);
      break;
    }
    case "wr": {
      if (!str(it.p) || !str(it.pEs)) bad("needs p and pEs");
      if (!Number.isInteger(it.min) || it.min < 30) bad("min must be an integer >= 30");
      if (!Array.isArray(it.rubric) || it.rubric.length < 3 || it.rubric.length > 4)
        bad("needs a 3-4 line rubric[]");
      if (!Array.isArray(it.kw)) bad("needs kw[]");
      if (!str(it.x) || !str(it.xEs)) bad("needs a model answer x and xEs");
      hints(it.h);
      break;
    }
    case "sort": {
      if (!str(it.q) || !str(it.qEs)) bad("needs q and qEs");
      if (!Array.isArray(it.bins) || it.bins.length < 2 || it.bins.length > 4)
        bad("needs 2-4 bins");
      else {
        if (!Array.isArray(it.cards) || it.cards.length < 4 || it.cards.length > 8)
          bad("needs 4-8 cards");
        else {
          for (const c of it.cards)
            if (!str(c.t, 1) || !Number.isInteger(c.b) || c.b < 0 || c.b >= it.bins.length)
              bad("card needs t and a valid bin b");
          for (let b = 0; b < it.bins.length; b++)
            if (!it.cards.some((c) => c.b === b)) bad(`bin ${b} receives no card`);
        }
        if (it.bins.some((b) => !str(b.l, 1) || !str(b.lEs, 1))) bad("bins need l and lEs");
      }
      if (!str(it.x) || !str(it.xEs)) bad("needs x and xEs");
      hints(it.h);
      break;
    }
    case "match": {
      if (!str(it.q) || !str(it.qEs)) bad("needs q and qEs");
      if (!Array.isArray(it.pairs) || it.pairs.length < 3 || it.pairs.length > 6)
        bad("needs 3-6 pairs");
      else {
        if (it.pairs.some((x) => !str(x.l, 1) || !str(x.r, 1))) bad("pairs need l and r");
        if (new Set(it.pairs.map((x) => String(x.r).toLowerCase())).size !== it.pairs.length)
          bad("duplicate right-hand sides");
      }
      if (!str(it.x) || !str(it.xEs)) bad("needs x and xEs");
      hints(it.h);
      break;
    }
    case "nline": {
      if (!str(it.q) || !str(it.qEs)) bad("needs q and qEs");
      if (!(it.min < it.max) || !(it.step > 0) || !(it.a >= it.min && it.a <= it.max))
        bad("min/max/step/a inconsistent");
      if (!str(it.x) || !str(it.xEs)) bad("needs x and xEs");
      hints(it.h);
      break;
    }
    case "gen":
      if (!GEN_IDS.has(it.g)) bad(`unknown generator "${it.g}"`);
      if (![1, 2, 3, 4].includes(it.level)) bad("level must be 1-4");
      break;
    case "act":
      if (!ACT_KINDS.has(it.kind)) bad(`unknown activity "${it.kind}"`);
      if (![1, 2, 3, 4].includes(it.level)) bad("level must be 1-4");
      break;
    case "pool":
      if (!Array.isArray(it.items) || it.items.length < 8) bad("a pool needs 8+ items");
      else
        it.items.forEach((q, i) => p.push(...itemProblems(q, `${where}.items[${i}]`, { needViz })));
      break;
    default:
      bad(`unknown item kind "${k}"`);
  }
  return p;
}

const count = (a, n, where, p) => {
  if (!Array.isArray(a) || a.length !== n)
    p.push(`${where}: needs exactly ${n} items, has ${Array.isArray(a) ? a.length : "none"}`);
  return Array.isArray(a) ? a : [];
};

/** Problems with a whole lesson file. */
export function validateLessonData(id, data, worlds = null) {
  const p = [];
  if (!data || typeof data !== "object") return [`${id}: file is not an object`];
  if (data.v !== 1) p.push(`${id}: v must be 1`);
  if (data.lesson !== id) p.push(`${id}: lesson field must be "${id}"`);
  for (const f of ["story", "storyEs", "challengeStory", "challengeStoryEs"])
    if (!str(data[f], 30) || data[f].length > 360) p.push(`${id}: ${f} must be 30-360 characters`);
  if (worlds && !WORLD_IDS.has(worlds.lessons?.[id]))
    p.push(`${id}: no world assigned in worlds.json`);

  if (data.getReady !== null) {
    count(data.getReady, 4, `${id}.getReady`, p).forEach((it, i) =>
      p.push(...itemProblems(it, `${id}.getReady[${i}]`)),
    );
    if (!str(data.getReadyWhy, 40))
      p.push(`${id}: getReadyWhy (40+ chars) is required when getReady is replaced`);
  }

  // Lessons with no generator in the catalogue (pool-only) give { pool: [14+ items], slots: 7 } instead of a list.
  const poolOnly = (v, n, where) => {
    if (!v || Array.isArray(v) || !Array.isArray(v.pool)) return false;
    if (v.slots !== n) p.push(`${where}: slots must be ${n}`);
    if (v.pool.length < n * 2) p.push(`${where}: pool needs ${n * 2}+ items`);
    v.pool.forEach((it, i) => {
      if (!["mc", "num", "sort", "match", "nline", "err", "tbl"].includes(it?.k))
        p.push(`${where}.pool[${i}]: kind ${it?.k} not allowed in a pool`);
      else p.push(...itemProblems(it, `${where}.pool[${i}]`));
    });
    return true;
  };
  const specs = poolOnly(data.fresh, 7, `${id}.fresh`)
    ? []
    : count(data.fresh, 7, `${id}.fresh`, p);
  specs.forEach((it, i) => p.push(...itemProblems(it, `${id}.fresh[${i}]`)));
  if (specs.length === 7) {
    const acts = specs.filter((s) => s.k === "act");
    if (acts.length > 1) p.push(`${id}.fresh: at most one act (the last item)`);
    if (specs.some((s, i) => s.k === "act" && i !== 6))
      p.push(`${id}.fresh: the act must be the 7th item`);
    const lv = specs.filter((s) => s.k === "gen").map((s) => s.level);
    if (lv.some((l, i) => i && l < lv[i - 1])) p.push(`${id}.fresh: gen levels must not decrease`);
  }

  const c = data.challenge || {};
  const climb = poolOnly(c.climb, 6, `${id}.challenge.climb`)
    ? []
    : count(c.climb, 6, `${id}.challenge.climb`, p);
  climb.forEach((it, i) => {
    p.push(...itemProblems(it, `${id}.challenge.climb[${i}]`));
    if ((it.k === "gen" || it.k === "act") && it.level < 2)
      p.push(`${id}.challenge.climb[${i}]: levels start at 2`);
  });
  count(c.missions, 4, `${id}.challenge.missions`, p).forEach((it, i) => {
    p.push(...itemProblems(it, `${id}.challenge.missions[${i}]`));
    if (!["mc", "num", "tbl"].includes(it.k))
      p.push(`${id}.challenge.missions[${i}]: must be mc, num or tbl`);
  });
  const lab = count(c.lab, 3, `${id}.challenge.lab`, p);
  lab.forEach((it, i) => p.push(...itemProblems(it, `${id}.challenge.lab[${i}]`)));
  if (lab.length === 3) {
    const acts = lab.filter((x) => x.k === "act").length;
    const other = lab.filter((x) => ["sort", "match"].includes(x.k)).length;
    const lessonHasAct = data.noAct === true;
    if (!lessonHasAct && (acts !== 2 || other !== 1))
      p.push(
        `${id}.challenge.lab: needs 2 act + 1 sort/match (set "noAct": true only for lessons with no activity in the catalogue table)`,
      );
    if (lessonHasAct && other < 1)
      p.push(`${id}.challenge.lab: noAct lessons need sort/match/nline items`);
  }
  const det = count(c.detective, 4, `${id}.challenge.detective`, p);
  det.forEach((it, i) => p.push(...itemProblems(it, `${id}.challenge.detective[${i}]`)));
  if (
    det.length === 4 &&
    (det.filter((x) => x.k === "err").length !== 3 || det.filter((x) => x.k === "mc").length !== 1)
  )
    p.push(`${id}.challenge.detective: needs 3 err + 1 mc`);
  const boss = count(c.boss, 6, `${id}.challenge.boss`, p);
  boss.forEach((it, i) => p.push(...itemProblems(it, `${id}.challenge.boss[${i}]`)));
  if (boss.length === 6) {
    if (boss.slice(0, 5).some((x) => !["mc", "num"].includes(x.k)))
      p.push(`${id}.challenge.boss: first five must be mc/num`);
    if (boss[5].k !== "wr") p.push(`${id}.challenge.boss: sixth must be wr`);
  }

  if (data.mastery !== undefined) {
    if (!Array.isArray(data.mastery) || data.mastery.length > 2) p.push(`${id}.mastery: 0-2 items`);
    else data.mastery.forEach((it, i) => p.push(...itemProblems(it, `${id}.mastery[${i}]`)));
  }
  if (!Array.isArray(data.glossary) || data.glossary.length < 3 || data.glossary.length > 5)
    p.push(`${id}.glossary: 3-5 entries`);
  else
    data.glossary.forEach(
      (g, i) =>
        (!str(g.t, 1) || !str(g.tEs, 1) || !str(g.d, 8) || !str(g.dEs, 8)) &&
        p.push(`${id}.glossary[${i}]: needs t, tEs, d, dEs`),
    );

  // answer positions across every authored mc in the file
  const all = [];
  const walk = (x) =>
    Array.isArray(x)
      ? x.forEach(walk)
      : x && typeof x === "object"
        ? (x.k === "mc" && Number.isInteger(x.a) && all.push(x), x.items && walk(x.items))
        : 0;
  walk([
    data.getReady,
    data.fresh,
    data.fresh?.pool,
    c.climb,
    c.climb?.pool,
    c.missions,
    c.lab,
    c.detective,
    c.boss,
    data.mastery,
  ]);
  const four = all.filter((x) => x.c?.length === 4);
  if (four.length >= 8) {
    const pos = [0, 1, 2, 3].map((i) => four.filter((x) => x.a === i).length);
    if (pos.some((n) => n === 0 || n / four.length > 0.4))
      p.push(
        `${id}: answer positions are skewed (${pos.join("/")} across ${four.length} four-choice items)`,
      );
  }
  return p;
}
