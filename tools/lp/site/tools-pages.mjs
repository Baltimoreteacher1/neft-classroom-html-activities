// Teacher Tools: /tools/ and one page per tool. Each page is a server-rendered form with a working example already
// filled in (so the result shows before typing); lp/assets/tools/<slug>.js wires it up. Same pattern everywhere:
// pick -> customize -> preview live -> export.
import { icon } from "./icons.mjs";
import { t } from "./layout.mjs";
import { esc, html, raw } from "./util.mjs";

const privacyNote = () =>
  html`<p class="note no-print">${raw(icon("check"))} <span data-i18n="tool.private">Everything here runs in your browser. Nothing is sent anywhere.</span> <span class="muted" data-draft-status></span></p>`;
const steps = (labels) =>
  html`<ol class="steps-nav no-print" aria-label="Steps">${labels.map((l) => html`<li>${l}</li>`)}</ol>`;
const head = (tool, lede) =>
  html`<div class="page-head"><span class="eyebrow">Teacher Tools</span><h1>${tool.title}</h1><p class="lede">${lede ?? tool.summary}</p></div>`;
const opts = (list, selected) =>
  list.map(([v, l]) =>
    raw(`<option value="${esc(v)}"${v === selected ? " selected" : ""}>${esc(l)}</option>`),
  );
const AREA_OPTS = [
  ["math", "Math"],
  ["science", "Science"],
  ["ela", "English Language Arts"],
  ["social-studies", "Social Studies"],
  ["general", "Any class (social and instructional)"],
];
const KLU_OPTS = ["Narrate", "Inform", "Explain", "Argue"].map((k) => [k, k]);
const BAND_OPTS = [
  ["L1-2", "Levels 1–2"],
  ["L3-4", "Levels 3–4"],
  ["L5-6", "Levels 5–6"],
];
const GRADE_OPTS = [
  ["2-3", "Grades 2–3"],
  ["4-5", "Grades 4–5"],
  ["6-8", "Grades 6–8"],
];

// "What do you need right now?": one task per tile, in a teacher's words, each landing on the tool that does it.
const TASKS = [
  ["warm-ups", "task.warmup", "Warm up my class", "A 5-minute language warm-up to project."],
  [
    "game-maker",
    "task.game",
    "Turn my word list into a game",
    "Six game styles; play on the board or share a link.",
  ],
  [
    "frame-generator",
    "task.frames",
    "Write today's objectives and frames",
    "Content + language objective, frames at 3 levels.",
  ],
  [
    "scaffold-generator",
    "task.scaffold",
    "Make a reading or task easier",
    "Chunked text, simpler directions, a glossary.",
  ],
  [
    "vocabulary-cards",
    "task.vocab",
    "Print vocabulary cards",
    "Frayer or picture cards with Spanish and cognates.",
  ],
  [
    "score-interpreter",
    "task.scores",
    "Make sense of ACCESS scores",
    "Plain-language meaning, groups and a family letter.",
  ],
];

function myClassPanel() {
  const sel = (name, label, list, i18n) =>
    html`<div class="field"><label for="mc-${name}" data-i18n="${i18n}">${label}</label><select id="mc-${name}" name="${name}"><option value="">—</option>${opts(list, "")}</select></div>`;
  return html`<section class="panel my-class" id="my-class" data-class-profile aria-labelledby="mc-title">
<div class="my-class-head"><span class="card-icon">${raw(icon("teacher"))}</span><div><h2 class="h3" id="mc-title" data-i18n="class.title">My class</h2>
<p class="muted" data-i18n="class.lede">Set it once. Every tool opens with your grade, subject, level and words already filled in.</p></div></div>
<form autocomplete="off">
<div class="field my-class-unit"><label for="mc-unit" data-i18n="class.unit">Start from a unit (optional)</label><select id="mc-unit" name="unit"><option value="">—</option></select></div>
<div class="my-class-grid">
${sel("grade", "Grade band", GRADE_OPTS, "class.grade")}
${sel("area", "Content area", AREA_OPTS, "class.area")}
${sel("band", "Most students are at", BAND_OPTS, "class.band")}
${sel("klu", "Key Language Use", KLU_OPTS, "class.klu")}
<div class="field"><label for="mc-topic" data-i18n="class.topic">This week's topic</label><input type="text" id="mc-topic" name="topic" placeholder="ratios"></div>
<div class="field"><label for="mc-terms" data-i18n="class.terms">Key words (commas between)</label><input type="text" id="mc-terms" name="terms" placeholder="ratio, rate, per, equivalent"></div>
</div>
<div class="btn-row"><button type="submit" class="btn small" data-i18n="class.save">Save my class</button><button type="button" class="btn small secondary" data-class-clear data-i18n="class.clear">Clear</button><span class="muted" data-class-status aria-live="polite"></span></div>
</form></section>`;
}

