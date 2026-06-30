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

const lowerFirst = (s) =>
  String(s || "")
    .replace(/^./, (c) => c.toLowerCase())
    .replace(/-([A-Z])/g, (_, c) => `-${c.toLowerCase()}`);
const skillList = (t) =>
  t.skills.length > 2
    ? `${t.skills.slice(0, -1).join(", ")}, and ${t.skills.at(-1)}`
    : t.skills.length === 2
      ? `${t.skills[0]} and ${t.skills[1]}`
    : t.skills[0] || t.title;

const DOMAIN_GUIDES = {
  "Number & Operations": {
    model:
      "Build the operation with arrays, factor rainbows, or place-value boxes before recording an algorithm.",
    misconception:
      "Students often know the procedure but lose place value, skip a remainder, or stop checking whether the answer is reasonable.",
    discourse: "My estimate was ___, so my exact answer is reasonable because ___.",
    lookFor:
      "Watch for digit alignment, factor pairs, and whether students can explain what each number means.",
    language:
      "Use sentence frames with quantity words: product, quotient, factor, multiple, remainder.",
    extension: "Ask students to create a real-world situation that matches the same computation.",
  },
  "Fractions & Decimals": {
    model:
      "Use area models, number lines, and place-value charts so students see the size of each quantity.",
    misconception:
      "Students may compare digits instead of values, treat denominators as whole-number size, or forget that decimals and fractions can represent the same amount.",
    discourse: "These two values are equivalent because I can show them as ___ and ___.",
    lookFor:
      "Listen for unit language: halves, tenths, hundredths, equal parts, and benchmark values.",
    language:
      "Pair every symbolic step with a visual phrase such as 'three tenths' or 'five equal parts'.",
    extension: "Have students prove the same answer using a visual model and an equation.",
  },
  "Ratios & Proportions": {
    model:
      "Start with ratio tables, double number lines, tape diagrams, and percent bars before using a shortcut.",
    misconception:
      "Students often add instead of multiply, compare only one quantity, or mix up part, whole, and rate.",
    discourse: "For every ___, there are ___, so the constant relationship is ___.",
    lookFor:
      "Check whether students keep the units attached and scale both quantities by the same factor.",
    language: "Emphasize for every, per, out of 100, part, whole, and equivalent ratio.",
    extension: "Ask students to design a new situation with the same ratio relationship.",
  },
  "Number System": {
    model:
      "Use vertical and horizontal number lines, counters, and coordinate grids to make direction and distance visible.",
    misconception:
      "Students may confuse absolute value with the original number or treat negative values as always larger because the digit is larger.",
    discourse: "The point is ___ units from zero and moves ___ because ___.",
    lookFor: "Watch whether students name direction, distance from zero, and quadrant correctly.",
    language:
      "Rehearse the words opposite, absolute value, quadrant, x-coordinate, y-coordinate, and origin.",
    extension:
      "Ask students to create a map or temperature story that requires the same reasoning.",
  },
  "Expressions & Equations": {
    model:
      "Use balance models, substitution tables, and color-coded terms before simplifying symbolically.",
    misconception:
      "Students may combine unlike terms, reverse an inequality incorrectly, or solve without checking the answer in context.",
    discourse: "I kept the equation balanced by ___, and I checked it by ___.",
    lookFor: "Notice whether students preserve equality and can translate words into variables.",
    language:
      "Use frames for variable, coefficient, term, solution, inequality, greater than, and less than.",
    extension: "Have students write a different equation or inequality with the same solution.",
  },
  Geometry: {
    model:
      "Use grids, nets, formula cards, and decomposed shapes so students connect measurement to structure.",
    misconception:
      "Students may swap area and volume, count edges twice, or use a formula without matching each dimension.",
    discourse: "I chose this formula because the shape has ___ and the units are ___.",
    lookFor: "Check labels, units, and whether students can point to each value on the diagram.",
    language:
      "Preteach base, height, face, net, surface area, volume, unit square, and cubic unit.",
    extension: "Ask students to change one dimension and predict how the measurement changes.",
  },
  "Statistics & Data": {
    model:
      "Use dot plots, histograms, data cards, and class-created displays before calculating summaries.",
    misconception:
      "Students may report a number without describing variability, shape, or what the data actually represent.",
    discourse: "The data show ___ because the center is ___ and the spread is ___.",
    lookFor: "Listen for evidence-based claims that mention center, spread, shape, and context.",
    language: "Use frames for mean, median, mode, range, distribution, cluster, gap, and outlier.",
    extension: "Ask students to compare two displays and defend which group is more consistent.",
  },
};

