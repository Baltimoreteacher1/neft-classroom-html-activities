// The game frame: pause / resume and the choice of mechanic from activity.template. The mechanics only consume
// questions through the same widgets and check.js as every other kind. No timers, no scores that rank.

import { glyph } from "./icons.js";
import { mountMatch } from "./game-match.js";
import { mountPuzzle } from "./game-puzzle.js";
import { mountQuest } from "./game-quest.js";
import { mountStrategy } from "./game-strategy.js";
import { h } from "./util.js";

const MECHANICS = { quest: mountQuest, match: mountMatch, puzzle: mountPuzzle, strategy: mountStrategy };

export function mountGame(stage, ctx, { onFinish }) {
  const area = h("div", { class: "sp-game-area" });
  const pausedCard = h(
    "div",
    { class: "sp-paused", hidden: true },
    h("h2", { tabindex: "-1" }, ctx.t("paused")),
    h("p", null, ctx.t("pausedBody")),
  );
  const resume = h("button", { type: "button", class: "sp-btn sp-btn-primary" }, glyph("play", 18), ctx.msg("resume"));
  pausedCard.append(resume);
  const pause = h("button", { type: "button", class: "sp-btn sp-btn-quiet", "aria-pressed": "false" }, glyph("pause", 18), ctx.msg("pause"));
  const frame = h(
    "div",
    { class: `sp-game sp-game-${ctx.activity.template}` },
    h("div", { class: "sp-game-bar" }, pause),
    area,
    pausedCard,
  );
  stage.replaceChildren(frame);

  const setPaused = (on) => {
    frame.dataset.paused = on ? "true" : "false";
    pause.setAttribute("aria-pressed", String(on));
    area.hidden = on;
    pausedCard.hidden = !on;
    (on ? resume : pause).focus();
  };
  pause.addEventListener("click", () => setPaused(frame.dataset.paused !== "true"));
  resume.addEventListener("click", () => setPaused(false));

  const mount = MECHANICS[ctx.activity.template] || mountQuest;
  const mech = mount(area, ctx, { onFinish });
  return {
    goto: (id) => mech.goto?.(id) ?? false,
    destroy: () => mech.destroy?.(),
  };
}
