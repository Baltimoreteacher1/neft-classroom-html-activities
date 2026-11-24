/* Forecast Engine — classroom model.
 * Turns evidence rows into forecasts, groups, backtests, analyses and
 * scenario simulations. No DOM and no storage, so the page, the background
 * worker and the unit tests all call the same functions. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(root.NFEStats);
  else root.NFEModel = factory(root.NFEStats);
})(typeof self !== "undefined" ? self : this, (S) => {
  "use strict";

  const DEFAULTS = {
    method: "smart",
    halfLife: 21, // days until a score counts half as much
    level: 0.9, // confidence level of the range
    horizon: 7, // days ahead of the latest score
    borrow: 0.5, // how much a thin record leans on the class
    target: 70,
  };
  const STATUS = {
    on: "On track",
    watch: "Watch",
    support: "Needs support",
    none: "No data",
  };
  const METHODS = {
    average: "Average of all scores",
    recent: "Recent work counts more",
    trend: "Trend line",
  };
  const VAR_PSEUDO_DF = 3; // how many "virtual" scores the class spread is worth
  const MAX_TREND_POINTS = 20; // trend may never move a forecast more than this
  const DAY_MS = 86400000;

  const r1 = (v) => Math.round(v * 10) / 10;
  const clip = (v) => S.clamp(v, 0, 100);
  const key = (student, code) => `${student}\u0000${code}`;

  /* ── Evidence index ──────────────────────────────────────────────────── */
  function toDay(date) {
    const ms = Date.parse(`${String(date || "").slice(0, 10)}T00:00:00Z`);
    return Number.isFinite(ms) ? Math.floor(ms / DAY_MS) : Number.NaN;
  }
  /** Group evidence by student+standard into time-ordered series. */
  function indexEvidence(evidence) {
    const map = new Map();
    evidence.forEach((row, order) => {
      const k = key(row.student, row.standard);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push({
        id: row.id,
        pct: Number(row.pct),
        date: row.date,
        assessment: row.assessment,
        day: toDay(row.date),
        order,
      });
    });
    map.forEach((rows) => {
      rows.sort((a, b) =>
        Number.isFinite(a.day) && Number.isFinite(b.day) && a.day !== b.day
          ? a.day - b.day
          : a.order - b.order,
      );
      const dated = rows.every((r) => Number.isFinite(r.day));
      rows.forEach((r, i) => {
        r.t = dated ? r.day : i * 7;
      });
    });
    return { map, get: (student, code) => map.get(key(student, code)) || [] };
  }

  /** Class-level facts a thin record can lean on, per standard. */
  function priorsFor(state, ix) {
    const out = {};
    state.standards.forEach(({ code }) => {
      const means = [];
      const withinVar = [];
      let withinDf = 0;
      state.students.forEach((st) => {
        const ys = ix.get(st.id, code).map((r) => r.pct);
        if (!ys.length) return;
        means.push({ m: S.mean(ys), n: ys.length, v: S.variance(ys) });
        if (ys.length > 1) {
          withinVar.push((ys.length - 1) * S.variance(ys));
          withinDf += ys.length - 1;
        }
      });
      const sPool = withinDf >= 3 ? Math.sqrt(S.sum(withinVar) / withinDf) : 12;
      const mu = means.length ? S.mean(means.map((x) => x.m)) : 70;
      let tau2 = 100;
      if (means.length >= 3) {
        const noise = S.mean(means.map((x) => sPool ** 2 / x.n));
        tau2 = Math.max(25, S.variance(means.map((x) => x.m)) - noise);
      }
      out[code] = { mu, sPool: Math.max(4, sPool), tau2, students: means.length };
    });
    return out;
  }

  /* ── The forecast ─────────────────────────────────────────────────────── */
  const num = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : "–");
  const list = (ys) => ys.map((y) => Math.round(y)).join(", ");

  function emptyForecast(target) {
    return { n: 0, status: "none", statusLabel: STATUS.none, prob: 0, target, steps: [] };
  }
  function slopeInfo(series) {
    if (series.length < 2) return { slope: 0, lo: 0, hi: 0, p: Number.NaN, trend: "unclear" };
    const reg = S.linReg(
      series.map((r) => r.t / 7),
      series.map((r) => r.pct),
    );
    if (!reg) return { slope: 0, lo: 0, hi: 0, p: Number.NaN, trend: "unclear" };
    let trend = "unclear";
    let lo = Number.NaN;
    let hi = Number.NaN;
    if (reg.df > 0) {
      const c = S.tCrit(0.8, reg.df);
      lo = reg.slope - c * reg.seSlope;
      hi = reg.slope + c * reg.seSlope;
      trend =
        reg.slopeP < 0.2 && Math.abs(reg.slope) >= 1 ? (reg.slope > 0 ? "up" : "down") : "flat";
    }
    return { slope: reg.slope, lo, hi, p: reg.slopeP, trend, reg };
  }

  /**
   * Forecast one student on one standard.
   * series — ordered rows from indexEvidence; o — options; prior — priorsFor()[code].
   */
  function forecastSeries(series, o = {}, prior = null) {
    const opt = { ...DEFAULTS, ...o };
    const n = series.length;
    if (!n) return emptyForecast(opt.target);
    const ys = series.map((r) => r.pct);
    const tLast = series[n - 1].t;
    const wanted = opt.method === "smart" ? opt.smartMethod || "recent" : opt.method;
    const method = wanted === "trend" && n < 3 ? "recent" : wanted;
    const sPool = prior ? prior.sPool : 12;
    const tau2 = prior ? prior.tau2 : 100;
    const mu0 = prior ? prior.mu : S.mean(ys);
    const hWeeks = opt.horizon / 7;
    const info = slopeInfo(series);

    let m;
    let neff = n;
    let varRaw;
    let dfRaw;
    let mult;
    let weights = null;
    if (method === "trend") {
      const reg = info.reg;
      const move = S.clamp(reg.slope * hWeeks, -MAX_TREND_POINTS, MAX_TREND_POINTS);
      m = reg.predict(tLast / 7) + move;
      varRaw = reg.sigma ** 2;
      dfRaw = reg.df;
      mult = Math.sqrt(1 + 1 / n + (tLast / 7 + hWeeks - reg.xbar) ** 2 / reg.sxx);
    } else if (method === "recent") {
      weights = series.map((r) => 0.5 ** ((tLast - r.t) / opt.halfLife));
      const wSum = S.sum(weights);
      m = S.sum(ys.map((y, i) => y * weights[i])) / wSum;
      neff = wSum ** 2 / S.sum(weights.map((w) => w * w));
      if (neff > 1.0001) {
        const wv = S.sum(ys.map((y, i) => weights[i] * (y - m) ** 2)) / wSum;
        varRaw = (wv * neff) / (neff - 1);
        dfRaw = Math.max(1, neff - 1);
      }
      mult = Math.sqrt(1 + 1 / neff);
    } else {
      m = S.mean(ys);
      varRaw = S.variance(ys);
      dfRaw = n - 1;
      mult = Math.sqrt(1 + 1 / n);
    }
    if (!Number.isFinite(varRaw)) {
      varRaw = 0;
      dfRaw = 0;
    }
    // Lean on the class spread when a record is thin (a few "virtual" scores).
    const dfEff = dfRaw + VAR_PSEUDO_DF;
    const s2 = (dfRaw * varRaw + VAR_PSEUDO_DF * sPool ** 2) / dfEff;
    const se = Math.sqrt(s2) * mult;

    // Lean on the class average a little, more when there are few scores.
    const seMean2 = s2 / Math.max(1, neff);
    const shrink = S.clamp((seMean2 / (seMean2 + tau2)) * opt.borrow, 0, 0.8);
    const proj = (1 - shrink) * m + shrink * mu0;

    const crit = S.tCrit(opt.level, dfEff);
    const prob = S.clamp(1 - S.tCdf((opt.target - proj) / se, dfEff), 0, 1);
    const width = 2 * crit * se;
    const status = prob >= 0.75 ? "on" : prob >= 0.4 ? "watch" : "support";
    const f = {
      n,
      method,
      methodWanted: wanted,
      proj: r1(clip(proj)),
      raw: m,
      lo: r1(clip(proj - crit * se)),
      hi: r1(clip(proj + crit * se)),
      se,
      df: dfEff,
      prob,
      status,
      statusLabel: STATUS[status],
      conf: n < 3 ? "Low" : width <= 14 ? "High" : width <= 26 ? "Medium" : "Low",
      slope: r1(info.slope),
      slopeLo: info.lo,
      slopeHi: info.hi,
      slopeP: info.p,
      trend: info.trend,
      last: ys[n - 1],
      lastDay: series[n - 1].day,
      neff,
      shrink,
      level: opt.level,
      target: opt.target,
      horizon: opt.horizon,
      weights,
      reg: info.reg || null,
    };
    f.steps = explain(f, ys, opt, { sPool, mu0 });
    return f;
  }

  function explain(f, ys, opt, prior) {
    const pctLevel = Math.round(opt.level * 100);
    const steps = [];
    steps.push(`Found ${f.n} score${f.n === 1 ? "" : "s"}: ${list(ys)}.`);
    if (f.method === "average")
      steps.push(
        `Method: plain average. Every score counts the same, so the middle is ${num(f.raw, 1)}%.`,
      );
    if (f.method === "recent") {
      const newest = f.weights[f.weights.length - 1];
      const oldest = f.weights[0];
      steps.push(
        `Method: recent work counts more. A score loses half its weight every ${opt.halfLife} days, so the newest counts ${num(newest / oldest, 1)}× the oldest. The weighted middle is ${num(f.raw, 1)}%.`,
      );
    }
    if (f.method === "trend")
      steps.push(
        `Method: trend line. Scores are moving ${f.slope > 0 ? "up" : f.slope < 0 ? "down" : "nowhere"} about ${num(Math.abs(f.slope), 1)} points a week, and the line is carried ${opt.horizon} days past the latest score.`,
      );
    if (f.methodWanted !== f.method)
      steps.push(
        "A trend line needs at least 3 scores, so recent-work-counts-more was used instead.",
      );
    steps.push(
      f.df - VAR_PSEUDO_DF < 1
        ? `With so few scores we cannot measure this student's ups and downs, so we borrowed the class's typical swing (about ±${num(prior.sPool, 0)} points).`
        : `Scores for this student bounce around by about ±${num(Math.sqrt(f.se ** 2 / (1 + 1 / Math.max(1, f.neff))), 0)} points, blended with the class's typical swing of ±${num(prior.sPool, 0)}.`,
    );
    if (f.shrink > 0.02)
      steps.push(
        `Because the record is short, the forecast leans ${Math.round(f.shrink * 100)}% toward the class average (${num(prior.mu0, 0)}%) so one odd day does not decide it.`,
      );
    steps.push(
      `Forecast: ${f.proj}%. With ${pctLevel}% confidence the next score falls between ${f.lo}% and ${f.hi}%.`,
    );
    steps.push(`Chance of reaching ${opt.target}%: ${Math.round(f.prob * 100)}%.`);
    return steps;
  }

  /* ── Whole-class grid, backtest, groups ──────────────────────────────── */
  const pickSmart = (state, opt) => backtest(state, opt).best;

  function classGrid(state, o = {}) {
    const ix = indexEvidence(state.evidence);
    const priors = priorsFor(state, ix);
    const opt = { ...DEFAULTS, ...o };
    if (opt.method === "smart" && !opt.smartMethod) opt.smartMethod = pickSmart(state, opt);
    const rows = state.students.map((student) => ({
      student,
      cells: state.standards.map((standard) => ({
        standard,
        f: forecastSeries(ix.get(student.id, standard.code), opt, priors[standard.code]),
      })),
    }));
    return { rows, priors, opt, ix };
  }

  /**
   * Hide the newest score of every record with 3+ scores, forecast it with each
   * method, and see which method was closest. Also checks whether the stated
   * range really caught the hidden score as often as it claims.
   */
  function backtest(state, o = {}) {
    const opt = { ...DEFAULTS, ...o, method: "recent" };
    const full = indexEvidence(state.evidence);
    const hidden = new Set();
    const cases = [];
    full.map.forEach((rows, k) => {
      if (rows.length < 3) return;
      const last = rows[rows.length - 1];
      hidden.add(last.id);
      cases.push({
        k,
        rows: rows.slice(0, -1),
        actual: last.pct,
        gap: Math.max(1, last.t - rows[rows.length - 2].t),
      });
    });
    const out = { cases: cases.length, methods: {}, best: "recent", enough: cases.length >= 5 };
    if (!cases.length) return out;
    const train = indexEvidence(state.evidence.filter((e) => !hidden.has(e.id)));
    const priors = priorsFor(state, train);
    const score = (name, fn) => {
      const errs = [];
      let hit = 0;
      cases.forEach((c) => {
        const code = c.k.split("\u0000")[1];
        const f = fn(c, code);
        errs.push(f.proj - c.actual);
        if (f.lo !== undefined && c.actual >= f.lo && c.actual <= f.hi) hit += 1;
      });
      out.methods[name] = {
        mae: S.mean(errs.map(Math.abs)),
        rmse: Math.sqrt(S.mean(errs.map((e) => e * e))),
        bias: S.mean(errs),
        coverage: hit / cases.length,
      };
    };
    Object.keys(METHODS).forEach((m) =>
      score(m, (c, code) =>
        forecastSeries(c.rows, { ...opt, method: m, horizon: c.gap }, priors[code]),
      ),
    );
    const lastOnly = (c) => ({ proj: c.rows[c.rows.length - 1].pct });
    score("last", (c) => lastOnly(c));
    delete out.methods.last.coverage;
    const ranked = Object.keys(METHODS).sort((a, b) => out.methods[a].mae - out.methods[b].mae);
    if (out.enough) out.best = ranked[0];
    out.ranked = ranked;
    out.skill = 1 - out.methods[out.best].mae / (out.methods.last.mae || 1);
    return out;
  }

  /** Students whose forecast sits below the target, per standard, weakest first. */
  function supportGroups(grid, target) {
    return grid.rows
      .reduce((acc, row) => {
        row.cells.forEach((c) => {
          if (!c.f.n || c.f.proj >= target) return;
          let g = acc.find((x) => x.standard.code === c.standard.code);
          if (!g) acc.push((g = { standard: c.standard, kids: [] }));
          g.kids.push({ student: row.student, f: c.f });
        });
        return acc;
      }, [])
      .map((g) => ({ ...g, kids: g.kids.sort((a, b) => a.f.proj - b.f.proj) }))
      .sort((a, b) => b.kids.length - a.kids.length);
  }

  /** Fit as many small-group sessions as the week allows, biggest need first. */
  function resourcePlan(groups, target, { cap, minutes, slots }) {
    const sessions = [];
    groups.forEach((g) => {
      for (let i = 0; i < g.kids.length; i += cap) {
        const kids = g.kids.slice(i, i + cap);
        sessions.push({
          standard: g.standard,
          kids,
          minutes,
          need: S.sum(kids.map((k) => target - k.f.proj)),
        });
      }
    });
    sessions.sort((a, b) => b.need - a.need);
    const planned = sessions.slice(0, Math.max(0, slots));
    const covered = new Set();
    planned.forEach((s) => s.kids.forEach((k) => covered.add(k.student.id)));
    const wanted = new Set();
    groups.forEach((g) => g.kids.forEach((k) => wanted.add(k.student.id)));
    return {
      planned,
      waiting: sessions.slice(planned.length),
      studentsCovered: covered.size,
      studentsNeeding: wanted.size,
      minutesUsed: planned.length * minutes,
      minutesWanted: sessions.length * minutes,
    };
  }

  /* ── Scenario simulation ─────────────────────────────────────────────── */
  /**
   * Monte Carlo: draw every student's next score from their own forecast range,
   * with and without an intervention, using the SAME random draws for both so
   * the difference shown is the intervention and not luck.
   */
  function simulate(state, p, o = {}) {
    const opt = { ...DEFAULTS, ...o, target: p.target, horizon: p.weeks * 7 };
    const ix = indexEvidence(state.evidence);
    const priors = priorsFor(state, ix);
    if (opt.method === "smart" && !opt.smartMethod) opt.smartMethod = pickSmart(state, opt);
    const standards =
      p.standard === "all" ? state.standards : state.standards.filter((s) => s.code === p.standard);
    const cells = [];
    state.students.forEach((st) => {
      standards.forEach((sd) => {
        const f = forecastSeries(ix.get(st.id, sd.code), opt, priors[sd.code]);
        if (f.n) cells.push({ student: st, code: sd.code, f });
      });
    });
    const rng = S.mulberry32(p.seed);
    const sims = p.sims || 2000;
    const baseRates = [];
    const scenRates = [];
    const baseMet = new Array(cells.length).fill(0);
    const scenMet = new Array(cells.length).fill(0);
    const targeted = cells.map((c) =>
      p.scope === "all"
        ? true
        : p.scope === "near"
          ? c.f.proj < p.target && c.f.proj >= p.target - 15
          : c.f.proj < p.target,
    );
    for (let s = 0; s < sims; s += 1) {
      const effect = Math.max(0, 1 + 0.35 * S.randNormal(rng));
      let b = 0;
      let sc = 0;
      for (let i = 0; i < cells.length; i += 1) {
        const f = cells[i].f;
        const y = f.proj + f.se * S.randT(rng, f.df);
        const received = targeted[i] && rng() < p.participation;
        const lift = received ? p.gain * effect : 0;
        if (y >= p.target) {
          b += 1;
          baseMet[i] += 1;
        }
        if (y + lift >= p.target) {
          sc += 1;
          scenMet[i] += 1;
        }
      }
      baseRates.push((100 * b) / Math.max(1, cells.length));
      scenRates.push((100 * sc) / Math.max(1, cells.length));
    }
    const sum = (arr) => ({
      mean: S.mean(arr),
      p10: S.quantile(arr, 0.1),
      p50: S.quantile(arr, 0.5),
      p90: S.quantile(arr, 0.9),
      hist: S.histogram(arr, 5, 0, 105),
      sims: arr.length,
    });
    const delta = scenRates.map((v, i) => v - baseRates[i]);
    const nTargeted = targeted.filter(Boolean).length;
    const perStandard = new Map();
    cells.forEach((c, i) => {
      if (targeted[i]) perStandard.set(c.code, (perStandard.get(c.code) || 0) + 1);
    });
    const slotsNeeded = S.sum(
      [...perStandard.values()].map((k) => Math.ceil(k / Math.max(1, p.cap))),
    );
    const minutes = slotsNeeded * p.minutesPerSession * p.sessionsPerWeek * p.weeks;
    const extraCells = (S.mean(delta) / 100) * cells.length;
    return {
      cells: cells.length,
      targeted: nTargeted,
      sims,
      base: sum(baseRates),
      scen: sum(scenRates),
      delta: { ...sum(delta), probBetter: delta.filter((d) => d > 0).length / sims },
      goalProb: scenRates.filter((v) => v >= p.goal).length / sims,
      baseGoalProb: baseRates.filter((v) => v >= p.goal).length / sims,
      extra: {
        mean: extraCells,
        lo: (S.quantile(delta, 0.1) / 100) * cells.length,
        hi: (S.quantile(delta, 0.9) / 100) * cells.length,
      },
      minutes,
      minutesPerExtra: extraCells > 0.05 ? minutes / extraCells : Number.NaN,
      students: cells
        .map((c, i) => ({
          student: c.student,
          code: c.code,
          p0: baseMet[i] / sims,
          p1: scenMet[i] / sims,
          targeted: targeted[i],
        }))
        .sort((a, b) => b.p1 - b.p0 - (a.p1 - a.p0)),
    };
  }

  /* ── Analysis ─────────────────────────────────────────────────────────── */
  function studentMeans(state, ix, code) {
    const out = [];
    state.students.forEach((st) => {
      const rows =
        code === "all"
          ? state.standards.flatMap((sd) => ix.get(st.id, sd.code))
          : ix.get(st.id, code);
      if (rows.length)
        out.push({ student: st, mean: S.mean(rows.map((r) => r.pct)), n: rows.length });
    });
    return out;
  }
  function standardSummaries(state, o = {}) {
    const opt = { ...DEFAULTS, ...o };
    const ix = indexEvidence(state.evidence);
    return state.standards.map((standard) => {
      const means = studentMeans(state, ix, standard.code).map((x) => x.mean);
      const ci = S.meanCI(means, opt.level);
      const k = means.filter((m) => m >= opt.target).length;
      return {
        standard,
        n: means.length,
        scores: S.sum(state.students.map((st) => ix.get(st.id, standard.code).length)),
        ...ci,
        box: S.boxStats(means),
        atTarget: { k, ...S.wilson(k, means.length, opt.level) },
      };
    });
  }
  /** Class average at each assessment date, with its uncertainty band. */
  function growth(state, code, level = 0.9) {
    const byDate = new Map();
    state.evidence.forEach((e) => {
      if (code !== "all" && e.standard !== code) return;
      if (!byDate.has(e.date)) byDate.set(e.date, { date: e.date, ys: [], names: new Set() });
      const d = byDate.get(e.date);
      d.ys.push(Number(e.pct));
      d.names.add(e.assessment);
    });
    return [...byDate.values()]
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((d) => ({
        date: d.date,
        assessment: [...d.names].join(" + "),
        ...S.meanCI(d.ys, level),
      }));
  }
  function correlation(state, a, b) {
    const ix = indexEvidence(state.evidence);
    const ma = new Map(studentMeans(state, ix, a).map((x) => [x.student.id, x]));
    const pairs = studentMeans(state, ix, b)
      .filter((x) => ma.has(x.student.id))
      .map((x) => ({ student: x.student, x: ma.get(x.student.id).mean, y: x.mean }));
    const r = S.pearson(
      pairs.map((p) => p.x),
      pairs.map((p) => p.y),
    );
    return { pairs, r };
  }
  function compareStandards(state, a, b, level = 0.95) {
    const ix = indexEvidence(state.evidence);
    const ma = new Map(studentMeans(state, ix, a).map((x) => [x.student.id, x.mean]));
    const both = studentMeans(state, ix, b).filter((x) => ma.has(x.student.id));
    const xs = both.map((x) => ma.get(x.student.id));
    const ys = both.map((x) => x.mean);
    return { n: both.length, test: S.pairedT(xs, ys, level), meanA: S.mean(xs), meanB: S.mean(ys) };
  }
  function tagList(state) {
    const tags = new Set();
    state.students.forEach((s) =>
      String(s.tags || "")
        .split(/[,;/]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => tags.add(t)),
    );
    return [...tags].sort();
  }
  /** Equity check: how a support group's average compares with everyone else. */
  function compareTag(state, tag, code, level = 0.95) {
    const ix = indexEvidence(state.evidence);
    const has = (s) =>
      String(s.tags || "")
        .split(/[,;/]+/)
        .map((t) => t.trim().toLowerCase())
        .includes(tag.toLowerCase());
    const rows = studentMeans(state, ix, code);
    const a = rows.filter((x) => has(x.student)).map((x) => x.mean);
    const b = rows.filter((x) => !has(x.student)).map((x) => x.mean);
    return {
      a,
      b,
      test: a.length >= 3 && b.length >= 3 ? S.welch(a, b, level) : null,
      g: a.length >= 3 && b.length >= 3 ? S.hedgesG(a, b) : null,
    };
  }
  /** Scores far from a student's own pattern: likely typos or a very bad day. */
  function outliers(state) {
    const ix = indexEvidence(state.evidence);
    const found = [];
    ix.map.forEach((rows, k) => {
      if (rows.length < 3) return;
      const [student, standard] = k.split("\u0000");
      rows.forEach((r) => {
        const others = rows.filter((x) => x !== r).map((x) => x.pct);
        const med = S.median(others);
        const spread = Math.max(6, S.madSd(others) || 0);
        const z = (r.pct - med) / spread;
        if (Math.abs(z) > 3 && Math.abs(r.pct - med) >= 20)
          found.push({ id: r.id, student, standard, date: r.date, pct: r.pct, expected: med, z });
      });
    });
    return found.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  }
  /** How complete the evidence is: 3+ scores per student and standard. */
  function coverage(state) {
    const ix = indexEvidence(state.evidence);
    let cells = 0;
    let ready = 0;
    let some = 0;
    state.students.forEach((st) =>
      state.standards.forEach((sd) => {
        cells += 1;
        const n = ix.get(st.id, sd.code).length;
        if (n >= 3) ready += 1;
        if (n >= 1) some += 1;
      }),
    );
    return { cells, ready, some, pct: cells ? Math.round((100 * ready) / cells) : 0 };
  }

  return {
    DEFAULTS,
    STATUS,
    METHODS,
    indexEvidence,
    priorsFor,
    forecastSeries,
    classGrid,
    backtest,
    supportGroups,
    resourcePlan,
    simulate,
    studentMeans,
    standardSummaries,
    growth,
    correlation,
    compareStandards,
    tagList,
    compareTag,
    outliers,
    coverage,
  };
});
