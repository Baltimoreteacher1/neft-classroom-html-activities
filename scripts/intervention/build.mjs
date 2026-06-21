/* ==========================================================================
   Generate the intervention hub + one page per topic from data.mjs.
   Run: node scripts/intervention/build.mjs
   Output: math/intervention/index.html and math/intervention/<slug>/index.html
   ========================================================================== */
import { mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { META, TOPICS } from "./data.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = resolve(ROOT, "math/intervention");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const head = (title, desc, depth, canonical) => {
  const url = "https://eduwonderlab.com" + (canonical || "/math/intervention/");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)} | Neft Teacher</title>
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#15487f" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="https://eduwonderlab.com/assets/og-curriculum.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/math/intervention/assets/intervention.css" />
    <link rel="manifest" href="/math/intervention/manifest.webmanifest" />
    <link rel="icon" href="/assets/favicon.svg" />
    <link rel="apple-touch-icon" href="/assets/favicon.svg" />
    <script>
      // Register the offline service worker so stations keep working without
      // wifi once visited (classroom-friendly). Scoped to /math/intervention/.
      if ("serviceWorker" in navigator) {
        addEventListener("load", function () {
          navigator.serviceWorker
            .register("/math/intervention/sw.js", {
              scope: "/math/intervention/",
            })
            .catch(function () {});
        });
      }
    </script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="topbar">
      <div class="wrap">
        <a class="brand" href="/math/intervention/">📈 Math Intervention</a>
        <nav>
          <a href="/math/intervention/">All topics</a>
          <a href="/math/intervention/teacher/">Teacher guide</a>
          <a href="/curriculum/">Curriculum</a>
          <a href="/">Home</a>
        </nav>
      </div>
    </header>`;
};

const foot = `
    <footer class="site-foot">
      <div class="wrap">
        <p>
          <strong>Neft Teacher · 6th-Grade Math Intervention.</strong>
          Self-paced, self-checking, no login. Pair each topic with its pre-quiz
          (before) and post-quiz (after) to measure growth.
          <a href="/curriculum/">Back to the curriculum hub →</a>
        </p>
      </div>
    </footer>
  </body>
