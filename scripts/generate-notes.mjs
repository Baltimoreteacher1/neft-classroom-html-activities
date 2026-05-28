import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slug = (term) =>
  String(term ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const blankLines = (n) =>
  Array.from({ length: n }, () => `<div class="writeline"></div>`).join("");

const choiceLetter = (i) => String.fromCharCode(65 + i);

function lessonConfigs() {
  return readdirSync(lessonsDir)
    .filter((d) => /^\d+-\d+$/.test(d))
    .filter((d) => existsSync(join(lessonsDir, d, "config.json")))
    .map((id) => ({
      id,
      cfg: JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8")),
    }))
    .sort((a, b) => {
      const [au, al] = a.id.split("-").map(Number);
      const [bu, bl] = b.id.split("-").map(Number);
      return au - bu || al - bl;
    });
}

/* ---------- section builders ---------- */

function vocabSection(vocab = []) {
  if (!vocab.length) return "";
  const cards = vocab
    .map((v) => {
      const s = slug(v.term);
      return `<div class="vocab-card">
  <h3 class="vocab-term">${esc(v.term)}</h3>
  <p class="vocab-def">${esc(v.definition)}</p>
  <div class="vocab-figure">
    <img src="/assets/vocab-images/${s}.svg" alt="${esc(v.definition)}" onerror="this.style.display='none'" />
    <p class="vocab-caption">${esc(v.visual)}</p>
  </div>
</div>`;
    })
    .join("\n");
  return `<section class="section vocab">
  <h2>Vocabulary</h2>
  <div class="vocab-grid">
${cards}
  </div>
</section>`;
}

function notesSection(launch = {}, explore = {}) {
  const bullets = [];
  if (launch.narrative) {
    launch.narrative
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4)
      .forEach((s) => bullets.push(s));
  }
  if (explore.instructions) bullets.push(explore.instructions.trim());

  const noticeWonder = []
    .concat(launch.noticePrompts || [], launch.wonderPrompts || [])
    .slice(0, 3);

  const bulletHtml = bullets.length
    ? `<ul class="notes-bullets">${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
    : "";

  const promptHtml = noticeWonder.length
    ? `<div class="think-block">
    <h3>Think About It</h3>
    <ul class="prompt-list">${noticeWonder.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
  </div>`
    : "";

  return `<section class="section notes">
  <h2>Key Ideas &amp; Notes</h2>
  ${bulletHtml}
  ${promptHtml}
  <div class="my-notes">
    <h3>My Notes</h3>
    ${blankLines(5)}
  </div>
</section>`;
}

// Build worked-example HTML for an MC / open-response / error-analysis item.
function workedExample(item, n) {
  let body = "";
  const problem = item.stem || item.instructions || item.title || "";

  if (item.type === "error-analysis") {
    const steps = (item.workedExample || [])
      .map(
        (s) =>
          `<li><span class="step-label">${esc(s.label)}:</span> ${esc(s.work)}</li>`
      )
      .join("");
    body = `<p class="ex-problem">${esc(item.title || "Error Analysis")}</p>
    <ol class="ex-steps">${steps}</ol>
    <p class="ex-solution"><strong>Correct reasoning:</strong> ${esc(item.correctWork)}</p>`;
  } else if (item.type === "fill-table") {
    body = `<p class="ex-problem">${esc(problem)}</p>
    <p class="ex-solution">${esc((item.editableCells || []).map((c) => c.answer).filter(Boolean).join("; "))}</p>`;
  } else {
    let answerLine = "";
    if (Array.isArray(item.choices) && typeof item.correctIndex === "number") {
      answerLine = `<p class="ex-answer"><strong>Answer:</strong> ${choiceLetter(item.correctIndex)}. ${esc(item.choices[item.correctIndex])}</p>`;
    } else if (item.sampleAnswer) {
      answerLine = `<p class="ex-answer"><strong>Sample answer:</strong> ${esc(item.sampleAnswer)}</p>`;
    }
    body = `<p class="ex-problem">${esc(problem)}</p>
    <p class="ex-solution"><strong>Solution:</strong> ${esc(item.explanation || item.sampleAnswer || "")}</p>
    ${answerLine}`;
  }

  return `<div class="example">
  <h3 class="example-head">Example ${n}</h3>
  ${body}
</div>`;
}

function gatherPractice(practice = {}) {
  return []
    .concat(practice.approaching || [], practice.onLevel || [], practice.extending || []);
}

function examplesSection(practice = {}) {
  const items = gatherPractice(practice);
  // Prefer items that have an explanation or worked content for examples.
  const candidates = items.filter(
    (it) =>
      (it.stem && it.explanation) ||
      it.type === "error-analysis" ||
      (it.type === "open-response" && it.sampleAnswer)
  );
  const chosen = candidates.slice(0, 3);
  if (!chosen.length) return "";
  return `<section class="section examples">
  <h2>Guided Examples</h2>
  ${chosen.map((it, i) => workedExample(it, i + 1)).join("\n")}
</section>`;
}

function tryItSection(practice = {}) {
  const items = gatherPractice(practice).filter((it) => it.stem);
  // Pick a couple that were not necessarily used above; take from middle/end.
  const picks = items.slice(-2).length ? items.slice(-2) : items.slice(0, 2);
  if (!picks.length) return "";
  const probs = picks
    .map((it, i) => {
      let choiceHtml = "";
      if (Array.isArray(it.choices)) {
        choiceHtml = `<ol class="try-choices" type="A">${it.choices
          .map((c) => `<li>${esc(c)}</li>`)
          .join("")}</ol>`;
      }
      return `<div class="tryit">
  <p class="tryit-num">${i + 1}. ${esc(it.stem)}</p>
  ${choiceHtml}
  <div class="work-space"><span class="ws-label">Show your work:</span>${blankLines(3)}</div>
</div>`;
    })
    .join("\n");
  return `<section class="section tryit-section">
  <h2>Try It</h2>
  <p class="muted">Solve on your own. Check the answer key when you are done.</p>
  ${probs}
</section>`;
}

function reflectSection(reflect = {}) {
  const et = reflect.exitTicket || {};
  const stem = et.stem || "";
  if (!stem) return "";
  let choiceHtml = "";
  if (Array.isArray(et.choices)) {
    choiceHtml = `<ol class="try-choices" type="A">${et.choices
      .map((c) => `<li>${esc(c)}</li>`)
      .join("")}</ol>`;
  }
  return `<section class="section reflect">
  <h2>Reflect — Exit Ticket</h2>
  <p class="reflect-stem">${esc(stem)}</p>
  ${choiceHtml}
  <div class="work-space"><span class="ws-label">Your answer:</span>${blankLines(3)}</div>
</section>`;
}

function answerKeySection(practice = {}, reflect = {}) {
  const rows = [];
  let n = 1;
  // Try It picks mirrored from tryItSection logic.
  const items = gatherPractice(practice).filter((it) => it.stem);
  const tryPicks = items.slice(-2).length ? items.slice(-2) : items.slice(0, 2);
  tryPicks.forEach((it) => {
    let ans = "";
    if (Array.isArray(it.choices) && typeof it.correctIndex === "number") {
      ans = `${choiceLetter(it.correctIndex)}. ${it.choices[it.correctIndex]}`;
    } else if (it.sampleAnswer) {
      ans = it.sampleAnswer;
    }
    rows.push(
      `<li><strong>Try It ${n++}:</strong> ${esc(ans)}${
        it.explanation ? ` <span class="ak-why">— ${esc(it.explanation)}</span>` : ""
      }</li>`
    );
  });

  const et = reflect.exitTicket || {};
  if (et.stem) {
    let ans = "";
    if (Array.isArray(et.choices) && typeof et.correctIndex === "number") {
      ans = `${choiceLetter(et.correctIndex)}. ${et.choices[et.correctIndex]}`;
    }
    rows.push(
      `<li><strong>Exit Ticket:</strong> ${esc(ans)}${
        et.explanation ? ` <span class="ak-why">— ${esc(et.explanation)}</span>` : ""
      }</li>`
    );
  }
  if (!rows.length) return "";
  return `<section class="answer-key">
  <h2>Answer Key</h2>
  <ol class="ak-list">${rows.join("")}</ol>
</section>`;
}

/* ---------- page assembly ---------- */

function styles() {
  return `<style>
:root{
  --navy:#12355b;--teal:#1fa6a2;--teal-light:#dff2ee;--amber:#f2c15b;
  --cream:#f7f4ec;--ink:#21313f;--muted:#5f6f80;--line:#d7e2ed;--card:#fff;
}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);
  font-family:Calibri,"Segoe UI",system-ui,sans-serif;line-height:1.5;}
