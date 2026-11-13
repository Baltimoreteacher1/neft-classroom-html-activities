// One skill, one screen, four moments: See it → Try it → Practice it → Understand it. The stepper is a
// compact indicator, not a menu; a student who already knows the idea can go straight to practice.
import { validateAnswer } from "../problem-bank.js";
import { adaptiveProblem, difficulty, feedbackFor, prerequisites } from "../tutor-engine.js";
import { renderModel } from "../visual-lab.js";
import { choicesEs, questionEs } from "../question-es.js";
import { diagnose, framesOf, lessonFor } from "../studio/engines.js";
import { mountBuild } from "../studio/panel-build.js";
import { bankEs, stepsEs } from "./bank-es.js";
import { mountCanvas, frameStrip } from "./canvas.js";
import { eqIn } from "../studio/eq-language.js";
import { anotherWay, helpLadder, teach } from "./content.js";
import { explainFrame, wordsToKnow } from "./language.js";
import { bindListen, listenButton, readAloudOn } from "./prefs.js";
import { loadTutor, recordPractice, saveLastVisit, skillMeter } from "./store.js";
import { meterHtml } from "./meter.js";
import { afterAnswer, afterSolution, loadAwards } from "./practice-cheer.js";
import { esc, gradeName, lang, named, pickL, tr } from "./words.js";

const STAGES = [
  { id: "see", label: "See it" },
  { id: "try", label: "Try it" },
  { id: "practice", label: "Practice it" },
];
const REP_NAMES = { table: "a table", line: "a number line" };
// Legacy stage ids in shared links: learn→see, try→try, practice→practice.
export const stageFromParam = (value) =>
  ({ learn: "see", try: "try", practice: "practice", see: "see" })[value] || "see";
const linkStage = { see: "learn", try: "try", practice: "practice" };

