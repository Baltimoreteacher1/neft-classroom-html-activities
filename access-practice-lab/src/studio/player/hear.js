// The "Read aloud" button. It speaks with the device voice and says so; with no voice it shows a plain message.

import { icon } from "./icons.js";
import { h } from "./util.js";

/** @param {object} ctx the player context  @param {string} text what to speak  @param {string} label accessible name */
export function hearButton(ctx, text, label) {
  const btn = h(
    "button",
    { type: "button", class: "sp-btn sp-btn-quiet sp-hear", "aria-pressed": "false", "aria-label": label },
    icon("speaker", 18),
    h("span", null, ctx.t("hear")),
  );
  const done = () => btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", () => {
    if (btn.getAttribute("aria-pressed") === "true") {
      ctx.speaker.stop();
      done();
      return;
    }
    if (ctx.speaker.speak(text, done)) btn.setAttribute("aria-pressed", "true");
    else ctx.notice(ctx.t("noSpeech"));
  });
  return btn;
}
