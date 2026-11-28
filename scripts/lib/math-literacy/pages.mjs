/** pages.mjs — HTML pages for teachers/math-literacy/ (hub, grade pages, routines, scope and sequence). */
import { GRADES, LIT_STRATEGY } from "./content.mjs";

const BASE = "/teachers/math-literacy";
export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
export const gradeLabel = (g) => (g.id === "k" ? "Kindergarten" : `Grade ${g.id}`);

function head(title, desc, extra = "") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#17324D">
<meta name="color-scheme" content="light">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2317324D'/%3E%3Cpath d='M8 17h16M16 9v16' stroke='%231FA6A2' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E">
<link rel="stylesheet" href="${BASE}/assets/ml.css">
${extra}</head>`;
}

function top(active) {
  const a = (href, label, key) =>
    `<a href="${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap">
<a href="${BASE}/">Math Literacy &amp; Fluency, K–8</a>
<nav aria-label="Program">
${a(`${BASE}/`, "Grades", "home")}
${a(`${BASE}/routines/`, "Routines", "routines")}
${a(`${BASE}/scope-and-sequence/`, "Scope &amp; sequence", "scope")}
${a("/teachers/", "All teacher resources", "teachers")}
</nav></div></header>`;
}

const foot = `<footer><div class="wrap"><p>Original classroom materials by Mr. Neft. Aligned to widely used K–8 mathematics domains, not tied to any one district's curriculum or pacing. Practice and progress stay on your device; nothing is sent anywhere.</p></div></footer>
</body></html>
`;

const gradeDir = (g) => `${BASE}/grade-${g.id}`;
export const dlName = (g, kind) => `math-literacy-grade-${g.id}-${kind}`;

export function hubPage(builtGrades) {
  const cards = GRADES.map((g) => {
    const b = builtGrades.find((x) => x.id === g.id);
    return `<a class="card link" href="${gradeDir(g)}/"><span class="pill">${esc(g.band)}</span><div class="big">${esc(gradeLabel(g))}</div><p class="note">${esc(g.fluencyGoal)}</p><p class="note">${b.units.length} units · ${b.units.length * 5} vocabulary words · ${b.units.length * 3} word problems · ${b.units.length * 16} fluency items to start</p></a>`;
  }).join("\n");
  return `${head("Math Literacy & Fluency, K–8: a complete program for teachers", "A complete K–8 program that builds math reading, math talk, fact fluency and skill fluency in every grade, with interactive pages and print-ready Word and PDF packets.")}
${top("home")}
<main id="main" class="wrap">
<p class="crumb"><a href="/teachers/">Teachers</a> › Math Literacy</p>
<h1>Math Literacy &amp; Fluency, K–8</h1>
<p class="lede">Students read the math, say the math, and know their facts. Every grade has six units that weave together math vocabulary, problem-solving reading routines, math talk and writing, fact fluency and skill fluency.</p>
<div class="dl"><a class="btn amber" href="${BASE}/downloads/math-literacy-program-guide.pdf">Program guide (PDF)</a><a class="btn alt" href="${BASE}/downloads/math-literacy-program-guide.docx">Program guide (Word)</a></div>
<h2>Choose a grade</h2>
<div class="grid">
${cards}
</div>
<h2>What is in every unit</h2>
<div class="grid">
<div class="card"><h3>1. Word wall</h3><p>Five key words with a student-friendly meaning, an example, the Spanish word and a place for the student's own sentence.</p></div>
<div class="card"><h3>2. Read it. Say it. Solve it.</h3><p>Three word problems with a Three Reads routine. Each unit teaches one reading move, such as finding the question or crossing out extra information.</p></div>
<div class="card"><h3>3. Math talk and write</h3><p>A prompt with a sentence frame, so every student can explain their thinking out loud and on paper.</p></div>
<div class="card"><h3>4. Fact fluency</h3><p>Eight facts, untimed. Accuracy first. A new set any time.</p></div>
<div class="card"><h3>5. Skill fluency</h3><p>Eight grade-level skill items (regrouping, fractions, decimals, equations) with a new set any time.</p></div>
<div class="card"><h3>6. Quick check and goal</h3><p>A vocabulary item, a skill item and a word problem, then a 1 to 4 self-rating.</p></div>
</div>
<h2>Why teachers use it</h2>
<ul>
<li><strong>Zero prep.</strong> Print the packet or open the page. No materials to gather: everything uses paper and pencil.</li>
<li><strong>Every answer is checked by computer.</strong> The program's numbers are computed and re-verified, so answer keys are right.</li>
<li><strong>Untimed on purpose.</strong> Fluency is built on accuracy and strategy, not racing a clock.</li>
<li><strong>Built for multilingual learners.</strong> Spanish word help, sentence frames and one routine you can reuse all year.</li>
<li><strong>Interactive and printable.</strong> The same content as a web page, a Word packet you can edit and a PDF.</li>
</ul>
<p class="note">Looking for the Baltimore City curriculum bridge? That is a separate resource: <a href="/bcpss-teachers/">BCPSS K–8 Curriculum &amp; Language Bridge</a>.</p>
</main>
${foot}`;
}

export function teachersIndex() {
  return `${head("Teacher resources — The Language Page", "Teacher resources: the K–8 Math Literacy & Fluency program and more.")}