const topicGuide = (t) =>
  DOMAIN_GUIDES[t.domain] || {
    model: `Represent ${lowerFirst(t.title)} with a visual model, a table, and an equation.`,
    misconception: `Students may answer procedurally without explaining why the method works for ${lowerFirst(t.title)}.`,
    discourse: `My strategy works because ___.`,
    lookFor: `Look for accurate use of ${skillList(t).toLowerCase()} and a clear explanation.`,
    language: `Preteach the key vocabulary, then ask students to use it in a complete sentence.`,
    extension: "Ask students to create a new problem that uses the same structure.",
  };

function evidenceMoves(t) {
  const g = topicGuide(t);
  return [
    {
      label: "Launch",
      title: "Make the gap visible",
      text: `Students preview ${skillList(t).toLowerCase()} with one low-floor problem, one model, and one vocabulary check.`,
    },
    {
      label: "Model",
      title: "Connect concrete to symbolic",
      text: g.model,
    },
    {
      label: "Explain",
      title: "Require math talk",
      text: `Students complete the frame: "${g.discourse}"`,
    },
    {
      label: "Transfer",
      title: "Apply in context",
      text: g.extension,
    },
  ];
}

function publisherBlueprint(t) {
  const g = topicGuide(t);
  const skills = skillList(t).toLowerCase();
  return {
    essentialQuestion: `How do mathematicians use ${skills} to make sense of real problems and defend an answer?`,
    prerequisite: `Students should be able to read the problem, identify important quantities, and use at least one visual model before formal work with ${skills}.`,
    transfer: g.extension,
    successCriteria: [
      "I can represent the math with a model, table, number line, diagram, or equation.",
      `I can use ${skills} accurately and explain why the strategy fits the problem.`,
      "I can find and correct an error by naming the misconception.",
      "I can prove growth with a post-quiz score, an exit ticket, and a written explanation.",
    ],
    lessonArc: [
      {
        phase: "Session 1",
        title: "Diagnose and name the gap",
        teacher: "Assign the pre-quiz, sort students into groups, and launch one low-floor model.",
        student: "Take the pre-quiz, complete the diagnostic, and write one goal for the topic.",
        evidence: "Pre-quiz score, diagnostic score, student goal.",
      },
      {
        phase: "Session 2",
        title: "Build the concept",
        teacher: g.model,
        student: "Annotate the worked examples and complete the concept lab discussion frame.",
        evidence: "Annotated example, vocabulary sentence, model check.",
      },
      {
        phase: "Session 3",
        title: "Practice with feedback",
        teacher: "Conference with students using Smart Review misses and the Error Clinic protocol.",
        student: "Complete Practice, Smart Review, and the fluency drill until one score improves.",
        evidence: "Practice percent, cleared Smart Review item, fluency count.",
      },
      {
        phase: "Session 4",
        title: "Apply and transfer",
        teacher: "Assign Worksheet B and the performance task; listen for the discourse frame.",
        student: "Solve a contextual problem, explain the strategy, and revise the explanation.",
        evidence: "Performance task, revised explanation, exit ticket.",
      },
      {
        phase: "Session 5",
        title: "Reassess and reflect",
        teacher: "Assign the post-quiz, compare growth, and select the next intervention move.",
        student: "Take the post-quiz and complete a reflection on what changed.",
        evidence: "Post-quiz score, reflection, next-step recommendation.",
      },
    ],
    pathways: [
      {
        name: "Intensive reteach",
        trigger: "Pre-quiz or diagnostic below 50%",
        moves: "Teacher-led model, manipulatives, read-aloud question support, Worksheet A odd items, then one Smart Review item.",
      },
      {
        name: "Guided practice",
        trigger: "50% to 79% or inconsistent explanations",
        moves: "Concept Lab, worked examples, Practice, Error Clinic, Worksheet A/B mix, and an exit ticket conference.",
      },
      {
        name: "Extension and transfer",
        trigger: "80%+ with clear explanation",
        moves: "Worksheet B challenge, performance task, student-created example, and peer teaching using the discourse frame.",
      },
    ],
    rubric: [
      {
        level: "4 · Publishes math thinking",
        criteria: "Accurate answer, efficient strategy, clear model, complete explanation, and correct vocabulary.",
      },
      {
        level: "3 · Meets standard",
        criteria: "Accurate answer and a mostly clear strategy with enough explanation to follow the thinking.",
      },
      {
        level: "2 · Developing",
        criteria: "Partially correct work; model or explanation shows a gap that can be repaired with feedback.",
      },
      {
        level: "1 · Needs reteach",
        criteria: "Misconception is still present; student needs a concrete model and a smaller parallel problem.",
      },
    ],
    notebook: [
      `Before I solve, the quantities I notice are ___ and ___.`,
      `A model that helps me understand ${lowerFirst(t.title)} is ___ because ___.`,
      `One mistake a student might make is ___; I would fix it by ___.`,
      `My post-quiz goal is ___, and the evidence I will use is ___.`,
    ],
  };
}

