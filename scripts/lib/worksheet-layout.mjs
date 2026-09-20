/**
 * worksheet-layout.mjs — the frame around the problems: the packet header,
 * the closing blocks (explain your thinking, how did it go), and the
 * stylesheet. Print-first: US Letter, 11pt body, navy section bands for the
 * work and teal blocks for the help, matching the district practice sheets.
 */
import { esc } from "./worksheet-figures.mjs";
import { lessonLabel, unitLabel } from "./worksheet-reveal.mjs";
import { SCAFFOLD_CSS } from "./worksheet-scaffold-css.mjs";

const fill = (w) => `<span class="ws-fill-line" style="width:${w}px;"></span>`;

/**
 * The header every page of the packet opens with. `edition` is the sheet's
 * name ("Version A", "Group 1 · Set B"); `note` says in one phrase what kind
 * of practice it is. The key repeats the same header with "Answer Key".
 */
export function packetHeader(
  cfg,
  { edition = "", note = "", isKey = false, mastery = true, target = "", title = "" } = {},
) {
  const std = cfg.standard ? `Standard ${esc(cfg.standard)}` : "";
  const unit = unitLabel(cfg);
  const lesson = lessonLabel(cfg);
  const editionText = isKey ? `${edition} · Answer Key` : edition;
  const masteryHtml =
    mastery && !isKey
      ? `<div class="ws-mastery" aria-label="Mastery check"><span class="ws-mastery-title">Mastery check</span><span>&#9744; Exceeds</span><span>&#9744; Meets target</span><span>&#9744; Needs practice</span></div>`
      : "";
  return `
    <header class="ws-header">
      <div class="ws-band"><span>Grade 6 Mathematics${unit ? ` · ${esc(unit)}` : ""}</span><span>${std}</span></div>
      <div class="ws-title-row">
        <div class="ws-title-group">
          <h1 class="ws-title">${lesson ? `<span class="ws-lesson-n">${esc(lesson)}</span>` : ""}${esc(title || cfg.title || cfg.lessonId || "Practice")}</h1>
          ${editionText ? `<p class="ws-edition">${esc(editionText)}${note ? `<span class="ws-edition-note">${esc(note)}</span>` : ""}</p>` : ""}
        </div>
        ${masteryHtml}
      </div>
      ${
        isKey
          ? ""
          : `<div class="ws-meta-row"><span><b>Name</b> ${fill(230)}</span><span><b>Date</b> ${fill(110)}</span><span><b>Period</b> ${fill(60)}</span></div>`
      }
      ${target ? `<p class="ws-target"><b>Learning target</b> ${esc(target)}</p>` : ""}
    </header>`;
}

/** "Explain your thinking" — the lesson's own discourse prompt, with its sentence frame. */
export function explainBlock(cfg, { supported = false } = {}) {
  const d = cfg.explore?.discourse;
  const prompt = d?.prompt || d?.question;
  if (!prompt) return "";
  const frame =
    supported && d.sentenceFrame
      ? `<p class="ws-frame"><span class="ws-frame-tag">Sentence starter</span> ${esc(d.sentenceFrame)}</p>`
      : "";
  return `<section class="ws-block ws-block-explain">
    <h2 class="ws-block-title"><span class="ws-block-kicker">Explain your thinking</span>${esc(prompt)}</h2>
    ${frame}
    <div class="ws-lines"><span class="ws-line"></span><span class="ws-line"></span><span class="ws-line"></span></div>
  </section>`;
}

export function confidenceBar() {
  return `<div class="ws-confidence"><b>How did it go?</b>
    <span>&#9744; 4 · I can teach it</span><span>&#9744; 3 · I've got it</span><span>&#9744; 2 · I need a hint</span><span>&#9744; 1 · I need help</span></div>`;
}

export function writeYourOwnBlock() {
  return `<section class="ws-block ws-block-author">
    <h2 class="ws-block-title"><span class="ws-block-kicker">Challenge</span>Write your own problem</h2>
    <p class="ws-block-lead">Write a new word problem that uses this lesson's idea. Then solve it and show every step.</p>
    <div class="ws-lines"><span class="ws-line"></span><span class="ws-line"></span><span class="ws-line"></span><span class="ws-line"></span><span class="ws-line"></span></div>
  </section>`;
}

