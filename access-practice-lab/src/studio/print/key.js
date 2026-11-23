// The TEACHER copy: answer key, sample responses, explanations, misconceptions and scaffolding suggestions.
// Never included in the student part.

import { chrome } from "./formats.js";
import { esc, mathHtml, paragraphsHtml } from "./html.js";
import { keyLines } from "./paper-model.js";
import { tr } from "./strings.js";

const tag = (c, path) => `<span class="tag">${chrome(c.lang, path)}</span>`;
const list = (items) =>
  `<ul class="klist">${items.map((x) => `<li>${mathHtml(x)}</li>`).join("")}</ul>`;

/** One question's key entry. `n` is the printed question number. */
export function renderKeyQuestion(c, q, n) {
  const lines = keyLines(c.activity, q);
  const parts = [];
  if (q.format === "short") {
    if (lines.length) parts.push(`<div class="kpart">${tag(c, "sample")} ${list(lines)}</div>`);
    if (q.rubric.length) parts.push(`<div class="kpart">${tag(c, "look")} ${list(q.rubric)}</div>`);
  } else if (lines.length) {
    parts.push(`<div class="kpart kans">${tag(c, "answer")} ${list(lines)}</div>`);
  }
  if (q.explanation) parts.push(`<p class="kpart">${tag(c, "why")} ${mathHtml(q.explanation)}</p>`);
  if (q.misconception)
    parts.push(`<p class="kpart">${tag(c, "misconception")} ${mathHtml(q.misconception)}</p>`);
  const help = [q.hint, c.frames && q.frame ? `${tr("en", "frame")}: ${q.frame}` : ""].filter(
    Boolean,
  );
  if (help.length) parts.push(`<div class="kpart">${tag(c, "scaffold")} ${list(help)}</div>`);
  return `<div class="kq" role="group" aria-labelledby="k${n}"><p class="prompt" id="k${n}"><span class="qno">${n}.</span><span>${mathHtml(q.prompt)}</span></p>${parts.join("")}</div>`;
}

/** The notes at the top of the teacher copy: objective, standards, teacher notes, misconceptions, scripts. */
export function renderKeyNotes(c, a, noteBlocks, audioBlocks) {
  const out = [];
  const ctx = a.context;
  if (ctx.objective) out.push(`<p>${tag(c, "objective")} ${mathHtml(ctx.objective)}</p>`);
  if (ctx.standards.length)
    out.push(
      `<p>${tag(c, "standards")} ${ctx.standards
        .map(
          (s) =>
            `${esc(s.code)}${s.origin === "teacher" ? ` (${esc(tr(c.lang === "es" ? "es" : "en", "teacherChosen"))})` : ""}`,
        )
        .join("; ")}</p>`,
    );
  const notes = [a.notes.teacher, ...noteBlocks.map((b) => b.text)].filter(Boolean);
  if (notes.length)
    out.push(
      `<div class="knotes"><h2>${chrome(c.lang, "teacherNotes")}</h2>${notes.map((t) => paragraphsHtml(t)).join("")}</div>`,
    );
  if (a.notes.misconceptions.length)
    out.push(
      `<div class="knotes"><h2>${chrome(c.lang, "misconceptions")}</h2>${list(a.notes.misconceptions)}</div>`,
    );
  for (const b of audioBlocks)
    if (b.say)
      out.push(
        `<div class="knotes"><h2>${chrome(c.lang, "readAloudScript")}${b.label ? `: ${esc(b.label)}` : ""}</h2>${paragraphsHtml(b.say)}</div>`,
      );
  return out.join("");
}
