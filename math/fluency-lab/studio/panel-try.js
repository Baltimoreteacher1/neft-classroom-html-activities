// Try: a fresh problem like the one just seen, solved by the learner. The strategy ladder moves through attention,
// relationship, representation, a guided first step and—only after two attempts—an explanation. Using any rung makes
// the answer "with help", which never counts as
// independent: the learner is asked for a new problem on their own. Nothing here changes the lab's mastery
// evidence; it only feeds the local Studio record that decides how much support to offer next.
import { L, pick } from "./core.js";
import { diagnose, lessonFor } from "./engines.js";
import { record } from "./adaptive.js";
import { generateProblem, seededRandom, validateAnswer } from "../problem-bank.js";
import { t } from "../i18n.js";
import { createRatioExplanationUrl } from "../../../shared/math-language-bridge/v1.js";
import { createPercentExplanationUrl } from "../../../shared/math-language-bridge/v2.js";
import { createFractionExplanationUrl } from "../../../shared/math-language-bridge/v2.js";
import { createFractionNumberLineExplanationUrl } from "../../../shared/math-language-bridge/v2.js";
import { createDataExplanationUrl } from "../../../shared/math-language-bridge/v2.js";
import { createSurfaceAreaExplanationUrl } from "../../../shared/math-language-bridge/v2.js";
import { createPyramidSurfaceAreaExplanationUrl } from "../../../shared/math-language-bridge/v2.js";
import { vocabMarkup } from "./vocab-content.js";

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function mountTry(ctx, root) {
  const restored = ctx.trySession?.skillKey === ctx.key ? ctx.trySession : null;
  let item = restored?.item || null;
  let lesson = item ? lessonFor(item) : null;
  let rungs = restored?.rungs || 0;
  let attempts = restored?.attempts || 0;
  let solved = restored?.solved || false;
  let independentMode = restored?.independentMode ?? ctx.tryNeedsIndependent;
  let helpShown = restored?.helpShown || false;

  function saveSession({ returnNotice = false } = {}) {
    if (!item) return;
    ctx.trySession = {
      skillKey: ctx.key,
      item,
      rungs,
      attempts,
      solved,
      independentMode,
      helpShown,
      answer: root.querySelector("[data-form] input")?.value || "",
      feedbackText: root.querySelector("[data-feedback]")?.textContent || "",
      feedbackClass: root.querySelector("[data-feedback]")?.className || "sd-feedback",
      actionsHtml: root.querySelector("[data-actions]")?.innerHTML || "",
      returnNotice: returnNotice || Boolean(ctx.trySession?.returnNotice),
    };
    ctx.onTrySessionChange?.(ctx.trySession);
  }

  const fresh = () => {
    ctx.trySession = null;
    ctx.onTrySessionChange?.(null);
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
    helpShown = false;
    render();
  };

  function render() {
    const hints = lesson ? lesson.engine.hints(lesson.spec) : [];
    const helpOpen = independentMode ? attempts > 0 : ctx.level >= 1 || attempts > 0 || helpShown;
    root.innerHTML = `
      <p class="sd-task"><span class="sd-tag">${esc(t("Try"))}</span> ${esc(independentMode ? t("A new one, on your own.") : t("A new problem like it."))}</p>
      <p class="sd-problem" data-problem>${vocabMarkup(item.question)}</p>
      <form class="sd-answer" data-form novalidate>
        <label for="sd-ans-${ctx.id}" class="sd-sr">${esc(t("Your answer"))}</label>
        <input id="sd-ans-${ctx.id}" class="sd-input" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" ${solved ? "disabled" : ""} />
        <button type="submit" class="sd-btn sd-primary" ${solved ? "disabled" : ""}>${esc(t("Check"))}</button>
      </form>
      <p class="sd-feedback" data-feedback role="status" aria-live="polite"></p>
      <p class="sd-strategy-note" data-strategy-note role="status" ${restored?.returnNotice ? "" : "hidden"}>${esc(t("Your problem and response stay here while you view the model. Return to Try when you’re ready."))}</p>
      <div class="sd-ladder" data-ladder>${helpOpen && !solved ? ladder(hintStages(hints)) : !solved ? `<button type="button" class="sd-btn sd-ghost" data-help>${esc(t("I want a hint"))}</button>` : ""}</div>
      <div class="sd-actions" data-actions></div>`;
    const saved = ctx.trySession?.skillKey === ctx.key ? ctx.trySession : null;
    const input = root.querySelector("[data-form] input");
    if (saved) {
      input.value = saved.answer || "";
      const feedback = root.querySelector("[data-feedback]");
      feedback.innerHTML = vocabMarkup(saved.feedbackText || "");
      feedback.className = saved.feedbackClass || "sd-feedback";
      root.querySelector("[data-actions]").innerHTML = saved.actionsHtml || "";
    }
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
        return `<li class="sd-rung on"><strong>${esc(h.name)}</strong><p>${vocabMarkup(pick(h.text, ctx.lang()))}</p>${h.frame ? `<div class="sd-mini" aria-hidden="false">${h.frame.svg}</div>` : ""}${h.model ? `<button type="button" class="sd-btn" data-show>${esc(t("Try another way: open the model"))}</button>` : ""}${k === 3 ? `<p class="sd-cont">${esc(t("Now you take it from here."))}</p>` : ""}</li>`;
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
      fb.innerHTML = vocabMarkup(supported ? t("Correct, with help. Now show it on your own with a new one.") : t("Correct, on your own."));
      fb.className = "sd-feedback sd-right";
      root.querySelector("[data-ladder]").innerHTML = "";
      root.querySelector("input").disabled = true;
      root.querySelector('[data-form] button').disabled = true;
      const next = `<button type="button" class="sd-btn sd-primary" data-new="${supported ? "independent" : "more"}">${esc(supported ? t("Try a new one on my own") : t("Another one"))}</button>`;
      const base = lesson?.spec?.kind === "ratio" ? lesson.spec.base : null;
      const percentBridge =
        lesson?.engine?.id === "ratio" && lesson.spec.kind === "percent" ? lesson.spec : null;
      const fractionBridge = lesson?.engine?.id === "fracmul" && lesson.spec.mode === "of" ? lesson.spec : null;
      const fractionLineBridge = lesson?.engine?.id === "fraction" && lesson.spec.mode === "lineMark" ? lesson.spec : null;
      const dataBridge = lesson?.engine?.id === "expr" && ["mean", "median"].includes(lesson.spec.mode) ? lesson.spec : null;
      const surfaceAreaBridge = lesson?.engine?.id === "geo" && lesson.spec.mode === "surfaceNet" ? lesson.spec : null;
      const grade = Number(ctx.skill.grade) || 6;
      let bridgeUrl = null;
      let bridgeTask = "ratio";
      try {
        if (
          fractionLineBridge &&
          Number.isInteger(fractionLineBridge.numerator) &&
          Number.isInteger(fractionLineBridge.denominator) &&
          grade >= 3 &&
          grade <= 8
        ) {
          bridgeUrl = createFractionNumberLineExplanationUrl({
            numerator: fractionLineBridge.numerator,
            denominator: fractionLineBridge.denominator,
            grade,
          });
          bridgeTask = "fractionLine";
        } else if (
          Array.isArray(base) &&
          base.length === 2 &&
          base.every((n) => Number.isInteger(n) && n >= 1 && n <= 12) &&
          grade >= 6 &&
          grade <= 8
        ) {
          bridgeUrl = createRatioExplanationUrl({ first: base[0], second: base[1], grade });
        } else if (
          percentBridge &&
          Number.isInteger(percentBridge.target?.v) &&
          Number.isInteger(percentBridge.base?.[1]) &&
          grade >= 4 &&
          grade <= 8
        ) {
          bridgeUrl = createPercentExplanationUrl({
            percent: percentBridge.target.v,
            whole: percentBridge.base[1],
            grade,
          });
          bridgeTask = "percent";
        } else if (
          fractionBridge &&
          Number.isInteger(fractionBridge.a) &&
          Number.isInteger(fractionBridge.b) &&
          Number.isInteger(fractionBridge.n) &&
          grade >= 3 &&
          grade <= 8
        ) {
          bridgeUrl = createFractionExplanationUrl({
            numerator: fractionBridge.a,
            denominator: fractionBridge.b,
            whole: fractionBridge.n,
            grade,
          });
          bridgeTask = "fraction";
        } else if (
          surfaceAreaBridge?.solid === "square-pyramid" &&
          Number.isInteger(surfaceAreaBridge.side) && surfaceAreaBridge.side >= 1 && surfaceAreaBridge.side <= 20 &&
          Number.isInteger(surfaceAreaBridge.triangleHeight) && surfaceAreaBridge.triangleHeight >= 1 && surfaceAreaBridge.triangleHeight <= 20 &&
          grade >= 4 && grade <= 8
        ) {
          bridgeUrl = createPyramidSurfaceAreaExplanationUrl({
            side: surfaceAreaBridge.side,
            triangleHeight: surfaceAreaBridge.triangleHeight,
            unit: surfaceAreaBridge.unit === "in" ? "in" : "cm",
            grade,
          });
          bridgeTask = "surfaceArea";
        } else if (
          surfaceAreaBridge?.solid === "rectangular-prism" &&
          [surfaceAreaBridge.l, surfaceAreaBridge.w, surfaceAreaBridge.h].every((n) => Number.isInteger(n) && n >= 1 && n <= 20) &&
          grade >= 4 && grade <= 8
        ) {
          bridgeUrl = createSurfaceAreaExplanationUrl({
            length: surfaceAreaBridge.l,
            width: surfaceAreaBridge.w,
            height: surfaceAreaBridge.h,
            unit: surfaceAreaBridge.unit === "in" ? "in" : "cm",
            grade,
          });
          bridgeTask = "surfaceArea";
        } else if (
          dataBridge &&
          Array.isArray(dataBridge.list) &&
          dataBridge.list.length >= 4 &&
          dataBridge.list.length <= 9 &&
          dataBridge.list.every((n) => Number.isInteger(n) && n >= 0 && n <= 40) &&
          grade >= 6 &&
          grade <= 8
        ) {
          bridgeUrl = createDataExplanationUrl({ values: dataBridge.list, grade });
          bridgeTask = "data";
        }
      } catch {
        // Some generated values do not have a bounded exact transfer task; omit the optional bridge.
      }
      const bridgeLabels = {
        ratio: L("Explain this ratio in The Language Page", "Explica esta razón en The Language Page"),
        percent: L("Explain this percent model in The Language Page", "Explica este modelo de porcentaje en The Language Page"),
        fraction: L("Explain this fraction model in The Language Page", "Explica este modelo de fracción en The Language Page"),
        fractionLine: L("Explain this number-line fraction in The Language Page", "Explica esta fracción en la recta numérica en The Language Page"),
        data: L("Explain this data investigation in The Language Page", "Explica esta investigación de datos en The Language Page"),
        surfaceArea: L("Explain this surface-area model in The Language Page", "Explica este modelo de área de superficie en The Language Page"),
      };
      const bridge = bridgeUrl
        ? `<div class="sd-math-language-bridge"><a class="sd-btn" href="${bridgeUrl}">${esc(pick(bridgeLabels[bridgeTask], ctx.lang()))}</a><p>${esc(pick(L("Only the math task and grade travel with this optional link. Your name, response, and progress stay here.", "Este enlace opcional solo comparte la tarea matemática y el grado. Tu nombre, respuesta y progreso se quedan aquí."), ctx.lang()))}</p></div>`
        : "";
      root.querySelector("[data-actions]").innerHTML = `${next}${bridge}`;
      ctx.refreshRail();
      saveSession();
      return;
    }
    const hit = lesson ? diagnose(lesson, text) : null;
    record(ctx.key, { kind: "try", ok: false, supported: rungs > 0, tag: hit?.id || null });
    fb.className = "sd-feedback sd-wrong";
    fb.innerHTML = vocabMarkup(hit ? `${t("Not quite.")} ${pick(hit.label, ctx.lang())}. ${pick(hit.tip, ctx.lang())}` : t("Not quite. Look at the model, then try again."));
    root.querySelector("[data-actions]").innerHTML = `<button type="button" class="sd-btn" data-show>${esc(t("Try another way: show the model"))}</button>`;
    ctx.refreshRail();
    if (independentMode) {
      independentMode = false;
      root.querySelector("[data-ladder]").innerHTML = ladder(hintStages(lesson ? lesson.engine.hints(lesson.spec) : []));
    } else if (root.querySelector("[data-ladder] .sd-rung")) {
      // Re-render after each attempt so the final explanation unlocks exactly after the second try.
      root.querySelector("[data-ladder]").innerHTML = ladder(hintStages(lesson ? lesson.engine.hints(lesson.spec) : []));
    }
    root.querySelector("input").select();
    saveSession();
  }

  root.addEventListener("submit", (e) => {
    e.preventDefault();
    check(root.querySelector("input").value);
  });
  root.addEventListener("input", (e) => {
    if (e.target.matches("[data-form] input")) saveSession();
  });
  root.addEventListener("click", (e) => {
    const rung = e.target.closest("[data-rung]");
    if (rung) {
      helpShown = true;
      rungs = Math.max(rungs, Number(rung.dataset.rung) + 1);
      const stages = hintStages(lesson.engine.hints(lesson.spec));
      root.querySelector("[data-ladder]").innerHTML = ladder(stages);
      ctx.say(pick(stages[rungs - 1].text, ctx.lang()));
      saveSession();
      return;
    }
    if (e.target.closest("[data-help]")) {
      helpShown = true;
      root.querySelector("[data-ladder]").innerHTML = ladder(hintStages(lesson.engine.hints(lesson.spec)));
      saveSession();
      return;
    }
    const nw = e.target.closest("[data-new]");
    if (nw) {
      independentMode = nw.dataset.new === "independent";
      fresh();
      return;
    }
    if (e.target.closest("[data-show]")) {
      saveSession({ returnNotice: true });
      ctx.showModel(item);
    }
  });
  root.addEventListener("input", (e) => {
    if (e.target.matches(".sd-input")) saveSession();
  });
  if (restored) render();
  else fresh();
  return () => {};
}
