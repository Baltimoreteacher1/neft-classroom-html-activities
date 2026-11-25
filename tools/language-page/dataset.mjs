// Loads the full Language Page dataset IN-PROCESS by calling the real Pages Function handlers
// (no network, no database): 162 unit documents, 162 lesson documents and the list rows.

import * as apiLessons from "../../functions/api/bcpss/units/[unitId]/lessons.js";
import * as apiUnit from "../../functions/api/bcpss/units/[unitId].js";
import * as apiUnits from "../../functions/api/bcpss/units.js";

export const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
export const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];

async function call(mod, url, params = {}) {
  const res = await mod.onRequest({ request: new Request(url), env: {}, params, waitUntil() {} });
  if (res.status !== 200) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

export async function loadDataset() {
  const lists = [];
  for (const g of GRADES)
    for (const s of SUBJECTS)
      lists.push(
        await call(
          apiUnits,
          `https://x.test/api/bcpss/units?grade=${g}&subject=${encodeURIComponent(s)}`,
        ),
      );
  const summaries = lists.flatMap((l) => l.units);
  const units = [];
  const lessons = [];
  for (const u of summaries) {
    units.push(await call(apiUnit, `https://x.test/api/bcpss/units/${u.id}`, { unitId: u.id }));
    lessons.push(
      await call(apiLessons, `https://x.test/api/bcpss/units/${u.id}/lessons`, { unitId: u.id }),
    );
  }
  return { summaries, units, lessons };
}

export const vocabOf = (detail) => detail.connections?.[0]?.tier2_tier3_vocab || [];
export const clone = (x) => JSON.parse(JSON.stringify(x));
