// Math Mistake Detective: a worked solution with one flawed step (from the lab's own mistake bank, so every
// flaw is re-derived by the bank's tests). Find the first wrong step, name the slip, pick the repair, watch the
// model show the right way when one exists, then do a second case on your own. Wrong guesses are explained by
// the bank's own notes and none of them state the right answer.
import { lessonFor } from "./engines.js";
import { mountWatch } from "./panel-watch.js";
import { record } from "./adaptive.js";
import { buildWorkItem } from "../mistake-bank.js";
import { slipInfo } from "../mistake-notes.js";
import { t } from "../i18n.js";

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function detectiveFor(skill, seed) {
  if (skill.grade < 1) return null;
  try {
    return buildWorkItem(skill, seed);
  } catch {
    return null;
  }
}

export function mountDetective(ctx, root) {
  let round = 1;
  let item = detectiveFor(ctx.skill, ctx.seed);
  let phase = "find";
  let missed = false;
  let note = "";
  let nope = -1;
  let cleanup = null;

  const lines = () => item.steps.map((s, i) => `<li><button type="button" class="sd-step${nope === i ? " nope" : ""}${phase !== "find" && i === item.bad ? " pick" : ""}" data-pick="${i}" ${phase === "find" ? "" : "disabled"}><b>${i + 1}</b> ${item.mode === "expr" && i > 0 ? "= " : ""}${esc(s)}</button></li>`).join("");

  function render() {
    cleanup?.();
    const n = item.bad + 1;
    const ask = phase === "find" ? t("A student solved this. Tap the first step that went wrong.") : phase === "cause" ? t("What went wrong in step {n}?", { n }) : phase === "fix" ? t("Which version of step {n} puts it right?", { n }) : "";
    const choices = phase === "cause" ? item.slips.map((id) => `<button type="button" class="sd-btn" data-slip="${id}">${esc(slipInfo(id).label)}</button>`).join("") : phase === "fix" ? item.fixes.map((f, k) => `<button type="button" class="sd-btn" data-fix="${k}">${esc(f)}</button>`).join("") : "";
    root.innerHTML = `
      <p class="sd-task"><span class="sd-tag">${esc(t("Detective"))}</span> ${esc(t("Case {a} of 2", { a: round }))}</p>
      <p class="sd-problem">${esc(item.start)}</p>
      <ol class="sd-steps">${lines()}</ol>
      <p class="sd-ask" role="status" aria-live="polite">${esc(ask)}</p>
      <p class="sd-note" data-note role="status" aria-live="polite">${esc(note)}</p>
      <div class="sd-choices">${choices}</div>
      <div data-vis></div>
      <div class="sd-actions" data-act></div>`;
    if (phase === "show") visual();
    if (phase === "done") finish();
  }

  function visual() {
    const lesson = item.mode === "expr" ? lessonFor({ question: `${item.start} = ?`, steps: [] }) : null;
    const box = root.querySelector("[data-vis]");
    root.querySelector(".sd-ask").textContent = t("Here is the right step.");
    if (lesson?.modeled) {
      box.innerHTML = `<div class="sd-subplayer" data-sub></div>`;
      cleanup = mountWatch({ ...ctx, lesson, rep: undefined, say: ctx.say, mark: () => {} }, box.querySelector("[data-sub]"));
    }
    root.querySelector("[data-act]").innerHTML = `<button type="button" class="sd-btn sd-primary" data-next>${esc(round === 1 ? t("Solve a similar case") : t("Finish"))}</button>`;
  }

  function finish() {
    root.querySelector("[data-act]").innerHTML = `<p class="sd-feedback sd-right">${esc(t("Case closed. You found the slip and fixed it."))}</p>`;
  }

  root.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-pick]");
    const slip = e.target.closest("[data-slip]");
    const fix = e.target.closest("[data-fix]");
    if (pick && phase === "find") {
      if (Number(pick.dataset.pick) === item.bad) {
        phase = "cause";
        nope = -1;
        note = t("Yes, that is where it goes wrong.");
      } else {
        missed = true;
        nope = Number(pick.dataset.pick);
        note = t("That step follows from the one before it. Check the others.");
      }
      return render();
    }
    if (slip) {
      if (slip.dataset.slip === item.slip) {
        phase = "fix";
        note = slipInfo(item.slip).note;
      } else {
        missed = true;
        note = t("Not that one. Compare step {n} with the step before it.", { n: item.bad + 1 });
      }
      return render();
    }
    if (fix) {
      if (item.fixes[Number(fix.dataset.fix)] === item.fix) {
        record(ctx.key, { kind: "detective", ok: !missed, supported: false, tag: item.slip });
        phase = "show";
        note = t("Yes. That repair keeps the value the same.");
      } else {
        missed = true;
        note = t("That repair changes the value. Try another.");
      }
      return render();
    }
    if (e.target.closest("[data-next]")) {
      if (round === 2) {
        phase = "done";
        return render();
      }
      round = 2;
      const next = detectiveFor(ctx.skill, ctx.seed + 7);
      if (next) item = next;
      phase = "find";
      missed = false;
      note = "";
      nope = -1;
      render();
    }
  });
  if (!item) return null;
  render();
  return () => cleanup?.();
}
