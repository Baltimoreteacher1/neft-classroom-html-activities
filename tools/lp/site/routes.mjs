// Every route of the front layer, rendered. Returns pages, the client search index and the route list.

import { areaPage, contentHome, gradePage, unitPage, unitPath, unitToolData } from "./content.mjs";
import { AREAS } from "./data.mjs";
import { icon } from "./icons.mjs";
import { page, t } from "./layout.mjs";
import {
  clusterPage,
  domainPage,
  onPageDisclaimer,
  practiceHome,
  setClientData,
  setPage,
  setPath,
} from "./practice.mjs";
import * as tp from "./tools-pages.mjs";
import { CLUSTERS, DOMAINS, ELD, html, LEVEL_NAMES, raw, SITE } from "./util.mjs";

const TOOL_RENDER = {
  "game-maker": tp.gameMakerPage,
  "activity-builder": tp.activityBuilderPage,
  "frame-generator": tp.frameGeneratorPage,
  "scaffold-generator": tp.scaffoldGeneratorPage,
  "score-interpreter": tp.scoreInterpreterPage,
  "vocabulary-cards": tp.vocabCardsPage,
  "graphic-organizers": tp.organizersPage,
  "readiness-kit": tp.readinessPage,
  "warm-ups": tp.warmupsPage,
};

/* ---------- home ---------- */
function home(data) {
  const door = (cls, ic, key, title, textKey, text, goKey, go, href) =>
    html`<article class="card door ${cls}"><span class="card-icon">${raw(icon(ic))}</span>
  <h2><a class="card-link" href="${href}" data-i18n="${key}">${title}</a></h2>
  <p data-i18n="${textKey}">${text}</p><p class="go"><span data-i18n="${goKey}">${go}</span> →</p></article>`;
  return html`<div class="wrap">
<section class="hero"><h1 data-i18n="home.title">Practice for WIDA ACCESS. Tools for the teachers who teach it.</h1>
<p data-i18n="home.lede">Free, original practice in listening, reading, speaking and writing for grades 3–8, plus classroom tools that turn any lesson into language practice. No login. Nothing about students is collected.</p></section>
<div class="doors">
${door("d-student", "student", "door.student", "I'm a student", "door.student.text", "Pick your grade and a skill. Start practicing right away.", "door.student.go", "Start practicing", "/practice/")}
${door("d-teacher", "teacher", "door.teacher", "I'm a teacher", "door.teacher.text", "Make a game, an activity, sentence frames or a score summary in two minutes.", "door.teacher.go", "Open Teacher Tools", "/tools/")}
${door("d-plan", "plan", "door.plan", "I'm planning a lesson", "door.plan.text", "Find a math, science, ELA or social studies lesson with the language demands already mapped.", "door.plan.go", "Browse Content + Language", "/content/")}
</div>
<p class="below-doors"><span data-i18n="home.also">Also here:</span> <a href="/access-guide/families/" data-i18n="home.families">Families: practice at home</a> · <a href="/bcpss-teachers" data-i18n="home.bcpss">Baltimore City teachers: curriculum bridges</a> · <a href="/access-practice-lab/" data-i18n="home.lab">The full ACCESS Practice Lab</a></p>
<section class="strip" aria-labelledby="new-title"><h2 id="new-title"><span data-i18n="home.new">New this month</span> · ${data.updates.month}</h2>
<ul>${data.updates.items.slice(0, 4).map((u) => html`<li><a href="${u.href}">${u.label}</a></li>`)}</ul></section>
</div>`;
}

/* ---------- search ---------- */
function searchPage() {
  const sel = (id, label, options) =>
    html`<div class="field"><label for="${id}">${label}</label><select id="${id}"><option value="">All</option>${options.map(([v, l]) => html`<option value="${v}">${l}</option>`)}</select></div>`;
  return html`<div class="wrap">
<div class="page-head"><h1 data-i18n="header.search">Search</h1></div>
<form class="filter-bar" role="search" data-search-form>
  <div class="field"><label for="q" data-i18n="search.label">Search the site</label><input type="search" id="q" name="q" placeholder="Try: reading grades 6-8, sentence frames, ratios" data-i18n-placeholder="search.placeholder" autocomplete="off"></div>
  ${sel("f-kind", "Type", [
    ["practice", "Practice"],
    ["tool", "Teacher tool"],
    ["content", "Content + Language"],
    ["guide", "ACCESS Guide"],
  ])}
  ${sel(
    "f-cluster",
    "Grades",
    CLUSTERS.map((c) => [c.slug, c.label]),
  )}
  ${sel(
    "f-domain",
    "Skill",
    DOMAINS.map((d) => [d.slug, d.label]),
  )}
  ${sel("f-area", "Content area", [...AREAS.map((a) => [a.label, a.label]), ["School life", "School life"]])}
  ${sel("f-level", "Proficiency level", [
    ["1-2", "Levels 1–2"],
    ["3-4", "Levels 3–4"],
    ["5", "Level 5"],
  ])}
  ${sel(
    "f-klu",
    "Key Language Use",
    ["Narrate", "Inform", "Explain", "Argue"].map((k) => [k, k]),
  )}
</form>
<p class="muted" data-search-count aria-live="polite"></p>
<ul class="search-results" data-search-results></ul>
<noscript><p>Search needs JavaScript. Browse from the menu above instead.</p></noscript>
</div>`;
}