.sheet{max-width:8.5in;margin:0 auto;background:var(--card);padding:0.6in;}
.topbar{position:sticky;top:0;background:var(--navy);color:#fff;display:flex;
  justify-content:space-between;align-items:center;padding:12px 18px;}
.topbar .brand{font-weight:700;font-family:Outfit,system-ui,sans-serif;}
.print-btn{background:var(--amber);color:var(--navy);border:0;border-radius:8px;
  padding:9px 16px;font-weight:700;cursor:pointer;font-size:15px;}
header.packet{border-bottom:3px solid var(--teal);padding-bottom:14px;margin-bottom:18px;}
header.packet .eyebrow{color:var(--teal);font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;font-size:13px;margin:0;}
header.packet h1{font-family:Outfit,system-ui,sans-serif;color:var(--navy);
  margin:6px 0 4px;font-size:26px;}
header.packet .meta{color:var(--muted);font-size:14px;margin:0;}
.name-line{display:flex;gap:24px;flex-wrap:wrap;margin-top:12px;font-size:14px;}
.name-line span{flex:1;border-bottom:1px solid var(--ink);padding:4px 0;min-width:140px;}
.section{margin:0 0 22px;page-break-inside:avoid;}
.section>h2{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:19px;
  border-left:5px solid var(--teal);padding-left:10px;margin:0 0 12px;}
