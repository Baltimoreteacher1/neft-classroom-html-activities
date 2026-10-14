#!/usr/bin/env node
/**
 * Generate a Practice Studio for every core lesson in Units 2-9 (Unit 4 has its own hand-built set).
 *
 *   /math/practice-studio/<lesson>/index.html   one page per lesson, runtime = assets/studio-items.js
 *   /math/practice-studio/index.html            a finder grouped by unit
 *   curriculum/units/index.html                 an "HTML practice" link on each lesson row (additive splice)
 *
 * Every question, answer, hint and Spanish line comes from the lesson's own config.json — nothing is
 * composed here — so a studio can never teach different mathematics than its lesson. Item shapes the
 * studio cannot grade by itself (drag-sort, matching, manipulatives, free-text tables) are left in the
 * lesson, and each page says so. `--check` fails if any generated file is stale.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { listLessonDirs, loadLessonConfig, REPO_ROOT } from "../tools/lib/curriculum-source.mjs";

/** Units that get a generated studio. Unit 4's studios are hand-built; Unit 1 and 10 are not in scope. */
export const STUDIO_UNITS = [2, 3, 5, 6, 7, 8, 9];
export const LIMITS = { 1: 5, 2: 8, 3: 8, 4: 6, 5: 10 };
const MIN_ITEMS = 2;

const SECTION_META = [
  {
    name: "Get Ready",
    nameEs: "Prepárate",
    desc: "Warm-up review",
    h: "Warm up your thinking",
    p: "Quick questions that wake up what you already know for this lesson.",
    pEs: "Preguntas rápidas para activar lo que ya sabes de esta lección.",
  },
  {
    name: "Practice: Level 1",
    nameEs: "Práctica: Nivel 1",
    desc: "Guided practice",
    h: "Practice with support",
    p: "Start here. Use the hints whenever you need them; every wrong answer tells you why.",
    pEs: "Empieza aquí. Usa las pistas cuando las necesites; cada respuesta incorrecta te dice por qué.",
  },
  {
    name: "Practice: Level 2",
    nameEs: "Práctica: Nivel 2",
    desc: "Grade-level practice",
    h: "Practice at grade level",
    p: "Show the full idea. Tables, mistakes to find, and problems that need a few steps.",
    pEs: "Muestra la idea completa. Tablas, errores por encontrar y problemas de varios pasos.",
  },
  {
    name: "Stretch",
    nameEs: "Reto",
    desc: "Challenge problems",
    h: "Stretch your thinking",
    p: "Harder problems and explanations. Say why, not just what.",
    pEs: "Problemas más difíciles y explicaciones. Di por qué, no solo qué.",
  },
  {
    name: "Mastery Check",
    nameEs: "Prueba de dominio",
    desc: "Show what you know",
    h: "Mastery check",
    p: "Show what you know about today's lesson. Take your time, you can try again.",
    pEs: "Muestra lo que sabes de la lección de hoy. Tómate tu tiempo; puedes intentarlo otra vez.",
  },
];

const WORDS_OF_PICTURE =
  /\b(the (picture|diagram|graph|figure|image)|shown (above|below)|see (above|below)|in the (picture|diagram))\b/i;
const esArray = (/** @type {any} */ a, /** @type {number} */ n) =>
  Array.isArray(a) && a.length === n && a.every((x) => typeof x === "string") ? a : undefined;
const text = (/** @type {any} */ s) => (typeof s === "string" && s.trim() ? s.trim() : undefined);