${top("teachers")}
<main id="main" class="wrap">
<h1>Teacher resources</h1>
<p class="lede">Ready-to-use materials for your classroom. Each resource works on its own.</p>
<div class="grid">
<a class="card link" href="${BASE}/"><span class="pill">K–8</span><div class="big">Math Literacy &amp; Fluency</div><p class="note">A complete program for every grade: math vocabulary, word problem reading routines, math talk, fact and skill fluency. Interactive pages plus Word and PDF packets.</p></a>
<a class="card link" href="/bcpss-teachers/"><span class="pill">BCPSS</span><div class="big">BCPSS Curriculum &amp; Language Bridge</div><p class="note">Connect Baltimore City units to WIDA language uses, visual vocabulary and labs. A separate resource from Math Literacy.</p></a>
</div>
</main>
${foot}`;
}

export function gradePage(g) {
  const dl = (kind, label, alt) =>
    `<a class="btn ${alt ? "alt" : "amber"}" href="${gradeDir(g)}/downloads/${dlName(g, kind)}.pdf">${label} (PDF)</a><a class="btn alt" href="${gradeDir(g)}/downloads/${dlName(g, kind)}.docx">${label} (Word)</a>`;
  const json = JSON.stringify({ id: g.id, label: gradeLabel(g), units: g.units }).replace(
    /</g,
    "\\u003c",
  );
  const idx = GRADES.findIndex((x) => x.id === g.id);
  const prev = GRADES[idx - 1];
  const next = GRADES[idx + 1];
  return `${head(`${gradeLabel(g)} Math Literacy & Fluency — interactive practice and printable packet`, `${gradeLabel(g)}: ${g.blurb}`)}
