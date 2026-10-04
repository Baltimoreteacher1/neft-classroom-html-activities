// Publisher-style offline packets. Student output contains task content only;
// scripts, solutions and models are emitted exclusively for teacher copies.

import { chartHTML } from "../../access-practice-lab/src/media.js";
import { asList, esc, toHtml } from "../../access-practice-lab/src/util.js";
import { activityMinutes, orderedActivities } from "./access-lab-content.mjs";

const TIERS = { A: "Starting", B: "Growing", C: "Expanding" };
const ACCENTS = {
  Listening: "#215f77",
  Reading: "#365f47",
  Speaking: "#74452f",
  Writing: "#584777",
  "Model-Test": "#334d68",
};

export function answerKey(a) {
  const option = (id) => (a.options || []).find((o) => o.id === id)?.text || id;
  const item = (id) => (a.items || []).find((o) => o.id === id)?.text || id;
  switch (a.type) {
    case "multipleChoice":
      return `Answer: ${option(a.answer)}`;
    case "multiSelect":
      return `Answers: ${(a.answers || []).map(option).join("; ")}`;
    case "order":
      return `Order: ${(a.answer || []).map(item).join(" → ")}`;
    case "sort":
      return `Sort: ${(a.items || []).map((i) => `${i.text} → ${i.answer}`).join("; ")}`;
    case "cloze":
      return `Blanks: ${(a.segments || [])
        .filter((s) => s.blank)
        .map((s) => s.blank.answer)
        .join(", ")}`;
    case "hotText":
      return `Evidence: ${(a.answers || []).map((id) => (a.sentences || []).find((s) => s.id === id)?.text || id).join(" / ")}`;
    case "constructed":
      return "Open response. Review meaning and task-specific details; sample answers are examples, not required wording.";
    case "worksheet":
      return "Review the completed work with the learner. Responses may vary.";
    default:
      return "";
  }
}

/** Translate interaction mechanics only; retain the original academic task. */
export function paperDirections(a, domain) {
  let text = String(a.directions || "");
  const selection =
    a.type === "hotText"
      ? "Underline"
      : a.type === "multipleChoice" || a.type === "multiSelect"
        ? "Circle"
        : "Select";
  text = text.replace(/\b(?:click|tap)(?: on)?\b/gi, (match) =>
    /^[A-Z]/.test(match) ? selection : selection.toLowerCase(),
  );
  text = text.replace(
    /Use the buttons;? no dragging (?:is )?needed\./gi,
    a.type === "order"
      ? "Write a number beside each step to show its order."
      : "Write the matching group beside each item.",
  );
  text = text.replace(
    /Use the buttons\./gi,
    a.type === "order"
      ? "Number the steps in order."
      : "Write the matching group beside each item.",
  );
  text = text.replace(/\bDrag(?: and drop)?\b/gi, a.type === "order" ? "Number" : "Match");
  if (domain === "Speaking") {
    text = text.replace(
      /Press record \(or speak to a partner\)\./gi,
      "Speak to a partner or teacher.",
    );
    text = text.replace(
      /\brecord (your [^.]+|what you would say to your teacher)\./gi,
      "say $1 aloud to a partner or teacher.",
    );
  }
  return text;
}

export function repeatedHotTextPassage(a) {
  const normalize = (value) => value.normalize("NFKC").replace(/\s+/g, " ").trim();
  return (
    a.type === "hotText" &&
    asList(a.passage).length > 0 &&
    normalize(asList(a.passage).join(" ")) ===
      normalize((a.sentences || []).map((s) => s.text).join(" "))
  );
}

