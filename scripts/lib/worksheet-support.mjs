/**
 * worksheet-support.mjs — the START HERE page that opens every practice packet,
 * built to the shape of the district's Reveal practice sheets:
 *
 *   WORDS FOR THIS LESSON   term · Spanish · what it means · example
 *   HOW IT WORKS            one fully worked example, numbered steps, answer
 *   NOW YOU TRY             the same steps with the numbers blank
 *   SAY IT AND WRITE IT     sentence starters and a word bank
 *   WATCH OUT               the lesson's common mistake
 *
 * When the district sheet exists for the lesson (data/reveal-session1-source
 * .json, data/part-two-session2-source.json) its example, try-it, starters and
 * word bank are printed verbatim. Otherwise every line comes from the lesson's
 * own config: `launch.conceptIntro.iDo` is the worked example, `weDo` is the
 * try-it, `explore.discourse` supplies the starter and the key words.
 *
 * The answer to NOW YOU TRY is never on the student page. When the try-it came
 * from the config (`weDo`), its worked lines print on the answer key.
 */
import { esc } from "./worksheet-figures.mjs";

const conceptIntroOf = (cfg) => cfg?.launch?.conceptIntro || cfg?.conceptIntro || {};

/** "Title. 1. step 2. step" → { lead, steps } */
export function splitKeyIdea(keyIdea) {
  const raw = String(keyIdea || "").trim();
  if (!raw) return { lead: "", steps: [] };
  const at = raw.search(/\b1\.\s/);
  if (at < 0) return { lead: raw, steps: [] };
  return {
    lead: raw
      .slice(0, at)
      .replace(/[.\s]+$/, "")
      .trim(),
    steps: raw
      .slice(at)
      .split(/\s(?=\d+\.\s)/)
      .map((x) => x.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean),
  };
}

/** The lesson's rule and numbered strategy, from conceptIntro or Apply Day's reviewHighlights. */
export function strategyOf(cfg) {
  const intro = conceptIntroOf(cfg);
  let { lead, steps } = splitKeyIdea(intro.keyIdea);
  const highlights = cfg.reviewHighlights || {};
  if (!lead && highlights.rule) lead = highlights.rule;
  if (!steps.length && Array.isArray(highlights.steps)) {
    steps = highlights.steps
      .map((x) =>
        String(x || "")
          .replace(/^\s*\d+[.)]\s*/, "")
          .trim(),
      )
      .filter(Boolean);
  }
  return { heading: intro.heading || "", intro: intro.intro || "", lead, steps };
}

export function commonMistakeOf(cfg) {
  const m =
    cfg.practice?.commonMistake ||
    cfg.commonMistake ||
    cfg.reflect?.commonMistake ||
    cfg.reviewHighlights?.watchOut ||
    "";
  return typeof m === "string" ? m : m?.text || m?.description || "";
}

/* ── words ─────────────────────────────────────────────────────────────── */

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Config vocabulary first (it is what the interactive lesson teaches), with the
 *  district sheet's example filled in where the term matches, then any term the
 *  district sheet adds. Concept-role entries (the lesson title as a "term") are
 *  not words. */
export function mergedVocabulary(cfg, reveal) {
  const fromReveal = new Map((reveal?.vocabulary || []).map((v) => [norm(v.term), v]));
  const rows = [];
  for (const v of cfg.vocabulary || []) {
    if (!v || !v.term || v.role === "concept") continue;
    const r = fromReveal.get(norm(v.term));
    rows.push({
      term: v.term,
      termEs: v.termEs || r?.termEs || "",
      meaning: v.definition || r?.meaning || "",
      example:
        r?.example ||
        v.visual ||
        v.examples?.find((e) => e.isExample !== false)?.text ||
        v.example ||
        "",
    });
  }
  const have = new Set(rows.map((r) => norm(r.term)));
  for (const v of reveal?.vocabulary || []) {
    if (!v?.term || have.has(norm(v.term))) continue;
    rows.push({
      term: v.term,
      termEs: v.termEs || "",
      meaning: v.meaning || "",
      example: v.example || "",
    });
  }
  return rows.slice(0, 6);
}

