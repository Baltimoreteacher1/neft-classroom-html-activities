// "Build the idea" — the worked-example section of every small-group studio.
//
// Reads `launch.build`, which the generators copy from the authored
// data/small-group-build/<lesson>.json (contract: docs/specs/small-group-build-v2.md).
// Everything is on the page at once, the way a printed lesson shows it:
// Today's idea → worked examples (Problem → steps → Answer, one figure each)
// → one together example whose answers sit behind "Check" → Your turn (an
// answer box that checks itself) → The big idea.
//
// It replaces a click-to-reveal player that showed one line at a time, locked
// the later stages, drew pictures guessed from the step text, and told
// students to "try the practice problems below" when there was nothing below.

import { mathHtml, numericValue } from "./small-group-build-figure-kit.js";
import { figureMarkup } from "./small-group-build-figures.js";
import { biHtml, el, esc, sectionHeading } from "./small-group-ui.js";

export const line = (en, es) => biHtml(mathHtml(en), es ? mathHtml(es) : "");

/** A figure with its caption in the student's language lane. */
export const figure = (f) =>
  figureMarkup(f, { caption: f.caption ? line(f.caption, f.captionEs) : "" });

/** Normalize a typed answer for comparison: case, spaces, commas, minus signs, $ and %. */
export function normalizeAnswer(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[−–]/g, "-")
    .replace(/[\s,$]/g, "")
    .replace(/\.$/, "");
}

export function isAccepted(value, accept) {
  const typed = normalizeAnswer(value);
  if (!typed) return false;
  const typedNum = numericValue(value);
  return (accept || []).some((a) => {
    if (normalizeAnswer(a) === typed) return true;
    const n = numericValue(a);
    return typedNum !== null && n !== null && Math.abs(n - typedNum) < 1e-9;
  });
}

export function label(text) {
  return `<span class="sgb-label">${esc(text)}</span>`;
}

export function revealButton(textOn, onReveal) {
  const button = el("button", "sgb-check", esc(textOn));
  button.type = "button";
  button.addEventListener("click", () => {
    onReveal();
    button.remove();
  });
  return button;
}

export function workedStep(step, index) {
  const li = el("li", "sgb-step");
  li.appendChild(el("span", "sgb-num", String(index + 1)));
  const body = el("div", "sgb-step-body");
  body.appendChild(el("p", "sgb-do", line(step.do, step.doEs)));
  const list = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
  const math = list(step.math);
  // A math line that carries words ("5 values") has a Spanish twin, mathEs.
  const mathEs = list(step.mathEs);
  if (math.length) {
    const box = el("div", "sgb-math");
    math.forEach((m, i) => box.appendChild(el("div", "sgb-math-line", line(m, mathEs[i]))));
    body.appendChild(box);
  }
  if (step.why) body.appendChild(el("p", "sgb-why", line(step.why, step.whyEs)));
  li.appendChild(body);
  return li;
}

function askStep(step, index, onChecked) {
  const li = el("li", "sgb-step sgb-ask");
  li.appendChild(el("span", "sgb-num", String(index + 1)));
  const body = el("div", "sgb-step-body");
  body.appendChild(el("p", "sgb-do", line(step.ask, step.askEs)));
  const answer = el("div", "sgb-math sgb-reveal", line(step.answer, step.answerEs));
  answer.hidden = true;
  const reveal = () => {
    answer.hidden = false;
    onChecked();
  };
  if (!Array.isArray(step.accept)) {
    body.append(revealButton("Check", reveal), answer);
  } else {
    // A step with an accept list is typed: the student writes the number,
    // the same way Practice Together works.
    const row = el("div", "sgp-step-row");
    const input = el("input", "sgb-input sgp-step-input");
    input.type = "text";
    input.autocomplete = "off";
    input.setAttribute("aria-label", `Step ${index + 1} answer`);
    const check = el("button", "sgb-check", "Check");
    check.type = "button";
    const fb = el("span", "sgp-step-fb");
    fb.setAttribute("aria-live", "polite");
    let misses = 0;
    const run = () => {
      if (!input.value.trim()) return;
      if (isAccepted(input.value, step.accept)) {
        row.remove();
        reveal();
        return;
      }
      misses++;
      fb.className = "sgp-step-fb is-wrong";
      fb.textContent = misses >= 2 ? "Not yet — tap Show me." : "Not yet. Try again.";
      if (misses >= 2 && !row.querySelector(".sgp-showme")) {
        const show = revealButton("Show me", () => {
          row.remove();
          reveal();
        });
        show.classList.add("sgp-showme");
        row.appendChild(show);
      }
    };
    check.addEventListener("click", run);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") run();
    });
    row.append(input, check, fb);
    body.append(row, answer);
  }
  li.appendChild(body);
  return li;
}

