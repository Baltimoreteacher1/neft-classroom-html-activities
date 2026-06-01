import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  resolveVocabImage,
  vocabImageAlt,
} from "../engine/core/vocab-images.js";
import { deriveTWR } from "../engine/core/twr.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slug = (term) =>
  String(term ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const blankLines = (n) =>
  Array.from({ length: n }, () => `<div class="writeline"></div>`).join("");

const choiceLetter = (i) => String.fromCharCode(65 + i);

// Matches core lessons ("3-2") and flagship lessons ("3-2-flagship").
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

function lessonConfigs() {
  return readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => existsSync(join(lessonsDir, d, "config.json")))
    .map((id) => {
      const cfg = JSON.parse(
        readFileSync(join(lessonsDir, id, "config.json"), "utf8")
      );
      // A lesson is "flagship" if the dir is suffixed OR the config carries a
      // flagship block (mission/scenes/finale). Both are handled gracefully.
      const isFlagship = id.endsWith("-flagship") || cfg.flagship != null;
      return { id, cfg, isFlagship };
    })
    .sort((a, b) => {
      const ma = a.id.match(LESSON_DIR_RE);
      const mb = b.id.match(LESSON_DIR_RE);
      const au = Number(ma[1]);
      const al = Number(ma[2]);
      const bu = Number(mb[1]);
      const bl = Number(mb[2]);
      // Order by unit, then lesson, then core before flagship.
      return (
        au - bu ||
        al - bl ||
        (a.id.endsWith("-flagship") ? 1 : 0) - (b.id.endsWith("-flagship") ? 1 : 0)
      );
    });
}

/* ---------- section builders ---------- */

function vocabSection(vocab = []) {
  if (!vocab.length) return "";
  const cards = vocab
    .map((v) => {
      const imgSrc = resolveVocabImage(v.term);
      const imgAlt = vocabImageAlt(v.term, v.definition);
      return `<div class="vocab-card">
  <div class="vocab-figure">
    <img src="${imgSrc}" alt="${esc(imgAlt)}" onerror="this.style.display='none'" />
    <p class="vocab-caption">${esc(v.visual)}</p>
  </div>
  <h3 class="vocab-term">${esc(v.term)}</h3>
  <p class="vocab-def">${esc(v.definition)}</p>
</div>`;
    })
    .join("\n");
  return `<section class="section vocab">
  <h2>Key Vocabulary <span class="level-tag level-1">Level 1 support</span></h2>
  <p class="level-note">Picture first, then the word, then a plain-language meaning. Say each word out loud.</p>
  <div class="vocab-grid">
${cards}
  </div>
</section>`;
}

// Key Ideas & Notes — the guided-notes block. Rebuilt as an easier, more
// visual, scaffolded sheet: a plain-language "what we're learning" line, then
// color-coded numbered steps (Notice → Key idea → Words I'll use) and a guided
// "Watch → We try → You try" mini-frame with blank work lines. Everything is
// grounded in existing config fields; no math facts are invented.
function notesSection(cfg = {}) {
  const launch = cfg.launch || {};
  const explore = cfg.explore || {};

  // Plain-language "what we're learning today" — prefer the content objective,
  // fall back to the language objective, then the lesson theme/title.
  const learningRaw =
    cfg.contentObjective ||
    cfg.languageObjective ||
    (cfg.title ? `We are learning about ${cfg.title}.` : "");
  const learningHtml = learningRaw
    ? `<div class="notes-learning">
      <span class="notes-learning-icon" aria-hidden="true">🎯</span>
      <div>
        <p class="notes-learning-label">What we're learning today</p>
        <p class="notes-learning-text">${esc(learningRaw)}</p>
      </div>
    </div>`
    : "";

  // 1️⃣ Notice — the first thing to look at, from the launch story / notice prompt.
  const noticeText =
    (launch.narrative
      ? launch.narrative
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter(Boolean)[0]
      : "") ||
    (Array.isArray(launch.noticePrompts) ? launch.noticePrompts[0] : "") ||
    "Look closely at the problem before you start.";

  // 2️⃣ Key idea — the lesson's content objective stated as the big idea.
  const keyIdeaText =
    cfg.contentObjective ||
    (explore.instructions ? explore.instructions.trim() : "") ||
    "Write the main math idea in your own words.";

  const stepCard = (num, icon, title, body) =>
    `<div class="notes-step notes-step-${num}">
      <div class="notes-step-head"><span class="notes-step-num" aria-hidden="true">${icon}</span>
        <h4 class="notes-step-title">${esc(title)}</h4></div>
      ${body}
    </div>`;

  const steps = [
    stepCard(
      1,
      "1️⃣",
      "Notice",
      `<p class="notes-step-text">${esc(noticeText)}</p>`,
    ),
    stepCard(
      2,
      "2️⃣",
      "Key idea",
      `<p class="notes-step-text">${esc(keyIdeaText)}</p>`,
    ),
  ];

  // 3️⃣ Words I'll use — chip strip of the lesson's vocabulary terms.
  const vocabTerms = Array.isArray(cfg.vocabulary)
    ? cfg.vocabulary.map((v) => v && v.term).filter(Boolean)
    : [];
  if (vocabTerms.length) {
    const chips = vocabTerms
      .map((t) => `<span class="notes-word-chip">${esc(t)}</span>`)
      .join("");
    steps.push(
      stepCard(
        3,
        "3️⃣",
        "Words I'll use",
        `<div class="notes-word-chips">${chips}</div>`,
      ),
    );
  }

  const stepsHtml = `<div class="notes-steps">${steps.join("")}</div>`;

  // "Think About It" prompts — kept, but presented as a friendly question strip.
  const noticeWonder = []
    .concat(launch.noticePrompts || [], launch.wonderPrompts || [])
    .slice(0, 3);
  const promptHtml = noticeWonder.length
    ? `<div class="think-block">
    <h3>🤔 Think About It</h3>
    <ul class="prompt-list">${noticeWonder.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
  </div>`
    : "";

  // Guided "Watch → We try → You try" mini-frame with blank work lines.
  const gradualHtml = `<div class="notes-gradual">
    <div class="notes-gr-step notes-gr-watch">
      <span class="notes-gr-tag">👀 Watch</span>
      <p class="notes-gr-cue">Watch your teacher model one example. Jot what you see.</p>
      ${blankLines(1)}
    </div>
    <div class="notes-gr-step notes-gr-we">
      <span class="notes-gr-tag">🤝 We try</span>
      <p class="notes-gr-cue">Solve the next one together as a class.</p>
      ${blankLines(2)}
    </div>
    <div class="notes-gr-step notes-gr-you">
      <span class="notes-gr-tag">✏️ You try</span>
      <p class="notes-gr-cue">Now try one on your own.</p>
      ${blankLines(2)}
    </div>
  </div>`;

  return `<section class="section notes">
  <h2>Key Ideas &amp; Notes</h2>
  ${learningHtml}
  ${stepsHtml}
  ${promptHtml}
  ${gradualHtml}
</section>`;
}