/** One authored multiple-choice question → a studio item, or null with a reason. */
function mc(/** @type {any} */ q, /** @type {string} */ id) {
  const a = q.correctIndex ?? q.answer;
  if (!text(q.stem) || !Array.isArray(q.choices) || q.choices.length < 2)
    return [null, "malformed"];
  if (!Number.isInteger(a) || a < 0 || a >= q.choices.length)
    return [null, "answer index out of range"];
  if (new Set(q.choices.map((c) => String(c).trim().toLowerCase())).size !== q.choices.length)
    return [null, "duplicate choices"];
  if (q.diagram || WORDS_OF_PICTURE.test(q.stem)) return [null, "needs a figure"];
  const n = q.choices.length;
  return [
    {
      k: "mc",
      id,
      q: q.stem,
      qEs: text(q.stemEs),
      c: q.choices.map(String),
      cEs: esArray(q.choicesEs, n),
      a,
      x: text(q.explanation) || "",
      xEs: text(q.explanationEs),
      f:
        Array.isArray(q.choiceFeedback) && q.choiceFeedback.length === n
          ? q.choiceFeedback
          : undefined,
      fEs: esArray(q.choiceFeedbackEs, n),
      h: Array.isArray(q.hints) && q.hints.length ? q.hints : text(q.hint) ? [q.hint] : undefined,
      hEs: Array.isArray(q.hintsEs) ? q.hintsEs : undefined,
    },
    null,
  ];
}

function err(/** @type {any} */ q, /** @type {string} */ id) {
  const w = q.workedExample;
  if (
    !Array.isArray(w) ||
    w.length < 2 ||
    !Number.isInteger(q.errorStep) ||
    q.errorStep < 0 ||
    q.errorStep >= w.length
  )
    return [null, "errorStep out of range"];
  if (!text(q.correctWork)) return [null, "no correction"];
  return [
    {
      k: "err",
      id,
      t: q.title || "Find the mistake",
      tEs: text(q.titleEs),
      s: w.map((/** @type {any} */ s) => ({
        l: String(s.label ?? ""),
        w: String(s.work ?? ""),
        lEs: text(s.labelEs),
        wEs: text(s.workEs),
      })),
      e: q.errorStep,
      fix: q.correctWork,
      fixEs: text(q.correctWorkEs),
      x: text(q.explanation) || "",
      xEs: text(q.explanationEs),
      h: Array.isArray(q.hints) ? q.hints : undefined,
    },
    null,
  ];
}

function tbl(/** @type {any} */ q, /** @type {string} */ id) {
  if (
    !Array.isArray(q.headers) ||
    !Array.isArray(q.rows) ||
    !Array.isArray(q.editableCells) ||
    !q.editableCells.length
  )
    return [null, "free-text table"];
  const cells = [];
  for (const c of q.editableCells) {
    const row = q.rows[c.row];
    if (
      !row ||
      c.col < 0 ||
      c.col >= q.headers.length ||
      text(String(c.answer ?? "")) === undefined
    )
      return [null, "cell out of range"];
    if (String(row[c.col] ?? "").trim() !== "") return [null, "cell already filled"];
    cells.push({ r: c.row, c: c.col, a: String(c.answer) });
  }
  return [
    {
      k: "tbl",
      id,
      t: text(q.stem) || text(q.label) || "Fill in the table",
      tEs: text(q.stemEs) || text(q.labelEs),
      hd: q.headers.map(String),
      rows: q.rows.map((/** @type {any[]} */ r) => r.map(String)),
      cells,
      x: text(q.explanation) || "",
      xEs: text(q.explanationEs),
      h: Array.isArray(q.hints) ? q.hints : text(q.hint) ? [q.hint] : undefined,
    },
    null,
  ];
}

function wr(/** @type {any} */ q, /** @type {string} */ id) {
  const prompt = text(q.prompt) || text(q.stem);
  const model = text(q.explanation) || text(q.modelAnswer) || text(q.sampleAnswer);
  if (!prompt || !model) return [null, "no prompt or model answer"];
  return [
    {
      k: "wr",
      id,
      p: prompt,
      pEs: text(q.promptEs) || text(q.stemEs),
      fr: text(q.sentenceFrame),
      min: Number.isInteger(q.minLength) && q.minLength > 0 ? q.minLength : 40,
      kw: Array.isArray(q.keywords) ? q.keywords.map(String) : [],
      x: model,
      xEs: text(q.explanationEs),
      h: Array.isArray(q.hints) ? q.hints : text(q.hint) ? [q.hint] : undefined,
    },
    null,
  ];
}