/** One example card. `together` turns steps into think-first ask/answer pairs. */
function exampleCard(ex, { together = false } = {}) {
  const card = el("article", `sgb-ex${together ? " sgb-together" : ""}`);
  card.appendChild(el("h3", "sgb-title", line(ex.title, ex.titleEs)));
  card.appendChild(
    el("div", "sgb-problem", `${label("Problem")}<p>${line(ex.problem, ex.problemEs)}</p>`),
  );
  const work = el("div", `sgb-work${ex.figure ? " has-figure" : ""}`);
  if (ex.figure) work.appendChild(el("div", "sgb-figure", figure(ex.figure)));
  const list = el("ol", "sgb-steps");
  const answer = el(
    "div",
    "sgb-answer",
    `${label("Answer")}<p>${line(ex.answer, ex.answerEs)}</p>`,
  );
  if (together) {
    answer.hidden = true;
    let checked = 0;
    ex.steps.forEach((s, i) =>
      list.appendChild(
        askStep(s, i, () => {
          if (++checked === ex.steps.length) answer.hidden = false;
        }),
      ),
    );
  } else {
    ex.steps.forEach((s, i) => list.appendChild(workedStep(s, i)));
  }
  work.appendChild(list);
  card.append(work, answer);
  return card;
}

/** "Your turn": an answer box that checks itself, a hint, and (group 2) a reason. */
function tryCard(t, { title = "Your turn", store, key }) {
  const card = el("article", "sgb-ex sgb-try");
  card.appendChild(el("h3", "sgb-title", esc(title)));
  card.appendChild(
    el("div", "sgb-problem", `${label("Problem")}<p>${line(t.problem, t.problemEs)}</p>`),
  );
  if (t.figure) card.appendChild(el("div", "sgb-figure", figure(t.figure)));
  const row = el("div", "sgb-try-row");
  const id = `sgb-${key}`;
  const input = el("input", "sgb-input");
  input.id = id;
  input.type = "text";
  input.autocomplete = "off";
  input.setAttribute("inputmode", /^[−-]?[\d.,\s/]+$/.test(t.answer) ? "decimal" : "text");
  const lab = el("label", "sgb-input-label", "My answer");
  lab.htmlFor = id;
  const check = el("button", "btn sgb-submit", "Check my answer");
  check.type = "button";
  const hint = el("button", "btn ghost sgb-hint-btn", "💡 Hint");
  hint.type = "button";
  row.append(lab, input, check, hint);
  const feedback = el("p", "sgb-feedback");
  feedback.setAttribute("aria-live", "polite");
  const hintText = el("p", "sgb-hint", line(t.hint, t.hintEs));
  hintText.hidden = true;
  card.append(row, hintText, feedback);
  let explain = null;
  if (t.explain) {
    explain = el("div", "sgb-explain");
    explain.hidden = true;
    const eid = `${id}-why`;
    explain.innerHTML = `<label class="sgb-input-label" for="${eid}">${line(t.explain, t.explainEs)}</label>`;
    const area = el("textarea", "sgb-why-box");
    area.id = eid;
    area.rows = 3;
    if (store?.get(`${key}-why`)) area.value = store.get(`${key}-why`);
    area.addEventListener("input", () => store?.set(`${key}-why`, area.value));
    const model = el(
      "p",
      "sgb-model",
      `${label("A strong answer")}${line(t.modelExplanation, t.modelExplanationEs)}`,
    );
    model.hidden = true;
    explain.append(
      area,
      revealButton("Compare with a strong answer", () => (model.hidden = false)),
      model,
    );
    card.appendChild(explain);
  }
  let misses = 0;
  const grade = (save) => {
    const ok = isAccepted(input.value, t.accept);
    card.classList.toggle("is-right", ok);
    if (ok) {
      feedback.className = "sgb-feedback is-right";
      feedback.innerHTML = `✓ Correct — ${mathHtml(t.answer)}.`;
      if (explain) explain.hidden = false;
    } else {
      misses += save ? 1 : 0;
      feedback.className = "sgb-feedback is-wrong";
      feedback.textContent =
        misses >= 2
          ? "Not yet. Read the hint, then try once more."
          : "Not yet. Check each step and try again.";
      if (misses >= 2) hintText.hidden = false;
    }
    if (save) store?.set(key, input.value);
  };
  check.addEventListener("click", () => grade(true));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") grade(true);
  });
  hint.addEventListener("click", () => {
    hintText.hidden = false;
  });
  const saved = store?.get(key);
  if (saved) {
    input.value = saved;
    grade(false);
  }
  return card;
}