${top("home")}
<main id="main" class="wrap">
<p class="crumb"><a href="/teachers/">Teachers</a> › <a href="${BASE}/">Math Literacy</a> › ${esc(gradeLabel(g))}</p>
<h1>${esc(gradeLabel(g))} Math Literacy &amp; Fluency</h1>
<p class="lede">${esc(g.blurb)}</p>
<p><strong>Fluency goal:</strong> ${esc(g.fluencyGoal)}</p>
<div class="dl noprint">${dl("student-packet", "Student packet")}${dl("answer-key", "Answer key and teacher notes", true)}</div>
<noscript><p class="card">This practice page needs JavaScript. The student packet above has the same unit content to print.</p></noscript>
<div id="app" aria-live="off"></div>
<script type="application/json" id="ml-data">${json}</script>
<script type="module" src="${BASE}/assets/ml-app.js"></script>
<p class="noprint" style="margin-top:2rem">${prev ? `<a href="${gradeDir(prev)}/">← ${esc(gradeLabel(prev))}</a>` : ""}${prev && next ? " · " : ""}${next ? `<a href="${gradeDir(next)}/">${esc(gradeLabel(next))} →</a>` : ""}</p>
</main>
${foot}`;
}

export const ROUTINES = [
  {
    name: "Three Reads",
    when: "Every word problem",
    steps: [
      "Read 1: Read the whole problem. Retell it to a partner without looking.",
      "Read 2: Read again. Circle each number and underline what it counts. Cross out any number you do not need.",
      "Read 3: Read the question again. Say what you are looking for, then plan how to find it.",
    ],
    frames: ["The story is about ___.", "The numbers tell ___ and ___.", "I need to find ___."],
  },
  {
    name: "Word Wall in Four Moves",
    when: "Each unit's five words",
    steps: [
      "Say it: students say the word and the Spanish word together.",
      "See it: read the meaning and the example.",
      "Use it: write one sentence with the word on the line provided.",
      'Show it: mark "I can use this word" only after saying a sentence to a partner.',
    ],
    frames: ["___ means ___.", "An example of ___ is ___.", "I can use ___ when ___."],
  },
  {
    name: "Math Talk Moves",
    when: "Math talk and write, any time",
    steps: [
      "Say it: one student explains their thinking using the frame.",
      'Revoice: a partner restates it. "So you are saying ___."',
      'Agree or add: "I agree because ___." or "I want to add ___."',
      "Write it: both students write one sentence from the conversation.",
    ],
    frames: [
      "I think ___ because ___.",
      "So you are saying ___.",
      "I agree with ___ because ___.",
      "I would like to add ___.",
    ],
  },
  {
    name: "Notice and Wonder the Question",
    when: "Warm-up before a new unit",
    steps: [
      "Show one problem with the question covered.",
      "Students write one thing they notice and one thing they wonder.",
      "Uncover the question. Did anyone wonder it?",
    ],
    frames: ["I notice ___.", "I wonder ___.", "This reminds me of ___."],
  },
  {
    name: "Untimed Fluency Round",
    when: "Fact and skill fluency sets",
    steps: [
      "Solve all eight with pencil. No clock.",
      "Check with a partner or on the page. Circle any miss.",
      "Say the strategy for one problem out loud.",
      "Next time, aim to miss fewer, not to finish sooner.",
    ],
    frames: [
      "I used the strategy ___.",
      "I know ___ because ___.",
      "A fact I am working on is ___.",
    ],
  },
  {
    name: "Explain and Check",
    when: "End of each unit",
    steps: [
      "Pick your hardest problem. Solve it a different way.",
      "Do the two answers agree? Say why or why not.",
      "Rate yourself 1 to 4 and tell your partner one reason.",
    ],
    frames: [
      "My two answers are the same because ___.",
      "I changed my answer because ___.",
      "I can teach ___.",
    ],
  },
];

export function routinesPage() {
  const r = ROUTINES.map(
    (x) =>
      `<section class="card" style="margin:.8rem 0"><h2 style="margin-top:0">${esc(x.name)}</h2><p><span class="pill">${esc(x.when)}</span></p><ol>${x.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol><p><strong>Sentence frames:</strong></p><ul>${x.frames.map((f) => `<li class="frame">${esc(f)}</li>`).join("")}</ul></section>`,
  ).join("\n");
  const moves = LIT_STRATEGY.map(
    (s, i) =>
      `<tr><td>Unit ${i + 1}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(s.move)}</td></tr>`,
  ).join("");
  return `${head("Routines: the six routines behind Math Literacy & Fluency", "Six classroom routines used in every grade of the K–8 Math Literacy & Fluency program, with steps and sentence frames.")}
${top("routines")}
<main id="main" class="wrap">
<p class="crumb"><a href="/teachers/">Teachers</a> › <a href="${BASE}/">Math Literacy</a> › Routines</p>
<h1>Six routines, used all year</h1>
<p class="lede">Teach each routine once, then reuse it in every unit and every grade. All of them use paper and pencil and take no preparation.</p>
${r}
<h2>One reading move for each unit</h2>
<p>Every grade teaches the same six reading moves in the same order, one per unit, so students meet each move again in the next grade with harder text.</p>
<table><thead><tr><th>Unit</th><th>Reading move</th><th>What students do</th></tr></thead><tbody>${moves}</tbody></table>
</main>
${foot}`;
}

export function scopePage(built) {
  const rows = GRADES.map((g) => {
    const b = built.find((x) => x.id === g.id);
    return `<tr><th scope="row"><a href="${gradeDir(g)}/" style="color:#fff">${esc(gradeLabel(g))}</a></th>${b.units.map((u) => `<td><strong>${esc(u.title)}</strong><br><span class="note">${esc(u.domain)}</span></td>`).join("")}</tr>`;
  }).join("");
  const goals = GRADES.map(
    (g) => `<tr><th scope="row">${esc(gradeLabel(g))}</th><td>${esc(g.fluencyGoal)}</td></tr>`,
  ).join("");
  return `${head("Scope and sequence: Math Literacy & Fluency K–8", "The six units of every grade, K–8, and each grade's fluency goal.")}
${top("scope")}
<main id="main" class="wrap">
<p class="crumb"><a href="/teachers/">Teachers</a> › <a href="${BASE}/">Math Literacy</a> › Scope and sequence</p>
<h1>Scope and sequence</h1>
<p class="lede">Six units per grade. Units can be taught in order over a school year, or pulled in any order to match what you are teaching.</p>
<div style="overflow-x:auto"><table><thead><tr><th scope="col">Grade</th>${[1, 2, 3, 4, 5, 6].map((n) => `<th scope="col">Unit ${n}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>
<h2>Fluency goal by grade</h2>
<table><thead><tr><th scope="col">Grade</th><th scope="col">Fluency goal</th></tr></thead><tbody>${goals}</tbody></table>
</main>
${foot}`;
}