const CONVERT = {
  "multiple-choice": mc,
  "error-analysis": err,
  "fill-table": tbl,
  "open-response": wr,
};

/** Convert authored items; report what the studio leaves in the lesson, and why. */
function convert(
  /** @type {any[]} */ list,
  /** @type {string} */ prefix,
  /** @type {Record<string, number>} */ left,
) {
  const out = [];
  (list || []).forEach((/** @type {any} */ q, /** @type {number} */ i) => {
    const kind = q.type || "multiple-choice";
    const fn = /** @type {any} */ (CONVERT)[kind];
    if (!fn) {
      left[kind] = (left[kind] || 0) + 1;
      return;
    }
    const [item, why] = fn(q, `${prefix}${i + 1}`);
    if (item) out.push(item);
    else left[`${kind} (${why})`] = (left[`${kind} (${why})`] || 0) + 1;
  });
  return out;
}

/** The five sections of one lesson's studio. */
export function buildSections(/** @type {any} */ cfg) {
  const left = /** @type {Record<string, number>} */ ({});
  const p = cfg.practice || {};
  const connect = Array.isArray(cfg.connect?.check)
    ? cfg.connect.check
    : cfg.connect?.check
      ? [cfg.connect.check]
      : [];
  const exit = cfg.reflect?.exitTicket ? [cfg.reflect.exitTicket] : [];
  const pools = [
    convert(cfg.warmup?.questions, "w", left),
    convert(p.approaching, "a", left),
    convert(p.onLevel, "o", left),
    convert(p.extending, "x", left),
    [...convert(connect, "c", left), ...convert(exit, "e", left)],
  ];
  // The optional pool tops up any section that would otherwise be thin; it never repeats an item.
  const spare = convert(p.optional, "p", left);
  for (const idx of [1, 2, 3])
    while (pools[idx].length < 3 && spare.length) pools[idx].push(spare.shift());
  const sections = pools.map((items, i) => ({
    ...SECTION_META[i],
    items: items.slice(0, LIMITS[/** @type {1} */ (i + 1)]),
  }));
  return { sections, left };
}

const esc = (/** @type {any} */ s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
  );
const json = (/** @type {any} */ o) =>
  JSON.stringify(o)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231B2C3F'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='34' fill='%23F0BD4F'%3E%E2%98%85%3C/text%3E%3C/svg%3E";