/**
 * @param {object} config  studio config; reads config.launch.build
 * @param {() => void} onDone  marks the Build phase complete
 * @param {{ store?: { get(k: string): any, set(k: string, v: any): void } }} [opts]
 */
export function buildSection(config, onDone, { store } = {}) {
  const b = config.launch?.build;
  if (!b)
    throw new Error(`${config.lessonId}: launch.build is missing — run the small-group generator`);
  const section = el("section", "sg-sec sgb");
  section.id = "sg-build";
  section.appendChild(sectionHeading(2, "Learn it", "Build the idea"));
  section.appendChild(
    el("p", "sgb-today", `${label("Today’s idea")}${line(b.todayIdea, b.todayIdeaEs)}`),
  );

  if (Array.isArray(b.lessons)) {
    // Catch-up: one short worked example and one check per lesson in the band.
    b.lessons.forEach((lesson, i) => {
      const block = el("div", "sgb-lesson");
      block.appendChild(exampleCard(lesson.example));
      block.appendChild(
        tryCard(lesson.check, { title: "Quick check", store, key: `build-check-${i}` }),
      );
      section.appendChild(block);
    });
    const ideas = el("div", "sgb-big", `${label("The big ideas")}`);
    const list = el("ul", "sgb-big-list");
    for (const lesson of b.lessons)
      list.appendChild(
        el("li", null, `<b>${esc(lesson.short)}</b> ${line(lesson.bigIdea, lesson.bigIdeaEs)}`),
      );
    ideas.appendChild(list);
    section.appendChild(ideas);
  } else {
    for (const ex of b.examples) section.appendChild(exampleCard(ex));
    section.appendChild(exampleCard(b.together, { together: true }));
    section.appendChild(tryCard(b.tryIt, { store, key: "build-try" }));
    section.appendChild(
      el("div", "sgb-big", `${label("The big idea")}<p>${line(b.bigIdea, b.bigIdeaEs)}</p>`),
    );
  }

  const row = el("div", "row sgb-done-row");
  const done = el("button", "btn", "I’m ready to practice →");
  done.type = "button";
  done.addEventListener("click", () => {
    done.disabled = true;
    done.textContent = "Ready ✓";
    onDone();
  });
  row.appendChild(done);
  section.appendChild(row);
  return section;
}