export function toolsHome(data) {
  const bySlug = Object.fromEntries(data.tools.tools.map((t) => [t.slug, t]));
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">Teacher Tools</span><h1 data-i18n="nav.tools">Teacher Tools</h1>
<p class="lede">Every tool works the same way: pick, customize, preview, export. Each one opens with an example already filled in. They work offline, save drafts on your device and never need an account.</p>
<p class="muted kbd-hint no-print"><span data-i18n="palette.hint">Know what you want? Press</span> <kbd>Ctrl</kbd> <kbd>K</kbd> <span data-i18n="palette.hint2">to jump straight to it.</span></p></div>
<section aria-labelledby="task-title"><h2 class="h3" id="task-title" data-i18n="task.title">What do you need right now?</h2>
<div class="task-grid">${TASKS.map(
    ([slug, key, label, sub]) =>
      html`<a class="task" href="/tools/${slug}/"><span class="task-icon">${raw(icon(bySlug[slug].icon))}</span><span class="task-text"><strong data-i18n="${key}">${label}</strong><small>${sub}</small></span><span class="task-time">${bySlug[slug].minutes} min</span></a>`,
  )}</div></section>
${myClassPanel()}
<h2 class="h3 section" data-i18n="tools.all">All tools</h2>
<div class="grid cols-3 tool-cards">${data.tools.tools.map(
    (
      tool,
    ) => html`<article class="card${tool.flagship ? " flagship" : ""}"><span class="card-icon">${raw(icon(tool.icon))}</span><h3 class="h3"><a class="card-link" href="/tools/${tool.slug}/">${tool.title}</a></h3><p>${tool.summary}</p>
<div class="meta"><span class="chip amber">${tool.minutes} min</span>${tool.outputs.map((o) => html`<span class="chip">${o}</span>`)}</div></article>`,
  )}</div>
${privacyNote()}
</div>`;
}

// Activity Builder accent swatches: each has 4.5:1 or more with white text (no purple family: gate G-06).
const SWATCHES = [
  ["#17324d", "Navy"],
  ["#0b6e6a", "Teal"],
  ["#166534", "Forest"],
  ["#1e40af", "Ocean"],
  ["#9a3412", "Brick"],
  ["#991b1b", "Red"],
  ["#334155", "Slate"],
  ["#1f2937", "Charcoal"],
];

/* ---------- Game Maker ---------- */
export const GAME_TEMPLATES = [
  [
    "match",
    "Matching / Memory",
    "Flip cards to match each word with its meaning.",
    "term, meaning",
  ],
  [
    "quiz",
    "Quiz Show",
    "A projected board for teams. Pick a tile, read the question, reveal the answer, score points.",
    "question, answer, category (optional)",
  ],
  [
    "builder",
    "Sentence Builder",
    "Tap the words in the right order to build each sentence.",
    "one sentence per line",
  ],
  ["sort", "Word Sort", "Put each word in the right group.", "word, group"],
  [
    "frame",
    "Fill the Frame",
    "Choose the missing word for each sentence. Mark the answer with [square brackets].",
    "one sentence per line, answer in [brackets]",
  ],
  [
    "speed",
    "Speed Review",
    "Quick multiple-choice review. The timer is off unless you turn it on.",
    "question, answer",
  ],
];
export const GAME_THEMES = [
  ["harbor", "Harbor (navy and teal)"],
  ["sunrise", "Sunrise (amber and coral)"],
  ["garden", "Garden (green)"],
  ["slate", "Slate (calm gray-blue)"],
];
export const GAME_EXAMPLE = {
  title: "Ratio words",
  template: "match",
  theme: "harbor",
  rows: "ratio, a comparison of two quantities, razón\nrate, a ratio that compares different units, tasa\nunit rate, a rate for one unit, tasa unitaria\nper, for each, por\nequivalent, having the same value, equivalente\ntable, rows and columns that organize numbers, tabla",
};

export function gameMakerPage(tool) {
  return html`<div class="wrap">
${head(tool, "Paste a word list, vocabulary or questions. Pick a game style. Preview it, then download one file that runs offline, share a link, or print cards.")}
${steps(["Pick a game", "Add your words", "Preview", "Export"])}
<div class="tool-layout" data-tool="game-maker">
<form class="panel no-print" data-gm-form autocomplete="off">
  <fieldset><legend>1. Game style</legend><div class="grid cols-2">${GAME_TEMPLATES.map(
    ([id, label, desc], i) =>
      html`<label class="check"><input type="radio" name="template" value="${id}"${i === 0 ? raw(" checked") : ""}><span><strong>${label}</strong><br><span class="muted">${desc}</span></span></label>`,
  )}</div></fieldset>
  <div class="field"><label for="gm-title">2. Game title</label><input type="text" id="gm-title" name="title" value="${GAME_EXAMPLE.title}"></div>
  <div class="field"><label for="gm-rows">Your words</label><p class="hint" data-gm-format>Format: term, meaning, Spanish (optional). One per line. You can paste from a spreadsheet.</p>
    <textarea id="gm-rows" name="rows" rows="9">${GAME_EXAMPLE.rows}</textarea></div>
  <div class="field"><label for="gm-file">Or upload a CSV file</label><input type="file" id="gm-file" accept=".csv,.tsv,.txt,text/csv"></div>
  <div class="field"><label for="gm-from">Or start from a Content + Language unit</label><select id="gm-from"><option value="">Choose a unit…</option></select></div>
  <fieldset><legend>3. Look and supports</legend>
    <div class="field"><label for="gm-theme">Theme</label><select id="gm-theme" name="theme">${opts(GAME_THEMES, "harbor")}</select></div>
    <label class="check"><input type="checkbox" name="tts" checked><span>Read-aloud buttons (device voice)</span></label>
    <label class="check"><input type="checkbox" name="gloss"><span>Show the Spanish column as a home-language hint</span></label>
    <label class="check"><input type="checkbox" name="bank" checked><span>Word bank (Fill the Frame)</span></label>
    <label class="check"><input type="checkbox" name="icons" checked><span>Pictures for words that match an icon (sun, plant, map…)</span></label>
    <label class="check"><input type="checkbox" name="timer"><span>Timer for Speed Review (off by default)</span></label>
  </fieldset>
  <p class="muted" data-gm-errors aria-live="polite"></p>
  <div class="btn-row"><button type="button" class="btn secondary small" data-gm-example>${t("tool.example", "Load the example")}</button><button type="button" class="btn ghost small" data-gm-reset>${t("tool.reset", "Start over")}</button></div>
</form>
<section class="preview" aria-labelledby="gm-preview-title">
  <h2 id="gm-preview-title" class="h3 no-print"><span data-i18n="tool.preview">Preview</span></h2>
  <div class="preview-frame" data-gm-preview><p class="empty">The preview appears here.</p></div>
  <div class="panel no-print section"><h3 class="h4">4. Export</h3>
    <div class="btn-row"><button type="button" class="btn" data-gm-download>${raw(icon("download"))} Download game (.html)</button>
    <button type="button" class="btn secondary" data-gm-link>${raw(icon("link"))} Copy share link</button>
    <button type="button" class="btn secondary" data-gm-print>${raw(icon("print"))} Print cards</button></div>
    <p class="muted" data-gm-size></p>
    <div class="qr-box" data-gm-qr hidden><p class="label">Scan to play on a device</p><div data-gm-qr-svg></div><p class="muted" data-gm-qr-note></p></div>
    <p class="muted">The file works offline and can be uploaded to Google Classroom, Canvas or a website. The share link keeps the whole game inside the link; nothing is stored on a server.</p>
  </div>
</section>
</div>
<div class="print-only" data-gm-cards></div>
${privacyNote()}
</div>`;
}

export function gamePlayPage() {
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">Game</span><h1 data-game-title>Game</h1><p class="lede no-print" data-game-note>This game was shared as a link. Everything in it lives in the link itself.</p></div>
<div class="preview-frame" data-game-root><p class="empty">Loading the game from the link… If nothing appears, the link may be incomplete. <a href="/tools/game-maker/">Make a game</a>.</p></div>
<p class="no-print section"><a class="btn secondary" href="/tools/game-maker/" data-edit-game>Edit this game</a></p>
</div>`;
}

