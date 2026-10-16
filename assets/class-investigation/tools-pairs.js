// Our Class Investigation — the tools that need TWO measurements from each dot.
//   Unit 3  ratio and unit rate
//   Unit 7  read an ordered pair off the scatter plot; plot class points yourself
//   Unit 9  does one measurement go up with the other? predict from the dots

import { scatterSvg } from "./charts.js";
import { h } from "./dom.js";
import { pick, tr } from "./i18n.js";
import { sortedCopy } from "./stats.js";
import { taskPanel } from "./task-panel.js";
import { numericFields } from "./templates.js";
import {
  chooser,
  MIN_DOTS,
  notEnough,
  pairsOf,
  short,
  svgBox,
  wholeFactor,
  xyChoosers,
} from "./tool-kit.js";
import * as U from "./unit-tasks.js";

export function toolRatio(ctx, snap, s, again) {
  const { lang } = ctx;
  const nums = numericFields(ctx.fields);
  s.a ??= nums[0].id;
  s.b ??= nums[1].id;
  s.k ??= 0;
  const fa = nums.find((f) => f.id === s.a);
  const fb = nums.find((f) => f.id === s.b);
  const pairs = pairsOf(snap, fa.id, fb.id);
  const options = nums.map((f) => ({ value: f.id, label: short(f, lang) }));
  const pick2 = (key) => (value) => {
    s[key] = value;
    if (s.a === s.b) s[key === "a" ? "b" : "a"] = nums.find((f) => f.id !== value).id;
    s.k = 0;
    again();
  };
  if (!pairs.length) return notEnough(lang, 1, 0);
  const pair = pairs[s.k % pairs.length];
  const [av, bv] = [pair.x, pair.y];
  const [la, lb] = [short(fa, lang), short(fb, lang)];
  const vars = { a: la, b: lb, av, bv, n: (s.k % pairs.length) + 1 };
  return h(
    "div",
    {},
    h("div", { class: "ci-row ci-wrapnarrow" }, [
      chooser("ci-u3-a", `${tr("chooseVar", lang)} (1)`, options, s.a, pick2("a")),
      chooser("ci-u3-b", `${tr("chooseVar", lang)} (2)`, options, s.b, pick2("b")),
    ]),
    h("p", { class: "ci-dotline" }, [
      h("strong", { text: tr("dotNumber", lang, { n: (s.k % pairs.length) + 1 }) }),
      ` · ${la} = ${av} ${pick(fa.unit, lang)} · ${lb} = ${bv} ${pick(fb.unit, lang)} `,
      h("button", {
        type: "button",
        class: "ci-btn ci-btn-quiet",
        text: tr("u7_another", lang),
        onclick: () => {
          s.k++;
          again();
        },
      }),
    ]),
    taskPanel(
      {
        id: `u3-ratio-${s.a}-${s.b}-${s.k}`,
        question: tr("u3_ratioQ", lang, vars),
        inputs: [
          { key: "p", label: tr("u3_ratioPart1", lang), step: 1 },
          { key: "q", label: tr("u3_ratioPart2", lang), step: 1 },
        ],
        check: (ans) => U.checkRatio(av, bv, ans),
        say: (code, stage) => {
          if (code === "equivalent") return { key: "u3_ratio_equivalent", kind: "hint" };
          if (code === "flipped") return { key: "u3_ratio_flipped", vars, kind: "hint" };
          if (code === "invalid") return { key: "errNumber", kind: "hint" };
          if (stage <= 1) return { key: "u3_ratio_wrong1", vars, kind: "hint" };
          const whole = Number.isInteger(av) && Number.isInteger(bv);
          return whole
            ? { key: "u3_ratio_wrong2int", vars, kind: "hint" }
            : { key: "u3_ratio_wrong2", vars: { k: wholeFactor(av, bv) }, kind: "hint" };
        },
      },
      lang,
    ),
    taskPanel(
      {
        id: `u3-rate-${s.a}-${s.b}-${s.k}`,
        question: tr("u3_rateQ", lang, vars),
        inputs: [{ key: "rate", label: tr("u3_rateLabel", lang, vars), step: "any" }],
        check: (ans) => U.checkUnitRate(av, bv, ans.rate),
        say: (code, stage) => {
          if (code === "flipped") return { key: "u3_rate_flipped", vars, kind: "hint" };
          if (code === "invalid") return { key: "errNumber", kind: "hint" };
          return { key: stage <= 1 ? "u3_rate_wrong1" : "u3_rate_wrong2", vars, kind: "hint" };
        },
      },
      lang,
    ),
  );
}

