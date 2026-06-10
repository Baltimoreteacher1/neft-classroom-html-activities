// Activity Pack generator. Produces a self-contained, B/W print-friendly pack
// with at least 3 complete activities (real problems, directions, answer key):
//   1. Word Search (procedural, from vocabulary terms)
//   2. Vocabulary Matching cards (cut-and-match)
//   3. Error Analysis (find + fix the mistake)
//   4. Exit Ticket
//   5. Challenge Task
import { htmlPage, esc, nameBar } from "./print-style.mjs";

// ---- Word search ----------------------------------------------------------
function buildWordSearch(terms, size = 12) {
  const words = terms
    .map((t) => (t.term || t).toUpperCase().replace(/[^A-Z]/g, ""))
    .filter((w) => w.length >= 3 && w.length <= size)
    .slice(0, 8);
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  const dirs = [
    [0, 1], [1, 0], [1, 1], [1, -1],
  ];
  const placed = [];
  for (const w of words) {
    let ok = false;
    for (let tries = 0; tries < 80 && !ok; tries++) {
      const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
      const r = Math.floor(Math.random() * size);
      const cc = Math.floor(Math.random() * size);
      const er = r + dr * (w.length - 1);
      const ec = cc + dc * (w.length - 1);
      if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
      let fits = true;
      for (let i = 0; i < w.length; i++) {
        const ch = grid[r + dr * i][cc + dc * i];
        if (ch && ch !== w[i]) { fits = false; break; }
      }
      if (!fits) continue;
      for (let i = 0; i < w.length; i++) grid[r + dr * i][cc + dc * i] = w[i];
      placed.push(w);
      ok = true;
    }
  }
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < size; r++)
    for (let cc = 0; cc < size; cc++)
      if (!grid[r][cc]) grid[r][cc] = A[Math.floor(Math.random() * 26)];
  const rows = grid
    .map((row) => `<tr>${row.map((ch) => `<td class="center">${ch}</td>`).join("")}</tr>`)
    .join("");
  const list = placed.map((w) => `<li>${esc(w)}</li>`).join("");
  return `<section class="page">
    <h2>Word Search — Math Vocabulary</h2>${nameBar()}
    <p>Find and circle each word. Words go across, down, and diagonally.</p>
    <table style="font-family:monospace;font-size:13pt;">${rows}</table>
    <h3>Find these words:</h3><ul class="steps" style="columns:2;">${list}</ul>
  </section>`;
}

// ---- Matching cards -------------------------------------------------------
function buildMatching(vocab) {
  const rows = (vocab || [])
    .map(
      (v) =>
        `<tr><td><strong>${esc(v.term)}</strong></td><td>${esc(v.definition)}</td></tr>`,
    )
    .join("");
  return `<section class="page">
    <h2>Vocabulary Match</h2>${nameBar()}
    <p>Cut out the cards and match each word to its meaning. Or draw a line to connect them.</p>
    <table>${rows}</table>
  </section>`;
}

// ---- Error analysis -------------------------------------------------------
function buildErrorAnalysis(L) {
  const mis = (L.misconceptions || [])[0];
  const ex = (L.modeledExamples || [])[0];
  const body = mis
    ? `<p>A student made this mistake:</p>
       <div class="box"><p><strong>Mistake:</strong> ${esc(mis.misconception)}</p></div>
       <p><strong>1.</strong> What did the student do wrong? <span class="work"></span></p>
       <p><strong>2.</strong> Fix it. Show the correct work. <span class="work"></span></p>
       <p class="small">Hint for the fix: ${esc(mis.fix)}</p>`
    : ex
      ? `<p>Here is a worked problem with a mistake somewhere. Find it and fix it.</p>
       <div class="box"><p><strong>${esc(ex.prompt)}</strong></p></div>
       <p><strong>1.</strong> Find the error. <span class="work"></span></p>
       <p><strong>2.</strong> Show the correct answer: ${esc(ex.answer)}.</p>`
      : "<p>No error-analysis item available for this lesson.</p>";
  return `<section class="page"><h2>Find &amp; Fix the Error</h2>${nameBar()}${body}</section>`;
}

// ---- Exit ticket + challenge ---------------------------------------------
function buildExit(L) {
  const items = (L.exitTicket || []).map((e, i) => `<p><strong>${i + 1}.</strong> ${esc(e.prompt)}<span class="work"></span></p>`).join("");
  return `<section class="page"><h2>Exit Ticket</h2>${nameBar()}${items || "<p>Solve one problem from today and explain your thinking.</p>"}</section>`;
}
function buildChallenge(L) {
  if (!L.extension) return "";
  return `<section class="page"><h2>Challenge Task</h2>${nameBar()}<div class="box"><p>${esc(L.extension)}</p></div><p>Show your work and explain your reasoning.</p></section>`;
}

// ---- Answer key -----------------------------------------------------------
function buildKey(L) {
  const k = L.answerKey && L.answerKey.length ? L.answerKey : L.practice || [];
  const ex = (L.exitTicket || []).map((e, i) => `<li>Exit ${i + 1}: ${esc(e.answer || "see rubric")}</li>`).join("");
  return `<section class="page"><h2>Answer Key — Teacher Only</h2>
    <p class="small">Keep separate from students.</p>
    <ol class="key">${k.map((x) => `<li>${esc(x.answer)}${x.work ? ` <span class="small">(${esc(x.work)})</span>` : ""}</li>`).join("")}</ol>
    ${ex ? `<ul class="key">${ex}</ul>` : ""}</section>`;
}

export function renderActivityPack(job) {
  const c = job.card || {};
  const L = job.lesson || {};
  const cover = `<section class="page">
    <h1>${esc(c.title || "Math")} — Activity Pack</h1>
    <p class="meta">Grade 6 Math${c.standard ? ` &middot; ${esc(c.standard)}` : ""}</p>
    <div class="box"><p>${esc(L.objective || "")}</p>
    <p class="small">Inside: Word Search, Vocabulary Match, Find &amp; Fix the Error, Exit Ticket, and a Challenge. Answer key at the back.</p></div>
  </section>`;
  const parts = [
    cover,
    buildWordSearch(L.vocabulary || []),
    buildMatching(L.vocabulary || []),
    buildErrorAnalysis(L),
    buildExit(L),
    buildChallenge(L),
    buildKey(L),
  ].filter(Boolean);
  return htmlPage(`${c.title || "Math"} — Activity Pack`, parts.join("\n"));
}