/* ---------- Activity Builder ---------- */
export const BLOCK_TYPES = [
  ["passage", "Reading passage"],
  ["audio", "Audio prompt (read aloud)"],
  ["mc", "Multiple choice"],
  ["order", "Drag to order"],
  ["cloze", "Cloze (fill the blanks)"],
  ["short", "Short response"],
  ["frames", "Sentence-frame response"],
  ["image", "Image with labels"],
  ["rubric", "Self-check rubric"],
];
export function activityBuilderPage(tool) {
  return html`<div class="wrap">
${head(tool, "Build an interactive page from blocks. See it at phone, tablet and desktop size as you work. Export one file, an embed snippet, or a print version.")}
${steps(["Add blocks", "Fill them in", "Check accessibility", "Export"])}
<div class="tool-layout" data-tool="activity-builder">
<div class="panel no-print">
  <div class="field"><label for="ab-title">Activity title</label><input type="text" id="ab-title" value="Why do some ice cubes melt faster?"></div>
  <fieldset class="field swatches"><legend>Accent color</legend><div class="swatch-row">${SWATCHES.map(([hex, name]) => html`<button type="button" class="swatch" data-swatch="${hex}" aria-pressed="false" aria-label="${name}" title="${name}"></button>`)}</div>
  <label class="hint" for="ab-accent">Or type any hex color</label><input type="text" id="ab-accent" value="#17324d" inputmode="text" aria-describedby="ab-accent-hint"><span class="hint" id="ab-accent-hint">Every swatch passes 4.5:1 with white text. The checker warns if a typed color does not.</span></fieldset>
  <div class="field"><label for="ab-add">Add a block</label><div class="btn-row"><select id="ab-add">${opts(BLOCK_TYPES, "passage")}</select><button type="button" class="btn small" data-ab-add>Add</button></div></div>
  <ol class="ab-blocks" data-ab-blocks aria-label="Blocks"></ol>
  <div class="btn-row"><button type="button" class="btn secondary small" data-ab-example>${t("tool.example", "Load the example")}</button><button type="button" class="btn ghost small" data-ab-reset>${t("tool.reset", "Start over")}</button></div>
</div>
<section class="preview" aria-labelledby="ab-preview-title">
  <div class="mode-bar no-print"><h2 id="ab-preview-title" class="h3"><span data-i18n="tool.preview">Preview</span></h2>
  <div class="seg" role="group" aria-label="Preview width"><button type="button" data-width="phone" aria-pressed="false">Phone</button><button type="button" data-width="tablet" aria-pressed="false">Tablet</button><button type="button" data-width="desktop" aria-pressed="true">Desktop</button></div></div>
  <div class="preview-frame" data-ab-preview></div>
  <div class="panel no-print section"><h3 class="h4">Accessibility check</h3><ul data-ab-a11y aria-live="polite"></ul></div>
  <div class="panel no-print section"><h3 class="h4">Export</h3>
  <div class="btn-row"><button type="button" class="btn" data-ab-download>${raw(icon("download"))} Download (.html)</button><button type="button" class="btn secondary" data-ab-embed>${raw(icon("copy"))} Copy embed snippet</button><button type="button" class="btn secondary" data-ab-print>${raw(icon("print"))} Print version</button></div>
  <p class="muted" data-ab-size></p></div>
</section>
</div>
${privacyNote()}
</div>`;
}

