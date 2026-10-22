// The misconception traps a Unit 4 studio page uses, for the "My thinking" panel (assets/u4-studio-thinking.js).
// Source of truth is data/practice-studio/misconceptions.json; data/practice-studio-u4/traps-*.json holds Unit 4 traps that
// have not been folded into it yet. Both are read, so the pages are right at either stage.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";
import { u4McItems } from "../../tools/lib/u4-mc-items.mjs";

/** @returns {Record<string, any>} every trap id -> its entry */
export function allTraps() {
  const read = (/** @type {string} */ rel) =>
    JSON.parse(readFileSync(join(REPO_ROOT, rel), "utf8"));
  const traps = { ...read("data/practice-studio/misconceptions.json").traps };
  const dir = join(REPO_ROOT, "data/practice-studio-u4");
  for (const f of existsSync(dir) ? readdirSync(dir).sort() : [])
    if (/^traps-.*\.json$/.test(f))
      Object.assign(traps, read(`data/practice-studio-u4/${f}`).traps);
  return traps;
}

/** The name and quick fix (EN + ES) of every trap a page's multiple-choice items name, in id order. */
export function usedTraps(/** @type {string} */ page) {
  const traps = allTraps();
  const ids = new Set(
    u4McItems(page).flatMap((m) => (Array.isArray(m.item.tags) ? m.item.tags : []).filter(Boolean)),
  );
  /** @type {Record<string, { name: string, nameEs: string, fix: string, fixEs: string }>} */
  const out = {};
  for (const id of [...ids].sort()) {
    const t = traps[id];
    if (!t) throw new Error(`${page} names trap "${id}", which is not a misconception id`);
    out[id] = { name: t.name, nameEs: t.nameEs, fix: t.fix, fixEs: t.fixEs };
  }
  return out;
}
