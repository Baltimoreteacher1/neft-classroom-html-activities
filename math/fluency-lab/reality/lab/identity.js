// One place that gives a page its grade identity. The band (early, design, analyze) sets structure and density; the grade
// (0 to 8) sets the palette, type and artwork. Every Reality Lab page calls this, so no page can forget it.
export const bandOf = (grade) => (grade <= 2 ? "early" : grade <= 5 ? "design" : "analyze");

export function applyIdentity(root, grade) {
  const g = Number.isInteger(grade) && grade >= 0 && grade <= 8 ? grade : 4;
  for (const el of [root, document.documentElement]) {
    el.dataset.band = bandOf(g);
    el.dataset.grade = String(g);
  }
  return g;
}
