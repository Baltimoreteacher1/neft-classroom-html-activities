// Reading Room: a digital reading environment. The shelf lists authored lessons; a lesson pairs a calm reading
// column (passage, optional word support, paragraph marks, saved place) with a separate response area.
// Everything is saved on this device only; nothing here is a score or a proficiency level.
import { findActivity, loadReadingAdventures, loadReadingRoomLessons, loadReadingStrategies } from "../content.js";
import { ART, BASE, esc, icon, raw, toHtml } from "../util.js";
import { canSpeak, speak, stop as stopSpeech } from "../speech.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import {
  loadReadingState,
  saveReadingState,
  clearReadingState,
} from "../reading-state.js";

let query = "";
let grade = "";
let genreFilter = "";
let lengthFilter = "";
let onlyBookmarks = false;
let activePhase = "first";
let activeMode = "practice";
let openedLessonId = "";
let notice = "";

const ic = (name) => toHtml(icon(name));
const lessonUrl = (id) => `${BASE}/reading-room/${encodeURIComponent(id)}`;
const stateKey = (l) => `${l.id}@${l.revision}`;
const gradeLabel = (l) =>
  l.gradeCluster
    ? `Grades ${l.gradeCluster.replace("-", "–")}`
    : `Grades ${l.localGradeBand || "3–5"} local · WIDA cluster unspecified`;
