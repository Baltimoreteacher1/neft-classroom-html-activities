// Shared building blocks for the Speaking Studio, Writing Studio, Missions and Error Detective.
// feedbackHTML() is also used by the activity shell (views/activity.js) and downloadText() by Passport,
// so their names, signatures and class hooks stay stable.
import { CRITERIA, DISCLAIMER, PRACTICE_BANDS } from "./lang/rubrics.js";
import { bridgesFor, partLabel, wordParts } from "./lang/scaffolds.js";
import { esc, html, icon, raw } from "./util.js";

const IGN = raw("data-nsr-ignore");

/** The learner's own text with evidence spans marked. Spans: [{start,end}] over `text`. */
export function highlightHTML(text, spans = [], cls = "hl") {
  const ok = spans
    .filter((s) => s.end > s.start && s.start >= 0 && s.end <= text.length)
    .sort((a, b) => a.start - b.start);
  let out = "";
  let at = 0;
  for (const s of ok) {
    if (s.start < at) continue;
    out +=
      esc(text.slice(at, s.start)) +
      `<mark class="${cls}">${esc(text.slice(s.start, s.end))}</mark>`;
    at = s.end;
  }
  return raw(out + esc(text.slice(at)));
}

// ── disclosures that remember whether the learner opened them across re-renders ──────────────
const touched = new Map(); // id → open?
/** A <details> that stays open or closed across re-renders once the learner has toggled it. */
export function disclosure(id, summary, body, { open = false, cls = "", attrs = "" } = {}) {
  const isOpen = touched.has(id) ? touched.get(id) : open;
  return html`<details
    class="studio-disc ${cls}"
    data-d="${id}"
    ${attrs ? raw(attrs) : ""}
    ${isOpen ? raw("open") : ""}
  >
    <summary>${summary}</summary>
    <div class="disc-body">${body}</div>
  </details>`;
}
export function trackDisclosures(root) {
  for (const d of root.querySelectorAll("details[data-d]"))
    d.addEventListener("toggle", () => touched.set(d.dataset.d, d.open));
}

// ── help setting (stage) ─────────────────────────────────────────────────────────────────────
export const STAGES = [
  {
    id: "guided",
    label: "With frames and words",
    help: "Sentence frames, a word bank and a model are open.",
    ico: "bulb",
  },
  {
    id: "supported",
    label: "With a word bank",
    help: "Only the word bank is available.",
    ico: "words",
  },
  {
    id: "independent",
    label: "On my own",
    help: "No supports. Feedback comes after you finish.",
    ico: "user",
  },
];
export const stageName = (stage) =>
  stage === "guided" ? "frames and words" : stage === "supported" ? "word bank" : "on my own";

export function stagePickerHTML(stage, suggestion, name = "stage") {
  return html`<fieldset class="stage-picker">
    <legend>How much help do you want?</legend>
    <div class="stage-options">
      ${STAGES.map((s) => html`<label class="stage-opt ${stage === s.id ? "is-on" : ""}"><input type="radio" name="${name}" value="${s.id}" data-stage ${stage === s.id ? raw("checked") : ""} ${IGN} /><span class="stage-ico">${icon(s.ico)}</span><strong>${s.label}</strong><span class="stage-help">${s.help}</span></label>`)}
    </div>
    ${
      suggestion
        ? html`<p class="fine stage-why">
            ${icon("info")}<span
              >Suggested: <strong>${STAGES.find((x) => x.id === suggestion.stage)?.label}</strong> —
              ${suggestion.reason}</span
            >
          </p>`
        : ""
    }
    <p class="fine">
      Working "on my own" shows what you can do independently. Your teacher sees which kind of help
      you used.
    </p>
  </fieldset>`;
}

/** Shown once an attempt has started: the help setting is fixed for the attempt. */
export function stageLockedHTML(stage, newLabel = "Start a new attempt") {
  return html`<p class="stage-locked">
    ${icon("lock")}<span>Help setting for this attempt: <strong>${stageName(stage)}</strong>.</span
    ><button type="button" class="ghost small" data-new-attempt>${newLabel}</button>
  </p>`;
}

/** Names the kind of practice so unofficial work is never mistaken for assessment. */
export function purposeBadgeHTML(stage) {
  return stage === "independent"
    ? html`<p class="purpose-badge is-independent">
        <span class="mode-pill">${icon("user")} Independent practice</span>
        <span class="fine"
          >No supports open. Feedback comes after you submit. Classroom practice — not an ACCESS
          score.</span
        >
      </p>`
    : html`<p class="purpose-badge">
        <span class="mode-pill">${icon("bulb")} Instructional practice</span>
        <span class="fine"
          >Supports are open and recorded as supports. Classroom practice — not an ACCESS
          score.</span
        >
      </p>`;
}

