// Language Page baseline audit. Pulls all 162 units + lesson docs from the read APIs
// (BASE, default live) and recomputes the headline counts used by the validate:language-page gates.
// Usage: node tools/audit/language-page-baseline.mjs [--out dir] ; env BASE=https://thelanguagepage.com
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "https://thelanguagepage.com";
const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];

async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) return res.json();
    if (i === tries - 1) throw new Error(`${url} -> ${res.status}`);
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

export async function loadAll() {
  const lists = await pool(
    GRADES.flatMap((g) => SUBJECTS.map((s) => [g, s])),
    6,
    ([g, s]) => getJson(`${BASE}/api/bcpss/units?grade=${g}&subject=${encodeURIComponent(s)}`),
  );
  const summaries = lists.flatMap((l) => l.units);
  const units = await pool(summaries, 8, (u) => getJson(`${BASE}/api/bcpss/units/${u.id}`));
  const lessons = await pool(summaries, 8, (u) =>
    getJson(`${BASE}/api/bcpss/units/${u.id}/lessons`),
  );
  const insights = await getJson(`${BASE}/api/bcpss/insights`);
  return { summaries, units, lessons, insights };
}

export function measure({ summaries, units, lessons, insights }) {
  const m = { units: summaries.length };
  const vocab = units.flatMap((d) => d.connections?.[0]?.tier2_tier3_vocab || []);
  m.vocabTerms = vocab.length;
  m.vocabAuthoredFull = vocab.filter((v) => v.example && v.nonexample && v.cue).length;
  m.vocabTier = vocab.reduce((a, v) => ((a[v.tier] = (a[v.tier] || 0) + 1), a), {});
  m.frameBracketOnly = units.filter((d) => {
    const f = d.connections?.[0]?.unit_example_frame || "";
    return /\[[^\]]+\]/.test(f) && !/_{2,}/.test(f);
  }).length;
  const cog = units.flatMap((d) => d.esol_pack?.cognates || []);
  m.cognateKinds = cog.reduce((a, c) => ((a[c.kind] = (a[c.kind] || 0) + 1), a), {});
  m.cognatesTotal = cog.length;
  m.cognateTranslationOnlyShare = +((m.cognateKinds.bridge || 0) / (cog.length || 1)).toFixed(3);
  const lessonDocs = lessons;
  m.lessons = lessonDocs.reduce((n, l) => n + l.lessons.length, 0);
  m.lessonsPedagogyPending = lessonDocs
    .flatMap((l) => l.lessons)
    .filter((x) => x.review?.pedagogy === "pending").length;
  m.draftUnits = lessonDocs.filter((l) => l.source === "draft_standards_based").length;
  m.authoredUnits = lessonDocs
    .filter((l) => l.source !== "draft_standards_based")
    .map((l) => l.unit_id);
  const acts = units.flatMap((d) => d.activities || []);
  m.activities = acts.length;
  m.activityKinds = acts.reduce((a, x) => {
    const k = x.domain || x.kind || x.type || "?";
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});
  m.transfers = units.reduce((n, d) => n + (d.cross_subject_transfers || []).length, 0);
  m.unitsWithoutTransfers = units
    .filter((d) => !(d.cross_subject_transfers || []).length)
    .map((d) => d.unit.id);
  m.insightsKeys = Object.keys(insights).sort();
  return m;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outIdx = process.argv.indexOf("--out");
  const outDir = outIdx > 0 ? process.argv[outIdx + 1] : null;
  const data = await loadAll();
  const m = measure(data);
  console.log(JSON.stringify(m, null, 2));
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "baseline.json"), JSON.stringify(m, null, 2));
    fs.writeFileSync(path.join(outDir, "units-cache.json"), JSON.stringify(data));
  }
}
