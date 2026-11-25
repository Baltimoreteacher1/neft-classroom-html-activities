// Button: <button> (or <a> when href is given). Keyboard comes from the native element: Enter and Space on a
// button, Enter on a link. Variants: primary, secondary, quiet, danger. Pass `pressed` for a toggle button.
import { cx, h } from "./h.js";

export const BUTTON_VARIANTS = Object.freeze(["primary", "secondary", "quiet", "danger"]);

/**
 * createButton({ label, variant, type, href, disabled, pressed, onClick, describedBy, block })
 * A toggle (pressed is a boolean) flips aria-pressed before onClick runs and passes the new state.
 */
export function createButton({
  label,
  variant = "primary",
  type = "button",
  href,
  disabled = false,
  pressed,
  onClick,
  describedBy,
  block = false,
} = {}) {
  if (!label) throw new Error("createButton: label is required");
  if (!BUTTON_VARIANTS.includes(variant))
    throw new Error(`createButton: unknown variant "${variant}"`);
  const cls = cx("ui-btn", `ui-btn--${variant}`, block && "ui-btn--block");
  const el = href
    ? h("a", { class: cls, href, "aria-describedby": describedBy }, label)
    : h("button", { class: cls, type, disabled, "aria-describedby": describedBy }, label);
  if (typeof pressed === "boolean") {
    el.setAttribute("aria-pressed", String(pressed));
    el.addEventListener("click", () => {
      el.setAttribute("aria-pressed", String(el.getAttribute("aria-pressed") !== "true"));
    });
  }
  if (onClick)
    el.addEventListener("click", () => onClick(el.getAttribute("aria-pressed") === "true", el));
  return el;
}