/* ---------- Frame Generator ---------- */
export function frameGeneratorPage(tool) {
  return html`<div class="wrap">
${head(tool, "Choose a content area, grade, topic and Key Language Use. You get a content objective, a WIDA-aligned language objective, sentence frames in three proficiency bands and a word bank. Built from curated phrase banks, so it is instant and works offline.")}
<div class="tool-layout" data-tool="frame-generator">
<form class="panel no-print" data-fg-form autocomplete="off">
  <div class="field"><label for="fg-area">Content area</label><select id="fg-area" name="area">${opts(AREA_OPTS, "science")}</select></div>
  <div class="field"><label for="fg-grade">Grade band</label><select id="fg-grade" name="grade">${opts(GRADE_OPTS, "4-5")}</select></div>
  <div class="field"><label for="fg-topic">Topic</label><input type="text" id="fg-topic" name="topic" value="how plants make food"></div>
  <div class="field"><label for="fg-terms">Key words (comma-separated)</label><input type="text" id="fg-terms" name="terms" value="sunlight, leaves, energy, roots"></div>
  <div class="field"><label for="fg-klu">Key Language Use</label><select id="fg-klu" name="klu">${opts(KLU_OPTS, "Explain")}</select></div>
  <fieldset><legend>Proficiency bands to show</legend>${BAND_OPTS.map(([v, l]) => html`<label class="check"><input type="checkbox" name="bands" value="${v}" checked><span>${l}</span></label>`)}</fieldset>
</form>
<section class="preview"><div class="btn-row no-print fg-actions"><button type="button" class="btn small" data-project-target="[data-fg-out]">${raw(icon("project"))} <span data-i18n="practice.project">Project this</span></button></div><div aria-live="polite" data-fg-out></div></section>
</div>
${privacyNote()}
</div>`;
}

