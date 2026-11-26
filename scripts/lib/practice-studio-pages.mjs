// HTML templates for the Practice Studio v2 pages: a lesson's Practice page, its Challenge twin, and the finder.
// The runtime (assets/studio/*.js) draws the problems from the JSON this page ships; this file only lays out the shell.

import { interactiveVisualHost } from "@eduwonderlab/engine/core/interactive-visual.js";
import { FAVICON } from "./practice-studio-worlds.mjs";
import {
  WP_STEP_PANELS,
  wordProblemsCta,
  wordProblemsInline,
  wordProblemsInlineHead,
} from "./word-problems-page.mjs";

export const esc = (/** @type {any} */ s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
  );
export const json = (/** @type {any} */ o) =>
  JSON.stringify(o)
    .replace(/</g, "\\u003c")
    .split(String.fromCharCode(0x2028))
    .join("\\u2028")
    .split(String.fromCharCode(0x2029))
    .join("\\u2029");

export const NSR_HEAD = `  <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css?v=20260714-v2">
  <!-- nsr-injected:end -->`;
export const NSR_BODY = `<!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <script src="/shared/save-resume/save-resume-engine.js?v=20260714-v2" defer></script>
  <!-- nsr-injected:end -->`;

const STATIC_KINDS = new Set(["mc", "num", "err", "tbl", "wr", "sort", "match", "nline"]);
function printList(/** @type {any[]} */ items) {
  const rows = items
    .filter((it) => STATIC_KINDS.has(it.k))
    .map((it) => {
      const stem = it.q || it.t || it.p || "";
      const opts = Array.isArray(it.c)
        ? `<ul>${it.c.map((/** @type {string} */ c) => `<li>${esc(c)}</li>`).join("")}</ul>`
        : "";
      return `<li>${esc(stem)}${opts}</li>`;
    });
  const fresh = items.length - rows.length;
  return `<ol class="print-only">${rows.join("")}${fresh ? `<li><em>${fresh} fresh problem${fresh > 1 ? "s" : ""} with new numbers each time (interactive only).</em></li>` : ""}</ol>`;
}

/**
 * Sets body[data-theme] before first paint. Default is always "light" unless the student explicitly chose Dark.
 */
export function themeBoot(
  /** @type {string} */ unit,
  /** @type {string} */ id,
  _challenge = false,
) {
  const key = `ewl_u${unit}_l${String(id).split("-")[1]}_v2`;
  return `<script>(function(){try{var t=null;try{t=JSON.parse(localStorage.getItem("${key}")).theme}catch(e){}document.body.dataset.theme=t==="dark"?"dark":"light"}catch(e){}})()</script>`;
}

/**
 * The lesson's "I can…" target, first in the context row: English from the lesson config (contentObjective), Spanish authored
 * in the studio file (targetEs). Shared with scripts/inject-u4-lab-bench.mjs so the Unit 4 pages carry the same chip.
 */
export function targetChip(/** @type {string} */ en, /** @type {string} */ es) {
  if (!en || !es) return "";
  return `<p class="target-chip"><span class="target-icon" aria-hidden="true">🎯</span><span class="target-text"><span class="t-en">${esc(en)}</span><span class="t-es" lang="es">${esc(es)}</span></span></p>`;
}

const bi = (/** @type {string} */ en, /** @type {string} */ es) =>
  es
    ? `<span class="t-en">${esc(en)}</span><span class="t-es" lang="es">${esc(es)}</span>`
    : esc(en);

/** The Word bank chip: its size and the first terms, so a student can see what is inside before opening it. */
function wordBankSummary(/** @type {any[]} */ terms) {
  const n = terms.length;
  const first = (/** @type {string} */ k) =>
    terms
      .slice(0, 3)
      .map((g) => g[k] || g.t)
      .join(", ") + (n > 3 ? ", …" : "");
  return `${bi("Word bank", "Banco de palabras")} <span class="wb-count">${bi(`${n} ${n === 1 ? "word" : "words"}`, `${n} ${n === 1 ? "palabra" : "palabras"}`)}</span><span class="wb-preview">${bi(first("t"), first("tEs"))}</span>`;
}