function picture(p, small = false) {
  if (!p?.src) return "";
  const src = p.src.startsWith("/") ? p.src : `/access-practice-lab/${p.src}`;
  return `<figure class="picture${small ? " option-picture" : ""}"><img src="${esc(src)}" alt="${esc(p.alt || "")}">${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}</figure>`;
}
function table(t) {
  if (!t) return "";
  return `<table class="data-table"><caption>${esc(t.caption || "Task data")}</caption><thead><tr>${(t.headers || []).map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${(t.rows || []).map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${esc(cell)}</th>` : `<td>${esc(cell)}</td>`)).join("")}</tr>`).join("")}</tbody></table>`;
}
function visuals(a) {
  return `${asList(a.picture)
    .map((p) => picture(p))
    .join("")}${asList(a.chart)
    .map((c, i) => toHtml(chartHTML(c, i)))
    .join("")}${table(a.table)}`;
}
function rules(count, label = "Response space") {
  return `<div class="ruled" role="group" aria-label="${esc(label)}">${'<div aria-hidden="true"></div>'.repeat(count)}</div>`;
}
function choices(a) {
  if (a.options?.length)
    return `<ol class="options${a.options.some((o) => o.picture) ? " picture-options" : ""}" type="A">${a.options.map((o) => `<li><span>${o.visual ? `<span aria-hidden="true">${esc(o.visual)} </span>` : ""}${esc(o.text)}</span>${o.picture ? picture(o.picture, true) : ""}</li>`).join("")}</ol>`;
  if (a.type === "order")
    return `<ol class="order-list">${(a.items || []).map((i) => `<li><span class="number-blank" aria-label="Write the order number"></span><span>${esc(i.text)}</span></li>`).join("")}</ol>`;
  if (a.type === "sort")
    return `<p class="group-bank"><strong>Groups:</strong> ${(a.categories || []).map(esc).join(" · ")}</p><table class="data-table sort-table"><caption>Write the group for each item</caption><thead><tr><th scope="col">Item</th><th scope="col">Group</th></tr></thead><tbody>${(a.items || []).map((i) => `<tr><th scope="row">${esc(i.text)}</th><td><span class="sort-blank" aria-label="Your group"></span></td></tr>`).join("")}</tbody></table>`;
  if (a.type === "cloze")
    return `<p class="cloze">${(a.segments || []).map((s) => (s.blank ? `<span class="blank" aria-label="Fill in the blank">____________</span> <span class="cloze-options">(${(s.blank.options || []).map(esc).join(" / ")})</span>` : esc(s.text))).join("")}</p>`;
  if (a.type === "hotText")
    return `<ol class="evidence-options">${(a.sentences || []).map((s) => `<li><span>${esc(s.text)}</span></li>`).join("")}</ol>`;
  return "";
}
function worksheet(a) {
  return (a.sheet || [])
    .map(
      (s) =>
        `<section class="sheet-section${(s.items || []).every((item) => /\[draw here\]/i.test(item)) ? " storyboard" : ""}"><h3>${esc(s.heading)}</h3><ol>${(s.items || []).map((item) => `<li class="sheet-item"><p>${esc(item.replace(/\[draw here\]/gi, ""))}</p>${/\[draw here\]/i.test(item) ? '<div class="drawing-box" aria-label="Drawing space"></div>' : /☐|\(circle\)/i.test(item) ? "" : rules(/_{3,}/.test(item) ? 1 : 2)}</li>`).join("")}</ol></section>`,
    )
    .join("");
}
function teacherNotes(a, listening) {
  return `${
    listening && a.script
      ? `<section class="teacher-panel read-aloud"><h3>Teacher read-aloud</h3>${asList(a.script)
          .map((s) => `<p>${esc(s)}</p>`)
          .join("")}</section>`
      : ""
  }`;
}
function solutions(a) {
  return `<section class="teacher-panel solution"><h3>Teacher review</h3><p>${esc(answerKey(a))}</p>${a.correct ? `<p>${esc(a.correct)}</p>` : ""}${a.successCriteria?.length ? `<ul>${a.successCriteria.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}${a.hint ? `<p><strong>Coaching prompt:</strong> ${esc(a.hint)}</p>` : ""}${a.support ? `<p><strong>After the attempt:</strong> ${esc(a.support)}</p>` : ""}${
    a.models
      ? `<div class="models">${Object.entries(TIERS)
          .filter(([key]) => a.models[key])
          .map(
            ([key, label]) =>
              `<section class="model"><h4>${label} example</h4><p>${esc(a.models[key])}</p>${a.modelNotes?.[key] ? `<p class="model-note"><strong>Notice:</strong> ${esc(a.modelNotes[key])}</p>` : ""}</section>`,
          )
          .join("")}</div>`
      : ""
  }</section>`;
}
function itemHTML(a, n, { domain, level, teacher }) {
  const listening = domain === "Listening" || a.listening;
  const speaking = domain === "Speaking" && a.type === "constructed";
  const constructed = a.type === "constructed";
  const minutes = activityMinutes(a.time);
  const compact =
    !constructed &&
    !teacher &&
    !a.picture &&
    !a.chart &&
    !a.table &&
    !a.sheet &&
    asList(a.passage).join(" ").length < 500;
  return `<article class="task${a.type === "worksheet" ? " worksheet-task" : ""}${constructed ? " extended" : ""}${compact ? " compact" : ""}" aria-labelledby="task-${n}">
    <header class="task-heading"><span class="task-number" aria-hidden="true">${String(n).padStart(2, "0")}</span><div><p class="task-skill">${esc(a.skill || domain)}${minutes ? ` · ${minutes} min` : ""}</p><h2 id="task-${n}">${esc(a.title)}</h2></div></header>
    <p class="directions">${esc(paperDirections(a, domain))}</p>
    ${listening && !teacher ? '<p class="listen-note"><strong>Listening task</strong> · Your teacher will read the text aloud. Listen, then respond.</p>' : ""}
    ${teacherNotes(a, listening && teacher)}
    ${visuals(a)}
    ${
      !listening && !repeatedHotTextPassage(a) && asList(a.passage).length
        ? `<section class="passage">${a.passageTitle ? `<h3>${esc(a.passageTitle)}</h3>` : ""}${asList(
            a.passage,
          )
            .map((p) => `<p>${esc(p)}</p>`)
            .join("")}</section>`
        : ""
    }
    <div class="question-block">${a.prompt ? `<p class="prompt">${esc(paperDirections({ ...a, directions: a.prompt }, domain))}</p>` : ""}${repeatedHotTextPassage(a) && a.passageTitle ? `<h3>${esc(a.passageTitle)}</h3>` : ""}${choices(a)}</div>
    ${worksheet(a)}
    ${constructed && !teacher ? `<section class="response"><h3>${speaking ? "Plan, then say it" : "Your writing"}</h3>${speaking ? '<p class="small">Jot down key words. Say your answer aloud to a partner or teacher; include a detail from the task.</p>' : '<p class="small">Answer the question. Reread your work and add a useful detail if needed.</p>'}${rules(speaking ? 3 : { A: 4, B: 7, C: 10 }[level] || 8, speaking ? "Speaking planning space" : "Writing response space")}${speaking ? '<p class="self-review">□ I answered the question. &nbsp; □ I added a useful detail. &nbsp; □ I practiced aloud.</p>' : '<div class="reflection-block"><p class="self-review">After rereading: one thing I improved or checked</p>' + rules(2, "Revision reflection") + "</div>"}</section>` : ""}
    ${teacher ? solutions(a) : ""}
  </article>`;
}

const CSS = `
:root{--accent:#215f77;--ink:#182735;--muted:#465563;--line:#c1cbd1;--wash:#f2f5f6}
*{box-sizing:border-box}html{background:#e9edf0}body{margin:0;color:var(--ink);font:16px/1.5 Arial,Helvetica,sans-serif}
.packet{max-width:8.5in;margin:24px auto;background:white;padding:.5in .6in;box-shadow:0 6px 30px #23344216}
.toolbar{max-width:8.5in;margin:20px auto 0;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 12px}.toolbar p{margin:0;font-size:14px}.toolbar button{font:700 16px Arial;padding:12px 18px;background:var(--accent);color:white;border:0;border-radius:5px;cursor:pointer}.toolbar button:focus-visible{outline:3px solid #17232e;outline-offset:3px}
.masthead{border-top:8px solid var(--accent);padding-top:14px;margin-bottom:18px}.brandline{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin:0 0 10px;text-transform:uppercase;font-size:11px;font-weight:bold;letter-spacing:.13em}.edition{color:var(--accent)}h1{font:700 32px/1.12 Georgia,serif;margin:0 0 8px}.subtitle{font-size:16px;margin:0}.masthead-note{font-size:13px;color:var(--muted);margin:10px 0}.learner-fields{display:flex;gap:24px;border-block:1px solid var(--line);padding:10px 0;font-size:14px}.learner-fields span:first-child{flex:1}.usage{font-size:13px;color:var(--muted);margin:10px 0 0}
.task{margin:22px 0 0;padding-top:14px;border-top:1px solid var(--line)}.task-heading{display:flex;gap:12px;align-items:flex-start;break-after:avoid}.task-number{flex:0 0 34px;border-top:3px solid var(--accent);padding-top:3px;font-size:20px;font-weight:bold;color:var(--accent)}.task-skill{font-size:11px;line-height:1.4;color:var(--muted);margin:0 0 4px;letter-spacing:.025em}h2{font:700 21px/1.2 Georgia,serif;margin:0}h3{font-size:15px;line-height:1.3;margin:12px 0 6px}h4{font-size:14px;margin:0 0 5px}p{margin:7px 0;orphans:3;widows:3}.directions{font-size:14px;color:var(--muted);margin:9px 0 12px;break-after:avoid}.prompt{font-weight:700;font-size:16px;margin:12px 0 8px}.question-block{break-inside:avoid}.passage{border-left:3px solid var(--line);padding:1px 14px;margin:12px 0;font-family:Georgia,serif;line-height:1.65}.passage h3{font-family:Arial,sans-serif}.listen-note{font-size:13px;border-left:3px solid var(--accent);padding:7px 10px;background:var(--wash)}
.picture{margin:10px auto;text-align:center;break-inside:avoid}.picture img{max-width:100%;max-height:2.75in;width:auto;height:auto;display:block;margin:auto}.picture figcaption{font-size:12px;color:var(--muted)}.options{padding-left:28px;margin:8px 0;list-style-type:upper-alpha}.options li{padding:5px 0 5px 7px;break-inside:avoid}.options li::marker{font-weight:bold;color:var(--accent)}.picture-options{display:grid;grid-template-columns:1fr 1fr;gap:6px 28px}.option-picture img{height:1in;max-width:100%}.order-list{list-style:none;padding:0;margin:10px 0}.order-list li{display:flex;gap:12px;padding:6px 0;break-inside:avoid}.evidence-options{padding-left:28px;margin:10px 0}.evidence-options li{padding:6px 0 6px 6px;break-inside:avoid}.evidence-options li::marker{font-weight:bold;color:var(--accent)}.number-blank{display:inline-block;border-bottom:1px solid #526372;width:26px;min-width:26px;height:22px}.check-box{border:1px solid #526372;display:inline-block;width:14px;height:14px;min-width:14px;margin-top:5px}.cloze{line-height:2.2}.blank{white-space:nowrap}.cloze-options{font-size:.9em}.group-bank{font-size:14px}.sort-blank{display:block;min-height:22px}
.data-table{border-collapse:collapse;width:100%;font-size:14px;margin:12px 0;break-inside:avoid}.data-table caption{text-align:left;font-weight:700;padding-bottom:6px}.data-table th,.data-table td{border:1px solid var(--line);padding:7px 10px;text-align:left}.data-table thead{background:var(--wash)}.data-table tbody th{font-weight:400}.sort-table th:first-child{width:58%}.lab-chart{max-width:5.5in;margin:12px auto;break-inside:avoid}.lab-chart figcaption{font-size:14px;font-weight:700;margin-bottom:7px}.lab-chart-svg{width:100%;max-height:2.7in;display:block}.lab-chart .grid{stroke:#c6cdd2;stroke-width:1}.lab-chart .axis{stroke:#516473}.lab-chart text{font:12px Arial;fill:#253544}.lab-chart .val{font-weight:bold}.lab-pictograph{font-size:16px;line-height:1.6}.pg-row{display:flex;gap:16px;margin:6px 0}.pg-label{min-width:90px}.pg-icons{overflow-wrap:anywhere}.pg-key{font-size:13px}
.reflection-block{break-inside:avoid}.response{margin:12px 0 0}.response h3{break-after:avoid}.small,.self-review{font-size:13px;color:var(--muted)}.ruled{margin:5px 0 12px}.ruled div{height:28px;border-bottom:1px solid #9eafb9;break-inside:avoid}.drawing-box{height:1.35in;border:1px solid var(--line);margin:8px 0 12px;break-inside:avoid}.sheet-section{margin-top:12px;break-inside:avoid}.storyboard ol{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:0;list-style:none}.storyboard .drawing-box{height:1.55in}.storyboard .sheet-item p{font-weight:700}.storyboard{break-inside:avoid}.sheet-section ol{padding-left:23px}.sheet-item{break-inside:avoid}.sheet-item p{margin-bottom:3px}.teacher-panel{border-left:3px solid var(--accent);background:var(--wash);padding:9px 13px;margin:12px 0;font-size:14px}.teacher-panel h3{color:var(--accent);font-size:12px;text-transform:uppercase;letter-spacing:.07em;margin:0 0 6px;break-after:avoid}.teacher-panel p:last-child{margin-bottom:0}.read-aloud{font-family:Georgia,serif;line-height:1.6}.read-aloud h3{font-family:Arial,sans-serif}.models{margin-top:12px}.model{border-top:1px solid var(--line);padding-top:10px;margin-top:10px;break-inside:avoid}.model-note{font-size:13px;color:var(--muted)}.packet-footer{border-top:2px solid var(--accent);margin-top:24px;padding-top:9px;font-size:11px;color:var(--muted)}
@page{size:Letter;margin:.5in .6in .65in;@bottom-left{content:"EduWonderLab · ACCESS classroom practice";font:8pt Arial;color:#465563}@bottom-right{content:"Page " counter(page);font:8pt Arial;color:#465563}}
@media print{.picture img{max-height:2.3in}.option-picture img{max-height:1in}.masthead{margin-bottom:14px;padding-top:10px}.usage{margin-top:7px}html,body{background:white}.toolbar{display:none}.packet{max-width:none;margin:0;padding:0;box-shadow:none}body{font-size:11pt;line-height:1.45}h1{font-size:25pt}h2{font-size:16pt}.task{margin-top:16px;padding-top:12px}.task-heading,.directions,h3,h4{break-after:avoid}.task.compact,.task.worksheet-task{break-inside:avoid}.question-block:empty{display:none}.task.extended{break-inside:auto}.ruled{orphans:3;widows:3}.teacher-panel{background:#f5f6f7;-webkit-print-color-adjust:exact;print-color-adjust:exact}.brandline{font-size:8pt}.packet-footer{font-size:8pt}thead{display:table-header-group}tr{break-inside:avoid}a{color:inherit;text-decoration:none}}
@media(max-width:650px){.packet{padding:24px 20px;margin:12px}.toolbar{padding:0 20px;flex-wrap:wrap}h1{font-size:28px}.brandline{flex-wrap:wrap}.learner-fields{flex-direction:column;gap:8px}.picture-options{gap:6px 20px}.data-table{font-size:13px}.data-table th,.data-table td{padding:6px}.task-heading{gap:9px}}
`;

export function packetHTML({ band, domain, level, L, teacher = false }) {
  const acts = orderedActivities(L);
  const tier = TIERS[level] || L.displayLabel || level;
  const edition = teacher ? "Teacher edition · keys & coaching" : "Student practice packet";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(domain)} · ${esc(tier)} · Grades ${esc(band)} — ${teacher ? "Teacher" : "Student"} packet</title><style>${CSS}</style></head><body style="--accent:${ACCENTS[domain] || "#334d68"}"><div class="toolbar"><button type="button" onclick="window.print()">Print / Save as PDF</button><p>Letter size · Print at 100% or fit to page</p></div><main class="packet"><header class="masthead"><p class="brandline"><span>EduWonderLab / ACCESS Practice Lab</span><span class="edition">${edition}</span></p><h1>${esc(domain)} practice</h1><p class="subtitle">Grades ${esc(band.replace("-", "–"))} &nbsp; / &nbsp; ${esc(tier)} &nbsp; / &nbsp; ${acts.length} tasks</p><p class="masthead-note">Flexible classroom practice. Support choices are not WIDA scores or placement levels.</p>${teacher ? '<p class="usage"><strong>Use this copy to teach.</strong> Assign a few tasks at a time. Read listening texts aloud; keep this edition separate from student copies. Review meaning before mechanics. Sample responses show possibilities, not a scoring scale.</p>' : '<div class="learner-fields"><span>Name or initials: __________________________</span><span>Date: __________________</span></div><p class="usage"><strong>Work one task at a time.</strong> Read the directions, respond, then check your meaning. Ask your teacher which tasks to complete. For listening tasks, wait for the read-aloud.</p>'}</header>${acts.map((a, i) => itemHTML(a, i + 1, { domain, level, teacher })).join("")}<footer class="packet-footer">EduWonderLab · ${esc(domain)} / ${esc(tier)} / Grades ${esc(band)} · ${teacher ? "Teacher edition — includes answers and listening texts." : "Student edition."}<br>Original classroom practice inspired by WIDA ACCESS. This is not an official WIDA test, score, or placement.</footer></main></body></html>`;
}
