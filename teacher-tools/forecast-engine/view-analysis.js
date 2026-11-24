/* Forecast Engine — Analysis: expert tools with plain-language answers.
 * Every panel has a control to play with and a sentence that says what it
 * found, including when the honest answer is "too little data to say". */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { S, M, esc, fmt, store } = NFE;
  NFE.views = NFE.views || {};

  const TABS = [
    ["distribution", "Spread"],
    ["standards", "Standards"],
    ["growth", "Growth"],
    ["relationships", "Connections"],
    ["equity", "Fairness check"],
    ["checks", "Data checks"],
  ];
  const A = {
    tab: "distribution",
    standard: "all",
    mode: "students",
    bin: 10,
    bell: false,
    a: "",
    b: "",
    cmpA: "",
    cmpB: "",
    tag: "",
    gStd: "all",
    eStd: "all",
  };

  const stdOptions = (withAll = true) => [
    ...(withAll ? [["all", "All standards"]] : []),
    ...store.state.standards.map((x) => [x.code, `${x.code} · ${x.desc}`]),
  ];
  const sel = (key, label, options) =>
    `<label class="field"><span class="ctl-name">${esc(label)}</span><select data-a="${key}">${options.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(A[key]) ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></label>`;
  const verdictP = (p) =>
    p < 0.05
      ? "This difference is very likely real."
      : p < 0.2
        ? "This could be real, but we cannot be sure."
        : "This could easily be chance.";
  const gWords = (g) => {
    const a = Math.abs(g);
    return a < 0.2 ? "negligible" : a < 0.5 ? "small" : a < 0.8 ? "medium" : "large";
  };
  const rWords = (r) => {
    const a = Math.abs(r);
    return a < 0.3 ? "weak" : a < 0.6 ? "moderate" : a < 0.8 ? "strong" : "very strong";
  };
  const grid = () => NFE.grid();

  /* ── Spread ─────────────────────────────────────────────────────────── */
  function spread() {
    const t = store.state.settings.target;
    const g = grid();
    const values =
      A.mode === "students"
        ? M.studentMeans(store.state, g.ix, A.standard).map((x) => x.mean)
        : store.state.evidence
            .filter((e) => A.standard === "all" || e.standard === A.standard)
            .map((e) => e.pct);
    if (values.length < 2)
      return NFE.empty(
        "Not enough scores",
        "Add more scores for this standard to see how they spread out.",
      );
    const box = S.boxStats(values);
    const bins = S.histogram(values, A.bin, 0, 100);
    const k = values.filter((v) => v >= t).length;
    const w = S.wilson(k, values.length, 0.9);
    const skew = box.mean - box.median;
    const center =
      Math.abs(skew) > 5
        ? `The average (${Math.round(box.mean)}%) and the middle score (${Math.round(box.median)}%) disagree: a few ${skew < 0 ? "very low" : "very high"} scores pull the average ${skew < 0 ? "down" : "up"}. The middle score is the fairer picture of a typical ${A.mode === "students" ? "student" : "score"}.`
        : `The average and the middle score agree (about ${Math.round(box.median)}%), so the class is fairly balanced.`;
    const spreadW =
      box.sd < 8
        ? "tightly bunched, so one lesson plan will fit most students"
        : box.sd < 15
          ? "moderately spread out"
          : "widely spread out, so a single whole-class lesson will miss many students at both ends";
    const unit = A.mode === "students" ? "student average" : "score";
    return `${NFE.say(`The middle half of ${unit}s fall between <strong>${Math.round(box.q1)}%</strong> and <strong>${Math.round(box.q3)}%</strong>. ${esc(center)} Scores are ${spreadW}. About <strong>${Math.round(w.p * 100)}%</strong> are at or above ${t}% (likely ${Math.round(w.lo * 100)}–${Math.round(w.hi * 100)}%).`)}
      <section class="kpis compact">${[
        ["Count", values.length],
        ["Average", fmt.pct(box.mean)],
        ["Middle score", fmt.pct(box.median)],
        ["Typical swing", `±${fmt.num(box.sd, 0)}`],
        ["Lowest to highest", `${Math.round(box.min)}–${Math.round(box.max)}%`],
      ]
        .map(
          ([l, v]) =>
            `<article class="kpi"><h3>${l}</h3><div class="kpi-val sm">${v}</div></article>`,
        )
        .join("")}</section>
      ${NFE.charts.histogram({ bins, mean: box.mean, target: t, curve: A.bell ? NFE.charts.bellCurve(values.length, box.mean, box.sd, A.bin) : null, label: `Histogram of ${values.length} ${unit}s. Average ${Math.round(box.mean)} percent.` })}
      ${NFE.charts.boxStrip({ box, target: t, label: `Box plot: middle half from ${Math.round(box.q1)} to ${Math.round(box.q3)} percent, median ${Math.round(box.median)}.` })}
      ${NFE.how("The bars count how many scores fall in each band. The box underneath marks the middle half of scores with a line at the median. Dots outside the whiskers are unusual scores worth a second look. Green bars are at or above your target.", "Make the bands narrower to see more detail, wider to see the big picture. Turn on the bell curve to see how a perfectly even class would look.", "With only a handful of students, the shape is a rough sketch.")}`;
  }

  /* ── Standards ──────────────────────────────────────────────────────── */
  function standards() {
    const rows = NFE.summaries();
    const t = store.state.settings.target;
    if (!A.cmpA)
      [A.cmpA, A.cmpB] = [
        store.state.standards[0]?.code || "",
        store.state.standards[1]?.code || store.state.standards[0]?.code || "",
      ];
    const ranked = rows.filter((r) => r.n).sort((a, b) => a.mean - b.mean);
    const hard = ranked[0];
    const table = rows
      .map(
        (r) =>
          `<tr><th scope="row">${esc(r.standard.code)}<br><span class="muted small-note">${esc(r.standard.desc)}</span></th><td>${r.n}</td><td>${r.n ? `${Math.round(r.mean)}%` : "–"}<br><span class="muted small-note">${r.n > 1 ? `likely ${Math.round(r.lo)}–${Math.round(r.hi)}%` : ""}</span></td><td>${r.n ? `${Math.round(r.atTarget.p * 100)}%` : "–"}<br><span class="muted small-note">${r.n > 1 ? `likely ${Math.round(r.atTarget.lo * 100)}–${Math.round(r.atTarget.hi * 100)}%` : ""}</span></td></tr>`,
      )
      .join("");
    const cmp = M.compareStandards(store.state, A.cmpA, A.cmpB);
    let cmpText = "Pick two different standards.";
    if (A.cmpA !== A.cmpB) {
      if (!cmp.test)
        cmpText = `Only ${cmp.n} students have scores on both, which is too few to compare fairly (we need at least 4).`;
      else {
        const d = cmp.test.diff;
        cmpText = `Students scored <strong>${fmt.num(Math.abs(d), 1)} points ${d >= 0 ? "higher" : "lower"}</strong> on ${esc(A.cmpA)} than on ${esc(A.cmpB)} (likely ${fmt.num(Math.abs(Math.min(cmp.test.lo, cmp.test.hi)), 1)}–${fmt.num(Math.abs(Math.max(cmp.test.lo, cmp.test.hi)), 1)} points, ${cmp.n} students). ${verdictP(cmp.test.p)}`;
      }
    }
    return `${hard ? NFE.say(`<strong>${esc(hard.standard.code)}</strong> (${esc(hard.standard.desc)}) is the hardest right now, averaging ${Math.round(hard.mean)}%. About ${Math.round(hard.atTarget.p * 100)}% of students are at ${t}% or better.`) : ""}
      ${NFE.charts.ciBars({ rows: rows.filter((r) => r.n).map((r) => ({ label: r.standard.code, mean: r.mean, lo: r.lo, hi: r.hi, n: r.n })), target: t, label: "Average for each standard with its likely range." })}
      <div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Standard</th><th scope="col">Students</th><th scope="col">Average</th><th scope="col">At target</th></tr></thead><tbody>${table}</tbody></table></div>
      <section class="subcard"><h3>Compare two standards</h3><div class="ctl-grid two">${sel("cmpA", "First", stdOptions(false))}${sel("cmpB", "Second", stdOptions(false))}</div>${NFE.say(cmpText)}</section>
      ${NFE.how("Each average comes from one number per student, so a student with ten scores does not outweigh a student with two. The range shows where the true class average probably sits. When two ranges overlap a lot, the standards may not really differ.", "Compare two standards: the sentence tells you whether the gap is likely real or could be chance.", "A lower score can mean a harder standard or a harder test. Check the questions before reteaching.")}`;
  }

  /* ── Growth ─────────────────────────────────────────────────────────── */
  function growth() {
    const level = store.state.settings.level;
    const pts = M.growth(store.state, A.gStd, level);
    if (pts.length < 2)
      return NFE.empty(
        "Need more than one check",
        "Growth shows once scores have been recorded on at least two different dates.",
      );
    const rows = store.state.evidence
      .filter((e) => A.gStd === "all" || e.standard === A.gStd)
      .map((e) => ({ t: Date.parse(e.date) / 86400000 / 7, y: e.pct }))
      .filter((r) => Number.isFinite(r.t));
    const reg =
      rows.length > 3
        ? S.linReg(
            rows.map((r) => r.t),
            rows.map((r) => r.y),
          )
        : null;
    let line = "";
    if (reg && Number.isFinite(reg.seSlope)) {
      const c = S.tCrit(level, reg.df);
      line = ` Across all scores the class is ${reg.slope >= 0 ? "gaining" : "losing"} about <strong>${fmt.num(Math.abs(reg.slope), 1)} points a week</strong> (likely ${fmt.num(reg.slope - c * reg.seSlope, 1)} to ${fmt.num(reg.slope + c * reg.seSlope, 1)}). ${reg.slopeP < 0.05 ? "That trend is clear." : "That trend is not clear yet."}`;
    }
    const g = grid();
    const movers = [];
    store.state.students.forEach((st) => {
      const own = (
        A.gStd === "all"
          ? store.state.standards.flatMap((sd) => g.ix.get(st.id, sd.code))
          : g.ix.get(st.id, A.gStd)
      ).filter((r) => Number.isFinite(r.day));
      if (
        own.length < 3 ||
        Math.max(...own.map((r) => r.day)) - Math.min(...own.map((r) => r.day)) < 7
      )
        return;
      const r = S.linReg(
        own.map((x) => x.day / 7),
        own.map((x) => x.pct),
      );
      if (r) movers.push({ st, slope: r.slope, n: own.length });
    });
    movers.sort((a, b) => b.slope - a.slope);
    const list = (arr) =>
      arr
        .map(
          (m) =>
            `<li>${esc(m.st.name)} <strong>${fmt.signed(m.slope, 1)}</strong> a week <span class="muted">(${m.n} scores)</span></li>`,
        )
        .join("") || "<li class='muted'>Not enough data</li>";
    return `${NFE.say(`The class average moved from <strong>${Math.round(pts[0].mean)}%</strong> on ${fmt.date(pts[0].date)} to <strong>${Math.round(pts[pts.length - 1].mean)}%</strong> on ${fmt.date(pts[pts.length - 1].date)}.${line}`)}
      ${NFE.charts.bandLine({ points: pts, target: store.state.settings.target, label: "Class average at each check with its likely range." })}
      <div class="grid g2"><section class="subcard"><h3>Climbing fastest</h3><ul class="plainlist">${list(movers.slice(0, 4))}</ul></section><section class="subcard"><h3>Slipping or flat</h3><ul class="plainlist">${list(
        movers
          .slice(-4)
          .reverse()
          .filter((m) => m.slope < 1),
      )}</ul></section></div>
      ${NFE.how("Each dot is the class average on one date, and the shaded band is where that average probably sits. The weekly trend lines up every score by date and fits one straight line through them. Movers are students whose own scores trend up or down fastest.", "Pick one standard to avoid mixing easy and hard checks.", "If checks differ in difficulty, the average can fall even when students learn. Compare checks of similar difficulty.")}`;
  }

  /* ── Connections ────────────────────────────────────────────────────── */
  function relationships() {
    if (!A.a)
      [A.a, A.b] = [
        store.state.standards[0]?.code || "",
        store.state.standards[1]?.code || store.state.standards[0]?.code || "",
      ];
    if (A.a === A.b)
      return NFE.empty(
        "Pick two different standards",
        "Connections compare how students do on one standard with how they do on another.",
      );
    const c = M.correlation(store.state, A.a, A.b);
    if (!c.r)
      return NFE.empty(
        "Not enough students",
        `Only ${c.pairs.length} students have scores on both standards. We need at least 3 with some variety.`,
      );
    const r = c.r;
    const dir =
      r.r >= 0 ? "tend to do well on both" : "who do well on one tend to do worse on the other";
    const resid = c.pairs
      .map((p) => ({ p, d: p.y - r.reg.predict(p.x) }))
      .sort((a, b) => a.d - b.d);
    const lowest = resid[0];
    const highest = resid[resid.length - 1];
    return `${NFE.say(`Students ${r.r >= 0 ? "who do well on" : ""} ${esc(A.a)} ${r.r >= 0 ? `${dir} (${esc(A.b)})` : `${dir}`}. The link is <strong>${rWords(r.r)}</strong> (r = ${fmt.num(r.r, 2)}, likely ${fmt.num(r.lo95, 2)} to ${fmt.num(r.hi95, 2)}, ${r.n} students). About ${Math.round(r.r2 * 100)}% of the differences in ${esc(A.b)} line up with ${esc(A.a)}.`)}
      ${NFE.charts.scatter({ pairs: c.pairs, reg: r.reg, nameA: `${A.a} average`, nameB: `${A.b} average`, label: `Scatter plot of ${A.a} against ${A.b} for ${r.n} students.` })}
      <div class="grid g2"><section class="subcard"><h3>Doing better than expected</h3><p>${esc(highest.p.student.name)} scores ${fmt.num(highest.d, 0)} points higher on ${esc(A.b)} than ${esc(A.a)} predicts.</p></section><section class="subcard"><h3>Worth a closer look</h3><p>${esc(lowest.p.student.name)} scores ${fmt.num(Math.abs(lowest.d), 0)} points lower on ${esc(A.b)} than ${esc(A.a)} predicts.</p></section></div>
      ${NFE.how("Each dot is a student. The line is the best straight line through them. Dots near the line behave as expected. Dots far above or below do something different on the second standard than the first, which can reveal a gap that the class average hides.", "Hover or tab to a dot to see the student.", "A strong link does not mean one standard causes the other. Both may reflect reading level, attendance or effort.")}`;
  }

  /* ── Fairness check ─────────────────────────────────────────────────── */
  function equity() {
    const tags = M.tagList(store.state);
    if (!tags.length)
      return NFE.empty(
        "No support tags yet",
        "Add tags such as ML, IEP or Newcomer to students under Data, Class setup. Then you can check whether supported students are growing as well as everyone else.",
        '<button class="btn" data-go="data" data-sel=\'{"tab":"setup"}\'>Open class setup</button>',
      );
    if (!tags.includes(A.tag)) A.tag = tags[0];
    const level = store.state.settings.level;
    const res = M.compareTag(store.state, A.tag, A.eStd, 0.95);
    const ci = (a) => S.meanCI(a, level);
    const ga = ci(res.a);
    const gb = ci(res.b);
    let text;
    if (!res.test)
      text = `Only ${res.a.length} ${res.a.length === 1 ? "student carries" : "students carry"} the tag <strong>${esc(A.tag)}</strong> here, and ${res.b.length} do not. We need at least 3 in each group to compare fairly, so no conclusion is drawn.`;
    else
      text = `Students tagged <strong>${esc(A.tag)}</strong> average <strong>${Math.round(ga.mean)}%</strong> and the rest average <strong>${Math.round(gb.mean)}%</strong>, a gap of ${fmt.num(Math.abs(res.test.diff), 1)} points (likely ${fmt.num(Math.abs(Math.min(res.test.lo, res.test.hi)), 1)}–${fmt.num(Math.abs(Math.max(res.test.lo, res.test.hi)), 1)}). The size of the gap is <strong>${gWords(res.g.g)}</strong> (effect ${fmt.num(res.g.g, 2)}). ${verdictP(res.test.p)}`;
    return `${NFE.say(text)}
      ${
        res.a.length && res.b.length
          ? NFE.charts.ciBars({
              rows: [
                { label: `Tagged ${A.tag}`, mean: ga.mean, lo: ga.lo, hi: ga.hi, n: ga.n },
                { label: "Everyone else", mean: gb.mean, lo: gb.lo, hi: gb.hi, n: gb.n },
              ],
              target: store.state.settings.target,
              label: `Average for students tagged ${A.tag} compared with everyone else.`,
            })
          : ""
      }
      <p class="muted">This is a planning check, not a label. Use it to decide whether supports are working and where to look next. Tags are yours and stay in this browser.</p>
      ${NFE.how("We compare the average of students with a tag against everyone else, with a range that says how far apart the true averages might be. “Effect” turns the gap into a size that does not depend on the test: under 0.2 is negligible, 0.2 to 0.5 small, 0.5 to 0.8 medium, above 0.8 large.", "Switch standards to see whether a gap is everywhere or only on one standard.", "Small groups produce wide ranges. A big gap with a wide range means “look closer”, not “proven”.")}`;
  }

  /* ── Data checks ────────────────────────────────────────────────────── */
  function checks() {
    const cov = NFE.coverage();
    const out = NFE.outliers();
    const g = grid();
    const thin = [];
    store.state.students.forEach((st) =>
      store.state.standards.forEach((sd) => {
        const n = g.ix.get(st.id, sd.code).length;
        if (n < 2) thin.push({ st, sd, n });
      }),
    );
    const issues = NFE.importers.validate(store.state);
    const rows = out
      .slice(0, 8)
      .map(
        (o) =>
          `<tr><th scope="row">${esc(store.studentName(o.student))}</th><td>${esc(o.standard)}</td><td>${fmt.date(o.date)}</td><td><strong>${Math.round(o.pct)}%</strong> <span class="muted">usually ${Math.round(o.expected)}%</span></td><td><button class="btn small" type="button" data-go="data" data-sel='${esc(JSON.stringify({ tab: "records", filter: o.student }))}'>Review</button></td></tr>`,
      )
      .join("");
    return `${NFE.say(`<strong>${cov.pct}%</strong> of student-standard pairs have 3 or more scores. ${out.length ? `<strong>${fmt.plural(out.length, "score")}</strong> sit far from the student's own pattern.` : "No scores look out of place."} ${thin.length ? `${fmt.plural(thin.length, "pair")} ${thin.length === 1 ? "has" : "have"} fewer than 2 scores, so ${thin.length === 1 ? "its forecast is" : "those forecasts are"} mostly the class's guess.` : ""}`)}
      ${out.length ? `<section class="subcard"><h3>Unusual scores</h3><div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Student</th><th scope="col">Standard</th><th scope="col">Date</th><th scope="col">Score</th><th scope="col"><span class="sr">Review</span></th></tr></thead><tbody>${rows}</tbody></table></div></section>` : ""}
      ${
        thin.length
          ? `<section class="subcard"><h3>Thin records</h3><ul class="plainlist">${thin
              .slice(0, 10)
              .map(
                (x) =>
                  `<li>${esc(x.st.name)} · ${esc(x.sd.code)} <span class="muted">(${fmt.plural(x.n, "score")})</span></li>`,
              )
              .join(
                "",
              )}${thin.length > 10 ? `<li class="muted">and ${thin.length - 10} more</li>` : ""}</ul></section>`
          : ""
      }
      ${
        issues.length
          ? `<section class="subcard"><h3>Other things to fix</h3><ul class="plainlist">${issues
              .slice(0, 10)
              .map(([k, m]) => `<li>${NFE.badge(k, k === "bad" ? "Fix" : "Check")} ${esc(m)}</li>`)
              .join("")}</ul></section>`
          : ""
      }
      ${NFE.how("A forecast can only be as good as the scores behind it. An unusual score is one far from what the student usually earns on that standard (more than three typical swings and at least 20 points away). Often that is a typo or an absent day, not learning.", "Press Review to open the score and fix or delete it.")}`;
  }

  const VIEWS = { distribution: spread, standards, growth, relationships, equity, checks };
  const CONTROLS = {
    distribution: () =>
      `<div class="ctl-grid">${sel("standard", "Standard", stdOptions())}${NFE.segmented({
        path: "a.mode",
        label: "Count",
        value: A.mode,
        options: [
          ["students", "Student averages"],
          ["scores", "Every score"],
        ],
      })}<label class="ctl"><span class="ctl-top"><span class="ctl-name">Band width</span><output data-aout="bin">${A.bin}%</output></span><input type="range" data-a="bin" min="5" max="25" step="5" value="${A.bin}"></label><label class="check"><input type="checkbox" data-a="bell"${A.bell ? " checked" : ""}> Show a bell curve for comparison</label></div>`,
    growth: () => `<div class="ctl-grid">${sel("gStd", "Standard", stdOptions())}</div>`,
    relationships: () =>
      `<div class="ctl-grid two">${sel("a", "Across (x)", stdOptions(false))}${sel("b", "Up (y)", stdOptions(false))}</div>`,
    equity: () =>
      `<div class="ctl-grid two">${sel(
        "tag",
        "Tag",
        M.tagList(store.state).map((t) => [t, t]),
      )}${sel("eStd", "Standard", stdOptions())}</div>`,
  };

  function result(root) {
    const el = NFE.$("#an-result", root);
    if (!el) return;
    el.innerHTML = VIEWS[A.tab]();
    NFE.charts.wireTips(el);
  }

  NFE.views.analysis = {
    mount(root) {
      if (!store.state.evidence.length) {
        root.innerHTML = NFE.empty(
          "No scores yet",
          "Analysis needs scores to work with.",
          '<button class="btn primary" data-go="data">Add scores</button>',
        );
        return;
      }
      const arrival = NFE.takeArrive();
      if (arrival?.tab && TABS.some(([k]) => k === arrival.tab)) A.tab = arrival.tab;
      root.innerHTML = `<div class="subtabs" role="tablist" aria-label="Analysis tools">${TABS.map(([k, t]) => `<button role="tab" type="button" class="subtab${k === A.tab ? " on" : ""}" data-tab-an="${k}" aria-selected="${k === A.tab}">${t}</button>`).join("")}</div>
        <section class="card">${CONTROLS[A.tab] ? `<div class="an-controls">${CONTROLS[A.tab]()}</div>` : ""}<div id="an-result" aria-live="polite"></div></section>`;
      result(root);
    },
    update() {},
    wire(root) {
      root.addEventListener("click", (e) => {
        const t = e.target.closest("[data-tab-an]");
        if (t) {
          A.tab = t.dataset.tabAn;
          NFE.views.analysis.mount(root);
        }
      });
      const onControl = (e) => {
        const el = e.target.closest("[data-a],[data-set^='a.']");
        if (!el) return;
        const key = el.dataset.a || el.dataset.set.slice(2);
        A[key] =
          el.type === "checkbox" ? el.checked : el.type === "range" ? Number(el.value) : el.value;
        const out = NFE.$(`[data-aout="${key}"]`, root);
        if (out) out.textContent = `${A[key]}%`;
        result(root);
      };
      root.addEventListener("input", onControl);
      root.addEventListener(
        "change",
        (e) => e.target.matches("select,input[type=checkbox]") && onControl(e),
      );
    },
  };
})();