/* ---------- Scaffold Generator ---------- */
export const SCAFFOLD_EXAMPLE =
  "Directions: Read the passage about the water cycle. Determine the main idea of each paragraph and identify two details that support it. Then, utilizing evidence from the text, explain how evaporation and condensation are related. Record your answers in complete sentences.\n\nThe water cycle describes how water continuously moves between the land, the oceans and the atmosphere. When the sun heats water in oceans and lakes, the water evaporates and rises as water vapor. As the vapor rises, it cools and condenses into tiny droplets that form clouds. Eventually the droplets combine and become heavy enough to fall as precipitation, such as rain or snow. The water collects in rivers, lakes and oceans, and the cycle begins again.";
export function scaffoldGeneratorPage(tool) {
  return html`<div class="wrap">
${head(tool, "Paste any task or text and choose a target level. You get chunked text, simpler directions, a glossary to pre-teach, visual-support ideas, a graphic organizer and frames, with readability numbers before and after. Rules, not AI: the same input always gives the same result.")}
<div class="tool-layout" data-tool="scaffold-generator">
<form class="panel no-print" data-sg-form autocomplete="off">
  <div class="field"><label for="sg-text">Task or text</label><textarea id="sg-text" name="text" rows="14">${SCAFFOLD_EXAMPLE}</textarea></div>
  <div class="field"><label for="sg-band">Target proficiency band</label><select id="sg-band" name="band">${opts(BAND_OPTS, "L3-4")}</select></div>
  <div class="field"><label for="sg-terms">Words you want to pre-teach (optional)</label><input type="text" id="sg-terms" name="terms" value="water cycle"></div>
</form>
<section class="preview" aria-live="polite" data-sg-out></section>
</div>
${privacyNote()}
</div>`;
}

/* ---------- Score Interpreter ---------- */
export function scoreInterpreterPage(tool) {
  const domainInput = (id, label, value) =>
    html`<div class="field"><label for="si-${id}">${label}</label><input type="number" id="si-${id}" name="${id}" min="1" max="6" step="0.1" value="${value}" inputmode="decimal"></div>`;
  return html`<div class="wrap">
${head(tool, "Enter the four domain proficiency levels from a WIDA ACCESS score report. See composite estimates, what each level means in plain language, next teaching moves, and a family letter in English and Spanish.")}
<p class="note amber"><strong>Nothing leaves this page.</strong> All processing happens in your browser. Nothing is transmitted or stored on a server. Use initials or IDs, never full names, in the class view.</p>
<div class="tabs" data-tabs>
<div role="tablist" aria-label="Score views" class="no-print"><button type="button" role="tab" id="tab-one" aria-controls="panel-one" aria-selected="true">One student</button><button type="button" role="tab" id="tab-class" aria-controls="panel-class" aria-selected="false" tabindex="-1">Class view</button></div>
<div role="tabpanel" id="panel-one" aria-labelledby="tab-one">
<div class="tool-layout">
<form class="panel no-print" data-si-form autocomplete="off">
  <div class="field"><label for="si-id">Student initials or ID</label><input type="text" id="si-id" name="id" value="A.R." maxlength="12"></div>
  <div class="field"><label for="si-grade">Grade</label><select id="si-grade" name="grade">${opts(
    ["3", "4", "5", "6", "7", "8"].map((g) => [g, `Grade ${g}`]),
    "6",
  )}</select></div>
  <div class="grid cols-2">${domainInput("listening", "Listening", "4.2")}${domainInput("speaking", "Speaking", "3.1")}${domainInput("reading", "Reading", "3.6")}${domainInput("writing", "Writing", "2.9")}</div>
  <p class="muted" data-si-errors aria-live="polite"></p>
</form>
<section class="preview" aria-live="polite" data-si-out></section>
</div></div>
<div role="tabpanel" id="panel-class" aria-labelledby="tab-class" hidden>
<form class="panel no-print" data-si-class autocomplete="off">
  <div class="field"><label for="si-roster">Paste a roster: ID, Listening, Speaking, Reading, Writing (one student per line)</label>
  <textarea id="si-roster" rows="8">A.R., 4.2, 3.1, 3.6, 2.9
B.T., 2.0, 1.8, 1.9, 1.6
C.M., 5.1, 4.6, 4.8, 4.4
D.L., 3.3, 3.0, 2.4, 2.2
E.K., 4.0, 4.5, 3.8, 3.1
F.N., 1.4, 1.2, 1.5, 1.3</textarea></div>
  <div class="field"><label for="si-file">Or upload a CSV file (ID, Listening, Speaking, Reading, Writing)</label><input type="file" id="si-file" accept=".csv,.tsv,.txt,text/csv"><span class="hint">A header row is fine; it is skipped. The file is read in this browser only.</span></div>
  <div class="btn-row"><button type="button" class="btn small secondary" data-si-template>Download a blank template</button></div>
</form>
<section aria-live="polite" data-si-class-out></section>
</div>
</div>
</div>`;
}

