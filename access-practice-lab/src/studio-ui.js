// Shared building blocks for the Speaking Studio, Writing Studio, Missions and Error Detective.
import { CRITERIA, DISCLAIMER, PRACTICE_BANDS } from "./lang/rubrics.js";
import { bridgesFor, partLabel, wordParts } from "./lang/scaffolds.js";
import { esc, html, raw } from "./util.js";

const IGN = raw("data-nsr-ignore");

/** The learner's own text with evidence spans marked. Spans: [{start,end}] over `text`. */
export function highlightHTML(text, spans = [], cls = "hl") {
  const ok = spans.filter((s) => s.end > s.start && s.start >= 0 && s.end <= text.length).sort((a, b) => a.start - b.start);
  let out = "";
  let at = 0;
  for (const s of ok) {
    if (s.start < at) continue;
    out += esc(text.slice(at, s.start)) + `<mark class="${cls}">${esc(text.slice(s.start, s.end))}</mark>`;
    at = s.end;
  }
  return raw(out + esc(text.slice(at)));
}

export const STAGES = [
  { id: "guided", label: "With frames and words", help: "Sentence frames, a word bank and a model are open." },
  { id: "supported", label: "With a word bank", help: "Only the word bank is available." },
  { id: "independent", label: "On my own", help: "No supports. Feedback comes after you finish." },
];

export function stagePickerHTML(stage, suggestion, name = "stage") {
  return html`<fieldset class="stage-picker"><legend>How much help do you want?</legend>
    <div class="stage-options">${STAGES.map((s) => html`<label class="stage-opt ${stage === s.id ? "is-on" : ""}"><input type="radio" name="${name}" value="${s.id}" data-stage ${stage === s.id ? raw("checked") : ""} ${IGN} /><strong>${s.label}</strong><span>${s.help}</span></label>`)}</div>
    ${suggestion ? html`<p class="fine stage-why">Suggested: <strong>${STAGES.find((x) => x.id === suggestion.stage)?.label}</strong> — ${suggestion.reason}</p>` : ""}
    <p class="fine">Working "on my own" shows what you can do independently. Your teacher sees which kind of help you used.</p></fieldset>`;
}

/** Strengths + next moves from analyzeResponse(), with the learner's own words highlighted. */
export function feedbackHTML(analysis, text, { patternHref = null } = {}) {
  const spansFor = (list) => list.flatMap((s) => (s.spans || []).filter((x) => typeof x.start === "number"));
  return html`<div class="coach-card panel" role="status">
    <h3>What your ${analysis.words}-word response shows</h3>
    ${analysis.strengths.length ? html`<ul class="coach-strengths">${analysis.strengths.map((s) => html`<li><span class="dim-chip">${s.dimension}</span> ${s.text}</li>`)}</ul>` : html`<p>Write a little more and we can show you what you are doing well.</p>`}
    ${text ? html`<p class="evidence-text" aria-label="Your response with evidence marked">${highlightHTML(text, spansFor(analysis.strengths))}</p>` : ""}
    ${analysis.nextMoves.length ? html`<h4>Your next moves</h4><ol class="coach-moves">${analysis.nextMoves.map((m) => html`<li><p><span class="dim-chip">${m.dimension}</span> <strong>${m.title}</strong></p><p class="fine">${m.why}</p><p class="move-ask">${m.ask}</p>${m.frame ? html`<p class="frame">Try: <em>${m.frame}</em></p>` : ""}${m.suggestions?.length ? html`<p class="fine">Maybe: ${m.suggestions.join(", ")}</p>` : ""}${m.patternId && patternHref ? html`<a class="btn small" href="${patternHref(m.patternId)}">Practice this pattern</a>` : ""}</li>`)}</ol>` : html`<p>Nothing stands out as a next move. Reread your response aloud and keep the best parts.</p>`}
    <p class="fine">These notes describe what is on the page. They do not judge whether your ideas are correct, and they are not a score.</p>
  </div>`;
}

/** Self-review (student) or conference review (teacher) against the three practice criteria. */
export function rubricHTML(review, { who = "student", modality = "writing", prefix = "rub" } = {}) {
  return html`<fieldset class="rubric"><legend>${who === "teacher" ? "Teacher review" : "Review my work"}</legend>
    <p class="fine">${DISCLAIMER}</p>
    ${CRITERIA.map((c) => html`<div class="rubric-row"><h4>${c.name} <span class="dim-chip">${c.dimension}</span></h4>
      <p class="fine">${c.question[modality]}</p>
      <div class="rubric-options" role="radiogroup" aria-label="${c.name}">${PRACTICE_BANDS.map((b) => html`<label class="rubric-opt ${review?.[c.id] === b.id ? "is-on" : ""}"><input type="radio" name="${prefix}-${c.id}" value="${b.id}" data-rubric="${c.id}" ${review?.[c.id] === b.id ? raw("checked") : ""} ${IGN} /><strong>${b.label}</strong><span>${c.student[b.id]}</span></label>`)}</div>
      ${who === "teacher" ? html`<details class="fine"><summary>Look for</summary><ul>${c.teacher.lookFor.map((x) => html`<li>${x}</li>`)}</ul></details>` : ""}</div>`)}
    <label class="field"><span>${who === "teacher" ? "Comment for the student" : "One thing I will do next"}</span><textarea rows="2" data-rubric-note ${IGN}>${review?.note || ""}</textarea></label></fieldset>`;
}