function printList(/** @type {any[]} */ items) {
  return `<ol class="print-only">${items.map((/** @type {any} */ it) => `<li>${esc(it.q || it.t || it.p)}${it.c ? `<ul>${it.c.map((/** @type {string} */ c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}</li>`).join("")}</ol>`;
}

export function pageFor(
  /** @type {string} */ id,
  /** @type {any} */ cfg,
  /** @type {{sections: any[], left: Record<string, number>}} */ built,
) {
  const unit = id.split("-")[0];
  const standard = cfg.standard || "";
  const title = cfg.title || `Lesson ${id}`;
  const sections = built.sections;
  const total = sections.reduce((a, s) => a + s.items.length, 0);
  const leftCount = Object.values(built.left).reduce((a, b) => a + b, 0);
  const data = {
    lesson: id,
    storageKey: `neft_studio_${id}_v1`,
    glyphs: ["★", "✓", "+", "="],
    sections,
  };
  const tabs = sections
    .map(
      (
        s,
        i,
      ) => `      <button type="button" class="tab-btn" role="tab" id="tab-${i + 1}" aria-selected="${i === 0}" aria-controls="panel-${i + 1}" tabindex="${i === 0 ? 0 : -1}" data-tab="${i + 1}">
        <span class="tab-badge" id="badge-${i + 1}">${i + 1}</span>
        <span class="tab-text"><span class="tab-name">${esc(s.name)}</span><span class="tab-desc">${esc(s.desc)} (${s.items.length})</span></span>
      </button>`,
    )
    .join("\n");
  const panels = sections
    .map(
      (
        s,
        i,
      ) => `    <section id="panel-${i + 1}" class="tab-panel${i === 0 ? " active" : ""}" role="tabpanel" aria-labelledby="tab-${i + 1}">
      <div class="topic-strip"><div><h2>${i + 1}. ${esc(s.h)}</h2><p>${esc(s.p)}</p><p class="es-text" lang="es">${esc(s.pEs)}</p></div></div>
      <div class="stepper-bar"><div class="dots-row" id="dots-${i + 1}" role="group" aria-label="${esc(s.name)} problems"></div></div>
      <div class="stage-card" id="stage-${i + 1}"></div>
      ${printList(s.items)}
      ${i === 4 && leftCount ? `<p class="more-in-lesson">More practice, games and tools for this lesson are in <a href="/lessons/${id}/">the full interactive lesson</a>.</p>` : ""}
    </section>`,
    )
    .join("\n\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · Interactive Practice Studio (Grade 6)</title>
  <meta name="description" content="${esc(`Interactive Grade 6 practice for lesson ${id}: ${cfg.contentObjective || title}`)}">
  <link rel="icon" href="${FAVICON}">
  <link rel="stylesheet" href="/assets/u4-studio.css">
  <script src="/assets/u4-studio.js"></script>
  <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css?v=20260714-v2">
  <!-- nsr-injected:end -->
</head>
<body>
  <header class="app-header">
    <div class="header-wrap">
      <div class="brand">
        <div class="brand-icon" aria-hidden="true">${esc(cfg.themeEmoji || "★")}</div>
        <div>
          <h1 class="brand-title">${esc(title)}</h1>
          <div class="brand-sub">Grade 6 Math · Unit ${esc(unit)} Interactive Practice Studio${standard ? ` (${esc(standard)})` : ""} · Lesson ${esc(id)}</div>
        </div>
      </div>
      <div class="header-actions">
        <div class="score-pill" aria-live="polite"><span>Progress: <span id="header-progress-count">0 / ${total}</span></span></div>
        <button type="button" class="top-btn" id="toggle-es-btn" aria-pressed="false">🌐 Español</button>
        <button type="button" class="top-btn" id="print-btn">🖨️ Print</button>
        <button type="button" class="top-btn" id="reset-all-btn" title="Clear saved progress and start fresh">↺ Reset</button>
      </div>
    </div>
  </header>

  <nav class="tab-bar" aria-label="Practice sections">
    <div class="tab-list" role="tablist">
${tabs}
    </div>
  </nav>

  <div id="sr-live" class="sr-only" aria-live="polite"></div>

  <main class="main-container">
    <div id="complete-banner" class="complete-banner" role="status" hidden>🎉 You finished every section of ${esc(title)}!</div>

${panels}
  </main>

  <footer class="app-footer">
    <div class="footer-wrap">
      <span><strong>Grade 6 Mathematics · Lesson ${esc(id)}: ${esc(title)}</strong>${standard ? ` (Standard ${esc(standard)})` : ""}</span>
      <span>Interactive Practice Studio · Progress saves on this device · <a href="/lessons/${id}/">Open the full lesson</a></span>
    </div>
  </footer>

  <script type="application/json" id="studio-data">${json(data)}</script>
  <script src="/assets/studio-items.js"></script>
<!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <script src="/shared/save-resume/save-resume-engine.js?v=20260714-v2" defer></script>
  <!-- nsr-injected:end -->
</body>
</html>
`;
}

