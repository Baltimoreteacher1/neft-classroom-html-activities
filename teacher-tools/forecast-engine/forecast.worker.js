self.onmessage = (event) => {
  const state = event.data;

  const bound = (n) => Math.max(0, Math.min(100, Math.round(Number.isFinite(Number(n)) ? Number(n) : 0)));
  const avg = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const band = (score) => {
    const safeScore = bound(score);
    if (safeScore >= 85) return ['Strong', 'ok'];
    if (safeScore >= 70) return ['Likely Ready', 'info'];
    if (safeScore >= 60) return ['Approaching', 'warn'];
    return ['Needs Reteach', 'bad'];
  };
  const rowsFor = (studentId, standardCode) => state.evidence.filter((row) => (!studentId || row.student === studentId) && (!standardCode || row.standard === standardCode));
  const forecast = (studentId, standardCode) => {
    const rows = rowsFor(studentId, standardCode);
    if (!rows.length) return { n: 0, p: 0, lo: 0, hi: 0, label: 'No data', cls: 'warn', conf: 'Very Low' };

    const center = avg(rows.map((row) => bound(row.pct)));
    const spread = rows.length >= 4 ? 6 : rows.length >= 2 ? 10 : 14;
    const [label, cls] = band(center);

    return {
      n: rows.length,
      p: bound(center),
      lo: bound(center - spread),
      hi: bound(center + spread),
      label,
      cls,
      conf: rows.length >= 4 ? 'High' : rows.length >= 2 ? 'Medium' : 'Low'
    };
  };

  const grid = state.students.map((student) => ({
    student,
    forecasts: state.standards.map((standard) => ({
      standard,
      result: forecast(student.id, standard.code)
    }))
  }));

  const groups = state.standards.map((standard) => ({
    standard,
    kids: state.students
      .map((student) => ({ student, result: forecast(student.id, standard.code) }))
      .filter((entry) => entry.result.n && entry.result.p < 70)
  })).filter((group) => group.kids.length);

  self.postMessage({ grid, groups });
};