/**
 * The Word bank: a closed <details> chip (size and first terms in the summary) that opens to every term with its plain
 * definition, in both languages. `terms` are { t, tEs, d, dEs }. Shared with scripts/inject-u4-lab-bench.mjs.
 */
export function glossaryBlock(/** @type {any[]} */ terms) {
  if (!terms.length) return "";
  const dl = terms
    .map(
      (g) =>
        `<dt>${esc(g.t)}<span class="es-text" lang="es">${esc(g.tEs)}</span></dt><dd>${esc(g.d)}<span class="es-text" lang="es">${esc(g.dEs)}</span></dd>`,
    )
    .join("");
  return `<details class="glossary"><summary>${wordBankSummary(terms)}</summary><dl>${dl}</dl></details>`;
}

/** The misconception names (EN + ES) and quick fixes for every trap a page's multiple-choice items name, in id order. */
function trapNames(/** @type {any[]} */ sections, /** @type {Record<string, any>} */ traps) {
  const used = new Set();
  for (const s of sections)
    for (const it of [...s.items, ...(s.pool || [])])
      for (const t of Array.isArray(it.tag) ? it.tag : []) if (t && traps[t]) used.add(t);
  return Object.fromEntries(
    [...used]
      .sort()
      .map((t) => [
        t,
        { n: traps[t].name, nEs: traps[t].nameEs, fix: traps[t].fix, fixEs: traps[t].fixEs },
      ]),
  );
}

function algebraicExpressionsModel() {
  return `<section class="expression-parts alg-expr-card" aria-labelledby="alg-title">
      <div class="parts-heading">
        <span class="parts-kicker">WORDS TO MATH SYMBOLS <span lang="es">· PALABRAS A SÍMBOLOS</span></span>
        <h2 id="alg-title">Turn clue words into algebraic expressions</h2>
        <p id="alg-intro">Pick an operation to see its clue words. Watch for <strong>* order is reversed</strong> with <em>fewer than</em>, <em>less than</em>, and <em>subtracted from</em>.</p>
        <p id="alg-intro-es" class="t-es" lang="es">Elige una operación para ver sus palabras clave. Pon atención a <strong>* el orden se invierte</strong> con <em>fewer than</em>, <em>less than</em> y <em>subtracted from</em>.</p>
      </div>
      <div class="alg-clue-tabs" role="tablist" aria-label="Operation clue words">
        <button type="button" class="alg-op-tab is-active" data-op="+" aria-selected="true">+ <span class="t-en">Add</span><span class="t-es" lang="es">Sumar</span></button>
        <button type="button" class="alg-op-tab" data-op="-" aria-selected="false">− <span class="t-en">Subtract</span><span class="t-es" lang="es">Restar</span></button>
        <button type="button" class="alg-op-tab" data-op="*" aria-selected="false">× <span class="t-en">Multiply</span><span class="t-es" lang="es">Multiplicar</span></button>
        <button type="button" class="alg-op-tab" data-op="/" aria-selected="false">÷ <span class="t-en">Divide</span><span class="t-es" lang="es">Dividir</span></button>
      </div>
      <div class="alg-clue-panel" id="alg-clue-panel" aria-live="polite"></div>
      <div class="parts-interact alg-builder">
        <div class="alg-presets" id="alg-presets" role="group" aria-label="Try a phrase"></div>
        <div class="alg-stage-row">
          <div class="alg-phrase-box">
            <span class="alg-box-label"><span class="t-en">Words</span><span class="t-es" lang="es">Palabras</span></span>
            <strong id="alg-phrase-en">A number plus 9</strong>
            <span class="t-es alg-phrase-es" id="alg-phrase-es" lang="es">Un número más 9</span>
          </div>
          <span class="alg-arrow" aria-hidden="true">→</span>
          <div class="alg-expr-box">
            <span class="alg-box-label"><span class="t-en">Algebraic Expression</span><span class="t-es" lang="es">Expresión algebraica</span></span>
            <strong id="alg-expr-out">n + 9</strong>
          </div>
        </div>
        <label for="alg-n-slider"><span class="t-en">Test a value for n:</span><span class="t-es" lang="es">Prueba un valor para n:</span> <strong id="alg-n-val">4</strong></label>
        <input id="alg-n-slider" type="range" min="1" max="6" value="4">
        <div class="parts-total" id="alg-eval-out" role="status" aria-live="polite">4 + 9 = 13</div>
        <p class="parts-rule" id="alg-rule">A letter like <strong>n</strong> stands for &ldquo;a number.&rdquo; Pick the operation from the clue word, then check the order.</p>
        <p class="t-es parts-rule" id="alg-rule-es" lang="es">Una letra como <strong>n</strong> representa &ldquo;un número&rdquo;. Elige la operación según la palabra clave y revisa el orden.</p>
      </div>
    </section>`;
}

