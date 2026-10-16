// Our Class Investigation — pieces every unit tool shares.

import { h } from "./dom.js";
import { pick, tr } from "./i18n.js";
import { numericFields } from "./templates.js";

export const MIN_DOTS = { u3: 1, u4: 1, u7: 1, u9: 6, u2: 8 };
export const NEED_KEY = {
  u3: "needPairs",
  u4: "needCategories",
  u7: "needPairs",
  u9: "needPairs",
  u2: "needNumbers",
};

export const short = (field, lang) => pick(field.short, lang);

/** A labelled <select>. */
export function chooser(id, label, options, current, onChange) {
  const select = h(
    "select",
    { id, class: "ci-select", onchange: (e) => onChange(e.target.value) },
    options.map((o) =>
      h("option", { value: o.value, selected: o.value === current ? true : null, text: o.label }),
    ),
  );
  select.value = current;
  return h("div", { class: "ci-chooser" }, h("label", { for: id, text: label }), select);
}

export const pairsOf = (entries, fx, fy) =>
  entries
    .filter((e) => typeof e.v[fx] === "number" && typeof e.v[fy] === "number")
    .map((e) => ({ x: e.v[fx], y: e.v[fy], mine: e.mine, id: e.id }));
export const valuesOf = (entries, f) =>
  entries.filter((e) => typeof e.v[f] === "number").map((e) => e.v[f]);

const isWhole = (x) => Math.abs(x - Math.round(x)) < 1e-9;
/** Smallest of 2, 10, 100, 1000 that turns both decimals into whole numbers. */
export const wholeFactor = (a, b) =>
  [2, 10, 100, 1000].find((k) => isWhole(a * k) && isWhole(b * k)) ?? 10;

/** A tool that cannot run yet says so instead of throwing. */
export const notEnough = (lang, n, have) =>
  h("p", { class: "ci-note", text: tr("needMore", lang, { n, have }) });

export function svgBox(markup) {
  const box = h("div", { class: "ci-chartbox" });
  box.innerHTML = markup;
  return box;
}

export function xyChoosers(ctx, s, again, prefix) {
  const nums = numericFields(ctx.fields);
  s.x ??= nums[0].id;
  s.y ??= nums[1].id;
  const opts = nums.map((f) => ({ value: f.id, label: short(f, ctx.lang) }));
  const set = (key) => (value) => {
    s[key] = value;
    if (s.x === s.y) s[key === "x" ? "y" : "x"] = nums.find((f) => f.id !== value).id;
    s.k = 0;
    again();
  };
  return {
    fx: nums.find((f) => f.id === s.x),
    fy: nums.find((f) => f.id === s.y),
    row: h("div", { class: "ci-row ci-wrapnarrow" }, [
      chooser(`${prefix}-x`, tr("xVar", ctx.lang), opts, s.x, set("x")),
      chooser(`${prefix}-y`, tr("yVar", ctx.lang), opts, s.y, set("y")),
    ]),
  };
}