/* ---------- ACCESS guide ---------- */
const approx = () =>
  html`<span class="approx" title="Checked against public sources on 2026-11-27, but not confirmed word for word. See Sources.">approximate</span>`;
function guideHome() {
  const cards = [
    [
      "/access-guide/what-is-access/",
      "guide",
      "What WIDA ACCESS is",
      "Who takes it, the four skills, grade clusters, levels 1–6 and how the online test works.",
    ],
    [
      "/access-guide/scores/",
      "score",
      "Reading a score report",
      "Domain levels, composite scores and what they mean, in plain language.",
    ],
    [
      "/access-guide/test-day/",
      "checklist",
      "Getting ready for test day",
      "Device checks, a practice test screen and calm test-day routines.",
    ],
    [
      "/access-guide/families/",
      "family",
      "For families · Para familias",
      "What the test is and how to help at home, in English and Spanish.",
    ],
  ];
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">ACCESS Guide</span><h1 data-i18n="nav.guide">ACCESS Guide</h1><p class="lede">Plain-language help with the WIDA ACCESS English language proficiency test, for teachers, students and families.</p></div>
<div class="grid cols-2">${cards.map(([href, ic, title, text]) => html`<article class="card"><span class="card-icon">${raw(icon(ic))}</span><h2 class="h3"><a class="card-link" href="${href}">${title}</a></h2><p>${text}</p></article>`)}</div>
${onPageDisclaimer()}
</div>`;
}

function whatIsAccess() {
  return html`<div class="wrap prose">
<div class="page-head"><span class="eyebrow">ACCESS Guide</span><h1>What WIDA ACCESS is</h1><p class="lede">WIDA ACCESS (formerly ACCESS for ELLs) is the yearly English language proficiency test that multilingual learners take in WIDA member states, including Maryland. It measures how a student uses English for school in four skills.</p></div>
<h2>The four skills (domains)</h2>
<div class="table-wrap"><table><thead><tr><th scope="col">Domain</th><th scope="col">How it works online</th><th scope="col">"Up to" time ${approx()}</th></tr></thead><tbody>
<tr><td>Listening</td><td>Students listen to academic conversations and answer questions ${approx()}. Scored by the test platform. The test adjusts to the student's answers.</td><td>65 min</td></tr>
<tr><td>Reading</td><td>Students read academic texts and answer questions ${approx()}. Scored by the platform; adjusts to the student's answers.</td><td>60 min</td></tr>
<tr><td>Speaking</td><td>A virtual test administrator gives tasks. Students record answers with a headset microphone. Trained raters score them. Tasks are aimed at levels 1, 3 and 5.</td><td>50 min</td></tr>
<tr><td>Writing</td><td>Grades 1–3 write by hand; grades 4–12 type by default. Trained raters score the writing.</td><td>90 min</td></tr>
</tbody></table></div>
<p>The test is untimed. The times above are the most a session is planned to take; most students finish sooner, and times vary by tier.</p>
<h2>Grade-level clusters</h2>
<p>The online test is given in clusters: grade 1, grades 2–3, grades 4–5, grades 6–8 and grades 9–12. <strong>Grade 3 is in the 2–3 cluster.</strong> Kindergarten has its own paper test given one-on-one. Practice on this site follows the same clusters: <a href="/practice/grades-2-3/">2–3</a>, <a href="/practice/grades-4-5/">4–5</a>, <a href="/practice/grades-6-8/">6–8</a>.</p>
<h2>Proficiency levels</h2>
<ol>${LEVEL_NAMES.slice(1).map((n) => html`<li><strong>${n}</strong></li>`)}</ol>
<p>Scores are reported to one decimal, from 1.0 to 6.0. The whole number is the level; the decimal shows progress inside it.</p>
<h2>Composite scores</h2>
<ul><li><strong>Oral language</strong>: 50% Listening + 50% Speaking</li><li><strong>Literacy</strong>: 50% Reading + 50% Writing</li><li><strong>Comprehension</strong>: 70% Reading + 30% Listening</li><li><strong>Overall</strong>: 35% Reading + 35% Writing + 15% Listening + 15% Speaking</li></ul>
<p>WIDA computes composites from scale scores. The <a href="/tools/score-interpreter/">Score Interpreter</a> estimates them from proficiency levels.</p>
<div class="note amber"><p><strong>2025–26 change.</strong> WIDA held a standard-setting in July 2026. Scale scores from 2025–26 are a new baseline, and WIDA advises using 2025–26 proficiency levels with caution. ${approx()}</p></div>
<h2>Maryland</h2>
<p>Maryland has been a WIDA member since 2011. Its exit criterion is an Overall proficiency level of 4.5 or higher on WIDA ACCESS (checked 2026-11-27). Districts apply state rules; check with your district's English learner office.</p>
<p class="muted">Sources and the date each fact was checked are listed in the site's <a href="/about/#sources">sources note</a>.</p>
${onPageDisclaimer()}
</div>`;
}

function scoresGuide() {
  const meaning = [
    "Uses pictures, gestures and single words to understand and share simple ideas.",
    "Uses short phrases and simple sentences about familiar topics, with support.",
    "Uses connected sentences about school topics; errors may still affect meaning sometimes.",
    "Uses detailed, connected language on most school topics, with occasional errors.",
    "Uses academic language close to grade-level peers, with minor gaps in precision.",
    "Uses English across school topics at the level the test measures; ready for grade-level work without language support.",
  ];
  return html`<div class="wrap prose">
<div class="page-head"><span class="eyebrow">ACCESS Guide</span><h1>Reading a score report</h1><p class="lede">A score report shows a proficiency level for each skill and four composite scores. Here is what each part means, in plain language.</p></div>
<h2>What each level means</h2>
<div class="table-wrap"><table><thead><tr><th scope="col">Level</th><th scope="col">In plain words (our wording)</th></tr></thead><tbody>
${meaning.map((m, i) => html`<tr><td><strong>${i + 1} · ${LEVEL_NAMES[i + 1]}</strong></td><td>${m}</td></tr>`)}
</tbody></table></div>
<p>These descriptions are original summaries written for this site, not WIDA's official descriptors.</p>
<h2>Reading the numbers</h2>
<ul><li>A score of <strong>3.6</strong> in Reading means level 3 (Developing), more than halfway toward level 4.</li><li>Look at the <strong>lowest domain</strong>: it usually shows where to focus instruction.</li><li>Compare <strong>Oral</strong> and <strong>Literacy</strong>: a big gap often means a student talks more easily than they read and write, or the other way around.</li></ul>
<p><a class="btn" href="/tools/score-interpreter/">Open the Score Interpreter</a></p>
${onPageDisclaimer()}
</div>`;
}

function testDayGuide() {
  return html`<div class="wrap prose">
<div class="page-head"><span class="eyebrow">ACCESS Guide</span><h1>Getting ready for test day</h1><p class="lede">Most test-day problems are not about English. They are about headsets, nerves and not knowing the buttons. A little practice fixes all three.</p></div>
<h2>Two weeks before</h2><ul><li>Check every headset and microphone with the <a href="/tools/readiness-kit/">Readiness Kit</a>.</li><li>Let students record and play back their own voice so the speaking test is not a surprise.</li><li>Walk through a practice test screen together.</li><li>Send the family letter in English and Spanish.</li></ul>
<h2>The week of the test</h2><ul><li>Practice one short set in each skill: <a href="/practice/">Practice</a>.</li><li>Remind students the test is untimed and shows growth, not a grade.</li><li>Post the schedule and keep routines calm.</li></ul>
<h2>On the day</h2><ul><li>Start with a 2-minute breathing or stretch break.</li><li>Tell students: try every question; it is fine if some are hard, because the test adjusts.</li><li>Celebrate effort afterward, not scores.</li></ul>
<p><a class="btn" href="/tools/readiness-kit/">Open the Readiness Kit</a></p>
${onPageDisclaimer()}
</div>`;
}

function familiesGuide() {
  const two = (en, es) =>
    html`<div class="grid cols-2"><div class="panel" lang="en">${en}</div><div class="panel" lang="es">${es}</div></div>`;
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">ACCESS Guide</span><h1>For families · Para familias</h1><p class="lede">What the WIDA ACCESS test is and how you can help, in English and Spanish. <span lang="es">Qué es la prueba WIDA ACCESS y cómo puede ayudar, en inglés y en español.</span></p></div>
<section class="section"><h2>What is the test? · <span lang="es">¿Qué es la prueba?</span></h2>
${two(
  html`<p>Every year, students who are learning English take a test called WIDA ACCESS. It checks listening, reading, speaking and writing in English for school. It is not a grade, and it does not decide if your child passes.</p>`,
  html`<p>Cada año, los estudiantes que aprenden inglés toman una prueba llamada WIDA ACCESS. Mide cómo escuchan, leen, hablan y escriben en inglés para la escuela. No es una calificación y no decide si su hijo o hija aprueba el año.</p>`,
)}</section>
<section class="section"><h2>What do the scores mean? · <span lang="es">¿Qué significan los puntajes?</span></h2>
${two(
  html`<p>Scores go from 1 to 6. Higher numbers mean more English for school. In Maryland, a student with an Overall score of 4.5 or higher can leave English learner services. Ask the teacher what your child's scores mean.</p>`,
  html`<p>Los puntajes van del 1 al 6. Un número más alto significa más inglés para la escuela. En Maryland, un estudiante con un puntaje general de 4.5 o más puede salir de los servicios para estudiantes de inglés. Pregunte al maestro qué significan los puntajes de su hijo o hija.</p>`,
)}</section>
<section class="section"><h2>How can I help at home? · <span lang="es">¿Cómo puedo ayudar en casa?</span></h2>
${two(
  html`<ul><li>Talk with your child every day, in your home language. Strong home language helps English.</li><li>Ask about school: "What did you learn? Why?"</li><li>Read together, in any language, for 15 minutes.</li><li>Practice together on this site. Nothing is recorded or sent.</li></ul>`,
  html`<ul><li>Hable con su hijo o hija todos los días en su idioma. Un idioma fuerte en casa ayuda con el inglés.</li><li>Pregunte por la escuela: "¿Qué aprendiste? ¿Por qué?"</li><li>Lean juntos 15 minutos, en cualquier idioma.</li><li>Practiquen juntos en este sitio. No se graba ni se envía nada.</li></ul>`,
)}
<p class="btn-row section"><a class="btn" href="/practice/">Practice together · Practicar juntos</a> <a class="btn secondary" href="/access-practice-lab/family-start">Family activities · Actividades para familias</a></p></section>
<section class="section"><h2>Questions to ask the teacher · <span lang="es">Preguntas para el maestro</span></h2>
${two(
  html`<ul><li>When is my child's test?</li><li>What are my child's strongest and weakest skills?</li><li>How can I help with the weakest skill?</li></ul>`,
  html`<ul><li>¿Cuándo es la prueba de mi hijo o hija?</li><li>¿Cuáles son sus destrezas más fuertes y más débiles?</li><li>¿Cómo puedo ayudar con la destreza más débil?</li></ul>`,
)}</section>
<p class="muted">Spanish on this page is a draft awaiting review by a native speaker. <span lang="es">El español de esta página es un borrador pendiente de revisión.</span></p>
${onPageDisclaimer()}
</div>`;
}

/* ---------- about ---------- */
function about() {
  return html`<div class="wrap prose">
