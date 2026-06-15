/* ==========================================================================
   Generate the intervention hub + one page per topic from data.mjs.
   Run: node scripts/intervention/build.mjs
   Output: math/intervention/index.html and math/intervention/<slug>/index.html
   ========================================================================== */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { META, TOPICS } from "./data.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = resolve(ROOT, "math/intervention");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const head = (title, desc, depth, canonical) => {
  const base = "../".repeat(depth);
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
    <link rel="stylesheet" href="${base}assets/intervention.css" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="topbar">
      <div class="wrap">
        <a class="brand" href="/math/intervention/">📈 Math Intervention</a>
        <nav>
          <a href="/curriculum/">Curriculum</a>
          <a href="/math/intervention/">All topics</a>
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
          data-slug="${t.slug}"
          data-skills="${esc(t.skills.join(" "))}"
        >
          <div class="icon">${t.icon}</div>
          <span class="std">${esc(t.standard)}</span>
          <h3>${esc(t.title)}</h3>
          <p>${esc(t.blurb)}</p>
          <div class="chips">
            ${t.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}
          </div>
          <div class="topic-progress"></div>
          <span class="go">Open topic →</span>
        </a>`,
  ).join("");

  // unique skills for the filter bar
  const skills = [...new Set(TOPICS.flatMap((t) => t.skills))].sort();
  const filterChips =
    `<button class="filter-chip" data-skill="all" aria-pressed="true">All</button>` +
    skills
      .map((s) => `<button class="filter-chip" data-skill="${esc(s)}" aria-pressed="false">${esc(s)}</button>`)
      .join("");

  const html = `${head(META.title, META.tagline, 0, "/math/intervention/")}
    <main id="main">
      <section class="hero">
        <div class="wrap">
          <span class="eyebrow">Grade 6 · Readiness &amp; Intervention</span>
          <h1>Close the gap. Prove the growth.</h1>
          <p class="lede">${esc(META.tagline)}</p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="#topics">Browse intervention topics ↓</a>
            <a class="btn btn-ghost" href="/curriculum/">Grade 6 curriculum</a>
          </div>
          <div class="stat-strip">
            <div class="stat"><b>${TOPICS.length}</b><span>Targeted topics</span></div>
            <div class="stat"><b id="stat-started">0</b><span>Topics started</span></div>
            <div class="stat"><b id="stat-mastered">0</b><span>Topics mastered</span></div>
            <div class="stat"><b>${TOPICS.length * 4}</b><span>Pre/post quizzes</span></div>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">How it works</span>
            <h2>One clean path for every student</h2>
            <p>Each topic follows the same routine so students always know what to do next.</p>
          </div>
          <div class="steps">
            <div class="step"><h4>Pre-Quiz</h4><p>A short Google Form shows exactly where each student starts.</p></div>
            <div class="step"><h4>Practice</h4><p>Interactive, self-checking questions with instant feedback and hints.</p></div>
            <div class="step"><h4>Play &amp; Print</h4><p>An arcade game to build fluency plus a worksheet for off-screen reps.</p></div>
            <div class="step"><h4>Post-Quiz</h4><p>The same-rigor Form proves growth and flags who still needs help.</p></div>
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

      <section class="block">
        <div class="wrap">
          <div class="callout">
            <h2>For teachers</h2>
            <p>
              Every topic ships a <strong>pre-</strong> and <strong>post-quiz</strong> in
              both a <strong>student</strong> version (clean) and a <strong>teacher</strong>
              version (auto-graded quiz mode with the answer key). Assign the pre-quiz,
              run the station, then assign the post-quiz to measure growth.
            </p>
            <a class="btn btn-primary" href="#topics">See the topics ↑</a>
          </div>
        </div>
      </section>
    </main>${foot}
    <script src="/math/intervention/assets/hub.js"></script>`;

  writeFileSync(resolve(OUT, "index.html"), html);
}

/* --------------------------- TOPIC PAGE -------------------------- */
function topicPage(t) {
  const wsRows = t.worksheet
    .map(([q]) => `<div class="ws-problem">${esc(q)}<span class="ws-answer"></span></div>`)
    .join("");
  const wsKey = t.worksheet.map(([, a]) => `<li>${esc(a)}</li>`).join("");

  const topicJson = JSON.stringify({
    slug: t.slug,
    title: t.title,
    bank: t.bank.map((i) => ({
      prompt: i.prompt,
      answer: i.answer,
      options: i.options,
      explain: i.explain,
    })),
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
          <div class="tabs" role="tablist">
            <button class="tab" role="tab" data-tab="diagnostic">🩺 Diagnostic</button>
            <button class="tab" role="tab" data-tab="practice">✏️ Practice</button>
            <button class="tab" role="tab" data-tab="game">🎮 Game</button>
            <button class="tab" role="tab" data-tab="worksheet">🖨️ Worksheet</button>
            <button class="tab" role="tab" data-tab="quizzes">📋 Pre/Post Quiz</button>
            <button class="tab" role="tab" data-tab="supports">🧩 Supports</button>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
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
            <p>Tap the falling tile that matches the problem. Three lives — how high can you climb?</p>
            <div class="game-stage" id="game-stage">
              <div class="game-hud"></div>
              <canvas></canvas>
              <div class="game-overlay">
                <div>
                  <h3>Answer Drop</h3>
                  <p>Click the tile that solves the problem before it hits the bottom.</p>
                  <button class="btn btn-primary" id="game-stage-start" type="button">▶ Play</button>
                </div>
              </div>
            </div>
          </div>

          <div class="panel print-target" id="panel-worksheet">
            <h3>Printable worksheet</h3>
            <div class="ws-actions">
              <button class="btn btn-primary btn-sm" data-print type="button">🖨️ Print / Save PDF</button>
              <span style="color:var(--muted);font-size:.85rem">Includes a teacher answer key on page 2.</span>
            </div>
            <div class="worksheet">
              <div class="ws-header">
                <h2>${t.icon} ${esc(t.title)}</h2>
                <div class="ws-name">Name: ____________________  Date: __________</div>
              </div>
              <div class="ws-problems">${wsRows}</div>
              <div class="answer-key">
                <h3>Answer Key (teacher)</h3>
                <ol>${wsKey}</ol>
              </div>
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
            <h3>Differentiation</h3>
            <div class="levels">
              <div class="level"><h4>Level 1 — Support</h4><p>${esc(t.levels.one)}</p></div>
              <div class="level"><h4>Level 2 — Stretch</h4><p>${esc(t.levels.two)}</p></div>
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

mkdirSync(OUT, { recursive: true });
hub();
TOPICS.forEach(topicPage);
console.log(`Built intervention hub + ${TOPICS.length} topic pages → ${OUT}`);
