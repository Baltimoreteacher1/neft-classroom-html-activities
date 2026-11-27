// BCPSS Plan & Respond — print documents (Letter, black-and-white safe). Each builder returns a complete HTML document;
// openPrint() shows it in a new tab and opens the print dialog. Student sheets and teacher sheets are separate documents.

export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
export const blanks = (s) =>
  esc(s)
    .replace(/\[([^\]]+)\]/g, '<span class="b">$1</span>')
    .replace(/_{3,}/g, '<span class="b">&nbsp;</span>');

const CSS = `
@page{size:letter;margin:0.6in}
*{box-sizing:border-box}
body{font:12pt/1.45 "Atkinson Hyperlegible","Segoe UI",Arial,sans-serif;color:#111;margin:0}
h1{font-size:19pt;margin:0 0 2pt;line-height:1.2}
h2{font-size:13pt;margin:14pt 0 5pt;padding-bottom:2pt;border-bottom:1.5pt solid #1e3a5f;color:#1e3a5f;break-after:avoid}
h3{font-size:11.5pt;margin:8pt 0 3pt;break-after:avoid}
p{margin:0 0 5pt}
.meta{font-size:10pt;color:#444;margin-bottom:8pt}
.head{display:flex;justify-content:space-between;gap:12pt;border-bottom:2pt solid #111;padding-bottom:6pt;margin-bottom:8pt}
.name{font-size:11pt;white-space:nowrap}
.name span{display:inline-block;width:2.2in;border-bottom:1pt solid #111}
.q{font-weight:700;font-size:13pt;margin:4pt 0 8pt}
.words{display:grid;grid-template-columns:repeat(2,1fr);gap:6pt}
.word{border:1pt solid #888;border-radius:4pt;padding:5pt 7pt;break-inside:avoid}
.word b{font-size:12.5pt}
.word .es{color:#333;font-style:italic}
.word .cue{font-size:10pt;color:#333;margin-top:2pt}
.chips{display:flex;flex-wrap:wrap;gap:5pt}
.chips span{border:1pt solid #111;border-radius:12pt;padding:1pt 9pt;font-size:11pt}
ol.frames{padding-left:18pt;margin:0}
ol.frames li{margin:0 0 12pt}
.b{display:inline-block;min-width:1.3in;border-bottom:1pt solid #111;color:#555;font-size:9.5pt;text-align:center;padding:0 4pt}
.lines div{border-bottom:1pt solid #999;height:26pt}
.step{border:1pt solid #999;border-radius:4pt;padding:6pt 9pt;margin:0 0 7pt;break-inside:avoid}
.step h3{margin-top:0;display:flex;justify-content:space-between}
.step h3 small{font-weight:400;color:#444}
.say{background:#f3f3f3;border-left:3pt solid #1e3a5f;padding:4pt 7pt;margin:4pt 0}
.small{font-size:10pt;color:#333}
.foot{margin-top:12pt;font-size:9pt;color:#555;border-top:1pt solid #bbb;padding-top:4pt}
.slip{border:1.5pt dashed #666;padding:8pt 10pt;margin:0 0 10pt;break-inside:avoid}
ul{margin:2pt 0 4pt;padding-left:16pt}
`;