export const dimChip = (d) => html`<span class="dim-chip">${d}</span>`;

export function vocabListHTML(vocab = []) {
  return vocab.length ? html`<ul class="vocab-list">${vocab.map((v) => html`<li><strong>${v.term}</strong> — ${v.def}<br /><span lang="es">${v.es}</span></li>`)}</ul>` : "";
}

export function chartHTML(chart) {
  const max = Math.max(...chart.data.map((d) => d.value), 1);
  return html`<figure class="mini-chart"><figcaption>${chart.title}</figcaption>${chart.data.map((d) => html`<div class="bar-row"><span class="bar-label">${d.label}</span><span class="bar" aria-hidden="true" style="width:${d.value ? Math.max(4, (d.value / max) * 100) : 0}%"></span><span class="bar-val">${d.value}<span class="visually-hidden"> ${chart.unit || ""}</span>${chart.kind === "pictograph" && chart.icon ? html` ${chart.icon}` : ""}</span></div>`)}</figure>`;
}
export function tableHTML(t) {
  return html`<div class="lab-table-wrap" tabindex="0" role="region" aria-label="${t.caption}"><table class="data-table"><caption>${t.caption}</caption><thead><tr>${t.headers.map((h) => html`<th scope="col">${h}</th>`)}</tr></thead><tbody>${t.rows.map((r) => html`<tr>${r.map((c, i) => (i === 0 ? html`<th scope="row">${c}</th>` : html`<td>${c}</td>`))}</tr>`)}</tbody></table></div>`;
}

/** A source (passage / table / chart) shown to the learner. Audio is played, not printed. */
export function sourceHTML(src, { id = "" } = {}) {
  if (src.kind === "chart") return html`<section class="source"><h3>${src.title}</h3>${chartHTML(src.chart)}</section>`;
  if (src.kind === "table") return html`<section class="source"><h3>${src.title}</h3>${tableHTML(src.table)}</section>`;
  if (src.kind === "passage" || src.kind === "text") return html`<section class="source"><h3>${src.title}</h3>${(src.text || []).map((p) => html`<p>${p}</p>`)}</section>`;
  if (src.kind === "audio") return html`<section class="source"><h3>${src.title}</h3><button type="button" class="btn" data-play-source="${id}">▶ Listen</button> <button type="button" class="ghost" data-stop-audio>■ Stop</button></section>`;
  return "";
}

export function downloadText(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Home-language and word-part bridges for a task's words. Shown only with supports. */
export function bridgesHTML(task) {
  const words = [...(task.stages?.supported?.bank || []), ...(task.vocab || []).map((v) => v.term), ...(task.sourceTerms || [])];
  const { cognates, warnings } = bridgesFor([words.join(" "), task.prompt || ""]);
  const parts = wordParts(words);
  if (!cognates.length && !warnings.length && !parts.length) return "";
  return html`<details class="word-bridges"><summary>Word bridges (Spanish and word parts)</summary>
    ${cognates.length ? html`<h4>Words that look alike in Spanish</h4><ul>${cognates.map((c) => html`<li><strong>${c.en}</strong> ↔ <span lang="es">${c.es}</span> — ${c.note}</li>`)}</ul>` : ""}
    ${warnings.length ? html`<h4>Careful — false friends</h4><ul>${warnings.map((f) => html`<li><strong>${f.en}</strong> ≠ <span lang="es">${f.esFalse}</span>. ${f.warning}</li>`)}</ul>` : ""}
    ${parts.length ? html`<h4>Word parts</h4><ul>${parts.map((w) => html`<li><strong>${w.word}</strong> = ${w.parts.map(partLabel).join(" + ")}</li>`)}</ul>` : ""}</details>`;
}

/** Names the kind of practice so unofficial work is never mistaken for assessment. */
export function purposeBadgeHTML(stage) {
  return stage === "independent"
    ? html`<p class="purpose-badge"><span class="badge">Independent practice</span> <span class="fine">No supports open. Feedback comes after you submit. Classroom practice — not an ACCESS score.</span></p>`
    : html`<p class="purpose-badge"><span class="badge">Instructional practice</span> <span class="fine">Supports are open and recorded as supports. Classroom practice — not an ACCESS score.</span></p>`;
}
