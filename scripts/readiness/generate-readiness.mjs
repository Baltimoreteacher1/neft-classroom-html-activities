#!/usr/bin/env node
/**
 * Readiness pre-lesson generator.
 *
 * Reads one data file per lesson from scripts/readiness/data/<id>.json and emits
 * a tabbed "Get Ready" pre-lesson page at lessons/<id>/readiness/index.html.
 *
 * Tabs: Vocabulary (PREREQUISITE words — what students must already know to
 * follow the lesson, NOT the new words the lesson teaches) -> Skills Check
 * (routing diagnostic). Vocabulary content is layered in from
 * scripts/readiness/data/vocab/<baseId>.json (term + Level 1 definition + visual
 * + example) so every lesson opens by reviewing the words it depends on.
 *
 * Single source of truth: edit the JSON, re-run `npm run generate-readiness`.
 * Never hand-edit the generated index.html files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const VOCAB_DIR = path.join(DATA_DIR, "vocab");
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const LESSONS_DIR = path.join(REPO_ROOT, "lessons");

const baseId = (id) => id.replace(/-flagship$/, "");

function loadVocab(id) {
  const file = path.join(VOCAB_DIR, `${baseId(id)}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    const v = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(v) ? v : Array.isArray(v.vocab) ? v.vocab : [];
  } catch (err) {
    console.warn(`  ! bad vocab JSON for ${id}: ${err.message}`);
    return [];
  }
}

/* ---------- panel renderers ---------- */

function renderVocab(vocab) {
  if (!vocab.length) return "";
  const cards = vocab
    .map(
      (v) => `
        <div class="vcard">
          <div class="vicon" aria-hidden="true">${v.emoji || "📘"}</div>
          <div class="vbody">
            <h3 class="vterm">${v.term}</h3>
            <p class="vdef"><span class="lvl-tag">Level 1</span> ${v.def}</p>
            ${v.example ? `<p class="vex"><strong>Example:</strong> ${v.example}</p>` : ""}
          </div>
        </div>`,
    )
    .join("");
  return `
      <div class="tabpanel" id="panel-vocab" role="tabpanel" aria-labelledby="tab-vocab">
        <div class="sec">
          <div class="sec-head"><div class="badge b-vocab">A</div><div><div class="kicker">Words First · Review before the lesson</div><h2>Words to Know First</h2></div></div>
          <p>These are words you'll need to <strong>already know</strong> to follow this lesson — not the new words the lesson teaches. Review each one, its meaning, and the example so the new lesson makes sense from the start.</p>
          <div class="vgrid">${cards}
          </div>
        </div>
      </div>`;
}

function renderDiagnostic(data, lessonId) {
  const qs = (data.diagnostic || [])
    .map((d, i) => {
      const key = "d" + (i + 1);
      const opts = d.opts
        .map((o) => `<button class="opt" data-v="${o.v}">${o.t}</button>`)
        .join("\n            ");
      return `
        <div class="q">
          <p class="prompt">${i + 1}. ${d.q}</p>
          <div class="opts" data-mc="${key}" data-ans="${d.ans}">
            ${opts}
          </div>
        </div>`;
    })
    .join("");
  return `
      <div class="tabpanel" id="panel-check" role="tabpanel" aria-labelledby="tab-check">
        <div class="sec">
          <div class="sec-head"><div class="badge b-check">?</div><div><div class="kicker">Quick Check · 1 minute</div><h2>Are the basics warm?</h2></div></div>
          <p>These check the <strong>skills you'll need</strong> for this lesson — not the new lesson itself. Answer all ${(data.diagnostic || []).length}, then press <strong>Show my path</strong>. No grade — it just suggests where to start.</p>
          ${qs}
          <button class="btn" onclick="scorePath()">Show my path →</button>
          <div class="result r-l0" id="res-l0">🧱 <strong>Start at Level 0.</strong> A few basics need warming up — that's totally fine. When you open the lesson, choose <strong>Level 0 · Most support</strong>.</div>
          <div class="result r-l1" id="res-l1">🛠️ <strong>Start at Level 1.</strong> You've got the idea. Open the lesson at <strong>Level 1 · Support</strong>.</div>
          <div class="result r-l2" id="res-l2">🚀 <strong>Start at Level 2.</strong> Your basics are strong — jump straight in at <strong>Level 2 · Stretch</strong>.</div>
          <div class="result r-l1" id="res-warn">⚠️ Answer all the questions first, then press <strong>Show my path</strong>.</div>
        </div>

        <div class="handoff">
          <h2>🎉 You're ready!</h2>
          <p>Vocabulary previewed and basics checked. Time to start the lesson.</p>
          <a class="go" href="/lessons/${lessonId}/">Start Lesson ${lessonId} →</a>
        </div>
      </div>`;
}

