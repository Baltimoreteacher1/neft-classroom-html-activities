// Practice path — everything a student does after "Learn it" in a small-group
// studio: Practice together → On my own → Check → Challenge.
//
// Reads `launch.practice`, which the generators copy from the authored
// data/small-group-practice/<lesson>.json (contract:
// docs/specs/small-group-practice-v1.md). It speaks the same visual language as
// the Build section (Problem box → figure → numbered steps → Answer box) so the
// lesson reads as one continuous page of mathematics.
//
// It replaces practice stamped from topic templates (`parallelPractice`), which
// in a median lesson opened with "Add all values", and the panels stacked
// around it — strategy pickers, a readiness pulse, a level ladder, a consensus
// protocol, a coach — that put six or more buttons on every problem.

import { mathHtml } from "./small-group-build-figure-kit.js";
import {
  figure,
  isAccepted,
  label,
  line,
  revealButton,
  workedStep,
} from "./small-group-build-section.js";
import { makePulse } from "./small-group-engagement.js";
import { celebrate, el, esc, esLane, framesRow, sectionHeading, speak } from "./small-group-ui.js";

/** Plain text of a field in the student's language lane, for read-aloud. */
const spoken = (en, es) => (es && esLane() ? es : en).replace(/\{(\d+)\/(\d+)\}/g, "$1/$2");

function readButton(text, lang) {
  const read = el("button", "btn ghost sgp-read", "🔊 Read it to me");
  read.type = "button";
  read.setAttribute("aria-pressed", "false");
  read.addEventListener("click", () => speak(text, read, lang));
  return read;
}

function problemBox(it) {
  const box = el("div", "sgb-problem sgp-problem");
  const head = el("div", "sgp-problem-head");
  head.innerHTML = label("Problem");
  head.appendChild(
    readButton(spoken(it.problem, it.problemEs), esLane() && it.problemEs ? "es-US" : "en-US"),
  );
  box.append(head, el("p", null, line(it.problem, it.problemEs)));
  return box;
}

function cardTitle(text, lesson) {
  const h = el("h3", "sgb-title", esc(text));
  if (lesson) h.appendChild(el("span", "sgp-lesson", `Lesson ${esc(lesson)}`));
  return h;
}

/** The worked solution, folded until the student asks for it (or the check closes). */
function solution(it) {
  const wrap = el("div", "sgp-solution");
  wrap.hidden = true;
  wrap.innerHTML = label("The steps");
  const list = el("ol", "sgb-steps");
  it.steps.forEach((s, i) => list.appendChild(workedStep(s, i)));
  wrap.appendChild(list);
  if (!it.choices)
    wrap.appendChild(
      el("div", "sgb-answer", `${label("Answer")}<p>${line(it.answer, it.answerEs)}</p>`),
    );
  return wrap;
}

/** Tally + telemetry hook shared by every graded problem. */
function scorer({ tally, events, standard }) {
  return {
    add() {
      tally.total++;
    },
    attempt(it, correct, response, choiceIndex = null) {
      events.onAttempt?.({
        correct,
        response,
        choiceIndex,
        item: { stem: it.problem, _standard: standard },
      });
    },
    hint() {
      events.onHint?.();
    },
    solved() {
      tally.solved++;
      events.onSolved?.();
      tally.update();
    },
  };
}

/**
 * One problem with an answer box (or choices), Check, Hint and the worked steps.
 * mode "own"     — hint any time; "Show the steps" after a miss.
 * mode "check"   — first try is recorded; hint after a miss; steps once answered.
 * mode "stretch" — like own, never counted toward progress.
 */