/** Numbered progress rail. steps: [{label, done}], current is the first step not done (or `current`). */
export function stepperHTML(
  steps,
  { label = "Steps", current = steps.findIndex((s) => !s.done) } = {},
) {
  return html`<ol class="studio-steps" aria-label="${label}">
    ${steps.map((s, i) => html`<li class="${i === current ? "is-current" : s.done ? "is-done" : ""}" ${i === current ? raw('aria-current="step"') : ""}><span class="step-n">${s.done && i !== current ? icon("check") : i + 1}</span><span class="step-l">${s.label}${s.done && i !== current ? html`<span class="visually-hidden"> (done)</span>` : ""}</span></li>`)}
  </ol>`;
}

// ── feedback ─────────────────────────────────────────────────────────────────────────────────
/** Strengths + next moves from analyzeResponse(), with the learner's own words highlighted. */
export function feedbackHTML(analysis, text, { patternHref = null } = {}) {
  const spansFor = (list) =>
    list.flatMap((s) => (s.spans || []).filter((x) => typeof x.start === "number"));
  return html`<div class="coach-card panel" role="status">
    <div class="coach-head">
      <span class="coach-ico">${icon("sparkle")}</span>
      <div>
        <h3>What your ${analysis.words}-word response shows</h3>
        <p class="fine">Language Coach notes from the words on the page, made on this device.</p>
      </div>
    </div>
    <div class="coach-block is-strengths">
      <h4>${icon("check")} What is working</h4>
      ${
        analysis.strengths.length
          ? html`<ul class="coach-strengths">
              ${analysis.strengths.map((s) => html`<li><span class="dim-chip">${s.dimension}</span> ${s.text}</li>`)}
            </ul>`
          : html`<p>Write a little more and we can show you what you are doing well.</p>`
      }
      ${text ? html`<p class="evidence-text" aria-label="Your response with evidence marked">${highlightHTML(text, spansFor(analysis.strengths))}</p>` : ""}
    </div>
    <div class="coach-block">
      <h4>${icon("flag")} Your next moves</h4>
      ${
        analysis.nextMoves.length
          ? html`<ol class="coach-moves">
              ${analysis.nextMoves.map(
                (m) =>
                  html`<li>
                    <p class="move-title">
                      <span class="dim-chip">${m.dimension}</span> <strong>${m.title}</strong>
                    </p>
                    <p class="fine">${m.why}</p>
                    <p class="move-ask">${m.ask}</p>
                    ${m.frame ? html`<p class="frame">Try: <em>${m.frame}</em></p>` : ""}${m.suggestions?.length ? html`<p class="fine">Maybe: ${m.suggestions.join(", ")}</p>` : ""}${m.patternId && patternHref ? html`<a class="btn small" href="${patternHref(m.patternId)}">Practice this pattern${icon("arrow-right")}</a>` : ""}
                  </li>`,
              )}
            </ol>`
          : html`<p>
              Nothing stands out as a next move. Reread your response aloud and keep the best parts.
            </p>`
      }
    </div>
    <p class="fine coach-note">
      These notes describe what is on the page. They do not judge whether your ideas are correct,
      and they are not a score.
    </p>
  </div>`;
}

/** Self-review (student) or conference review (teacher) against the three practice criteria. */
export function rubricHTML(review, { who = "student", modality = "writing", prefix = "rub" } = {}) {
  return html`<fieldset class="rubric">
    <legend>${who === "teacher" ? "Teacher review" : "Review my work"}</legend>
    <p class="fine rubric-disclaimer">${icon("info")}<span>${DISCLAIMER}</span></p>
    ${CRITERIA.map(
      (c) =>
        html`<div class="rubric-row">
          <h4>${c.name} <span class="dim-chip">${c.dimension}</span></h4>
          <p class="fine">${c.question[modality]}</p>
          <div class="rubric-options" role="radiogroup" aria-label="${c.name}">
            ${PRACTICE_BANDS.map((b) => html`<label class="rubric-opt ${review?.[c.id] === b.id ? "is-on" : ""}"><input type="radio" name="${prefix}-${c.id}" value="${b.id}" data-rubric="${c.id}" ${review?.[c.id] === b.id ? raw("checked") : ""} ${IGN} /><strong>${b.label}</strong><span>${c.student[b.id]}</span></label>`)}
          </div>
          ${
            who === "teacher"
              ? html`<details class="fine">
                  <summary>Look for</summary>
                  <ul>
                    ${c.teacher.lookFor.map((x) => html`<li>${x}</li>`)}
                  </ul>
                </details>`
              : ""
          }
        </div>`,
    )}
    <label class="field"
      ><span>${who === "teacher" ? "Comment for the student" : "One thing I will do next"}</span
      ><textarea rows="2" data-rubric-note ${IGN}>${review?.note || ""}</textarea>
    </label>
  </fieldset>`;
}

