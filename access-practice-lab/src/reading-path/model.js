// Reading Path completion is a bookmark, never a result or a proficiency judgment.
export const READING_PATH_KEY = "accessPracticeLab:v1:reading-path";
export function cleanProgress(value, units) {
  const allowed = new Set(units.flatMap((u) => u.items.map((i) => `${u.id}/${i.id}`)));
  return Object.fromEntries(
    Object.entries(value && typeof value === "object" ? value : {}).filter(
      ([key, done]) => allowed.has(key) && done === true,
    ),
  );
}
export const unitDone = (unit, progress) =>
  unit.items.every((i) => progress[`${unit.id}/${i.id}`] === true);
export const nextUnit = (units, progress) => units.find((u) => !unitDone(u, progress)) || units[0];
export const olderSkin = (band) => ["3-5", "6-8"].includes(band);
export function seededOrder(items, seed) {
  let h = [...String(seed)].reduce(
    (a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
// Accept only a listed choice; anything else (a tampered select, a stale value) falls back to the first.
export const choose = (value, allowed) => allowed.find((a) => String(a) === String(value)) ?? allowed[0];
