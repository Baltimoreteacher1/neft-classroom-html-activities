/* Wildlife Signal — the pure mathematics behind the Data Dash expedition.
 * No Phaser here: data generators, statistics, answer judging and the misconception
 * classifier, so they can be tested in Node (window.DD_MISSIONS.math).
 * Builders: expedition-missions.js (survey, histogram, balance) and
 * expedition-plots.js (boxplot, report). World + def: expedition.js.
 */
(function () {
  "use strict";
  const L = (en, es) => ({ en, es });
  const fmt = (v) => (Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2))));
  const near = (a, b) => a != null && b != null && Math.abs(a - b) < 1e-9;
  const sortN = (a) => a.slice().sort((x, y) => x - y);
  const total = (a) => a.reduce((s, v) => s + v, 0);
  const mean = (a) => total(a) / a.length;
  /** Fill {name} placeholders in both languages. */
  const fill = (msg, vars) => {
    const f = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    return { en: f(msg.en), es: f(msg.es) };
  };
  /** Typed text → number, or null when empty / not a number. */
  const num = (s) => {
    if (s == null || s === "" || s === "-" || s === "." || s === "-.") return null;
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
  };

  function median(vals) {
    const s = sortN(vals);
    const n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  /** Reveal Math convention: for an odd count the median is left out of both halves. */
  function quartiles(vals, inclusive) {
    const s = sortN(vals);
    const n = s.length;
    const h = Math.floor(n / 2);
    const lower = s.slice(0, inclusive && n % 2 ? h + 1 : h);
    const upper = s.slice(n % 2 && !inclusive ? h + 1 : h);
    return { q1: median(lower), q3: median(upper) };
  }
  function five(vals) {
    const s = sortN(vals);
    const q = quartiles(s, false);
    return { min: s[0], q1: q.q1, med: median(s), q3: q.q3, max: s[s.length - 1] };
  }
  const mad = (vals) => {
    const m = mean(vals);
    return mean(vals.map((v) => Math.abs(v - m)));
  };
  /** The single most common value, or null when there is a tie. */
  function mode(vals) {
    const c = {};
    vals.forEach((v) => {
      c[v] = (c[v] || 0) + 1;
    });
    const top = Math.max(...Object.values(c));
    const at = Object.keys(c).filter((k) => c[k] === top);
    return top > 1 && at.length === 1 ? Number(at[0]) : null;
  }
  const below = (vals, x) => vals.filter((v) => v < x - 1e-9).length;
  const above = (vals, x) => vals.filter((v) => v > x + 1e-9).length;

  /* ── 2-1 statistical questions ─────────────────────────────────────── */
  const TOPICS = [
    [
      L("How many eggs are in each heron nest in the marsh?", "¿Cuántos huevos hay en cada nido de garza del pantano?"),
      L("How many eggs are in nest 14?", "¿Cuántos huevos hay en el nido 14?"),
    ],
    [
      L("How much do the foxes at Foxwood weigh?", "¿Cuánto pesan los zorros de Foxwood?"),
      L("How much did the fox named Rusty weigh this morning?", "¿Cuánto pesó esta mañana el zorro llamado Rusty?"),
    ],
    [
      L("What are the wingspans of the herons we tagged?", "¿Cuánto miden las alas abiertas de las garzas que marcamos?"),
      L("What is the wingspan of heron H-7?", "¿Cuánto miden las alas abiertas de la garza H-7?"),
    ],
    [
      L("How many frogs does each ranger count on a night walk?", "¿Cuántas ranas cuenta cada guardabosques en una caminata nocturna?"),
      L("How many legs does a frog have?", "¿Cuántas patas tiene una rana?"),
    ],
    [
      L("How far do the geese fly on each day of the migration?", "¿Qué distancia vuelan los gansos cada día de la migración?"),
      L("How far is it from the marsh to the observatory?", "¿Qué distancia hay del pantano al observatorio?"),
    ],
    [
      L("What is the water temperature at noon each day in May?", "¿Cuál es la temperatura del agua al mediodía cada día de mayo?"),
      L("What was the water temperature at noon today?", "¿Cuál fue la temperatura del agua hoy al mediodía?"),
    ],
    [
      L("How long are the shells of the turtles in Heron Marsh?", "¿Cuánto miden los caparazones de las tortugas del pantano?"),
      L("How long is the shell of turtle T-3?", "¿Cuánto mide el caparazón de la tortuga T-3?"),
    ],
    [
      L("How many hours does each ranger work in the field this week?", "¿Cuántas horas trabaja en el campo cada guardabosques esta semana?"),
      L("How many rangers work at Foxwood Station?", "¿Cuántos guardabosques trabajan en la estación Foxwood?"),
    ],
    [
      L("How many mice does each owl catch in one night?", "¿Cuántos ratones atrapa cada búho en una noche?"),
      L("How many owls live in the old oak by the station?", "¿Cuántos búhos viven en el roble viejo junto a la estación?"),
    ],
    [
      L("How tall are the deer that visit the salt lick?", "¿Cuánto miden los venados que visitan el salegar?"),
      L("How tall is the observatory tower?", "¿Cuánto mide la torre del observatorio?"),
    ],
  ];
  function genSurvey(r, tier) {
    for (;;) {
      const topics = r.shuffle(TOPICS);
      let cards;
      if (tier >= 2) {
        // Two topics appear in BOTH forms, so the student must contrast them directly.
        cards = topics
          .slice(0, 2)
          .flatMap(([s, n]) => [
            { q: s, stat: true },
            { q: n, stat: false },
          ])
          .concat(topics.slice(2, 4).map(([s, n]) => (r.next() < 0.5 ? { q: s, stat: true } : { q: n, stat: false })));
      } else {
        cards = topics.slice(0, 6).map(([s, n]) => (r.next() < 0.5 ? { q: s, stat: true } : { q: n, stat: false }));
      }
      const k = cards.filter((c) => c.stat).length;
      if (k >= 2 && k <= 4) return { cards: r.shuffle(cards), k };
    }
  }
  function judgeSurvey(g, deployed) {
    if (!deployed.some(Boolean)) return { ok: false, incomplete: true };
    const wrongOn = g.cards.findIndex((c, i) => deployed[i] && !c.stat);
    if (wrongOn >= 0) return { ok: false, tag: "singleAnswer", at: wrongOn };
    const missed = g.cards.findIndex((c, i) => !deployed[i] && c.stat);
    if (missed >= 0) return { ok: false, tag: "missedVariability", at: missed };
    return { ok: true };
  }

  /* ── 2-2 histograms ─────────────────────────────────────────────────── */
  const HIST = [
    { name: L("Heron leg length (cm)", "Largo de la pata de garza (cm)"), who: L("herons", "garzas"), lo: [20, 30] },
    { name: L("Fox tail length (cm)", "Largo de la cola del zorro (cm)"), who: L("foxes", "zorros"), lo: [30, 40] },
    { name: L("Frog jump (cm)", "Salto de la rana (cm)"), who: L("frogs", "ranas"), lo: [40, 50] },
    { name: L("Goose flight in one day (km)", "Vuelo del ganso en un día (km)"), who: L("geese", "gansos"), lo: [50, 60] },
    { name: L("Turtle shell length (cm)", "Largo del caparazón de tortuga (cm)"), who: L("turtles", "tortugas"), lo: [10, 20] },
  ];
  function genHistogram(r, tier) {
    const w = tier >= 2 ? 5 : 10;
    const nb = tier >= 2 ? 6 : 5;
    const ctx = r.pick(HIST);
    const lo = r.pick(ctx.lo) + (tier >= 2 ? r.pick([0, 5]) : 0);
    for (;;) {
      const n = tier >= 2 ? r.int(15, 18) : r.int(11, 14);
      const counts = new Array(nb).fill(0);
      for (let i = 0; i < n; i++) counts[Math.round(((r.next() + r.next()) / 2) * (nb - 1))]++;
      const top = Math.max(...counts);
      if (top > 8 || counts.filter((c) => c === top).length > 1) continue;
      if (counts.filter((c) => c === 0).length > (tier >= 2 ? 1 : 0)) continue;
      const data = [];
      const edges = new Array(nb).fill(0);
      const needEdges = tier >= 2 ? 2 : 1;
      const edgeBins = r.shuffle(counts.map((c, i) => i).filter((i) => i > 0 && counts[i] > 0)).slice(0, needEdges);
      if (edgeBins.length < needEdges) continue;
      counts.forEach((c, i) => {
        for (let j = 0; j < c; j++) {
          const forced = j === 0 && edgeBins.includes(i);
          const v = forced ? lo + i * w : r.int(lo + i * w, lo + (i + 1) * w - 1);
          if (v === lo + i * w && i > 0) edges[i]++;
          data.push(v);
        }
      });
      return { ctx, lo, w, nb, n, counts, edges, data: r.shuffle(data), edgeValue: lo + edgeBins[0] * w };
    }
  }
  const binLabel = (g, i) => `${g.lo + i * g.w}–${g.lo + (i + 1) * g.w - 1}`;
  /** Bars match the truth after moving k_i edge tags from bin i down to bin i − 1? */
  function edgeShift(g, bars) {
    const d = bars.map((b, i) => b - g.counts[i]);
    let k = 0;
    let moved = 0;
    for (let i = g.nb - 1; i >= 1; i--) {
      const ki = k - d[i];
      if (ki < 0 || ki > g.edges[i]) return false;
      moved += ki;
      k = ki;
    }
    return d[0] === k && moved > 0;
  }
  function judgeHistogram(g, bars) {
    const wrong = bars.map((b, i) => b !== g.counts[i]);
    if (!wrong.some(Boolean)) return { ok: true, wrong };
    if (bars.every((b) => b === 0)) return { ok: false, incomplete: true, wrong };
    const got = total(bars);
    if (got !== g.n) return { ok: false, tag: "missedData", wrong, got };
    if (edgeShift(g, bars)) return { ok: false, tag: "edgeBin", wrong };
    return { ok: false, tag: "binCount", wrong };
  }

  /* ── 2-3 / 2-4 / 2-5 median, box plots, range and IQR ───────────────── */
  const BOX = [
    { name: L("Fox weight (kg)", "Peso del zorro (kg)"), who: L("foxes", "zorros"), lo: 3, hi: 17 },
    { name: L("Rabbits seen in one night", "Conejos vistos en una noche"), who: L("nights", "noches"), lo: 2, hi: 20 },
    { name: L("Fox tail length (cm)", "Largo de la cola del zorro (cm)"), who: L("foxes", "zorros"), lo: 30, hi: 46 },
    { name: L("Owl calls in one hour", "Llamadas de búho en una hora"), who: L("hours", "horas"), lo: 4, hi: 22 },
  ];
  /** variant: median | box | spread. Every generated set separates the common errors. */
  function genBox(r, tier, variant) {
    const ctx = r.pick(BOX);
    const nOpts =
      variant === "median" ? [7, 9] : variant === "spread" ? [9, 11] : tier >= 3 ? [9, 10, 11] : [8, 10];
    for (;;) {
      const n = r.pick(nOpts);
      const width = r.int(9, 14);
      const a = r.int(ctx.lo, ctx.hi - width);
      const data = Array.from({ length: n }, () => r.int(a, a + width));
      const s = sortN(data);
      const f = five(data);
      const inc = quartiles(data, true);
      if (!(f.min < f.q1 && f.q1 < f.med && f.med < f.q3 && f.q3 < f.max)) continue;
      if (n % 2 === 0 && s[n / 2 - 1] === s[n / 2]) continue;
      if (n % 2 && near(inc.q1, f.q1) && near(inc.q3, f.q3)) continue;
      if (variant === "spread" && (near(inc.q3 - inc.q1, f.q3 - f.q1) || f.max - f.min === f.q3 - f.q1)) continue;
      // The recorded (unsorted) middle must not already be the median.
      const mid = n % 2 ? data[(n - 1) / 2] : (data[n / 2 - 1] + data[n / 2]) / 2;
      if (near(mid, f.med) || (n % 2 === 0 && (near(mid, s[n / 2 - 1]) || near(mid, s[n / 2])))) continue;
      const pad = [r.int(1, 2), r.int(1, 2)];
      return { ctx, n, data, sorted: s, five: f, inc, unsortedMid: mid, axis: { lo: f.min - pad[0], hi: f.max + pad[1] } };
    }
  }
  function judgeMedian(g, m) {
    if (m == null) return { ok: false, incomplete: true };
    if (near(m, g.five.med)) return { ok: true };
    const n = g.n;
    const s = g.sorted;
    if (n % 2 === 0 && (near(m, s[n / 2 - 1]) || near(m, s[n / 2]))) return { ok: false, tag: "oneMiddle" };
    const d = g.data;
    if (near(m, g.unsortedMid) || (n % 2 === 0 && (near(m, d[n / 2 - 1]) || near(m, d[n / 2]))))
      return { ok: false, tag: "unsortedMedian" };
    return { ok: false, tag: "medianCount", left: below(d, m), right: above(d, m) };
  }
  function judgeBox(g, mk) {
    const med = judgeMedian(g, mk.med);
    if (!med.ok) return med;
    if (!near(mk.min, g.five.min) || !near(mk.max, g.five.max)) return { ok: false, tag: "whiskerEnds" };
    if (near(mk.q1, g.five.q1) && near(mk.q3, g.five.q3)) return { ok: true };
    // Odd count: each quartile matches either convention, and at least one kept the median in.
    const q1In = near(mk.q1, g.inc.q1);
    const q3In = near(mk.q3, g.inc.q3);
    const q1Any = q1In || near(mk.q1, g.five.q1);
    const q3Any = q3In || near(mk.q3, g.five.q3);
    if (g.n % 2 && (q1In || q3In) && q1Any && q3Any) return { ok: false, tag: "quartileInclusive" };
    return { ok: false, tag: "quartileOff" };
  }
  function judgeSpread(g, range, iqr) {
    if (range == null && iqr == null) return { ok: false, incomplete: true };
    const R = g.five.max - g.five.min;
    const I = g.five.q3 - g.five.q1;
    if (near(range, I) && near(iqr, R)) return { ok: false, tag: "rangeIqrSwap" };
    if (near(range, g.five.max) || near(iqr, g.five.q3)) return { ok: false, tag: "spreadAsValue" };
    if (range != null && !near(range, R)) return { ok: false, tag: "rangeCalc" };
    if (iqr == null) return { ok: false, incomplete: true };
    if (near(iqr, I)) return range == null ? { ok: false, incomplete: true } : { ok: true };
    if (g.n % 2 && near(iqr, g.inc.q3 - g.inc.q1)) return { ok: false, tag: "quartileInclusive" };
    return { ok: false, tag: "iqrCalc" };
  }

  /* ── 2-8 mean as a balance point ───────────────────────────────────── */
  const BAL = [
    { name: L("Hours each goose flew today", "Horas que voló cada ganso hoy"), unit: L("h", "h") },
    { name: L("Geese landing at the lake each minute", "Gansos que aterrizan en el lago por minuto"), unit: L("", "") },
    { name: L("Stops each crane made this week", "Paradas de cada grulla esta semana"), unit: L("", "") },
  ];
  function genBalance(r, tier) {
    const ctx = r.pick(BAL);
    for (;;) {
      const n = tier >= 2 ? r.int(6, 8) : r.int(5, 6);
      const data = Array.from({ length: n }, () => r.int(1, 14));
      const m = mean(data);
      if (!(tier >= 2 ? Number.isInteger(m * 2) : Number.isInteger(m))) continue;
      const s = sortN(data);
      const mid = (s[0] + s[n - 1]) / 2;
      const med = median(data);
      if (near(m, med) || near(m, mid) || s[n - 1] - s[0] < 6) continue;
      return { ctx, n, data, mean: m, median: med, midrange: mid, mode: mode(data), axis: { lo: 0, hi: 15 } };
    }
  }
  const torque = (g, f) => total(g.data.map((v) => v - f));
  function judgeBalance(g, f, moved) {
    if (!moved) return { ok: false, incomplete: true };
    if (near(f, g.mean)) return { ok: true };
    if (near(f, g.median)) return { ok: false, tag: "meanIsMedian" };
    if (near(f, g.midrange)) return { ok: false, tag: "midrange" };
    if (g.mode != null && near(f, g.mode)) return { ok: false, tag: "meanIsMode" };
    return { ok: false, tag: "notBalanced", right: torque(g, f) > 0 };
  }

  /* ── 2-9 MAD (single flock, or compare two flocks) ─────────────────── */
  const MADC = [
    { name: L("Hours each goose rested", "Horas que descansó cada ganso"), who: L("Flock", "Bandada") },
    { name: L("Kilometers each crane flew before noon", "Kilómetros que voló cada grulla antes del mediodía"), who: L("Flock", "Bandada") },
    { name: L("Fish each heron caught", "Peces que atrapó cada garza"), who: L("Colony", "Colonia") },
  ];
  function genMad(r, tier, compare) {
    const ctx = r.pick(MADC);
    for (;;) {
      const n = compare ? r.pick([4, 5]) : 5;
      const data = Array.from({ length: n }, () => r.int(1, 14));
      const m = mean(data);
      if (!Number.isInteger(m)) continue;
      const dists = data.map((v) => Math.abs(v - m));
      const d = mad(data);
      if (d < 1 || !Number.isInteger(d * 100) || new Set(dists).size < 2) continue;
      if (data.filter((v) => v < m).length < 1 || data.filter((v) => v > m).length < 1) continue;
      let other = null;
      if (compare) {
        other = Number((d + (r.next() < 0.5 ? -1 : 1) * r.int(2, 8) / 5).toFixed(1));
        if (other < 0.4) continue;
      }
      return { ctx, n, data, mean: m, dists, mad: d, other, askMean: tier >= 3 };
    }
  }
  /** entry = {mean, dists[], mad, choice}: typed strings for the cells, choice 0 = ours, 1 = other. */
  function judgeMad(g, entry) {
    const ds = entry.dists.map(num);
    const typedMean = num(entry.mean);
    const madV = num(entry.mad);
    const anything = ds.some((v) => v != null) || madV != null || typedMean != null;
    if (!anything) return { ok: false, incomplete: true };
    if (g.askMean && typedMean != null && !near(typedMean, g.mean)) return { ok: false, tag: "meanOff" };
    if (ds.some((v) => v != null && v < 0)) return { ok: false, tag: "signedDeviations" };
    if (ds.some((v, i) => v != null && !near(v, g.dists[i]))) return { ok: false, tag: "distanceOff" };
    if (madV != null && near(madV, 0)) return { ok: false, tag: "signedDeviations" };
    if (madV != null && !near(madV, g.mad)) {
      const typedSum = ds.every((v) => v != null) ? total(ds) : total(g.dists);
      if (near(madV, typedSum)) return { ok: false, tag: "noDivide" };
      return { ok: false, tag: "madCalc" };
    }
    if ((g.askMean && typedMean == null) || ds.some((v) => v == null) || madV == null)
      return { ok: false, incomplete: true };
    if (g.other != null) {
      if (entry.choice == null) return { ok: false, incomplete: true, needChoice: true };
      const ours = g.mad < g.other ? 0 : 1;
      if (entry.choice !== ours) return { ok: false, tag: "biggerMadConsistent" };
    }
    return { ok: true };
  }

  /* ── 2-10 choose the measure (outlier or symmetric) ────────────────── */
  const CHO = [
    { name: L("Eggs in each crane nest", "Huevos en cada nido de grulla"), what: L("nests", "nidos") },
    { name: L("Days each tagged goose stayed at the lake", "Días que cada ganso marcado se quedó en el lago"), what: L("geese", "gansos") },
    { name: L("Kilometers each fox traveled in one night", "Kilómetros que recorrió cada zorro en una noche"), what: L("foxes", "zorros") },
  ];
  function genChoose(r, tier) {
    const ctx = r.pick(CHO);
    const skewed = r.next() < (tier >= 3 ? 0.5 : 0.6);
    for (;;) {
      const n = r.int(7, 9);
      let data;
      let outlier = null;
      if (skewed) {
        const c = r.int(4, 9);
        data = Array.from({ length: n - 1 }, () => r.int(c - 3, c + 3));
        outlier = c + r.int(11, 15);
        data.push(outlier);
      } else {
        const c = r.int(6, 12);
        data = n % 2 ? [c] : [];
        while (data.length < n) {
          const d = r.int(1, 4);
          data.push(c - d, c + d);
        }
      }
      const m = mean(data);
      const md = median(data);
      if (skewed && Math.abs(m - md) < 1.5) continue;
      if (!skewed && !near(m, md)) continue;
      const s = sortN(data);
      if (!skewed && s.length !== n) continue;
      if (n % 2 === 0 && s[n / 2 - 1] === s[n / 2]) continue;
      return { ctx, n, data: r.shuffle(data), sorted: s, skewed, outlier, mean: m, median: md, axis: { lo: Math.max(0, s[0] - 2), hi: s[n - 1] + 2 } };
    }
  }
  /** entry = {center:'mean'|'median'|null, spread:'mad'|'iqr'|null, value:string} */
  function judgeChoose(g, e) {
    if (!e.center) return { ok: false, incomplete: true, need: "center" };
    if (g.skewed && e.center === "mean") return { ok: false, tag: "meanWithOutlier" };
    if (!g.skewed && e.center === "median") return { ok: false, tag: "medianSymmetric" };
    if (!e.spread) return { ok: false, incomplete: true, need: "spread" };
    if ((e.center === "mean") !== (e.spread === "mad")) return { ok: false, tag: "spreadMismatch" };
    const v = num(e.value);
    if (v == null) return { ok: false, incomplete: true, need: "value" };
    const want = e.center === "mean" ? g.mean : g.median;
    if (near(v, want)) return { ok: true };
    if (e.center === "median") {
      const s = g.sorted;
      if (g.n % 2 === 0 && (near(v, s[g.n / 2 - 1]) || near(v, s[g.n / 2]))) return { ok: false, tag: "oneMiddle" };
      return { ok: false, tag: "medianCount", left: below(g.data, v), right: above(g.data, v) };
    }
    return { ok: false, tag: "meanCalc" };
  }

  window.DD_MISSIONS = Object.assign(window.DD_MISSIONS || {}, {
    L,
    fmt,
    fill,
    num,
    near,
    math: {
      sortN,
      total,
      mean,
      median,
      quartiles,
      five,
      mad,
      mode,
      below,
      above,
      torque,
      binLabel,
      edgeShift,
      TOPICS,
      genSurvey,
      judgeSurvey,
      genHistogram,
      judgeHistogram,
      genBox,
      judgeMedian,
      judgeBox,
      judgeSpread,
      genBalance,
      judgeBalance,
      genMad,
      judgeMad,
      genChoose,
      judgeChoose,
    },
  });
})();