export const WORKSHEET_CSS = `
:root {
  --navy: #1f3864;
  --navy-deep: #17294a;
  --teal: #0f6e6e;
  --teal-soft: #e6f4f3;
  --teal-line: #9fd0cc;
  --amber-dark: #8a5a00;
  --amber-soft: #fff4d6;
  --amber-line: #f2d48a;
  --ink: #19262f;
  --muted: #4f5d68;
  --line: #c9d2da;
  --line-light: #e3e8ed;
  --soft: #f6f8fa;
  --key: #0b6b3a;
  --key-soft: #e7f6ec;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { background: #eef1f4; color: var(--ink); font-family: var(--font-body); font-size: 14px; line-height: 1.45; }

/* Pages */
.ws-page { background: #fff; max-width: 8.5in; margin: 20px auto; padding: 0.55in 0.6in 0.6in; box-shadow: 0 6px 24px rgba(15,23,42,.10); border: 1px solid var(--line-light); }
.ws-page + .ws-page { break-before: page; }

/* Header */
.ws-header { margin-bottom: 14px; }
.ws-band { display: flex; justify-content: space-between; align-items: center; gap: 12px; background: var(--navy); color: #fff; font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 5px 12px; border-radius: 4px; }
.ws-band span:last-child { white-space: nowrap; }
.ws-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-top: 10px; }
.ws-title { font-family: var(--font-display); font-size: 22px; line-height: 1.15; font-weight: 700; color: var(--navy-deep); }
.ws-lesson-n { display: block; font-family: var(--font-body); font-size: 11.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--teal); margin-bottom: 2px; }
.ws-edition { margin-top: 4px; font-size: 13px; font-weight: 700; color: var(--navy); }
.ws-edition-note { font-weight: 500; color: var(--muted); }
.ws-edition-note::before { content: " · "; }
.ws-mastery { flex-shrink: 0; display: grid; gap: 3px; border: 1px solid var(--line); border-radius: 6px; padding: 6px 10px; font-size: 10.5px; color: var(--muted); min-width: 130px; }
.ws-mastery-title { font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--navy); font-size: 9.5px; }
.ws-meta-row { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: 10px; font-size: 12.5px; }
.ws-fill-line { display: inline-block; border-bottom: 1.2px solid var(--ink); min-width: 90px; height: 16px; vertical-align: bottom; }
.ws-fill-line-wide { width: 100%; min-width: 0; height: 20px; border-bottom-color: var(--line); }
.ws-fill-inline { display: inline-block; border-bottom: 1.2px solid var(--ink); min-width: 56px; height: 14px; vertical-align: baseline; }
.ws-target { margin-top: 10px; padding: 7px 12px; background: var(--teal-soft); border-left: 4px solid var(--teal); border-radius: 0 6px 6px 0; font-size: 12.5px; }
.ws-target b { color: var(--teal); text-transform: uppercase; letter-spacing: .05em; font-size: 10.5px; margin-right: 6px; }

/* Support blocks */
.ws-block { margin: 9px 0; border: 1px solid var(--teal-line); border-radius: 6px; padding: 8px 12px 10px; background: #fff; break-inside: avoid; }
.ws-block-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--navy-deep); margin-bottom: 4px; line-height: 1.25; }
.ws-block-kicker { display: block; font-family: var(--font-body); font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--teal); margin-bottom: 1px; }
.ws-block-sub { display: block; font-family: var(--font-body); font-size: 11.5px; font-weight: 600; color: var(--muted); text-transform: capitalize; }
.ws-block-lead { font-size: 11.5px; color: var(--muted); margin-bottom: 8px; }
.ws-words { width: 100%; border-collapse: collapse; font-size: 11.5px; line-height: 1.35; }
.ws-words th { background: var(--teal); color: #fff; text-align: left; padding: 5px 8px; font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase; }
.ws-words td { border: 1px solid var(--line-light); padding: 4px 7px; vertical-align: top; }
.ws-words .ws-word { width: 26%; }
.ws-es { display: block; font-size: 10.5px; color: var(--muted); font-style: italic; }
.ws-word-ex { width: 30%; }
.ws-example-problem { font-size: 13px; font-weight: 600; padding: 7px 10px; background: var(--soft); border-radius: 5px; margin-bottom: 8px; }
.ws-example-steps { padding-left: 26px; font-size: 12.5px; display: grid; gap: 2px; }
.ws-example-steps li::marker { font-weight: 800; color: var(--teal); }
.ws-try-steps li { padding: 2px 0; }
.ws-example-answer { margin-top: 8px; font-size: 12.5px; padding: 6px 10px; border-left: 3px solid var(--teal); }
.ws-starters { list-style: none; display: grid; gap: 5px; font-size: 12.5px; }
.ws-starters li::before { content: "•"; color: var(--teal); font-weight: 800; margin-right: 6px; }
.ws-word-bank { margin-top: 8px; font-size: 11.5px; display: flex; flex-wrap: wrap; gap: 4px 6px; align-items: center; }
.ws-chip { display: inline-block; padding: 1px 8px; border: 1px solid var(--teal-line); border-radius: 999px; background: var(--teal-soft); font-size: 11px; font-weight: 600; color: var(--navy-deep); }
.ws-block-watch { border-color: var(--amber-line); background: var(--amber-soft); }
.ws-block-watch .ws-block-kicker { color: var(--amber-dark); }
.ws-watch-text { font-size: 12px; }
.ws-block-remember { border-color: var(--line); }
.ws-remember-lead { font-size: 12.5px; margin-bottom: 4px; }
.ws-remember-steps { padding-left: 24px; font-size: 12px; display: grid; gap: 2px; margin-bottom: 6px; }
.ws-remember-words, .ws-remember-watch { font-size: 11.5px; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px 6px; align-items: center; }
.ws-remember-watch { display: block; }
.ws-block-keynote { border-color: var(--key); background: var(--key-soft); }

/* Sections and problems */
.ws-section-head { display: flex; align-items: baseline; gap: 10px; background: var(--navy); color: #fff; padding: 4px 12px; border-radius: 4px; margin: 10px 0 6px; break-after: avoid; }
.ws-section-n { font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.ws-section-name { font-family: var(--font-display); font-size: 14px; font-weight: 700; }
.ws-section-tag { margin-left: auto; font-size: 10.5px; opacity: .85; }
.ws-problems { list-style: none; display: grid; gap: 8px; }
.ws-problem-card { border: 1px solid var(--line); border-radius: 6px; background: #fff; break-inside: avoid; }
.ws-problem-head { display: flex; align-items: center; gap: 10px; padding: 4px 12px; border-bottom: 1px solid var(--line-light); background: var(--soft); border-radius: 6px 6px 0 0; }
.ws-pnum { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 6px; border-radius: 12px; background: var(--navy); color: #fff; font-weight: 800; font-size: 12.5px; }
.ws-directions { font-size: 11.5px; font-weight: 600; color: var(--muted); }
.ws-pbody { padding: 7px 12px 9px; }
.ws-stem { font-size: 13.5px; font-weight: 500; margin-bottom: 8px; }
.ws-opts { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; margin: 4px 0 6px; }
.ws-opt { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.ws-bub { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: 1.4px solid var(--navy); border-radius: 50%; font-size: 11px; font-weight: 800; color: var(--navy); flex-shrink: 0; }
.ws-bub-sm { width: 18px; height: 18px; font-size: 10px; }
.ws-hint { margin: 6px 0; padding: 6px 10px; background: var(--teal-soft); border-left: 3px solid var(--teal); border-radius: 0 5px 5px 0; font-size: 12px; }
.ws-hint-steps ol { margin: 4px 0 0 18px; display: grid; gap: 3px; }
.ws-hint-steps li::marker { font-weight: 800; color: var(--teal); }
.ws-hint-tag, .ws-frame-tag { font-weight: 800; color: var(--teal); text-transform: uppercase; letter-spacing: .05em; font-size: 10px; margin-right: 6px; }
.ws-frame { margin: 6px 0; padding: 6px 10px; border: 1px dashed var(--teal-line); border-radius: 5px; font-size: 12px; }
.ws-work { margin-top: 6px; border: 1px solid var(--line-light); border-radius: 5px; padding: 6px 10px 8px; background: #fff; }
.ws-work-label { font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
.ws-lines { margin: 4px 0 0; }
.ws-line { display: block; border-bottom: 1.2px solid var(--line); height: 21px; }
.ws-answer-line { display: flex; align-items: flex-end; gap: 8px; margin-top: 8px; font-size: 12.5px; }
.ws-answer-label { font-weight: 800; color: var(--navy); }
.ws-answer-line .ws-fill-line { flex: 1 1 180px; max-width: 320px; }
.ws-answer-unit { font-size: 11.5px; color: var(--muted); }
.ws-prompt { font-size: 12.5px; font-weight: 600; margin: 8px 0 4px; }

/* Matching, sorting, tables, steps */
.ws-match { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin: 6px 0; font-size: 12.5px; }
.ws-match-terms, .ws-match-bank { list-style: none; display: grid; gap: 6px; }
.ws-match-term { display: flex; align-items: center; gap: 8px; }
.ws-match-bank li { display: flex; align-items: flex-start; gap: 8px; }
.ws-blank { display: inline-block; border-bottom: 1.2px solid var(--ink); min-width: 120px; height: 18px; text-align: center; font-weight: 700; }
.ws-blank-sm { min-width: 34px; }
.ws-blank-md { min-width: 96px; }
.ws-cats-bar { font-size: 12px; margin: 4px 0 6px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ws-cat-pill { display: inline-block; padding: 2px 10px; border: 1px solid var(--navy); border-radius: 999px; font-size: 11.5px; font-weight: 700; color: var(--navy); }
.ws-sort-list { list-style: none; display: grid; gap: 7px; margin: 4px 0; }
.ws-sort-item { display: flex; align-items: center; gap: 10px; font-size: 12.5px; }
.ws-table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 12.5px; }
.ws-table th { background: var(--navy); color: #fff; font-size: 11px; padding: 5px 9px; text-align: left; }
.ws-table td { border: 1px solid var(--line); padding: 7px 9px; }
.ws-table td.ws-cell-blank { background: #fff; height: 30px; }
.ws-scale-table th, .ws-scale-table td { text-align: center; }
.ws-scale-n { font-weight: 800; color: var(--navy); }
.ws-scale-eq { color: var(--muted); font-weight: 700; }
.ws-check { white-space: nowrap; font-weight: 600; }
.ws-steps-box { border: 1px solid var(--line-light); border-radius: 5px; padding: 8px 10px; background: var(--soft); margin: 6px 0; }
.ws-steps { list-style: none; display: grid; gap: 5px; font-size: 12.5px; }
.ws-steps li { display: grid; grid-template-columns: 22px auto 1fr; gap: 8px; align-items: baseline; }
.ws-step-n { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: var(--navy); color: #fff; font-size: 10.5px; font-weight: 800; }
.ws-step-l { font-weight: 700; color: var(--navy); }
.ws-step-wrong .ws-step-n { background: #b42318; }
.ws-gf-steps { list-style: none; display: grid; gap: 7px; margin: 6px 0; font-size: 12.5px; }
.ws-gf-step { display: grid; grid-template-columns: 22px 1fr 150px; gap: 8px; align-items: end; }
.ws-figure-wrap { margin: 8px auto; }

/* Closing blocks */
.ws-block-explain .ws-block-title { font-size: 13.5px; }
.ws-confidence { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; margin-top: 12px; padding: 7px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 11.5px; color: var(--muted); }
.ws-confidence b { color: var(--navy); }

/* Answer key */
.ws-keynote { margin: 4px 0; padding: 5px 10px; background: var(--key-soft); border-left: 3px solid var(--key); border-radius: 0 5px 5px 0; font-size: 12px; }
.ws-keynote b { color: var(--key); }
.ws-keynote-inline { font-size: 11px; color: var(--key); }
.ws-watch { margin: 4px 0; padding: 5px 10px; background: var(--amber-soft); border-left: 3px solid var(--amber-dark); border-radius: 0 5px 5px 0; font-size: 12px; }
.ws-watch b { color: var(--amber-dark); }
.ws-opt.ws-correct .ws-bub { background: var(--key); border-color: var(--key); color: #fff; }
.ws-opt.ws-correct .ws-opt-text { font-weight: 800; color: var(--key); }
.ws-blank.ws-correct, .ws-fill-line.ws-correct { color: var(--key); font-weight: 800; padding: 0 6px; height: auto; min-height: 18px; }
td.ws-correct { color: var(--key); font-weight: 800; background: var(--key-soft); }
.ws-key-page .ws-problem-card { break-inside: auto; }
.ws-key-page .ws-pbody { padding: 8px 14px 10px; }
.ws-key-page .ws-stem { font-size: 12.5px; margin-bottom: 4px; }
.ws-key-page .ws-opts { margin: 2px 0 4px; gap: 2px 18px; }

${SCAFFOLD_CSS}

@media print {
  body { background: #fff !important; font-size: 11pt; }
  .ws-page { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: none !important; padding: 0 !important; }
  .ws-page + .ws-page { break-before: page; page-break-before: always; }
  .ws-block, .ws-problem-card { break-inside: avoid; page-break-inside: avoid; }
  .ws-section-head { break-after: avoid; page-break-after: avoid; }
  @page { size: letter; margin: 0.6in 0.6in 0.65in; }
}
`;