<div class="page-head"><span class="eyebrow">About</span><h1 data-i18n="nav.about">About</h1><p class="lede">The Language Page helps multilingual learners use English for school, and helps their teachers plan for it.</p></div>
<h2>Mission</h2><p>Every student who is learning English deserves practice that is free, calm and respectful, and every teacher deserves tools that save time instead of adding work. The Language Page offers both, for grades 3–8, with no accounts and no data collection.</p>
<h2>Who makes it</h2><p>The site is built by a Grade 6 math and ESOL teacher in Baltimore City Public Schools and is powered by <strong>EduWonderLab</strong>. Every practice item, frame and activity is original, written for this site.</p>
<h2>What it is not</h2><p>The Language Page is not an official WIDA product and does not use WIDA test items. Practice here is modeled on the general style of the test, so students know what to expect, and aligned to the WIDA ELD Standards Framework, 2020 Edition.</p>
<h2 id="sources">Sources</h2><p>Facts about WIDA ACCESS on this site were checked against WIDA's public pages and state documents on 2026-11-27. Anything not confirmed word for word is marked <span class="approx">approximate</span>, and standard codes not yet checked against the official source are marked <span class="approx">[VERIFY]</span>.</p>
<h2 id="contact">Contact</h2><p>A public contact address has not been published yet. Teachers in Baltimore City can reach the team through their ESOL office. This page will list an address when one is available.</p>
<h2>Also on this site</h2><ul><li><a href="/access-practice-lab/">The ACCESS Practice Lab</a>: hundreds more activities and practice tests.</li><li><a href="/access-teacher/">Teacher Hub</a>: class codes, WIDA data and practice tests.</li><li><a href="/access-practice-lab/method">How the Practice Lab works</a>.</li></ul>
${onPageDisclaimer()}
</div>`;
}
function privacy() {
  return html`<div class="wrap prose">