function partSwitcherBar(id, isPart2) {
  return `  <nav class="part-switcher-bar" aria-label="Lesson parts">
    <div class="part-switcher-inner">
      <a class="part-switch-btn${!isPart2 ? " is-active" : ""}" href="/math/practice-studio/${id}/"${!isPart2 ? ' aria-current="page"' : ""}>
        <span class="t-en">Part I</span><span class="t-es" lang="es">Parte I</span>
      </a>
      <a class="part-switch-btn${isPart2 ? " is-active" : ""}" href="/math/practice-studio/${id}/part-2/"${isPart2 ? ' aria-current="page"' : ""}>
        <span class="t-en">Part II: Algebraic Expressions</span><span class="t-es" lang="es">Parte II: Expresiones algebraicas</span>
      </a>
    </div>
  </nav>`;
}

function expressionPartsModel() {
  return `<section class="expression-parts" aria-labelledby="parts-title">
      <div class="parts-heading"><span class="parts-kicker">SEE THE IDEA <span lang="es">· MIRA LA IDEA</span></span><h2 id="parts-title">One expression, three parts</h2><p id="parts-intro">Each pouch has <strong>4 pencils</strong>. There are <strong>6 extra pencils</strong>. The number of pouches can change.</p><p id="parts-intro-es" class="t-es" lang="es">Cada bolsa tiene <strong>4 lápices</strong>. Hay <strong>6 lápices extra</strong>. El número de bolsas puede cambiar.</p></div>
      <div class="parts-layout">
        <div class="parts-equation" id="parts-equation" aria-label="4 times n plus 6">
          <span class="parts-token parts-coef"><span id="parts-coef">4</span><small>coefficient <span lang="es">· coeficiente</span></small></span><span class="parts-token parts-var"><span id="parts-var">n</span><small>variable <span lang="es">· variable</span></small></span><span class="parts-operator">+</span><span class="parts-token parts-constant"><span id="parts-constant">6</span><small>constant <span lang="es">· constante</span></small></span>
        </div>
        <div class="parts-legend" id="parts-legend"><p><strong>4n</strong> means <strong>4 pencils in each pouch × n pouches</strong>.</p><p class="t-es" lang="es"><strong>4n</strong> significa <strong>4 lápices en cada bolsa × n bolsas</strong>.</p><p><strong>6</strong> is added once. <strong>4n</strong> and <strong>6</strong> are the two <strong>terms</strong>.</p><p class="t-es" lang="es"><strong>6</strong> se suma una vez. <strong>4n</strong> y <strong>6</strong> son los dos <strong>términos</strong>.</p></div>
      </div>
      <div class="parts-interact"><label for="parts-count"><span id="parts-slider-label">Change the number of pouches:</span> <strong id="parts-count-value">2</strong><span id="parts-slider-label-es" class="t-es" lang="es">Cambia el número de bolsas</span></label><input id="parts-count" type="range" min="1" max="5" value="2"><div id="parts-pouches" class="parts-pouches" aria-hidden="true"></div><div class="parts-total" id="parts-total" role="status" aria-live="polite">4 × 2 + 6 = 14 pencils</div><p class="parts-rule" id="parts-rule">The <strong>variable</strong> changes. The <strong>coefficient</strong> and <strong>constant</strong> stay the same.</p><p class="t-es parts-rule" id="parts-rule-es" lang="es">La <strong>variable</strong> cambia. El <strong>coeficiente</strong> y la <strong>constante</strong> siguen iguales.</p></div>
    </section>`;
}

