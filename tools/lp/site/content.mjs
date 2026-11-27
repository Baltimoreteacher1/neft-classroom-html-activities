// Content + Language library: /content/, /content/<area>/, /content/<area>/grade-<n>/, /content/<area>/grade-<n>/<slug>/.
import { AREAS } from "./data.mjs";
import { icon } from "./icons.mjs";
import { ELD, esc, html, raw } from "./util.mjs";

// Codes checked on 2026-11-27 (docs/sources.md). Anything else shows [VERIFY].
export const VERIFIED_CODES = new Set([
  "6.RP.A.1",
  "6.RP.A.2",
  "6.RP.A.3",
  "6.NS.A.1",
  "6.NS.C.5",
  "6.NS.C.6",
  "6.EE.A.2",
  "6.EE.B.7",
  "6.EE.C.9",
  "6.G.A.1",
  "6.SP.A.1",
  "6.SP.B.5",
  "MS-LS2-1",
  "MS-PS1-2",
  "4-ESS2-1",
]);
export const isVerified = (std) => !std.verify && VERIFIED_CODES.has(std.code);
export const unitPath = (u) => `/content/${u.area}/grade-${u.grade}/${u.slug}/`;
const area = (slug) => AREAS.find((a) => a.slug === slug);

const verifyTag = (std) =>
  isVerified(std)
    ? ""
    : html` <span class="approx" title="This code has not been checked against the official source yet.">[VERIFY]</span>`;

// The card heading is one level below the heading it sits under: h2 straight after a page h1, h3 under a section h2.
function unitCard(u, level = 3) {
  const h = `h${level}`;
  return html`<article class="card">
  <span class="card-icon">${raw(icon(area(u.area).icon))}</span>
  ${raw(`<${h}${level === 2 ? ' class="h3"' : ""}>`)}<a class="card-link" href="${unitPath(u)}">${u.title}</a>${raw(`</${h}>`)}
  <p>${u.summary}</p>
  <div class="meta"><span class="chip">Grade ${u.grade}</span><span class="chip">${u.standard.code}</span><span class="chip teal">${u.eld}</span><span class="chip amber">${u.klu}</span></div>
</article>`;
}

export function contentHome(data) {
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">Content + Language</span><h1 data-i18n="nav.content">Content + Language</h1>
<p class="lede">Lessons where the language is already mapped: the content standard, the matching WIDA ELD Standard and Key Language Use, the language demands at three levels, frames for three proficiency bands, key vocabulary and a ready-to-use activity.</p></div>
<div class="grid cols-2">${AREAS.map((a) => {
    const units = data.units.filter((u) => u.area === a.slug);
    const grades = [...new Set(units.map((u) => u.grade))].sort((x, y) => x - y);
    return html`<article class="card"><span class="card-icon">${raw(icon(a.icon))}</span><h2 class="h3"><a class="card-link" href="/content/${a.slug}/">${a.label}</a></h2>
<p>${units.length} units · grade${grades.length > 1 ? "s" : ""} ${grades.join(", ")} · ${a.eld}</p></article>`;
  })}</div>
<section class="section"><h2>How a unit page is organized</h2>
<ol class="prose"><li><strong>Standards</strong>: the content standard and its WIDA ELD Standard and Key Language Use.</li><li><strong>Language demands</strong> at the discourse, sentence and word/phrase levels.</li><li><strong>Objectives</strong>: one content objective and one language objective.</li><li><strong>Frames</strong> for levels 1–2, 3–4 and 5–6.</li><li><strong>Vocabulary</strong> with tiers, Spanish, cognates and word parts.</li><li><strong>An activity</strong> you can print, edit in the Activity Builder or turn into a game.</li></ol></section>
</div>`;
}

export function areaPage(data, a) {
  const units = data.units.filter((u) => u.area === a.slug);
  const grades = [...new Set(units.map((u) => u.grade))].sort((x, y) => x - y);
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">Content + Language</span><h1>${a.label}</h1><p class="lede">${ELD[a.eld]} (${a.eld}). Choose a grade.</p></div>
${grades.map((g) => html`<section class="section"><h2><a href="/content/${a.slug}/grade-${g}/">Grade ${g}</a></h2><div class="grid cols-3">${units.filter((u) => u.grade === g).map((u) => unitCard(u))}</div></section>`)}
</div>`;
}

