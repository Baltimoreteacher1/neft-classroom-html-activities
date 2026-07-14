/**
 * Parent-update note builder (pure, no I/O, no network).
 *
 * Turns the progress "grades" pivot into per-student summaries and renders a
 * bilingual (English / Spanish) family note. Shared by the offline CLI
 * (scripts/parent-updates.mjs). The live page teacher-tools/parent-updates/
 * mirrors this same phrasing inline — keep the two in sync if you change tone.
 *
 * CONTRACT: buildWeeklyDigest() below renders one student of the
 * GET /api/progress/digest response. The live page's inline digestHTML()
 * mirrors its exact phrasing — any wording change here must be mirrored in
 * teacher-tools/parent-updates/index.html (and vice versa).
 *
 * Mastery thresholds match engine/core/grade.js:
 *   >=85 Strong | >=70 Likely Ready | >=60 Approaching | else Needs Reteach.
 */

const STRONG = 85;
const PRACTICE_BELOW = 70;

/** Band + bilingual sentence fragment for an average (null = no scored work). */
export function bandInfo(pct) {
  if (pct == null || Number.isNaN(pct))
    return { band: "Getting Started", en: "is just getting started this term.", es: "está comenzando este período." };
  if (pct >= STRONG)
    return { band: "Strong", en: "is doing excellent work in math.", es: "está haciendo un trabajo excelente en matemáticas." };
  if (pct >= 70)
    return { band: "Likely Ready", en: "is doing well and is on track.", es: "va bien y está en camino." };
  if (pct >= 60)
    return { band: "Approaching", en: "is making steady progress and building skills.", es: "está progresando de manera constante y desarrollando habilidades." };
  return { band: "Needs Practice", en: "would benefit from some extra practice at home.", es: "se beneficiaría de práctica adicional en casa." };
}

/**
 * Build per-student summaries from a `grades` pivot response
 * ({ activities:[titles], rows:[[name, section, ...cells, avg]] }).
 */
export function summarizeGrades(grades) {
  const activities = grades.activities || [];
  return (grades.rows || []).map((row) => {
    const name = row[0];
    const section = row[1];
    const cells = row.slice(2, 2 + activities.length);
    const avgRaw = row[row.length - 1];
    const scored = activities
      .map((title, i) => ({ title, score: numeric(cells[i]) }))
      .filter((a) => a.score != null);
    const average = numeric(avgRaw);
    return {
      name,
      section,
      average,
      completed: scored.length,
      strengths: scored.filter((a) => a.score >= STRONG).map((a) => a.title),
      practice: scored.filter((a) => a.score < PRACTICE_BELOW).map((a) => a.title),
    };
  });
}