<div class="page-head"><span class="eyebrow">About</span><h1>Privacy</h1><p class="lede">Short version: the practice pages and teacher tools on The Language Page do not collect anything about students or teachers. Everything stays on your device.</p></div>
<h2>What we collect</h2><p><strong>Nothing about you.</strong> There are no accounts, no sign-ups, no advertising and no third-party trackers. The pages in Practice, Teacher Tools, Content + Language and the ACCESS Guide never send what you type, choose or record to any server.</p>
<h2>What stays on your device</h2><ul><li>Display settings (text size, colors, font) and your language choice.</li><li>Drafts in the teacher tools, so you can come back to them.</li><li>Speaking recordings exist only in the open page. They are never uploaded. If you want to keep one, use Download.</li></ul>
<p>These are stored in your browser's local storage. To remove them, clear this site's data in your browser settings.</p>
<h2>Share links</h2><p>A Game Maker share link holds the whole game inside the link itself. Nothing is stored on our server. Anyone with the link can open the game, so do not put student names in games.</p>
<h2>Scores</h2><p>The Score Interpreter works entirely in your browser. Nothing you enter is transmitted. Use initials or IDs, never full names.</p>
<h2>Children's privacy</h2><p>Because these pages collect no personal information, students can use them without an account and without sharing anything about themselves.</p>
<h2>The rest of the site</h2><p>Some other areas, such as the Teacher Hub's class features, have their own privacy notes. See the <a href="/access-practice-lab/privacy">Practice Lab privacy page</a> for those.</p>
${onPageDisclaimer()}
</div>`;
}
function accessibility() {
  return html`<div class="wrap prose">