// Turn & Talk — Discussion Points. Driven by cfg.turnAndTalk[]. Renders a
// leveled, partner-discussion section: Level 1 (support) gets a kernel,
// bilingual sentence stems, a word bank, and a teacher "listen for" note;
// Level 2 gets a deeper push question with stretch stems. Defensive about
// every optional field so older configs still render.
function ttBilingual(stem) {
  // Accepts a string or { en, es } object; reuses the twr-frame bilingual look.
  const en = typeof stem === "string" ? stem : stem && stem.en;
  const es = typeof stem === "object" && stem ? stem.es : "";
  if (!en) return "";
  return `<p class="twr-frame"><span class="twr-en">${esc(en)}</span>${
    es ? `<span class="twr-es">${esc(es)}</span>` : ""
  }</p>`;
}

// Derive a SHORT strategy hint for a Turn & Talk item. Uses an explicit
// item.hint when present; otherwise builds a non-answer-giving nudge (what to
// look at / what to ask yourself / which word-bank term to try). NEVER uses
// item.listenFor and NEVER states the answer.
function deriveTtHint(item) {
  if (item.hint) return String(item.hint).trim();
  const parts = [];
  const wb = Array.isArray(item.wordBank) ? item.wordBank.filter(Boolean) : [];
  if (wb.length) {
    const picks = wb.slice(0, 2).join('" or "');
    parts.push(`Try starting with the word "${picks}".`);
  }
  // Turn the question into a self-check prompt without revealing the answer.
  if (item.question) {
    parts.push("Re-read the question and underline what it is asking you to compare or find.");
  } else {
    parts.push("Ask yourself: what does the math show, and how do I know?");
  }
  parts.push("Use one number or word from the problem as your evidence.");
  return parts.join(" ");
}

function turnAndTalkCard(item) {
  const phaseRaw = String(item.phase || "").trim();
  const phaseLabel = phaseRaw
    ? phaseRaw.charAt(0).toUpperCase() + phaseRaw.slice(1)
    : "Discuss";
  const phaseBadge = `<span class="tt-phase">${esc(phaseLabel)}</span>`;
  const question = item.question
    ? `<p class="tt-question">${esc(item.question)}</p>`
    : "";

  // --- Level 1 (support) block ---
  const kernel = item.kernel
    ? `<p class="tt-kernel"><span class="tt-kernel-label">Start here:</span> ${esc(item.kernel)}</p>`
    : "";
  const stems = Array.isArray(item.stems)
    ? item.stems.map((s) => ttBilingual(s)).filter(Boolean).join("")
    : "";
  const stemsHtml = stems
    ? `<div class="tt-stems">
      <p class="tt-mini-label tt-stems-label">Sentence starters (optional)</p>
      ${stems}
    </div>`
    : "";
  // Optional collapsible strategy hint — never reveals the answer.
  const hintText = deriveTtHint(item);
  const hintHtml = hintText
    ? `<details class="tt-hint-toggle">
      <summary>💡 Need a hint?</summary>
      <p class="tt-hint-text">${esc(hintText)}</p>
    </details>`
    : "";
  const wordBank = Array.isArray(item.wordBank)
    ? item.wordBank.filter(Boolean)
    : [];
  const wordBankHtml = wordBank.length
    ? `<div class="tt-wordbank"><span class="tt-mini-label">Word bank:</span> ${wordBank
        .map((w) => `<span class="tt-word">${esc(w)}</span>`)
        .join("")}</div>`
    : "";
  const listenFor = item.listenFor
    ? `<p class="tt-listen"><span class="tt-mini-label">Listen for:</span> ${esc(item.listenFor)}</p>`
    : "";
  const supportInner = [kernel, hintHtml, stemsHtml, wordBankHtml, listenFor]
    .filter(Boolean)
    .join("\n    ");
  const support = supportInner
    ? `<div class="tt-support">
    <span class="level-tag level-1">Level 1 support</span>
    ${supportInner}
  </div>`
    : "";

  // --- Level 2 block ---
  const extendQ = item.extend
    ? `<p class="tt-extend-q">${esc(item.extend)}</p>`
    : "";
  const extendStems = Array.isArray(item.extendStems)
    ? item.extendStems.filter(Boolean)
    : [];
  const extendStemsHtml = extendStems.length
    ? `<ul class="tt-extend-stems">${extendStems
        .map((s) => `<li>${esc(s)}</li>`)
        .join("")}</ul>`
    : "";
  const extend =
    extendQ || extendStemsHtml
      ? `<div class="tt-extend">
    <span class="level-tag level-2">Level 2</span>
    ${[extendQ, extendStemsHtml].filter(Boolean).join("\n    ")}
  </div>`
      : "";

  return `<div class="tt-card">
  ${phaseBadge}
  ${question}
  ${support}
  ${extend}
</div>`;
}

function turnAndTalkSection(cfg) {
  const items = Array.isArray(cfg.turnAndTalk) ? cfg.turnAndTalk : [];
  if (!items.length) return "";
  const cards = items.map((it) => turnAndTalkCard(it)).join("\n");
  return `<section class="section turn-and-talk">
  <h2>Turn &amp; Talk — Discussion Points <span class="level-tag level-1">Level 1 support</span> <span class="level-tag level-2">Level 2</span></h2>
  <p class="level-note">Talk with a partner about each prompt. If you need help getting started, use the Level 1 sentence stems. Ready for more? Try the Level 2 question.</p>
  ${cards}
</section>`;
}