export function doc(title, body, footer, extraCss = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}${extraCss}</style></head><body>${body}<p class="foot">${esc(footer)}</p></body></html>`;
}

export const unitLine = (u) =>
  `Grade ${esc(u.grade)} ${esc(u.subject)} · ${esc(u.curriculum_name || "")} Unit ${esc(u.unit_number)}: ${esc(u.unit_title)}`;
export const FOOT =
  "EduWonderLab · original WIDA-aligned practice for BCPSS teachers. Not an official BCPSS or WIDA document.";

/** Student language-support sheet (one level, one fade stage). */
export function supportSheetDoc(unit, sheet) {
  const fadeLabel = ["Sentence frames", "Sentence starters", "Word bank"][sheet.fade] || "";
  const words = sheet.words
    .map(
      (w) =>
        `<div class="word"><b>${esc(w.term)}</b>${w.es ? ` <span class="es">(${esc(w.es)})</span>` : ""}<div>${esc(w.def)}</div>${w.cue ? `<div class="cue">Picture: ${esc(w.cue)}</div>` : ""}</div>`,
    )
    .join("");
  const frames = sheet.frames.length
    ? `<h2>Sentence frames</h2><ol class="frames">${sheet.frames.map((f) => `<li>${blanks(f)}</li>`).join("")}</ol>`
    : sheet.starters.length
      ? `<h2>Start your sentences</h2><ol class="frames">${sheet.starters.map((s) => `<li>${blanks(s)} <span class="b">&nbsp;</span></li>`).join("")}</ol>`
      : `<h2>Write your answer</h2><div class="lines">${"<div></div>".repeat(6)}</div>`;
  const body = `
    <div class="head"><div><h1>Language Support</h1><div class="meta">${unitLine(unit)} · ${esc(fadeLabel)}</div></div><div class="name">Name <span></span></div></div>
    <p class="q">${esc(sheet.question)}</p>
    <p class="small">Goal: ${esc(sheet.languageGoal)}</p>
    <h2>Word bank</h2><div class="words">${words}</div>
    <h2>Linking words</h2><div class="chips">${sheet.connectors.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
    ${frames}`;
  return doc(`Language Support - ${unit.unit_title}`, body, FOOT);
}

/** Teacher reteach plan (eight steps). */
export function reteachDoc(plan) {
  const u = plan.unit;
  const stepHtml = plan.steps
    .map((s, i) => {
      let inner = `<p>${esc(s.teacher)}</p>`;
      if (s.items)
        inner += `<ul>${s.items.map((it) => `<li>${esc(it.q)}${it.a ? ` <span class="small">(Answer: ${esc(it.a)})</span>` : ""}</li>`).join("")}</ul>`;
      if (s.words)
        inner += `<ul>${s.words.map((w) => `<li><b>${esc(w.term)}</b>${w.es ? ` (${esc(w.es)})` : ""}: ${esc(w.def)} <span class="small">Example: ${esc(w.example)} Not this: ${esc(w.nonexample)}</span></li>`).join("")}</ul>`;
      if (s.lookFor)
        inner += `<p class="small"><b>Listen for this mix-up:</b> ${esc(s.lookFor)}</p>`;
      if (s.mentor) inner += `<div class="say">${esc(s.mentor)}</div>`;
      if (s.chunks)
        inner += `<ul>${s.chunks.map((c) => `<li><b>${esc(c.text)}</b> ${esc(c.role)}. Ask: ${esc(c.ask)}</li>`).join("")}</ul>`;
      if (s.prompt) inner += `<p><b>Problem:</b> ${esc(s.prompt)}</p>`;
      if (s.frame) inner += `<p><b>Frame:</b> ${blanks(s.frame)}</p>`;
      if (s.model) inner += `<p class="small"><b>Model:</b> ${esc(s.model)}</p>`;
      if (s.activity)
        inner += `<p><b>Activity ${s.activity.index}: ${esc(s.activity.title)}.</b> ${esc(s.activity.mission)}</p>${s.activity.support ? `<p class="small">Support: ${esc(s.activity.support)}</p>` : ""}`;
      if (s.rubric)
        inner += `<ul>${Object.entries(s.rubric)
          .map(([k, v]) => `<li><b>${esc(k[0].toUpperCase() + k.slice(1))}:</b> ${esc(v)}</li>`)
          .join("")}</ul>`;
      if (s.watch)
        inner += `<p class="small"><b>Watch for:</b> ${esc(s.watch.issue)} <b>Try:</b> ${esc(s.watch.fix)}</p>`;
      if (s.frames && s.id === "revise")
        inner += `<ul>${s.frames.map((f) => `<li>${blanks(f)}</li>`).join("")}</ul>`;
      return `<div class="step"><h3><span>${i + 1}. ${esc(s.title)}</span><small>${esc(s.minutes)} min</small></h3>${inner}</div>`;
    })
    .join("");
  const body = `
    <div class="head"><div><h1>Small-Group Reteach Plan</h1><div class="meta">${unitLine(u)}</div></div><div class="name">Teacher copy</div></div>
    <p><b>Pathway:</b> ${esc(plan.pathway.label)}. ${esc(plan.pathway.hint)}. <b>About ${esc(plan.minutes)} minutes.</b></p>
    <p class="small">The task and the exit ticket stay the same for every student. Only the support changes.</p>
    ${stepHtml}`;
  return doc(`Reteach Plan - ${u.unit_title}`, body, FOOT);
}

/** Student feedback slip from a work check: strengths, next steps, revise and fresh task. No analysis notes. */
export function feedbackSlipDoc(unit, result, follow) {
  const slip = `
    <div class="slip">
      <h3>What you did well</h3><ul>${result.strengths.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      <h3>Next step</h3><ul>${result.next.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      <h3>${esc(follow.revise.title)}</h3><ol>${follow.revise.steps.map((s) => `<li>${blanks(s)}</li>`).join("")}</ol>
      <h3>${esc(follow.fresh.title)}</h3><ol>${follow.fresh.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <div class="lines">${"<div></div>".repeat(4)}</div>
    </div>`;
  const body = `<div class="head"><div><h1>Feedback</h1><div class="meta">${unitLine(unit)}</div></div><div class="name">Name <span></span></div></div>${slip}`;
  return doc(`Feedback - ${unit.unit_title}`, body, FOOT);
}

/** Open a document in a new tab and print it. Falls back to a download link when pop-ups are blocked. */
export function openPrint(html, filename = "eduwonderlab-print.html") {
  const blob = new Blob(
    [
      html.replace(
        "</body>",
        "<script>addEventListener('load',()=>setTimeout(()=>print(),200))</script></body>",
      ),
    ],
    { type: "text/html" },
  );
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
