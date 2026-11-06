// Try: a fresh problem like the one just seen, solved by the learner. The strategy ladder moves through attention,
// relationship, representation, a guided first step and—only after two attempts—an explanation. Using any rung makes
// the answer "with help", which never counts as
// independent: the learner is asked for a new problem on their own. Nothing here changes the lab's mastery
// evidence; it only feeds the local Studio record that decides how much support to offer next.
import { pick } from "./core.js";
import { diagnose, lessonFor } from "./engines.js";
import { record } from "./adaptive.js";
import { generateProblem, seededRandom, validateAnswer } from "../problem-bank.js";
import { t } from "../i18n.js";

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function mountTry(ctx, root) {
  let item = null;
  let lesson = null;
  let rungs = 0;
  let attempts = 0;
  let solved = false;
  let independentMode = ctx.tryNeedsIndependent;
  const fresh = () => {
    const rng = seededRandom((Date.now() + (ctx.tryCount += 1) * 977) >>> 0);
    for (let n = 0; n < 12; n += 1) {
      const next = generateProblem(ctx.skill, rng);
      if (next.question !== ctx.item.question && next.question !== item?.question) {
        item = next;
        break;
      }
      item = next;
    }
    lesson = lessonFor(item);
    rungs = 0;
    attempts = 0;
    solved = false;
    render();
  };

  function render() {
    const hints = lesson ? lesson.engine.hints(lesson.spec) : [];
    const helpOpen = independentMode ? attempts > 0 : ctx.level >= 1 || attempts > 0;
    root.innerHTML = `
      <p class="sd-task"><span class="sd-tag">${esc(t("Try"))}</span> ${esc(independentMode ? t("A new one, on your own.") : t("A new problem like it."))}</p>
      <p class="sd-problem" data-problem>${esc(item.question)}</p>
      <form class="sd-answer" data-form novalidate>
        <label for="sd-ans-${ctx.id}" class="sd-sr">${esc(t("Your answer"))}</label>
        <input id="sd-ans-${ctx.id}" class="sd-input" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" ${solved ? "disabled" : ""} />
        <button type="submit" class="sd-btn sd-primary" ${solved ? "disabled" : ""}>${esc(t("Check"))}</button>
      </form>
      <p class="sd-feedback" data-feedback role="status" aria-live="polite"></p>
      <div class="sd-ladder" data-ladder>${helpOpen && !solved ? ladder(hintStages(hints)) : !solved ? `<button type="button" class="sd-btn sd-ghost" data-help>${esc(t("I want a hint"))}</button>` : ""}</div>
      <div class="sd-actions" data-actions></div>`;
    root.querySelector("input")?.focus();
  }

  function hintStages(hints) {
    const picture = hints.find((hint) => hint.frame) || hints[1] || hints[0];
    return [
      { name: t("Hint 1: notice"), ...hints[0] },
      { name: t("Hint 2: a relationship"), ...(hints[1] || hints[0]) },
      {
        name: t("Hint 3: a representation"),
        text: t("Open the model and connect the quantities to the picture."),
        frame: picture?.frame,
        model: true,
      },
      { name: t("Hint 4: a first step"), ...(hints[2] || hints.at(-1) || hints[0]) },
      {
        name: t("Hint 5: explain and reconnect"),
        text: item.explanation || t("Use the model and the relationship together, then try a new problem on your own."),
        final: true,
      },
    ];
  }

  function ladder(stages) {
    return `<p class="sd-ladder-title">${esc(t("Need help? Go one step at a time."))}</p><ol class="sd-rungs">${stages.map((h, k) => {
      if (k < rungs) {
        return `<li class="sd-rung on"><strong>${esc(h.name)}</strong><p>${esc(pick(h.text, ctx.lang()))}</p>${h.frame ? `<div class="sd-mini" aria-hidden="false">${h.frame.svg}</div>` : ""}${h.model ? `<button type="button" class="sd-btn" data-show>${esc(t("Open this problem in the model"))}</button>` : ""}${k === 3 ? `<p class="sd-cont">${esc(t("Now you take it from here."))}</p>` : ""}</li>`;
      }
      const locked = k > rungs || (stages[k].final && attempts < 2);
      const why = stages[k].final && attempts < 2 ? ` <span>${esc(t("Try twice before opening the full explanation."))}</span>` : "";
      return `<li class="sd-rung"><button type="button" class="sd-btn" data-rung="${k}" ${locked ? "disabled" : ""}>${esc(stages[k].name)}${why}</button></li>`;
    }).join("")}</ol>`;
  }

  function check(text) {
    if (!text.trim()) return void (root.querySelector("[data-feedback]").textContent = t("Type an answer first."));
    attempts += 1;
    const supported = rungs > 0 || attempts > 1;
    const ok = validateAnswer(text, item);
    const fb = root.querySelector("[data-feedback]");
    if (ok) {
      solved = true;
      record(ctx.key, { kind: "try", ok: true, supported });
      ctx.mark("solve");
      if (!supported) {
        ctx.indep += 1;
        if (ctx.indep >= 2) ctx.mark("challenge");
      }
      fb.textContent = supported ? t("Correct, with help. Now show it on your own with a new one.") : t("Correct, on your own.");
      fb.className = "sd-feedback sd-right";
      root.querySelector("[data-ladder]").innerHTML = "";
      root.querySelector("input").disabled = true;
      root.querySelector('[data-form] button').disabled = true;
      root.querySelector("[data-actions]").innerHTML = `<button type="button" class="sd-btn sd-primary" data-new="${supported ? "independent" : "more"}">${esc(supported ? t("Try a new one on my own") : t("Another one"))}</button>`;
      ctx.refreshRail();
      return;
    }
    const hit = lesson ? diagnose(lesson, text) : null;
    record(ctx.key, { kind: "try", ok: false, supported: rungs > 0, tag: hit?.id || null });
    fb.className = "sd-feedback sd-wrong";
    fb.textContent = hit ? `${t("Not quite.")} ${pick(hit.label, ctx.lang())}. ${pick(hit.tip, ctx.lang())}` : t("Not quite. Look at the model, then try again.");
    root.querySelector("[data-actions]").innerHTML = `<button type="button" class="sd-btn" data-show>${esc(t("Show me in the model"))}</button>`;
    ctx.refreshRail();
    if (independentMode) {
      independentMode = false;
      root.querySelector("[data-ladder]").innerHTML = ladder(hintStages(lesson ? lesson.engine.hints(lesson.spec) : []));
    } else if (root.querySelector("[data-ladder] .sd-rung")) {
      // Re-render after each attempt so the final explanation unlocks exactly after the second try.
      root.querySelector("[data-ladder]").innerHTML = ladder(hintStages(lesson ? lesson.engine.hints(lesson.spec) : []));
    }
    root.querySelector("input").select();
  }

  root.addEventListener("submit", (e) => {
    e.preventDefault();
    check(root.querySelector("input").value);
  });
  root.addEventListener("click", (e) => {
    const rung = e.target.closest("[data-rung]");
    if (rung) {
      rungs = Math.max(rungs, Number(rung.dataset.rung) + 1);
      const stages = hintStages(lesson.engine.hints(lesson.spec));
      root.querySelector("[data-ladder]").innerHTML = ladder(stages);
      ctx.say(pick(stages[rungs - 1].text, ctx.lang()));
      return;
    }
    if (e.target.closest("[data-help]")) {
      root.querySelector("[data-ladder]").innerHTML = ladder(hintStages(lesson.engine.hints(lesson.spec)));
      return;
    }
    const nw = e.target.closest("[data-new]");
    if (nw) {
      independentMode = nw.dataset.new === "independent";
      fresh();
      return;
    }
    if (e.target.closest("[data-show]")) ctx.showModel(item);
  });
  fresh();
  return () => {};
}