export const dimChip = (d) => html`<span class="dim-chip">${d}</span>`;

// ── supports ─────────────────────────────────────────────────────────────────────────────────
export function vocabListHTML(vocab = []) {
  return vocab.length
    ? html`<ul class="vocab-list">
        ${vocab.map((v) => html`<li><strong>${v.term}</strong><span class="vocab-def">${v.def}</span><span class="vocab-es" lang="es">${v.es}</span></li>`)}
      </ul>`
    : "";
}

/** Home-language and word-part bridges for a task's words. Shown only with supports. */
export function bridgeContent(task) {
  const words = [
    ...(task.stages?.supported?.bank || []),
    ...(task.vocab || []).map((v) => v.term),
    ...(task.sourceTerms || []),
  ];
  const { cognates, warnings } = bridgesFor([words.join(" "), task.prompt || ""]);
  const parts = wordParts(words);
  if (!cognates.length && !warnings.length && !parts.length) return null;
  return html`${
    cognates.length
      ? html`<h4>Words that look alike in Spanish</h4>
          <ul class="bridge-list">
            ${cognates.map((c) => html`<li><strong>${c.en}</strong> ↔ <span lang="es">${c.es}</span><span class="fine">${c.note}</span></li>`)}
          </ul>`
      : ""
  }
  ${
    warnings.length
      ? html`<h4>Careful — false friends</h4>
          <ul class="bridge-list">
            ${warnings.map((f) => html`<li><strong>${f.en}</strong> ≠ <span lang="es">${f.esFalse}</span><span class="fine">${f.warning}</span></li>`)}
          </ul>`
      : ""
  }
  ${
    parts.length
      ? html`<h4>Word parts</h4>
          <ul class="bridge-list">
            ${parts.map((w) => html`<li><strong>${w.word}</strong> = ${w.parts.map(partLabel).join(" + ")}</li>`)}
          </ul>`
      : ""
  }`;
}
export function bridgesHTML(task) {
  const body = bridgeContent(task);
  return body
    ? disclosure("bridges", html`${icon("language")} Word bridges (Spanish and word parts)`, body, {
        cls: "word-bridges",
      })
    : "";
}

/**
 * All the supports for a task in one calm panel: frames and words open, the rest tucked away.
 * Never called for "on my own"; the callers render nothing at all in that case.
 */
export function supportsPanelHTML(
  task,
  stage,
  { modelBody = "", modelId = "model", title = "Supports" } = {},
) {
  const g = task.stages.guided;
  return html`<section class="panel supports-panel" aria-label="${title}">
    <h3>${icon("bulb")} ${title}</h3>
    ${
      stage === "guided"
        ? disclosure(
            "frames",
            html`Sentence frames`,
            html`<ul class="frames inline">
              ${g.frames.map((f) => html`<li>${f}</li>`)}
            </ul>`,
            { open: true },
          )
        : ""
    }
    ${disclosure(
      "bank",
      html`Word bank`,
      html`<ul class="wordbank">
        ${task.stages.supported.bank.map((w) => html`<li>${w}</li>`)}
      </ul>`,
      { open: true },
    )}
    ${task.vocab?.length ? disclosure("vocab", html`${icon("language")} Word meanings and Spanish`, vocabListHTML(task.vocab)) : ""}
    ${bridgesHTML(task)}
    ${
      stage === "guided"
        ? html`<details class="studio-disc" data-model data-d="${modelId}">
            <summary>${icon("star")} ${modelBody.summary}</summary>
            <div class="disc-body">
              <p class="fine">Opening the model is saved as extra support.</p>
              ${modelBody.body}
            </div>
          </details>`
        : ""
    }
  </section>`;
}

