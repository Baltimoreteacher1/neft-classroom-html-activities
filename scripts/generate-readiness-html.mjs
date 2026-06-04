// Generates per-lesson READINESS pre-lesson pages (index.html) from JSON data.
// Output: lessons/<id>/readiness/index.html
//
// Data files live in scripts/readiness/data/<id>.json. One per lesson.
//
// JSON schema (see scripts/readiness/data/1-2.json for a full example):
// {
//   "lessonId": "1-2",
//   "title": "Greatest Common Factor",
//   "standard": "6.NS.4",
//   "emoji": "🚀",
//   "unitName": "Unit 1 · Lesson 2",
//   "why": "Plain-text sentence (may contain <strong>/<em>).",
//   "skills": ["Multiplication facts", "Listing factors", ...],
//   "diagnostic": [            // exactly 3 multiple-choice items; scoring routes tier
//     { "q": "What is <strong>6 × 7</strong>?", "ans": "b",
//       "opts": [ {"v":"a","t":"36"}, {"v":"b","t":"42"}, {"v":"c","t":"48"}, {"v":"d","t":"13"} ] }
//   ],
//   "learn": { "heading": "What is a factor?",
//              "intro": "<p>…</p> teaching text (HTML allowed)",
//              "examples": ["<strong>Factors of 12:</strong> …", "…"] },
//   "tiers": [                 // exactly 3: level 0,1,2
//     { "level": 0, "intro": "List factors one step at a time.",
//       "items": [ {"type":"num","q":"1 × ___ = 6","ans":6,"hint":"1 × 6 = 6."},
//                  {"type":"mc","q":"…","ans":"b","opts":[...],"hint":"…"} ] }
//   ],
//   "exit": [ {"type":"mc"|"num", "q":"…","ans":...,"opts"?:[...],"hint":"…"} ]   // ~2 items
// }
//
// Run: node scripts/generate-readiness-html.mjs            (all data files)
//      node scripts/generate-readiness-html.mjs 1-2 3-4    (specific lessons)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(__dirname, "readiness", "data");

const STYLE = readFileSync(join(__dirname, "readiness", "style.css"), "utf8");