export const BUILD_CSS = `
.sgb [hidden]{display:none!important}
.sgb .sgb-label{display:block;font-family:var(--sg-display);font-size:14px;font-weight:700;letter-spacing:.01em;color:var(--sg-deep);margin:0 0 4px}
.sgb-today{margin:0 0 20px;padding:14px 18px;background:var(--sg-soft);border-radius:var(--sg-radius);font-size:19px;line-height:1.5}
.sgb-ex{background:var(--sg-card);border:1px solid var(--sg-line);border-radius:var(--sg-radius-lg);padding:20px 22px;margin:0 0 18px}
.sgb-title{font-size:21px;margin:0 0 12px}
.sgb-problem{border-left:4px solid var(--sg);background:var(--sg-soft);padding:12px 16px;border-radius:0 var(--sg-radius-sm) var(--sg-radius-sm) 0;margin:0 0 16px}
.sgb-problem p,.sgb-answer p{margin:0;font-size:19px;line-height:1.5;font-weight:600}
.sgb-work{display:grid;gap:18px;align-items:start}
@media (min-width:900px){.sgb-work.has-figure{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr)}.sgb-work.has-figure .sgb-figure{order:2;position:sticky;top:12px}}
.sgb-figure{display:flex;justify-content:center;min-width:0}
.sgb-steps{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.sgb-step{display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:start}
.sgb-num{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--sg);color:#fff;font-family:var(--sg-display);font-weight:700;font-size:16px}
.sgb-do{margin:2px 0 6px;font-size:18px;font-weight:600;line-height:1.45}
.sgb-math{display:inline-flex;flex-direction:column;gap:4px;padding:8px 14px;background:var(--sg-fill);border-radius:var(--sg-radius-sm);font-size:20px;font-weight:600;font-variant-numeric:tabular-nums lining-nums;line-height:1.6}
.sgb-why{margin:6px 0 0;font-size:16px;color:var(--sg-muted);line-height:1.5}
.sgb-answer{margin:18px 0 0;padding:12px 16px;border:2px solid var(--sg-good);background:var(--sg-good-bg);border-radius:var(--sg-radius-sm)}
.sgb-answer .sgb-label{color:var(--sg-good-ink)}
.sgb-together{border-style:dashed;border-width:2px}
.sgb-check{min-height:40px;padding:6px 18px;border-radius:999px;border:2px solid var(--sg);background:#fff;color:var(--sg-deep);font-weight:700;cursor:pointer}
.sgb-check:hover{background:var(--sg-soft)}
.sgb-try-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.sgb-input-label{font-weight:700;font-size:16px;width:100%}
.sgb-input{min-height:48px;min-width:0;width:200px;max-width:100%;font-size:20px;padding:8px 12px;border:2px solid var(--sg-line);border-radius:var(--sg-radius-sm)}
.sgb-input:focus{border-color:var(--sg)}
.sgb-why-box{width:100%;font-size:17px;padding:10px 12px;border:2px solid var(--sg-line);border-radius:var(--sg-radius-sm);margin:6px 0 10px}
.sgb-feedback{margin:10px 0 0;font-weight:700;font-size:17px;min-height:1em}
.sgb-feedback.is-right{color:var(--sg-good-ink)}
.sgb-feedback.is-wrong{color:var(--sg-bad-ink)}
.sgb-hint{margin:10px 0 0;padding:10px 14px;background:var(--sg-warn-bg);border-radius:var(--sg-radius-sm);color:var(--sg-warn-ink)}
.sgb-explain{margin:16px 0 0}
.sgb-model{margin:10px 0 0;padding:12px 14px;background:var(--sg-soft);border-radius:var(--sg-radius-sm)}
.sgb-big{margin:8px 0 18px;padding:16px 20px;border-left:5px solid var(--sg-deep);background:var(--sg-soft);border-radius:0 var(--sg-radius) var(--sg-radius) 0}
.sgb-big p{margin:0;font-size:19px;font-weight:600;line-height:1.5}
.sgb-big-list{margin:0;padding-left:20px;display:grid;gap:8px;font-size:17px}
.sgb-lesson{margin:0 0 26px;padding:0 0 8px;border-bottom:2px solid var(--sg-line)}
.sgb-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;font-size:.82em;line-height:1.05;margin:0 .12em}
.sgb-n{border-bottom:2px solid currentColor;padding:0 .15em}
.sgb-d{padding:0 .15em}
.sgb-whole{margin-right:.05em}
.sgb-arrow{color:var(--sg);font-weight:400;margin:0 .2em}
@media print{.sgb-check,.sgb-try-row .btn,.sgb-done-row{display:none!important}.sgb-reveal,.sgb-answer,.sgb-hint,.sgb-model,.sgb-explain{display:block!important}}
`;