<div class="page-head"><span class="eyebrow">About</span><h1>Accessibility</h1><p class="lede">We aim for WCAG 2.2 level AA on every page in Practice, Teacher Tools, Content + Language and the ACCESS Guide.</p></div>
<h2>Built in on every page</h2><ul><li>Full keyboard use, visible focus, skip link and clear landmarks.</li><li><strong>Display</strong> button: text size, light, dark and high-contrast colors, a reading-friendly font, roomy spacing and a line-focus ruler.</li><li>Read-aloud with the device voice: read a whole page, or turn on "tap a sentence to hear it". Choose the voice and speed.</li><li>Transcripts for every listening passage, and captions are not needed because no audio files are used.</li><li>Large touch targets, no autoplay, no flashing, and reduced motion when your device asks for it.</li><li>An English and Spanish interface.</li></ul>
<h2>How we check</h2><p>Every page is tested with automated tools (axe-core and Lighthouse) and in a real browser at phone, tablet and desktop sizes before it is published. Automated tests find only part of the problems that real users meet.</p>
<h2>Known limits</h2><ul><li>Read-aloud depends on the voices your device has. Some school devices have only one voice.</li><li>A screen-reader review by a person (NVDA and VoiceOver) has not been done yet.</li><li>Spanish interface text has not yet been reviewed by a native speaker.</li></ul>
<h2>Report a problem</h2><p>If something does not work for you, tell your teacher or school ESOL office so they can pass it on. We fix accessibility problems first.</p>
${onPageDisclaimer()}
</div>`;
}

/* ---------- styleguide ---------- */
function styleguide() {
  const sw = (name, v) =>
    html`<div><div class="swatch" data-swatch="${v}"></div><p class="muted">${name}<br><code>${v}</code></p></div>`;
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">Design system</span><h1>Style guide</h1><p class="lede">Tokens and components used by every front-layer page. One stylesheet: <code>/lp/assets/site.css</code>. No purple, violet or lavender anywhere.</p></div>
<section class="section"><h2>Colors</h2><div class="grid">${sw("Navy (primary)", "#17324d")}${sw("Teal (fill only)", "#1fa6a2")}${sw("Teal ink (text)", "#0b6e6a")}${sw("Amber (fill only)", "#f2c15b")}${sw("Background", "#f7f4ec")}${sw("Text", "#24323f")}${sw("Success", "#1b7a4b")}${sw("Error", "#b42318")}</div></section>
<section class="section"><h2>Type</h2><p class="specimen h1">Heading 1</p><p class="specimen h2">Heading 2</p><p class="specimen h3">Heading 3</p><p>Body text is Inter at 18px. Reading passages use <span class="reading">Atkinson Hyperlegible, a font made for low vision readers.</span></p></section>
<section class="section"><h2>Buttons</h2><div class="btn-row"><button class="btn" type="button">Primary</button><button class="btn secondary" type="button">Secondary</button><button class="btn ghost" type="button">Ghost</button><button class="btn small" type="button">Small</button><button class="btn" type="button" disabled>Disabled</button></div></section>
<section class="section"><h2>Cards and chips</h2><div class="grid cols-3"><article class="card"><span class="card-icon">${raw(icon("book"))}</span><h3><a class="card-link" href="#">A card</a></h3><p>The whole card is one link target.</p><div class="meta"><span class="chip">Chip</span><span class="chip teal">Teal</span><span class="chip amber">Amber</span></div></article></div></section>
<section class="section"><h2>Tabs</h2><div class="tabs" data-tabs><div role="tablist" aria-label="Demo tabs"><button type="button" role="tab" id="sg-t1" aria-controls="sg-p1" aria-selected="true">First</button><button type="button" role="tab" id="sg-t2" aria-controls="sg-p2" aria-selected="false" tabindex="-1">Second</button></div><div role="tabpanel" id="sg-p1" aria-labelledby="sg-t1"><p>First panel.</p></div><div role="tabpanel" id="sg-p2" aria-labelledby="sg-t2" hidden><p>Second panel.</p></div></div></section>
<section class="section"><h2>Accordion</h2><details class="accordion"><summary><span>Show more</span></summary><div class="body"><p>Hidden content.</p></div></details></section>
<section class="section"><h2>Modal and toast</h2><div class="btn-row"><button type="button" class="btn secondary" data-open-display>Open the Display modal</button><button type="button" class="btn secondary" data-demo-toast>Show a toast</button></div></section>
<section class="section"><h2>Form fields</h2><div class="grid cols-2"><div class="field"><label for="sg-in">Text field</label><input type="text" id="sg-in" value="Hello"><span class="hint">A hint under the field.</span></div><div class="field"><label for="sg-sel">Select</label><select id="sg-sel"><option>One</option><option>Two</option></select></div></div><label class="check"><input type="checkbox" checked> <span>Checkbox</span></label></section>
<section class="section"><h2>Audio player</h2><div class="btn-row"><button type="button" class="btn" data-say="This is the read-aloud audio player.">${raw(icon("play"))} Play</button></div></section>
<section class="section"><h2>Progress</h2><p class="progress-label">3 of 6</p><div class="progress" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" aria-label="Progress"><span data-progress-demo></span></div></section>
<section class="section"><h2>Empty state</h2><div class="empty"><p>Nothing here yet.</p></div></section>
<section class="section"><h2>Filter bar</h2><div class="filter-bar"><div class="field"><label for="sg-f">Grades</label><select id="sg-f"><option>All</option></select></div></div></section>
<section class="section"><h2>Notes</h2><p class="note">A teal note.</p><p class="note amber">An amber note. <span class="approx">approximate</span></p></section>
<section class="section"><h2>Print header</h2><p>Every printable page starts with a print header (name and date lines) that only appears on paper.</p></section>
</div>`;
}