const passageWords = (l) =>
  l.paragraphs.reduce(
    (count, p) => count + p.text.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
const lengthLabelOf = (words) =>
  words >= 350
    ? "Sustained read"
    : words >= 180
      ? "Extended practice"
      : "Short practice";
const clusterParam = () =>
  new URLSearchParams(location.search).get("cluster") || "6-8";
const CLUSTERS = ["1", "2-3", "4-5", "6-8", "9-12"];
const clusterOptions = (selected) =>
  CLUSTERS.map(
    (g) =>
      `<option value="${g}" ${g === selected ? "selected" : ""}>Grades ${g.replace("-", "–")}</option>`,
  ).join("");
const MARKS = [
  "Main idea",
  "Important detail",
  "Evidence",
  "Vocabulary",
  "Inference",
  "Question",
];
const LINE_SPACINGS = [
  ["1.5", "Compact"],
  ["1.75", "Comfortable"],
  ["2", "Open"],
];
const SPEECH_RATES = [
  ["0.8", "Slow"],
  ["0.95", "Natural"],
  ["1.1", "Faster"],
];

const ORGANIZERS = [
  {id:"main-details",title:"Main Idea · Supporting Details",fields:[["mainIdea","Main idea"],["detail1","Important detail 1"],["detail2","Important detail 2"],["paragraphRef","Paragraph evidence"]]},
  {id:"sequence",title:"Sequence · Timeline",fields:[["sequenceStart","First event or step"],["sequenceNext","Next event or step"],["sequenceThen","Then"],["sequenceEnd","Final event or result"]]},
  {id:"cause-effect",title:"Cause · Effect",fields:[["cause","Cause"],["effect","Effect"],["causeLink","How are they connected?"],["causeEvidence","Evidence paragraph"]]},
  {id:"compare",title:"Compare · Contrast",fields:[["compareA","Idea or source A"],["compareB","Idea or source B"],["compareLink","What is similar or different?"],["compareEvidence","Evidence from each source"]]},
  {id:"problem-solution",title:"Problem · Solution",fields:[["problem","Problem"],["problemEvidence","Evidence of the problem"],["solution","Proposed solution"],["result","Likely result or remaining question"]]},
  {id:"cer",title:"Claim · Evidence · Reasoning",fields:[["claim","Claim"],["evidence","Evidence"],["reasoning","Reasoning: how evidence supports the claim"]]},
  {id:"character",title:"Character Analysis",fields:[["character","Character"],["goal","Goal or motivation"],["challenge","Challenge"],["change","Change and evidence"]]},
  {id:"story",title:"Story Elements",fields:[["setting","Setting"],["characters","Important characters"],["conflict","Problem or conflict"],["events","Key events and resolution"]]},
  {id:"summary",title:"Concise Summary",fields:[["summaryTopic","Who or what is the text about?"],["summaryIdea","Central idea or event"],["summaryDetail","One accurate detail"],["summaryDraft","Write a concise summary"]]},
  {id:"word-web",title:"Word Relationships",fields:[["wordRoot","Focus word or root"],["wordFamily","Related forms or word family"],["wordCollocation","Words often used with it"],["wordSentence","New sentence showing the meaning"]]},
  {id:"text-structure",title:"Text Structure Explorer",fields:[["structure","Structure (sequence, cause/effect, compare, etc.)"],["signalWords","Signal words"],["evidenceOrganization","How are ideas organized?"],["structureEffect","How does the structure help the reader?"]]},
  {id:"two-source",title:"Two-Source Synthesis",fields:[["sourceOne","Source 1: claim and evidence"],["sourceTwo","Source 2: claim and evidence"],["sharedIdea","Shared idea or disagreement"],["synthesis","Conclusion supported by both sources"]]},
  {id:"evidence-table",title:"Evidence Collection",fields:[["evidenceQuestion","Question to investigate"],["evidenceOne","Evidence detail 1"],["evidenceTwo","Evidence detail 2"],["evidenceReasoning","What do the details support?"]]},
  {id:"vocabulary-map",title:"Vocabulary Concept Map",fields:[["conceptWord","Focus word"],["conceptMeaning","Meaning in this text"],["conceptFeatures","Examples or features"],["conceptConnections","Related words, roots, or concepts"],["conceptUse","Use it in a new sentence"]]},
];
;
const renderOrganizers = (lessonId, progress) =>
  `<details class="rr-organizers"><summary>${ic("list")} Graphic organizers · ${ORGANIZERS.length} editable tools</summary><p>Write, revise, and save an organizer. Responses stay in this browser.</p>${ORGANIZERS.map(
    (o) =>
      `<details class="rr-organizer"><summary>${esc(o.title)}</summary><div class="rr-organizer-grid">${o.fields
        .map(
          ([key, label]) =>
            `<label>${esc(label)}<textarea data-rr-organizer="${esc(key)}" data-rr-lesson="${esc(lessonId)}" rows="2">${esc(progress.organizer?.[key] || "")}</textarea></label>`,
        )
        .join("")}</div></details>`,
  ).join(
    "",
  )}<button type="button" class="btn small" data-rr-print>${ic("print")} Print lesson and organizers</button></details>`;

/** Page header shared by the shelf's sub-pages. */
const pageHeader = (eyebrow, title, intro, extra = "") =>
  `<header class="rr-title"><p class="rr-eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1>${intro}${extra}</header>`;
const backLink = (to, label) =>
  `<a class="rr-link rr-return" href="${to}">${ic("arrow-left")} ${label}</a>`;

// ── shelf ───────────────────────────────────────────────────────────────────────────────────────────────────────────

function lessonCard(l, state) {
  const p = state.lessons[stateKey(l)] || {};
  const words = passageWords(l);
  const action = p.completed
    ? "Read again"
    : p.started
      ? "Continue reading"
      : "Open lesson";
  return `<article class="rr-book"><div class="rr-book-mark" aria-hidden="true">${ic("reading")}<span>${esc(l.subject)}</span></div><div class="rr-book-copy"><p class="rr-eyebrow">${esc(gradeLabel(l))} · ${esc(l.genre)} · ${l.minutes} min · ${lengthLabelOf(words)} · ${words} words</p><h2><a href="${lessonUrl(l.id)}">${esc(l.title)}</a></h2><p class="rr-summary">${esc(l.summary)}</p><p class="rr-meta">${esc(l.keyUse)} · ${esc(l.languageFunction)}</p><p class="rr-review-status">Editorial review pending</p><a class="rr-link" href="${lessonUrl(l.id)}">${action}<span aria-hidden="true"> →</span></a></div></article>`;
}

function filterLessons(lessons, state) {
  return lessons.filter((l) => {
    const words = passageWords(l);
    const inGrade =
      !grade ||
      (grade === "3-5-local"
        ? !l.gradeCluster && l.localGradeBand === "3-5"
        : l.gradeCluster === grade);
    const inLength =
      !lengthFilter ||
      (lengthFilter === "short"
        ? words < 180
        : lengthFilter === "extended"
          ? words >= 180 && words < 350
          : words >= 350);
    const hay =
      `${l.title} ${l.summary} ${l.genre} ${l.subject} ${l.topics.join(" ")} ${l.languageFunction}`.toLowerCase();
    return (
      inGrade &&
      (!genreFilter || l.genre === genreFilter) &&
      inLength &&
      (!onlyBookmarks || state.bookmarks.includes(l.id)) &&
      (!query || hay.includes(query.toLowerCase()))
    );
  });
}

function shelfHTML(ctx, lessons, state) {
  const filtered = filterLessons(lessons, state);
  const last = lessons.find((l) => l.id === state.lastRead);
  const recentRows = state.recent
    .map((rid) => lessons.find((l) => l.id === rid))
    .filter(Boolean)
    .slice(0, 5);
  const genres = [...new Set(lessons.map((l) => l.genre))].sort();
  const lastProgress = last ? state.lessons[stateKey(last)] || {} : {};
  return `<section class="rr-shell d-reading"><header class="rr-hero"><div><p class="rr-eyebrow">${ic("reading")} ACCESS Practice Lab · Reading</p><h1>Reading Room</h1><p class="rr-lead">Read closely, collect evidence, and build the language to explain what a text means.</p><div class="rr-chips"><span>Original classroom practice</span><span>Saved on this device</span><span>WIDA-informed instruction · not an official assessment</span><span>Editorial review pending · teacher preview</span></div></div><div class="rr-hero-art" aria-hidden="true"><img src="${ART}/domain-reading.svg" alt="" width="480" height="360"></div></header>
    <section class="rr-adventure-entry"><div><p class="rr-eyebrow">Serialized Reading Adventures</p><h2>Follow a story. Gather clues. Explain what changed.</h2><p>Original six-chapter mysteries and investigations with saved chapter notes, evidence responses, and comprehension checks.</p></div><a class="btn btn-primary" href="${BASE}/reading-room/adventures">Explore the adventures</a></section>
    <section class="rr-adventure-entry"><div><p class="rr-eyebrow">Reading Strategy Academy</p><h2>Learn a strategy, practice it, then transfer it.</h2><p>Short think-alouds and guided lessons help readers predict, investigate, clarify, summarize, and synthesize across new texts.</p></div><a class="btn btn-primary" href="${BASE}/reading-room/strategies">Explore strategy lessons</a></section>
    ${last ? `<section class="rr-continue"><span class="rr-continue-icon" aria-hidden="true">${ic("bookmark")}</span><div><p class="rr-eyebrow">Pick up where you left off</p><h2>${esc(last.title)}</h2><p>${lastProgress.phase ? "Your lesson progress is saved on this device." : "Your reading place is ready."}</p></div><a class="btn btn-primary btn-domain" href="${lessonUrl(last.id)}">Continue reading</a></section>` : ""}
    ${recentRows.length ? `<section class="rr-recent"><h2>Recently read</h2><ul>${recentRows.map((l) => `<li><a href="${lessonUrl(l.id)}">${esc(l.title)}</a></li>`).join("")}</ul></section>` : ""}
    <section class="rr-library" aria-labelledby="rr-library-title"><div class="rr-library-head"><div><p class="rr-eyebrow">The reading shelf</p><h2 id="rr-library-title">Choose a text</h2></div></div>
      <div class="rr-filters"><label class="rr-search">Search texts <input data-rr-search type="search" value="${esc(query)}" placeholder="Topic, skill, or title"></label><label class="rr-filter">Genre<select data-rr-genre><option value="">All genres</option>${genres.map((g) => `<option value="${esc(g)}" ${genreFilter === g ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></label><label class="rr-filter">Grade cluster<select data-rr-grade><option value="">All clusters</option>${clusterOptions(grade)}<option value="3-5-local" ${grade === "3-5-local" ? "selected" : ""}>Grades 3–5 local · WIDA cluster unspecified</option></select></label><label class="rr-filter">Reading length<select data-rr-length><option value="">Any length</option><option value="short" ${lengthFilter === "short" ? "selected" : ""}>Short practice · under 180 words</option><option value="extended" ${lengthFilter === "extended" ? "selected" : ""}>Extended practice · 180–349 words</option><option value="sustained" ${lengthFilter === "sustained" ? "selected" : ""}>Sustained reads · 350+ words</option></select></label></div>
      <div class="rr-count-row"><p class="rr-count" aria-live="polite">${filtered.length} of ${lessons.length} authored reading lessons</p><button type="button" class="rr-reset" data-rr-bookmark-filter aria-pressed="${onlyBookmarks}">${ic("bookmark")} ${onlyBookmarks ? "Showing bookmarks" : "Show bookmarks only"}</button></div>
      <div class="rr-books">${filtered.length ? filtered.map((l) => lessonCard(l, state)).join("") : `<div class="rr-empty"><img src="${ART}/empty.svg" alt="" width="240" height="180"><h3>No texts match yet</h3><p>Try another topic, grade cluster, or reading length.</p></div>`}</div></section>
    <section class="rr-legacy"><div><p class="rr-eyebrow">More short practice</p><h2>Existing Reading activities</h2><p>Open the established ACCESS Lab Reading activities. These short practices are separate from the authored multi-part lessons above.</p></div><a class="btn" href="${BASE}/Reading?grades=${esc(ctx.band)}">Browse Reading practice ${ic("arrow-right")}</a></section>
    <section class="rr-tools"><div><h2>Your reading tools</h2><p>Bookmarks, annotations, preferences, and lesson progress stay in this browser. They are not synced across devices.</p><ul class="rr-tool-links"><li><a href="${BASE}/vocabulary?grades=${esc(ctx.band)}">${ic("words")} Open Word Builder</a></li><li><a href="${BASE}/reading-room/words">${ic("bookmark")} Open Reading Word Notebook (${state.words.length})</a></li><li><a href="${BASE}/reading-room/family">${ic("families")} Family reading at home</a></li><li><a href="${BASE}/reading-room/teacher">${ic("teacher")} Local teacher progress view</a></li><li><a href="${BASE}/reading-room/pathways">${ic("road")} Workshop pathways</a></li></ul></div><div class="rr-tools-reset"><button type="button" class="rr-reset" data-rr-action="clear">Clear local Reading Room data</button>${notice ? `<p role="status">${esc(notice)}</p>` : ""}</div></section></section>`;
}

const adventureUrl = (id) => `${BASE}/reading-room/adventure-${encodeURIComponent(id)}`;

const strategyUrl = (id) => `${BASE}/reading-room/strategy-${encodeURIComponent(id)}`;
const STRATEGY_STRANDS = {
  "predict-connect": "Predict and connect",
  "question-investigate": "Question and investigate",
  "clarify-explore": "Clarify and explore words",
  "summarize-synthesize": "Summarize and synthesize",
};
const STRATEGY_SKILL_LABELS = {
  prediction: "Make and revise predictions",
  "question-generation": "Generate useful questions",
  "literal-retrieval": "Locate explicit information",
  "inference-strategy": "Make evidence-based inferences",
  "evidence-selection-strategy": "Select strong evidence",
  "vocabulary-clarification-strategy": "Clarify unfamiliar words",
  morphology: "Use meaningful word parts",
  "rereading-purpose": "Reread with a purpose",
  "central-idea-strategy": "Identify a central idea",
  summarization: "Summarize essential information",
  synthesis: "Synthesize ideas across texts",
  sequence: "Summarize in sequence",
  "cause-effect": "Summarize cause and effect",
};

function strategiesHTML(data, state) {
  const strand = new URLSearchParams(location.search).get("strand") || "";
  const cluster = new URLSearchParams(location.search).get("cluster") || "";
  const lessons = data.lessons.filter((lesson) => (!strand || lesson.strand === strand) && (!cluster || lesson.gradeCluster === cluster));
  const cards = lessons.map((lesson) => {
    const saved = state.strategies[lesson.id] || {};
    const status = saved.independent?.checked ? "Independent transfer completed" : saved.guided?.checked ? "Guided practice saved" : "New lesson";
    return `<article class="rr-strategy-card"><p class="rr-eyebrow">Grades ${esc(lesson.gradeCluster.replace("-", "–"))} · ${esc(STRATEGY_STRANDS[lesson.strand])}</p><h2><a href="${strategyUrl(lesson.id)}">${esc(lesson.title)}</a></h2><p><b>Strategy:</b> ${esc(STRATEGY_SKILL_LABELS[lesson.skill] || lesson.skill.replaceAll("-", " "))}</p><p class="rr-adventure-progress">${esc(status)}</p><a class="rr-link" href="${strategyUrl(lesson.id)}">${saved.independent?.checked ? "Practice again" : saved.guided?.checked ? "Continue lesson" : "Start lesson"} →</a></article>`;
  }).join("");
  return shell(`${backLink(`${BASE}/reading-room`, "Return to the Reading Room")}${pageHeader("Model · guided practice · independent transfer", "Reading Strategy Academy", "<p>Each lesson makes a reading move visible, gives you a chance to explain your thinking, and ends with a new passage to try independently. Results are practice evidence, not a reading level.</p>")}<div class="rr-strategy-filters"><label>Strategy strand<select data-strategy-strand><option value="">All strands</option>${Object.entries(STRATEGY_STRANDS).map(([id, title]) => `<option value="${id}" ${strand === id ? "selected" : ""}>${esc(title)}</option>`).join("")}</select></label><label>Grade cluster<select data-strategy-cluster><option value="">All clusters</option><option value="3-5" ${cluster === "3-5" ? "selected" : ""}>Grades 3–5</option><option value="6-8" ${cluster === "6-8" ? "selected" : ""}>Grades 6–8</option></select></label></div><p class="rr-count" aria-live="polite">${lessons.length} original strategy lessons</p><div class="rr-strategy-grid">${cards || `<p>No lessons match these filters.</p>`}</div>`);
}

function strategyLessonHTML(lesson, state) {
  const saved = state.strategies[lesson.id] || {};
  const renderQuestion = (stage, task) => {
    const response = saved[stage] || {};
    const checked = response.checked === true;
    const selected = task.options.map((option, i) => `<label><input type="radio" name="strategy-${stage}" value="${i}" data-strategy-choice="${stage}" ${response.selected === i ? "checked" : ""}> ${esc(option)}</label>`).join("");
    const feedback = checked ? `<p role="status" class="rr-adventure-feedback ${response.correct ? "is-correct" : "is-revisit"}">${response.correct ? "That response is supported. " : "Revisit the clue, then try again. "}${esc(response.correct ? task.explanation : task.feedback?.[response.selected] || task.explanation)}</p>` : "";
    const retry = checked && !response.correct ? `<button class="btn small" type="button" data-strategy-retry="${stage}">Try this question again</button>` : "";
    return `<fieldset class="rr-adventure-choice"><legend>${esc(task.question)}</legend>${selected}<label class="rr-strategy-explain">Explain your thinking<textarea rows="3" data-strategy-explanation="${stage}" placeholder="Name a clue and explain how it supports your idea.">${esc(response.explanation || "")}</textarea></label><button class="btn small" type="button" data-strategy-check="${stage}" ${response.selected == null || !response.explanation?.trim() || (checked && response.correct) ? "disabled" : ""}>${checked && response.correct ? "Checked" : "Check my thinking"}</button>${retry}${feedback}</fieldset>`;
  };
  const completed = saved.independent?.checked && saved.independent?.correct;
  const independentReady = saved.guided?.checked && saved.guided?.correct;
  const model = independentReady ? "" : `<section class="rr-strategy-stage"><h2>1. Watch: a reader thinks aloud</h2><blockquote><p>${esc(lesson.model.text)}</p><p><b>Think-aloud:</b> ${esc(lesson.model.think)}</p></blockquote></section>`;
  const guided = independentReady ? "" : `<section class="rr-strategy-stage"><h2>2. Practice together</h2><p>${esc(lesson.guided.text)}</p>${renderQuestion("guided", lesson.guided)}</section>`;
  const transfer = independentReady
    ? `<section class="rr-strategy-stage"><h2>3. Try independently: new passage</h2><p>${esc(lesson.independent.text)}</p>${renderQuestion("independent", lesson.independent)}<p class="rr-help">This fresh passage is checked separately from guided practice. No hints are provided in this step.</p></section>`
    : `<section class="rr-strategy-stage rr-strategy-locked"><h2>3. Independent transfer</h2><p>First complete guided practice. Then you will apply the strategy to a new passage.</p></section>`;
  return shell(`${backLink(`${BASE}/reading-room/strategies`, "All strategy lessons")}<header class="rr-adventure-heading"><p class="rr-eyebrow">Grades ${esc(lesson.gradeCluster.replace("-", "–"))} · ${esc(STRATEGY_STRANDS[lesson.strand])}</p><h1>${esc(lesson.title)}</h1><p>Strategy focus: <b>${esc(STRATEGY_SKILL_LABELS[lesson.skill] || lesson.skill.replaceAll("-", " "))}</b></p><p>Work is saved on this device. Your answer text stays here; the learning record stores only whether the keyed response was correct.</p></header><ol class="rr-strategy-steps" aria-label="Lesson sequence"><li>Watch a reader think</li><li>Practice together</li><li>Try independently</li></ol>${model}${guided}${transfer}${completed ? `<section role="status" class="rr-adventure-feedback is-correct"><h2>Independent transfer complete</h2><p>You used the strategy on a new passage. Revisit the lesson any time to practice again.</p><a href="${BASE}/reading-room/strategies">Choose another strategy →</a></section>` : ""}<p class="rr-status" role="status">Progress saves automatically in this browser.</p>`);
}

function adventuresHTML(stories, state) {
  return shell(`${backLink(`${BASE}/reading-room`, "Return to the Reading Room")}${pageHeader("Original serialized stories · saved on this device", "Reading Adventures", "<p>Read one chapter at a time. Make predictions, check an idea against the text, and keep a short chapter recap. Work stays in this browser and is not an official assessment.</p>")}<div class="rr-adventure-grid">${stories.map((story) => {
    const progress = state.adventures[story.id] || {};
    const chapter = Math.min(progress.chapter || 0, story.chapters.length - 1);
    const done = progress.completed === true;
    return `<article class="rr-adventure-card"><p class="rr-eyebrow">Grades ${esc(story.gradeCluster.replace("-", "–"))} · ${esc(story.genre)} · 6 chapters</p><h2><a href="${adventureUrl(story.id)}">${esc(story.title)}</a></h2><p>${esc(story.summary)}</p><p><b>Language focus:</b> ${esc(story.skill)}</p><p class="rr-adventure-progress">${done ? "Completed" : progress.started ? `Chapter ${chapter + 1} of 6 · saved` : "New story"}</p><a class="rr-link" href="${adventureUrl(story.id)}">${done ? "Read again" : progress.started ? "Continue story" : "Start story"} →</a></article>`;
  }).join("")}</div>`);
}

function adventureHTML(story, state) {
  const progress = state.adventures[story.id] || { chapter: 0, responses: {} };
  const chapterIndex = Math.min(Math.max(0, Number(progress.chapter) || 0), story.chapters.length - 1);
  const chapter = story.chapters[chapterIndex];
  const response = progress.responses?.[chapterIndex] || {};
  const steps = story.chapters.map((part, i) => `<li><button type="button" data-adv-nav="${i}" aria-current="${chapterIndex === i ? "step" : "false"}"><span>${i + 1}</span>${esc(part.title)}${progress.responses?.[i]?.recap ? " · saved" : ""}</button></li>`).join("");
  const paragraphs = chapter.paragraphs.map((text, i) => `<p id="chapter-${chapterIndex + 1}-p-${i + 1}">${esc(text)}</p>`).join("");
  const words = chapter.vocabulary.map((v) => `<details class="rr-adventure-word"><summary>${esc(v.term)}</summary><p>${esc(v.definition)}</p><p><b>In this story:</b> ${esc(v.example)}</p></details>`).join("");
  const choice = `<fieldset class="rr-adventure-choice"><legend>${esc(chapter.question.prompt)}</legend>${chapter.question.options.map((option, i) => `<label><input type="radio" name="adv-answer" value="${i}" ${response.answer === i ? "checked" : ""}> ${esc(option)}</label>`).join("")}<button class="btn small" type="button" data-adv-check="${chapterIndex}" ${response.answer == null ? "disabled" : ""}>Check my thinking</button>${response.checked ? `<p role="status" class="rr-adventure-feedback ${response.correct ? "is-correct" : "is-revisit"}">${response.correct ? "That fits the evidence. " : "Read the explanation and revisit the clue. "}${esc(chapter.question.why)}</p>` : ""}</fieldset>`;
  const prev = chapterIndex > 0 ? `<button type="button" class="btn" data-adv-nav="${chapterIndex - 1}">← Previous chapter</button>` : "";
  const next = chapterIndex < story.chapters.length - 1 ? `<button type="button" class="btn btn-primary" data-adv-nav="${chapterIndex + 1}">Next chapter →</button>` : `<button type="button" class="btn btn-primary" data-adv-complete>Finish this adventure</button>`;
  const done = progress.completed ? `<p role="status" class="rr-adventure-feedback is-correct">Adventure complete. Your chapter notes and responses are saved on this device.</p>` : "";
  return shell(`${backLink(`${BASE}/reading-room/adventures`, "All Reading Adventures")}<header class="rr-adventure-heading"><p class="rr-eyebrow">Grades ${esc(story.gradeCluster.replace("-", "–"))} · ${esc(story.genre)} · ${esc(story.keyUse)}</p><h1>${esc(story.title)}</h1><p>${esc(story.summary)}</p><p><b>Characters:</b> ${esc(story.characters)} · <b>Reading focus:</b> ${esc(story.skill)}</p><p class="rr-review-status">Original instructional story · independent editorial review pending</p><progress max="${story.chapters.length}" value="${chapterIndex + (progress.responses?.[chapterIndex]?.recap ? 1 : 0)}" aria-label="Adventure reading progress"></progress><span class="rr-adventure-progress-label">Chapter ${chapterIndex + 1} of ${story.chapters.length}</span>${canSpeak() ? `<p><button type="button" class="btn small" data-adv-listen="play">Listen with this device’s voice</button> <button type="button" class="btn small" data-adv-listen="stop">Stop audio</button></p><span class="rr-help">Audio uses your browser’s available speech voice; no recording is saved.</span>` : `<p class="rr-help">Device speech is unavailable. Read the chapter text on screen.</p>`}</header><div class="rr-adventure-layout"><nav class="rr-adventure-nav" aria-label="Chapters"><h2>Chapters</h2><ol>${steps}</ol></nav><article class="rr-adventure-reading"><p class="rr-eyebrow">Chapter ${chapterIndex + 1}</p><h2>${esc(chapter.title)}</h2><p class="rr-adventure-teaser">${esc(chapter.teaser)}</p><div class="rr-passage">${paragraphs}</div><section class="rr-adventure-vocabulary" aria-label="Chapter vocabulary">${words}</section><section class="rr-adventure-response"><h3>Pause and think</h3><label>Make a prediction<textarea rows="3" data-adv-response="prediction" placeholder="What do you think may happen? Use a clue.">${esc(response.prediction || "")}</textarea><span class="rr-help">Your prediction saves as you type. You can revisit it after the next chapter.</span></label>${choice}<label>Explain with evidence<textarea rows="4" data-adv-response="evidence" placeholder="Use a detail from this chapter and explain what it supports.">${esc(response.evidence || "")}</textarea><span class="rr-help">This open response is saved for your review; it is not automatically scored.</span></label><label>Chapter recap<textarea rows="3" data-adv-response="recap" placeholder="What changed, and which detail matters most?">${esc(response.recap || "")}</textarea></label>${done}<div class="rr-adventure-controls">${prev}${next}</div><p class="rr-status" role="status">Your responses save in this browser.</p></section></article></div>`);
}

// ── sub-pages ───────────────────────────────────────────────────────────────────────────────────────────────────────

const shell = (inner) =>
  `<section class="rr-shell d-reading">${inner}</section>`;

function familyHTML(lessons) {
  return shell(
    `${pageHeader("Read together · optional · no account", "Family Reading", `<p>Choose a short text and spend about 10–15 minutes reading, looking at the details, and talking together. English fluency is not required for a useful conversation.</p><p lang="es">Elijan un texto breve y lean durante unos 10–15 minutos. Pueden conversar en cualquier idioma; no es necesario hablar inglés con fluidez.</p>`)}<div class="rr-books">${lessons.map((l) => `<article class="rr-book"><div class="rr-book-copy"><p class="rr-eyebrow">${esc(gradeLabel(l))} · ${l.minutes} min</p><h2><a href="${lessonUrl(l.id)}">${esc(l.title)}</a></h2><p>${esc(l.familySupport.directions.en)}</p><p lang="es">${esc(l.familySupport.directions.es)}</p><p><b>Try asking:</b> ${esc(l.familySupport.questions[0])}</p></div></article>`).join("")}</div>${backLink(`${BASE}/reading-room`, "Return to the Reading Room")}`,
  );
}

function wordsHTML(state) {
  const body = state.words.length
    ? `<div class="rr-books">${state.words.map((w, i) => `<article class="rr-book"><div class="rr-book-copy"><p class="rr-eyebrow">${esc(w.lessonId || "Reading")}</p><h2>${esc(w.term)}</h2><p>${esc(w.definition)}</p><p><b>Example:</b> ${esc(w.example)}</p><button type="button" class="rr-reset" data-rr-remove-word="${i}">Remove word</button></div></article>`).join("")}</div>`
    : `<div class="rr-empty"><img src="${ART}/empty.svg" alt="" width="240" height="180"><h2>No words saved yet</h2><p>Open a lesson and choose “Save to Word Notebook” on a vocabulary card.</p></div>`;
  return shell(
    `${pageHeader("Your saved academic words · this device", "Reading Word Notebook", "<p>Review each word in its reading context. Saved words stay in this browser.</p>")}${body}${backLink(`${BASE}/reading-room`, "Return to the Reading Room")}`,
  );
}

function pathwaysHTML(lessons) {
  const cluster = clusterParam();
  const picks = lessons.filter((l) => l.gradeCluster === cluster).slice(0, 4);
  const feature = picks[0] || lessons[0];
  const card = (eyebrow, title, body, link) =>
    `<article class="rr-book"><div class="rr-book-copy"><p class="rr-eyebrow">${eyebrow}</p><h2>${title}</h2><p>${body}</p>${link}</div></article>`;
  const go = (to, label) => `<a class="rr-link" href="${to}">${label} →</a>`;
  return shell(
    `${pageHeader("Teacher and student pathways · no account required", "Choose a way to read", "<p>Use one lesson for a gradual-release sequence, a whole-class read, independent practice, a focused small group, or a conference. Work and notes stay in this browser.</p>", `<label class="rr-filter rr-inline-filter">Grade cluster <select data-rr-workshop-cluster>${clusterOptions(cluster)}</select></label>`)}<div class="rr-books">${[
      card(
        "Model and practice",
        "Learn, practice, then try independently",
        "Start with the explicit reading move, use guided prompts, and fade supports before a fresh task.",
        go(`${lessonUrl(feature.id)}?mode=learn`, "Open a modeled lesson"),
      ),
      card(
        "Read together",
        "Chunked whole-class reading",
        "Project the passage, pause at section questions, discuss evidence, and use teacher prompts.",
        go(
          `${lessonUrl(feature.id)}?mode=together`,
          "Open a read-together lesson",
        ),
      ),
      card(
        "Independent reading",
        "Practice without hints",
        "Students choose a text, annotate, read, and check their own responses without revealing teacher models.",
        go(
          `${lessonUrl(feature.id)}?mode=independent`,
          "Open an independent lesson",
        ),
      ),
      card(
        "Small group",
        "Plan from checked evidence",
        "Use observed errors to select a strategy, model it, and assign a fresh independent check.",
        go(`${BASE}/reading-room/teacher`, "Review local skill evidence"),
      ),
      card(
        "Reading conference",
        "Capture a brief observation and next step",
        "Keep observation notes on this device, tied to a lesson and instructional follow-up.",
        go(`${BASE}/reading-room/conference`, "Open a conference note"),
      ),
      card(
        "Weekly workshop",
        "Plan five connected days",
        "Build a week around actual Reading Room texts and their objectives.",
        go(
          `${BASE}/reading-room/workshop?cluster=${encodeURIComponent(cluster)}`,
          "Open the weekly plan",
        ),
      ),
    ].join(
      "",
    )}</div><section class="rr-pathway-texts"><h2>Texts for this pathway</h2><div class="rr-books">${picks.map((l) => `<article class="rr-book"><div class="rr-book-copy"><h3><a href="${lessonUrl(l.id)}">${esc(l.title)}</a></h3><p>${esc(l.objectives.content)} · ${esc(l.objectives.language)}</p></div></article>`).join("")}</div></section>${backLink(`${BASE}/reading-room`, "Return to the Reading Room")}`,
  );
}

const WORKSHOP_STAGES = [
  [
    "Day 1 · Prepare",
    "Connect background knowledge, introduce the essential question, and preview three useful words.",
  ],
  [
    "Day 2 · First reading",
    "Read for topic, people or concepts, sequence, and the central idea.",
  ],
  [
    "Day 3 · Investigate",
    "Reread key paragraphs, select evidence, and address a likely misconception.",
  ],
  [
    "Day 4 · Organize and discuss",
    "Complete a lesson-linked organizer and explain how evidence supports an idea.",
  ],
  [
    "Day 5 · Transfer",
    "Complete an independent challenge and apply the same language function in a new context.",
  ],
];

function workshopHTML(lessons) {
  const cluster = clusterParam();
  const selected = lessons
    .filter((l) => l.gradeCluster === cluster)
    .slice(0, 2);
  const move = (i) =>
    esc(
      i === 0
        ? selected[0].teacherGuide.miniLesson
        : i === 2
          ? selected[0].teacherGuide.misconception
          : selected[Math.min(i - 1, selected.length - 1)].teacherGuide
              .languageObjective,
    );
  const plan = selected.length
    ? `<section class="rr-continue rr-week"><div><p class="rr-eyebrow">Week texts</p>${selected.map((l) => `<h2><a href="${lessonUrl(l.id)}">${esc(l.title)}</a></h2><p>${esc(l.objectives.content)} · ${esc(l.objectives.language)}</p>`).join("")}</div></section><ol class="rr-workshop-days">${WORKSHOP_STAGES.map(([day, desc], i) => `<li><h2>${day}</h2><p>${desc}</p><p><b>Teacher move:</b> ${move(i)}</p><a class="rr-link" href="${lessonUrl(selected[Math.min(i < 3 ? 0 : 1, selected.length - 1)].id)}">Open the lesson for this step →</a></li>`).join("")}</ol><button type="button" class="rr-reset" data-rr-print>${ic("print")} Print this workshop plan</button>`
    : "<p>No authored lesson is available for that cluster yet.</p>";
  return shell(
    `${pageHeader("Teacher planning · local content", "Weekly Reading Workshop", "<p>A flexible five-day sequence built from the Reading Room’s actual lessons. Assign the full sequence or select individual days; students can still browse without signing in.</p>", `<label class="rr-filter rr-inline-filter">Grade cluster <select data-rr-workshop-cluster>${clusterOptions(cluster)}</select></label>`)}${plan}${backLink(`${BASE}/reading-room/teacher`, "Return to teacher evidence")}`,
  );
}

function teacherHTML(lessons, state, stories = [], strategies = []) {
  const rows = lessons.map((l) => {
    const p = state.lessons[stateKey(l)] || {};
    const checked = Object.values(p.answers || {}).filter((a) => a.checked);
    return {
      l,
      p,
      checked,
      misses: checked.filter((a) => a.correct === false).length,
      independent: checked.filter((a) => a.mode === "independent").length,
    };
  });
  const groupNeeds = new Map();
  for (const { l, checked } of rows)
    for (const a of checked)
      if (a.correct === false) {
        const skill = a.skill || "Revisit a checked response";
        const old = groupNeeds.get(skill) || { count: 0, lesson: l };
        old.count++;
        groupNeeds.set(skill, old);
      }
  const needs = groupNeeds.size
    ? [...groupNeeds]
        .map(
          ([skill, v]) =>
            `<article><h3>${esc(skill)}</h3><p>Evidence: ${v.count} checked miss(es) saved in <a href="${lessonUrl(v.lesson.id)}">${esc(v.lesson.title)}</a>. Revisit the linked paragraph, model the strategy, then offer a fresh independent check.</p></article>`,
        )
        .join("")
    : "<p>No checked misses are saved yet, so this local view has no evidence-based small-group suggestion.</p>";
  const next = ({ misses, checked }, found) =>
    misses
      ? `Revisit: ${esc(found)}.`
      : checked.length
        ? "Continue to a new reading."
        : "No checked evidence saved.";
  const adventureSummary = stories.map((story) => {
    const progress = state.adventures[story.id] || {};
    const checks = Object.values(progress.responses || {}).filter((answer) => answer.checked);
    return `<tr><th scope="row"><a href="${adventureUrl(story.id)}">${esc(story.title)}</a></th><td>${checks.length} of ${story.chapters.length}</td><td>${checks.filter((answer) => answer.correct).length}</td><td>${checks.filter((answer) => !answer.correct).length}</td><td>${progress.completed ? "Completed" : progress.started ? "In progress" : "Not started"}</td></tr>`;
  }).join("");
  const strategySummary = strategies.map((lesson) => {
    const progress = state.strategies?.[lesson.id] || {};
    if (!progress.guided?.checked && !progress.independent?.checked) return "";
    const result = (row) => !row?.checked ? "Not checked" : row.correct ? "Correct" : "Revisit needed";
    return `<tr><th scope="row">${esc(lesson.title)} · ${esc(lesson.gradeCluster)}</th><td>${esc(STRATEGY_STRANDS[lesson.strand])}</td><td>${result(progress.guided)}</td><td>${result(progress.independent)}</td></tr>`;
  }).join("");
  return shell(
    `${pageHeader("Teacher view · this device only", "Reading evidence", "<p>These counts come only from the reading data saved in this browser. They do not sync across devices and are not WIDA scores or proficiency estimates.</p>")}<p class="rr-count">${rows.filter((x) => x.p.completed).length} of ${lessons.length} authored lessons marked complete on this device.</p><p><a class="rr-link" href="${BASE}/reading-room/workshop?cluster=6-8">Open Weekly Reading Workshop →</a></p><section class="rr-group-needs"><h2>Small-group next steps</h2>${needs}</section><div class="rr-teacher-table"><table><caption>Saved reading evidence by lesson</caption><thead><tr><th scope="col">Lesson</th><th scope="col">Checked items</th><th scope="col">Independent checks</th><th scope="col">Items to revisit</th><th scope="col">Next step</th></tr></thead><tbody>${rows.map((r) => `<tr><th scope="row"><a href="${lessonUrl(r.l.id)}">${esc(r.l.title)}</a></th><td>${r.checked.length}</td><td>${r.independent}</td><td>${r.misses}</td><td>${next(r, r.checked.find((x) => x.correct === false)?.skill || "the checked skill")}</td></tr>`).join("")}</tbody></table></div><section class="rr-teacher-table"><table><caption>Reading Adventure checkpoint evidence · local counts, not mastery</caption><thead><tr><th scope="col">Adventure</th><th scope="col">Checked checkpoints</th><th scope="col">Correct keyed responses</th><th scope="col">Responses to revisit</th><th scope="col">Progress</th></tr></thead><tbody>${adventureSummary}</tbody></table><p class="rr-fine">Open explanations and recaps remain private student work in this browser; this view shows only checkpoint counts. Independent editorial review is pending.</p></section><section class="rr-teacher-table"><table><caption>Reading Strategy Academy evidence · local counts</caption><thead><tr><th scope="col">Lesson</th><th scope="col">Strategy</th><th scope="col">Guided response</th><th scope="col">Independent transfer</th></tr></thead><tbody>${strategySummary || `<tr><td colspan="4">No strategy evidence is saved on this device.</td></tr>`}</tbody></table><p class="rr-fine">This view stores no student explanation text and does not establish mastery.</p></section><div class="rr-actions-row"><button type="button" class="rr-reset" data-rr-print>${ic("print")} Print this report</button><button type="button" class="rr-reset" data-rr-export>${ic("download")} Download report CSV</button></div><p class="rr-fine">Interpretation rule: a correct supported response is not counted as an independent check. Counts are local descriptive evidence only; they do not establish mastery.</p>${backLink(`${BASE}/reading-room`, "Return to the Reading Room")}`,
  );
}

function conferenceHTML(lessons, state) {
  const selectedId =
    new URLSearchParams(location.search).get("lesson") ||
    state.lastRead ||
    lessons[0]?.id;
  const selected = lessons.find((l) => l.id === selectedId) || lessons[0];
  const notes = state.conferences[selected?.id] || {};
  const fields = [
    ["strength", "Observed strength"],
    ["evidence", "Evidence observed in the reading or response"],
    ["support", "Scaffold or prompt used"],
    ["nextStep", "Instructional next step"],
    ["followUp", "Fresh independent follow-up task"],
  ];
  const form = selected
    ? `<p class="rr-goals"><b>Reading goal:</b> ${esc(selected.objectives.content)} <b>Language goal:</b> ${esc(selected.objectives.language)}</p><div class="rr-organizer-grid">${fields.map(([key, label]) => `<label>${label}<textarea data-rr-conference="${key}" data-lesson="${esc(selected.id)}" rows="3">${esc(notes[key] || "")}</textarea></label>`).join("")}</div><p role="status" data-rr-conference-status>Notes save in this browser as you type.</p><button type="button" class="btn small" data-rr-print>${ic("print")} Print conference note</button>`
    : "<p>No reading lessons are available.</p>";
  return shell(
    `${pageHeader("Teacher conference · stored on this device", "Reading Conference Notes", "<p>Capture instructional observations without adding student names or identifiers. These notes are local to this browser and are not shared or synced.</p>", `<label class="rr-filter rr-inline-filter">Lesson<select data-rr-conference-lesson>${lessons.map((l) => `<option value="${esc(l.id)}" ${l.id === selected?.id ? "selected" : ""}>${esc(l.title)}</option>`).join("")}</select></label>`)}${form}${backLink(`${BASE}/reading-room/pathways`, "Return to workshop pathways")}`,
  );
}

// ── a lesson ────────────────────────────────────────────────────────────────────────────────────────────────────────

const feedbackBox = (answer, okText, tryText, rationale) =>
  answer?.checked
    ? `<div role="status" class="feedback ${answer.correct ? "is-right" : "is-hint"}"><p class="fb-title">${ic(answer.correct ? "check" : "bulb")} ${esc(answer.correct ? okText : tryText)}</p><p>${esc(rationale)}</p></div>`
    : "";
const checkButton = (id, label) =>
  `<button type="button" class="btn btn-primary btn-domain small" data-rr-check="${esc(id)}">${label}</button>`;
const optionLabel = (input, text) =>
  `<label class="rr-option">${input}<span class="rr-option-text">${text}</span></label>`;

function activityHTML(a, progress) {
  const ans = progress.answers?.[a.id];
  if (a.type === "choice" || a.type === "connector")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend>${a.sentence ? `<p class="rr-sentence">${esc(a.sentence.replace("___", "_____"))}</p>` : ""}${a.choices.map((c) => optionLabel(`<input type="radio" name="rr-${esc(a.id)}" data-rr-answer="${esc(a.id)}" value="${esc(c.id)}" ${ans?.value === c.id ? "checked" : ""}>`, esc(c.text))).join("")}${checkButton(a.id, "Check answer")}${feedbackBox(ans, "That answer is supported.", "Look again at the text, then revise.", a.rationale)}</fieldset>`;
  if (a.type === "multi" || a.type === "hotText")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend>${a.choices.map((c) => optionLabel(`<input type="checkbox" data-rr-multi="${esc(a.id)}" value="${esc(c.id)}" ${ans?.values?.includes(c.id) ? "checked" : ""}>`, esc(c.text))).join("")}${checkButton(a.id, "Check selection")}${feedbackBox(ans, "Your selection matches the source key.", "Compare the selected text with the task purpose, then revise.", a.rationale)}</fieldset>`;
  if (a.type === "cloze")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend><p class="rr-cloze">${a.segments.map((seg) => (seg.blank ? `<label class="rr-inline-cloze"><span class="visually-hidden">Choose a word</span><select data-rr-cloze="${esc(a.id)}" data-blank="${esc(seg.blank.id)}" aria-label="Word for blank ${esc(seg.blank.id)}"><option value="">Choose a word</option>${seg.blank.options.map((v) => `<option value="${esc(v)}" ${ans?.values?.[seg.blank.id] === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>` : esc(seg.text))).join("")}</p>${checkButton(a.id, "Check words")}${feedbackBox(ans, "The words fit the context.", "Reread the full sentence and revise the word choice.", a.rationale)}</fieldset>`;
  if (a.type === "short")
    return `<div class="rr-question"><label for="rr-short-${esc(a.id)}">${esc(a.prompt)}</label><textarea id="rr-short-${esc(a.id)}" data-rr-response="${esc(a.id)}" rows="4">${esc(ans?.text || "")}</textarea>${a.model ? `<button type="button" class="btn small" data-rr-model="${esc(a.id)}">Compare with an example</button><p class="rr-model" ${ans?.showModel ? "" : "hidden"}><b>One possible response:</b> ${esc(a.model)}</p>` : `<div class="rr-rubric"><b>Response criteria:</b><ul>${(a.rubric || a.lookFor || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul><span>Open responses are practice work; automated scoring is not applied.</span></div>`}</div>`;
  if (a.type === "evidence")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend>${a.paragraphIds.map((pid) => optionLabel(`<input type="checkbox" data-rr-evidence="${esc(a.id)}" value="${esc(pid)}" ${ans?.values?.includes(pid) ? "checked" : ""}>`, `Paragraph ${esc(pid.slice(1))}`)).join("")}${checkButton(a.id, "Check evidence")}${ans?.checked ? `<div role="status" class="feedback is-hint"><p class="fb-title">${ic("bulb")} Evidence check</p><p>${esc(a.rationale)}</p></div>` : ""}</fieldset>`;
  if (a.type === "order")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend>${a.items.map((item, i) => `<label class="rr-option rr-position"><span class="rr-option-text">Step ${i + 1}: ${esc(item.text)}</span><select data-rr-structured="${esc(a.id)}" data-index="${i}" aria-label="Position for ${esc(item.text)}"><option value="">Choose position</option>${a.items.map((_, n) => `<option value="${n}" ${ans?.values?.[i] === n ? "selected" : ""}>${n + 1}</option>`).join("")}</select></label>`).join("")}${checkButton(a.id, "Check sequence")}${feedbackBox(ans, "The sequence matches the passage.", "Return to the text and revise the order.", a.rationale)}</fieldset>`;
  if (a.type === "sort")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend>${a.items.map((item, i) => `<label class="rr-option rr-position"><span class="rr-option-text">${esc(item.text)}</span><select data-rr-structured="${esc(a.id)}" data-index="${i}" aria-label="Category for ${esc(item.text)}"><option value="">Choose category</option>${a.categories.map((cat) => `<option value="${esc(cat)}" ${ans?.values?.[i] === cat ? "selected" : ""}>${esc(cat)}</option>`).join("")}</select></label>`).join("")}${checkButton(a.id, "Check categories")}${feedbackBox(ans, "The categories match the passage.", "Compare each choice with the paragraph about that item.", a.rationale)}</fieldset>`;
  return `<div class="rr-question"><h3>${esc(a.skill)}</h3><p>${esc(a.prompt)}</p><p>${esc(a.rationale)}</p></div>`;
}

function paragraphHTML(l, p, i, state, progress) {
  const mark =
    state.annotations[`${l.id}@${l.revision}:${p.id}`]?.category || "";
  const isPlace = progress.position === p.id;
  return `<article class="rr-paragraph ${isPlace ? "is-place" : ""}" id="${esc(p.id)}" ${mark ? `data-mark="${esc(mark)}"` : ""}>
    <span class="rr-paranum" aria-hidden="true">${i + 1}</span>
    <div class="rr-para-body">
      ${mark || isPlace ? `<p class="rr-para-flags">${mark ? `<span class="rr-flag">${ic("pin")} ${esc(mark)}</span>` : ""}${isPlace ? `<span class="rr-flag rr-flag-place">${ic("bookmark")} Saved place</span>` : ""}</p>` : ""}
      <p class="rr-para-text">${esc(p.text)}</p>
      ${activeMode === "independent" ? "" : `<p class="rr-guide">${ic("bulb")}<span><b>Pause and notice:</b> ${esc(p.guidingQuestion || "What is important in this section?")}</span></p>`}
      <div class="rr-margin">
        <div class="rr-paragraph-tools"><label>Mark this paragraph<select data-rr-mark="${esc(l.id)}" data-rr-revision="${esc(l.revision)}" data-rr-paragraph="${esc(p.id)}"><option value="">Choose a reading mark</option>${MARKS.map((c) => `<option value="${c}" ${mark === c ? "selected" : ""}>${c}</option>`).join("")}</select></label><button type="button" class="btn small" data-rr-position="${esc(p.id)}">${ic("bookmark")} Save reading place</button></div>
        <label class="rr-annotation">Your note for paragraph ${i + 1}<textarea data-rr-note="${esc(p.id)}" data-rr-lesson="${esc(l.id)}" rows="2">${esc(progress.notes?.[p.id] || "")}</textarea></label>
      </div>
    </div></article>`;
}

function visualBlockHTML(l) {
  if (l.table)
    return `<figure class="rr-data-visual"><figcaption>${ic("grid")} ${esc(l.table.caption)}</figcaption><div class="rr-teacher-table"><table><thead><tr>${l.table.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${l.table.rows.map((row) => `<tr>${row.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="rr-figure-note">${esc(l.table.description)}</p></figure>`;
  if (l.map)
    return `<figure class="rr-data-visual"><figcaption>${ic("pin")} ${esc(l.map.caption)}</figcaption><ol class="rr-map-key">${l.map.items.map((x) => `<li><b>${esc(x.label)}</b> — ${esc(x.symbol)}</li>`).join("")}</ol><p class="rr-figure-note">${esc(l.map.description)}</p></figure>`;
  return "";
}

function displayControls(state) {
  const spacing = Number(state.settings.lineSpacing) || 1.75;
  const rate = String(Number(state.settings.speechRate) || 0.95);
  const tts = canSpeak()
    ? `<div class="rr-audio-controls"><span>Optional device voice; the passage text remains the transcript.</span><button type="button" class="btn small" data-rr-listen="play">${ic("play")} Read passage aloud</button><button type="button" class="btn small" data-rr-listen="stop">${ic("stop")} Stop audio</button><label>Speech pace<select data-rr-setting="speechRate">${SPEECH_RATES.map(([v, label]) => `<option value="${v}" ${Number(v) === Number(rate) ? "selected" : ""}>${label}</option>`).join("")}</select></label></div>`
    : `<p class="rr-audio-note">Read-aloud is not available in this browser. The full passage is displayed as text.</p>`;
  return `<div class="rr-display"><label>${ic("text-size")} Text size <input type="range" min="0.9" max="1.3" step="0.1" value="${state.settings.fontScale}" data-rr-setting="fontScale"></label><label>Line spacing <select data-rr-setting="lineSpacing">${LINE_SPACINGS.map(([v, label]) => `<option value="${v}" ${Number(v) === spacing ? "selected" : ""}>${label}</option>`).join("")}</select></label></div>${tts}`;
}

const MODE_NAMES = {
  learn: "Learn",
  practice: "Practice",
  independent: "Independent challenge",
  together: "Read together",
};

function modeNoteHTML(l) {
  if (activeMode === "learn")
    return `<section class="rr-mode-note"><h2>Model the reading move</h2><p>${esc(l.teacherGuide.miniLesson)}</p><p><b>One possible response:</b> ${esc(l.teacherGuide.modelResponse)}</p></section>`;
  if (activeMode === "independent")
    return `<section class="rr-mode-note"><h2>Independent challenge</h2><p>Use the passage and your own notes. Vocabulary previews, paragraph questions, and models are hidden. This records local practice evidence, not a proficiency score.</p></section>`;
  return `<section class="rr-mode-note"><h2>Practice with support</h2><p>Use the vocabulary, paragraph questions, and notes as you reread. Revise after feedback.</p></section>`;
}

function vocabularyHTML(l) {
  return `<section class="rr-vocabulary"><h2>${ic("language")} Words to notice</h2><p class="rr-fine">Optional support. Open a word for its meaning in this text.</p><div class="rr-vocab-list">${l.vocabulary.map((v) => `<details class="rr-vocab"><summary><strong>${esc(v.term)}</strong><span>${esc(v.definition)}</span></summary><p><b>In this text:</b> ${esc(v.example)}${v.spanish ? ` <span lang="es">· ${esc(v.spanish)}</span>` : ""}</p><button type="button" class="btn small" data-rr-word="${esc(v.term)}" data-rr-lesson="${esc(l.id)}">Save to Word Notebook</button></details>`).join("")}</div></section>`;
}

function workspaceHTML(l, progress) {
  const phases = [
    { id: "first", label: "1 · Understand" },
    { id: "second", label: "2 · Investigate" },
    { id: "third", label: "3 · Apply" },
  ];
  const items = l.activities.filter((a) => a.phase === activePhase);
  const activities = items.map((a) => activityHTML(a, progress)).join("");
  const phaseNote =
    activePhase === "first"
      ? "Build a first understanding"
      : activePhase === "second"
        ? "Return for evidence"
        : "Apply the thinking";
  return `<aside class="rr-workspace" aria-label="Your response"><p class="rr-workspace-label">${ic("writing")} Your response</p><div class="rr-phase" role="tablist" aria-label="Reading sequence">${phases.map((p) => `<button type="button" role="tab" aria-selected="${activePhase === p.id}" data-rr-phase="${p.id}">${p.label}</button>`).join("")}</div><p class="rr-eyebrow">${phaseNote}</p><h2>${esc(l.objectives.language)}</h2>${activities || "<p>This section is a rereading and reflection pause. Use your notes to explain what changed in your understanding.</p>"}${
    activeMode !== "independent"
      ? `<div class="rr-teacher"><details><summary>Teacher guide</summary><p><b>Mini-lesson:</b> ${esc(l.teacherGuide.miniLesson)}</p><p><b>Misconception to watch:</b> ${esc(l.teacherGuide.misconception)}</p><ul>${l.teacherGuide.discussion.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p><b>Model response:</b> ${esc(l.teacherGuide.modelResponse)}</p></details><details><summary>Family reading · 10–15 minutes</summary><p>${esc(l.familySupport.directions.en)}</p><p lang="es">${esc(l.familySupport.directions.es)}</p><p>${esc(l.familySupport.noEnglishRequired)}</p></details></div>${renderOrganizers(l.id, progress)}`
      : ""
  }<label class="rr-reflection">My reflection<textarea data-rr-reflection="${esc(l.id)}" rows="3">${esc(progress.reflection || "")}</textarea></label><button type="button" class="btn btn-primary btn-domain rr-button" data-rr-complete="${esc(l.id)}">Save lesson progress</button><p role="status" class="rr-status">${progress.completed ? "Progress saved on this device." : "Your notes and answers save in this browser."}</p></aside>`;
}

async function lessonHTML(ctx, l, state) {
  const linkedActivity = l.connections?.relatedActivity
    ? await findActivity(l.connections.relatedActivity).catch(() => null)
    : null;
  const relatedHref = linkedActivity
    ? `${BASE}/${encodeURIComponent(linkedActivity.domain)}/${encodeURIComponent(linkedActivity.level)}/${encodeURIComponent(linkedActivity.activity.id)}?grades=${encodeURIComponent(linkedActivity.band)}`
    : "";
  const key = stateKey(l);
  const progress = state.lessons[key] || {
    started: true,
    answers: {},
    notes: {},
    phase: "first",
    assisted: false,
  };
  const requestedMode = new URLSearchParams(location.search).get("mode");
  if (["learn", "practice", "independent", "together"].includes(requestedMode))
    activeMode = requestedMode;
  progress.started = true;
  progress.lastOpened = new Date().toISOString();
  progress.phase ||= "first";
  state.lastRead = l.id;
  state.recent = [l.id, ...state.recent.filter((x) => x !== l.id)].slice(0, 30);
  state.lessons[key] = progress;
  saveReadingState(state);
  if (openedLessonId !== l.id) {
    openedLessonId = l.id;
    if (progress.position)
      requestAnimationFrame(() =>
        document
          .getElementById(progress.position)
          ?.scrollIntoView({ block: "start" }),
      );
  }
  const modeControls = `<div class="rr-mode-controls" role="group" aria-label="Reading mode">${Object.entries(
    MODE_NAMES,
  )
    .map(
      ([value, label]) =>
        `<button type="button" data-rr-mode="${value}" aria-pressed="${activeMode === value}">${label}</button>`,
    )
    .join("")}</div>`;
  const paragraphs = l.paragraphs
    .map((p, i) => paragraphHTML(l, p, i, state, progress))
    .join("");
  const links = `<div class="rr-actions">${relatedHref ? `<a href="${relatedHref}">Related Reading practice →</a>` : ""}<a href="${BASE}/write?grades=${esc(ctx.band)}">Write about a text →</a><a href="${BASE}/speak?grades=${esc(ctx.band)}">Speak about a text →</a><a href="${BASE}/vocabulary?grades=${esc(ctx.band)}">Practice academic words →</a></div>`;
  return `<section class="rr-shell rr-reader d-reading"><nav class="rr-back"><a href="${BASE}/reading-room">${ic("arrow-left")} Reading shelf</a><span>${esc(gradeLabel(l))} · ${esc(l.subject)} · ${l.minutes} min</span><button type="button" class="btn small" data-rr-bookmark="${esc(l.id)}">${ic("bookmark")} ${state.bookmarks.includes(l.id) ? "Bookmarked" : "Bookmark"}</button></nav>
    <header class="rr-title"><p class="rr-eyebrow">${esc(l.genre)} · ${esc(l.keyUse)} · ${esc(l.eldStandard)}</p><h1>${esc(l.title)}</h1><p class="rr-lead">${esc(l.summary)}</p><div class="rr-objectives"><div><b>Content goal</b><span>${esc(l.objectives.content)}</span></div><div><b>Language goal</b><span>${esc(l.objectives.language)}</span></div></div><p class="rr-alignment">${ic("info")} <span>${esc(l.alignmentStatus)} Independent editorial review is pending for this lesson package. This is original instructional practice, not an official WIDA assessment or score prediction. <a href="https://wida.wisc.edu/assess/access/preparing-students" target="_blank" rel="noreferrer">Official WIDA test familiarization resources</a></span></p></header>
    ${modeControls}${modeNoteHTML(l)}
    <div class="rr-layout"><section class="rr-text" aria-label="Reading passage">${displayControls(state)}<section class="rr-before"><h2>Before you read</h2><p><b>Essential question:</b> ${esc(l.beforeReading.essentialQuestion)}</p><p>${esc(l.beforeReading.background)} ${esc(l.beforeReading.hook)}</p><p><b>Read to find out:</b> ${esc(l.beforeReading.purpose)}</p></section>${visualBlockHTML(l)}${activeMode === "independent" ? "" : vocabularyHTML(l)}<div class="rr-passage" style="--rr-font:${Number(state.settings.fontScale) || 1};--rr-leading:${Number(state.settings.lineSpacing) || 1.75}">${paragraphs}</div>${links}</section>${workspaceHTML(l, progress)}</div></section>`;
}

export async function render(ctx) {
  const data = await loadReadingRoomLessons();
  const lessons = data.lessons || [];
  const state = loadReadingState();
  const id = ctx.route.id;
  if (!id)
    return { title: "Reading Room", html: raw(shelfHTML(ctx, lessons, state)) };
  if (id === "adventures") {
    const { stories = [] } = await loadReadingAdventures();
    return { title: "Reading Adventures", html: raw(adventuresHTML(stories, state)) };
  }
  if (id === "strategies") {
    const data = await loadReadingStrategies();
    return { title: "Reading Strategy Academy", html: raw(strategiesHTML(data, state)) };
  }
  if (id.startsWith("strategy-")) {
    const data = await loadReadingStrategies();
    const lesson = data.lessons.find((item) => item.id === id.slice("strategy-".length));
    if (lesson) return { title: lesson.title, html: raw(strategyLessonHTML(lesson, state)) };
  }
  if (id.startsWith("adventure-")) {
    const { stories = [] } = await loadReadingAdventures();
    const story = stories.find((item) => item.id === id.slice("adventure-".length));
    if (story) return { title: story.title, html: raw(adventureHTML(story, state)) };
  }
  if (id === "family")
    return { title: "Family Reading", html: raw(familyHTML(lessons)) };
  if (id === "words")
    return { title: "Reading Word Notebook", html: raw(wordsHTML(state)) };
  if (id === "pathways")
    return {
      title: "Reading Workshop Pathways",
      html: raw(pathwaysHTML(lessons)),
    };
  if (id === "workshop")
    return {
      title: "Weekly Reading Workshop",
      html: raw(workshopHTML(lessons)),
    };
  if (id === "teacher")
    return {
      title: "Reading Progress · Local",
      html: raw(teacherHTML(lessons, state, (await loadReadingAdventures()).stories || [], (await loadReadingStrategies()).lessons || [])),
    };
  if (id === "conference")
    return {
      title: "Reading Conference · Local",
      html: raw(conferenceHTML(lessons, state)),
    };
  const l = lessons.find((x) => x.id === id);
  if (!l)
    return {
      title: "Reading not found",
      html: raw(
        `<section class="rr-shell"><p>This text could not be found.</p><a href="${BASE}/reading-room">Return to the Reading Room</a></section>`,
      ),
    };
  return { title: l.title, html: raw(await lessonHTML(ctx, l, state)) };
}
export function onInput(e, ctx) {
  const el=e.target;
  if (el.matches("[data-strategy-explanation]")) {
    const current = loadReadingState();
    const lessonId = ctx.route.id.slice("strategy-".length);
    const saved = current.strategies[lessonId] || {};
    const stage = el.dataset.strategyExplanation;
    saved[stage] = { ...(saved[stage] || {}), explanation: el.value, updatedAt: new Date().toISOString() };
    current.strategies[lessonId] = saved; saveReadingState(current);
    const choice = document.querySelector(`[data-strategy-choice="${stage}"]:checked`);
    const check = document.querySelector(`[data-strategy-check="${stage}"]`);
    if (check) check.disabled = !choice || !el.value.trim();
  }
  if (el.matches("[data-rr-search]")) { query=el.value; ctx.rerender(); }
  if (el.matches("[data-adv-response]")) {
    const s = loadReadingState();
    const storyId = ctx.route.id.slice("adventure-".length);
    const current = s.adventures[storyId] || { chapter: 0, responses: {} };
    const chapter = Math.min(Math.max(0, Number(current.chapter) || 0), 5);
    current.started = true;
    current.responses = { ...(current.responses || {}), [chapter]: { ...(current.responses?.[chapter] || {}), [el.dataset.advResponse]: el.value, updatedAt: new Date().toISOString() } };
    s.adventures[storyId] = current;
    saveReadingState(s);
  }
  if (el.matches("[data-rr-note],[data-rr-reflection]")) saveField(el);
  if(el.matches("[data-rr-conference]"))saveConference(el);
  if (el.matches("[data-rr-response]")) saveAnswer(el.dataset.rrResponse,{text:el.value});
  if (el.matches("[data-rr-organizer]")) saveOrganizer(el);
}
export function onChange(e,ctx) {
  const el=e.target; if(el.matches("[data-rr-grade]")){grade=el.value;ctx.rerender();}
  if (el.matches("[data-strategy-strand],[data-strategy-cluster]")) {
    const params = new URLSearchParams(location.search);
    params.set(el.matches("[data-strategy-strand]") ? "strand" : "cluster", el.value);
    ctx.navigate(`${BASE}/reading-room/strategies?${params.toString()}`);
  }
  if (el.matches("[data-strategy-choice]")) {
    const stage = el.dataset.strategyChoice;
    const current = loadReadingState();
    const lessonId = ctx.route.id.slice("strategy-".length);
    const lesson = current.strategies[lessonId] || {};
    lesson[stage] = { ...(lesson[stage] || {}), selected: Number(el.value), checked: false, updatedAt: new Date().toISOString() };
    current.strategies[lessonId] = lesson; saveReadingState(current);
    ctx.rerender();
  }
  if (el.matches("input[name=adv-answer]")) {
    const s = loadReadingState();
    const storyId = ctx.route.id.slice("adventure-".length);
    const current = s.adventures[storyId] || { chapter: 0, responses: {} };
    const chapter = Math.min(Math.max(0, Number(current.chapter) || 0), 5);
    current.started = true;
    current.responses = { ...(current.responses || {}), [chapter]: { ...(current.responses?.[chapter] || {}), answer: Number(el.value), checked: false, updatedAt: new Date().toISOString() } };
    s.adventures[storyId] = current;
    saveReadingState(s);
    ctx.rerender();
  }
  if(el.matches("[data-rr-genre]")){genreFilter=el.value;ctx.rerender();}
  if(el.matches("[data-rr-mark]")){const s=loadReadingState(),meta=`${el.dataset.rrMark}@${el.dataset.rrRevision}:${el.dataset.rrParagraph}`;if(el.value)s.annotations[meta]={category:el.value};else delete s.annotations[meta];saveReadingState(s);}
  if(el.matches("[data-rr-workshop-cluster]")){const target=ctx.route.id==="pathways"?"pathways":"workshop";ctx.navigate(`${BASE}/reading-room/${target}?cluster=${encodeURIComponent(el.value)}&grades=${encodeURIComponent(ctx.band)}`);}
  if(el.matches("[data-rr-length]")){lengthFilter=el.value;ctx.rerender();}
  if(el.matches("[data-rr-conference-lesson]"))ctx.navigate(`${BASE}/reading-room/conference?lesson=${encodeURIComponent(el.value)}`);
  if(el.matches("[data-rr-setting]")){const s=loadReadingState();s.settings[el.dataset.rrSetting]=el.value;saveReadingState(s);ctx.rerender();}
  if(el.matches("[data-rr-answer]")) saveAnswer(el.dataset.rrAnswer,{value:el.value});
  if(el.matches("[data-rr-multi]")){const s=loadReadingState(),key=Object.keys(s.lessons).find(k=>k.startsWith(`${ctx.route.id}@`)),p=s.lessons[key]||{},a=p.answers||{},row=a[el.dataset.rrMulti]||{values:[]};row.values=[...document.querySelectorAll(`[data-rr-multi="${el.dataset.rrMulti}"]:checked`)].map(x=>x.value);a[el.dataset.rrMulti]=row;p.answers=a;s.lessons[key]=p;saveReadingState(s);}
  if(el.matches("[data-rr-cloze]")){const s=loadReadingState(),key=Object.keys(s.lessons).find(k=>k.startsWith(`${ctx.route.id}@`)),p=s.lessons[key]||{},a=p.answers||{},row=a[el.dataset.rrCloze]||{values:{}};row.values={...(row.values||{}),[el.dataset.blank]:el.value};a[el.dataset.rrCloze]=row;p.answers=a;s.lessons[key]=p;saveReadingState(s);}
  if(el.matches("[data-rr-structured]")){const s=loadReadingState(),key=Object.keys(s.lessons).find(k=>k.startsWith(`${ctx.route.id}@`)),p=s.lessons[key]||{},a=p.answers||{},id=el.dataset.rrStructured,row=a[id]||{values:[]};row.values=Array.from(document.querySelectorAll(`[data-rr-structured="${id}"]`)).map(x=>x.value===""?null:(Number.isNaN(Number(x.value))?x.value:Number(x.value)));a[id]=row;p.answers=a;s.lessons[key]=p;saveReadingState(s);}
  if(el.matches("[data-rr-evidence]")){const s=loadReadingState(), key=`${ctx.route.id}@1.0.0`,p=s.lessons[key]||{},a=p.answers||{},row=a[el.dataset.rrEvidence]||{values:[]};row.values=[...document.querySelectorAll(`[data-rr-evidence="${el.dataset.rrEvidence}"]:checked`)].map(x=>x.value);a[el.dataset.rrEvidence]=row;p.answers=a;s.lessons[key]=p;saveReadingState(s);}
}
function saveOrganizer(el){const s=loadReadingState(),id=el.dataset.rrLesson,key=Object.keys(s.lessons).find(k=>k.startsWith(`${id}@`))||`${id}@1.0.0`,p=s.lessons[key]||{};p.organizer={...(p.organizer||{}),[el.dataset.rrOrganizer]:el.value};s.lessons[key]=p;saveReadingState(s);}
function saveConference(el){const s=loadReadingState(),id=el.dataset.lesson;s.conferences={...(s.conferences||{}),[id]:{...(s.conferences?.[id]||{}),[el.dataset.rrConference]:el.value,updatedAt:new Date().toISOString()}};saveReadingState(s);}
function saveField(el){const s=loadReadingState(),id=el.dataset.rrLesson||el.dataset.rrReflection,key=Object.keys(s.lessons).find(k=>k.startsWith(`${id}@`))||`${id}@1.0.0`,p=s.lessons[key]||{};if(el.dataset.rrNote){p.notes={...(p.notes||{}),[el.dataset.rrNote]:el.value};}else p.reflection=el.value;s.lessons[key]=p;saveReadingState(s);}
function saveAnswer(id,patch){const s=loadReadingState(),key=Object.keys(s.lessons).find(k=>k.startsWith(`${location.pathname.split("/").pop()}@`)),p=s.lessons[key]||{},a=p.answers||{};a[id]={...(a[id]||{}),...patch};p.answers=a;s.lessons[key]=p;saveReadingState(s);}
export function onClick(e,ctx){const b=e.target.closest("button");if(!b)return false;const s=loadReadingState(),id=ctx.route.id,key=Object.keys(s.lessons).find(k=>k.startsWith(`${id}@`)),p=s.lessons[key]||{answers:{}};
  if (b.dataset.strategyRetry) {
    const lessonId = id.slice("strategy-".length), saved = s.strategies[lessonId] || {};
    saved[b.dataset.strategyRetry] = { ...(saved[b.dataset.strategyRetry] || {}), checked: false };
    s.strategies[lessonId] = saved; saveReadingState(s); ctx.rerender(); return true;
  }
  if (b.dataset.strategyCheck) {
    const stage = b.dataset.strategyCheck, lessonId = id.slice("strategy-".length);
    loadReadingStrategies().then(({ lessons = [] }) => {
      const lesson = lessons.find((row) => row.id === lessonId);
      if (!lesson) return;
      const current = loadReadingState(), saved = current.strategies[lessonId] || {}, response = saved[stage] || {};
      if (response.selected == null || !response.explanation?.trim() || (response.checked && response.correct)) return;
      const correct = response.selected === lesson[stage].answer;
      saved[stage] = { ...response, checked: true, correct, checkedAt: new Date().toISOString() };
      current.strategies[lessonId] = saved; saveReadingState(current); ctx.rerender();
      const evidenceId = `reading-strategy:${lessonId}:${stage}`;
      const ledger = loadLedger();
      if (!ledger.entries.some((entry) => entry.id === evidenceId)) {
        appendEntry(ledger, { id: evidenceId, src: "item", task: evidenceId, band: lesson.gradeCluster, domain: "Reading", stage: stage === "independent" ? "independent" : "guided", kind: "first", supports: stage === "guided" ? { model: true } : {}, m: { questions: [{ skill: lesson.skill, ok: correct, questionId: `${lessonId}-${stage}`, responseId: evidenceId }] } });
        saveLedger(ledger);
      }
    });
    return true;
  }
  if (b.dataset.advNav != null) {
    const storyId = id.slice("adventure-".length), current = s.adventures[storyId] || { responses: {} };
    current.started = true; current.chapter = Math.max(0, Math.min(5, Number(b.dataset.advNav)));
    s.adventures[storyId] = current; saveReadingState(s); ctx.rerender(); return true;
  }
  if (b.dataset.advListen === "stop") { stopSpeech(); return true; }
  if (b.dataset.advListen === "play") {
    loadReadingAdventures().then(({ stories = [] }) => {
      const story = stories.find((item) => item.id === id.slice("adventure-".length));
      const chapter = s.adventures[story?.id]?.chapter || 0;
      if (story) return speak(story.chapters[chapter].paragraphs, { lang: "en-US", rate: Number(s.settings.speechRate) || 0.95 });
    });
    return true;
  }
  if (b.dataset.advCheck != null) {
    loadReadingAdventures().then(({ stories = [] }) => {
      const story = stories.find((item) => item.id === id.slice("adventure-".length));
      if (!story) return;
      const current = loadReadingState(), saved = current.adventures[story.id] || { chapter: 0, responses: {} };
      const chapter = Number(b.dataset.advCheck), response = saved.responses?.[chapter] || {};
      if (response.answer == null) return;
      const correct = response.answer === story.chapters[chapter].question.answer;
      saved.responses = { ...saved.responses, [chapter]: { ...response, checked: true, correct, checkedAt: new Date().toISOString() } };
      current.adventures[story.id] = saved; saveReadingState(current); ctx.rerender();
      const ledgerId = `reading-adventure:${story.id}:chapter-${chapter + 1}`;
      const ledger = loadLedger();
      if (!ledger.entries.some((entry) => entry.id === ledgerId)) {
        appendEntry(ledger, { id: ledgerId, src: "item", task: ledgerId, band: story.gradeCluster, domain: "Reading", use: story.keyUse, stage: "independent", kind: "first", supports: {}, m: { questions: [{ skill: story.skill, ok: correct, questionId: `chapter-${chapter + 1}-checkpoint`, responseId: ledgerId }] } });
        saveLedger(ledger);
      }
    });
    return true;
  }
  if (b.hasAttribute("data-adv-complete")) {
    const storyId = id.slice("adventure-".length), current = s.adventures[storyId] || {};
    current.completed = true; current.completedAt = new Date().toISOString();
    s.adventures[storyId] = current; saveReadingState(s); ctx.rerender(); return true;
  }
  if(b.hasAttribute("data-rr-bookmark-filter")){onlyBookmarks=!onlyBookmarks;ctx.rerender();return true;}
  if(b.dataset.rrPhase){activePhase=b.dataset.rrPhase;ctx.rerender();return true;}
  if(b.dataset.rrPrint){window.print();return true;}
  if(b.hasAttribute("data-rr-export")){loadReadingRoomLessons().then(data=>{const quote=v=>`"${String(v??"").replaceAll('"','""')}"`;const lines=[["lesson_id","title","completed_on_device","checked_items","independent_checks","misses_to_revisit","skills_to_revisit"]];for(const l of data.lessons){const p=s.lessons[`${l.id}@${l.revision}`]||{},answers=Object.values(p.answers||{}).filter(a=>a.checked),independent=answers.filter(a=>a.mode==="independent").length,misses=answers.filter(a=>a.correct===false);lines.push([l.id,l.title,p.completed?"yes":"no",answers.length,independent,misses.length,[...new Set(misses.map(a=>a.skill||"checked skill"))].join("; ")]);}const csv=lines.map(row=>row.map(quote).join(",")).join("\r\n"),blob=new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="reading-room-local-progress.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});return true;}
  if(b.dataset.rrMode){activeMode=b.dataset.rrMode;ctx.rerender();return true;}
  if(b.dataset.rrPosition){const k=Object.keys(s.lessons).find(x=>x.startsWith(`${id}@`));if(k){s.lessons[k]={...(s.lessons[k]||{}),position:b.dataset.rrPosition};saveReadingState(s);ctx.rerender();}return true;}
  if(b.dataset.rrListen === "stop"){stopSpeech();return true;}
  if(b.dataset.rrListen === "play"){loadReadingRoomLessons().then(data=>{const lesson=data.lessons.find(x=>x.id===ctx.route.id);return speak(lesson.paragraphs.map(x=>x.text),{lang:"en-US",rate:Number(loadReadingState().settings.speechRate)||0.95});});return true;}
  if(b.dataset.rrRemoveWord){s.words.splice(Number(b.dataset.rrRemoveWord),1);saveReadingState(s);ctx.rerender();return true;}
  if(b.dataset.rrBookmark){s.bookmarks=s.bookmarks.includes(id)?s.bookmarks.filter(x=>x!==id):[...s.bookmarks,id];saveReadingState(s);ctx.rerender();return true;}
  if(b.dataset.rrAction==="clear"){clearReadingState();notice="Local Reading Room data cleared.";ctx.rerender();return true;}
  if(b.dataset.rrWord){const lword=document.querySelector(`[data-rr-word="${CSS.escape(b.dataset.rrWord)}"]`);if(lword){const lessonId=b.dataset.rrLesson;const d=lessonId;loadReadingRoomLessons().then(data=>{const lesson=data.lessons.find(x=>x.id===d),v=lesson?.vocabulary.find(x=>x.term===b.dataset.rrWord);const st=loadReadingState();if(v&&!st.words.some(w=>w.term===v.term&&w.lessonId===d))st.words.push({term:v.term,definition:v.definition,example:v.example,lessonId:d});saveReadingState(st);b.textContent="Saved to Word Notebook";});}return true;}
  if(b.dataset.rrCheck){const lessonPromise=loadReadingRoomLessons();lessonPromise.then(data=>{const l=data.lessons.find(x=>x.id===id),a=l.activities.find(x=>x.id===b.dataset.rrCheck),ans=p.answers?.[a.id]||{};let correct=false;if(a.type==='choice'||a.type==='connector')correct=ans.value===a.answerId;else if(a.type==='multi'||a.type==='hotText')correct=JSON.stringify([...(ans.values||[])].sort())===JSON.stringify([...(a.answerIds||[])].sort());else if(a.type==='cloze')correct=Object.entries(Object.fromEntries(a.segments.filter(x=>x.blank).map(x=>[x.blank.id,x.blank.answer]))).every(([blank,answer])=>ans.values?.[blank]===answer);else if(a.type==='evidence')correct=JSON.stringify([...(ans.values||[])].sort())===JSON.stringify([...a.answerIds].sort());else if(a.type==='order')correct=JSON.stringify(ans.values||[])===JSON.stringify(a.items.map(x=>a.answerOrder.indexOf(x.id)));else if(a.type==='sort')correct=JSON.stringify(ans.values||[])===JSON.stringify(a.items.map(x=>x.answer));p.answers={...(p.answers||{}),[a.id]:{...ans,checked:true,correct,attempts:(ans.attempts||0)+1,mode:activeMode,skill:a.skill}};s.lessons[key]=p;saveReadingState(s);ctx.rerender();});return true;}
  if(b.dataset.rrModel){p.answers={...(p.answers||{}),[b.dataset.rrModel]:{...(p.answers?.[b.dataset.rrModel]||{}),showModel:true}};s.lessons[key]=p;saveReadingState(s);ctx.rerender();return true;}
  if(b.dataset.rrComplete){p.completed=true;p.phase=activePhase;s.lessons[key]=p;saveReadingState(s);ctx.rerender();return true;}
  return false;
}