export function gradePage(data, a, grade) {
  const units = data.units.filter((u) => u.area === a.slug && u.grade === grade);
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">${a.label}</span><h1>Grade ${grade} ${a.label.toLowerCase() === "math" ? "math" : a.label}</h1><p class="lede">${units.length} units with language demands mapped to ${a.eld}.</p></div>
<div class="grid cols-3">${units.map((u) => unitCard(u, 2))}</div>
</div>`;
}

export function unitPage(u) {
  const a = area(u.area);
  const bands = [
    ["L1-2", "Levels 1–2", "b1"],
    ["L3-4", "Levels 3–4", "b2"],
    ["L5-6", "Levels 5–6", "b3"],
  ];
  const act = u.activity;
  return html`<div class="wrap">
<div class="print-only print-header"><span>${u.title} · Grade ${u.grade} ${a.label}</span><span>The Language Page</span></div>
<div class="page-head"><span class="eyebrow">${a.label} · Grade ${u.grade}</span><h1>${u.title}</h1><p class="lede">${u.summary}</p>
<div class="btn-row no-print">
  <a class="btn" href="/tools/game-maker/?from=${esc(u.id)}" data-make-game>${raw(icon("game"))} Make this a game</a>
  <a class="btn secondary" href="/tools/activity-builder/?from=${esc(u.id)}">${raw(icon("blocks"))} Edit the activity</a>
  <button type="button" class="btn secondary" data-print>${raw(icon("print"))} <span data-i18n="tool.print">Print</span></button>
</div></div>

<section class="section"><h2>Standards</h2>
<dl class="kv">
<dt>${u.standard.framework}</dt><dd><strong>${u.standard.code}</strong>${verifyTag(u.standard)}: ${u.standard.text}</dd>
<dt>WIDA ELD Standard</dt><dd>${u.eld}: ${ELD[u.eld]}</dd>
<dt>Key Language Use</dt><dd>${u.klu}</dd>
</dl></section>

<section class="section"><h2>Language demands</h2><div class="grid cols-3">
${[
  ["discourse", "Discourse"],
  ["sentence", "Sentence"],
  ["word", "Word / phrase"],
].map(
  ([k, label]) =>
    html`<div class="band"><h3 class="h4">${label}</h3><ul>${u.demands[k].map((d) => html`<li>${d}</li>`)}</ul></div>`,
)}</div></section>

<section class="section"><h2>Objectives</h2>
<dl class="kv"><dt>Content</dt><dd>${u.contentObjective}</dd><dt>Language</dt><dd>${u.languageObjective}</dd></dl></section>

<section class="section"><h2>Sentence frames by proficiency band</h2><div class="grid cols-3">
${bands.map(([k, label, cls]) => html`<div class="band ${cls}"><h3 class="h4">${label}</h3><ul>${u.frames[k].map((f) => html`<li>${f}</li>`)}</ul></div>`)}
</div></section>

<section class="section"><h2>Key vocabulary</h2><div class="table-wrap"><table>
<thead><tr><th scope="col">Word</th><th scope="col">Tier</th><th scope="col">Meaning</th><th scope="col">Spanish</th><th scope="col">Cognate</th><th scope="col">Word parts</th></tr></thead>
<tbody>${u.vocabulary.map((v) => html`<tr><td><strong>${v.term}</strong></td><td>${v.tier}</td><td>${v.definition}</td><td lang="es">${v.es}</td><td>${v.cognate ? "Yes" : "No"}</td><td>${v.morphology}</td></tr>`)}</tbody>
</table></div></section>

<section class="section"><h2>Activity: ${act.title}</h2>
<p class="muted">${act.minutes} minutes · ${act.grouping}</p>
<ol>${act.steps.map((s) => html`<li>${s}</li>`)}</ol>
${act.problems?.length ? html`<h3 class="h4">Problems</h3><ol>${act.problems.map((p) => html`<li>${p.prompt}<details class="accordion no-print"><summary><span>Answer</span></summary><div class="body">${p.answer}</div></details><span class="print-only write-lines"></span></li>`)}</ol>` : ""}
</section>

<section class="section"><h2>Five-minute warm-up</h2><p>${u.warmup}</p></section>
${u.crossLinks?.length ? html`<section class="section no-print"><h2>Related practice</h2><ul>${u.crossLinks.map((l) => html`<li><a href="${l.href}">${l.label}</a></li>`)}</ul></section>` : ""}
<details class="accordion answer-key print-only"><summary>Answer key</summary><div class="body"><ol>${(act.problems || []).map((p) => html`<li>${p.answer}</li>`)}</ol></div></details>
</div>`;
}

/** What the tools need to preload a unit (Game Maker vocabulary, Activity Builder blocks). */
export function unitToolData(u) {
  return {
    id: u.id,
    title: u.title,
    vocabulary: u.vocabulary.map((v) => ({
      term: v.term,
      definition: v.definition,
      es: v.es,
      cognate: !!v.cognate,
      tier: v.tier,
    })),
    frames: u.frames,
    activity: u.activity,
    klu: u.klu,
  };
}