// Build worked-example HTML for an MC / open-response / error-analysis item.
function workedExample(item, n) {
  let body = "";
  const problem = item.stem || item.instructions || item.title || "";

  if (item.type === "error-analysis") {
    const steps = (item.workedExample || [])
      .map(
        (s) =>
          `<li><span class="step-label">${esc(s.label)}:</span> ${esc(s.work)}</li>`
      )
      .join("");
    body = `<p class="ex-problem">${esc(item.title || "Error Analysis")}</p>
    <ol class="ex-steps">${steps}</ol>
    <p class="ex-solution"><strong>Correct reasoning:</strong> ${esc(item.correctWork)}</p>`;
  } else if (item.type === "fill-table") {
    body = `<p class="ex-problem">${esc(problem)}</p>
    <p class="ex-solution">${esc((item.editableCells || []).map((c) => c.answer).filter(Boolean).join("; "))}</p>`;
  } else {
    let answerLine = "";
    if (Array.isArray(item.choices) && typeof item.correctIndex === "number") {
      answerLine = `<p class="ex-answer"><strong>Answer:</strong> ${choiceLetter(item.correctIndex)}. ${esc(item.choices[item.correctIndex])}</p>`;
    } else if (item.sampleAnswer) {
      answerLine = `<p class="ex-answer"><strong>Sample answer:</strong> ${esc(item.sampleAnswer)}</p>`;
    }
    body = `<p class="ex-problem">${esc(problem)}</p>
    <p class="ex-solution"><strong>Solution:</strong> ${esc(item.explanation || item.sampleAnswer || "")}</p>
    ${answerLine}`;
  }

  return `<div class="example">
  <h3 class="example-head">Example ${n}</h3>
  ${body}
</div>`;
}

function gatherPractice(practice = {}) {
  return []
    .concat(practice.approaching || [], practice.onLevel || [], practice.extending || []);
}

function examplesSection(practice = {}) {
  const items = gatherPractice(practice);
  // Prefer items that have an explanation or worked content for examples.
  const candidates = items.filter(
    (it) =>
      (it.stem && it.explanation) ||
      it.type === "error-analysis" ||
      (it.type === "open-response" && it.sampleAnswer)
  );
  const chosen = candidates.slice(0, 3);
  if (!chosen.length) return "";
  return `<section class="section examples">
  <h2>Guided Examples</h2>
  ${chosen.map((it, i) => workedExample(it, i + 1)).join("\n")}
</section>`;
}

function tryItProblem(it, i) {
  let choiceHtml = "";
  if (Array.isArray(it.choices)) {
    choiceHtml = `<ol class="try-choices" type="A">${it.choices
      .map((c) => `<li>${esc(c)}</li>`)
      .join("")}</ol>`;
  }
  return `<div class="tryit">
  <p class="tryit-num">${i + 1}. ${esc(it.stem)}</p>
  ${choiceHtml}
  <div class="work-space"><span class="ws-label">Show your work:</span>${blankLines(3)}</div>
</div>`;
}

function tryItSection(practice = {}) {
  const items = gatherPractice(practice).filter((it) => it.stem);
  // Pick a couple that were not necessarily used above; take from middle/end.
  const picks = items.slice(-2).length ? items.slice(-2) : items.slice(0, 2);
  if (!picks.length) return "";
  const probs = picks.map((it, i) => tryItProblem(it, i)).join("\n");

  return `<section class="section tryit-section">
  <h2>Try It</h2>
  <p class="muted">Solve on your own. Check the answer key when you are done.</p>
  ${probs}
  ${enrichSection(practice, new Set(picks.map((p) => p.stem)))}
</section>`;
}

// Level 2 enrichment: pull a harder challenge from the "extending" practice
// items. Prefers an open-response prompt (with a sentence frame), then an
// item with a stem, then an error-analysis to investigate. Always renders
// something when extending content exists so every sheet shows Level 2.
function enrichSection(practice = {}, usedStems = new Set()) {
  const ext = practice.extending || [];
  if (!ext.length) return "";

  let promptHtml = "";
  let frameHtml = "";
  let choiceHtml = "";

  const open = ext.find((it) => it.type === "open-response" && it.prompt);
  const stemItem = ext.find((it) => it.stem && !usedStems.has(it.stem));
  const errItem = ext.find((it) => it.type === "error-analysis");

  if (open) {
    promptHtml = `<p class="tryit-num">${esc(open.prompt)}</p>`;
    if (open.sentenceFrame) {
      frameHtml = `<p class="sentence-frame"><span class="ws-label">Sentence starter:</span> ${esc(open.sentenceFrame)}</p>`;
    }
  } else if (stemItem) {
    promptHtml = `<p class="tryit-num">${esc(stemItem.stem)}</p>`;
    if (Array.isArray(stemItem.choices)) {
      choiceHtml = `<ol class="try-choices" type="A">${stemItem.choices
        .map((c) => `<li>${esc(c)}</li>`)
        .join("")}</ol>`;
    }
  } else if (errItem) {
    promptHtml = `<p class="tryit-num">${esc(errItem.title || "Find and fix the mistake")} — find the error, then write the correct reasoning.</p>`;
  } else {
    return "";
  }

  return `<div class="enrich-block">
    <h3>Stretch Your Thinking <span class="level-tag level-2">Level 2 enrichment</span></h3>
    <p class="muted">Challenge task — explain your reasoning in full sentences.</p>
    ${promptHtml}
    ${choiceHtml}
    ${frameHtml}
    <div class="work-space"><span class="ws-label">Show your work:</span>${blankLines(4)}</div>
  </div>`;
}