.vocab-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
.vocab-card{border:1px solid var(--line);border-radius:10px;padding:12px;background:#fff;
  page-break-inside:avoid;}
.vocab-term{margin:0 0 4px;color:var(--navy);font-size:16px;}
.vocab-def{margin:0 0 8px;font-size:14px;}
.vocab-figure{text-align:center;background:var(--teal-light);border-radius:8px;padding:8px;}
.vocab-figure img{max-width:100%;max-height:120px;}
.vocab-caption{margin:6px 0 0;font-size:12.5px;color:var(--muted);font-style:italic;}
.notes-bullets,.prompt-list{margin:0 0 10px;padding-left:20px;}
.notes-bullets li,.prompt-list li{margin:5px 0;}
.think-block{background:var(--amber-light,#fef7e0);border-radius:8px;padding:10px 14px;margin:10px 0;}
.think-block h3{margin:0 0 6px;font-size:15px;color:var(--navy);}
.my-notes h3,.work-space .ws-label{font-size:14px;color:var(--muted);}
.writeline{border-bottom:1px solid #b9c6d3;height:26px;}
.example{border:1px solid var(--line);border-left:4px solid var(--amber);border-radius:8px;
  padding:12px 14px;margin:0 0 12px;page-break-inside:avoid;}
.example-head{margin:0 0 6px;color:var(--navy);font-size:16px;}
.ex-problem{margin:0 0 8px;font-weight:600;}
.ex-steps{margin:0 0 8px;padding-left:20px;}
.step-label{color:var(--teal);font-weight:700;}
.ex-solution,.ex-answer{margin:6px 0 0;font-size:14.5px;}
.tryit{margin:0 0 14px;page-break-inside:avoid;}
.tryit-num,.reflect-stem{font-weight:600;margin:0 0 6px;}
.try-choices{margin:0 0 8px;padding-left:24px;}
.try-choices li{margin:3px 0;}
.work-space{margin-top:6px;}
.muted{color:var(--muted);font-size:14px;}
.answer-key{page-break-before:always;border-top:3px solid var(--navy);margin-top:24px;padding-top:14px;}
.answer-key h2{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:19px;}
.ak-list{padding-left:22px;}
.ak-list li{margin:8px 0;}
.ak-why{color:var(--muted);font-style:italic;}
footer.packet{margin-top:18px;border-top:1px solid var(--line);padding-top:8px;
  color:var(--muted);font-size:12px;text-align:center;}
@media print{
  @page{size:letter;margin:0.75in;}
  body{background:#fff;color:#000;font-family:Georgia,"Times New Roman",serif;font-size:12pt;}
  .topbar,.print-btn,.no-print{display:none !important;}
  .sheet{max-width:none;margin:0;padding:0;box-shadow:none;}
  .section>h2,header.packet h1,header.packet .eyebrow,.example-head,
  .answer-key h2,.vocab-term{color:#000;}
  .vocab-figure{background:#fff;border:1px solid #000;}
  .think-block{background:#fff;border:1px solid #000;}
  header.packet{border-bottom:2px solid #000;}
  .section>h2{border-left:4px solid #000;}
  .example{border-left:3px solid #000;}
  .answer-key{border-top:2px solid #000;}
  .vocab-card{border:1px solid #000;}
  .writeline{border-bottom:1px solid #000;}
}
</style>`;
}

function buildPacket(id, cfg) {
  const standard = cfg.standard ? `Standard ${esc(cfg.standard)}` : "";
  const unit = cfg.unit != null ? `Unit ${esc(cfg.unit)}` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(cfg.title)} — Notes Packet</title>
${styles()}
</head>
<body>
<div class="topbar no-print">
  <span class="brand">Neft Teacher · Notes Packet</span>
  <button class="print-btn" type="button" onclick="window.print()">Print / Save as PDF</button>
</div>
<main class="sheet">
  <header class="packet">
    <p class="eyebrow">${[unit, standard].filter(Boolean).join(" · ")}</p>
    <h1>${esc(cfg.title)}</h1>
    <p class="meta">Lesson ${esc(id)}</p>
    <div class="name-line">
      <span>Name:</span><span>Date:</span><span>Class:</span>
    </div>
  </header>
  ${vocabSection(cfg.vocabulary)}
  ${notesSection(cfg.launch, cfg.explore)}
  ${examplesSection(cfg.practice)}
  ${tryItSection(cfg.practice)}
  ${reflectSection(cfg.reflect)}
  ${answerKeySection(cfg.practice, cfg.reflect)}
  <footer class="packet">Neft Teacher · Grade 6 Math · Lesson ${esc(id)}${standard ? " · " + standard : ""}</footer>
</main>
</body>
</html>`;
}

function buildIndex(lessons) {
  const byUnit = new Map();
  for (const { id, cfg } of lessons) {
    const u = cfg.unit ?? id.split("-")[0];
    if (!byUnit.has(u)) byUnit.set(u, []);
    byUnit.get(u).push({ id, cfg });
  }
  const units = [...byUnit.keys()].sort((a, b) => Number(a) - Number(b));
  const groups = units
    .map((u) => {
      const items = byUnit
        .get(u)
        .map(
          ({ id, cfg }) =>
            `<li><a href="/lessons/${id}/notes.html">${esc(id)} — ${esc(cfg.title)}</a>${
              cfg.standard ? ` <span class="std">${esc(cfg.standard)}</span>` : ""
            }</li>`
        )
        .join("");
      return `<section class="unit-group">
  <h2>Unit ${esc(u)}</h2>
  <ul>${items}</ul>
</section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Notes Packets — Index</title>
<style>
body{margin:0;background:#f7f4ec;color:#21313f;font-family:Calibri,"Segoe UI",system-ui,sans-serif;}
.wrap{max-width:820px;margin:0 auto;padding:32px 20px;}
h1{font-family:Outfit,system-ui,sans-serif;color:#12355b;}
.unit-group{background:#fff;border:1px solid #d7e2ed;border-radius:12px;padding:16px 20px;margin:0 0 16px;}
.unit-group h2{color:#1fa6a2;margin:0 0 10px;font-family:Outfit,system-ui,sans-serif;}
.unit-group ul{list-style:none;margin:0;padding:0;}
.unit-group li{padding:6px 0;border-bottom:1px solid #eef3f8;}
.unit-group li:last-child{border-bottom:0;}
a{color:#12355b;text-decoration:none;font-weight:600;}
a:hover{text-decoration:underline;}
.std{color:#5f6f80;font-weight:400;font-size:13px;margin-left:6px;}
</style>
</head>
<body>
<div class="wrap">
  <h1>Notes Packets</h1>
  <p>Printable notes packets for all ${lessons.length} Grade 6 math lessons.</p>
  ${groups}
</div>
</body>
</html>`;
}

/* ---------- run ---------- */

function main() {
  const lessons = lessonConfigs();
  let count = 0;
  for (const { id, cfg } of lessons) {
    const out = join(lessonsDir, id, "notes.html");
    writeFileSync(out, buildPacket(id, cfg));
    count++;
  }
  writeFileSync(join(lessonsDir, "notes-index.html"), buildIndex(lessons));
  console.log(`Generated ${count} notes packets + notes-index.html`);
}

main();