function wordsBlock(rows) {
  if (!rows.length) return "";
  const body = rows
    .map(
      (r) => `<tr>
        <td class="ws-word"><b>${esc(r.term)}</b>${r.termEs ? `<span class="ws-es">Spanish: ${esc(r.termEs)}</span>` : ""}</td>
        <td>${esc(r.meaning)}</td>
        <td class="ws-word-ex">${esc(r.example)}</td></tr>`,
    )
    .join("");
  return `<section class="ws-block ws-block-words">
    <h2 class="ws-block-title"><span class="ws-block-kicker">Start here</span>Words for this lesson</h2>
    <p class="ws-block-lead">Read each word before you begin. Say it out loud.</p>
    <table class="ws-words"><thead><tr><th>Word</th><th>What it means</th><th>Example</th></tr></thead><tbody>${body}</tbody></table>
  </section>`;
}

/* ── worked example and try-it ────────────────────────────────────────── */

const blankify = (s) => esc(s).replace(/_{3,}/g, '<span class="ws-fill-inline"></span>');

function exampleBlock(cfg, reveal) {
  const rx = reveal?.workedExample;
  const intro = conceptIntroOf(cfg);
  let title = "";
  let problem = "";
  let steps = [];
  let answer = "";
  if (rx?.steps?.length) {
    title = rx.title ? rx.title.toLowerCase() : "";
    problem = rx.prompt || "";
    steps = rx.steps.map((s) => s.text);
    answer = rx.answer || "";
  } else if (Array.isArray(intro.iDo?.lines) && intro.iDo.lines.length) {
    problem = intro.iDo.lines[0];
    steps = intro.iDo.lines.slice(1);
  }
  if (!steps.length && !problem) return "";
  const stepsHtml = steps.map((s) => `<li>${esc(s)}</li>`).join("");
  return `<section class="ws-block ws-block-example">
    <h2 class="ws-block-title"><span class="ws-block-kicker">How it works</span>Worked example${title ? `<span class="ws-block-sub">${esc(title)}</span>` : ""}</h2>
    <p class="ws-block-lead">These numbers are not on your problems. The steps are. Follow them with your own numbers.</p>
    ${problem ? `<p class="ws-example-problem">${esc(problem)}</p>` : ""}
    ${stepsHtml ? `<ol class="ws-example-steps">${stepsHtml}</ol>` : ""}
    ${answer ? `<p class="ws-example-answer"><b>Answer:</b> ${esc(answer)}</p>` : ""}
  </section>`;
}

/** { html, keyLines } — keyLines are the model solution the answer key prints. */
function tryItBlock(cfg, reveal) {
  const ry = reveal?.yourProblem;
  const intro = conceptIntroOf(cfg);
  let problem = "";
  let steps = [];
  let answerLabel = "";
  let keyLines = [];
  if (ry?.stem && ry.steps?.length) {
    problem = ry.stem;
    steps = ry.steps.map((s) => s.text);
    answerLabel = String(ry.answer || "").replace(/^_+\s*/, "");
  } else if (Array.isArray(intro.weDo?.lines) && intro.weDo.lines.length) {
    problem = intro.weDo.lines[0];
    const count = Math.max(2, (intro.iDo?.lines?.length || 4) - 1);
    steps = Array.from({ length: Math.min(count, 5) }, () => "");
    keyLines = intro.weDo.lines.slice(1);
  }
  if (!problem) return { html: "", keyLines };
  const stepsHtml = steps
    .map(
      (s) => `<li>${s ? blankify(s) : '<span class="ws-fill-line ws-fill-line-wide"></span>'}</li>`,
    )
    .join("");
  const html = `<section class="ws-block ws-block-try">
    <h2 class="ws-block-title"><span class="ws-block-kicker">Now you try</span>Same steps, your turn</h2>
    <p class="ws-block-lead">The steps are the same as the worked example. The numbers are yours. Do the work.</p>
    <p class="ws-example-problem">${esc(problem)}</p>
    <ol class="ws-example-steps ws-try-steps">${stepsHtml}</ol>
    <div class="ws-answer-line"><span class="ws-answer-label">Answer:</span><span class="ws-fill-line"></span>${answerLabel ? `<span class="ws-answer-unit">${esc(answerLabel)}</span>` : ""}</div>
  </section>`;
  return { html, keyLines };
}

/* ── say it and write it ───────────────────────────────────────────────── */