function reflectSection(reflect = {}) {
  const et = reflect.exitTicket || {};
  const stem = et.stem || "";
  if (!stem) return "";
  let choiceHtml = "";
  if (Array.isArray(et.choices)) {
    choiceHtml = `<ol class="try-choices" type="A">${et.choices
      .map((c) => `<li>${esc(c)}</li>`)
      .join("")}</ol>`;
  }
  return `<section class="section reflect">
  <h2>Reflect — Exit Ticket</h2>
  <p class="reflect-stem">${esc(stem)}</p>
  ${choiceHtml}
  <div class="work-space"><span class="ws-label">Your answer:</span>${blankLines(3)}</div>
</section>`;
}

function answerKeySection(practice = {}, reflect = {}, config = null) {
  const rows = [];
  let n = 1;
  // Try It picks mirrored from tryItSection logic.
  const items = gatherPractice(practice).filter((it) => it.stem);
  const tryPicks = items.slice(-2).length ? items.slice(-2) : items.slice(0, 2);
  tryPicks.forEach((it) => {
    let ans = "";
    if (Array.isArray(it.choices) && typeof it.correctIndex === "number") {
      ans = `${choiceLetter(it.correctIndex)}. ${it.choices[it.correctIndex]}`;
    } else if (it.sampleAnswer) {
      ans = it.sampleAnswer;
    }
    rows.push(
      `<li><strong>Try It ${n++}:</strong> ${esc(ans)}${
        it.explanation ? ` <span class="ak-why">— ${esc(it.explanation)}</span>` : ""
      }</li>`
    );
  });

  const et = reflect.exitTicket || {};
  if (et.stem) {
    let ans = "";
    if (Array.isArray(et.choices) && typeof et.correctIndex === "number") {
      ans = `${choiceLetter(et.correctIndex)}. ${et.choices[et.correctIndex]}`;
    }
    rows.push(
      `<li><strong>Exit Ticket:</strong> ${esc(ans)}${
        et.explanation ? ` <span class="ak-why">— ${esc(et.explanation)}</span>` : ""
      }</li>`
    );
  }
  const twrRows = config ? twrAnswerKey(config) : "";
  if (!rows.length && !twrRows) return "";
  return `<section class="answer-key">
  <h2>Answer Key &amp; Teacher Guide</h2>
  <ol class="ak-list">${rows.join("")}</ol>
  ${
    twrRows
      ? `<h3 class="ak-twr-head">Writing (TWR) — what to look for</h3><ul class="ak-list">${twrRows}</ul>`
      : ""
  }
</section>`;
}

/* ---------- The Writing Revolution (TWR) ---------- */

// A bilingual frame line: bold English, italic Spanish under it.
function frameLine(en, es) {
  return `<p class="twr-frame"><span class="twr-en">${esc(en)}</span>${
    es ? `<span class="twr-es">${esc(es)}</span>` : ""
  }</p>`;
}

function twrSection(config) {
  const twr = deriveTWR(config);

  // 1. Kernel sentence
  const kernel = `<div class="twr-block">
    <h3>1. Kernel Sentence <span class="twr-tag">subject + verb</span></h3>
    <p class="twr-model"><span class="twr-label">Model:</span> ${esc(twr.kernel.en)}${
      twr.kernel.es ? `<span class="twr-es">${esc(twr.kernel.es)}</span>` : ""
    }</p>
    ${frameLine(twr.kernel.promptEn, twr.kernel.promptEs)}
    ${blankLines(2)}
  </div>`;

  // 2. Sentence expansion (because / but / so)
  const expRows = twr.expansion.conjunctions
    .map(
      (c) => `<div class="twr-exp-row">
      <span class="twr-conj">${esc(c.word)}<span class="twr-conj-es">${esc(c.wordEs)}</span></span>
      <div class="twr-exp-lines">
        ${frameLine(c.frameEn, c.frameEs)}
        ${blankLines(1)}
      </div>
    </div>`,
    )
    .join("");
  const expansion = `<div class="twr-block">
    <h3>2. Sentence Expansion <span class="twr-tag">because · but · so</span></h3>
    <p class="twr-model"><span class="twr-label">Kernel:</span> ${esc(twr.expansion.kernelEn)}${
      twr.expansion.kernelEs
        ? `<span class="twr-es">${esc(twr.expansion.kernelEs)}</span>`
        : ""
    }</p>
    <p class="muted">Expand the kernel three ways. Add a reason, a contrast, and a result.</p>
    ${expRows}
  </div>`;

  // 3. Sentence types
  const typeRows = twr.sentenceTypes
    .map(
      (t) => `<div class="twr-type-row">
      <span class="twr-type-name">${esc(t.type)}<span class="twr-conj-es">${esc(t.typeEs)}</span></span>
      <div class="twr-exp-lines">
        <p class="twr-hint">${esc(t.hintEn)}${
          t.hintEs ? `<span class="twr-es">${esc(t.hintEs)}</span>` : ""
        }</p>
        ${frameLine(t.frameEn, t.frameEs)}
        ${blankLines(1)}
      </div>
    </div>`,
    )
    .join("");
  const types = `<div class="twr-block">
    <h3>3. Sentence Types <span class="twr-tag">4 ways to write a math idea</span></h3>
    ${typeRows}
  </div>`;

  // 4. Explain your reasoning
  const stemHtml = twr.reasoningStems
    .map((s) => frameLine(s.en, s.es))
    .join("");
  const reasoning = `<div class="twr-block">
    <h3>4. Explain Your Reasoning <span class="twr-tag">use a sentence starter</span></h3>
    <div class="twr-stems">${stemHtml}</div>
    ${blankLines(3)}
  </div>`;

  return `<section class="section twr">
  <h2>Write About the Math <span class="twr-method">The Writing Revolution</span></h2>
  <p class="level-note">${
    twr.languageObjective
      ? esc(twr.languageObjective)
      : "Build strong math sentences. Write, then say each sentence out loud."
  }</p>
  ${kernel}
  ${expansion}
  ${types}
  ${reasoning}
</section>`;
}

function twrAnswerKey(config) {
  const twr = deriveTWR(config);
  const items = [
    `<li><strong>Kernel sentence:</strong> A complete sentence needs a subject and a verb. Example: ${esc(twr.kernel.en)}</li>`,
    `<li><strong>Expansion:</strong> <em>because</em> gives a reason, <em>but</em> shows a contrast or exception, <em>so</em> shows a result. Answers vary; each must keep the kernel idea and add the correct kind of detail.</li>`,
    `<li><strong>Sentence types:</strong> Statement ends with a period, question with "?", exclamation with "!", and a command starts with an action verb (a "bossy" verb).</li>`,
  ];
  return items.join("");
}