export function toolCoordinates(ctx, snap, s, again) {
  const { lang } = ctx;
  s.k ??= 0;
  const { fx, fy, row } = xyChoosers(ctx, s, again, "ci-u7");
  const pairs = pairsOf(snap, fx.id, fy.id);
  if (!pairs.length) return notEnough(lang, 1, 0);
  const idx = s.k % pairs.length;
  const target = pairs[idx];
  const plotHost = h("div", { class: "ci-plothost" });
  const plotNote = h("p", { class: "ci-note", role: "status", "aria-live": "polite" });
  const plotBtn = h("button", {
    type: "button",
    class: "ci-btn",
    text: tr("u7_plotTitle", lang),
    onclick: async () => {
      plotBtn.disabled = true;
      const engine = await ctx.engine();
      const five = pairs.slice(0, 5).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
      if (!engine || five.length < 2) {
        plotNote.textContent = tr("u7_plotUnavailable", lang);
        plotBtn.disabled = false;
        return;
      }
      plotNote.textContent = "";
      plotHost.replaceChildren();
      engine.renderCoordinatePlot(plotHost, {
        title: tr("u7_plotTitle", lang),
        points: five,
        max: Math.ceil(Math.max(...five.flatMap((p) => [p.x, p.y]))) + 1,
      });
    },
  });
  return h(
    "div",
    {},
    row,
    svgBox(
      scatterSvg(pairs, {
        xLabel: short(fx, lang),
        yLabel: short(fy, lang),
        xUnit: pick(fx.unit, lang),
        yUnit: pick(fy.unit, lang),
        lang,
        target: idx,
      }),
    ),
    taskPanel(
      {
        id: `u7-${s.x}-${s.y}-${idx}`,
        question: tr("u7_readQ", lang),
        inputs: [
          { key: "x", label: tr("u7_x", lang), step: "any" },
          { key: "y", label: tr("u7_y", lang), step: "any" },
        ],
        check: (ans) => U.checkReadPoint(target, ans),
        say: (code, stage) => {
          if (code === "swapped") return { key: "u7_swapped", kind: "hint" };
          return { key: stage <= 1 ? "u7_wrong1" : "u7_wrong2", kind: "hint" };
        },
      },
      lang,
    ),
    h("button", {
      type: "button",
      class: "ci-btn ci-btn-quiet",
      text: tr("u7_another", lang),
      onclick: () => {
        s.k++;
        again();
      },
    }),
    h("p", { class: "ci-small", text: tr("u7_plotHelp", lang) }),
    plotBtn,
    plotNote,
    plotHost,
  );
}

export function toolRelationship(ctx, snap, s, again) {
  const { lang } = ctx;
  const { fx, fy, row } = xyChoosers(ctx, s, again, "ci-u9");
  const pairs = pairsOf(snap, fx.id, fy.id);
  if (pairs.length < MIN_DOTS.u9) return notEnough(lang, MIN_DOTS.u9, pairs.length);
  const xs = pairs.map((p) => p.x);
  // A fair x to ask about: the data's middle, rounded to the field's own step.
  const midX =
    Math.round(sortedCopy(xs)[Math.floor(xs.length / 2)] / (fx.step ?? 1)) * (fx.step ?? 1);
  const vars = { x: short(fx, lang), y: short(fy, lang), xv: midX, xu: pick(fx.unit, lang) };
  const ringHost = h("div", { class: "ci-chartbox" });
  const draw = (ringed = []) => {
    ringHost.innerHTML = scatterSvg(pairs, {
      xLabel: short(fx, lang),
      yLabel: short(fy, lang),
      xUnit: pick(fx.unit, lang),
      yUnit: pick(fy.unit, lang),
      lang,
      ringed,
    });
  };
  draw();
  const trendLabel = { up: "u9_up", down: "u9_down", none: "u9_none" };
  return h(
    "div",
    {},
    row,
    ringHost,
    taskPanel(
      {
        id: `u9-trend-${s.x}-${s.y}`,
        question: tr("u9_trendQ", lang, vars),
        choices: Object.entries(trendLabel).map(([value, key]) => ({
          value,
          label: tr(key, lang),
        })),
        check: (ans) => U.checkTrend(pairs, ans),
        say: (code, stage) => {
          if (code === "close") return { key: "u9_close", kind: "close" };
          return { key: stage <= 1 ? "u9_trend_wrong1" : "u9_trend_wrong2", kind: "hint" };
        },
      },
      lang,
    ),
    taskPanel(
      {
        id: `u9-pred-${s.x}-${s.y}`,
        question: tr("u9_predictQ", lang, vars),
        inputs: [{ key: "y", label: short(fy, lang), step: "any" }],
        check: (ans) => U.checkPrediction(pairs, midX, ans.y, fy.step ?? 0.5),
        onCorrect: () => draw(),
        say: (code, stage) => {
          if (stage >= 2) {
            const near = U.nearestPairs(pairs, midX);
            draw(near.map((p) => pairs.indexOf(p)));
            return { key: "u9_pred_hint2", vars, kind: "hint" };
          }
          if (code === "low") return { key: "u9_pred_low", vars, kind: "hint" };
          if (code === "high") return { key: "u9_pred_high", vars, kind: "hint" };
          return { key: "errNumber", kind: "hint" };
        },
      },
      lang,
    ),
  );
}