function indexPage(/** @type {Array<{id: string, title: string, total: number}>} */ entries) {
  const byUnit = /** @type {Record<string, typeof entries>} */ ({});
  for (const e of entries) (byUnit[e.id.split("-")[0]] ||= []).push(e);
  const groups = Object.keys(byUnit)
    .map(Number)
    .sort((a, b) => a - b)
    .map(
      (u) =>
        `    <section class="stage-card"><h2>Unit ${u}</h2><ul class="studio-list">${byUnit[u].map((e) => `<li><a href="/math/practice-studio/${e.id}/">Lesson ${e.id.replace("-", ".")} · ${esc(e.title)}</a> <span class="item-sub">${e.total} problems</span></li>`).join("")}</ul></section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Interactive Practice Studios · Grade 6 Math</title>
  <meta name="description" content="Interactive practice for every Grade 6 lesson in Units 2 to 9: warm-up, two practice levels, a stretch, and a mastery check.">
  <link rel="icon" href="${FAVICON}">
  <link rel="stylesheet" href="/assets/u4-studio.css">
  <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css?v=20260714-v2">
  <!-- nsr-injected:end -->
</head>
<body>
  <header class="app-header"><div class="header-wrap"><div class="brand"><div class="brand-icon" aria-hidden="true">★</div><div><h1 class="brand-title">Interactive Practice Studios</h1><div class="brand-sub">Grade 6 Math · pick your lesson</div></div></div></div></header>
  <main class="main-container">
    <p>Each studio has five parts: a warm-up, two practice levels, a stretch, and a mastery check. Unit 4 studios are in <a href="/curriculum/units/">the unit browser</a>.</p>
${groups}
  </main>
<!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <script src="/shared/save-resume/save-resume-engine.js?v=20260714-v2" defer></script>
  <!-- nsr-injected:end -->
</body>
</html>
`;
}

const HUB = join(REPO_ROOT, "curriculum/units/index.html");
const MARK = /\s*<!-- practice-studio:[\w-]+ -->[\s\S]*?<!-- \/practice-studio -->/g;

/** Every file this generator owns, as path → content. */
export function outputs() {
  const ids = listLessonDirs({ filter: /^\d+-\d+$/ })
    .filter((id) => STUDIO_UNITS.includes(Number(id.split("-")[0])))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const files = new Map();
  const entries = [];
  const report = [];
  for (const id of ids) {
    const cfg = loadLessonConfig(id);
    const built = buildSections(cfg);
    const total = built.sections.reduce((a, s) => a + s.items.length, 0);
    for (const s of built.sections)
      if (s.items.length < MIN_ITEMS)
        throw new Error(
          `${id}: section "${s.name}" has ${s.items.length} supported items (need ${MIN_ITEMS})`,
        );
    files.set(`math/practice-studio/${id}/index.html`, pageFor(id, cfg, built));
    entries.push({ id, title: cfg.title || id, total });
    report.push({ id, total, left: built.left });
  }
  files.set("math/practice-studio/index.html", indexPage(entries));
  let hub = readFileSync(HUB, "utf8").replace(MARK, "");
  for (const { id } of entries) {
    const pattern = new RegExp(`(<a\\b[^>]*href="/lessons/${id}/"[^>]*>[\\s\\S]*?</a\\s*>)`);
    if (!pattern.test(hub)) throw new Error(`Missing curriculum lesson anchor: ${id}`);
    hub = hub.replace(
      pattern,
      `$1\n                <!-- practice-studio:${id} --><a class="res" href="/math/practice-studio/${id}/">HTML practice</a><!-- /practice-studio -->`,
    );
  }
  files.set("curriculum/units/index.html", hub);
  return { files, report };
}

function main() {
  const check = process.argv.includes("--check");
  const { files, report } = outputs();
  let stale = 0;
  for (const [rel, content] of files) {
    const path = join(REPO_ROOT, rel);
    const current = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (check) {
      if (current !== content) {
        console.error(`Stale: ${rel}`);
        stale++;
      }
    } else if (current !== content) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
    }
  }
  const items = report.reduce((a, r) => a + r.total, 0);
  const left = report.reduce((a, r) => a + Object.values(r.left).reduce((x, y) => x + y, 0), 0);
  if (check) {
    if (stale) {
      console.error("Run: node scripts/generate-practice-studios.mjs");
      process.exitCode = 1;
    } else console.log(`Practice studios are current: ${report.length} lessons, ${items} items.`);
  } else
    console.log(
      `Generated ${report.length} practice studios with ${items} items; ${left} authored items stay in their lessons (ungradable here).`,
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