function practiceCard(it, { n, key, store, score, mode, onAnswered }) {
  const card = el("article", "sgb-ex sgp-card");
  card.dataset.mode = mode;
  card.appendChild(cardTitle(mode === "stretch" ? "Challenge" : `Problem ${n}`, it.lesson));
  card.appendChild(problemBox(it));
  if (it.figure) card.appendChild(el("div", "sgb-figure sgp-figure", figure(it.figure)));

  const feedback = el("p", "sgb-feedback");
  feedback.setAttribute("aria-live", "polite");
  const hintText = el("p", "sgb-hint", `💡 ${line(it.hint, it.hintEs)}`);
  hintText.hidden = true;
  const steps = solution(it);
  const tools = el("div", "sgp-tools");
  const hintBtn = el("button", "btn ghost sgp-hint-btn", "💡 Hint");
  hintBtn.type = "button";
  hintBtn.addEventListener("click", () => {
    hintText.hidden = false;
    hintBtn.hidden = true;
    score.hint();
  });
  const stepsBtn = el("button", "btn ghost sgp-steps-btn", "Show the steps");
  stepsBtn.type = "button";
  stepsBtn.hidden = true;
  stepsBtn.addEventListener("click", () => {
    steps.hidden = false;
    stepsBtn.hidden = true;
  });
  if (mode === "check") hintBtn.hidden = true;
  tools.append(hintBtn, stepsBtn);

  let explain = null;
  if (it.explain) {
    explain = el("div", "sgb-explain");
    explain.hidden = true;
    const eid = `sgp-${key}-why`;
    explain.innerHTML = `<label class="sgb-input-label" for="${eid}">✍️ ${line(it.explain, it.explainEs)}</label>`;
    const area = el("textarea", "sgb-why-box");
    area.id = eid;
    area.rows = 3;
    area.value = store?.get(`${key}-why`) || "";
    area.addEventListener("input", () => store?.set(`${key}-why`, area.value));
    const model = el(
      "p",
      "sgb-model",
      `${label("A strong answer")}${line(it.modelExplanation, it.modelExplanationEs)}`,
    );
    model.hidden = true;
    explain.append(
      area,
      revealButton("Compare with a strong answer", () => (model.hidden = false)),
      model,
    );
  }

  const counted = mode !== "stretch";
  if (counted) score.add();
  let misses = 0;
  let done = false;
  const finish = (correct) => {
    if (done) return;
    done = true;
    store?.set(`${key}-done`, correct ? "right" : "shown");
    card.classList.add(correct ? "is-right" : "is-shown");
    // Answered (or closed by the solution): the controls are finished too.
    for (const c of card.querySelectorAll(".sgp-choice, .sgb-input, .sgb-submit"))
      c.disabled = true;
    if (correct && counted) score.solved();
    if (mode === "check") {
      hintBtn.hidden = true;
      stepsBtn.hidden = false;
      stepsBtn.textContent = "See the solution";
    }
    if (correct && explain) explain.hidden = false;
    onAnswered?.(correct);
  };

  const grade = (correct, response, choiceIndex, restoring) => {
    if (!restoring) score.attempt(it, correct, response, choiceIndex);
    if (mode === "check" && !restoring && store?.get(`${key}-first`) === undefined)
      store?.set(`${key}-first`, correct);
    if (correct) {
      feedback.className = "sgb-feedback is-right";
      feedback.innerHTML = it.choices ? "✓ Correct." : `✓ Correct — ${mathHtml(it.answer)}.`;
      finish(true);
      return;
    }
    misses++;
    feedback.className = "sgb-feedback is-wrong";
    if (mode === "check" && misses >= 2) {
      feedback.textContent = "Not yet. Look at the solution, then try the next one.";
      finish(false);
      return;
    }
    feedback.textContent =
      misses >= 2 ? "Not yet. Read the hint and the steps, then try again." : "Not yet. Try again.";
    if (misses >= 2) hintText.hidden = false;
    hintBtn.hidden = !hintText.hidden;
    if (mode !== "check") stepsBtn.hidden = !steps.hidden;
  };

  const answerArea = it.choices
    ? choiceControl(it, key, store, grade)
    : boxControl(it, key, store, grade);
  card.append(answerArea, feedback, tools, hintText, steps);
  if (explain) card.appendChild(explain);
  // A check closed by "See the solution" has no correct answer to replay.
  if (store?.get(`${key}-done`) === "shown")
    queueMicrotask(() => {
      feedback.className = "sgb-feedback is-wrong";
      feedback.textContent = "You looked at the solution for this one.";
      finish(false);
    });
  return card;
}

function boxControl(it, key, store, grade) {
  const row = el("div", "sgb-try-row");
  const id = `sgp-${key}`;
  const lab = el("label", "sgb-input-label", "My answer");
  lab.htmlFor = id;
  const input = el("input", "sgb-input");
  input.id = id;
  input.type = "text";
  input.autocomplete = "off";
  input.setAttribute("inputmode", /^[−-]?[\d.,\s/]+$/.test(it.answer) ? "decimal" : "text");
  const check = el("button", "btn sgb-submit", "Check");
  check.type = "button";
  const run = (restoring) => {
    const value = input.value.trim();
    if (!value) return;
    if (!restoring) store?.set(key, value);
    grade(isAccepted(value, it.accept), value, null, restoring);
  };
  check.addEventListener("click", () => run(false));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run(false);
  });
  row.append(lab, input, check);
  const saved = store?.get(key);
  if (saved) {
    input.value = saved;
    queueMicrotask(() => run(true));
  }
  return row;
}

