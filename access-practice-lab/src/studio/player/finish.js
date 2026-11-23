// The finish screen: what the student did, in words. No score, no rank, no comparison with anyone.

import { questionsOf } from "../core/schema.js";
import { glyph } from "./icons.js";
import { h, plainText, rt } from "./util.js";

const WAYS = {
  first: { key: "wayFirst", icon: "star" },
  revised: { key: "wayRevised", icon: "check" },
  review: { key: "wayReview", icon: "list" },
  shown: { key: "wayShown", icon: "bulb" },
  tried: { key: "wayTried", icon: "flag" },
};

function wayOf(rec) {
  if (!rec || (!rec.attempts && !rec.done)) return "tried";
  if (rec.shown) return "shown";
  if (rec.final === "review") return "review";
  if (rec.first === "correct") return "first";
  if (rec.final === "correct") return "revised";
  return "tried";
}

export function renderFinish(stage, ctx, { onAgain, onBack, reported }) {
  const questions = questionsOf(ctx.activity);
  const rows = questions.map((q) => ({ q, rec: ctx.session.get(q), way: wayOf(ctx.session.get(q)) }));
  const count = (way) => rows.filter((r) => r.way === way).length;
  const hints = rows.reduce((n, r) => n + r.rec.hints, 0);
  const title = h("h2", { class: "sp-finish-title", tabindex: "-1" }, ctx.t("finishTitle"));
  const summary = h("ul", { class: "sp-finish-sum" });
  for (const way of ["first", "revised", "review", "shown"]) {
    if (!count(way)) continue;
    summary.append(h("li", null, glyph(WAYS[way].icon, 18), h("span", null, ctx.t(`${WAYS[way].key}Count`, { n: count(way) }))));
  }
  if (hints) summary.append(h("li", null, glyph("bulb", 18), h("span", null, ctx.t("hintsUsed", { n: hints }))));
  const list = h("ol", { class: "sp-finish-list" });
  rows.forEach(({ q, rec, way }) => {
    const li = h(
      "li",
      { class: `sp-finish-item way-${way}` },
      rt("span", "sp-finish-q", q.prompt),
      h("span", { class: "sp-finish-way" }, glyph(WAYS[way].icon, 16), ctx.t(WAYS[way].key), rec.hints ? ` · ${ctx.t("hintsN", { n: rec.hints })}` : ""),
    );
    li.querySelector(".sp-finish-q").setAttribute("title", plainText(q.prompt));
    list.append(li);
  });
  const again = h("button", { type: "button", class: "sp-btn sp-btn-primary" }, glyph("undo", 18), ctx.msg("tryAgain"));
  again.addEventListener("click", onAgain);
  const actions = h("div", { class: "sp-actions" }, again);
  if (onBack) {
    const back = h("button", { type: "button", class: "sp-btn sp-btn-quiet" }, ctx.msg("backToGame"));
    back.addEventListener("click", onBack);
    actions.prepend(back);
  }
  stage.replaceChildren(
    h(
      "section",
      { class: "sp-finish", "aria-labelledby": "sp-finish-h" },
      title,
      h("p", { class: "sp-finish-lead" }, ctx.t("finishLead")),
      summary,
      rows.length ? list : null,
      reported ? h("p", { class: "sp-note-small" }, ctx.t("reportNote")) : null,
      actions,
    ),
  );
  title.id = "sp-finish-h";
  ctx.focus(title);
}
