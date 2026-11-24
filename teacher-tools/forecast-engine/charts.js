/* Forecast Engine — charts.
 * Hand-built SVG, one chart per question. Marks carry data-tip text for the
 * shared tooltip (hover or keyboard focus); colour comes from CSS variables so
 * light, dark and print all work. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { esc, fmt } = NFE;

  const W = 720;
  const M = { l: 46, r: 20, t: 18, b: 38 };
  const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
  const pts = (arr) => arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const svg = (h, label, body, cls = "", w = W) =>
    `<svg class="chart ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid meet"><title>${esc(label)}</title>${body}</svg>`;
  const tip = (text) => `tabindex="0" data-tip="${esc(text)}"`;
  const yGrid = (y, h, ticks, fmtTick = (v) => `${v}%`) =>
    ticks
      .map(
        (v) =>
          `<line class="ch-grid" x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}"/><text class="ch-text" x="${M.l - 8}" y="${y(v) + 4}" text-anchor="end">${fmtTick(v)}</text>`,
      )
      .join("");
  const targetLine = (x0, x1, y, target, label = `Target ${target}%`) =>
    `<line class="ch-target" x1="${x0}" x2="${x1}" y1="${y(target)}" y2="${y(target)}"/><text class="ch-target-text" x="${x1}" y="${y(target) - 6}" text-anchor="end">${esc(label)}</text>`;
  const dateLabel = (t) => fmt.date(new Date(t * 86400000).toISOString());

  /** Scores over time with a fitted line, the forecast cone and the target. */
  function scoreChart({ rows, cone, f, target, dated, level }) {
    const H = 330;
    const ts = rows.map((r) => r.t);
    const t0 = Math.min(...ts, ...cone.map((c) => c.t)) - 3;
    const t1 = Math.max(...ts, ...cone.map((c) => c.t)) + 3;
    const x = lin(t0, t1, M.l, W - M.r);
    const y = lin(0, 100, H - M.b, M.t);
    const ticks = Array.from({ length: 5 }, (_, i) => Math.round(t0 + ((t1 - t0) * i) / 4));
    let body = yGrid(y, H, [0, 25, 50, 75, 100]);
    body += ticks
      .map(
        (t) =>
          `<text class="ch-text" x="${x(t)}" y="${H - 12}" text-anchor="middle">${dated ? dateLabel(t) : `Check ${Math.round(((t - t0) / (t1 - t0)) * (rows.length + 1))}`}</text>`,
      )
      .join("");
    if (cone.length > 1) {
      const up = cone.map((c) => [x(c.t), y(c.hi)]);
      const dn = cone.map((c) => [x(c.t), y(c.lo)]).reverse();
      body += `<polygon class="ch-cone" points="${pts([...up, ...dn])}"><title>${Math.round(level * 100)}% forecast range</title></polygon>`;
      body += `<polyline class="ch-cone-mid" fill="none" points="${pts(cone.map((c) => [x(c.t), y(c.proj)]))}"/>`;
    }
    if (f.reg && rows.length > 2)
      body += `<line class="ch-fit" x1="${x(rows[0].t)}" y1="${y(f.reg.predict(rows[0].t / 7))}" x2="${x(rows[rows.length - 1].t)}" y2="${y(f.reg.predict(rows[rows.length - 1].t / 7))}"/>`;
    body += targetLine(M.l, W - M.r, y, target);
    body += `<polyline class="ch-line" fill="none" points="${pts(rows.map((r) => [x(r.t), y(r.pct)]))}"/>`;
    body += rows
      .map(
        (r) =>
          `<circle class="ch-pt" cx="${x(r.t)}" cy="${y(r.pct)}" r="6" ${tip(`${r.assessment || "Score"} · ${dated ? fmt.date(r.date) : ""} · ${Math.round(r.pct)}%`)}/>`,
      )
      .join("");
    if (cone.length) {
      const e = cone[cone.length - 1];
      body += `<path class="ch-fc" d="M${x(e.t) - 7},${y(e.proj)} l7,-7 l7,7 l-7,7 z" ${tip(`Forecast ${Math.round(e.proj)}% (${Math.round(e.lo)}–${Math.round(e.hi)}%)`)}/>`;
    }
    return svg(
      H,
      `Scores over time for this student with the forecast range and the ${target}% target`,
      body,
    );
  }

  /** Histogram of scores, optional bell curve, mean and target lines. */
  function histogram({ bins, mean, target, curve, label }) {
    const H = 260;
    const maxC = Math.max(1, ...bins.map((b) => b.count));
    const top = Math.max(2, Math.ceil(maxC * 1.15));
    const x = lin(0, 100, M.l, W - M.r);
    const y = lin(0, top, H - M.b, M.t);
    const step = top > 8 ? Math.ceil(top / 4) : 1;
    let body = yGrid(
      y,
      H,
      Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step),
      (v) => v,
    );
    body += [0, 20, 40, 60, 80, 100]
      .map(
        (v) => `<text class="ch-text" x="${x(v)}" y="${H - 12}" text-anchor="middle">${v}%</text>`,
      )
      .join("");
    body += bins
      .map((b) => {
        const bx = x(b.lo) + 1;
        const bw = Math.max(2, x(b.hi) - x(b.lo) - 2);
        const bh = Math.max(0, y(0) - y(b.count));
        return `<rect class="ch-bar${b.lo >= target ? " ch-bar-hit" : ""}" x="${bx}" y="${y(b.count)}" width="${bw}" height="${bh}" rx="3" ${tip(`${b.lo}–${Math.round(b.hi)}%: ${fmt.plural(b.count, "score")}`)}/>`;
      })
      .join("");
    if (curve)
      body += `<polyline class="ch-curve" fill="none" points="${pts(curve.map(([v, c]) => [x(v), y(c)]))}"/>`;
    body += `<line class="ch-mean" x1="${x(mean)}" x2="${x(mean)}" y1="${M.t}" y2="${H - M.b}"/><text class="ch-mean-text" x="${x(mean) + 5}" y="${M.t + 10}">Mean ${Math.round(mean)}%</text>`;
    body += `<line class="ch-target" x1="${x(target)}" x2="${x(target)}" y1="${M.t}" y2="${H - M.b}"/><text class="ch-target-text" x="${x(target) + 5}" y="${M.t + 26}">Target ${target}%</text>`;
    return svg(H, label, body);
  }

  /** One-row box plot on the same 0–100 scale. */
  function boxStrip({ box, target, label }) {
    const H = 86;
    const x = lin(0, 100, M.l, W - M.r);
    const mid = 40;
    let body = [0, 25, 50, 75, 100]
      .map(
        (v) =>
          `<line class="ch-grid" x1="${x(v)}" x2="${x(v)}" y1="14" y2="66"/><text class="ch-text" x="${x(v)}" y="82" text-anchor="middle">${v}%</text>`,
      )
      .join("");
    body += `<line class="ch-whisker" x1="${x(box.whiskerLo)}" x2="${x(box.whiskerHi)}" y1="${mid}" y2="${mid}"/>`;
    body += `<rect class="ch-box" x="${x(box.q1)}" y="${mid - 14}" width="${Math.max(2, x(box.q3) - x(box.q1))}" height="28" rx="4" ${tip(`Middle half of scores: ${Math.round(box.q1)}–${Math.round(box.q3)}%. Median ${Math.round(box.median)}%.`)}/>`;
    body += `<line class="ch-median" x1="${x(box.median)}" x2="${x(box.median)}" y1="${mid - 14}" y2="${mid + 14}"/>`;
    body += box.outliers
      .map(
        (o) =>
          `<circle class="ch-out" cx="${x(o)}" cy="${mid}" r="5" ${tip(`Unusual score: ${Math.round(o)}%`)}/>`,
      )
      .join("");
    body += `<line class="ch-target" x1="${x(target)}" x2="${x(target)}" y1="14" y2="66"/>`;
    return svg(H, label, body, "chart-short");
  }

  /** Horizontal bars with confidence whiskers, one row per label. */
  function ciBars({ rows, target, label, width = W }) {
    const row = 44;
    const H = M.t + rows.length * row + 34;
    const l = 150;
    const x = lin(0, 100, l, width - 96);
    let body = [0, 25, 50, 75, 100]
      .map(
        (v) =>
          `<line class="ch-grid" x1="${x(v)}" x2="${x(v)}" y1="${M.t}" y2="${H - 28}"/><text class="ch-text" x="${x(v)}" y="${H - 10}" text-anchor="middle">${v}%</text>`,
      )
      .join("");
    rows.forEach((r, i) => {
      const cy = M.t + i * row + row / 2;
      body += `<text class="ch-label" x="${l - 10}" y="${cy + 4}" text-anchor="end">${esc(r.label)}</text>`;
      body += `<rect class="ch-bar" x="${l}" y="${cy - 9}" width="${Math.max(0, x(r.mean) - l)}" height="18" rx="4" ${tip(`${r.label}: average ${Math.round(r.mean)}% (likely ${Math.round(r.lo)}–${Math.round(r.hi)}%), ${fmt.plural(r.n, "student")}`)}/>`;
      if (Number.isFinite(r.lo) && r.n > 1)
        body += `<line class="ch-whisker" x1="${x(Math.max(0, r.lo))}" x2="${x(Math.min(100, r.hi))}" y1="${cy}" y2="${cy}"/><line class="ch-whisker" x1="${x(Math.max(0, r.lo))}" x2="${x(Math.max(0, r.lo))}" y1="${cy - 6}" y2="${cy + 6}"/><line class="ch-whisker" x1="${x(Math.min(100, r.hi))}" x2="${x(Math.min(100, r.hi))}" y1="${cy - 6}" y2="${cy + 6}"/>`;
      body += `<text class="ch-value" x="${x(Math.min(100, Number.isFinite(r.hi) ? r.hi : r.mean)) + 10}" y="${cy + 4}">${Math.round(r.mean)}%</text>`;
    });
    body += `<line class="ch-target" x1="${x(target)}" x2="${x(target)}" y1="${M.t - 4}" y2="${H - 28}"/>`;
    return svg(H, label, body, "", width);
  }

  /** Scatter plot with a fitted line. */
  function scatter({ pairs, reg, nameA, nameB, label }) {
    const H = 340;
    const lo = Math.max(
      0,
      Math.floor((Math.min(...pairs.map((p) => Math.min(p.x, p.y))) - 5) / 10) * 10,
    );
    const x = lin(lo, 100, M.l, W - M.r);
    const y = lin(lo, 100, H - M.b, M.t);
    const ticks = [];
    for (let v = lo; v <= 100; v += 10) ticks.push(v);
    let body = yGrid(y, H, ticks);
    body += ticks
      .map(
        (v) => `<text class="ch-text" x="${x(v)}" y="${H - 18}" text-anchor="middle">${v}%</text>`,
      )
      .join("");
    body += `<text class="ch-axis-title" x="${(M.l + W - M.r) / 2}" y="${H - 2}" text-anchor="middle">${esc(nameA)}</text>`;
    body += `<text class="ch-axis-title" transform="translate(12 ${(M.t + H - M.b) / 2}) rotate(-90)" text-anchor="middle">${esc(nameB)}</text>`;
    body += `<line class="ch-grid" x1="${x(lo)}" y1="${y(lo)}" x2="${x(100)}" y2="${y(100)}" stroke-dasharray="2 5"/>`;
    if (reg)
      body += `<line class="ch-fit ch-fit-strong" x1="${x(lo)}" y1="${y(S2(reg.predict(lo)))}" x2="${x(100)}" y2="${y(S2(reg.predict(100)))}"/>`;
    body += pairs
      .map(
        (p) =>
          `<circle class="ch-pt" cx="${x(p.x)}" cy="${y(p.y)}" r="6" ${tip(`${p.student.name}: ${Math.round(p.x)}% and ${Math.round(p.y)}%`)}/>`,
      )
      .join("");
    return svg(H, label, body);
  }
  const S2 = (v) => Math.max(-20, Math.min(120, v));

  /** Class average at each check with its likely range. */
  function bandLine({ points, target, label }) {
    const H = 300;
    const x = lin(0, Math.max(1, points.length - 1), M.l + 20, W - M.r - 20);
    const y = lin(0, 100, H - M.b, M.t);
    let body = yGrid(y, H, [0, 25, 50, 75, 100]);
    const withBand = points.filter((p) => p.n > 1 && Number.isFinite(p.lo));
    if (withBand.length > 1) {
      const up = points.map((p, i) => [x(i), y(Math.min(100, p.hi ?? p.mean))]);
      const dn = points.map((p, i) => [x(i), y(Math.max(0, p.lo ?? p.mean))]).reverse();
      body += `<polygon class="ch-cone" points="${pts([...up, ...dn])}"/>`;
    }
    body += targetLine(M.l, W - M.r, y, target);
    body += `<polyline class="ch-line" fill="none" points="${pts(points.map((p, i) => [x(i), y(p.mean)]))}"/>`;
    body += points
      .map(
        (p, i) =>
          `<circle class="ch-pt" cx="${x(i)}" cy="${y(p.mean)}" r="6" ${tip(`${fmt.date(p.date)} · ${p.assessment}: class average ${Math.round(p.mean)}% from ${fmt.plural(p.n, "score")}`)}/><text class="ch-text" x="${x(i)}" y="${H - 14}" text-anchor="middle">${fmt.date(p.date)}</text>`,
      )
      .join("");
    return svg(H, label, body);
  }

  /** Baseline against plan: how often the class lands at each proficiency level. */
  function simHist({ base, scen, goal, label }) {
    const H = 290;
    const x = lin(0, 100, M.l, W - M.r);
    const bins = base.hist.filter((b) => b.lo < 100 || b.count);
    const maxC = Math.max(1, ...base.hist.map((b) => b.count), ...scen.hist.map((b) => b.count));
    const y = lin(0, maxC * 1.1, H - M.b, M.t);
    let body = [0, 20, 40, 60, 80, 100]
      .map(
        (v) => `<text class="ch-text" x="${x(v)}" y="${H - 12}" text-anchor="middle">${v}%</text>`,
      )
      .join("");
    body += `<line class="ch-grid" x1="${M.l}" x2="${W - M.r}" y1="${y(0)}" y2="${y(0)}"/>`;
    const bw = (x(5) - x(0)) / 2 - 1.5;
    bins.forEach((b, i) => {
      const s = scen.hist[i];
      const bx = x(b.lo) + 1;
      const share = (c) => `${((100 * c) / base.sims || 0).toFixed(0)}`;
      body += `<rect class="ch-bar-base" x="${bx}" y="${y(b.count)}" width="${bw}" height="${y(0) - y(b.count)}" rx="2" ${tip(`Without the plan, class at ${b.lo}–${b.hi}%: ${share(b.count)}% of trials`)}/>`;
      body += `<rect class="ch-bar-scen" x="${bx + bw + 1}" y="${y(s.count)}" width="${bw}" height="${y(0) - y(s.count)}" rx="2" ${tip(`With the plan, class at ${s.lo}–${s.hi}%: ${share(s.count)}% of trials`)}/>`;
    });
    body += `<line class="ch-target" x1="${x(goal)}" x2="${x(goal)}" y1="${M.t}" y2="${H - M.b}"/><text class="ch-target-text" x="${x(goal) + 5}" y="${M.t + 10}">Goal ${goal}%</text>`;
    return svg(H, label, body);
  }

  /** Tiny trend line for a table cell: no axes, just the shape. */
  function spark(ys, target) {
    if (ys.length < 2) return "";
    const w = 64;
    const h = 22;
    const x = lin(0, ys.length - 1, 3, w - 3);
    const y = lin(0, 100, h - 3, 3);
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><line class="ch-target" x1="0" x2="${w}" y1="${y(target)}" y2="${y(target)}"/><polyline class="ch-line" fill="none" points="${pts(ys.map((v, i) => [x(i), y(v)]))}"/><circle class="ch-pt-sm" cx="${x(ys.length - 1)}" cy="${y(ys[ys.length - 1])}" r="2.6"/></svg>`;
  }

  /** Shared hover/focus tooltip for any [data-tip] mark inside root. */
  function wireTips(root) {
    const tipEl = NFE.$("#tip");
    if (!tipEl) return;
    const show = (el) => {
      const r = el.getBoundingClientRect();
      tipEl.textContent = el.dataset.tip;
      tipEl.classList.add("show");
      const w = tipEl.offsetWidth;
      tipEl.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
      tipEl.style.top = `${Math.max(8, r.top - tipEl.offsetHeight - 10)}px`;
    };
    const hide = () => tipEl.classList.remove("show");
    root.addEventListener(
      "pointerover",
      (e) => e.target.closest("[data-tip]") && show(e.target.closest("[data-tip]")),
    );
    root.addEventListener("pointerout", hide);
    root.addEventListener(
      "focusin",
      (e) => e.target.closest("[data-tip]") && show(e.target.closest("[data-tip]")),
    );
    root.addEventListener("focusout", hide);
  }

  /** Bell-curve points scaled to histogram counts. */
  function bellCurve(n, mean, sd, width) {
    if (!(sd > 0)) return null;
    const out = [];
    for (let v = 0; v <= 100; v += 2)
      out.push([
        v,
        n * width * (Math.exp(-0.5 * ((v - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))),
      ]);
    return out;
  }

  NFE.charts = {
    scoreChart,
    histogram,
    boxStrip,
    ciBars,
    scatter,
    bandLine,
    simHist,
    spark,
    wireTips,
    bellCurve,
    dateLabel,
  };
})();