// ── sources, charts, tables ──────────────────────────────────────────────────────────────────
export function chartHTML(chart) {
  const max = Math.max(...chart.data.map((d) => d.value), 1);
  return html`<figure class="mini-chart">
    <figcaption>${chart.title}</figcaption>
    ${chart.data.map(
      (d) =>
        html`<div class="bar-row">
          <span class="bar-label">${d.label}</span
          ><span
            class="bar"
            aria-hidden="true"
            style="width:${d.value ? Math.max(4, (d.value / max) * 100) : 0}%"
          ></span
          ><span class="bar-val"
            >${d.value}<span class="visually-hidden"> ${chart.unit || ""}</span
            >${chart.kind === "pictograph" && chart.icon ? html` ${chart.icon}` : ""}</span
          >
        </div>`,
    )}
  </figure>`;
}
export function tableHTML(t) {
  return html`<div class="lab-table-wrap" tabindex="0" role="region" aria-label="${t.caption}">
    <table class="data-table">
      <caption>
        ${t.caption}
      </caption>
      <thead>
        <tr>
          ${t.headers.map((h) => html`<th scope="col">${h}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${t.rows.map(
          (r) =>
            html`<tr>
              ${r.map((c, i) => (i === 0 ? html`<th scope="row">${c}</th>` : html`<td>${c}</td>`))}
            </tr>`,
        )}
      </tbody>
    </table>
  </div>`;
}

const SRC_ICON = {
  chart: "growth",
  table: "list",
  passage: "reading",
  text: "reading",
  audio: "listening",
};
/** A source (passage / table / chart) shown to the learner. Audio is played, not printed. */
export function sourceHTML(src, { id = "" } = {}) {
  const head = html`<h3 class="source-title">
    ${icon(SRC_ICON[src.kind] || "reading")} ${src.title}
  </h3>`;
  if (src.kind === "chart")
    return html`<section class="source">${head}${chartHTML(src.chart)}</section>`;
  if (src.kind === "table")
    return html`<section class="source">${head}${tableHTML(src.table)}</section>`;
  if (src.kind === "passage" || src.kind === "text")
    return html`<section class="source">
      ${head}
      <div class="source-text">${(src.text || []).map((p) => html`<p>${p}</p>`)}</div>
    </section>`;
  if (src.kind === "audio")
    return html`<section class="source">
      ${head}
      <div class="listen-player">
        <button type="button" class="listen-btn" data-play-source="${id}">
          <span class="listen-icon" aria-hidden="true">${icon("play")}</span
          ><span class="listen-label">Listen</span></button
        ><button type="button" class="ghost" data-stop-audio>${icon("stop")} Stop</button>
      </div>
    </section>`;
  return "";
}

// ── chooser pages (Speaking and Writing task lists) ─────────────────────────────────────────

/** Hero shared by the Speaking, Writing, Missions and Detective landing pages (room.css .room-hero). */
export function chooserHeroHTML({ domain = "", eyebrow, title, lead, art, loop = [], cta = "", artAlt = "" }) {
  return html`<section class="room-hero studio-hero ${domain}">
    <div class="room-hero-copy">
      <p class="eyebrow">${eyebrow}</p>
      <h1 tabindex="-1">${title}</h1>
      <p class="lead">${lead}</p>
      ${loop.length ? html`<ol class="studio-loop" aria-label="How a task works">${loop.map((l, i) => html`<li><span class="step-n">${i + 1}</span>${l}</li>`)}</ol>` : ""}
      ${cta}
    </div>
    <div class="room-hero-art"><img src="${art}" width="480" height="360" alt="${artAlt}" decoding="async" /></div>
  </section>`;
}

const HELP_LEVELS = ["Frames", "Word bank", "On my own"];
/** One task as a card: domain tile, type, one-sentence description, key language use and the help settings offered. */
export function taskCardHTML({ href, title, ico, kind, time, desc = "", meta = [], why = "" }) {
  return html`<a class="card task-card" href="${href}">
    <span class="task-top"><span class="task-ico">${icon(ico)}</span><span class="task-kind">${kind}</span><span class="task-time">${icon("clock")} ${time}</span></span>
    <strong class="task-title">${title}</strong>
    ${desc ? html`<span class="task-desc">${desc}</span>` : ""}
    ${why ? html`<span class="task-why">${icon("sparkle")}<span>${why}</span></span>` : ""}
    <span class="task-foot"><span class="task-meta">${meta.map((m) => html`<span class="tag">${m}</span>`)}</span>
    <span class="task-levels"><span class="visually-hidden">Help settings: </span>${HELP_LEVELS.map((l) => html`<span>${l}</span>`)}</span></span>
  </a>`;
}

/** In-page jump links for a long chooser. */
export const jumpNavHTML = (items, label) => html`<nav class="studio-jump no-print" aria-label="${label}">${items.map(([id, text]) => html`<a class="chip" href="#${id}">${text}</a>`)}</nav>`;

export function downloadText(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