/* ---------- Vocabulary Cards ---------- */
export function vocabCardsPage(tool) {
  return html`<div class="wrap">
${head(tool, "Type or paste words. Choose Frayer-model or picture cards. Print four to a page.")}
<div class="tool-layout" data-tool="vocabulary-cards">
<form class="panel no-print" data-vc-form autocomplete="off">
  <div class="field"><label for="vc-layout">Card style</label><select id="vc-layout" name="layout">${opts(
    [
      ["frayer", "Frayer model"],
      ["word", "Word card with picture box"],
    ],
    "frayer",
  )}</select></div>
  <div class="field"><label for="vc-rows">Words: word, meaning, Spanish, example sentence, tier (2 or 3)</label>
  <textarea id="vc-rows" name="rows" rows="9">evaporate, to change from a liquid to a gas, evaporar, The puddle evaporated in the hot sun., 3
condense, to change from a gas to a liquid, condensar, Water condensed on the cold glass., 3
cycle, a set of events that happens again and again, ciclo, The water cycle never stops., 2
predict, to say what you think will happen, predecir, I predict the ice will melt by noon., 2</textarea></div>
  <div class="field"><label for="vc-from">Or start from a Content + Language unit</label><select id="vc-from"><option value="">Choose a unit…</option></select></div>
  <label class="check"><input type="checkbox" name="cognates" checked><span>Mark Spanish cognates</span></label>
  <div class="btn-row"><button type="button" class="btn" data-vc-print>${raw(icon("print"))} Print cards</button></div>
</form>
<h2 id="vc-out-title" class="visually-hidden">Your cards</h2>
<section class="preview" data-vc-out aria-live="polite" aria-labelledby="vc-out-title"></section>
</div>
${privacyNote()}
</div>`;
}