function esc(s) {
  return String(s ?? "")
    .replace(/&(?!#?\w+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
// For fields that intentionally contain inline HTML (why, learn, prompts).
function html(s) {
  return String(s ?? "");
}

function renderOpts(mcKey, opts) {
  return opts
    .map((o) => `<button class="opt" data-v="${esc(o.v)}">${html(o.t)}</button>`)
    .join("\n            ");
}

function renderItem(item, idPrefix, idx) {
  const id = `${idPrefix}${idx}`;
  if (item.type === "mc") {
    return `<div class="q">
          <p class="prompt">${html(item.q)}</p>
          <div class="opts" data-mc="${id}" data-ans="${esc(item.ans)}">
            ${renderOpts(id, item.opts)}
          </div>
          <button class="btn" onclick="checkMC('${id}')">Check</button>
          <div class="fb" id="fb-${id}"></div>
          ${item.hint ? `<details><summary>Hint</summary><p>${html(item.hint)}</p></details>` : ""}
        </div>`;
  }
  // numeric
  return `<div class="q">
          <p class="prompt">${html(item.q)}</p>
          <input type="number" id="${id}" placeholder="?" />
          <button class="btn" onclick="checkNum('${id}', ${Number(item.ans)})">Check</button>
          <div class="fb" id="fb-${id}"></div>
          ${item.hint ? `<details><summary>Hint</summary><p>${html(item.hint)}</p></details>` : ""}
        </div>`;
}

function renderDiagnostic(diag) {
  return diag
    .map(
      (d, i) => `<div class="q">
          <p class="prompt">${i + 1}. ${html(d.q)}</p>
          <div class="opts" data-mc="d${i + 1}" data-ans="${esc(d.ans)}">
            ${renderOpts(`d${i + 1}`, d.opts)}
          </div>
        </div>`,
    )
    .join("\n\n        ");
}

function tierLabel(level) {
  return [
    "🧱 Level 0 · Most support",
    "🛠️ Level 1 · Support",
    "🚀 Level 2 · Stretch",
  ][level];
}
function tierChip(level) {
  return [
    `<span class="level-chip lc-0">Level 0</span>`,
    `<span class="level-chip lc-1">Level 1</span>`,
    `<span class="level-chip lc-2">Level 2</span>`,
  ][level];
}

function buildHtml(d) {
  const id = d.lessonId;
  const emoji = d.emoji || "🚀";
  const unitName = d.unitName || `Lesson ${id}`;
  const tiers = [...d.tiers].sort((a, b) => a.level - b.level);

  const tracks = tiers
    .map(
      (t) => `<div class="track" id="track-${t.level}">
          <p>${tierChip(t.level)} ${html(t.intro)}</p>
          ${t.items.map((it, i) => renderItem(it, `t${t.level}`, i)).join("\n          ")}
        </div>`,
    )
    .join("\n\n        ");

  const learnExamples = (d.learn.examples || [])
    .map((e) => `<div class="example">${html(e)}</div>`)
    .join("\n        ");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Get Ready · Lesson ${esc(id)}: ${esc(d.title)} — Neft Teacher</title>
    <meta name="description" content="Readiness pre-lesson for ${esc(d.title)} (${esc(d.standard)}): a quick check that routes you to the right level, then targeted practice so you walk into the lesson ready." />
    <style>
${STYLE}
    </style>
  </head>
  <body>
    <header class="phero">
      <div class="deco">${emoji}</div>
      <h1>Get Ready: ${esc(d.title)}</h1>
      <p>${html(d.why)}</p>
      <div class="tags">
        <span class="tag gold">Readiness Pre-Lesson</span>
        <span class="tag">${esc(unitName)}</span>
        <span class="tag">Builds toward ${esc(d.standard)}</span>
      </div>
    </header>

    <div class="wrap">
      <nav class="breadcrumb">
        <a href="/">Home</a> / <a href="/math/">Math</a> /
        <a href="/lessons/${esc(id)}/">Lesson ${esc(id)}</a> / Get Ready
      </nav>

      <div class="progress-wrap">
        <div class="progress-label">Readiness progress: <span id="pct">0</span>%</div>
        <div class="progress-track"><div class="progress-fill" id="pfill"></div></div>
      </div>

      <div class="why">
        <strong>Why this matters for Lesson ${esc(id)}:</strong> ${html(d.why)}
      </div>

      <!-- DIAGNOSTIC -->
      <section class="sec">
        <div class="sec-head"><div class="badge b-check">?</div><div><div class="kicker">Quick Check · 1 minute</div><h2>Where should you start?</h2></div></div>
        <p>Answer these 3, then press <strong>Show my path</strong>. No grade — this just points you to the right level.</p>

        ${renderDiagnostic(d.diagnostic)}

        <button class="btn" onclick="scorePath()">Show my path →</button>
        <div class="result r-l0" id="res-l0">🧱 <strong>Start at Level 0.</strong> We'll build this from the ground up with small steps. That's totally fine — take your time below.</div>
        <div class="result r-l1" id="res-l1">🛠️ <strong>Start at Level 1.</strong> You've got the idea — a little guided practice and you'll be ready.</div>
        <div class="result r-l2" id="res-l2">🚀 <strong>Start at Level 2.</strong> Your basics are strong! Do the quick warm-up and head into the lesson.</div>
        <div class="result r-l1" id="res-warn">⚠️ Answer all 3 questions first, then press <strong>Show my path</strong>.</div>
      </section>

      <!-- LEARN IT -->
      <section class="sec">
        <div class="sec-head"><div class="badge b-learn">1</div><div><div class="kicker">Learn It</div><h2>${esc(d.learn.heading)}</h2></div></div>
        ${html(d.learn.intro)}
        ${learnExamples}
      </section>

      <!-- TIER TRACKS -->
      <section class="sec">
        <div class="sec-head"><div class="badge b-try">2</div><div><div class="kicker">Practice · Your Level</div><h2>Try It</h2></div></div>
        <p class="pill-note">Your quick check picks one for you, but you can switch any time:</p>
        <div class="pills" id="pills">
          <button class="pill" data-lvl="0" onclick="setTrack(0)">${tierLabel(0)}</button>
          <button class="pill" data-lvl="1" onclick="setTrack(1)">${tierLabel(1)}</button>
          <button class="pill" data-lvl="2" onclick="setTrack(2)">${tierLabel(2)}</button>
        </div>

        ${tracks}
      </section>

      <!-- EXIT TICKET -->
      <section class="sec">
        <div class="sec-head"><div class="badge b-exit">★</div><div><div class="kicker">Exit Ticket</div><h2>Show You're Ready</h2></div></div>
        ${d.exit.map((it, i) => renderItem(it, "x", i + 1)).join("\n        ")}
      </section>

      <div class="handoff">
        <h2>🎉 You're warmed up!</h2>
        <p>You've practiced exactly what Lesson ${esc(id)} uses. Time to dive in.</p>
        <a class="go" href="/lessons/${esc(id)}/">Start Lesson ${esc(id)} →</a>
      </div>

      <div style="text-align:center;">
        <button class="btn" style="background:var(--navy);padding:12px 24px;" onclick="window.print()">🖨️ Print this readiness page</button>
      </div>

      <div class="nav-links">
        <a href="/lessons/${esc(id)}/">← Lesson ${esc(id)}</a>
        <a href="/lessons/${esc(id)}/readiness/practice.docx" download>📄 Practice packet (Word) →</a>
      </div>

      <p class="footer">Neft Teacher · Readiness Pre-Lesson · Lesson ${esc(id)} · <span id="yr"></span></p>
    </div>

    <script>
      document.getElementById("yr").textContent = new Date().getFullYear();
      // progress counts unique graded items (largest track + exit)
      var done = {};
      var TOTAL_ITEMS = ${(() => {
        // count exit items + the largest single tier (student does one track)
        const maxTier = Math.max(...d.tiers.map((t) => t.items.length));
        return maxTier + d.exit.length;
      })()};

      document.querySelectorAll(".opts").forEach(function (group) {
        group.querySelectorAll(".opt").forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (group.dataset.locked) return;
            group.querySelectorAll(".opt").forEach(function (b) { b.classList.remove("sel"); });
            btn.classList.add("sel");
            group.dataset.sel = btn.dataset.v;
          });
        });
      });

      function checkMC(key) {
        var group = document.querySelector('[data-mc="' + key + '"]');
        var fb = document.getElementById("fb-" + key);
        if (!group.dataset.sel) { fb.textContent = "Pick an answer first."; fb.className = "fb no"; return; }
        var correct = group.dataset.sel === group.dataset.ans;
        group.querySelectorAll(".opt").forEach(function (b) {
          b.classList.remove("sel"); b.classList.remove("right"); b.classList.remove("wrong");
          if (b.dataset.v === group.dataset.ans) b.classList.add("right");
          else if (b.dataset.v === group.dataset.sel) b.classList.add("wrong");
        });
        if (correct) { fb.textContent = "✅ Correct!"; fb.className = "fb ok"; group.dataset.locked = "1"; mark(key); }
        else { fb.textContent = "❌ Not quite — check the hint and try the idea again."; fb.className = "fb no"; }
      }

      function checkNum(id, ans) {
        var v = parseFloat(document.getElementById(id).value);
        var fb = document.getElementById("fb-" + id);
        if (isNaN(v)) { fb.textContent = "Type a number first."; fb.className = "fb no"; return; }
        if (Math.abs(v - ans) < 1e-9) { fb.textContent = "✅ Correct!"; fb.className = "fb ok"; mark(id); }
        else { fb.textContent = "❌ Not yet — try again or open the hint."; fb.className = "fb no"; }
      }

      function mark(key) {
        if (done[key]) return;
        done[key] = true;
        var pct = Math.min(100, Math.round((Object.keys(done).length / TOTAL_ITEMS) * 100));
        document.getElementById("pfill").style.width = pct + "%";
        document.getElementById("pct").textContent = pct;
      }

      function scorePath() {
        var keys = ["d1", "d2", "d3"], answered = 0, score = 0;
        keys.forEach(function (k) {
          var g = document.querySelector('[data-mc="' + k + '"]');
          if (g && g.dataset.sel) { answered++; if (g.dataset.sel === g.dataset.ans) score++; }
        });
        ["l0", "l1", "l2", "warn"].forEach(function (t) {
          document.getElementById("res-" + t).classList.remove("show");
        });
        if (answered < 3) { document.getElementById("res-warn").classList.add("show"); return; }
        var lvl = score >= 3 ? 2 : score === 2 ? 1 : 0;
        document.getElementById("res-l" + lvl).classList.add("show");
        setTrack(lvl);
        document.getElementById("pills").scrollIntoView({ behavior: "smooth", block: "center" });
      }

      function setTrack(lvl) {
        for (var i = 0; i < 3; i++) {
          var el = document.getElementById("track-" + i);
          if (el) el.classList.toggle("active", i === lvl);
        }
        document.querySelectorAll("#pills .pill").forEach(function (p) {
          p.classList.toggle("active", Number(p.dataset.lvl) === lvl);
        });
      }

      setTrack(1);
    </script>
    <script src="/assets/nt-page-enhance.js" defer></script>
  </body>
</html>
`;
}

// ---------- run ----------
const args = process.argv.slice(2);
const files = args.length
  ? args.map((a) => `${a}.json`)
  : readdirSync(dataDir).filter((f) => f.endsWith(".json"));

let count = 0;
for (const f of files) {
  const path = join(dataDir, f);
  if (!existsSync(path)) {
    console.error(`Missing data file: ${f}`);
    continue;
  }
  const d = JSON.parse(readFileSync(path, "utf8"));
  const outDir = join(root, "lessons", d.lessonId, "readiness");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), buildHtml(d));
  count++;
}
console.log(`Generated ${count} readiness HTML page(s).`);
