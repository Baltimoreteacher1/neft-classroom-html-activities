// Student-shell paths. Query links from older lessons remain readable at boot.
export const ROOT = "/math/fluency-lab/";

const slugOverrides = { "mul-6-9": "multiplication-6-9" };
const idOverrides = Object.fromEntries(Object.entries(slugOverrides).map(([id, slug]) => [slug, id]));

export function gradePath(grade) {
  return `${ROOT}grade-${grade === 0 ? "k" : grade}/`;
}

export function skillPath(grade, id, stage = "see") {
  const base = `${gradePath(grade)}${slugOverrides[id] || id}/`;
  return stage === "see" ? base : `${base}?stage=${stage === "try" ? "try" : "practice"}`;
}

export function viewPath(view, grade) {
  const path = `${ROOT}${{ home: "today/", library: "skills/", progress: "progress/" }[view] || ""}`;
  return grade === null ? path : `${path}?grade=${grade}`;
}

export function parsePath(pathname) {
  if (!pathname.startsWith(ROOT)) return null;
  const parts = pathname.slice(ROOT.length).split("/").filter(Boolean);
  if (parts.length === 1 && ["today", "skills", "progress"].includes(parts[0]))
    return { view: { today: "home", skills: "library", progress: "progress" }[parts[0]] };
  const gradeMatch = /^grade-(k|[1-8])$/.exec(parts[0] || "");
  if (!gradeMatch) return null;
  const grade = gradeMatch[1] === "k" ? 0 : Number(gradeMatch[1]);
  if (parts.length === 1) return { view: "library", grade };
  if (parts.length === 2) return { view: "skill", grade, skillId: idOverrides[parts[1]] || parts[1] };
  return null;
}