function numeric(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

const li = (items) => items.map((t) => `<li>${esc(t)}</li>`).join("");

/**
 * Render one student's bilingual note as an HTML fragment (a `.parent-note`
 * containing the standard `.cols`/`.lang` two-column family-letter markup).
 */
export function buildNoteHTML(s, { date = "" } = {}) {
  const b = bandInfo(s.average);
  const avgText = s.average == null ? "—" : `${s.average}%`;
  const strengthsEn = s.strengths.length ? `<ul>${li(s.strengths)}</ul>` : `<p>Keep up the great effort!</p>`;
  const strengthsEs = s.strengths.length ? `<ul>${li(s.strengths)}</ul>` : `<p>¡Sigan con el gran esfuerzo!</p>`;
  const practiceEn = s.practice.length
    ? `<ul>${li(s.practice)}</ul><p>Try the <strong>Spiral Review</strong> together at eduwonderlab.com/spiral-review — 5 minutes a few nights a week makes a big difference.</p>`
    : `<p>Nothing specific to reteach right now — a few minutes of Spiral Review keeps skills sharp.</p>`;
  const practiceEs = s.practice.length
    ? `<ul>${li(s.practice)}</ul><p>Practiquen juntos el <strong>Repaso en Espiral</strong> en eduwonderlab.com/spiral-review — 5 minutos algunas noches por semana hacen una gran diferencia.</p>`
    : `<p>Nada específico que repasar por ahora — unos minutos de Repaso en Espiral mantienen las habilidades firmes.</p>`;

  return `<article class="parent-note" data-name="${esc(s.name)}" data-section="${esc(s.section)}">
  <header class="pn-head">
    <div><strong>${esc(s.name || "Student")}</strong> · <span class="pn-class">${esc(s.section || "")}</span></div>
    <div class="pn-meta">Average: <strong>${avgText}</strong> · Completed: ${s.completed}${date ? ` · ${esc(date)}` : ""}</div>
  </header>
  <div class="cols">
    <div class="lang">
      <span class="flag">🇺🇸 English</span>
      <h2>How ${esc(firstName(s.name))} is doing</h2>
      <p>${esc(firstName(s.name))} ${b.en}${s.average == null ? "" : ` (average ${avgText}).`}</p>
      <h3>Strengths</h3>${strengthsEn}
      <h3>Let's practice at home</h3>${practiceEn}
    </div>
    <div class="lang">
      <span class="flag">🇲🇽 Español</span>
      <h2>Cómo va ${esc(firstName(s.name))}</h2>
      <p>${esc(firstName(s.name))} ${b.es}${s.average == null ? "" : ` (promedio ${avgText}).`}</p>
      <h3>Fortalezas</h3>${strengthsEs}
      <h3>Practiquemos en casa</h3>${practiceEs}
    </div>
  </div>
</article>`;
}

function firstName(name) {
  return String(name || "your child").trim().split(/\s+/)[0] || "your child";
}

/* ---- Weekly bilingual digest (GET /api/progress/digest students[]) -------- */

/**
 * Match a digest activityId against the lesson family-homework map
 * (curriculum/lesson-family-homework.js: { "4-1": { text, href }, … }).
 * Lesson save-resume ids look like "lessons-4-1" / "lessons-4-1-flagship".
 */
export function familyHomeworkFor(activityId, map) {
  if (!activityId || !map) return null;
  const id = String(activityId);
  if (map[id]) return map[id];
  const stripped = id.replace(/^lessons?-/, "");
  if (map[stripped]) return map[stripped];
  const m = id.match(/(\d{1,2}-\d{1,2}(?:-flagship)?)$/);
  return (m && map[m[1]]) || null;
}

const MAX_DIGEST_ACTIVITIES = 8;

/**
 * Render one student's bilingual weekly digest as an HTML fragment (same
 * `.parent-note` / `.cols` / `.lang` markup as buildNoteHTML, so NOTE_CSS and
 * the live page styles both apply). Pure: no I/O.
 *
 * @param {object} s one `students[]` entry from GET /api/progress/digest:
 *   { studentName, section, activities:[{activityId, activityTitle,
 *     progressPercent, scorePct}], telemetryCounts:{[type]:n}, masteryReached:[] }
 * @param {object} opts { date, homeworkMap, site } — homeworkMap is the
 *   LESSON_FAMILY_HOMEWORK object; site prefixes its hrefs for offline files.
 */
export function buildWeeklyDigest(s, { date = "", homeworkMap = null, site = "" } = {}) {
  const acts = Array.isArray(s.activities) ? s.activities : [];
  const scored = acts.filter((a) => a && a.scorePct != null && Number.isFinite(Number(a.scorePct)));
  const avg = scored.length
    ? Math.round(scored.reduce((t, a) => t + Number(a.scorePct), 0) / scored.length)
    : null;
  const b = bandInfo(avg);
  const fn = firstName(s.studentName);
  const counts = s.telemetryCounts || {};
  const checkins = Number(counts["family-checkin"]) || 0;
  const mastery = Array.isArray(s.masteryReached) ? s.masteryReached.filter(Boolean) : [];

  // What we worked on: activity list (capped), progress/score when known.
  const actLine = (a) => {
    const bits = [];
    if (a.progressPercent != null && Number.isFinite(Number(a.progressPercent)))
      bits.push(`${Math.round(Number(a.progressPercent))}%`);
    if (a.scorePct != null && Number.isFinite(Number(a.scorePct)))
      bits.push(`score ${Math.round(Number(a.scorePct))}%`);
    return `${a.activityTitle || a.activityId || "Activity"}${bits.length ? ` — ${bits.join(" · ")}` : ""}`;
  };
  const shown = acts.slice(0, MAX_DIGEST_ACTIVITIES);
  const moreCount = acts.length - shown.length;
  const workedEn = acts.length
    ? `<ul>${li(shown.map(actLine))}</ul>${moreCount > 0 ? `<p>…and ${moreCount} more.</p>` : ""}`
    : `<p>No logged activity this week — a fresh week starts now!</p>`;
  const workedEs = acts.length
    ? `<ul>${li(shown.map(actLine))}</ul>${moreCount > 0 ? `<p>…y ${moreCount} más.</p>` : ""}`
    : `<p>No hay actividad registrada esta semana — ¡una nueva semana comienza ahora!</p>`;

  // Mastery reached (standards codes from telemetry mastery events).
  const masteryEn = mastery.length
    ? `<p>New skills mastered this week: <strong>${esc(mastery.join(", "))}</strong> 🎉</p>`
    : `<p>Still working toward the next mastery check — steady progress counts!</p>`;
  const masteryEs = mastery.length
    ? `<p>Nuevas habilidades dominadas esta semana: <strong>${esc(mastery.join(", "))}</strong> 🎉</p>`
    : `<p>Seguimos trabajando hacia el próximo logro — ¡el progreso constante cuenta!</p>`;

  // One thing to ask your child: weakest scored activity if one dipped below
  // the practice threshold, else the strongest — always concrete and positive.
  const byScore = [...scored].sort((a, z) => Number(a.scorePct) - Number(z.scorePct));
  const weakest = byScore.length && Number(byScore[0].scorePct) < PRACTICE_BELOW ? byScore[0] : null;
  const strongest = byScore.length ? byScore[byScore.length - 1] : null;
  const askTarget = weakest || strongest;
  let askEn;
  let askEs;
  if (weakest) {
    const t = esc(weakest.activityTitle || weakest.activityId);
    askEn = `Ask ${esc(fn)} to walk you through one problem from “${t}” — explaining it out loud is the fastest way to lock it in.`;
    askEs = `Pídale a ${esc(fn)} que le explique un problema de “${t}” — explicarlo en voz alta es la manera más rápida de dominarlo.`;
  } else if (strongest) {
    const t = esc(strongest.activityTitle || strongest.activityId);
    askEn = `Ask ${esc(fn)} to teach you something from “${t}” — they did great work there this week.`;
    askEs = `Pídale a ${esc(fn)} que le enseñe algo de “${t}” — hizo un gran trabajo allí esta semana.`;
  } else {
    askEn = `Ask ${esc(fn)} what math class is about this week.`;
    askEs = `Pregúntele a ${esc(fn)} de qué trata la clase de matemáticas esta semana.`;
  }

  // 5-minute home activity: prefer the ask-target's lesson, else the first
  // activity with a family-homework page.
  let hw = null;
  let hwTitle = "";
  for (const a of [askTarget, ...acts]) {
    if (!a) continue;
    const hit = familyHomeworkFor(a.activityId, homeworkMap);
    if (hit && hit.href) {
      hw = hit;
      hwTitle = a.activityTitle || a.activityId || "";
      break;
    }
  }
  const hwHref = hw ? esc(`${site}${hw.href}`) : "";
  const hwEn = hw
    ? `<p><strong>5-minute home activity:</strong> <a href="${hwHref}">Try the family activity for “${esc(hwTitle)}”</a> — quick, hands-on, and made for families.</p>`
    : "";
  const hwEs = hw
    ? `<p><strong>Actividad de 5 minutos en casa:</strong> <a href="${hwHref}">Prueben la actividad familiar de “${esc(hwTitle)}”</a> — rápida, práctica y hecha para las familias.</p>`
    : "";

  const checkinEn =
    checkins > 0
      ? `<p class="pn-checkin">Family practice logged ✅ ${checkins}× this week — thank you!</p>`
      : "";
  const checkinEs =
    checkins > 0
      ? `<p class="pn-checkin">Práctica en familia registrada ✅ ${checkins} veces esta semana — ¡gracias!</p>`
      : "";

  const avgText = avg == null ? "" : ` (average ${avg}%).`;
  const avgTextEs = avg == null ? "" : ` (promedio ${avg}%).`;

  return `<article class="parent-note pn-digest" data-name="${esc(s.studentName)}" data-section="${esc(s.section)}">
  <header class="pn-head">
    <div><strong>${esc(s.studentName || "Student")}</strong> · <span class="pn-class">${esc(s.section || "")}</span></div>
    <div class="pn-meta">Weekly digest${date ? ` · Week of ${esc(date)}` : ""} · ${acts.length} activit${acts.length === 1 ? "y" : "ies"}</div>
  </header>
  <div class="cols">
    <div class="lang">
      <span class="flag">🇺🇸 English</span>
      <h2>${esc(fn)}'s week in math</h2>
      <p>${esc(fn)} ${b.en}${avgText}</p>
      <h3>What we worked on</h3>${workedEn}
      <h3>Mastery reached</h3>${masteryEn}
      <h3>One thing to ask your child</h3><p>${askEn}</p>
      ${hwEn}${checkinEn}
    </div>
    <div class="lang">
      <span class="flag">🇲🇽 Español</span>
      <h2>La semana de ${esc(fn)} en matemáticas</h2>
      <p>${esc(fn)} ${b.es}${avgTextEs}</p>
      <h3>En qué trabajamos</h3>${workedEs}
      <h3>Dominio alcanzado</h3>${masteryEs}
      <h3>Algo para preguntarle a su hijo/a</h3><p>${askEs}</p>
      ${hwEs}${checkinEs}
    </div>
  </div>
</article>`;
}

/** Compact standalone stylesheet for offline (CLI) documents. */
export const NOTE_CSS = `
  :root{--ink:#0f2b3c;--muted:#5e6e7e;--line:#e2e7ec;--accent:#1a6fb5}
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);margin:0;background:#f4f6f8}
  .sheet{max-width:900px;margin:0 auto;padding:24px}
  h1.title{font-size:20px}
  .parent-note{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin:0 0 20px;box-shadow:0 2px 10px rgba(15,43,60,.05)}
  .pn-head{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px}
  .pn-class{color:var(--accent);font-weight:700}
  .pn-meta{color:var(--muted);font-size:13px}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  @media(max-width:680px){.cols{grid-template-columns:1fr}}
  .lang{background:#fbfdff;border:1px solid var(--line);border-radius:12px;padding:14px 16px}
  .lang h2{margin:2px 0 4px;font-size:18px}
  .lang h3{font-size:14px;margin:14px 0 4px;color:var(--ink)}
  .lang .flag{font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--accent)}
  .lang ul{margin:6px 0;padding-left:20px}
  @media print{body{background:#fff}.parent-note{break-inside:avoid;box-shadow:none}.no-print{display:none}}
`;

/** Wrap notes into a full standalone HTML document (offline printing). */
export function buildDocument(notes, { title = "Family Updates", date = "" } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${NOTE_CSS}</style></head>
<body><div class="sheet">
<h1 class="title">${esc(title)}${date ? ` — ${esc(date)}` : ""}</h1>
<p class="no-print pn-meta">${notes.length} note(s). Print this page, or print each note individually. Contains student data — keep private.</p>
${notes.join("\n")}
</div></body></html>`;
}