/* ---------- page assembly ---------- */

function styles(printTitle = "") {
  const safeTitle = String(printTitle).replace(/["\\]/g, "");
  return `<style>
:root{
  --navy:#12355b;--teal:#1fa6a2;--teal-light:#dff2ee;--amber:#f2c15b;
  --cream:#f7f4ec;--ink:#21313f;--muted:#5f6f80;--line:#d7e2ed;--card:#fff;
}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);
  font-family:Calibri,"Segoe UI",system-ui,sans-serif;line-height:1.5;}
.sheet{max-width:8.5in;margin:0 auto;background:var(--card);padding:0.6in;}
.topbar{position:sticky;top:0;background:var(--navy);color:#fff;display:flex;
  justify-content:space-between;align-items:center;padding:12px 18px;}
.topbar .brand{font-weight:700;font-family:Outfit,system-ui,sans-serif;}
.print-btn{background:var(--amber);color:var(--navy);border:0;border-radius:8px;
  padding:9px 16px;font-weight:700;cursor:pointer;font-size:15px;}
header.packet{border-bottom:3px solid var(--teal);padding-bottom:14px;margin-bottom:18px;}
header.packet .eyebrow{color:var(--teal);font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;font-size:13px;margin:0;}
header.packet h1{font-family:Outfit,system-ui,sans-serif;color:var(--navy);
  margin:6px 0 4px;font-size:26px;}
header.packet .meta{color:var(--muted);font-size:14px;margin:0;}
.name-line{display:flex;gap:24px;flex-wrap:wrap;margin-top:12px;font-size:14px;}
.name-line span{flex:1;border-bottom:1px solid var(--ink);padding:4px 0;min-width:140px;}
.section{margin:0 0 22px;page-break-inside:avoid;}
.section>h2{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:19px;
  border-left:5px solid var(--teal);padding-left:10px;margin:0 0 12px;}
.vocab-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
.vocab-card{border:1px solid var(--line);border-radius:10px;padding:12px;background:#fff;
  page-break-inside:avoid;}
.vocab-term{margin:0 0 4px;color:var(--navy);font-size:16px;}
.vocab-def{margin:0 0 8px;font-size:14px;}
.vocab-figure{text-align:center;background:var(--teal-light);border-radius:8px;padding:8px;}
.vocab-figure img{max-width:100%;max-height:120px;}
.vocab-caption{margin:6px 0 0;font-size:12.5px;color:var(--muted);font-style:italic;}
.notes-bullets,.prompt-list{margin:0 0 10px;padding-left:20px;}
.notes-bullets li,.prompt-list li{margin:5px 0;}
.think-block{background:var(--amber-light,#fef7e0);border-radius:8px;padding:10px 14px;margin:10px 0;}
.think-block h3{margin:0 0 6px;font-size:15px;color:var(--navy);}
/* Guided notes — learning line, visual steps, gradual-release frame */
.notes-learning{display:flex;gap:12px;align-items:flex-start;background:var(--teal-light);
  border:1px solid var(--teal);border-radius:10px;padding:12px 14px;margin:0 0 14px;page-break-inside:avoid;}
.notes-learning-icon{font-size:22px;line-height:1;flex:0 0 auto;}
.notes-learning-label{margin:0 0 2px;font-size:11.5px;font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;color:var(--teal);}
.notes-learning-text{margin:0;font-size:15px;font-weight:600;color:var(--navy);}
.notes-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 14px;}
.notes-step{border:1px solid var(--line);border-radius:10px;padding:12px;background:#fff;
  border-top:5px solid var(--teal);page-break-inside:avoid;}
.notes-step-2{border-top-color:var(--amber);}
.notes-step-3{border-top-color:var(--navy);}
.notes-step-head{display:flex;align-items:center;gap:8px;margin:0 0 6px;}
.notes-step-num{font-size:18px;line-height:1;}
.notes-step-title{margin:0;font-size:14.5px;color:var(--navy);}
.notes-step-text{margin:0;font-size:13.5px;line-height:1.4;}
.notes-word-chips{display:flex;flex-wrap:wrap;gap:6px;}
.notes-word-chip{display:inline-block;font-size:12.5px;font-weight:600;color:var(--navy);
  background:var(--teal-light);border:1px solid var(--teal);border-radius:999px;padding:2px 10px;}
.notes-gradual{display:grid;grid-template-columns:1fr;gap:10px;margin:6px 0 0;}
.notes-gr-step{border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:8px;
  padding:10px 12px;background:#fff;page-break-inside:avoid;}
.notes-gr-we{border-left-color:var(--amber);}
.notes-gr-you{border-left-color:var(--navy);}
.notes-gr-tag{display:inline-block;font-size:12.5px;font-weight:700;color:var(--navy);
  background:var(--cream);border:1px solid var(--line);border-radius:999px;padding:2px 10px;margin:0 0 6px;}
.notes-gr-cue{margin:0 0 6px;font-size:13px;color:var(--muted);}
/* Turn & Talk — optional hint + optional starters label */
.tt-hint-toggle{margin:6px 0;border:1px solid var(--teal);background:#fff;border-radius:8px;
  padding:6px 10px;}
.tt-hint-toggle>summary{cursor:pointer;font-weight:700;font-size:13.5px;color:var(--teal);list-style:none;}
.tt-hint-toggle>summary::-webkit-details-marker{display:none;}
.tt-hint-text{margin:6px 0 0;font-size:13.5px;color:var(--ink);}
.tt-stems-label{display:block;margin:0 0 4px;font-size:12px;font-weight:700;color:var(--navy);
  text-transform:none;letter-spacing:0;}
.my-notes h3,.work-space .ws-label{font-size:14px;color:var(--muted);}
.writeline{border-bottom:1px solid #b9c6d3;height:26px;}
.example{border:1px solid var(--line);border-left:4px solid var(--amber);border-radius:8px;
  padding:12px 14px;margin:0 0 12px;page-break-inside:avoid;}
.example-head{margin:0 0 6px;color:var(--navy);font-size:16px;}
.ex-problem{margin:0 0 8px;font-weight:600;}
.ex-steps{margin:0 0 8px;padding-left:20px;}
.step-label{color:var(--teal);font-weight:700;}
.ex-solution,.ex-answer{margin:6px 0 0;font-size:14.5px;}
.tryit{margin:0 0 14px;page-break-inside:avoid;}
.tryit-num,.reflect-stem{font-weight:600;margin:0 0 6px;}
.try-choices{margin:0 0 8px;padding-left:24px;}
.try-choices li{margin:3px 0;}
.work-space{margin-top:6px;}
.muted{color:var(--muted);font-size:14px;}
.answer-key{page-break-before:always;border-top:3px solid var(--navy);margin-top:24px;padding-top:14px;}
.answer-key h2{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:19px;}
.ak-list{padding-left:22px;}
.ak-list li{margin:8px 0;}
.ak-twr-head{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:16px;margin:14px 0 6px;}
.ak-why{color:var(--muted);font-style:italic;}
footer.packet{margin-top:18px;border-top:1px solid var(--line);padding-top:8px;
  color:var(--muted);font-size:12px;text-align:center;}
.level-tag{display:inline-block;font-family:Calibri,system-ui,sans-serif;font-size:11.5px;
  font-weight:700;letter-spacing:.02em;padding:2px 9px;border-radius:999px;vertical-align:middle;
  margin-left:8px;text-transform:none;}
.level-1{background:var(--teal-light);color:var(--teal);border:1px solid var(--teal);}
.level-2{background:#fef0d8;color:#9a6b12;border:1px solid var(--amber);}
.level-note{margin:-4px 0 12px;font-size:13.5px;color:var(--muted);}
.flagship-badge{display:inline-block;font-size:13px;font-weight:700;background:var(--amber);
  color:var(--navy);border-radius:999px;padding:3px 12px;vertical-align:middle;font-family:Calibri,system-ui,sans-serif;}
.mission{background:linear-gradient(135deg,var(--navy),#1b4a7a);color:#fff;border-radius:12px;
  padding:16px 20px;margin:0 0 22px;}
.mission-eyebrow{margin:0 0 4px;color:var(--amber);font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;font-size:12px;}
.mission-title{font-family:Outfit,system-ui,sans-serif;margin:0 0 8px;font-size:20px;border:0;padding:0;color:#fff;}
.mission-story{margin:0;font-size:14px;line-height:1.55;}
.enrich-block{border:1px dashed var(--amber);background:#fffaf0;border-radius:10px;
  padding:12px 14px;margin:14px 0 0;page-break-inside:avoid;}
.enrich-block h3{margin:0 0 4px;font-size:15px;color:var(--navy);}
.sentence-frame{font-size:13.5px;color:var(--muted);font-style:italic;margin:4px 0 8px;}
/* The Writing Revolution (TWR) */
.section.twr>h2{border-left-color:var(--amber);}
.twr-method{display:inline-block;font-size:11.5px;font-weight:700;background:var(--amber);
  color:var(--navy);border-radius:999px;padding:2px 10px;vertical-align:middle;margin-left:8px;}
.twr-block{border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:8px;
  padding:12px 14px;margin:0 0 12px;page-break-inside:avoid;background:#fff;}
.twr-block h3{margin:0 0 8px;color:var(--navy);font-size:15.5px;}
.twr-tag{display:inline-block;font-size:11px;font-weight:600;color:var(--teal);
  background:var(--teal-light);border-radius:999px;padding:1px 9px;margin-left:6px;vertical-align:middle;}
.twr-model{background:var(--teal-light);border-radius:6px;padding:8px 10px;margin:0 0 8px;font-size:14px;}
.twr-label{font-weight:700;color:var(--teal);margin-right:4px;}
.twr-frame{margin:4px 0 4px;font-size:14px;}
.twr-en{font-weight:600;}
.twr-es{display:block;color:var(--muted);font-style:italic;font-size:13px;}
.twr-exp-row,.twr-type-row{display:grid;grid-template-columns:96px 1fr;gap:10px;
  align-items:start;margin:8px 0;}
.twr-conj,.twr-type-name{font-weight:700;color:var(--navy);background:#fef0d8;
  border-radius:6px;padding:4px 8px;font-size:13.5px;text-align:center;}
.twr-conj-es{display:block;font-weight:600;color:var(--muted);font-style:italic;font-size:11.5px;}
.twr-exp-lines{min-width:0;}
.twr-hint{margin:0 0 4px;font-size:13px;color:var(--muted);}
.twr-stems{margin:0 0 8px;}
/* Turn & Talk — Discussion Points */
.section.turn-and-talk>h2{border-left-color:var(--teal);}
.tt-card{border:1px solid var(--line);border-left:4px solid var(--navy);border-radius:8px;
  padding:12px 14px;margin:0 0 12px;page-break-inside:avoid;background:#fff;}
.tt-phase{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;color:#fff;background:var(--navy);border-radius:999px;
  padding:2px 10px;margin:0 0 8px;}
.tt-question{font-weight:600;color:var(--navy);font-size:15px;margin:6px 0 10px;}
.tt-support{background:var(--teal-light);border:1px solid var(--teal);border-radius:8px;
  padding:10px 12px;margin:0 0 10px;}
.tt-extend{background:#fffaf0;border:1px dashed var(--amber);border-radius:8px;
  padding:10px 12px;margin:0;}
.tt-support .level-tag,.tt-extend .level-tag{margin:0 0 6px;}
.tt-kernel{margin:6px 0;font-size:14px;}
.tt-kernel-label{font-weight:700;color:var(--teal);margin-right:4px;}
.tt-stems{margin:6px 0;}
.tt-mini-label{font-weight:700;color:var(--navy);margin-right:4px;}
.tt-wordbank{margin:6px 0;font-size:13.5px;}
.tt-word{display:inline-block;font-weight:600;color:var(--teal);background:#fff;
  border:1px solid var(--teal);border-radius:999px;padding:1px 9px;margin:2px 4px 2px 0;font-size:12.5px;}
.tt-listen{margin:6px 0 0;font-size:13px;color:var(--muted);font-style:italic;}
.tt-extend-q{font-weight:600;color:#9a6b12;margin:4px 0 6px;font-size:14px;}
.tt-extend-stems{margin:4px 0 0;padding-left:20px;font-size:13.5px;}
.tt-extend-stems li{margin:3px 0;}
/* Download menu */
.dl-wrap{position:relative;display:inline-block;margin-left:10px;}
.dl-menu{position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid var(--line);
  border-radius:8px;box-shadow:0 8px 24px rgba(18,53,91,.18);padding:6px;min-width:210px;z-index:20;}
.dl-menu[hidden]{display:none;}
.dl-menu a{display:block;padding:9px 12px;color:var(--ink);text-decoration:none;border-radius:6px;
  font-size:14px;font-weight:600;}
.dl-menu a:hover,.dl-menu a:focus{background:var(--teal-light);}
.dl-menu .dl-sub{display:block;font-weight:400;color:var(--muted);font-size:12px;}
@media print{
  @page{
    size:letter;margin:0.7in 0.7in 0.85in;
    @bottom-left{content:"Neft Teacher";font-family:Georgia,serif;font-size:9pt;color:#444;}
    @bottom-center{content:"${safeTitle}";font-family:Georgia,serif;font-size:9pt;color:#444;}
    @bottom-right{content:"Page " counter(page) " of " counter(pages);font-family:Georgia,serif;font-size:9pt;color:#444;}
  }
  @page:first{
    @top-center{content:"";}
  }
  body{background:#fff;color:#000;font-family:Georgia,"Times New Roman",serif;font-size:11.5pt;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .topbar,.print-btn,.no-print,.dl-wrap{display:none !important;}
  .sheet{max-width:none;margin:0;padding:0;box-shadow:none;}
  .section{margin-bottom:16px;}
  .section>h2,header.packet h1,header.packet .eyebrow,.example-head,
  .answer-key h2,.vocab-term,.twr-block h3{color:#000;}
  .vocab-figure{background:#fff;border:1px solid #000;}
  .think-block{background:#fff;border:1px solid #000;}
  .notes-learning{background:#fff;border:1px solid #000;}
  .notes-learning-label,.notes-learning-text,.notes-step-title{color:#000;}
  .notes-step{background:#fff;border:1px solid #000;border-top:2px solid #000;}
  .notes-step-2,.notes-step-3{border-top:2px solid #000;}
  .notes-word-chip{background:#fff;color:#000;border:1px solid #000;}
  .notes-gr-step{background:#fff;border:1px solid #000;border-left:2px solid #000;}
  .notes-gr-we,.notes-gr-you{border-left:2px solid #000;}
  .notes-gr-tag{background:#fff;color:#000;border:1px solid #000;}
  .notes-gr-cue{color:#222;}
  .tt-hint-toggle{background:#fff;border:1px solid #000;}
  .tt-hint-toggle>summary{color:#000;}
  .tt-hint-toggle[open]>summary{margin-bottom:2px;}
  .tt-hint-toggle>summary{list-style:none;}
  .tt-hint-toggle>.tt-hint-text{display:block !important;}
  .tt-hint-text{color:#000;}
  .tt-stems-label{color:#000;}
  header.packet{border-bottom:2px solid #000;}
  .section>h2{border-left:4px solid #000;}
  .example{border-left:3px solid #000;}
  .answer-key{border-top:2px solid #000;}
  .vocab-card{border:1px solid #000;}
  .writeline{border-bottom:1px solid #000;}
  .mission{background:#fff;color:#000;border:1px solid #000;}
  .mission-title,.mission-eyebrow{color:#000;}
  .level-tag,.flagship-badge,.twr-method,.twr-tag{background:#fff;color:#000;border:1px solid #000;}
  .enrich-block{background:#fff;border:1px dashed #000;}
  .twr-block{border:1px solid #000;border-left:3px solid #000;}
  .twr-model{background:#fff;border:1px solid #000;}
  .twr-conj,.twr-type-name{background:#fff;border:1px solid #000;color:#000;}
  .twr-es,.twr-conj-es{color:#222;}
  .tt-card{border:1px solid #000;border-left:3px solid #000;}
  .tt-question,.section.turn-and-talk>h2{color:#000;}
  .tt-phase{background:#fff;color:#000;border:1px solid #000;}
  .tt-support{background:#fff;border:1px solid #000;}
  .tt-extend{background:#fff;border:1px dashed #000;}
  .tt-kernel-label,.tt-mini-label,.tt-extend-q{color:#000;}
  .tt-word{background:#fff;color:#000;border:1px solid #000;}
  .tt-listen{color:#222;}
  footer.packet{display:none;}
}
</style>`;
}

function missionBanner(cfg) {
  const m = cfg.flagship && cfg.flagship.mission;
  if (!m) return "";
  return `<section class="section mission">
  <p class="mission-eyebrow">${esc(m.eyebrow || "Flagship Mission")}</p>
  <h2 class="mission-title">${esc(m.title || "")}</h2>
  ${m.story ? `<p class="mission-story">${esc(m.story)}</p>` : ""}
</section>`;
}

function buildPacket(id, cfg, isFlagship) {
  const standard = cfg.standard ? `Standard ${esc(cfg.standard)}` : "";
  const standardPlain = cfg.standard ? `Standard ${cfg.standard}` : "";
  const unit = cfg.unit != null ? `Unit ${esc(cfg.unit)}` : "";
  const flagBadge = isFlagship
    ? `<span class="flagship-badge">Flagship</span>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(cfg.title)} — Notes Packet</title>
${styles(`${cfg.title}${standardPlain ? " · " + standardPlain : ""}`)}
</head>
<body>
<div class="topbar no-print">
  <span class="brand">Neft Teacher · Notes Packet</span>
  <div style="display:flex;align-items:center;gap:8px;">
    <button class="print-btn" type="button" onclick="window.print()">Print / Save as PDF</button>
    <div class="dl-wrap">
      <button class="print-btn" type="button" aria-haspopup="true" aria-expanded="false"
        onclick="(function(b){var m=b.parentNode.querySelector('.dl-menu');var o=m.hasAttribute('hidden');if(o){m.removeAttribute('hidden');}else{m.setAttribute('hidden','');}b.setAttribute('aria-expanded',String(o));})(this)">Download ▾</button>
      <div class="dl-menu" hidden role="menu">
        <a href="./notes.html" download="${esc(id)}-notes.html" role="menuitem">Self-contained HTML<span class="dl-sub">Open or save the full packet</span></a>
        <a href="./downloads/${esc(id)}-notes.pdf" role="menuitem">PDF<span class="dl-sub">Print-ready, branded</span></a>
        <a href="./downloads/${esc(id)}-notes.docx" role="menuitem">Word (DOCX)<span class="dl-sub">Editable document</span></a>
      </div>
    </div>
  </div>
</div>
<main class="sheet">
  <header class="packet">
    <p class="eyebrow">${[unit, standard].filter(Boolean).join(" · ")}</p>
    <h1>${esc(cfg.title)} ${flagBadge}</h1>
    <p class="meta">Lesson ${esc(id)}</p>
    <div class="name-line">
      <span>Name:</span><span>Date:</span><span>Class:</span>
    </div>
  </header>
  ${missionBanner(cfg)}
  ${vocabSection(cfg.vocabulary)}
  ${notesSection(cfg)}
  ${turnAndTalkSection(cfg)}
  ${examplesSection(cfg.practice)}
  ${twrSection(cfg)}
  ${tryItSection(cfg.practice)}
  ${reflectSection(cfg.reflect)}
  ${answerKeySection(cfg.practice, cfg.reflect, cfg)}
  <footer class="packet">Neft Teacher · Grade 6 Math · Lesson ${esc(id)}${standard ? " · " + standard : ""}</footer>
</main>
</body>
</html>`;
}

function buildIndex(lessons) {
  const flagshipTotal = lessons.filter((l) => l.isFlagship).length;
  const coreTotal = lessons.length - flagshipTotal;
  const byUnit = new Map();
  for (const { id, cfg, isFlagship } of lessons) {
    const u = cfg.unit ?? id.split("-")[0];
    if (!byUnit.has(u)) byUnit.set(u, []);
    byUnit.get(u).push({ id, cfg, isFlagship });
  }
  const units = [...byUnit.keys()].sort((a, b) => Number(a) - Number(b));
  const groups = units
    .map((u) => {
      const items = byUnit
        .get(u)
        .map(
          ({ id, cfg, isFlagship }) =>
            `<li><a href="/lessons/${id}/notes.html">${esc(id)} — ${esc(cfg.title)}</a>${
              isFlagship
                ? ` <span class="tag tag-flagship">Flagship</span>`
                : ` <span class="tag tag-core">Core</span>`
            }${
              cfg.standard ? ` <span class="std">${esc(cfg.standard)}</span>` : ""
            }</li>`
        )
        .join("");
      return `<section class="unit-group">
  <h2>Unit ${esc(u)}</h2>
  <ul>${items}</ul>
</section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Notes Packets — Index</title>
<style>
body{margin:0;background:#f7f4ec;color:#21313f;font-family:Calibri,"Segoe UI",system-ui,sans-serif;}
.wrap{max-width:820px;margin:0 auto;padding:32px 20px;}
h1{font-family:Outfit,system-ui,sans-serif;color:#12355b;}
.unit-group{background:#fff;border:1px solid #d7e2ed;border-radius:12px;padding:16px 20px;margin:0 0 16px;}
.unit-group h2{color:#1fa6a2;margin:0 0 10px;font-family:Outfit,system-ui,sans-serif;}
.unit-group ul{list-style:none;margin:0;padding:0;}
.unit-group li{padding:6px 0;border-bottom:1px solid #eef3f8;}
.unit-group li:last-child{border-bottom:0;}
a{color:#12355b;text-decoration:none;font-weight:600;}
a:hover{text-decoration:underline;}
.std{color:#5f6f80;font-weight:400;font-size:13px;margin-left:6px;}
.tag{display:inline-block;font-size:11px;font-weight:700;border-radius:999px;padding:1px 8px;margin-left:6px;vertical-align:middle;}
.tag-core{background:#dff2ee;color:#1fa6a2;border:1px solid #1fa6a2;}
.tag-flagship{background:#fef0d8;color:#9a6b12;border:1px solid #f2c15b;}
.legend{color:#5f6f80;font-size:14px;margin:0 0 20px;}
.legend .tag{margin-left:0;margin-right:4px;}
</style>
</head>
<body>
<div class="wrap">
  <h1>Notes Packets</h1>
  <p>Printable, leveled guided-notes sheets for all ${lessons.length} Grade 6 math lessons (${coreTotal} core + ${flagshipTotal} flagship). Each sheet includes a <strong>Key Vocabulary — Level 1 support</strong> section (visual-first), a <strong>Write About the Math</strong> writing block built on <em>The Writing Revolution</em> (kernel sentences, sentence expansion, sentence types, and reasoning stems), and a <strong>Level 2 enrichment</strong> stretch challenge. Every packet downloads as <strong>HTML, PDF, or Word (DOCX)</strong> and prints with a branded header, footer, page numbers, and answer key.</p>
  <p class="legend"><span class="tag tag-core">Core</span> standard lesson &nbsp; <span class="tag tag-flagship">Flagship</span> mission-based lesson</p>
  ${groups}
</div>
</body>
</html>`;
}

/* ---------- run ---------- */

function main() {
  const lessons = lessonConfigs();
  let count = 0;
  let flagshipCount = 0;
  for (const { id, cfg, isFlagship } of lessons) {
    const out = join(lessonsDir, id, "notes.html");
    writeFileSync(out, buildPacket(id, cfg, isFlagship));
    count++;
    if (isFlagship) flagshipCount++;
  }
  writeFileSync(join(lessonsDir, "notes-index.html"), buildIndex(lessons));
  console.log(
    `Generated ${count} notes packets (${count - flagshipCount} core + ${flagshipCount} flagship) + notes-index.html`
  );
}

main();
