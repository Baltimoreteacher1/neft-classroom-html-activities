// Help shown while the learner has NOT yet earned the answer (a miss on the first try, or "Show a step").
// It carries the steps up to the cap `peekCap` allows and a button that opens the model with THIS problem's
// numbers. It never renders a worked solution, a final-answer panel, or a model that computes the result:
// those belong to the finished-problem card in app.js.
import { t } from "./i18n.js";
import { drawerSeed } from "./problem-numbers.js";
import { peekCap, stepLeaks } from "./step-leak.js";
import { stepPlayer } from "./step-player.js";

const esc = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** True while the item's answer has not been earned or given up on: only safe help may show. */
export const answerStillHidden = (item, done) => Boolean(item && item.answers && !done);

export function liveHelpHtml(item, copy) {
  const cap = peekCap(item);
  const steps = cap > 0 ? stepPlayer(item, { cap }) : "";
  const note = String(copy || "");
  const hint = item.hint && item.hint !== note && !stepLeaks(item.hint, item) ? item.hint : "";
  const tool = drawerSeed(item).tool;
  const open = tool
    ? `<div class="student-expl-tool-callout"><button type="button" class="expl-tool-launcher" data-open-tool="${esc(tool)}"><span>🧮</span> ${esc(t("Open the model with my numbers"))}</button></div>`
    : "";
  return `<div class="student-expl-card live-help">
    ${note ? `<p class="student-expl-goal">${esc(note)}</p>` : ""}
    ${steps}
    ${!steps && hint ? `<div class="student-expl-tip"><strong>💡</strong> ${esc(hint)}</div>` : ""}
    ${open}
  </div>`;
}
