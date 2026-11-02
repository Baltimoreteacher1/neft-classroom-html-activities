// Coverage matrix and gap report for the authored bank (Phase 6A/6F). Pure: bank and standards in, plain objects out, so
// the same numbers feed the publisher report, the teacher's assessment builder and the tests.
const tally = (list, key) => list.reduce((o, x) => ({ ...o, [key(x)]: (o[key(x)] || 0) + 1 }), {});
const base = (code) => String(code).replace(/\.[a-d]$/, "");

// For each standard: how many items, and across which DOK levels, types and representations. `thin` marks standards with
// fewer than `min` items; `bare` marks standards with none.
export function coverageMatrix(bank, standards, { grade = null, min = 3 } = {}) {
  const rows = standards
    .filter((s) => grade === null || s.grade === Number(grade))
    .map((s) => {
      const items = bank.filter((it) => base(it.standard) === s.code);
      return {
        code: s.code,
        grade: s.grade,
        domain: s.domain,
        cluster: s.cluster,
        text: s.text,
        count: items.length,
        dok: tally(items, (i) => i.dok),
        types: tally(items, (i) => i.type),
        representations: tally(items, (i) => i.representation),
        thin: items.length > 0 && items.length < min,
        bare: items.length === 0,
        hasDok3: items.some((i) => i.dok === 3),
      };
    });
  return rows;
}

export function summarizeBank(bank, standards) {
  const byGrade = {};
  for (let g = 0; g <= 8; g += 1) {
    const items = bank.filter((i) => i.grade === g);
    if (!items.length && g === 0) continue;
    const cov = coverageMatrix(bank, standards, { grade: g });
    byGrade[g] = {
      items: items.length,
      standardsWithItems: cov.filter((r) => !r.bare).length,
      standards: cov.length,
      bare: cov.filter((r) => r.bare).map((r) => r.code),
      thin: cov.filter((r) => r.thin).map((r) => r.code),
      dok: tally(items, (i) => i.dok),
      types: tally(items, (i) => i.type),
      conceptual: items.filter((i) => i.verify?.kind === "conceptual").length,
      reviewed: items.filter((i) => i.provenance?.reviewed === true).length,
    };
  }
  const items = bank.length;
  return {
    items,
    byGrade,
    dok: tally(bank, (i) => i.dok),
    types: tally(bank, (i) => i.type),
    reviewed: bank.filter((i) => i.provenance?.reviewed === true).length,
    conceptual: bank.filter((i) => i.verify?.kind === "conceptual").length,
  };
}