function startersOf(cfg, reveal) {
  if (reveal?.sentenceStarters?.length) return reveal.sentenceStarters.slice(0, 5);
  const out = [];
  const d = cfg.explore?.discourse;
  if (d?.sentenceFrame) out.push(d.sentenceFrame);
  for (const it of cfg.practice?.approaching || []) {
    const stems = Array.isArray(it?.sentenceStems)
      ? it.sentenceStems
      : it?.sentenceFrame
        ? [it.sentenceFrame]
        : [];
    for (const s of stems) if (out.length < 4 && !out.includes(s)) out.push(s);
  }
  return out;
}

function wordBankOf(cfg, reveal, rows) {
  if (reveal?.wordBank?.length) return reveal.wordBank;
  const words = rows.map((r) => r.term);
  for (const k of cfg.explore?.discourse?.keywords || []) if (!words.includes(k)) words.push(k);
  return words.slice(0, 12);
}

function sayItBlock(cfg, reveal, rows) {
  const starters = startersOf(cfg, reveal);
  const bank = wordBankOf(cfg, reveal, rows);
  if (!starters.length && !bank.length) return "";
  return `<section class="ws-block ws-block-say">
    <h2 class="ws-block-title"><span class="ws-block-kicker">Say it and write it</span>Sentence starters</h2>
    <p class="ws-block-lead">Finish each sentence out loud with a partner. Then use them in your writing.</p>
    ${starters.length ? `<ul class="ws-starters">${starters.map((s) => `<li>${blankify(s)}</li>`).join("")}</ul>` : ""}
    ${bank.length ? `<p class="ws-word-bank"><b>Word bank</b> ${bank.map((w) => `<span class="ws-chip">${esc(w)}</span>`).join("")}</p>` : ""}
  </section>`;
}

function watchOutBlock(cfg) {
  const text = commonMistakeOf(cfg);
  if (!text) return "";
  return `<section class="ws-block ws-block-watch">
    <h2 class="ws-block-title"><span class="ws-block-kicker">Watch out</span>A common mistake</h2>
    <p class="ws-watch-text">${esc(text)}</p>
  </section>`;
}

/**
 * The START HERE page. Returns { html, keyNote } — `keyNote` is the model
 * solution to NOW YOU TRY for the teacher key ("" when the try-it came from the
 * district sheet, whose answers are not in the snapshot).
 */
export function supportPage(cfg, reveal, { header = "" } = {}) {
  const rows = mergedVocabulary(cfg, reveal);
  const tryIt = tryItBlock(cfg, reveal);
  const blocks = [
    wordsBlock(rows),
    exampleBlock(cfg, reveal),
    tryIt.html,
    sayItBlock(cfg, reveal, rows),
    watchOutBlock(cfg),
  ]
    .filter(Boolean)
    .join("\n");
  if (!blocks) return { html: "", keyNote: "" };
  const keyNote = tryIt.keyLines.length
    ? `<section class="ws-block ws-block-keynote"><h2 class="ws-block-title"><span class="ws-block-kicker">Start here page</span>Now you try — model solution</h2><ol class="ws-example-steps">${tryIt.keyLines.map((l) => `<li>${esc(l)}</li>`).join("")}</ol></section>`
    : "";
  return {
    html: `<section class="ws-page ws-support-page">${header}${blocks}</section>`,
    keyNote,
  };
}

/**
 * The short REMEMBER box a second-form sheet (Set B) opens with: the rule, the
 * numbered strategy and the words — enough to work from at home without the
 * full support page, which already went home with Set A.
 */
export function rememberBox(cfg, reveal) {
  const s = strategyOf(cfg);
  const rows = mergedVocabulary(cfg, reveal).slice(0, 5);
  const parts = [];
  if (s.lead || s.intro)
    parts.push(
      `<p class="ws-remember-lead"><b>${esc(s.lead || s.heading)}</b>${s.intro ? ` ${esc(s.intro)}` : ""}</p>`,
    );
  if (s.steps.length)
    parts.push(
      `<ol class="ws-remember-steps">${s.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`,
    );
  if (rows.length)
    parts.push(
      `<p class="ws-remember-words"><b>Words:</b> ${rows.map((r) => `<span class="ws-chip">${esc(r.term)}${r.termEs ? ` <i>(${esc(r.termEs)})</i>` : ""}</span>`).join("")}</p>`,
    );
  if (!parts.length) return "";
  return `<section class="ws-block ws-block-remember"><h2 class="ws-block-title"><span class="ws-block-kicker">Remember</span>${esc(cfg.title || "This lesson")}</h2>${parts.join("")}</section>`;
}
