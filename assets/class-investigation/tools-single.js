// Our Class Investigation — the tools that work on ONE measurement or category.
//   Unit 4  the percent of the class in a category
//   Unit 2  center, spread and shape of the whole dataset (taught last)

import { barSvg, histogramSvg } from "./charts.js";
import { h } from "./dom.js";
import { pick, tr } from "./i18n.js";
import { countBy, fmt, niceBins, sortedCopy } from "./stats.js";
import { taskPanel } from "./task-panel.js";
import { choiceFields, numericFields } from "./templates.js";
import { chooser, MIN_DOTS, short, svgBox, valuesOf } from "./tool-kit.js";
import * as U from "./unit-tasks.js";

export function toolPercent(ctx, snap, s, again) {
  const { lang } = ctx;
  const field = choiceFields(ctx.fields)[0];
  const counts = countBy(snap.map((e) => e.v[field.id]).filter((v) => typeof v === "string"));
  const bars = field.choices.map((c) => ({
    id: c.id,
    label: pick(c.label, lang),
    n: counts[c.id] || 0,
  }));
  const whole = bars.reduce((a, b) => a + b.n, 0);
  s.cat ??= (bars.find((b) => b.n > 0) ?? bars[0]).id;
  const chosen = bars.find((b) => b.id === s.cat);
  const vars = { cat: chosen.label, part: chosen.n, whole };
  return h(
    "div",
    {},
    svgBox(barSvg(bars, { label: pick(field.label, lang), lang })),
    chooser(
      "ci-u4-cat",
      tr("chooseCat", lang),
      bars.map((b) => ({ value: b.id, label: b.label })),
      s.cat,
      (v) => {
        s.cat = v;
        again();
      },
    ),
    taskPanel(
      {
        id: `u4-${s.cat}-${whole}`,
        question: tr("u4_q", lang, vars),
        inputs: [{ key: "percent", label: tr("u4_unit", lang), step: "any" }],
        check: (ans) => U.checkPercent(chosen.n, whole, ans.percent),
        say: (code, stage) => {
          if (code === "count") return { key: "u4_count", kind: "hint" };
          if (code === "decimal") return { key: "u4_decimal", kind: "hint" };
          if (code === "invalid") return { key: "errNumber", kind: "hint" };
          return { key: stage <= 1 ? "u4_wrong1" : "u4_wrong2", vars, kind: "hint" };
        },
      },
      lang,
    ),
  );
}

export function toolStatistics(ctx, snap, s, again) {
  const { lang } = ctx;
  const nums = numericFields(ctx.fields);
  s.f ??= nums[0].id;
  const field = nums.find((f) => f.id === s.f);
  const values = valuesOf(snap, field.id);
  const sorted = sortedCopy(values);
  const n = values.length;
  const points = snap
    .filter((e) => typeof e.v[field.id] === "number")
    .map((e) => ({ v: e.v[field.id], mine: e.mine }));
  if (n < MIN_DOTS.u2)
    return h("p", { class: "ci-note", text: tr("u2_needMore", lang, { have: n }) });
  const sortedBox = h("p", { class: "ci-sorted", hidden: true, "aria-live": "polite" });
  const buildHost = h("div", { class: "ci-plothost" });
  const buildNote = h("p", { class: "ci-note", role: "status", "aria-live": "polite" });

  const stat = (kind) => {
    const hints = {
      median: (stage) =>
        stage <= 1
          ? { key: "u2_median_wrong1", kind: "hint" }
          : n % 2
            ? { key: "u2_median_wrong2odd", vars: { n, pos: (n + 1) / 2 }, kind: "hint" }
            : { key: "u2_median_wrong2even", vars: { n, a: n / 2, b: n / 2 + 1 }, kind: "hint" },
      mean: (stage) =>
        stage <= 1
          ? { key: "u2_mean_wrong1", kind: "hint" }
          : { key: "u2_mean_wrong2", vars: { n }, kind: "hint" },
      range: (stage) => ({ key: stage <= 1 ? "u2_range_wrong1" : "u2_range_wrong2", kind: "hint" }),
      iqr: (stage) =>
        stage <= 1
          ? { key: "u2_iqr_wrong1", kind: "hint" }
          : {
              key: "u2_iqr_wrong2",
              vars: { m: Math.floor(n / 2), mid: n % 2 ? tr("u2_iqr_mid", lang) : "" },
              kind: "hint",
            },
    };
    return taskPanel(
      {
        id: `u2-${kind}-${field.id}-${n}`,
        question: tr(`u2_${kind}`, lang),
        inputs: [{ key: "value", label: tr(`u2_${kind}_label`, lang), step: "any" }],
        check: (ans) => U.checkStat(kind, values, ans.value),
        say: (code, stage) =>
          code === "invalid" ? { key: "errNumber", kind: "hint" } : hints[kind](stage),
      },
      lang,
    );
  };

  const builder = (key, run) =>
    h("button", {
      type: "button",
      class: "ci-btn ci-btn-quiet",
      text: tr(key, lang),
      onclick: async () => {
        const engine = await ctx.engine();
        buildHost.replaceChildren();
        if (!engine) {
          buildNote.textContent = tr("u2_buildUnavailable", lang);
          return;
        }
        buildNote.textContent = "";
        run(engine);
      },
    });
  const binning = niceBins(values);

  return h(
    "div",
    {},
    h("p", { class: "ci-note", text: tr("u2_intro", lang) }),
    chooser(
      "ci-u2-f",
      tr("u2_choose", lang),
      nums.map((f) => ({ value: f.id, label: short(f, lang) })),
      s.f,
      (v) => {
        s.f = v;
        again();
      },
    ),
    svgBox(histogramSvg(points, { label: short(field, lang), unit: pick(field.unit, lang), lang })),
    h("div", { class: "ci-row" }, [
      h("button", {
        type: "button",
        class: "ci-btn ci-btn-quiet",
        text: tr("sortBtn", lang),
        onclick: () => {
          sortedBox.hidden = false;
          sortedBox.textContent = `${tr("sortedList", lang)} ${sorted.map((v) => fmt(v)).join(", ")}`;
        },
      }),
    ]),
    sortedBox,
    stat("median"),
    stat("mean"),
    stat("range"),
    stat("iqr"),
    taskPanel(
      {
        id: `u2-shape-${field.id}-${n}`,
        question: tr("u2_shapeQ", lang),
        choices: ["balanced", "low", "high"].map((value) => ({
          value,
          label: tr(`u2_${value}`, lang),
        })),
        check: (ans) => U.checkShape(values, ans),
        say: (code, stage) => {
          if (code === "close") return { key: "u2_shape_close", kind: "close" };
          return { key: stage <= 1 ? "u2_shape_wrong1" : "u2_shape_wrong2", kind: "hint" };
        },
      },
      lang,
    ),
    h("h4", { text: tr("u2_build", lang) }),
    h("p", { class: "ci-small", text: tr("u2_buildIntro", lang) }),
    h("div", { class: "ci-row" }, [
      builder("u2_buildHist", (engine) =>
        engine.renderHistogramBuilder(buildHost, {
          data: values,
          binWidth: binning.width,
          start: binning.start,
          unit: pick(field.unit, lang),
          presets: [],
        }),
      ),
      builder("u2_buildBox", (engine) =>
        engine.renderBoxPlotBuilder(buildHost, { data: values, unit: pick(field.unit, lang) }),
      ),
    ]),
    buildNote,
    buildHost,
  );
}