function choiceControl(it, key, store, grade) {
  const group = el("div", "sgp-choices");
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Choose one answer");
  const why = el("p", "sgp-why");
  why.hidden = true;
  const buttons = it.choices.map((c, i) => {
    const b = el(
      "button",
      "sgp-choice",
      `<span class="sgp-letter">${"ABCD"[i]}</span><span>${line(c, it.choicesEs?.[i])}</span>`,
    );
    b.type = "button";
    b.addEventListener("click", () => pick(i, false));
    group.appendChild(b);
    return b;
  });
  let locked = false;
  function pick(i, restoring) {
    if (locked) return;
    const correct = i === it.correct;
    buttons[i].classList.add(correct ? "is-right" : "is-wrong");
    buttons[i].disabled = true;
    if (!correct && it.choiceWhy?.[i]) {
      why.hidden = false;
      why.innerHTML = line(it.choiceWhy[i], it.choiceWhyEs?.[i]);
    } else why.hidden = true;
    if (correct) {
      locked = true;
      buttons.forEach((b) => {
        b.disabled = true;
      });
    }
    if (!restoring) store?.set(key, (store?.get(key) || []).concat(i));
    grade(correct, it.choices[i], i, restoring);
  }
  const wrap = el("div", "sgp-choice-wrap");
  wrap.append(group, why);
  const saved = store?.get(key);
  if (Array.isArray(saved)) queueMicrotask(() => saved.forEach((i) => pick(i, true)));
  return wrap;
}

/** A Together problem: each step asks for one thing; typed steps check themselves. */
function togetherCard(t, { n, key, store, score, onDone }) {
  const card = el("article", "sgb-ex sgb-together sgp-together");
  card.appendChild(cardTitle(`Problem ${n}`));
  card.appendChild(problemBox(t));
  const work = el("div", `sgb-work${t.figure ? " has-figure" : ""}`);
  if (t.figure) work.appendChild(el("div", "sgb-figure", figure(t.figure)));
  const list = el("ol", "sgb-steps");
  const answer = el("div", "sgb-answer", `${label("Answer")}<p>${line(t.answer, t.answerEs)}</p>`);
  answer.hidden = true;
  score.add();
  let finished = 0;
  const stepDone = () => {
    if (++finished < t.steps.length) return;
    answer.hidden = false;
    card.classList.add("is-right");
    score.solved();
    onDone?.();
  };
  t.steps.forEach((s, i) =>
    list.appendChild(togetherStep(s, i, `${key}-s${i}`, store, score, t, stepDone)),
  );
  work.appendChild(list);
  card.append(work, answer);
  return card;
}