/* ---------- assemble ---------- */
export function renderAll(data, assets) {
  const i18n = data.i18n.strings;
  const pages = [];
  const routes = [];
  const searchIndex = [];
  const add = (p) => {
    const htmlText = page({ ...p, assets, i18n });
    pages.push({ path: p.path, html: htmlText });
    routes.push({ path: p.path, title: p.title, noindex: !!p.noindex, mic: !!p.mic });
  };
  const crumb = (label, href) => ({ label, href });

  add({
    path: "/",
    title: SITE.name,
    description:
      "Free, original WIDA ACCESS practice for grades 3–8 and classroom tools for teachers of multilingual learners. No login, no data collected.",
    navKey: "",
    body: home(data),
    jsonld: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: `${SITE.origin}/`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE.origin}/search/?q={query}`,
        "query-input": "required name=query",
      },
    },
  });

  // Practice
  add({
    path: "/practice/",
    title: "Practice",
    description:
      "WIDA ACCESS practice in listening, reading, speaking and writing for grades 2–3, 4–5 and 6–8. Original, tiered, free.",
    navKey: "practice",
    crumbs: [crumb("Practice", "/practice/")],
    body: practiceHome(data),
  });
  for (const c of CLUSTERS) {
    add({
      path: `/practice/${c.slug}/`,
      title: `${c.label} practice`,
      description: `WIDA ACCESS practice for ${c.label.toLowerCase()}: listening, reading, speaking and writing.`,
      navKey: "practice",
      crumbs: [crumb("Practice", "/practice/"), crumb(c.label, `/practice/${c.slug}/`)],
      body: clusterPage(data, c),
    });
    for (const d of DOMAINS) {
      add({
        path: `/practice/${c.slug}/${d.slug}/`,
        title: `${d.label} · ${c.label}`,
        description: `${d.label} practice sets for ${c.label.toLowerCase()}, tiered from levels 1–2 to level 5.`,
        navKey: "practice",
        crumbs: [
          crumb("Practice", "/practice/"),
          crumb(c.label, `/practice/${c.slug}/`),
          crumb(d.label, `/practice/${c.slug}/${d.slug}/`),
        ],
        body: domainPage(data, c, d),
      });
      searchIndex.push({
        k: "practice",
        t: `${d.label} practice, ${c.label}`,
        u: `/practice/${c.slug}/${d.slug}/`,
        d: d.verb,
        g: c.slug,
        dom: d.slug,
      });
    }
  }
  for (const s of data.practice) {
    const c = CLUSTERS.find((x) => x.slug === s.cluster);
    const d = DOMAINS.find((x) => x.slug === s.domain);
    const levels = [...new Set((s.items || s.tasks).map((x) => x.pl))];
    add({
      path: setPath(s),
      title: `${s.title} · ${d.label} ${c.short}`,
      description: s.summary,
      navKey: "practice",
      crumbs: [
        crumb("Practice", "/practice/"),
        crumb(c.label, `/practice/${c.slug}/`),
        crumb(d.label, `/practice/${c.slug}/${d.slug}/`),
        crumb(s.title, setPath(s)),
      ],
      body: setPage(s, data),
      scripts: ["/lp/assets/practice.js"],
      data: { "set-data": setClientData(s) },
      mic: s.domain === "speaking",
      jsonld: {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: s.title,
        description: s.summary,
        learningResourceType: "Practice activity",
        educationalLevel: c.label,
        inLanguage: "en",
        isAccessibleForFree: true,
        teaches: `${ELD[s.eld]} (${s.klu})`,
        url: `${SITE.origin}${setPath(s)}`,
      },
    });
    searchIndex.push({
      k: "practice",
      t: s.title,
      u: setPath(s),
      d: s.summary,
      g: s.cluster,
      dom: s.domain,
      a: s.contentArea,
      pl: levels,
      klu: s.klu,
    });
  }

  // Tools
  add({
    path: "/tools/",
    title: "Teacher Tools",
    description:
      "Free classroom tools for teachers of multilingual learners: Game Maker, Activity Builder, sentence frames, scaffolds, ACCESS score interpreter and more.",
    navKey: "tools",
    crumbs: [crumb("Teacher Tools", "/tools/")],
    body: tp.toolsHome(data),
  });
  for (const tool of data.tools.tools) {
    add({
      path: `/tools/${tool.slug}/`,
      title: tool.title,
      description: tool.summary,
      navKey: "tools",
      crumbs: [crumb("Teacher Tools", "/tools/"), crumb(tool.title, `/tools/${tool.slug}/`)],
      body: TOOL_RENDER[tool.slug](tool, data),
      scripts: [`/lp/assets/tools/${tool.slug}.js`],
      mic: tool.slug === "readiness-kit",
      data:
        tool.slug === "frame-generator" ||
        tool.slug === "warm-ups" ||
        tool.slug === "scaffold-generator"
          ? { banks: data.banks }
          : undefined,
    });
    searchIndex.push({ k: "tool", t: tool.title, u: `/tools/${tool.slug}/`, d: tool.summary });
  }
  add({
    path: "/tools/game-maker/play/",
    title: "Play a game",
    description: "Play a game made with The Language Page Game Maker.",
    navKey: "tools",
    crumbs: [
      crumb("Teacher Tools", "/tools/"),
      crumb("Game Maker", "/tools/game-maker/"),
      crumb("Play", "/tools/game-maker/play/"),
    ],
    body: tp.gamePlayPage(),
    scripts: ["/lp/assets/tools/game-play.js"],
    noindex: true,
  });

  // Content + Language
  add({
    path: "/content/",
    title: "Content + Language",
    description:
      "Math, science, ELA and social studies lessons with WIDA language demands, frames in three proficiency bands, vocabulary and activities.",
    navKey: "content",
    crumbs: [crumb("Content + Language", "/content/")],
    body: contentHome(data),
  });
  for (const a of AREAS) {
    const units = data.units.filter((u) => u.area === a.slug);
    if (!units.length) continue;
    add({
      path: `/content/${a.slug}/`,
      title: `${a.label} · Content + Language`,
      description: `${a.label} units with language demands mapped to ${a.eld}.`,
      navKey: "content",
      crumbs: [crumb("Content + Language", "/content/"), crumb(a.label, `/content/${a.slug}/`)],
      body: areaPage(data, a),
    });
    for (const g of [...new Set(units.map((u) => u.grade))]) {
      add({
        path: `/content/${a.slug}/grade-${g}/`,
        title: `Grade ${g} ${a.label}`,
        description: `Grade ${g} ${a.label} units with language objectives, frames and vocabulary.`,
        navKey: "content",
        crumbs: [
          crumb("Content + Language", "/content/"),
          crumb(a.label, `/content/${a.slug}/`),
          crumb(`Grade ${g}`, `/content/${a.slug}/grade-${g}/`),
        ],
        body: gradePage(data, a, g),
      });
    }
  }
  for (const u of data.units) {
    const a = AREAS.find((x) => x.slug === u.area);
    add({
      path: unitPath(u),
      title: `${u.title} · Grade ${u.grade} ${a.label}`,
      description: u.summary,
      navKey: "content",
      crumbs: [
        crumb("Content + Language", "/content/"),
        crumb(a.label, `/content/${a.slug}/`),
        crumb(`Grade ${u.grade}`, `/content/${a.slug}/grade-${u.grade}/`),
        crumb(u.title, unitPath(u)),
      ],
      body: unitPage(u),
      jsonld: {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: u.title,
        description: u.summary,
        educationalLevel: `Grade ${u.grade}`,
        learningResourceType: "Lesson plan",
        isAccessibleForFree: true,
        educationalAlignment: [
          {
            "@type": "AlignmentObject",
            alignmentType: "teaches",
            educationalFramework: u.standard.framework,
            targetName: u.standard.code,
          },
          {
            "@type": "AlignmentObject",
            alignmentType: "teaches",
            educationalFramework: "WIDA ELD Standards Framework 2020",
            targetName: u.eld,
          },
        ],
        url: `${SITE.origin}${unitPath(u)}`,
      },
    });
    searchIndex.push({
      k: "content",
      t: u.title,
      u: unitPath(u),
      d: `${u.summary} ${u.standard.code}. ${u.vocabulary.map((v) => v.term).join(", ")}`,
      a: a.label,
      g: u.grade <= 3 ? "grades-2-3" : u.grade <= 5 ? "grades-4-5" : "grades-6-8",
      klu: u.klu,
    });
  }

  // ACCESS guide
  const g = [
    [
      "/access-guide/",
      "ACCESS Guide",
      "Plain-language help with the WIDA ACCESS test for teachers, students and families.",
      guideHome,
    ],
    [
      "/access-guide/what-is-access/",
      "What WIDA ACCESS is",
      "The four domains, grade clusters, proficiency levels 1–6, composite scores and the online test format.",
      whatIsAccess,
    ],
    [
      "/access-guide/scores/",
      "Reading a score report",
      "What WIDA ACCESS proficiency levels and composite scores mean, in plain language.",
      scoresGuide,
    ],
    [
      "/access-guide/test-day/",
      "Getting ready for test day",
      "Device checks, practice screens and calm routines for WIDA ACCESS test day.",
      testDayGuide,
    ],
    [
      "/access-guide/families/",
      "For families · Para familias",
      "What the WIDA ACCESS test is and how families can help, in English and Spanish.",
      familiesGuide,
    ],
  ];
  for (const [path, title, description, fn] of g) {
    add({
      path,
      title,
      description,
      navKey: "guide",
      crumbs:
        path === "/access-guide/"
          ? [crumb("ACCESS Guide", path)]
          : [crumb("ACCESS Guide", "/access-guide/"), crumb(title, path)],
      body: fn(),
    });
    searchIndex.push({ k: "guide", t: title, u: path, d: description });
  }

  // About
  add({
    path: "/about/",
    title: "About",
    description: "The mission of The Language Page and who makes it.",
    navKey: "about",
    crumbs: [crumb("About", "/about/")],
    body: about(),
  });
  add({
    path: "/about/privacy/",
    title: "Privacy",
    description:
      "The Language Page practice and teacher tools collect nothing. Everything stays on your device.",
    navKey: "about",
    crumbs: [crumb("About", "/about/"), crumb("Privacy", "/about/privacy/")],
    body: privacy(),
  });
  add({
    path: "/about/accessibility/",
    title: "Accessibility",
    description: "How The Language Page supports every learner, and how we test it.",
    navKey: "about",
    crumbs: [crumb("About", "/about/"), crumb("Accessibility", "/about/accessibility/")],
    body: accessibility(),
  });
  searchIndex.push(
    {
      k: "guide",
      t: "Privacy",
      u: "/about/privacy/",
      d: "Nothing is collected; everything stays on your device.",
    },
    {
      k: "guide",
      t: "Accessibility",
      u: "/about/accessibility/",
      d: "Display settings, read-aloud, keyboard use and how we test.",
    },
  );

  add({
    path: "/search/",
    title: "Search",
    description:
      "Search practice sets, teacher tools, content units and guides on The Language Page.",
    navKey: "",
    crumbs: [crumb("Search", "/search/")],
    body: searchPage(),
    scripts: ["/lp/assets/search.js"],
  });
  add({
    path: "/styleguide/",
    title: "Style guide",
    description: "Design tokens and components for The Language Page.",
    navKey: "",
    crumbs: [crumb("Style guide", "/styleguide/")],
    body: styleguide(),
    scripts: ["/lp/assets/styleguide.js"],
    noindex: true,
  });

  return { pages, searchIndex, routes, unitsForTools: data.units.map(unitToolData) };
}
