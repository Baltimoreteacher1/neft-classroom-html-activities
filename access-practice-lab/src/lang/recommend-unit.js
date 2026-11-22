// Skill-Gap Recommendation Engine: computes Next Recommended Unit locally
// from ACCESS_Lab_DB (sessions) and the on-device evidence ledger across the 4 WIDA domains.

import { GUIDED_UNITS } from "../content/guided-units.js";
import { loadLedger } from "./ledger.js";
import { openStorage } from "../acc/storage/access-db.js";
import { CORE_DOMAINS, safeJson, storage } from "../util.js";

const GUIDED_KEY = "accessPracticeLab:v1:guidedUnits";

export function recommendNextUnitSync(band = "6-8", extraSessions = []) {
  const ledger = loadLedger();
  const entries = Array.isArray(ledger?.entries) ? ledger.entries : [];
  const stats = Object.fromEntries(CORE_DOMAINS.map((d) => [d, { count: 0, ok: 0 }]));

  for (const e of entries) {
    const d = e?.domain;
    if (stats[d]) {
      stats[d].count += 1;
      if (e.m?.ok) stats[d].ok += 1;
    }
  }
  for (const s of extraSessions) {
    const d = s?.domain;
    if (stats[d]) {
      stats[d].count += 1;
      if (s.accuracy >= 0.7) stats[d].ok += 1;
    }
  }

  let weakest = "Listening";
  let lowestScore = Infinity;
  for (const d of CORE_DOMAINS) {
    const st = stats[d];
    const score = st.count === 0 ? -1 : st.ok / st.count + Math.min(st.count, 5) * 0.05;
    if (score < lowestScore) {
      lowestScore = score;
      weakest = d;
    }
  }

  const doneMap = safeJson(storage.get(GUIDED_KEY), {}) || {};
  const pool = GUIDED_UNITS.filter((u) => u.bands.includes(band) || band === "3-5" || band === "6-8");
  const match = pool.find((u) => u.domain === weakest && !doneMap[u.id]?.complete)
    || pool.find((u) => !doneMap[u.id]?.complete)
    || pool[0];

  return {
    unit: match,
    weakestDomain: weakest,
    reasonEn: stats[weakest].count === 0
      ? `You haven't tried ${weakest} yet—this 5-step unit is a great place to start.`
      : `Boost your ${weakest} skills with this curated 5-step sequence.`,
    reasonEs: stats[weakest].count === 0
      ? `Aún no has probado ${weakest}: esta unidad de 5 pasos es un buen comienzo.` // ES-REVIEW
      : `Fortalece tu destreza en ${weakest} con esta secuencia de 5 pasos.`, // ES-REVIEW
  };
}

export async function recommendNextUnit(band = "6-8") {
  let sessions = [];
  try {
    const db = await openStorage();
    sessions = (await db.sessions?.getAll?.()) || [];
  } catch {
    // IndexedDB unavailable; ledger alone is sufficient.
  }
  return recommendNextUnitSync(band, sessions);
}