/* ---------- Graphic Organizers ---------- */
export const ORGANIZERS = [
  {
    id: "story-map",
    klu: "Narrate",
    title: "Story map",
    cells: ["Characters", "Setting", "Problem", "Events", "Solution"],
  },
  {
    id: "sequence",
    klu: "Narrate",
    title: "Sequence chain",
    cells: ["First", "Next", "Then", "Last"],
    flow: true,
  },
  {
    id: "bme",
    klu: "Narrate",
    title: "Beginning, middle, end",
    cells: ["Beginning", "Middle", "End"],
    flow: true,
  },
  {
    id: "describe",
    klu: "Inform",
    title: "Describing web",
    cells: ["Topic", "Looks like", "Has", "Can", "Is found"],
  },
  {
    id: "t-chart",
    klu: "Inform",
    title: "Compare T-chart",
    cells: ["Thing 1", "Thing 2"],
    twoCol: true,
  },
  {
    id: "classify",
    klu: "Inform",
    title: "Classify table",
    cells: ["Group A", "Group B", "Group C"],
    twoCol: true,
  },
  {
    id: "cause-effect",
    klu: "Explain",
    title: "Cause and effect chain",
    cells: ["Cause", "Effect", "Then", "So"],
    flow: true,
  },
  {
    id: "how-it-works",
    klu: "Explain",
    title: "How it works",
    cells: ["Step 1", "Step 2", "Step 3", "Why it works"],
    flow: true,
  },
  {
    id: "problem-solution",
    klu: "Explain",
    title: "Problem and solution",
    cells: ["Problem", "Why it is a problem", "Solution", "Result"],
  },
  {
    id: "cer",
    klu: "Argue",
    title: "Claim, evidence, reasoning",
    cells: ["Claim", "Evidence", "Reasoning"],
  },
  {
    id: "opinion",
    klu: "Argue",
    title: "Opinion and reasons",
    cells: ["My opinion", "Reason 1", "Reason 2", "Reason 3", "Closing"],
  },
  {
    id: "counter",
    klu: "Argue",
    title: "Claim and counterclaim",
    cells: ["My claim", "Evidence", "Other side", "My response"],
    twoCol: true,
  },
];
export function organizersPage(tool) {
  return html`<div class="wrap">
${head(tool, "Pick an organizer by Key Language Use. Fill it in on screen or print it blank.")}
<div class="filter-bar no-print" role="group" aria-label="Filter by Key Language Use">${[
    "All",
    "Narrate",
    "Inform",
    "Explain",
    "Argue",
  ].map(
    (k, i) =>
      html`<button type="button" class="chip" data-org-filter="${k}" aria-pressed="${i === 0 ? "true" : "false"}">${k}</button>`,
  )}</div>
<div class="grid cols-2" data-organizers>${ORGANIZERS.map(
    (o) => html`<article class="panel organizer-card" data-klu="${o.klu}" id="org-${o.id}">
  <div class="mode-bar"><h2 class="h4">${o.title} <span class="chip amber">${o.klu}</span></h2><button type="button" class="btn small secondary no-print" data-print-org="${o.id}">${raw(icon("print"))} Print</button></div>
  <div class="field"><label for="org-${o.id}-name">Title or topic</label><input type="text" id="org-${o.id}-name" data-org-field></div>
  <div class="grid ${o.twoCol ? "cols-2" : ""}">${o.cells.map((c, j) => html`<div class="field band"><label for="org-${o.id}-${j}">${o.flow && j ? "→ " : ""}${c}</label><textarea id="org-${o.id}-${j}" rows="3" data-org-field></textarea></div>`)}</div>
</article>`,
  )}</div>
${privacyNote()}
</div>`;
}