function conceptArchitecture(t) {
  const g = topicGuide(t);
  return {
    headline: `The big idea: ${t.title} is about choosing a representation, keeping quantities organized, and defending the strategy.`,
    teacherFrame: `Open with the larger concept before students touch the practice set: What does the situation mean, what model fits it, and how will we know the answer is reasonable?`,
    progression: [
      {
        step: "Understand",
        title: "Name the quantities",
        text: `Students identify what is known, what is unknown, and which vocabulary from ${lowerFirst(t.title)} matters.`,
      },
      {
        step: "Represent",
        title: "Build the model",
        text: g.model,
      },
      {
        step: "Strategize",
        title: "Choose the tool",
        text: `Students connect the model to ${skillList(t).toLowerCase()} and explain why that tool fits.`,
      },
      {
        step: "Prove",
        title: "Justify and revise",
        text: `Students use the discourse frame, check for the likely misconception, and revise the written explanation.`,
      },
    ],
  };
}

function miniLessonBlueprint(t) {
  const g = topicGuide(t);
  const skills = t.skills.length ? t.skills : [t.title];
  return skills.slice(0, 4).map((skill, idx) => {
    const example = (t.workedExamples || [])[idx % Math.max(1, (t.workedExamples || []).length)];
    const practice = (t.bank || []).slice(idx * 3, idx * 3 + 3);
    const objective =
      idx === 0
        ? `I can explain what ${lowerFirst(skill)} means before I calculate.`
        : `I can use ${lowerFirst(skill)} as one part of solving ${lowerFirst(t.title)} problems.`;
    return {
      number: idx + 1,
      title: skill,
      objective,
      concept: idx === 0 ? "Open the concept" : idx === skills.length - 1 ? "Connect and transfer" : "Build the next piece",
      teacherMove:
        idx === 0
          ? `Launch with a low-floor context and ask students to show ${lowerFirst(skill)} with a model before naming a rule.`
          : `Use the previous mini-lesson as the anchor, then add ${lowerFirst(skill)} with one worked example and one parallel try-it item.`,
      model: example
        ? `${example.problem} Work it aloud, then cover the steps and ask students to rebuild the reasoning.`
        : g.model,
      studentWork:
        practice.length > 0
          ? practice.map((q) => q.prompt).join(" | ")
          : `Create one original ${lowerFirst(t.title)} problem and solve it with a model and explanation.`,
      misconception: idx === 0 ? g.misconception : `Students may treat ${lowerFirst(skill)} as a shortcut instead of connecting it back to the model.`,
      evidence: idx === skills.length - 1 ? "Exit ticket plus revised explanation." : "Annotated model and one accurate independent item.",
    };
  });
}

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

  const evidenceRows = TOPICS.map((t) => {
    const g = topicGuide(t);
    return `
            <tr>
              <td><a class="sos-topic" href="/math/intervention/${t.slug}/" target="_blank" rel="noopener"><span>${t.icon}</span>${esc(t.title)}</a></td>
              <td>${esc(g.lookFor)}</td>
              <td>${esc(g.misconception)}</td>
              <td>${esc(g.language)}</td>
            </tr>`;
  }).join("");

  const productRows = [
    ["Student Edition", "Clear objectives, concept labs, worked examples, practice, games, vocabulary, notebook prompts, and performance tasks."],
    ["Teacher Edition", "Placement guidance, lesson arcs, teacher look-fors, misconception clinics, small-group pathways, and printable routines."],
    ["Assessment System", "Pre/post quizzes, diagnostics, exit tickets, rubrics, Smart Review, progress reports, and mastery certificates."],
    ["Multilingual Supports", "Vocabulary rehearsal, read-aloud support, discourse frames, Talk-Write-Revise routines, and family letters."],
  ]
    .map(
      ([name, desc]) => `
            <article class="product-card">
              <span>${esc(name)}</span>
              <p>${esc(desc)}</p>
            </article>`,
    )
    .join("");

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
            <span class="eyebrow">Publisher-quality program design</span>
            <h2>A complete intervention curriculum, not a collection of links</h2>
            <p>Every topic opens with the larger mathematical concept, then breaks into focused mini-lessons that move students from representation to strategy to proof.</p>
          </div>
          <div class="product-system">${productRows}</div>
          <div class="routine">
            <div class="rstep"><div class="rnum">Step 1 · Assess</div><h4>Pre-Quiz</h4><p>A short Google Form shows exactly where each student starts.</p></div>
            <div class="rstep"><div class="rnum">Step 2 · Practice</div><h4>Guided Practice</h4><p>Interactive, self-checking questions with instant feedback and hints.</p></div>
            <div class="rstep"><div class="rnum">Step 3 · Apply</div><h4>Play &amp; Print</h4><p>An arcade game for fluency plus a printable worksheet for off-screen reps.</p></div>
            <div class="rstep"><div class="rnum">Step 4 · Re-Assess</div><h4>Post-Quiz</h4><p>The same-rigor Form proves growth and flags who still needs help.</p></div>
          </div>
          <div class="architecture-grid">
            <article class="arch-card">
              <span class="arch-num">01</span>
              <h3>Placement sprint</h3>
              <p>Use the pre-quiz plus the first diagnostic score to place students into reteach, guided practice, or extension without guesswork.</p>
            </article>
            <article class="arch-card">
              <span class="arch-num">02</span>
              <h3>Concept studio</h3>
              <p>Every topic now pairs worked examples with a concept model, vocabulary rehearsal, smart review, and a misconception clinic.</p>
            </article>
            <article class="arch-card">
              <span class="arch-num">03</span>
              <h3>Evidence loop</h3>
              <p>Teachers get look-fors, language supports, printables, exit tickets, and post-quiz proof so intervention work can be documented.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">What changed for publication readiness</span>
            <h2>Depth, clarity, coherence, and evidence</h2>
            <p>This version is organized like a publishable intervention product: consistent routines, complete teacher supports, student-facing clarity, and multiple ways to prove learning.</p>
          </div>
          <div class="quality-grid">
            <article><b>01</b><h3>Coherent sequence</h3><p>Each topic now has a larger concept spine, focused mini-lessons, and a 5-session lesson arc with evidence checkpoints.</p></article>
            <article><b>02</b><h3>Instructional depth</h3><p>Concept models, misconception clinics, performance tasks, rubrics, and notebook prompts extend beyond answer practice.</p></article>
            <article><b>03</b><h3>Teacher usability</h3><p>Placement pathways make it clear when to reteach, guide practice, or extend a student.</p></article>
            <article><b>04</b><h3>Student engagement</h3><p>Students move through missions, Smart Review, fluency, games, printables, and certificate/report systems.</p></article>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Teacher decision support</span>
            <h2>Plan groups from evidence</h2>
            <p>Each topic includes the observable misconception, the teacher look-for, and the multilingual scaffold that should drive the next small-group move.</p>
          </div>
          <div class="sos-wrap">
            <table class="sos evidence-table">
              <thead>
                <tr><th>Topic</th><th>Teacher look-for</th><th>Common gap</th><th>Language scaffold</th></tr>
              </thead>
              <tbody>${evidenceRows}
              </tbody>
            </table>
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
  const guide = topicGuide(t);
  const blueprint = publisherBlueprint(t);
  const architecture = conceptArchitecture(t);
  const miniLessons = miniLessonBlueprint(t);
  const moves = evidenceMoves(t)
    .map(
      (m) => `
              <article class="move-card">
                <span>${esc(m.label)}</span>
                <h4>${esc(m.title)}</h4>
                <p>${esc(m.text)}</p>
              </article>`,
    )
    .join("");

  const progressionHtml = architecture.progression
    .map(
      (p) => `
              <article class="concept-step">
                <span>${esc(p.step)}</span>
                <h4>${esc(p.title)}</h4>
                <p>${esc(p.text)}</p>
              </article>`,
    )
    .join("");

  const miniLessonHtml = miniLessons
    .map(
      (l) => `
              <article class="mini-lesson">
                <div class="mini-num">Lesson ${l.number}</div>
                <div class="mini-body">
                  <span>${esc(l.concept)}</span>
                  <h4>${esc(l.title)}</h4>
                  <p class="mini-objective">${esc(l.objective)}</p>
                  <dl>
                    <dt>Teacher move</dt><dd>${esc(l.teacherMove)}</dd>
                    <dt>Model or example</dt><dd>${esc(l.model)}</dd>
                    <dt>Student practice</dt><dd>${esc(l.studentWork)}</dd>
                    <dt>Error to catch</dt><dd>${esc(l.misconception)}</dd>
                    <dt>Evidence</dt><dd>${esc(l.evidence)}</dd>
                  </dl>
                </div>
              </article>`,
    )
    .join("");

  const miniLessonPrintRows = miniLessons
    .map(
      (l) => `
                <tr>
                  <th>Mini-Lesson ${l.number}: ${esc(l.title)}</th>
                  <td>${esc(l.objective)}</td>
                  <td>${esc(l.evidence)}</td>
                </tr>`,
    )
    .join("");

  const lessonArcHtml = blueprint.lessonArc
    .map(
      (s) => `
              <article class="lesson-card">
                <span>${esc(s.phase)}</span>
                <h4>${esc(s.title)}</h4>
                <dl>
                  <dt>Teacher move</dt><dd>${esc(s.teacher)}</dd>
                  <dt>Student work</dt><dd>${esc(s.student)}</dd>
                  <dt>Evidence</dt><dd>${esc(s.evidence)}</dd>
                </dl>
              </article>`,
    )
    .join("");

  const pathwayHtml = blueprint.pathways
    .map(
      (p) => `
              <article class="pathway-card">
                <span>${esc(p.trigger)}</span>
                <h4>${esc(p.name)}</h4>
                <p>${esc(p.moves)}</p>
              </article>`,
    )
    .join("");

  const rubricHtml = blueprint.rubric
    .map(
      (r) => `
              <tr>
                <th>${esc(r.level)}</th>
                <td>${esc(r.criteria)}</td>
              </tr>`,
    )
    .join("");

  const notebookHtml = blueprint.notebook
    .map((p) => `<li>${esc(p)}</li>`)
    .join("");

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
  const checklist = [
    t.objective,
    `I can choose a strategy for ${skillList(t).toLowerCase()}.`,
    "I can explain each step using topic vocabulary.",
    "I can check whether my answer is reasonable.",
  ]
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
              <div class="g-launch">
                <h4>Core question</h4>
                <p>How can I model, solve, and explain ${esc(lowerFirst(t.title))} so another student understands my thinking?</p>
                <h4>Concept spine</h4>
                <p>Understand the situation, represent it, choose the strategy, then prove the answer.</p>
                <h4>Evidence of mastery</h4>
                <p>Score 80% or higher, correct one missed item in Smart Review, and write a complete explanation using at least one vocabulary word.</p>
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
          <div class="mission-strip" aria-label="Topic mission">
            <article>
              <span>Mission</span>
              <h3>Rebuild ${esc(lowerFirst(t.title))}</h3>
              <p>Move from model to strategy to independent proof using ${esc(skillList(t).toLowerCase())}.</p>
            </article>
            <article>
              <span>Success looks like</span>
              <h3>Show, solve, explain</h3>
              <p>Students can represent the idea, solve accurately, and justify why the answer makes sense.</p>
            </article>
            <article>
              <span>Teacher evidence</span>
              <h3>${esc(t.standard.replace("Builds ", ""))}</h3>
              <p>${esc(guide.lookFor)}</p>
            </article>
          </div>
          <div class="tabs" role="tablist">
            <button class="tab" role="tab" data-tab="concept">🧭 Concept Lab</button>
            <button class="tab" role="tab" data-tab="lessons">🧱 Mini-Lessons</button>
            <button class="tab" role="tab" data-tab="path">🗺️ Lesson Path</button>
            ${workedHtml ? `<button class="tab" role="tab" data-tab="learn">📖 Learn</button>` : ""}
            <button class="tab" role="tab" data-tab="diagnostic">🩺 Diagnostic</button>
            <button class="tab" role="tab" data-tab="practice">✏️ Practice</button>
            <button class="tab" role="tab" data-tab="fluency">⚡ Fluency</button>
            <button class="tab" role="tab" data-tab="game">🎮 Game</button>
            <button class="tab" role="tab" data-tab="clinic">🛠️ Error Clinic</button>
            <button class="tab" role="tab" data-tab="task">🏗️ Performance Task</button>
            <button class="tab" role="tab" data-tab="vocab">🗂️ Vocabulary</button>
            <button class="tab" role="tab" data-tab="worksheet">🖨️ Printables</button>
            <button class="tab" role="tab" data-tab="quizzes">📋 Pre/Post Quiz</button>
            <button class="tab" role="tab" data-tab="supports">🧩 Supports</button>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="panel" id="panel-concept">
            <h3>Larger concept</h3>
            <p>Before students chase speed, they build the whole idea. Use this as the opening map for a small group, tutoring block, or independent recovery path.</p>
            <div class="publisher-note">
              <span>Concept spine</span>
              <p>${esc(architecture.headline)}</p>
            </div>
            <div class="concept-map">${progressionHtml}</div>
            <div class="publisher-note publisher-note-soft">
              <span>Teacher frame</span>
              <p>${esc(architecture.teacherFrame)}</p>
            </div>
            <h3 style="margin-top:22px">Essential question</h3>
            <p>${esc(blueprint.essentialQuestion)}</p>
            <div class="move-grid">${moves}</div>
            <div class="anchor-board">
              <div>
                <span class="anchor-label">Model it</span>
                <p>${esc(guide.model)}</p>
              </div>
              <div>
                <span class="anchor-label">Say it</span>
                <p>${esc(guide.discourse)}</p>
              </div>
              <div>
                <span class="anchor-label">Extend it</span>
                <p>${esc(guide.extension)}</p>
              </div>
            </div>
          </div>

          <div class="panel" id="panel-lessons">
            <h3>Mini-lessons inside the larger topic</h3>
            <p>Teach the big idea first, then open one mini-lesson at a time. Each mini-lesson has a narrow objective, one teacher move, one model, practice, an error to catch, and evidence to collect.</p>
            <div class="mini-lesson-list">${miniLessonHtml}</div>
            <div class="lesson-bridge">
              <h4>How the pieces connect</h4>
              <p>Students should not experience these as separate activities. Each mini-lesson adds one piece to the same concept spine: understand, represent, strategize, and prove.</p>
            </div>
          </div>

          <div class="panel" id="panel-path">
            <h3>Five-session lesson path</h3>
            <p>This is the teacher-ready pacing model for intervention blocks, tutoring, pull-out groups, or independent catch-up work.</p>
            <div class="lesson-path">${lessonArcHtml}</div>
            <h3 style="margin-top:24px">Placement pathways</h3>
            <p>Use the pre-quiz and diagnostic score to select the right route without lowering the grade-level expectation.</p>
            <div class="pathway-grid">${pathwayHtml}</div>
          </div>
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

          <div class="panel" id="panel-clinic">
            <h3>Error clinic</h3>
            <p>Use this as a quick conference script after a missed diagnostic, a worksheet error, or a low post-quiz score.</p>
            <div class="clinic-grid">
              <article class="clinic-card">
                <span>Likely misconception</span>
                <p>${esc(guide.misconception)}</p>
              </article>
              <article class="clinic-card">
                <span>Teacher move</span>
                <p>${esc(guide.lookFor)}</p>
              </article>
              <article class="clinic-card">
                <span>Student self-check</span>
                <p>Can I show the problem with a model, name the operation or relationship, and explain why my answer is reasonable?</p>
              </article>
            </div>
            <div class="conference-script">
              <h4>Two-minute conference</h4>
              <ol>
                <li>Ask the student to point to the exact step where the answer changed.</li>
                <li>Have the student restate the problem using one vocabulary word from this topic.</li>
                <li>Rebuild one simpler example together, then ask the student to solve a parallel problem alone.</li>
              </ol>
            </div>
          </div>

          <div class="panel" id="panel-task">
            <h3>Performance task</h3>
            <p>Students apply ${esc(lowerFirst(t.title))} in a short constructed-response task. This gives publishers, teachers, and families evidence beyond multiple choice.</p>
            <div class="task-card">
              <span>Scenario</span>
              <h4>${esc(t.title)} in the real world</h4>
              <p>Create a realistic situation where someone must use ${esc(skillList(t).toLowerCase())}. Solve it two ways: first with a model or diagram, then with numbers or symbols. Finish by explaining why the answer is reasonable.</p>
            </div>
            <div class="task-columns">
              <div>
                <h4>Student deliverables</h4>
                <ul>
                  <li>A labeled model, diagram, table, or number line.</li>
                  <li>A complete solution with units or labels.</li>
                  <li>A written explanation using at least one vocabulary word.</li>
                  <li>A revised answer after checking for the common misconception.</li>
                </ul>
              </div>
              <div>
                <h4>Notebook prompts</h4>
                <ol>${notebookHtml}</ol>
              </div>
            </div>
            <table class="rubric">
              <tbody>${rubricHtml}</tbody>
            </table>
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

            <div class="worksheet">
              <div class="ws-header">
                <h2>${t.icon} ${esc(t.title)} <span class="ws-variant">Student Notebook Page</span></h2>
                <div class="ws-name">Name: ____________________  Date: __________</div>
              </div>
              <div class="print-notebook">
                <h3>Essential question</h3>
                <p>${esc(blueprint.essentialQuestion)}</p>
                <h3>Success criteria</h3>
                <ul>${blueprint.successCriteria.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
                <h3>Reflection prompts</h3>
                <ol>${notebookHtml}</ol>
                <h3>Mini-lesson map</h3>
                <table class="rubric mini-print-map"><tbody>${miniLessonPrintRows}</tbody></table>
              </div>
            </div>

            <div class="worksheet">
              <div class="ws-header">
                <h2>${t.icon} ${esc(t.title)} <span class="ws-variant">Performance Task</span></h2>
                <div class="ws-name">Name: ____________________  Date: __________</div>
              </div>
              <p><strong>Task:</strong> Create and solve a realistic situation that uses ${esc(skillList(t).toLowerCase())}. Show a model, solve with numbers, and explain why the answer is reasonable.</p>
              <div class="blank-lines"></div>
              <table class="rubric print-rubric"><tbody>${rubricHtml}</tbody></table>
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
            <h3 style="margin-top:22px">Success criteria</h3>
            <ul class="criteria-list">${blueprint.successCriteria.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
            <h3 style="margin-top:22px">Language supports</h3>
            <div class="support-note">
              <p>${esc(guide.language)}</p>
              <p><strong>Talk frame:</strong> ${esc(guide.discourse)}</p>
              <p><strong>Talk-Write-Revise:</strong> say the strategy with a partner, write one complete explanation, then revise it with a vocabulary word.</p>
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
  const smallGroupRows = TOPICS.map((t) => {
    const g = topicGuide(t);
    return `
            <tr>
              <td><a class="sos-topic" href="/math/intervention/${t.slug}/" target="_blank" rel="noopener"><span>${t.icon}</span>${esc(t.title)}</a></td>
              <td>${esc(g.misconception)}</td>
              <td>${esc(g.model)}</td>
              <td>${esc(g.discourse)}</td>
            </tr>`;
  }).join("");
  const assessmentRows = TOPICS.map((t) => {
    const b = publisherBlueprint(t);
    return `
            <tr>
              <td><a class="sos-topic" href="/math/intervention/${t.slug}/" target="_blank" rel="noopener"><span>${t.icon}</span>${esc(t.title)}</a></td>
              <td>${esc(b.essentialQuestion)}</td>
              <td>Pre-quiz, diagnostic, Smart Review, exit ticket, performance task, post-quiz.</td>
              <td>${esc(b.rubric[2].criteria)}</td>
            </tr>`;
  }).join("");
  const miniLessonRows = TOPICS.map((t) => {
    const lessons = miniLessonBlueprint(t)
      .map((l) => `${l.number}. ${l.title}`)
      .join(" → ");
    const architecture = conceptArchitecture(t);
    return `
            <tr>
              <td><a class="sos-topic" href="/math/intervention/${t.slug}/" target="_blank" rel="noopener"><span>${t.icon}</span>${esc(t.title)}</a></td>
              <td>${esc(architecture.headline)}</td>
              <td>${esc(lessons)}</td>
              <td>Open the concept, teach one mini-lesson, collect evidence, then decide whether to reteach, practice, or extend.</td>
            </tr>`;
  }).join("");
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
            <span class="eyebrow">Teacher edition overview</span>
            <h2>Implementation guide for a publishable intervention block</h2>
            <p>This guide is built to support tutoring, pull-out intervention, stations, after-school programs, and independent recovery without changing the core routine from topic to topic.</p>
          </div>
          <div class="quality-grid">
            <article><b>Planning</b><h3>Before instruction</h3><p>Assign the pre-quiz, preview vocabulary, choose the pathway, and prepare the concrete model for the topic.</p></article>
            <article><b>Instruction</b><h3>During instruction</h3><p>Open the larger concept, teach the focused mini-lesson students need, then release students into Practice, Smart Review, fluency, and print work.</p></article>
            <article><b>Evidence</b><h3>After instruction</h3><p>Collect exit tickets, performance tasks, and post-quiz data to decide whether students need reteach, practice, or extension.</p></article>
            <article><b>Equity</b><h3>Access for all learners</h3><p>Use read-aloud, discourse frames, family letters, vocabulary routines, and Talk-Write-Revise supports every cycle.</p></article>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">How to run it</span>
            <h2>The four-part routine</h2>
            <p>Each unit is a self-paced station with an explicit concept opening and smaller mini-lessons inside the broader topic. Reserve 2–4 short sessions per unit.</p>
          </div>
          <div class="routine">
            <div class="rstep"><div class="rnum">Step 1</div><h4>Assign the Pre-Quiz</h4><p>Use the student Google Form to baseline. The teacher form auto-grades with the key.</p></div>
            <div class="rstep"><div class="rnum">Step 2</div><h4>Teach the mini-lesson</h4><p>Open the concept spine, pick the mini-lesson students need, and use the model before practice.</p></div>
            <div class="rstep"><div class="rnum">Step 3</div><h4>Send home</h4><p>Print the family letter and exit ticket; assign Level 1 or Level 2 supports as needed.</p></div>
            <div class="rstep"><div class="rnum">Step 4</div><h4>Post-Quiz &amp; review</h4><p>Re-assess with the post-quiz to measure growth and regroup.</p></div>
          </div>
          <div class="architecture-grid">
            <article class="arch-card">
              <span class="arch-num">A</span>
              <h3>Reteach group</h3>
              <p>Pre-quiz below 50% or diagnostic below 50%. Start with Concept Lab, worked examples, and a teacher-led model.</p>
            </article>
            <article class="arch-card">
              <span class="arch-num">B</span>
              <h3>Guided practice group</h3>
              <p>Scores from 50% to 79%. Assign Practice, Smart Review, Error Clinic, and Worksheet A before the post-quiz.</p>
            </article>
            <article class="arch-card">
              <span class="arch-num">C</span>
              <h3>Extension group</h3>
              <p>Scores 80%+. Use Fluency, Game, Worksheet B challenge, and the transfer prompt to keep growth moving.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Concept-to-mini-lesson map</span>
            <h2>Open the larger idea, then teach the smaller pieces</h2>
            <p>This map prevents the intervention from feeling disjointed: every student-facing activity should connect back to the same concept spine.</p>
          </div>
          <div class="sos-wrap">
            <table class="sos evidence-table">
              <thead><tr><th>Unit</th><th>Larger concept</th><th>Mini-lessons</th><th>Teacher use</th></tr></thead>
              <tbody>${miniLessonRows}
              </tbody>
            </table>
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
          <div class="section-head">
            <span class="eyebrow">Small-group playbook</span>
            <h2>What to reteach when students miss it</h2>
            <p>This table turns results into teacher action: identify the misconception, choose the model, and require a complete math-talk explanation.</p>
          </div>
          <div class="sos-wrap">
            <table class="sos evidence-table">
              <thead><tr><th>Unit</th><th>Likely gap</th><th>Best model</th><th>Discourse frame</th></tr></thead>
              <tbody>${smallGroupRows}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Assessment blueprint</span>
            <h2>Multiple measures for readiness, growth, and transfer</h2>
            <p>Every topic now includes a consistent evidence chain, so a teacher can defend placement decisions and document progress with more than one score.</p>
          </div>
          <div class="sos-wrap">
            <table class="sos evidence-table">
              <thead><tr><th>Unit</th><th>Essential question</th><th>Evidence chain</th><th>Reteach signal</th></tr></thead>
              <tbody>${assessmentRows}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Fidelity checklist</span>
            <h2>Run every topic with the same high-quality routine</h2>
            <p>Use this checklist during walkthroughs, tutoring, or lesson review to keep the intervention consistent and publisher-ready.</p>
          </div>
          <div class="fidelity-grid">
            <label><input type="checkbox" /> Students see the objective, essential question, vocabulary, and success criteria before practice.</label>
            <label><input type="checkbox" /> Teacher uses a concrete or visual model before symbolic practice.</label>
            <label><input type="checkbox" /> Students complete at least one self-checking practice set and one print/constructed response item.</label>
            <label><input type="checkbox" /> Error Clinic is used for the highest-leverage misconception.</label>
            <label><input type="checkbox" /> Students use a discourse frame or Talk-Write-Revise routine.</label>
            <label><input type="checkbox" /> Post-quiz, exit ticket, and performance task evidence are used to choose the next pathway.</label>
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