// NOTE: "Learn It" and "Practice" panels were intentionally removed — Get Ready
// is prep only (vocab preview + prerequisite skills check). Teaching and
// practicing the new content belongs in the lesson itself, not the warm-up.

/* ---------- page shell ---------- */

function renderPage(data) {
  const id = data.lessonId;
  const vocab = loadVocab(id);
  const hasVocab = vocab.length > 0;
  const unit = id.split("-")[0];

  // Get Ready is prep ONLY — a vocabulary preview and a prerequisite skills
  // check. It deliberately does NOT teach or practice the new lesson content
  // (that is the lesson's job); the old "Learn It" and "Practice" tabs were
  // removed so this stays a short warm-up, not a second lesson.
  const tabs = [
    hasVocab ? { key: "vocab", label: "📖 Vocabulary" } : null,
    { key: "check", label: "🎯 Skills Check" },
  ].filter(Boolean);

  const firstTab = tabs[0].key;
  const tabBtns = tabs
    .map(
      (t) =>
        `<button class="tabbtn" id="tab-${t.key}" role="tab" aria-controls="panel-${t.key}" aria-selected="${t.key === firstTab}" onclick="showTab('${t.key}')">${t.label}</button>`,
    )
    .join("\n          ");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Get Ready · Lesson ${id}: ${data.title} — Neft Teacher</title>
    <meta name="description" content="Readiness warm-up for ${data.title} (${data.standard}): a quick vocabulary preview and a prerequisite skills check that points you to the right starting level before you open the lesson." />
    <style>
      :root {
        --navy: #0f2b3c; --blue: #1a6fb5; --blue-light: #e8f2fc;
        --teal: #0b6f65; --teal-light: #e4f5f3; --gold: #d4952a; --gold-light: #fdf3e0;
        --coral: #c45a3c; --coral-light: #fdeee9; --green: #2d874b; --green-light: #e6f4eb;
        --purple: #6b4ea0; --purple-light: #efe9f7;
        --ink: #1a2633; --muted: #525f6e; --line: #e2e7ec; --bg: #f7f9fb; --card: #fff;
        --radius: 16px; --shadow: 0 4px 18px rgba(15, 43, 60, 0.1);
        --font: "Segoe UI", system-ui, sans-serif;
      }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: var(--font); color: var(--ink); background: var(--bg); line-height: 1.55; }
      .wrap { max-width: 820px; margin: 0 auto; padding: 0 20px 60px; }
      .phero { background: linear-gradient(135deg, #0f2b3c 0%, #1a6fb5 100%); color: #fff; padding: 34px 24px 28px; text-align: center; }
      .phero .deco { font-size: 48px; }
      .phero h1 { font-size: clamp(22px, 4.5vw, 32px); margin: 8px 0 6px; letter-spacing: -0.02em; }
      .phero p { max-width: 600px; margin: 0 auto; color: rgba(255, 255, 255, 0.85); font-size: 16px; }
      .tags { margin-top: 14px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
      .tag { background: rgba(255, 255, 255, 0.14); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 50px; padding: 5px 14px; font-size: 13px; font-weight: 700; }
      .tag.gold { background: var(--gold); border-color: var(--gold); color: #2a1c00; }
      .breadcrumb { font-size: 13px; padding: 14px 0 0; color: var(--muted); }
      .breadcrumb a { color: var(--blue); text-decoration: none; font-weight: 600; }
      .why { background: var(--gold-light); border-left: 6px solid var(--gold); border-radius: 12px; padding: 16px 18px; margin: 22px 0; }
      .why strong { color: #7a5400; }
      /* Tabs */
      .tabbar { position: sticky; top: 0; z-index: 6; background: var(--bg); padding: 14px 0 10px; display: flex; gap: 8px; flex-wrap: wrap; }
      .tabbtn { border: 2px solid var(--line); background: #fff; border-radius: 50px; padding: 9px 16px; font-weight: 800; font-size: 14px; font-family: inherit; cursor: pointer; color: var(--ink); transition: 0.15s; }
      .tabbtn:hover { border-color: var(--blue); }
      .tabbtn[aria-selected="true"] { background: var(--navy); color: #fff; border-color: var(--navy); }
      .tabpanel { display: none; }
      .tabpanel.active { display: block; }
      .progress-wrap { padding: 4px 0 12px; }
      .progress-label { font-size: 13px; font-weight: 700; color: var(--muted); margin-bottom: 6px; }
      .progress-track { height: 12px; background: var(--line); border-radius: 50px; overflow: hidden; }
      .progress-fill { height: 100%; width: 0; background: linear-gradient(90deg, var(--teal), var(--green)); transition: width 0.4s; }
      .sec { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; margin: 14px 0 22px; box-shadow: var(--shadow); }
      .sec-head { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
      .badge { flex: 0 0 auto; width: 42px; height: 42px; border-radius: 12px; color: #fff; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; }
      .b-vocab { background: var(--purple); }
      .b-check { background: var(--navy); }
      .b-learn { background: var(--blue); }
      .b-try { background: var(--teal); }
      .b-exit { background: var(--coral); }
      .sec h2 { margin: 0; font-size: 20px; }
      .sec .kicker { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
      /* Vocabulary cards */
      .vgrid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 14px; }
      @media (min-width: 600px) { .vgrid { grid-template-columns: 1fr 1fr; } }
      .vcard { display: flex; gap: 14px; align-items: flex-start; border: 1px solid var(--line); border-radius: 14px; padding: 16px; background: var(--purple-light); }
      .vicon { font-size: 40px; line-height: 1; flex: 0 0 auto; }
      .vterm { margin: 0 0 4px; font-size: 18px; color: var(--navy); }
      .vdef { margin: 0 0 6px; font-size: 15px; }
      .vex { margin: 0; font-size: 14px; color: var(--muted); }
      .lvl-tag { display: inline-block; font-size: 11px; font-weight: 800; padding: 2px 9px; border-radius: 50px; background: var(--gold-light); color: #7a5400; margin-right: 4px; }
      .example { background: var(--blue-light); border-radius: 12px; padding: 16px 18px; margin: 14px 0; }
      .q { margin: 16px 0; padding-top: 14px; border-top: 1px dashed var(--line); }
      .q:first-of-type { border-top: none; padding-top: 0; }
      .q p.prompt { font-weight: 600; margin: 0 0 10px; }
      input[type="text"], input[type="number"] { padding: 10px 12px; border: 2px solid var(--line); border-radius: 10px; font-family: inherit; font-size: 15px; width: 160px; }
      input:focus { outline: none; border-color: var(--blue); }
      .opts { display: flex; flex-direction: column; gap: 8px; margin: 8px 0; }
      .opt { display: block; padding: 11px 14px; border: 2px solid var(--line); border-radius: 10px; cursor: pointer; background: #fff; font-size: 15px; text-align: left; font-family: inherit; transition: 0.15s; }
      .opt:hover { border-color: var(--blue); background: var(--blue-light); }
      .opt.sel { border-color: var(--blue); background: var(--blue-light); }
      .opt.right { border-color: var(--green); background: var(--green-light); }
      .opt.wrong { border-color: var(--coral); background: var(--coral-light); }
      .btn { background: var(--teal); color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-weight: 800; font-size: 14px; cursor: pointer; font-family: inherit; margin-top: 10px; }
      .btn:hover { filter: brightness(1.08); }
      .fb { margin-top: 8px; font-weight: 700; min-height: 20px; font-size: 14px; }
      .fb.ok { color: var(--green); }
      .fb.no { color: var(--coral); }
      details { margin-top: 10px; }
      summary { cursor: pointer; font-weight: 700; color: var(--blue); font-size: 14px; }
      details p { background: var(--gold-light); border-radius: 10px; padding: 12px 14px; margin: 8px 0 0; font-size: 14px; }
      .nav-links { display: flex; justify-content: space-between; margin-top: 24px; font-size: 14px; gap: 12px; flex-wrap: wrap; }
      .nav-links a { color: var(--blue); text-decoration: none; font-weight: 700; }
      .footer { text-align: center; color: var(--muted); font-size: 14px; margin-top: 36px; }
      .result { display: none; margin-top: 16px; border-radius: 12px; padding: 16px 18px; font-size: 15px; }
      .result.show { display: block; }
      .result.r-l0 { background: var(--coral-light); border-left: 6px solid var(--coral); }
      .result.r-l1 { background: var(--gold-light); border-left: 6px solid var(--gold); }
      .result.r-l2 { background: var(--green-light); border-left: 6px solid var(--green); }
      .pills { display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0 4px; }
      .pill { padding: 8px 16px; border: 2px solid var(--line); border-radius: 50px; background: #fff; cursor: pointer; font-weight: 800; font-size: 13px; font-family: inherit; }
      .pill.active { background: var(--navy); color: #fff; border-color: var(--navy); }
      .pill-note { font-size: 13px; color: var(--muted); margin: 0 0 4px; }
      .track { display: none; }
      .track.active { display: block; }
      .level-chip { display: inline-block; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 50px; margin-left: 8px; vertical-align: middle; }
      .lc-0 { background: var(--coral-light); color: #8a2f17; }
      .lc-1 { background: var(--gold-light); color: #7a5400; }
      .lc-2 { background: var(--green-light); color: #1f5e34; }
      .handoff { background: linear-gradient(135deg, #0e8a7d 0%, #2d874b 100%); color: #fff; border-radius: var(--radius); padding: 24px; text-align: center; margin: 24px 0; }
      .handoff h2 { margin: 0 0 8px; }
      .handoff .go { display: inline-block; background: #fff; color: var(--navy); font-weight: 800; padding: 12px 26px; border-radius: 50px; text-decoration: none; margin-top: 10px; }
      @media print {
        .tabbar, .btn, .breadcrumb, .pills, .handoff .go, .progress-wrap { display: none !important; }
        .tabpanel { display: block !important; }
        .track { display: block !important; }
        .sec { box-shadow: none; break-inside: avoid; }
        body { background: #fff; }
      }
      @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
    </style>
    <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css">
  <!-- nsr-injected:end -->
</head>
  <body>
    <header class="phero">
      <div class="deco">${data.emoji || "📚"}</div>
      <h1>Get Ready: ${data.title}</h1>
      <p>${data.why}</p>
      <div class="tags">
        <span class="tag gold">Readiness Pre-Lesson</span>
        <span class="tag">${data.unitName || "Unit " + unit}</span>
        <span class="tag">Builds toward ${data.standard}</span>
      </div>
    </header>

    <div class="wrap">
      <nav class="breadcrumb">
        <a href="/">Home</a> / <a href="/math/">Math</a> /
        <a href="/lessons/${id}/">Lesson ${id}</a> / Get Ready
      </nav>

      <div class="why">
        <strong>Why this matters for Lesson ${id}:</strong> ${data.why}
      </div>

      <div class="tabbar" role="tablist" aria-label="Readiness sections">
          ${tabBtns}
      </div>

      ${renderVocab(vocab)}
      ${renderDiagnostic(data, id)}

      <p class="footer">Neft Teacher · Readiness Pre-Lesson · Lesson ${id} · <span id="yr"></span></p>
    </div>

    <script>
      document.getElementById("yr").textContent = new Date().getFullYear();

      function showTab(key) {
        document.querySelectorAll(".tabpanel").forEach(function (p) {
          p.classList.toggle("active", p.id === "panel-" + key);
        });
        document.querySelectorAll(".tabbtn").forEach(function (b) {
          b.setAttribute("aria-selected", b.id === "tab-" + key ? "true" : "false");
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

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

      function scorePath() {
        var groups = document.querySelectorAll('#panel-check .opts');
        var answered = 0, score = 0, total = groups.length;
        groups.forEach(function (g) {
          if (g.dataset.sel) { answered++; if (g.dataset.sel === g.dataset.ans) score++; }
        });
        ["l0", "l1", "l2", "warn"].forEach(function (t) {
          document.getElementById("res-" + t).classList.remove("show");
        });
        if (answered < total) { document.getElementById("res-warn").classList.add("show"); return; }
        var ratio = score / total;
        var lvl = ratio >= 0.99 ? 2 : ratio >= 0.6 ? 1 : 0;
        document.getElementById("res-l" + lvl).classList.add("show");
      }

      showTab("${firstTab}");
    </script>
    <script src="/assets/nt-page-enhance.js" defer></script>
    <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <script src="/shared/save-resume/save-resume-engine.js" defer></script>
  <!-- nsr-injected:end -->
</body>
</html>
`;
}

/* ---------- run ---------- */

function main() {
  const onlyArg = process.argv[2];
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .filter((f) => !onlyArg || f === onlyArg + ".json");

  let written = 0,
    withVocab = 0;
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
    const id = data.lessonId;
    const outDir = path.join(LESSONS_DIR, id, "readiness");
    if (!fs.existsSync(outDir)) {
      console.warn(`  ! skip ${id}: no lesson dir ${path.relative(REPO_ROOT, outDir)}`);
      continue;
    }
    if (loadVocab(id).length) withVocab++;
    fs.writeFileSync(path.join(outDir, "index.html"), renderPage(data));
    written++;
  }
  console.log(`Readiness: wrote ${written} page(s); ${withVocab} with vocabulary.`);
}

main();
