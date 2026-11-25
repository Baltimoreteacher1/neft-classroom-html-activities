// Card: a titled surface. With `href` the whole card is one link target (the title link stretches over the
// card), so there is exactly one tab stop per card. Heading level is chosen by the caller.
import { cx, h, headingTag, uid } from "./h.js";

/**
 * createCard({ title, headingLevel, href, body, meta, footer, tone })
 * body / meta / footer: string | Node | array of them.
 */
export function createCard({ title, headingLevel = 3, href, body, meta, footer, tone } = {}) {
  if (!title) throw new Error("createCard: title is required");
  const id = uid("ui-card");
  const heading = h(
    headingTag(headingLevel),
    { class: "ui-card__title", id },
    href ? h("a", { class: "ui-card__link", href }, title) : title,
  );
  return h(
    "article",
    {
      class: cx("ui-card", href && "ui-card--link", tone && `ui-card--${tone}`),
      "aria-labelledby": id,
    },
    h(
      "header",
      { class: "ui-card__head" },
      heading,
      meta ? h("div", { class: "ui-card__meta" }, meta) : null,
    ),
    body ? h("div", { class: "ui-card__body" }, body) : null,
    footer ? h("footer", { class: "ui-card__foot" }, footer) : null,
  );
}