</html>`;

/* ------------------------------ HUB ------------------------------ */
function hub() {
  const cards = TOPICS.map(
    (t) => `
        <a
          class="topic-card"
          style="--accent:${t.accent}"
          href="/math/intervention/${t.slug}/"
          target="_blank"
          rel="noopener"
          data-slug="${t.slug}"
          data-domain="${esc(t.domain || "")}"
          data-skills="${esc(t.skills.join(" "))}"
        >
          <div class="icon">${t.icon}</div>
          <span class="std">${esc(t.standard)}</span>
          <h3>${esc(t.title)}</h3>
          <p>${esc(t.blurb)}</p>
          <div style="display:flex;gap:16px;margin:0 0 12px;font-size:.8rem;font-weight:700;color:var(--muted)">
            <span>📚 ${t.lessons} lessons</span><span>⏱ ${t.estMin} min</span>
          </div>
          <div class="chips">
            ${t.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}
          </div>
          <div class="topic-progress"></div>
          <span class="go">Open topic →</span>
        </a>`,
  ).join("");

  // coarse domain filter (clean, publisher-style — not 22 skill chips)
  const domains = [...new Set(TOPICS.map((t) => t.domain))];
  const filterChips =
    `<button class="filter-chip" data-domain="all" aria-pressed="true">All topics</button>` +
    domains
      .map(
        (d) =>
          `<button class="filter-chip" data-domain="${esc(d)}" aria-pressed="false">${esc(d)}</button>`,
      )
      .join("");

  const sosRows = TOPICS.map(
    (t) => `
            <tr>
              <td><a class="sos-topic" href="/math/intervention/${t.slug}/" target="_blank" rel="noopener"><span>${t.icon}</span>${esc(t.title)}</a></td>
              <td><span class="sos-std">${esc(t.standard.replace("Builds ", ""))}</span></td>
              <td>${esc(t.objective.replace(/^I can /, "").replace(/\.$/, ""))}</td>
              <td>${t.lessons}</td>
              <td>${t.estMin} min</td>
              <td><a class="sos-go" href="/math/intervention/${t.slug}/" target="_blank" rel="noopener">Open →</a></td>
            </tr>`,
  ).join("");

  const html = `${head(META.title, META.tagline, 0, "/math/intervention/")}
    <main id="main">
      <section class="masthead">
        <div class="wrap">
          <span class="kicker">📈 Grade 6 · Readiness &amp; Intervention Program</span>
          <h1>Close the gap. Prove the growth.</h1>
          <p class="sub">${esc(META.tagline)}</p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="#topics">Browse intervention topics ↓</a>
            <a class="btn btn-ghost" href="#program">How the program works</a>
          </div>
          <div class="stat-strip">
            <div class="stat"><b>${TOPICS.length}</b><span>Targeted topics</span></div>
            <div class="stat"><b id="stat-started">0</b><span>Topics started</span></div>
            <div class="stat"><b id="stat-mastered">0</b><span>Topics mastered</span></div>
            <div class="stat"><b>${TOPICS.length * 4}</b><span>Pre/post quizzes</span></div>
          </div>
        </div>
      </section>

      <section class="block" id="program">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">The instructional routine</span>
            <h2>One clean path for every student</h2>
            <p>Every topic follows the same four-part routine, so students always know what comes next and teachers can measure growth.</p>
          </div>
          <div class="routine">
            <div class="rstep"><div class="rnum">Step 1 · Assess</div><h4>Pre-Quiz</h4><p>A short Google Form shows exactly where each student starts.</p></div>
            <div class="rstep"><div class="rnum">Step 2 · Practice</div><h4>Guided Practice</h4><p>Interactive, self-checking questions with instant feedback and hints.</p></div>
            <div class="rstep"><div class="rnum">Step 3 · Apply</div><h4>Play &amp; Print</h4><p>An arcade game for fluency plus a printable worksheet for off-screen reps.</p></div>
            <div class="rstep"><div class="rnum">Step 4 · Re-Assess</div><h4>Post-Quiz</h4><p>The same-rigor Form proves growth and flags who still needs help.</p></div>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Program at a glance</span>
            <h2>Scope &amp; sequence</h2>
            <p>${TOPICS.length} targeted topics across ${domains.length} domains rebuild the Grade 6 readiness skills, each tagged to the standard it unlocks.</p>
          </div>
          <div class="sos-wrap">
            <table class="sos">
              <thead>
                <tr><th>Topic</th><th>Standard</th><th>Students will…</th><th>Lessons</th><th>Time</th><th></th></tr>
              </thead>
              <tbody>${sosRows}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="block" id="recent-wrap" hidden>
        <div class="wrap">
          <div class="section-head"><span class="eyebrow">Jump back in</span></div>
          <div class="recent-strip" id="recent-strip"></div>
        </div>
      </section>

      <section class="block" id="topics">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Intervention topics</span>
            <h2>Pick a skill to rebuild</h2>
            <p>Every card opens a full station: diagnostic, practice, game, worksheet, and pre/post quizzes.</p>
          </div>
          <div class="hub-toolbar">
            <label class="search-box">
              <span class="sr-only">Search topics</span>
              <input
                id="topic-search"
                type="search"
                placeholder="Search topics or skills…"
                autocomplete="off"
              />
            </label>
            <button class="btn btn-ghost btn-sm" id="reset-progress" type="button">↺ Reset progress</button>
          </div>
          <div class="filter-chips" role="group" aria-label="Filter by skill">${filterChips}</div>
          <div class="topic-grid" id="topic-grid">${cards}
          </div>
          <p id="no-results" hidden style="color:var(--muted);margin-top:14px">
            No topics match that search.
          </p>
        </div>
      </section>

      <section class="block" id="progress-section" hidden>
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Your progress</span>
            <h2>Track mastery &amp; earn your certificate</h2>
            <p>Your best score on each topic is saved on this device. Master topics (80%+) to fill your certificate.</p>
          </div>
          <div class="prog-dash" id="prog-dash"></div>
          <div class="cert-actions">
            <input id="cert-name" type="text" placeholder="Type your name for the certificate" autocomplete="name" />
            <button class="btn btn-primary btn-sm" id="print-cert" type="button">🏅 Print certificate</button>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="callout">
            <h2>For teachers</h2>
            <p>
              Every topic ships a <strong>pre-</strong> and <strong>post-quiz</strong> in
              both a <strong>student</strong> version (clean) and a <strong>teacher</strong>
              version (auto-graded quiz mode with the answer key). See the
              <a href="/math/intervention/teacher/" style="color:#fff;text-decoration:underline">teacher guide</a>
              for pacing and standards correlation.
            </p>
            <a class="btn btn-primary" href="/math/intervention/teacher/">Open the teacher guide →</a>
          </div>
        </div>
      </section>

      <div class="certificate" id="certificate" aria-hidden="true">
        <div class="cert-inner">
          <p class="cert-kicker">Neft Teacher · 6th-Grade Math Intervention</p>
          <h2 class="cert-title">Certificate of Achievement</h2>
          <p class="cert-pres">This certifies that</p>
          <p class="cert-name" id="cert-name-out">Student Name</p>
          <p class="cert-body">has demonstrated growth and mastered <strong id="cert-count">0</strong> intervention ${TOPICS.length === 1 ? "topic" : "topics"} in Grade 6 mathematics.</p>
          <ul class="cert-list" id="cert-list"></ul>
          <div class="cert-foot"><span>Mr. Neft · Mathematics</span><span id="cert-date"></span></div>
        </div>
      </div>
    </main>${foot}
    <script src="/math/intervention/assets/hub.js"></script>`;

  writeFileSync(resolve(OUT, "index.html"), html);
}

/* --------------------------- TOPIC PAGE -------------------------- */
function topicPage(t) {
  const norm = (i) => ({
    prompt: i.prompt,
    answer: i.answer,
    options: i.options && i.options.length ? i.options : [i.answer, ...(i.distractors || [])],
    explain: i.explain || "",
  });

  const worksheets = t.worksheetA
    ? [
        { label: "Set A · Computation", items: t.worksheetA.map((w) => [w.q, w.a]) },
        { label: "Set B · Application", items: t.worksheetB.map((w) => [w.q, w.a]) },
      ]
    : [{ label: "Practice Set", items: t.worksheet || [] }];
  const wsBlocks = worksheets
    .map(
      (ws) => `
            <div class="worksheet">
              <div class="ws-header">
                <h2>${t.icon} ${esc(t.title)} <span class="ws-variant">${esc(ws.label)}</span></h2>
                <div class="ws-name">Name: ____________________  Date: __________</div>
              </div>
              <div class="ws-problems">${ws.items
                .map(
                  ([q]) => `<div class="ws-problem">${esc(q)}<span class="ws-answer"></span></div>`,
                )
                .join("")}</div>
              <div class="answer-key">
                <h3>Answer Key (teacher)</h3>
                <ol>${ws.items.map(([, a]) => `<li>${esc(a)}</li>`).join("")}</ol>
              </div>
            </div>`,
    )
    .join("");

  const workedHtml = (t.workedExamples || [])
    .map(
      (w, idx) => `
              <div class="we">
                <div class="we-head"><span>Example ${idx + 1}</span><span class="we-tag">${
                  ["Warm-up", "On level", "Challenge"][idx] || "Example"
                }</span></div>
                <div class="we-body">
                  <p style="font-weight:700;color:var(--navy);margin-top:0">${esc(w.problem)}</p>
                  <ol class="we-steps">${w.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
                  <span class="we-answer">Answer: ${esc(w.answer)}</span>
                </div>
              </div>`,
    )
    .join("");

  const lvOne =
    (t.levels && t.levels.one) ||
    "Level 1 (support): use the Materials manipulatives, study the worked examples, and work one step at a time.";
  const lvTwo =
    (t.levels && t.levels.two) ||
    "Level 2 (stretch): finish the ★ challenge on Worksheet B and explain your reasoning in words.";

  // Vocabulary flashcards (flip)
  const flashHtml = t.vocab
    .map(
      (v) => `
            <div class="flashcard" tabindex="0" role="button" aria-label="Flip card: ${esc(v.term)}">
              <div class="fc-inner">
                <div class="fc-face fc-front">
                  <span class="fc-term">${esc(v.term)}</span>
                  <button class="speak-btn" type="button" data-speak="${esc(v.term)}. ${esc(v.def)}" aria-label="Read aloud">🔊</button>
                </div>
                <div class="fc-face fc-back">${esc(v.def)}</div>
              </div>
            </div>`,
    )
    .join("");

  // Exit ticket — 4 short items from the post-quiz
  const exit = t.postQuiz.slice(0, 4);
  const exitHtml = exit
    .map((q, i) => `<div class="ws-problem">${esc(q.prompt)}<span class="ws-answer"></span></div>`)
    .join("");
  const exitKey = exit.map((q) => `<li>${esc(q.answer)}</li>`).join("");

  // Family letter
  const familyVocab = t.vocab.map((v) => `<li><b>${esc(v.term)}</b> — ${esc(v.def)}</li>`).join("");

  // "I can" self-assessment checklist (objective + skills)
  const checklist = [t.objective, ...t.skills.map((s) => `I can use ${s.toLowerCase()}.`)]
    .map(
      (c, i) =>
        `<li><label><input type="checkbox" /> <span>${esc(c.replace(/^I can /, "I can "))}</span></label></li>`,
    )
    .join("");

  const topicJson = JSON.stringify({
    slug: t.slug,
    title: t.title,
    bank: t.bank.map(norm),
  });

  const html = `${head(t.title + " — Math Intervention", t.blurb, 2)}
    <main id="main" style="--accent:${t.accent}">
      <section class="topic-hero">
        <div class="wrap">
          <p class="crumb"><a href="/math/intervention/">← All intervention topics</a></p>
          <span class="icon">${t.icon}</span>
          <span class="eyebrow" style="color:${t.accent};background:${t.accent}1a">${esc(t.standard)}</span>
          <h1 style="color:${t.accent}">${esc(t.title)}</h1>
          <p class="lede" style="max-width:64ch;color:var(--muted)">${esc(t.blurb)}</p>
          <div class="glance">
            <div class="g-main">
              <p class="g-label">Learning objective</p>
              <p class="g-objective">${esc(t.objective)}</p>
              <div class="g-meta">
                <span class="g-pill">🎯 ${esc(t.standard)}</span>
                <span class="g-pill">📚 ${t.lessons} lessons</span>
                <span class="g-pill">⏱ ${t.estMin} min</span>
              </div>
            </div>
            <div class="g-side">
              <h4 class="g-sub">Key vocabulary</h4>
              <ul class="vocab-list">
                ${t.vocab.map((v) => `<li><b>${esc(v.term)}</b> — ${esc(v.def)}</li>`).join("")}
              </ul>
              <h4 class="g-sub">Materials</h4>
              <ul class="materials-list">
                ${t.materials.map((m) => `<li>${esc(m)}</li>`).join("")}
              </ul>
            </div>
          </div>
          <div class="tabs" role="tablist">
            ${workedHtml ? `<button class="tab" role="tab" data-tab="learn">📖 Learn</button>` : ""}
            <button class="tab" role="tab" data-tab="diagnostic">🩺 Diagnostic</button>
            <button class="tab" role="tab" data-tab="practice">✏️ Practice</button>
            <button class="tab" role="tab" data-tab="fluency">⚡ Fluency</button>
            <button class="tab" role="tab" data-tab="game">🎮 Game</button>
            <button class="tab" role="tab" data-tab="vocab">🗂️ Vocabulary</button>
            <button class="tab" role="tab" data-tab="worksheet">🖨️ Printables</button>
            <button class="tab" role="tab" data-tab="quizzes">📋 Pre/Post Quiz</button>
            <button class="tab" role="tab" data-tab="supports">🧩 Supports</button>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          ${
            workedHtml
              ? `<div class="panel" id="panel-learn">
            <h3>Worked examples</h3>
            <p>Study these three examples — easy to challenge — then head to Practice.</p>
            <div class="worked">${workedHtml}</div>
          </div>`
              : ""
          }

          <div class="panel" id="panel-diagnostic">
            <h3>Where do you start?</h3>
            <p>Six quick questions. We'll tell you whether to skip ahead or dig in.</p>
            <div id="diagnostic-widget"></div>
          </div>

          <div class="panel" id="panel-practice">
            <h3>Practice with instant feedback</h3>
            <p>Ten questions, self-checking. Aim for 80%+, then try the game.</p>
            <div id="practice-widget"></div>
          </div>

          <div class="panel" id="panel-game">
            <h3>Answer Drop</h3>
            <p>Tap a falling tile — or press number keys <strong>1–4</strong> — to match the problem. Five lives — how high can you climb?</p>
            <div class="game-stage" id="game-stage">
              <div class="game-hud" aria-hidden="true"></div>
              <canvas role="img" aria-label="Answer Drop game. Tap the falling tile that matches the problem shown at the bottom, or press number keys 1 to 4 to pick the tile in that column."></canvas>
              <div class="game-overlay">
                <div>
                  <h3>Answer Drop</h3>
                  <p>Click the tile that solves the problem — or use number keys 1–4 — before it hits the bottom.</p>
                  <button class="btn btn-primary" id="game-stage-start" type="button">▶ Play</button>
                </div>
              </div>
            </div>
          </div>

          <div class="panel" id="panel-fluency">
            <h3>60-second fluency drill</h3>
            <p>Answer as many as you can before the clock runs out — speed plus accuracy builds automaticity.</p>
            <div id="fluency-widget"></div>
          </div>

          <div class="panel" id="panel-vocab">
            <h3>Vocabulary flashcards</h3>
            <p>Tap a card to flip it. Use 🔊 to hear the word and meaning.</p>
            <div class="flashcards">${flashHtml}</div>
          </div>

          <div class="panel print-target" id="panel-worksheet">
            <h3>Printable resources</h3>
            <div class="ws-actions">
              <button class="btn btn-primary btn-sm" data-print type="button">🖨️ Print / Save PDF packet</button>
              <span style="color:var(--muted);font-size:.85rem">Two worksheets, an exit ticket, and a family letter — each with answer keys.</span>
            </div>${wsBlocks}

            <div class="worksheet">
              <div class="ws-header">
                <h2>${t.icon} ${esc(t.title)} <span class="ws-variant">Exit Ticket</span></h2>
                <div class="ws-name">Name: ____________________  Date: __________</div>
              </div>
              <p style="color:var(--muted);margin-top:0">Quick check — answer all four before you leave.</p>
              <div class="ws-problems">${exitHtml}</div>
              <div class="answer-key"><h3>Answer Key (teacher)</h3><ol>${exitKey}</ol></div>
            </div>

            <div class="family-letter">
              <div class="ws-header">
                <h2>👪 Family Letter <span class="ws-variant">${esc(t.title)}</span></h2>
              </div>
              <p>Dear Family,</p>
              <p>This week your student is working on <strong>${esc(t.title.toLowerCase())}</strong>. The goal is: <em>${esc(t.objective)}</em></p>
              <p><strong>Words to know at home:</strong></p>
              <ul class="vocab-list">${familyVocab}</ul>
              <p><strong>How to help:</strong> ask your student to teach you one example out loud, look for these ideas in everyday life (shopping, cooking, time, money), and praise effort and clear explanations — not just right answers.</p>
              <p>Thank you for supporting math at home!<br />— Mr. Neft</p>
            </div>
          </div>

          <div class="panel" id="panel-quizzes">
            <h3>Pre-Quiz &amp; Post-Quiz</h3>
            <p>
              Assign the <strong>pre-quiz</strong> before the station and the
              <strong>post-quiz</strong> after. Each comes in a student version and a
              teacher (auto-graded) version.
            </p>
            <div class="quiz-grid" id="quiz-grid" data-slug="${t.slug}"></div>
            <p class="quiz-pending" id="quiz-pending" style="margin-top:14px">
              Quiz links are wired from <code>assets/forms-links.js</code> once the Google
              Forms are generated (see <code>scripts/intervention/forms.gs</code>).
            </p>
          </div>

          <div class="panel" id="panel-supports">
            <h3>Track your learning</h3>
            <p>Check each box when you can do it on your own.</p>
            <ul class="ican-list">${checklist}</ul>
            <h3 style="margin-top:22px">Differentiation</h3>
            <div class="levels">
              <div class="level"><h4>Level 1 — Support</h4><p>${esc(lvOne)}</p></div>
              <div class="level"><h4>Level 2 — Stretch</h4><p>${esc(lvTwo)}</p></div>
            </div>
          </div>
        </div>
      </section>
    </main>${foot}
    <script>window.TOPIC = ${topicJson};</script>
    <script src="/math/intervention/assets/intervention-engine.js"></script>
    <script src="/math/intervention/assets/forms-links.js"></script>
    <script src="/math/intervention/assets/quiz-render.js"></script>`;

  mkdirSync(resolve(OUT, t.slug), { recursive: true });
  writeFileSync(resolve(OUT, t.slug, "index.html"), html);
}

/* ----------------------- TEACHER PACING GUIDE -------------------- */
function teacherGuide() {
  const rows = TOPICS.map(
    (t, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><a class="sos-topic" href="/math/intervention/${t.slug}/" target="_blank" rel="noopener"><span>${t.icon}</span>${esc(t.title)}</a></td>
              <td><span class="sos-std">${esc(t.standard.replace("Builds ", ""))}</span></td>
              <td>${esc(t.objective.replace(/^I can /, ""))}</td>
              <td>${t.lessons} × ${t.estMin}m</td>
            </tr>`,
  ).join("");
  const html = `${head("Teacher Guide — Math Intervention", "Pacing guide, standards correlation, and routine for the 6th-grade math intervention program.", 1, "/math/intervention/teacher/")}
    <main id="main">
      <section class="masthead">
        <div class="wrap">
          <span class="kicker">👩‍🏫 Teacher Guide</span>
          <h1>Pacing, standards &amp; routine</h1>
          <p class="sub">Everything you need to run the 6th-Grade Math Intervention program — a ${TOPICS.length}-unit, year-long readiness track.</p>
          <div class="hero-cta">
            <a class="btn btn-primary" data-print href="#">🖨️ Print this guide</a>
            <a class="btn btn-ghost" href="/math/intervention/">Open the student hub</a>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">How to run it</span>
            <h2>The four-part routine</h2>
            <p>Each unit is a self-paced station. Reserve 2–4 short sessions per unit.</p>
          </div>
          <div class="routine">
            <div class="rstep"><div class="rnum">Step 1</div><h4>Assign the Pre-Quiz</h4><p>Use the student Google Form to baseline. The teacher form auto-grades with the key.</p></div>
            <div class="rstep"><div class="rnum">Step 2</div><h4>Run the station</h4><p>Students work Learn → Practice → Fluency → Game, then a printable worksheet.</p></div>
            <div class="rstep"><div class="rnum">Step 3</div><h4>Send home</h4><p>Print the family letter and exit ticket; assign Level 1 or Level 2 supports as needed.</p></div>
            <div class="rstep"><div class="rnum">Step 4</div><h4>Post-Quiz &amp; review</h4><p>Re-assess with the post-quiz to measure growth and regroup.</p></div>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Pacing &amp; standards correlation</span>
            <h2>${TOPICS.length}-unit scope &amp; sequence</h2>
            <p>Suggested order, the Grade 6 standard each unit builds toward, and approximate time.</p>
          </div>
          <div class="sos-wrap">
            <table class="sos">
              <thead><tr><th>#</th><th>Unit</th><th>Standard</th><th>Students will…</th><th>Pacing</th></tr></thead>
              <tbody>${rows}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="callout">
            <h2>Generate the quizzes</h2>
            <p>Run <code>scripts/intervention/forms.gs</code> in Google Apps Script once to create every pre/post quiz as a Google Form (student + auto-graded teacher versions), then paste the links into <code>assets/forms-links.js</code>.</p>
            <a class="btn btn-primary" href="/math/intervention/">Back to the hub</a>
          </div>
        </div>
      </section>
    </main>${foot}
    <script src="/math/intervention/assets/intervention-engine.js"></script>`;
  mkdirSync(resolve(OUT, "teacher"), { recursive: true });
  writeFileSync(resolve(OUT, "teacher", "index.html"), html);
}

mkdirSync(OUT, { recursive: true });

// Prune stale topic folders no longer in the data (keep assets/ + current slugs).
const keep = new Set(["assets", "teacher", ...TOPICS.map((t) => t.slug)]);
for (const entry of readdirSync(OUT, { withFileTypes: true })) {
  if (entry.isDirectory() && !keep.has(entry.name)) {
    rmSync(resolve(OUT, entry.name), { recursive: true, force: true });
    console.log(`  pruned stale topic folder: ${entry.name}`);
  }
}

hub();
TOPICS.forEach(topicPage);
teacherGuide();
console.log(`Built intervention hub + ${TOPICS.length} topic pages + teacher guide → ${OUT}`);
