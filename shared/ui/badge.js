// Badge: a short status label. Tone is never colour alone: every tone has its own mark shape (circle, square,
// diamond, triangle, ring) and an optional visually-hidden prefix for screen readers. Badges are not
// interactive, so the 44px target rule does not apply to them.
import { cx, h } from "./h.js";

export const BADGE_TONES = Object.freeze(["neutral", "info", "success", "warn", "error"]);

/** createBadge({ label, tone, srPrefix }) -> <span class="ui-badge"> */
export function createBadge({ label, tone = "neutral", srPrefix } = {}) {
  if (!label) throw new Error("createBadge: label is required");
  if (!BADGE_TONES.includes(tone)) throw new Error(`createBadge: unknown tone "${tone}"`);
  return h(
    "span",
    { class: cx("ui-badge", `ui-badge--${tone}`) },
    h("span", { class: "ui-badge__mark", "aria-hidden": "true" }),
    srPrefix ? h("span", { class: "ui-sr-only" }, `${srPrefix}: `) : null,
    label,
  );
}
