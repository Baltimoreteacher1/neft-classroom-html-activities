// Evidence.js — learning evidence for the game suite, kept apart from game scoring.
//
// A record says what the learner did on one prompt: first attempt, revision, scaffolds opened, the
// misconception a wrong choice pointed at. It never contains Shards, scores, reaction times or a
// proficiency claim. Summaries use the labels Practice Progress, Skill Evidence and Observed Performance;
// nothing here estimates an official WIDA ACCESS score.
export const OUTCOMES = Object.freeze(["independent", "revised", "scaffolded", "revealed"]);

export const FAMILY_LABEL = Object.freeze({
  "context-clues": ["context clues", "pistas de contexto"],
  "main-idea": ["main idea", "idea principal"],
  inference: ["inference", "inferencia"],
  "text-evidence": ["text evidence", "evidencia del texto"],
  sequencing: ["sequencing and directions", "secuencia e instrucciones"],
  "word-parts": ["word parts", "partes de las palabras"],
  vocabulary: ["vocabulary", "vocabulario"],
  connectives: ["connectives and transitions", "conectores y transiciones"],
  syntax: ["sentence structure and grammar", "estructura de oraciones y gramática"],
  argument: ["claims and reasons", "afirmaciones y razones"],
  "listening-comprehension": ["listening comprehension", "comprensión auditiva"],
  "reading-comprehension": ["reading comprehension", "comprensión de lectura"],
  "oral-explanation": ["explaining aloud", "explicar en voz alta"],
  "written-explanation": ["written explanation", "explicación escrita"],
  "language-use": ["language use", "uso del lenguaje"],
});
const labelOf = (family, i) => (FAMILY_LABEL[family] || FAMILY_LABEL["language-use"])[i];

export const MAX_RECORDS = 600;

/** Classify one prompt result. `attempts` is 1 or 2, `scaffolds` the layer kinds opened, `revealed` whether the answer was shown. */
export function classify({ firstCorrect, finalCorrect, scaffolds = [], revealed = false }) {
  if (revealed || !finalCorrect) return "revealed";
  if (firstCorrect && scaffolds.length === 0) return "independent";
  if (firstCorrect) return "scaffolded";
  return scaffolds.length ? "scaffolded" : "revised";
}

export function makeRecord({
  prompt,
  game,
  mode,
  level,
  band,
  firstCorrect,
  finalCorrect,
  attempts,
  scaffolds = [],
  decoder = false,
  revealed = false,
  misconception = "",
  at = new Date().toISOString(),
}) {
  const outcome = classify({
    firstCorrect,
    finalCorrect,
    scaffolds: decoder ? [...scaffolds, "decoder"] : scaffolds,
    revealed,
  });
  return {
    id: prompt.id,
    sourceId: prompt.sourceId,
    game,
    mode,
    band,
    level,
    domain: prompt.domain,
    family: prompt.analyticsMetadata?.skillFamily || "language-use",
    skill: prompt.languageObjective,
    format: prompt.format,
    outcome,
    firstCorrect: Boolean(firstCorrect),
    attempts: attempts === 2 ? 2 : 1,
    scaffolds: [...scaffolds, ...(decoder ? ["decoder"] : [])].slice(0, 6),
    misconception: String(misconception || "").slice(0, 200),
    // construct prompts are a self-check against criteria, never counted as speaking or writing mastery
    selfChecked: prompt.format === "construct",
    at,
  };
}

export function cleanRecords(raw) {
  return (Array.isArray(raw) ? raw : [])
    .filter(
      (r) =>
        r &&
        typeof r.id === "string" &&
        OUTCOMES.includes(r.outcome) &&
        typeof r.domain === "string",
    )
    .map((r) => ({
      ...r,
      scaffolds: Array.isArray(r.scaffolds) ? r.scaffolds.slice(0, 6) : [],
      misconception: String(r.misconception || "").slice(0, 200),
    }))
    .slice(-MAX_RECORDS);
}

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

