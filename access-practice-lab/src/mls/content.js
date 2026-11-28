// Math Literacy Studio: content loader for the browser. The inventory (all 85 skills with their family and params) is one file;
// a grade's authored content loads when that grade is opened. mergeSkill joins the two into the Skill object the model uses.
import { BASE } from "../util.js";
import { mergeSkill } from "./merge.js";
import { registerSkills } from "./model.js";

const cache = new Map();
function get(path) {
  if (!cache.has(path)) {
    const p = fetch(`${BASE}/content/mls/${path}`, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error(`mls/${path}: HTTP ${r.status}`);
      return r.json();
    });
    cache.set(path, p);
    p.catch(() => cache.delete(path));
  }
  return cache.get(path);
}
export const loadInventory = () => get("inventory.json");
const gradeSkills = new Map();
export { mergeSkill };
/** All merged skills of one grade (loads that grade's file once). */
export async function loadGrade(g) {
  if (!gradeSkills.has(g)) {
    const [inv, data] = await Promise.all([loadInventory(), get(`skills/g${g}.json`)]);
    const byId = new Map(data.skills.map((s) => [s.id, s]));
    const merged = inv.skills.filter((s) => s.grade === g && byId.has(s.id)).map((s) => mergeSkill(s, byId.get(s.id)));
    registerSkills(merged);
    gradeSkills.set(g, merged);
  }
  return gradeSkills.get(g);
}
/** One merged skill by id (loads its grade). */
export async function loadSkill(id) {
  const g = Number(String(id)[1]);
  if (!(g >= 1 && g <= 8)) return null;
  // prerequisites may live in earlier grades; register them so prerequisite resources can name them
  const list = await loadGrade(g);
  const sk = list.find((s) => s.id === id) || null;
  if (sk) {
    const need = new Set((sk.prereq || []).map((p) => Number(p[1])).filter((x) => x !== g));
    await Promise.all([...need].map((x) => loadGrade(x).catch(() => [])));
  }
  return sk;
}
/** Everything, for search and the coverage view (loads all eight grade files, ~1 MB in total, once). */
export async function loadAll() {
  const lists = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map((g) => loadGrade(g)));
  return lists.flat();
}
export const gradeLabel = (g) => (g === 1 ? "Grade 1" : `Grade ${g}`);