/* ---------- Readiness Kit ---------- */
export const CHECKLIST = {
  Student: [
    "I know my login or test ticket is handled by my teacher.",
    "I slept well and ate breakfast.",
    "I practiced with headphones and a microphone.",
    "I know how to use Next, Back and the play button.",
    "I know I can take my time: the test is not timed.",
    "I will try every question, even hard ones.",
  ],
  Teacher: [
    "Headsets with microphones are tested on every device.",
    "Students have practiced recording and playing back their voice.",
    "Accommodations are set before the session.",
    "Students have seen a practice test screen.",
    "The room is quiet and the schedule is posted.",
    "Families received the letter in their language.",
  ],
  Family: [
    "My child goes to bed on time the night before.",
    "My child eats breakfast on test days.",
    "I told my child the test shows growth, not a grade.",
    "I asked the teacher which days are test days.",
    "I talk with my child every day, in any language.",
  ],
};
export function readinessPage(tool) {
  return html`<div class="wrap">
${head(tool, "Get students and devices ready: a test-day checklist, a sound and microphone check, a practice walk-through of an online test screen, and a family letter.")}
<p class="note">The walk-through is an original practice screen made for this site. It is not a copy of the real test, which may look different.</p>
<section class="section" aria-labelledby="rk-check"><h2 id="rk-check">Test-day checklist</h2><div class="grid cols-3">${Object.entries(
    CHECKLIST,
  ).map(
    ([who, list]) =>
      html`<fieldset class="panel"><legend>${who}</legend>${list.map((item, i) => html`<label class="check"><input type="checkbox" data-rk="${who}-${i}"><span>${item}</span></label>`)}</fieldset>`,
  )}</div><button type="button" class="btn secondary small no-print section" data-print>${raw(icon("print"))} Print checklists</button></section>
<section class="section no-print" aria-labelledby="rk-device"><h2 id="rk-device">Sound and microphone check</h2>
<div class="grid cols-2"><div class="panel"><h3 class="h4">1. Can you hear?</h3><p>Put on the headset and press play.</p><button type="button" class="btn" data-rk-sound>${raw(icon("speaker"))} Play a sound check</button><p data-rk-sound-out aria-live="polite" class="muted"></p></div>
<div class="panel"><h3 class="h4">2. Can the microphone hear you?</h3><p>Press record and say your name and your favorite food. Then play it back. The recording stays on this device.</p>
<div class="btn-row"><button type="button" class="btn" data-rk-mic>${raw(icon("mic"))} Record 5 seconds</button><button type="button" class="btn secondary" data-rk-play disabled>${raw(icon("play"))} Play it back</button></div>
<div class="progress section" aria-hidden="true"><span data-rk-level></span></div><p data-rk-mic-out aria-live="polite" class="muted"></p></div></div></section>
<section class="section no-print" aria-labelledby="rk-walk"><h2 id="rk-walk">Practice test screen walk-through</h2><div data-rk-walk class="panel"></div></section>
<section class="section" aria-labelledby="rk-letter"><h2 id="rk-letter">Family letter</h2>
<div class="tabs" data-tabs><div role="tablist" aria-label="Letter language" class="no-print"><button type="button" role="tab" id="tab-en" aria-controls="letter-en" aria-selected="true">English</button><button type="button" role="tab" id="tab-es" aria-controls="letter-es" aria-selected="false" tabindex="-1">Español</button></div>
<div role="tabpanel" id="letter-en" aria-labelledby="tab-en" class="panel prose" data-letter="en"></div>
<div role="tabpanel" id="letter-es" aria-labelledby="tab-es" class="panel prose" data-letter="es" lang="es" hidden></div></div>
<div class="field no-print section"><label for="rk-dates">Test dates to put in the letter (optional)</label><input type="text" id="rk-dates" placeholder="for example: February 3 to February 14"></div>
<button type="button" class="btn secondary small no-print" data-print>${raw(icon("print"))} Print letter</button>
<p class="muted">Spanish is a draft awaiting review by a native speaker.</p></section>
</div>`;
}

/* ---------- Warm-Up Generator ---------- */
export function warmupsPage(tool, data) {
  return html`<div class="wrap">
${head(tool, "A five-minute language warm-up for any class. Pick a type, add your topic and key words, and project it.")}
<div class="tool-layout" data-tool="warm-ups">
<form class="panel no-print" data-wu-form autocomplete="off">
  <div class="field"><label for="wu-type">Warm-up type</label><select id="wu-type" name="type">${opts(
    data.banks.warmups.types.map((w) => [w.id, w.label]),
    "which-one",
  )}</select></div>
  <div class="field"><label for="wu-area">Content area</label><select id="wu-area" name="area">${opts(AREA_OPTS, "math")}</select></div>
  <div class="field"><label for="wu-topic">Topic</label><input type="text" id="wu-topic" name="topic" value="ratios"></div>
  <div class="field"><label for="wu-terms">Key words (comma-separated, at least 4 for "Which one does not belong?")</label><input type="text" id="wu-terms" name="terms" value="ratio, rate, per, triangle"></div>
  <div class="field"><label for="wu-band">Proficiency band</label><select id="wu-band" name="band">${opts(BAND_OPTS, "L3-4")}</select></div>
  <label class="check"><input type="checkbox" name="timer"><span>Show a 5-minute timer (off by default)</span></label>
</form>
<section class="preview" aria-live="polite"><div class="panel warmup-slide" data-wu-out></div>
<div class="btn-row no-print section"><button type="button" class="btn" data-project-target="[data-wu-out]">${raw(icon("project"))} <span data-i18n="practice.project">Project this</span></button><button type="button" class="btn secondary" data-print>${raw(icon("print"))} <span data-i18n="tool.print">Print</span></button><button type="button" class="btn secondary" data-wu-copy>${raw(icon("copy"))} <span data-i18n="tool.copy">Copy</span></button></div></section>
</div>
${privacyNote()}
</div>`;
}