/** The numbers a results screen, a printed report and the teacher view all read. */
export function summarize(records) {
  const rs = cleanRecords(records);
  const n = rs.length;
  const by = (key) => {
    const out = {};
    for (const r of rs) {
      const k = r[key];
      const o = (out[k] ||= {
        n: 0,
        firstOk: 0,
        independent: 0,
        revised: 0,
        scaffolded: 0,
        revealed: 0,
      });
      o.n += 1;
      if (r.firstCorrect) o.firstOk += 1;
      o[r.outcome] += 1;
    }
    return out;
  };
  const miss = new Map();
  for (const r of rs) {
    if (!r.misconception) continue;
    const k = `${r.family}|${r.misconception}`;
    miss.set(k, (miss.get(k) || 0) + 1);
  }
  const misconceptions = [...miss.entries()]
    .map(([k, count]) => ({ family: k.split("|")[0], note: k.slice(k.indexOf("|") + 1), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const sum = {
    attempted: n,
    firstAttemptCorrect: rs.filter((r) => r.firstCorrect).length,
    independent: rs.filter((r) => r.outcome === "independent").length,
    revisedSuccess: rs.filter((r) => r.outcome === "revised").length,
    scaffoldedSuccess: rs.filter((r) => r.outcome === "scaffolded").length,
    revealed: rs.filter((r) => r.outcome === "revealed").length,
    byDomain: by("domain"),
    byFamily: by("family"),
    misconceptions,
  };
  sum.firstAttemptPct = pct(sum.firstAttemptCorrect, n);
  sum.independentPct = pct(sum.independent, n);
  sum.nextPractice = nextPractice(sum);
  sum.notes = teacherNotes(sum);
  return sum;
}

/** Practice to suggest next: families where help was needed most, and a stretch where the learner is independent. */
export function nextPractice(sum) {
  const rows = Object.entries(sum.byFamily).filter(([, o]) => o.n >= 2);
  const support = rows
    .filter(([, o]) => o.independent / o.n < 0.5)
    .sort((a, b) => a[1].independent / a[1].n - b[1].independent / b[1].n);
  const strong = rows.filter(([, o]) => o.independent / o.n >= 0.75);
  const out = [];
  for (const [f] of support.slice(0, 2))
    out.push({
      family: f,
      kind: "practice",
      en: `Practice ${labelOf(f, 0)} with the hints turned on, then try it again on your own.`,
      es: `Practica ${labelOf(f, 1)} con las pistas activadas y luego inténtalo otra vez por tu cuenta.`,
    });
  for (const [f] of strong.slice(0, 1))
    out.push({
      family: f,
      kind: "stretch",
      en: `You are working on your own with ${labelOf(f, 0)}. Try a harder level or a new topic.`,
      es: `Trabajas por tu cuenta con ${labelOf(f, 1)}. Prueba un nivel más difícil o un tema nuevo.`,
    });
  if (!out.length && sum.attempted)
    out.push({
      family: "",
      kind: "keep",
      en: "Keep practicing a few different skills so there is more evidence.",
      es: "Sigue practicando varias destrezas para tener más evidencia.",
    });
  return out;
}

/** Specific, evidence-bearing sentences for a teacher. Counts only; no label like "needs improvement" without evidence. */
export function teacherNotes(sum) {
  const out = [];
  for (const [f, o] of Object.entries(sum.byFamily).sort((a, b) => b[1].n - a[1].n)) {
    if (o.n < 2) continue;
    const helped = o.scaffolded + o.revised;
    out.push({
      family: f,
      en: `${labelOf(f, 0)}: ${o.independent} of ${o.n} right on the first try without help; ${helped} needed a hint or a second try; ${o.revealed} needed the answer shown.`,
      es: `${labelOf(f, 1)}: ${o.independent} de ${o.n} correctas al primer intento sin ayuda; ${helped} necesitaron una pista o un segundo intento; ${o.revealed} necesitaron ver la respuesta.`,
    });
  }
  for (const m of sum.misconceptions.slice(0, 3))
    out.push({
      family: m.family,
      en: `Misconception noted ${m.count} time${m.count === 1 ? "" : "s"} in ${labelOf(m.family, 0)}: ${m.note}`,
      es: `Concepto erróneo observado ${m.count} ${m.count === 1 ? "vez" : "veces"} en ${labelOf(m.family, 1)}: ${m.note}`,
    });
  return out;
}

const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet-formula safe
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** A practical export: one row per prompt, no name, no Shards, no timing. */
export function toCsv(records) {
  const head = [
    "date",
    "game",
    "mode",
    "band",
    "practice_level",
    "domain",
    "skill_family",
    "language_objective",
    "format",
    "first_attempt_correct",
    "attempts",
    "outcome",
    "scaffolds",
    "misconception",
  ];
  const rows = cleanRecords(records).map((r) => [
    r.at,
    r.game,
    r.mode,
    r.band,
    r.level,
    r.domain,
    r.family,
    r.skill,
    r.format,
    r.firstCorrect ? "yes" : "no",
    r.attempts,
    r.outcome,
    r.scaffolds.join("+"),
    r.misconception,
  ]);
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** Printable report body (HTML string). The caller wraps it in a page. */
export function reportHTML(sum, { title = "Game practice report", subtitle = "" } = {}) {
  const rows = Object.entries(sum.byDomain)
    .map(
      ([d, o]) =>
        `<tr><th scope="row">${esc(d)}</th><td>${o.n}</td><td>${o.firstOk}</td><td>${o.independent}</td><td>${o.revised + o.scaffolded}</td><td>${o.revealed}</td></tr>`,
    )
    .join("");
  return `<article class="gr-report"><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
<p>Practice evidence from game play. It shows what was practiced and how much help was used. It is not an official WIDA ACCESS score or a proficiency level.</p>
<ul><li>Questions attempted: <strong>${sum.attempted}</strong></li><li>First-attempt correct: <strong>${sum.firstAttemptCorrect}</strong> (${sum.firstAttemptPct}%)</li><li>Independent (first try, no help): <strong>${sum.independent}</strong></li><li>Right after a hint or a second try: <strong>${sum.revisedSuccess + sum.scaffoldedSuccess}</strong></li><li>Answer shown: <strong>${sum.revealed}</strong></li></ul>
<table><caption>By language domain</caption><thead><tr><th scope="col">Domain</th><th scope="col">Tried</th><th scope="col">First try right</th><th scope="col">Independent</th><th scope="col">With help</th><th scope="col">Shown</th></tr></thead><tbody>${rows}</tbody></table>
<h2>What the evidence shows</h2><ul>${sum.notes.map((x) => `<li>${esc(x.en)}</li>`).join("")}</ul>
<h2>Suggested next practice</h2><ul>${sum.nextPractice.map((x) => `<li>${esc(x.en)}</li>`).join("")}</ul></article>`;
}
