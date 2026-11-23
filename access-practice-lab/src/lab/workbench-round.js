// The glue between one workbench and a game module: a "workbench round" is { kind: "workbench", id, wb, rs }.
// The workbench check decides ok / not ok; the engine's judge() keeps the standard miss -> hint -> revise -> reveal
// loop and does the reporting. The report carries only `languageErrorTag` (an ID or null), never the learner's text.
import {
  feedbackHTML,
  hintHTML,
  html,
  judge,
  newRound,
  settled,
  takeHint,
} from "../games/engine.js";
import { init, modelSentence, assemble, reduce, reportedTag, solution } from "./workbench.js";
import { actionFromEl, mountWorkbench, wbHTML, wbHints, wbRetry, wbWhy } from "./workbench-ui.js";

export const isBench = (r) => r?.kind === "workbench";
export const benchRound = (id, spec, band) => ({
  kind: "workbench",
  id,
  wb: init(spec, { band }),
  rs: newRound(),
});
export { mountWorkbench as benchMount };

/** Handle a click for a workbench round. Returns true when state changed. */
export function benchClick(b, r, env, { skill = "writing" } = {}) {
  if (settled(r.rs)) return false;
  if (b.hasAttribute("data-g-hint")) return takeHint(r.rs, env) >= 0;
  const action = actionFromEl(b);
  if (!action) return false;
  const next = reduce(r.wb, action);
  if (next === r.wb) return false;
  r.wb = next;
  if (action.type === "check") {
    judge(r.rs, next.last.ok, env, {
      id: r.id,
      skill,
      extra: { kind: "workbench", languageErrorTag: reportedTag(next) },
    });
    if (r.rs.status === "retry") r.wb = reduce(r.wb, { type: "revise" });
  }
  return true;
}

/** Markup for a workbench round: the workbench, the hint ladder and the standard feedback. */
export function benchView(r, env) {
  const I = env.I;
  const locked = settled(r.rs);
  return html`${wbHTML(r.wb, env, { locked })}
  ${locked ? "" : hintHTML(r.rs, wbHints(r.wb, I), env)}
  ${feedbackHTML(r.rs, {
    I,
    right: I.T("Your sentence works.", "Tu oración funciona."),
    retry: wbRetry(r.wb, I),
    answer: html`${I.T("One sentence that works:", "Una oración que funciona:")}
      <span lang="en">${modelSentence(r.wb)}</span>`,
    explain: wbWhy(r.wb, I),
  })}`;
}

/** The QA step: the whole correct route (or a deliberately under-built one) up to the check, or the next-station click. */
export function benchPlan(r, { wrong } = {}) {
  if (settled(r.rs)) return [{ click: "[data-g-next]" }];
  const sol = solution(r.wb);
  const acts = [];
  let s = r.wb;
  const go = (sel, action) => {
    const n = reduce(s, action);
    if (n === s) return;
    acts.push({ click: sel });
    s = n;
  };
  if (s.step === "check" && s.last && !s.last.ok) go("[data-wb-revise]", { type: "revise" });
  if (s.step === "base") go("[data-wb-next]", { type: "next" });
  if (s.step === "expand") {
    if (!wrong)
      for (const { slot, id } of sol.adds)
        if (!s.adds[slot].includes(id))
          go(`[data-wb-add="${slot}:${id}"]`, { type: "toggle", slot, id });
    go("[data-wb-next]", { type: "next" });
  }
  if (s.step === "combine") {
    go(`[data-wb-conn="${wrong ? sol.wrongConn : sol.conn}"]`, {
      type: "conn",
      id: wrong ? sol.wrongConn : sol.conn,
    });
    go(`[data-wb-join="${sol.joiner}"]`, { type: "joiner", id: sol.joiner });
    go("[data-wb-next]", { type: "next" });
  }
  if (s.step === "check") go("[data-wb-check]", { type: "check" });
  return acts;
}

/** The learner's sentence for the final screen (kept in state only; never reported). */
export const benchSentence = (r) => assemble(r.wb);
