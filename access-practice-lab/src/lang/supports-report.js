// "Supports and independence": which supports a learner opened, and how much of their work was on
// their own. One report for the learner's Passport, the teacher's conference sheet and the family
// letter, so the three can never disagree. It counts first attempts (a revision after feedback is
// supported by that feedback) and Listening/Reading answers. Counts and sentences only: no score,
// no level, no percentage of "independence".
import { MIN_POINTS, firstAttempts } from "./ledger.js";

export const SUPPORT_NAMES = Object.freeze({
  frames: { en: "Sentence frames", es: "Marcos de oraciones" },
  bank: { en: "Word bank", es: "Banco de palabras" },
  model: { en: "A model", es: "Un modelo" },
  coach: { en: "Language coach", es: "Entrenador de lenguaje" },
  l1: { en: "Spanish bridges", es: "Puentes en español" },
  hint: { en: "Hints", es: "Pistas" },
});
const DOMAINS = ["Speaking", "Writing"];

/** Listening/Reading results from either record shape: local `{record:{results}}` rows or a share's `{results}` map. */
function selectedResults(records) {
  const rows = Array.isArray(records) ? records : Object.values(records || {});
  const out = [];
  for (const row of rows) {
    const domain = row?.domain;
    const results = row?.record?.results || row?.results;
    if (!["Listening", "Reading"].includes(domain) || !results || typeof results !== "object")
      continue;
    for (const r of Object.values(results))
      if (typeof r?.ok === "boolean" && r.meaningful !== false)
        out.push({ domain, withHelp: Boolean(r.supportUsed), ok: r.ok });
  }
  return out;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * @param {{entries?: object[], records?: object|object[]}} source a normalized share, or the lab's local ledger and records
 * @returns the report; `enough` is false under MIN_POINTS first attempts and `lines` is then empty.
 */
export function supportsReport({ entries = [], records = {} } = {}) {
  const fa = firstAttempts(Array.isArray(entries) ? entries : []);
  const byStage = { independent: 0, supported: 0, guided: 0 };
  const byDomain = Object.fromEntries(DOMAINS.map((d) => [d, { n: 0, independent: 0 }]));
  const byUse = {};
  const opened = Object.fromEntries(Object.keys(SUPPORT_NAMES).map((k) => [k, 0]));
  for (const e of fa) {
    byStage[Object.hasOwn(byStage, e.stage) ? e.stage : "supported"] += 1;
    const d = byDomain[e.domain];
    if (d) {
      d.n += 1;
      if (e.stage === "independent") d.independent += 1;
    }
    const u = (byUse[e.use || "Other"] ||= { n: 0, independent: 0 });
    u.n += 1;
    if (e.stage === "independent") u.independent += 1;
    for (const [k, v] of Object.entries(e.supports || {}))
      if (v && Object.hasOwn(opened, k)) opened[k] += 1;
  }
  const items = selectedResults(records);
  const selected = Object.fromEntries(
    ["Listening", "Reading"].map((d) => {
      const rows = items.filter((r) => r.domain === d);
      return [
        d,
        {
          n: rows.length,
          onOwn: rows.filter((r) => !r.withHelp).length,
          withHelp: rows.filter((r) => r.withHelp).length,
        },
      ];
    }),
  );
  const n = fa.length;
  const enough = n >= MIN_POINTS;
  const topSupports = Object.entries(opened)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count, ...SUPPORT_NAMES[key] }));
  const lines = [];
  if (enough) {
    lines.push({
      en: `${byStage.independent} of ${plural(n, "first attempt", "first attempts")} in speaking and writing were on their own, with no supports opened.`,
      es: `${byStage.independent} de ${plural(n, "primer intento", "primeros intentos")} al hablar y escribir fueron sin ayuda, sin abrir apoyos.`,
    });
    if (topSupports.length)
      lines.push({
        en: `Supports opened most: ${topSupports
          .slice(0, 3)
          .map((s) => `${s.en.toLowerCase()} (${s.count})`)
          .join(", ")}.`,
        es: `Apoyos más usados: ${topSupports
          .slice(0, 3)
          .map((s) => `${s.es.toLowerCase()} (${s.count})`)
          .join(", ")}.`,
      });
  }
  for (const d of ["Listening", "Reading"]) {
    const s = selected[d];
    if (s.n >= MIN_POINTS)
      lines.push({
        en: `${d}: ${s.onOwn} of ${plural(s.n, "answer", "answers")} were on their own; ${s.withHelp} used help.`,
        es: `${d === "Listening" ? "Escuchar" : "Leer"}: ${s.onOwn} de ${plural(s.n, "respuesta", "respuestas")} fueron sin ayuda; ${s.withHelp} usaron ayuda.`,
      });
  }
  return { n, enough, byStage, byDomain, byUse, opened, topSupports, selected, lines };
}