/**
 * @param {object} o
 * @param {string} o.id lesson id, e.g. "5-2"
 * @param {"practice"|"challenge"} o.mode
 * @param {any} o.cfg lesson config
 * @param {any} o.ld data/practice-studio/<id>.json
 * @param {any} o.world the world definition (with .id)
 * @param {any[]} o.sections the five sections for this mode
 * @param {{scripts: string[], styles: string[]}} o.assets URLs (already stamped) in load order
 * @param {Record<string, any>} [o.traps] data/practice-studio/misconceptions.json traps; the page carries the ones its items name
 * @param {{wb: any[], cog: any[], pic: Record<string, any>, frL: Record<string, any>}} [o.lang] the language layer (scripts/lib/practice-studio-language.mjs)
 * @param {any} [o.concept] source-backed lesson skill graph entry
 */
/**
 * The lesson's living scene (launch.conceptIntro.livingScene) as a studio
 * card: the same See it / Try it / Explain it film the Learn It and the family
 * page show, from the same config. Callers use it on Practice pages only (the
 * Challenge asks for transfer without the model). Open, collapsible, and
 * nothing waits on it; the page must also load LIVING_SCENE_SCRIPT.
 */
export const LIVING_SCENE_SCRIPT =
  '<script type="module" src="/assets/homework-lesson-models.js"></script>';
export function livingCardFor(/** @type {string} */ id, /** @type {any} */ cfg) {
  const living = cfg?.launch?.conceptIntro?.livingScene;
  if (living?.kind !== "living-scene") return "";
  const host = interactiveVisualHost(
    { ...living, lessonId: `studio-${id}` },
    {
      ariaLabel: "Interactive scene: see it, try it, explain it",
      fallback: "Turn on JavaScript to step through this interactive scene.",
    },
  );
  if (!host) return "";
  return `    <details class="stage-card living-card" open>
      <summary><strong>${bi("See it first", "Míralo primero")}</strong> · ${bi("an interactive model, about 3 minutes", "un modelo interactivo, unos 3 minutos")}</summary>
      <div data-living-host>${host}</div>
    </details>
`;
}