function togetherStep(s, i, key, store, score, t, onDone) {
  const li = el("li", "sgb-step sgb-ask");
  li.appendChild(el("span", "sgb-num", String(i + 1)));
  const body = el("div", "sgb-step-body");
  body.appendChild(el("p", "sgb-do", line(s.ask, s.askEs)));
  const shown = el("div", "sgb-math sgb-reveal", line(s.answer, s.answerEs));
  shown.hidden = true;
  let done = false;
  const complete = () => {
    if (done) return;
    done = true;
    shown.hidden = false;
    li.classList.add("is-done");
    store?.set(key, true);
    onDone();
  };
  if (!s.accept) {
    body.append(revealButton("Show", complete), shown);
  } else {
    const row = el("div", "sgp-step-row");
    const input = el("input", "sgb-input sgp-step-input");
    input.type = "text";
    input.autocomplete = "off";
    input.setAttribute("aria-label", `Step ${i + 1} answer`);
    const check = el("button", "sgb-check", "Check");
    check.type = "button";
    const fb = el("span", "sgp-step-fb");
    fb.setAttribute("aria-live", "polite");
    let misses = 0;
    const run = () => {
      const value = input.value.trim();
      if (!value) return;
      const ok = isAccepted(value, s.accept);
      score.attempt({ problem: `${t.problem} — ${s.ask}` }, ok, value);
      if (ok) {
        fb.textContent = "✓";
        fb.className = "sgp-step-fb is-right";
        row.remove();
        complete();
        return;
      }
      misses++;
      fb.className = "sgp-step-fb is-wrong";
      fb.textContent = misses >= 2 ? "Not yet — tap Show me." : "Not yet. Try again.";
      if (misses >= 2 && !row.querySelector(".sgp-showme")) {
        const show = revealButton("Show me", () => {
          row.remove();
          complete();
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
    body.append(row, shown);
  }
  li.appendChild(body);
  if (store?.get(key))
    queueMicrotask(() => {
      body.querySelector(".sgp-step-row")?.remove();
      body.querySelector(".sgb-check")?.remove();
      complete();
    });
  return li;
}

function talkCard(talk, { store }) {
  const card = el("article", "sgb-ex sgp-talk");
  card.appendChild(cardTitle("Talk about it"));
  const prompt = el("div", "sgb-problem sgp-problem");
  const head = el("div", "sgp-problem-head");
  head.innerHTML = label("Discuss with your group");
  head.appendChild(
    readButton(spoken(talk.prompt, talk.promptEs), esLane() && talk.promptEs ? "es-US" : "en-US"),
  );
  prompt.append(head, el("p", null, line(talk.prompt, talk.promptEs)));
  card.appendChild(prompt);
  card.appendChild(el("p", "sgp-frames-lab", "Start your sentence like this:"));
  const frames = framesRow(talk.frames, talk.framesEs, 2);
  if (frames) card.appendChild(frames);
  const id = "sgp-talk-note";
  const lab = el("label", "sgb-input-label", "Write your best sentence (optional)");
  lab.htmlFor = id;
  const area = el("textarea", "sgb-why-box");
  area.id = id;
  area.rows = 2;
  area.value = store?.get("talkNote") || "";
  area.addEventListener("input", () => store?.set("talkNote", area.value));
  card.append(lab, area);
  return card;
}

function intro(text) {
  return el("p", "sgb-today sgp-intro", text);
}

/** Step 3 — two problems solved together, step by step. */
export function createTogetherSection(config, ctx) {
  const p = config.launch?.practice;
  if (!p?.together?.length) return null;
  const section = el("section", "sg-sec sgb sgp");
  section.id = "sg-together";
  section.appendChild(sectionHeading(3, "Practice together", "Solve it with your group"));
  section.appendChild(
    intro(
      "Do each step, then type what you got. Talk about each step with your group before you check it.",
    ),
  );
  const score = scorer(ctx);
  let left = p.together.length;
  p.together.forEach((t, i) =>
    section.appendChild(
      togetherCard(t, {
        n: i + 1,
        key: `pt-${i}`,
        store: ctx.store,
        score,
        onDone: () => {
          if (--left === 0) ctx.onDone?.();
        },
      }),
    ),
  );
  return section;
}

/** Step 4 — problems on your own (answer box, hint, the steps after a miss), then the talk prompt. */
export function createOnMyOwnSection(config, ctx) {
  const p = config.launch?.practice;
  if (!p?.onMyOwn?.length) return null;
  const section = el("section", "sg-sec sgb sgp");
  section.id = "sg-own";
  section.appendChild(sectionHeading(4, "On my own", "Try it yourself"));
  section.appendChild(
    intro(
      "Solve each problem in your notebook. Then type your answer and check it. Stuck? Use the hint.",
    ),
  );
  const score = scorer(ctx);
  let left = p.onMyOwn.length;
  p.onMyOwn.forEach((it, i) =>
    section.appendChild(
      practiceCard(it, {
        n: i + 1,
        key: `po-${i}`,
        store: ctx.store,
        score,
        mode: "own",
        onAnswered: () => {
          if (--left === 0) ctx.onDone?.();
        },
      }),
    ),
  );
  // The talk prompt comes last: it often names a mistake from these problems.
  if (p.talk) section.appendChild(talkCard(p.talk, ctx));
  return section;
}

/**
 * Step 5 — the exit check. First try counts; then one tap for "how sure are you
 * now?" and Finish, which hands control back to the renderer's completion.
 */
export function createExitCheckSection(config, state, ctx) {
  const p = config.launch?.practice;
  if (!p?.check?.length) return null;
  const { store } = ctx;
  const section = el("section", "sg-sec sgb sgp");
  section.id = "sg-check";
  section.appendChild(sectionHeading(5, "Check", "Show what you know"));
  section.appendChild(
    intro(
      "Try these on your own. Your first answer shows your teacher what you know — no hints until you try.",
    ),
  );
  const score = scorer(ctx);
  const finishCard = el("article", "sgb-ex sgp-finish");
  finishCard.hidden = true;
  let left = p.check.length;
  p.check.forEach((it, i) =>
    section.appendChild(
      practiceCard(it, {
        n: i + 1,
        key: `pc-${i}`,
        store,
        score,
        mode: "check",
        onAnswered: () => {
          if (--left > 0) return;
          const firsts = p.check.map((_, j) => store?.get(`pc-${j}-first`));
          const right = firsts.filter((v) => v === true).length;
          store?.set("checkBandScore", right);
          store?.set(
            "checkBand",
            right === p.check.length ? "meeting" : right ? "approaching" : "beginning",
          );
          finishCard.hidden = false;
        },
      }),
    ),
  );
  finishCard.appendChild(cardTitle("How sure are you now?"));
  finishCard.appendChild(
    makePulse(state, "after", (v) => store?.set("pulseAfter", v), store?.get("pulseAfter")),
  );
  const row = el("div", "row sgb-done-row");
  const finish = el("button", "btn", "Finish ✓");
  finish.type = "button";
  const done = () => {
    finish.disabled = true;
    finish.textContent = "Finished ✓";
    ctx.onComplete?.();
  };
  finish.addEventListener("click", () => {
    store?.set("finished", true);
    celebrate("🎉");
    done();
  });
  row.appendChild(finish);
  finishCard.appendChild(row);
  section.appendChild(finishCard);
  if (store?.get("finished")) queueMicrotask(done);
  return section;
}

/** The optional Challenge problem, offered after Apply. Never counted. */
export function createChallengeCard(config, ctx) {
  const it = config.launch?.practice?.stretch;
  if (!it) return null;
  const section = el("section", "sg-sec sgb sgp");
  section.id = "sg-challenge";
  section.appendChild(
    el(
      "p",
      "sgb-today sgp-intro",
      `${label("Ready for more?")}One harder problem. It is optional.`,
    ),
  );
  section.appendChild(
    practiceCard(it, { n: 1, key: "ps", store: ctx.store, score: scorer(ctx), mode: "stretch" }),
  );
  return section;
}

export const PRACTICE_CSS = `
.sgp .sgp-intro{font-size:18px}
.sgp-problem-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.sgp-read{min-height:36px;padding:4px 12px;font-size:15px}
.sgp-lesson{margin-left:10px;padding:2px 10px;border-radius:999px;background:var(--sg-soft);color:var(--sg-deep);font-size:14px;font-weight:700;vertical-align:middle}
.sgp-figure{margin:0 0 14px}
.sgp-card.is-right,.sgp-together.is-right{border-color:var(--sg-good)}
.sgp-tools{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 0}
.sgp-tools .btn[hidden]{display:none}
.sgp-solution{margin:14px 0 0;padding:14px 16px;background:var(--sg-soft);border-radius:var(--sg-radius-sm)}
.sgp-step-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 0}
.sgp-step-input{width:150px;min-height:44px;font-size:18px}
.sgp-step-fb{font-weight:700}
.sgp-step-fb.is-right{color:var(--sg-good-ink)}
.sgp-step-fb.is-wrong{color:var(--sg-bad-ink)}
.sgb-step.is-done .sgb-num{background:var(--sg-good)}
.sgp-choices{display:grid;gap:10px;margin:0 0 6px}
@media (min-width:700px){.sgp-choices{grid-template-columns:1fr 1fr}}
.sgp-choice{display:flex;align-items:center;gap:12px;min-height:52px;padding:10px 14px;text-align:left;font-size:18px;font-weight:600;background:#fff;color:var(--sg-ink,#14213d);border:2px solid var(--sg-line);border-radius:var(--sg-radius-sm);cursor:pointer}
.sgp-choice:hover:not(:disabled){border-color:var(--sg)}
.sgp-choice.is-right{border-color:var(--sg-good);background:var(--sg-good-bg)}
.sgp-choice.is-wrong{border-color:var(--sg-bad-ink);opacity:1}
.sgp-choice:disabled{cursor:default}
.sgp-letter{display:grid;place-items:center;flex:0 0 30px;height:30px;border-radius:50%;background:var(--sg-soft);color:var(--sg-deep);font-weight:700}
.sgp-why{margin:6px 0 0;padding:10px 14px;background:var(--sg-warn-bg);border-radius:var(--sg-radius-sm);color:var(--sg-warn-ink)}
.sgp-frames-lab{margin:12px 0 6px;font-weight:700}
.sgp-talk .sg-frames{margin:0 0 12px}
.sgp-finish .sg-pulse{margin:0 0 12px}
@media print{.sgp-tools,.sgp-read,.sgp-step-row .sgb-check,.sgp-step-row .sgp-showme,.sgp-finish{display:none!important}.sgp-solution,.sgp-why,.sgb-model{display:none!important}}
`;
