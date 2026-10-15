// HTML templates for the Practice Studio v2 pages: a lesson's Practice page, its Challenge twin, and the finder.
// The runtime (assets/studio/*.js) draws the problems from the JSON this page ships; this file only lays out the shell.
import { FAVICON } from "./practice-studio-worlds.mjs";

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

const NSR_HEAD = `  <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css?v=20260714-v2">
  <!-- nsr-injected:end -->`;
const NSR_BODY = `<!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
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

const bi = (/** @type {string} */ en, /** @type {string} */ es) =>
  es
    ? `<span class="t-en">${esc(en)}</span><span class="t-es" lang="es">${esc(es)}</span>`
    : esc(en);

/**
 * @param {object} o
 * @param {string} o.id lesson id, e.g. "5-2"
 * @param {"practice"|"challenge"} o.mode
 * @param {any} o.cfg lesson config
 * @param {any} o.ld data/practice-studio/<id>.json
 * @param {any} o.world the world definition (with .id)
 * @param {any[]} o.sections the five sections for this mode
 * @param {{scripts: string[], styles: string[]}} o.assets URLs (already stamped) in load order
 */
export function pageFor({ id, mode, cfg, ld, world, sections, assets }) {
  const unit = id.split("-")[0];
  const standard = cfg.standard || "";
  const title = cfg.title || `Lesson ${id}`;
  const challenge = mode === "challenge";
  const total = sections.reduce((a, s) => a + s.items.length, 0);
  const otherUrl = challenge
    ? `/math/practice-studio/${id}/`
    : `/math/practice-studio/${id}/challenge/`;
  const data = {
    v: 2,
    lesson: id,
    mode,
    storageKey: `neft_studio_${id}_${mode}_v2`,
    otherUrl,
    otherLabel: challenge ? "Back to Practice" : "Try the Challenge →",
    bannerText: challenge
      ? `Boss cleared! You finished the Challenge for ${title}.`
      : `You finished every section of ${title}!`,
    bannerTextEs: challenge
      ? "¡Jefe derrotado! Terminaste el Reto de esta lección."
      : "¡Terminaste todas las secciones de esta lección!",
    world: { id: world.id, voice: world.voice },
    glyphs: ["★", "✓", "+", "="],
    sections,
  };
  const story = challenge ? ld.challengeStory : ld.story;
  const storyEs = challenge ? ld.challengeStoryEs : ld.storyEs;
  const glossary = (ld.glossary || [])
    .map(
      (/** @type {any} */ g) =>
        `<dt>${esc(g.t)}<span class="es-text" lang="es">${esc(g.tEs)}</span></dt><dd>${esc(g.d)}<span class="es-text" lang="es">${esc(g.dEs)}</span></dd>`,
    )
    .join("");
  const label = challenge ? "Challenge Studio" : "Interactive Practice Studio";
  const missionCard = `<details class="mission-card" open>
        <summary><span class="world-glyph" aria-hidden="true">${world.emoji}</span><span class="mission-title">${bi(world.name, world.nameEs)} · ${challenge ? bi("night shift", "turno de noche") : bi("mission briefing", "informe de la misión")}</span><small>${bi("Briefing", "Informe")}</small></summary>
        <div class="mission-body"><p class="mission-tag">${esc(world.tag)}<span class="es-text" lang="es">${esc(world.tagEs)}</span></p><p>${esc(story)}</p><p class="es-text" lang="es">${esc(storyEs)}</p></div>
    </details>`;
  const tabs = sections
    .map(
      (
        s,
        i,
      ) => `      <button type="button" class="tab-btn" role="tab" id="tab-${i + 1}" aria-selected="${i === 0}" aria-controls="panel-${i + 1}" tabindex="${i === 0 ? 0 : -1}" data-tab="${i + 1}">
        <span class="tab-badge" id="badge-${i + 1}">${i + 1}</span>
        <span class="tab-text"><span class="tab-name">${bi(s.name, s.nameEs)}</span><span class="tab-desc">${bi(s.desc, s.descEs)} (${s.items.length})</span></span>
      </button>`,
    )
    .join("\n");
  const panels = sections
    .map(
      (
        s,
        i,
      ) => `    <section id="panel-${i + 1}" class="tab-panel${i === 0 ? " active" : ""}" role="tabpanel" aria-labelledby="tab-${i + 1}">
      ${i === 0 ? missionCard : ""}
      <div class="topic-strip"><div><h2>${i + 1}. ${esc(s.h)}</h2><p>${esc(s.p)}</p><p class="es-text" lang="es">${esc(s.pEs)}</p></div></div>
      <div class="stepper-bar"><div class="dots-row" id="dots-${i + 1}" role="group" aria-label="${esc(s.name)} problems"></div></div>
      <div class="stage-card" id="stage-${i + 1}"></div>
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
  <link rel="icon" href="${FAVICON(world.emoji)}">
${assets.styles.map((u) => `  <link rel="stylesheet" href="${u}">`).join("\n")}
${NSR_HEAD}
${assets.scripts.map((u) => `  <script src="${u}" defer></script>`).join("\n")}
</head>
<body data-world="${esc(world.id)}" data-mode="${mode}" data-chrome="${esc(world.chrome)}" data-features="insight readaloud passport calibration share">
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

  <nav class="tab-bar" aria-label="${challenge ? "Challenge" : "Practice"} sections">
    <div class="tab-list" role="tablist">
${tabs}
    </div>
  </nav>

  <div id="sr-live" class="sr-only" aria-live="polite"></div>

  <main class="main-container">
    <div id="complete-banner" class="complete-banner" role="status" hidden></div>

${glossary ? `    <details class="glossary"><summary>${bi("Word bank", "Banco de palabras")}</summary><dl>${glossary}</dl></details>\n` : ""}
${panels}
  </main>

  <footer class="app-footer">
    <div class="footer-wrap">
      <span><strong>Grade 6 Mathematics · Lesson ${esc(id)}: ${esc(title)}</strong>${standard ? ` (Standard ${esc(standard)})` : ""}</span>
      <span>${label} · Progress saves on this device · <a href="/lessons/${id}/">Open the full lesson</a> · <a href="${otherUrl}">${challenge ? "Practice version" : "Challenge version"}</a></span>
    </div>
  </footer>

  <script type="application/json" id="studio-data">${json(data)}</script>
${NSR_BODY}
</body>
</html>
`;
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