export function pageFor({
  id,
  mode,
  part2 = false,
  cfg,
  ld,
  world,
  sections,
  assets,
  resources = [],
  traps = {},
  pedagogy = undefined,
  lang = undefined,
  concept = undefined,
}) {
  const unit = id.split("-")[0];
  const standard = cfg.standard || "";
  const challenge = mode === "challenge";
  const isPart2 = !challenge && part2 && !!ld.focusPracticePart2;
  const hasPartSwitcher = !challenge && !!ld.focusPracticePart2;
  const title =
    (isPart2 && ld.focusPracticePart2?.title) ||
    (!challenge && ld.focusPractice?.title) ||
    cfg.title ||
    `Lesson ${id}`;
  const total = sections.reduce((a, s) => a + s.items.length, 0);
  const otherUrl = challenge
    ? `/math/practice-studio/${id}/`
    : `/math/practice-studio/${id}/challenge/`;
  const data = {
    v: 2,
    lesson: id,
    mode,
    storageKey: isPart2 ? `neft_studio_${id}_part2_v2` : `neft_studio_${id}_${mode}_v2`,
    otherUrl,
    bannerText: challenge
      ? `Boss cleared! You finished the Challenge for ${title}.`
      : `You finished every section of ${title}!`,
    bannerTextEs: challenge
      ? "¡Jefe derrotado! Terminaste el Reto de esta lección."
      : "¡Terminaste todas las secciones de esta lección!",
    world: { id: world.id, voice: world.voice },
    glyphs: ["★", "✓", "+", "="],
    ...(sections.some((s) => s.items.some((it) => it.k === "lab" || it.k === "mission"))
      ? { labV: assets.labV }
      : {}),
    sections,
    ...(concept
      ? {
          concept: {
            objective: concept.objective,
            standards: concept.standards,
            prerequisites: concept.prerequisiteChecks,
            representations: concept.representations,
            misconceptions: concept.misconceptionIds,
          },
        }
      : {}),
    traps: trapNames(sections, traps),
    ...(pedagogy ? { pedagogy } : {}),
    ...(lang ? { lang } : {}),
  };
  const story = challenge ? ld.challengeStory : ld.story;
  const storyEs = challenge ? ld.challengeStoryEs : ld.storyEs;
  const label = challenge ? "Challenge Studio" : "Interactive Practice Studio";
  const partsModel = !challenge && !isPart2 && ld.focusPractice?.model === "expression-parts";
  const algExprModel =
    !challenge && isPart2 && ld.focusPracticePart2?.model === "algebraic-expressions";
  const livingCard = !challenge && !isPart2 ? livingCardFor(id, cfg) : "";
  // Closed in the markup: assets/studio/clarity.js opens it on a student's first visit, and it is a small chip after that.
  const missionCard = `<details class="mission-card">
        <summary><span class="world-glyph" aria-hidden="true">${world.emoji}</span><span class="mission-title">${bi("Mission", "Misión")} · ${bi(world.name, world.nameEs)}${challenge ? ` · ${bi("night shift", "turno de noche")}` : ""}</span></summary>
        <div class="mission-body"><p class="mission-tag">${esc(world.tag)}<span class="es-text" lang="es">${esc(world.tagEs)}</span></p><p>${esc(story)}</p><p class="es-text" lang="es">${esc(storyEs)}</p></div>
    </details>`;
  const tabs = sections
    .map((s, i) => {
      const isOpt = !!s.optional;
      const optPrefix = isOpt ? `${bi("Optional", "Opcional")} · ` : "";
      return `      <button type="button" class="tab-btn${isOpt ? " tab-opt" : ""}" role="tab" id="tab-${i + 1}" aria-selected="${i === 0}" aria-controls="panel-${i + 1}" tabindex="${i === 0 ? 0 : -1}" data-tab="${i + 1}">
        <span class="tab-badge" id="badge-${i + 1}">${i + 1}</span>
        <span class="tab-text"><span class="tab-name">${bi(s.name, s.nameEs)}</span><span class="tab-desc">${optPrefix}${bi(s.desc, s.descEs)} (${s.items.length})</span></span>
      </button>`;
    })
    .join("\n");
  const panels = sections
    .map(
      (
        s,
        i,
      ) => `    <section id="panel-${i + 1}" class="tab-panel${i === 0 ? " active" : ""}" role="tabpanel" aria-labelledby="tab-${i + 1}">
      <div class="topic-strip"><div><p class="stage-eyebrow">${bi(`Stage ${i + 1} of ${sections.length}`, `Etapa ${i + 1} de ${sections.length}`)}${s.optional ? ` · ${bi("Optional", "Opcional")}` : ""}</p><h2>${bi(s.name, s.nameEs)}</h2><p class="stage-purpose">${esc(s.p)}</p><p class="es-text" lang="es">${esc(s.pEs)}</p></div>
        <div class="stepper-bar"><div class="dots-row" id="dots-${i + 1}" role="group" aria-label="${esc(s.name)} problems"></div></div></div>
      <div class="stage-card" id="stage-${i + 1}"></div>
      ${WP_STEP_PANELS.includes(i) ? wordProblemsInline(id, WP_STEP_PANELS.indexOf(i)) : ""}
      ${i === sections.length - 1 ? wordProblemsCta(id, challenge ? `/math/practice-studio/${id}/challenge/` : `/math/practice-studio/${id}/`) : ""}
      ${printList(s.items)}
    </section>`,
    )
    .join("\n\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · ${label} (Grade 6)</title>
  <meta name="description" content="${esc(`${challenge ? "Challenge" : "Interactive"} Grade 6 practice for lesson ${id}: ${cfg.contentObjective || title}`)}">
  <meta name="theme-color" content="#1B2C3F">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" href="${FAVICON(world.emoji)}">
${assets.styles.map((u) => `  <link rel="stylesheet" href="${u}">`).join("\n")}
${partsModel || algExprModel ? '  <link rel="stylesheet" href="/assets/studio/expression-parts.css">' : ""}
${algExprModel ? '  <link rel="stylesheet" href="/assets/studio/algebraic-expressions.css">' : ""}
${NSR_HEAD}
${assets.scripts.map((u) => `  <script src="${u}" defer></script>`).join("\n")}
${wordProblemsInlineHead()}
${partsModel ? '  <script src="/assets/studio/expression-parts.js" defer></script>' : ""}
${algExprModel ? '  <script src="/assets/studio/algebraic-expressions.js" defer></script>' : ""}${livingCard ? `\n  ${LIVING_SCENE_SCRIPT}` : ""}
</head>
<body data-world="${esc(world.id)}" data-mode="${mode}" data-theme="light" data-chrome="${esc(world.chrome)}" data-features="insight readaloud passport calibration share">
  ${themeBoot(unit, id, challenge)}
  <header class="app-header">
    <div class="header-wrap">
      <div class="brand">
        <div class="brand-icon" aria-hidden="true">${world.emoji}</div>
        <div>
          <h1 class="brand-title">${esc(title)}${challenge ? ' <span class="v2-badge">Challenge</span>' : ""}</h1>
          <div class="brand-sub">Grade 6 Math · Unit ${esc(unit)} ${label}${standard ? ` (${esc(standard)})` : ""} · Lesson ${esc(id)}</div>
        </div>
      </div>
      <div class="header-actions">
        <div class="score-pill" aria-live="polite"><span>Progress: <span id="header-progress-count">0 / ${total}</span></span></div>
        <div id="hud-pill" role="status"></div>
        <button type="button" class="top-btn" id="toggle-es-btn" aria-pressed="false">🌐 Español</button>
        <button type="button" class="top-btn" id="print-btn">🖨️ Print</button>
        <button type="button" class="top-btn" id="reset-all-btn" title="Clear saved progress and start fresh">↺ Reset</button>
      </div>
    </div>
  </header>
${hasPartSwitcher ? `\n${partSwitcherBar(id, isPart2)}\n` : ""}
  <nav class="tab-bar" aria-label="${challenge ? "Challenge" : "Practice"} sections">
    <div class="tab-list" role="tablist">
${tabs}
    </div>
  </nav>

  <div id="sr-live" class="sr-only" aria-live="polite"></div>

  <main class="main-container">
    <div id="complete-banner" class="complete-banner" role="status" hidden></div>

    <div class="studio-context">
      ${targetChip(isPart2 ? ld.focusPracticePart2.target : partsModel ? ld.focusPractice.target : /^I can\b/.test(cfg.contentObjective || "") ? cfg.contentObjective : "", isPart2 ? ld.focusPracticePart2.targetEs : partsModel ? ld.focusPractice.targetEs : ld.targetEs)}
      ${missionCard}
${ld.glossary?.length ? `      ${glossaryBlock(ld.glossary)}\n` : ""}    </div>

${partsModel ? `    ${expressionPartsModel()}` : ""}${algExprModel ? `    ${algebraicExpressionsModel()}` : ""}
${livingCard}
${panels}
  </main>

  <footer class="app-footer">
    <div class="footer-wrap">
      <span><strong>Grade 6 Mathematics · Lesson ${esc(id)}: ${esc(title)}</strong>${standard ? ` (Standard ${esc(standard)})` : ""}</span>
      <span>${label} · Progress saves on this device · <a href="/lessons/${id}/">Open the full lesson</a> · <a href="${otherUrl}">${challenge ? "Practice version" : "Challenge version"}</a></span>
      ${
        resources.length
          ? `<nav class="footer-more" aria-label="More for this lesson"><strong>${bi("More for this lesson", "Más para esta lección")}:</strong> ${resources.map((r) => `<a href="${esc(r.href)}">${esc(r.label)}</a>`).join(" · ")}</nav>`
          : ""
      }
    </div>
  </footer>

  <script type="application/json" id="studio-data">${json(data)}</script>
${NSR_BODY}
</body>
</html>
`;
}

/**
 * The Daily Boost: a studio page whose ten problems are chosen in the browser from what this student has practised
 * (assets/studio/boost.js rewrites #studio-data before the runtime reads it). The server only lays out the shell
 * and ships the catalogue of skills the Boost may draw from.
 */
export function boostPage(
  /** @type {{world: any, catalog: any[], assets: any}} */ { world, catalog, assets },
) {
  const rounds = [
    ["Warm-up", "Calentamiento", "Due for a second look"],
    ["Mix it up", "Mezcla", "Different skills side by side"],
    ["Dig in", "A fondo", "A little more thinking"],
    ["Stretch", "Reto", "Skills you are still building"],
    ["Finish strong", "Cierre", "The last two"],
  ];
  const sections = rounds.map(([en, es, desc], i) => ({
    name: en,
    nameEs: es,
    desc,
    descEs: "Repaso mezclado",
    h: en,
    p: "Two questions from skills across the grade. The skills you know best come back less often; the ones you miss come back sooner.",
    pEs: "Dos preguntas de habilidades de todo el año. Las que dominas vuelven menos; las que fallas vuelven antes.",
    items: [0, 1].map((k) => ({ k: "gen", g: "medianFind", level: 2, id: `b_${i}_${k}` })),
  }));
  const html = pageFor({
    id: "0-0",
    mode: "practice",
    cfg: {
      title: "Daily Boost",
      standard: "",
      contentObjective: "Mixed review of skills from every unit",
    },
    ld: {
      story:
        "Skills fade unless you meet them again. Today's Boost brings back what is due and mixes in something new, so what you learn stays learned.",
      storyEs:
        "Las habilidades se olvidan si no las vuelves a ver. El refuerzo de hoy trae lo que toca repasar y mezcla algo nuevo.",
      glossary: [],
    },
    world,
    sections,
    assets,
  });
  return (
    html
      // Not a lesson: no Learning Lab stage bar (it would link /math/studio/0-0/, which does not exist).
      .replace(/\s*<nav class="ms-stagebar"[\s\S]*?<\/nav>/, "")
      .replace(
        /<div class="brand-sub">[^<]*<\/div>/,
        '<div class="brand-sub">Grade 6 Math · Mixed review from every unit · New set each day</div>',
      )
      .replace(
        /<strong>Grade 6 Mathematics · Lesson 0-0: Daily Boost<\/strong>/,
        "<strong>Grade 6 Mathematics · Daily Boost</strong>",
      )
      .replace(
        / · <a href="\/lessons\/0-0\/">Open the full lesson<\/a> · <a href="[^"]*">(?:Practice|Challenge) version<\/a>/,
        ' · <a href="/math/practice-studio/">All practice studios</a>',
      )
      .replaceAll("/math/practice-studio/0-0/challenge/", "/math/practice-studio/")
      .replace(
        "</body>",
        `  <script type="application/json" id="boost-catalog">${json(catalog)}</script>\n</body>`,
      )
  );
}

/** The finder at /math/practice-studio/: every lesson, both versions, and the student's own passport stamps. */
export function indexPage(
  /** @type {Array<{id: string, title: string, emoji: string, world: string}>} */ entries,
  /** @type {Array<{id: string, title: string, practice: string, challenge: string}>} */ unit4,
  /** @type {{styles: string[], scripts: string[], stamp: string}} */ assets,
) {
  const byUnit = /** @type {Record<string, typeof entries>} */ ({});
  for (const e of entries) (byUnit[e.id.split("-")[0]] ||= []).push(e);
  const card = (
    /** @type {string} */ id,
    /** @type {string} */ title,
    /** @type {string} */ emoji,
    /** @type {string} */ p,
    /** @type {string} */ c,
    /** @type {string} */ world = "",
  ) =>
    `<li class="finder-card"${world ? ` data-world="${esc(world)}"` : ""} data-lesson="${esc(id)}"><span class="finder-emoji" aria-hidden="true">${emoji}</span><div class="finder-main"><strong>Lesson ${esc(id.replace("-", "."))}</strong> ${esc(title)}<span class="finder-links"><a class="btn btn-sm" href="${p}">Practice</a><a class="btn btn-sm btn-go" href="${c}">Challenge</a><span class="stamps" data-stamps="${esc(id)}" aria-label="Your stamps for this lesson"></span></span></div></li>`;
  const groups = Object.keys(byUnit)
    .map(Number)
    .sort((a, b) => a - b)
    .map(
      (u) =>
        `    <section class="stage-card finder-unit"><h2>Unit ${u}</h2><ul class="finder-list">${byUnit[String(u)].map((e) => card(e.id, e.title, e.emoji, `/math/practice-studio/${e.id}/`, `/math/practice-studio/${e.id}/challenge/`, e.world)).join("")}</ul></section>`,
    );
  const u4 = unit4.length
    ? `    <section class="stage-card finder-unit"><h2>Unit 4</h2><ul class="finder-list">${unit4.map((e) => card(e.id, e.title, "%", e.practice, e.challenge)).join("")}</ul></section>`
    : "";
  const all = [...groups];
  const at4 = all.findIndex((g) => g.includes("<h2>Unit 5</h2>"));
  all.splice(at4 < 0 ? all.length : at4, 0, u4);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Interactive Practice Studios · Grade 6 Math</title>
  <meta name="description" content="A Practice studio and a Challenge studio for every Grade 6 lesson in Units 2 to 9, with fresh problems, hands-on activities and a passport that stamps as you finish.">
  <link rel="icon" href="${FAVICON("★")}">
${assets.styles.map((u) => `  <link rel="stylesheet" href="${u}">`).join("\n")}
${NSR_HEAD}
</head>
<body data-world="lab" data-mode="practice">
  <header class="app-header"><div class="header-wrap"><div class="brand"><div class="brand-icon" aria-hidden="true">★</div><div><h1 class="brand-title">Interactive Practice Studios</h1><div class="brand-sub">Grade 6 Math · pick a lesson, then Practice or take the Challenge</div></div></div></div></header>
  <main class="main-container">
    <section class="stage-card finder-boost"><h2>⚡ Daily Boost</h2><p>Ten mixed questions from across the grade: what is due for review plus something new. A fresh set every day.</p><p><a class="btn btn-go" href="/math/practice-studio/boost/">Start today's Boost</a></p></section>
    <section class="stage-card finder-passport"><h2>My passport</h2><p id="passport-summary">Finish a studio to earn a stamp. A gold stamp means you cleared the Challenge boss.</p><p class="item-sub">Stamps are saved on this device only.</p></section>
${all.join("\n")}
  </main>
  <script src="/assets/studio/store.js?v=${assets.stamp}" defer></script>
  <script src="/assets/studio/finder.js?v=${assets.stamp}" defer></script>
${NSR_BODY}
</body>
</html>
`;
}