export function mountSkill(root, skill, { stage = "see", go, live }) {
  const content = teach(skill);
  let current = stage;
  const say = (text) => live(text);

  root.innerHTML = `
    <section class="skill" aria-labelledby="skill-title">
      <header class="skill-head">
        <p class="eyebrow">${esc(gradeName(skill.grade))}</p>
        <h1 id="skill-title" tabindex="-1">${esc(pickL(content.title))}</h1>
        <div class="skill-meter" data-meter-host>${meterHtml(skillMeter(skill))}</div>
        <ol class="stepper" aria-label="${esc(tr("Steps"))}">${STAGES.map((s) => `<li data-s="${s.id}"><button type="button" class="stepper-btn" data-goto="${s.id}">${esc(tr(s.label))}</button></li>`).join("")}</ol>
      </header>
      <div class="skill-body" data-body></div>
    </section>`;
  const body = root.querySelector("[data-body]");
  root
    .querySelectorAll("[data-goto]")
    .forEach((b) => b.addEventListener("click", () => show(b.dataset.goto)));

  function show(id) {
    current = id;
    saveLastVisit(skill.grade, skill.id, linkStage[id]);
    history.replaceState(
      null,
      "",
      `?grade=${skill.grade}&skill=${skill.id}${id === "see" ? "" : `&stage=${linkStage[id]}`}`,
    );
    root.querySelectorAll(".stepper li").forEach((li) => {
      li.classList.toggle("is-on", li.dataset.s === id);
      li.querySelector("button").setAttribute(
        "aria-current",
        li.dataset.s === id ? "step" : "false",
      );
    });
    ({ see: renderSee, try: renderTry, practice: renderPractice })[id]();
    root.querySelector("#skill-title").focus({ preventScroll: true });
  }

  // STEP A — concept, one synchronized worked example, and the misconception to watch for.
  function renderSee() {
    const ex = content.example;
    body.innerHTML = `
      <div class="panel panel-lead">
        <h2 class="panel-kicker">${esc(tr("The big idea"))}</h2>
        <p class="lead" data-concept>${esc(pickL(content.concept))}</p>
        ${readAloudOn(skill.grade) ? listenButton(esc(tr("Listen"))) : ""}
      </div>
      <div class="panel">
        <h2 class="panel-kicker">${esc(tr("Worked example"))}</h2>
        <p class="problem-line">${esc(lang() === "es" ? questionEs(ex.item) || ex.item.question : ex.item.question)}</p>
        <div data-canvas></div>
        
      </div>
      ${pickL(content.misconception) ? `<aside class="watch"><strong>${esc(tr("Watch out"))}</strong> ${esc(pickL(content.misconception))}</aside>` : ""}
      ${wordsToKnow(skill)}
      <div class="actions"><button type="button" class="btn btn-primary" data-stage-next>${esc(tr("I see it — let me try"))}</button>
      <button type="button" class="btn btn-link" data-skip>${esc(tr("Skip to practice"))}</button></div>`;
    bindListen(body, () => pickL(content.concept), lang);
    const host = body.querySelector("[data-canvas]");
    if (ex.frames.length)
      mountCanvas(host, { frames: ex.frames, predicts: ex.modeled ? ex.predicts : [] });
    else if (content.guideModel)
      host.innerHTML = `<div class="model-fallback">${renderModel(content.guideModel)}</div>`;
    body.querySelector("[data-stage-next]").addEventListener("click", () => show("try"));
    body.querySelector("[data-skip]").addEventListener("click", () => show("practice"));
  }

  // STEP B — investigate: an authored living model, the engine's Build, or a guided attempt.
  function renderTry() {
    body.innerHTML = `<div class="panel"><div data-try></div></div>
      <div class="actions"><button type="button" class="btn btn-primary" data-stage-next>${esc(tr("Go to practice"))}</button></div>`;
    const host = body.querySelector("[data-try]");
    if (content.living) {
      host.innerHTML = `<h2 class="panel-kicker">${esc(tr("Try it"))}</h2><div data-lm-host></div>${content.reasons ? `<ul class="reasons">${content.reasons.map((r) => `<li>${esc(pickL(r))}</li>`).join("")}</ul>` : ""}`;
      content.living.mount(host.querySelector("[data-lm-host]"), { lang, say });
    } else if (content.build) {
      host.innerHTML = `<h2 class="panel-kicker">${esc(tr("Build it"))}</h2><div class="sd-studio" data-build></div>`;
      mountBuild(
        { lesson: content.build, lang, key: `${skill.grade}:${skill.id}`, say, mark: () => {} },
        host.querySelector("[data-build]"),
      );
    } else guided(host);
    body.querySelector("[data-stage-next]").addEventListener("click", () => show("practice"));
  }

  // A guided attempt: one question at a time with a hint on request; the explanation follows each answer.
  function guided(host) {
    const steps = content.guided;
    let n = 0;
    const draw = () => {
      const step = steps[n];
      if (!step) {
        host.innerHTML = `<p class="lead">${esc(tr("Solved on your own."))}</p>`;
        return;
      }
      const en = lang() === "es" && !content.authoredGuided;
      host.innerHTML = `<h2 class="panel-kicker">${esc(tr("Your turn, together"))} · ${n + 1}/${steps.length}${en ? ` <span class="tag">${esc(tr("in English"))}</span>` : ""}</h2>
        ${content.guideModel && n === 0 ? `<div class="model-fallback">${renderModel(content.guideModel)}</div>` : ""}
        <form class="answer-row" data-form${en ? ' lang="en"' : ""}><label for="g-in">${esc(step.prompt)}</label>
        <input id="g-in" class="answer" autocomplete="off" inputmode="text"/><button class="btn btn-secondary">${esc(tr("Check answer"))}</button></form>
        <button type="button" class="btn btn-link" data-hint>${esc(tr("Hint"))}</button><p class="note" data-out aria-live="polite"></p>`;
      host
        .querySelector("[data-hint]")
        .addEventListener(
          "click",
          () => (host.querySelector("[data-out]").textContent = step.hint),
        );
      host.querySelector("[data-form]").addEventListener("submit", (event) => {
        event.preventDefault();
        const raw = host.querySelector("#g-in").value;
        const ok = validateAnswer(raw, { answers: step.answers, kind: step.kind || "text" });
        host.querySelector("[data-out]").textContent = ok
          ? `${tr("Correct.")} ${step.explanation}`
          : `${tr("Not yet.")} ${step.hint}`;
        if (ok) setTimeout(() => ((n += 1), draw()), 1400);
      });
    };
    draw();
  }

  // STEP C + D — one problem at a time; help is one control that climbs a ladder; feedback names the idea.
  // The next problem is chosen from the learner's record, never from one answer (tutor-engine difficulty()):
  // smaller numbers after repeated misses or supported work, the skill's own level otherwise, a stretch after
  // four clean independent answers. Three independent successes in a row earn a transfer problem in a new context.
  let streakIndependent = 0;
  let missesInRow = 0;
  let count = 0;
  function nextItem() {
    if (streakIndependent >= 3) {
      streakIndependent = 0;
      const t = content.transfer;
      if (t)
        return {
          question: pickL(t.prompt),
          answers: t.answers,
          kind: t.kind || "number",
          explanation: pickL(t.explanation),
          hint: t.hint ? pickL(t.hint) : undefined,
          unit: t.unit ? pickL(t.unit) : undefined,
          level: 2,
          transfer: true,
        };
      return { ...adaptiveProblem(skill, Math.random, 2), stretch: true };
    }
    return adaptiveProblem(skill, Math.random, difficulty(loadTutor(), skill));
  }

  function renderPractice() {
    const item = nextItem();
    const ladder = localLadder(helpLadder(skill, item));
    const other = item.transfer ? null : anotherWay(item, content);
    let helpUsed = 0;
    let sawAnother = false;
    let tries = 0;
    count += 1;
    const es = lang() === "es";
    const question = es ? questionEs(item) || item.question : item.question;
    const labels = (es && choicesEs(item)) || item.choices;
    // In Spanish the explanation comes from the engine's bilingual frames; the bank's own steps and explanation
    // are English-only, so they are shown in Spanish mode only when there is no picture, and marked as English.
    const lesson = item.transfer ? null : lessonFor(item);
    const solved = lesson?.modeled ? framesOf(lesson, lesson.spec.reps?.[0] || "main") : [];
    const badge = item.transfer
      ? tr("New context")
      : item.stretch
        ? tr("Challenge")
        : item.level === 0 && missesInRow > 0
          ? tr("Warm-up size")
          : "";
    body.innerHTML = `
      <div class="panel practice">
        <p class="practice-meta">${esc(tr("Problem {n}", { n: count }))}${badge ? ` · <span class="tag">${esc(badge)}</span>` : ""}</p>
        <div class="problem-row"><p class="problem" id="problem">${esc(question)}</p>${readAloudOn(skill.grade) ? listenButton(esc(tr("Listen"))) : ""}</div>
        ${item.choices ? `<div class="choices" role="group" aria-labelledby="problem">${item.choices.map((c, i) => `<button type="button" class="btn btn-choice" data-pick="${esc(c)}" aria-pressed="false">${esc(labels[i] ?? c)}</button>`).join("")}</div>` : ""}
        <form class="answer-row" data-form>
          <label class="sr-only" for="answer">${esc(tr("Your answer"))}</label>
          <input id="answer" class="answer" autocomplete="off" ${item.choices ? "hidden" : ""} placeholder="${esc(tr("Your answer"))}" aria-describedby="feedback"/>
          ${item.unit ? `<span class="unit">${esc(item.unit)}</span>` : ""}
          <button class="btn btn-primary" data-check>${esc(tr("Check answer"))}</button>
        </form>
        <div class="feedback" id="feedback" data-fb aria-live="polite"></div>
        <div class="help" data-help hidden></div>
        <div class="actions actions-quiet">
          ${ladder.length ? `<button type="button" class="btn btn-quiet" data-helpme>${esc(tr("Help me understand"))}</button>` : ""}
          ${other ? `<button type="button" class="btn btn-quiet" data-another>${esc(tr("Another way"))}</button>` : ""}
        </div>
      </div>`;
    loadAwards();
    const input = body.querySelector("#answer");
    if (!item.choices) input.focus({ preventScroll: true });
    bindListen(
      body,
      () => `${question} ${labels ? labels.join(", ") : ""}`,
      lang,
    );
    body.querySelectorAll("[data-pick]").forEach((b) =>
      b.addEventListener("click", () => {
        body
          .querySelectorAll("[data-pick]")
          .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        input.value = b.dataset.pick;
      }),
    );
    const helpBox = body.querySelector("[data-help]");
    const helpBtn = body.querySelector("[data-helpme]");
    helpBtn?.addEventListener("click", () => {
      const rung = ladder[helpUsed];
      if (!rung) return;
      helpUsed += 1;
      helpBox.hidden = false;
      helpBox.insertAdjacentHTML("beforeend", rungHtml(rung));
      mountFrames(helpBox);
      if (helpUsed >= ladder.length) helpBtn.hidden = true;
      else helpBtn.textContent = tr("More help");
    });
    const anotherBtn = body.querySelector("[data-another]");
    anotherBtn?.addEventListener("click", () => {
      sawAnother = true;
      anotherBtn.hidden = true;
      helpBox.hidden = false;
      helpBox.insertAdjacentHTML("beforeend", anotherHtml(other));
      mountFrames(helpBox);
    });
    body.querySelector("[data-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = input.value.trim();
      if (!raw) return input.focus();
      tries += 1;
      const correct = validateAnswer(raw, item);
      const independent = helpUsed === 0 && !sawAnother && tries === 1;
      const before = skillMeter(skill);
      recordPractice(skill, item, {
        correct,
        independent,
        firstTry: tries === 1,
        raw,
        level: item.level ?? 1,
      });
      if (tries === 1) missesInRow = correct ? 0 : missesInRow + 1;
      const fb = body.querySelector("[data-fb]");
      if (correct) {
        streakIndependent = independent ? streakIndependent + 1 : 0;
        fb.className = "feedback is-right";
        fb.innerHTML = `<p><span class="cheer-mark" aria-hidden="true">✓</span><strong>${esc(tr("Correct."))}</strong> ${esc(independent ? tr("Solved on your own.") : tr("You solved it with help. Try one on your own to show what you know."))}</p>
          ${whyHtml(item, solved, es)}`;
        finishProblem(fb, true);
      } else if (tries < 2) {
        streakIndependent = 0;
        fb.className = "feedback is-wrong";
        fb.innerHTML = `<p><strong>${esc(tr("Not yet."))}</strong> ${esc(missNote(item, raw))}</p>`;
        const visual = ladder.findIndex((r) => r.kind === "visual");
        if (visual > -1 && helpUsed <= visual) {
          // Visual explanation coaching: after a miss, the picture of THIS problem opens beside the note.
          helpUsed = visual + 1;
          helpBox.hidden = false;
          helpBox.innerHTML = rungHtml(ladder[visual]);
          mountFrames(helpBox);
          if (helpBtn && helpUsed >= ladder.length) helpBtn.hidden = true;
        }
        input.select();
      } else {
        fb.className = "feedback is-wrong";
        fb.innerHTML = `<p><strong>${esc(tr("Here is the solution. A fresh problem of the same kind is next."))}</strong></p>
          ${solutionHtml(item, solved, es)}`;
        mountFrames(fb);
        finishProblem(fb, false);
        afterSolution(fb, count);
      }
      afterAnswer({ root, skill, before, correct, independent, firstTry: tries === 1, fb, live: say, n: count });
    });
  }

  function finishProblem(fb, correct) {
    body.querySelector("[data-check]").disabled = true;
    body.querySelector("#answer").readOnly = true;
    body.querySelectorAll("[data-pick]").forEach((b) => (b.disabled = true));
    body.querySelector("[data-helpme]")?.setAttribute("hidden", "");
    body.querySelector("[data-another]")?.setAttribute("hidden", "");
    // Repeated evidence, never one error: after two problems in a row missed on the first try, the skill this one
    // builds on is offered as a short review. The next problem is already smaller (difficulty() saw the misses).
    const base = missesInRow >= 2 ? prerequisites(skill)[0] : null;
    fb.insertAdjacentHTML(
      "beforeend",
      `${base ? `<p class="prereq">${esc(tr("This skill builds on"))} <a href="?grade=${base.grade}&skill=${esc(base.id)}">${esc(named(base.title))}</a>. ${esc(tr("A short review there can help."))}</p>` : ""}
      ${explainFrame({ correct, count })}
      <div class="actions"><button type="button" class="btn btn-primary" data-again>${esc(tr("Next problem"))}</button></div>`,
    );
    const next = fb.querySelector("[data-again]");
    next.addEventListener("click", renderPractice);
    next.focus();
  }

  // Feedback on a miss, most specific first: the skill's authored misconceptions, then the studio engine's
  // diagnosis of THIS answer (bilingual), then the lab's slip detector (English only; in Spanish a plain prompt
  // to compare with the picture, which opens beside the note).
  function missNote(item, raw) {
    const hit = content.misconceptions.find((m) => {
      try {
        return m.detect(item, raw);
      } catch {
        return false;
      }
    });
    if (hit) return pickL(hit.feedback);
    const lesson = item.transfer ? null : lessonFor(item);
    const tag = lesson?.modeled ? diagnose(lesson, raw) : null;
    if (tag?.tip) return pickL(tag.tip);
    return lang() === "es"
      ? tr("Compare your answer with the picture of this problem, then try once more.")
      : feedbackFor(skill, item, raw);
  }

  // Spanish mode keeps the rungs that speak Spanish: pictures, and the hint and steps wherever bank-es.js has them.
  // A rung with no Spanish is left out while another rung can help; if none can, the English rungs stay and are
  // marked as English rather than leaving a learner with no help.
  function localLadder(ladder) {
    if (lang() !== "es") return ladder;
    const spanish = ladder
      .map((rung) => {
        if (rung.kind === "visual") return rung;
        if (rung.kind === "hint") {
          const text = bankEs(rung.text);
          return text === null ? null : { ...rung, text };
        }
        const steps = stepsEs(rung.steps);
        return steps ? { ...rung, steps } : null;
      })
      .filter(Boolean);
    return spanish.length ? spanish : ladder.map((r) => ({ ...r, english: true }));
  }

  const englishNote = () =>
    `<span class="tag" lang="es">${esc(tr("in English"))}</span>`;
  function whyHtml(item, solved, es) {
    if (item.transfer || !es) return item.explanation ? `<p class="why">${esc(item.explanation)}</p>` : "";
    const last = solved.at(-1);
    if (last)
      return `<p class="why">${esc(eqIn(last.eq, lang()))} ${esc(pickL(last.cap))}</p>`;
    if (!item.explanation) return "";
    const text = bankEs(item.explanation);
    return text === null
      ? `<p class="why" lang="en">${esc(item.explanation)} ${englishNote()}</p>`
      : `<p class="why">${esc(text)}</p>`;
  }
  function solutionHtml(item, solved, es) {
    // The worked solution of THIS problem as the synchronized picture (both languages); bank steps without one.
    if (solved.length) return frameBox(solved);
    if ((item.steps || []).length) {
      const spanish = es ? stepsEs(item.steps) : null;
      const english = es && !spanish;
      return `<ol class="steps"${english ? ' lang="en"' : ""}>${(spanish || item.steps).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>${english ? englishNote() : ""}`;
    }
    if (!item.explanation) return "";
    const spanish = es && !item.transfer ? bankEs(item.explanation) : null;
    const english = es && !item.transfer && spanish === null;
    return `<p class="why"${english ? ' lang="en"' : ""}>${esc(spanish ?? item.explanation)}</p>`;
  }

  function rungHtml(rung) {
    const mark = rung.english ? ` ${englishNote()}` : "";
    if (rung.kind === "hint")
      return `<div class="rung"><h2 class="rung-title">${esc(tr("Hint"))}${mark}</h2><p${mark ? ' lang="en"' : ""}>${esc(rung.text)}</p></div>`;
    if (rung.kind === "visual")
      return `<div class="rung"><h2 class="rung-title">${esc(tr("Picture it"))}</h2>${frameBox(rung.frames)}</div>`;
    return `<div class="rung"><h2 class="rung-title">${esc(tr("Step by step"))}${mark}</h2><ol class="steps"${mark ? ' lang="en"' : ""}>${rung.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div>`;
  }

  // A help picture with more than one step is a small stepper (one large picture, Back / Next), not a long strip
  // of thumbnails: the picture stays legible on a phone and the explanation reads in order. Mounted after insert.
  const pendingFrames = new Map();
  let frameIds = 0;
  function frameBox(frames) {
    if (frames.length <= 1) return frameStrip(frames);
    frameIds += 1;
    pendingFrames.set(String(frameIds), frames);
    return `<div class="frame-box" data-frames="${frameIds}"></div>`;
  }
  function mountFrames(scope) {
    scope.querySelectorAll("[data-frames]").forEach((host) => {
      const frames = pendingFrames.get(host.dataset.frames);
      if (!frames) return;
      pendingFrames.delete(host.dataset.frames);
      mountCanvas(host, { frames });
    });
  }

  function anotherHtml(way) {
    if (way.kind === "text")
      return `<div class="rung"><h2 class="rung-title">${esc(tr("Another way"))}</h2><p>${esc(pickL(way.text))}</p></div>`;
    if (way.kind === "example")
      return `<div class="rung"><h2 class="rung-title">${esc(tr("A similar problem, worked out"))}</h2><p class="problem-line">${esc(lang() === "es" ? questionEs(way.question) || way.question.question : way.question.question)}</p>${frameBox(way.frames)}</div>`;
    return `<div class="rung"><h2 class="rung-title">${esc(tr("Another way"))}: ${esc(tr(REP_NAMES[way.rep] || "another picture"))}</h2>${frameBox(way.frames)}</div>`;
  }

  show(current);
  return { show, go };
}
