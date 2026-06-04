// Shared forecast math lives here AND in app.js (computeForecast). Keep them in sync.
self.onmessage = (event) => {
  const payload = event.data || {};
  const state = payload.state || payload;
  const threshold = Number.isFinite(Number(payload.threshold))
    ? Number(payload.threshold)
    : 70;

  const bound = (n) =>
    Math.max(
      0,
      Math.min(100, Math.round(Number.isFinite(Number(n)) ? Number(n) : 0)),
    );
  const band = (score) => {
    const safeScore = bound(score);
    if (safeScore >= 85) return ["Strong", "ok"];
    if (safeScore >= 70) return ["Likely Ready", "info"];
    if (safeScore >= 60) return ["Approaching", "warn"];
    return ["Needs Reteach", "bad"];
  };
  const rowsFor = (studentId, standardCode) =>
    state.evidence.filter(
      (row) =>
        (!studentId || row.student === studentId) &&
        (!standardCode || row.standard === standardCode),
    );

  // Recency-weighted mean + simple linear trend (slope over dated evidence).
  // Interval derived from actual score variance (standard error), not a fixed spread.
  const forecast = (studentId, standardCode) => {
    const rows = rowsFor(studentId, standardCode);
    if (!rows.length)
      return {
        n: 0,
        p: 0,
        lo: 0,
        hi: 0,
        label: "No data",
        cls: "warn",
        conf: "Very Low",
        trend: "flat",
        slope: 0,
      };

    const sorted = rows
      .slice()
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
    const pcts = sorted.map((row) => bound(row.pct));
    const n = pcts.length;

    // Recency weights: oldest = 1, newest = n (linear emphasis on recent evidence).
    let weightedSum = 0,
      weightTotal = 0;
    pcts.forEach((value, index) => {
      const w = index + 1;
      weightedSum += value * w;
      weightTotal += w;
    });
    const weightedMean = weightTotal ? weightedSum / weightTotal : 0;

    // Linear trend (slope) over evidence order; project half a step forward.
    let slope = 0;
    if (n >= 2) {
      const meanX = (n - 1) / 2;
      const meanY = pcts.reduce((s, v) => s + v, 0) / n;
      let num = 0,
        den = 0;
      pcts.forEach((value, index) => {
        num += (index - meanX) * (value - meanY);
        den += (index - meanX) ** 2;
      });
      slope = den ? num / den : 0;
    }
    const projected = bound(weightedMean + slope * 0.5);

    // Standard error of the mean from actual variance.
    const plainMean = pcts.reduce((s, v) => s + v, 0) / n;
    const variance =
      n >= 2 ? pcts.reduce((s, v) => s + (v - plainMean) ** 2, 0) / (n - 1) : 0;
    const stdErr = n >= 2 ? Math.sqrt(variance / n) : 14;
    const margin = Math.max(4, Math.min(20, Math.round(1.6 * stdErr)));

    const [label, cls] = band(projected);
    const trend =
      slope > 1.5 ? "improving" : slope < -1.5 ? "slipping" : "flat";

    return {
      n,
      p: projected,
      lo: bound(projected - margin),
      hi: bound(projected + margin),
      label,
      cls,
      conf: n >= 4 ? "High" : n >= 2 ? "Medium" : "Low",
      trend,
      slope: Math.round(slope * 10) / 10,
    };
  };

  const grid = state.students.map((student) => ({
    student,
    forecasts: state.standards.map((standard) => ({
      standard,
      result: forecast(student.id, standard.code),
    })),
  }));

  const groups = state.standards
    .map((standard) => ({
      standard,
      kids: state.students
        .map((student) => ({
          student,
          result: forecast(student.id, standard.code),
        }))
        .filter((entry) => entry.result.n && entry.result.p < threshold),
    }))
    .filter((group) => group.kids.length);

  self.postMessage({ grid, groups });
};
