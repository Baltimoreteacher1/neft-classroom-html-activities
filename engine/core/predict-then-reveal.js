/**
 * predict-then-reveal.js — make the student commit before the tool computes.
 *
 * Measured 2026-08-31 by driving the shipped widgets in a browser: of 32
 * interactive placements walked across 18 lessons, 8 gave the student any
 * right/wrong signal. The other 24 are not broken — they are RICH. Type a ratio
 * into the Ratio Table Lab and it fills the whole table, computes the unit rate,
 * and writes the sentence explaining it. The percent grid names the pattern in
 * its own button: "🔎 Reveal the forms". The student supplies a number and the
 * tool does the reasoning.
 *
 * That is the giveaway shape this repo already refuses elsewhere — a scaffold
 * that hands over the answer is not a scaffold. So: ask first. The tool does not
 * mount until the student has committed a prediction; then it mounts as the
 * REVEAL, and its caption becomes the explanation of a commitment rather than a
 * substitute for one. Ordering is what makes this safe — 16 of 23 bar-chart
 * captions already print the total or the max, so a question asked beside the
 * chart would be answered by the chart. Asked instead of it, it cannot be.
 *
 * TWO RULES, both about not inventing mathematics:
 *
 *   1. A deriver returns null unless the answer is CERTAIN from the config it
 *      was handed. area-morph knows a parallelogram, a triangle and a trapezoid;
 *      it does not know what a "composite" or a "polygon" figure is made of, so
 *      those get no gate at all rather than a guessed area. No gate is always a
 *      valid outcome — it is the shipped behaviour today.
 *   2. Every deriver is proven against EVERY real config of its kind in the
 *      repo by tools/predict-then-reveal.test.mjs, which recomputes the answer
 *      independently. A wrong answer here is worse than no question: it teaches
 *      the error in the student's own voice.
 *
 * Notice & Wonder is excluded (`.nw-card`). Judging a noticing routine breaks
 * it, and renderNoticeAndWonder already refuses to print its context above the
 * image for the same reason — telling students what to see before they look.
 */

/* ── number formatting ────────────────────────────────────────────────────── */

/** 16.400000000000002 is not a number a sixth grader should ever be shown. */
function tidy(n) {
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n * 1e6) / 1e6;
  return Number.isInteger(r) ? String(r) : String(Number(r.toFixed(2)));
}

const money = (n, prefix) => (prefix ? prefix + tidy(n) : tidy(n));

/* ── choice ordering ──────────────────────────────────────────────────────── */

/**
 * Position the correct answer by a stable hash of the question rather than by
 * habit or by Math.random. Habit is the documented failure: a fleet audit found
 * the correct choice sitting at A in ~90% of 1,426 multiple-choice items, which
 * teaches position instead of mathematics. A hash keeps it varied across
 * placements AND identical on every render of the same one, so a student who
 * reloads sees the same card and save/resume has nothing to reconcile.
 */
function stableIndex(seed, count) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % count;
}

function orderChoices(correct, distractors, seed) {
  const others = distractors.filter((d) => d !== null && d !== correct);
  const unique = [...new Set(others)].slice(0, 3);
  const at = stableIndex(seed, unique.length + 1);
  const out = [...unique];
  out.splice(at, 0, correct);
  return { choices: out, answerIndex: at };
}

/* ── derivers ─────────────────────────────────────────────────────────────── */

/**
 * Each returns { prompt, choices, answerIndex, because } or null.
 * `because` is stated AFTER the student answers — it names the method, never
 * just the number, so a wrong answer still leaves them with the reasoning.
 */
const DERIVERS = {
  /**
   * Rectangular prism. Distractors are the two errors this actually draws:
   * adding the edges instead of multiplying, and multiplying only the base.
   */
  "prism-volume": (cfg) => {
    const { l, w, h } = cfg;
    if (![l, w, h].every((v) => typeof v === "number" && Number.isFinite(v) && v > 0)) return null;
    const u = cfg.unit ? ` ${cfg.unit}` : "";
    const correct = tidy(l * w * h);
    return {
      prompt: `Before you build it — a prism is ${tidy(l)}${u} by ${tidy(w)}${u} by ${tidy(h)}${u}. What is its volume?`,
      ...orderChoices(
        correct,
        [tidy(l + w + h), tidy(l * w), tidy(2 * (l * w + l * h + w * h))],
        `prism:${l}:${w}:${h}`,
      ),
      because: `Volume is length × width × height: ${tidy(l)} × ${tidy(w)} × ${tidy(h)} = ${correct}.`,
      unit: cfg.unit ? `${cfg.unit}³` : "",
    };
  },

  /**
   * Area. Only the three figures whose formula is fully determined by the
   * config — composite and polygon are deliberately absent, see rule 1.
   */
  "area-morph": (cfg) => {
    const { figure, b, h, a } = cfg;
    const u = cfg.unit ? ` ${cfg.unit}` : "";
    const num = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
    if (!num(b) || !num(h)) return null;

    if (figure === "parallelogram") {
      const correct = tidy(b * h);
      return {
        prompt: `Before you see it — a parallelogram has base ${tidy(b)}${u} and height ${tidy(h)}${u}. What is its area?`,
        ...orderChoices(
          correct,
          [tidy((b * h) / 2), tidy(2 * (b + h)), tidy(b + h)],
          `par:${b}:${h}`,
        ),
        because: `A parallelogram is base × height: ${tidy(b)} × ${tidy(h)} = ${correct}. Halving is the triangle rule, not this one.`,
        unit: cfg.unit ? `${cfg.unit}²` : "",
      };
    }
    if (figure === "triangle") {
      const correct = tidy((b * h) / 2);
      return {
        prompt: `Before you see it — a triangle has base ${tidy(b)}${u} and height ${tidy(h)}${u}. What is its area?`,
        ...orderChoices(correct, [tidy(b * h), tidy(b + h), tidy(2 * b * h)], `tri:${b}:${h}`),
        because: `A triangle is half of the rectangle around it: ${tidy(b)} × ${tidy(h)} ÷ 2 = ${correct}.`,
        unit: cfg.unit ? `${cfg.unit}²` : "",
      };
    }
    if (figure === "trapezoid" && num(a)) {
      const correct = tidy(((a + b) / 2) * h);
      return {
        prompt: `Before you see it — a trapezoid has parallel sides ${tidy(a)}${u} and ${tidy(b)}${u}, and height ${tidy(h)}${u}. What is its area?`,
        ...orderChoices(
          correct,
          [tidy((a + b) * h), tidy(b * h), tidy((a * b) / 2)],
          `trap:${a}:${b}:${h}`,
        ),
        because: `Average the two parallel sides, then multiply by the height: (${tidy(a)} + ${tidy(b)}) ÷ 2 × ${tidy(h)} = ${correct}.`,
        unit: cfg.unit ? `${cfg.unit}²` : "",
      };
    }
    return null; // composite, polygon — the config does not determine the area
  },

  /**
   * Proportional line y = kx. Asks at x = 4 rather than x = 1, because at 1 the
   * answer is the rate itself and the student can answer without multiplying.
   */
  "line-grapher": (cfg) => {
    const k = cfg.kDefault;
    if (typeof k !== "number" || !Number.isFinite(k) || k <= 0) return null;
    const xName = String(cfg.xName || "").trim();
    const yName = String(cfg.yName || "").trim();
    const kName = String(cfg.kName || "").trim();
    if (!xName || !yName || !kName) return null;
    const x = 4;
    const p = cfg.yPrefix || "";
    const correct = money(k * x, p);
    return {
      prompt: `Before you graph it — at ${tidy(k)} ${kName}, how many ${yName} for ${x} ${xName}?`,
      ...orderChoices(
        correct,
        [money(k + x, p), money(k * x * 2, p), money(k * (x - 1), p)],
        `line:${k}:${xName}:${yName}`,
      ),
      because: `A proportional relationship multiplies: ${tidy(k)} × ${x} = ${correct}. Adding the rate to the count is the common slip.`,
      unit: "",
    };
  },

  /**
   * A bar chart's data is the thing being revealed, so the question cannot be
   * about values the student cannot see yet. It asks for the SHAPE — which is a
   * real prediction, checkable exactly against the data, and the reason a chart
   * is worth looking at at all.
   */
  "bar-chart": (cfg) => {
    const bars = Array.isArray(cfg.bars) ? cfg.bars : [];
    const vals = bars
      .map((b) => (b && typeof b.value === "number" ? b.value : null))
      .filter((v) => v !== null && Number.isFinite(v));
    // Two bars is not a trend, it is a comparison — and "which one is bigger?"
    // is the entire reason a two-bar chart exists. Certain from the values, so
    // it gets a card of its own shape rather than no card.
    if (vals.length === 2) {
      const [x, y] = vals;
      if (x === y) return null; // nothing to predict
      const labels = bars.map((b) => String(b?.label || "").trim());
      if (!labels[0] || !labels[1] || labels[0] === labels[1]) return null;
      const correct = x > y ? labels[0] : labels[1];
      return {
        prompt: `Before you look — which do you predict is greater: ${labels[0]} or ${labels[1]}?`,
        ...orderChoices(correct, [x > y ? labels[1] : labels[0]], `two:${labels[0]}:${x}:${y}`),
        because: `${correct} is greater — ${tidy(Math.max(x, y))} against ${tidy(Math.min(x, y))}.`,
        unit: "",
      };
    }
    if (vals.length < 3) return null;

    const rising = vals.every((v, i) => i === 0 || v > vals[i - 1]);
    const falling = vals.every((v, i) => i === 0 || v < vals[i - 1]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    // "About the same" has to be a statement about spread relative to size, not
    // an absolute gap: 74..82 riders is flat, 74..82 pencils is not.
    const flat = mean > 0 && (max - min) / mean <= 0.15;

    const CLIMB = "They climb steadily";
    const FALL = "They fall steadily";
    const SAME = "They are all about the same";
    const MIXED = "They go up and down with no steady pattern";
    let correct;
    if (rising) correct = CLIMB;
    else if (falling) correct = FALL;
    else if (flat) correct = SAME;
    else correct = MIXED;

    const because =
      correct === CLIMB
        ? "Every bar is taller than the one before it — that steady climb is the pattern."
        : correct === FALL
          ? "Every bar is shorter than the one before it — that steady fall is the pattern."
          : correct === SAME
            ? `The bars stay close together (${tidy(min)} to ${tidy(max)}), so no one category stands out.`
            : `The bars rise and fall (${tidy(min)} to ${tidy(max)}) without a steady direction.`;

    const all = [CLIMB, FALL, SAME, MIXED].filter((c) => c !== correct);
    return {
      prompt: `Before you look — what do you expect these bars to do?`,
      ...orderChoices(correct, all, `bars:${vals.join(",")}`),
      because,
      unit: "",
    };
  },
};

/**
 * An AUTHORED question, written into the lesson config as `predict`.
 *
 * Derivers only reach the tools whose mathematics their config determines. A
 * ratio-table-builder carries nothing but a label — the student supplies the
 * ratio — so no deriver can ask it anything, and the only honest way to gate it
 * is for a person to write the question.
 *
 * The shape is deliberately `mstarPractice`'s, field for field: stem, choices,
 * correctIndex, explanation, choiceFeedback. That is the idiom the curriculum
 * already writes assessment items in, so authoring one of these is a thing
 * somebody already knows how to do, and choiceFeedback lets a wrong answer be
 * answered specifically rather than with one line for all three.
 */
function authoredPrediction(cfg) {
  const a = cfg && cfg.predict;
  if (!a || typeof a !== "object") return null;
  const stem = typeof a.stem === "string" ? a.stem.trim() : "";
  const choices = Array.isArray(a.choices) ? a.choices.map(String) : [];
  const i = a.correctIndex;
  if (!stem || choices.length < 2) return null;
  if (!Number.isInteger(i) || i < 0 || i >= choices.length) return null;
  if (new Set(choices).size !== choices.length) return null;
  const fb = Array.isArray(a.choiceFeedback) ? a.choiceFeedback : [];
  return {
    prompt: stem,
    choices,
    answerIndex: i,
    because: String(a.explanation || "").trim(),
    // Per-choice coaching when it was written; the explanation otherwise.
    feedbackFor: (picked) => {
      const one = typeof fb[picked] === "string" ? fb[picked].trim() : "";
      return one || String(a.explanation || "").trim();
    },
    unit: "",
  };
}

/**
 * `manip` is a wrapper: the real tool is `cfg.manip`, and its problem — when it
 * has one — lives in `cfg.attrs`. Most of them have none. coord-plot and
 * number-line carry only a canvas `range`, and algebra-tiles only a variable
 * name and a starting value, so there is no question in the config to ask. Those
 * get no card, which is the point of rule 1.
 */
const MANIP_DERIVERS = {
  // base and percent are both given, so the answer is determined.
  "percent-bar": (at) => {
    const base = at.base;
    const pct = at.percent;
    if (![base, pct].every((v) => typeof v === "number" && Number.isFinite(v))) return null;
    if (base <= 0 || pct <= 0) return null;
    const correct = tidy((pct / 100) * base);
    return {
      stem: `Before you shade it — what is ${tidy(pct)}% of ${tidy(base)}?`,
      correct,
      distractors: [tidy(base - (pct / 100) * base), tidy(pct), tidy(base / pct)],
      because: `${tidy(pct)}% means ${tidy(pct)} out of every 100, so multiply: ${tidy(base)} × ${tidy(pct)}/100 = ${correct}.`,
      seed: `pct:${base}:${pct}`,
    };
  },
  // A ratio with both parts named: scaling it is the whole task.
  "ratio-build": (at) => {
    const a = at["default-a"];
    const b = at["default-b"];
    const la = String(at["label-a"] || "").trim();
    const lb = String(at["label-b"] || "").trim();
    if (![a, b].every((v) => typeof v === "number" && Number.isFinite(v) && v > 0)) return null;
    if (!la || !lb) return null;
    const f = 3;
    const correct = tidy(b * f);
    return {
      stem: `Before you build it — the ratio is ${tidy(a)} ${la} to ${tidy(b)} ${lb}. For ${tidy(a * f)} ${la}, how many ${lb}?`,
      correct,
      distractors: [tidy(b + f), tidy(b + (a * f - a)), tidy(a * f)],
      because: `Both parts scale by the same factor. ${tidy(a)} × ${f} = ${tidy(a * f)}, so ${tidy(b)} × ${f} = ${correct}. Adding the factor to one part instead of multiplying both is the slip to watch.`,
      seed: `rb:${a}:${b}:${la}`,
    };
  },
  // Two fractions drawn side by side; whether they match is decidable.
  "fraction-bar": (at) => {
    const pa = at["parts-a"];
    const sa = at["shaded-a"];
    const pb = at["parts-b"];
    const sb = at["shaded-b"];
    if (![pa, sa, pb, sb].every((v) => typeof v === "number" && Number.isFinite(v))) return null;
    if (pa <= 0 || pb <= 0) return null;
    const same = sa / pa === sb / pb;
    const correct = same ? "They cover the same amount" : "They cover different amounts";
    return {
      stem: `Before you compare them — does ${sa}/${pa} cover the same amount of the bar as ${sb}/${pb}?`,
      correct,
      distractors: [same ? "They cover different amounts" : "They cover the same amount"],
      because: same
        ? `${sa}/${pa} and ${sb}/${pb} are equivalent — more pieces, but each piece is smaller, so the shaded amount is the same.`
        : `${sa}/${pa} and ${sb}/${pb} are not equivalent: ${tidy(sa / pa)} against ${tidy(sb / pb)}.`,
      seed: `fb:${sa}:${pa}:${sb}:${pb}`,
    };
  },
  // A rectangle with a rectangular notch removed — subtract the two areas.
  "composite-split": (at) => {
    const { w, h } = at;
    const nw = at["notch-w"];
    const nh = at["notch-h"];
    if (![w, h, nw, nh].every((v) => typeof v === "number" && Number.isFinite(v) && v > 0))
      return null;
    const correct = tidy(w * h - nw * nh);
    return {
      stem: `Before you split it — a ${tidy(w)} by ${tidy(h)} rectangle has a ${tidy(nw)} by ${tidy(nh)} corner removed. What area is left?`,
      correct,
      distractors: [tidy(w * h), tidy(nw * nh), tidy(w * h + nw * nh)],
      because: `Find the whole rectangle, then take away the notch: ${tidy(w)} × ${tidy(h)} = ${tidy(w * h)}, minus ${tidy(nw)} × ${tidy(nh)} = ${tidy(nw * nh)}, leaves ${correct}.`,
      seed: `cs:${w}:${h}:${nw}:${nh}`,
    };
  },
  // ax + b with every part named and a starting value for x.
  "expr-machine": (at) => {
    const a = at["default-a"];
    const x = at["default-x"];
    const b = at["default-b"];
    if (![a, x, b].every((v) => typeof v === "number" && Number.isFinite(v))) return null;
    const coef = String(at["coef-name"] || "").trim();
    const vn = String(at["var-name"] || "").trim();
    const cn = String(at["const-name"] || "").trim();
    if (!coef || !vn || !cn) return null;
    const correct = tidy(a * x + b);
    return {
      stem: `Before you run it — at ${tidy(a)} ${coef} for ${tidy(x)} ${vn}, plus a ${tidy(b)} ${cn}, what is the total?`,
      correct,
      distractors: [tidy((a + b) * x), tidy(a * x), tidy(a + x + b)],
      because: `Multiply before you add: ${tidy(a)} × ${tidy(x)} = ${tidy(a * x)}, then add the ${cn} of ${tidy(b)} to get ${correct}. Adding the fee first and then multiplying charges it every time.`,
      seed: `em:${a}:${x}:${b}`,
    };
  },
  // A dot plot's values are listed, so its centre is determined.
  "dot-plot": (at) => {
    const v = Array.isArray(at.values)
      ? at.values.filter((n) => typeof n === "number" && Number.isFinite(n))
      : [];
    if (v.length < 3) return null;
    const sorted = [...v].sort((x, y) => x - y);
    const mid =
      sorted.length % 2
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    const correct = tidy(mid);
    const mean = v.reduce((s, n) => s + n, 0) / v.length;
    return {
      stem: `Before you plot them — for ${sorted.join(", ")}, what is the median?`,
      correct,
      distractors: [tidy(mean), tidy(sorted[0]), tidy(sorted[sorted.length - 1])],
      because: `The median is the middle value once they are in order: ${sorted.join(", ")} → ${correct}. The mean is a different centre.`,
      seed: `dp:${sorted.join(",")}`,
    };
  },
};

function manipPrediction(cfg) {
  const sub = typeof cfg.manip === "string" ? cfg.manip : "";
  const fn = MANIP_DERIVERS[sub];
  const attrs = cfg.attrs;
  if (!fn || !attrs || typeof attrs !== "object") return null;
  const spec = fn(attrs);
  if (!spec || spec.correct === null || spec.correct === undefined) return null;
  return {
    prompt: spec.stem,
    ...orderChoices(spec.correct, spec.distractors, spec.seed),
    because: spec.because,
    unit: "",
  };
}

export function derivePrediction(kind, cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  try {
    // An authored question outranks a derived one on every kind: a person who
    // wrote it knows the lesson, and a deriver only knows the config.
    const written = authoredPrediction(cfg);
    if (written) return written;
    if (kind === "manip") return manipPrediction(cfg);
    const fn = DERIVERS[kind];
    return fn ? fn(cfg) || null : null;
  } catch (_) {
    return null; // a deriver that throws must not cost the student the tool
  }
}

/* ── the gate ─────────────────────────────────────────────────────────────── */

/** Notice & Wonder is a noticing routine; a right/wrong verdict breaks it. */
function inNoticeAndWonder(host) {
  return typeof host.closest === "function" && !!host.closest(".nw-card");
}

/**
 * Render the ask in `host`. `reveal()` mounts the real tool and is called once
 * the student has committed — right or wrong. Nothing here can strand a
 * student: every path leads to the tool.
 */
export function renderPredictGate(host, kind, cfg, reveal) {
  const p = derivePrediction(kind, cfg);
  if (!p || inNoticeAndWonder(host)) return false;

  // Styled inline, the same way the mount-failure note in interactive-visual.js
  // is: this card renders inside four different shells (whole-group, small
  // group, Apply Day, tools mode) whose stylesheets do not all load together,
  // and a card that arrives unstyled in one of them is worse than one that
  // carries its own look everywhere. Colours are borrowed from currentColor so
  // it inherits the surface it lands on rather than assuming a light theme.
  const card = document.createElement("div");
  card.className = "iv-predict";
  card.setAttribute("role", "group");
  card.setAttribute("aria-label", "Predict before the model opens");
  card.style.cssText =
    "margin:0; padding:16px 18px; border:2px dashed currentColor; border-radius:14px; opacity:.98;";

  const q = document.createElement("p");
  q.className = "iv-predict-q";
  q.textContent = p.prompt;
  q.style.cssText = "margin:0 0 12px; font-weight:700; font-size:1.05rem; line-height:1.45;";
  card.append(q);

  const list = document.createElement("div");
  list.className = "iv-predict-choices";
  list.style.cssText = "display:flex; flex-wrap:wrap; gap:10px;";
  const verdict = document.createElement("p");
  verdict.className = "iv-predict-verdict";
  verdict.setAttribute("role", "status");
  verdict.style.cssText = "margin:12px 0 0; font-weight:600; line-height:1.5; min-height:1.2em;";

  let answered = false;
  p.choices.forEach((choice, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "iv-predict-choice";
    b.textContent = p.unit ? `${choice} ${p.unit}` : String(choice);
    // 44px min target: these are tapped on Chromebooks and phones.
    b.style.cssText =
      "min-height:44px; padding:0 16px; border:2px solid currentColor; border-radius:10px; " +
      "background:transparent; color:inherit; font:inherit; font-weight:700; cursor:pointer;";
    b.addEventListener("click", () => {
      if (answered) return;
      answered = true;
      const right = i === p.answerIndex;
      [...list.children].forEach((el, j) => {
        el.disabled = true;
        el.style.cursor = "default";
        if (j === p.answerIndex) {
          el.classList.add("is-correct");
          el.style.outline = "3px solid currentColor";
          el.style.outlineOffset = "2px";
        } else if (j === i) {
          el.classList.add("is-chosen-wrong");
          el.style.opacity = "0.45";
          el.style.textDecoration = "line-through";
        } else {
          el.style.opacity = "0.55";
        }
      });
      const coaching = typeof p.feedbackFor === "function" ? p.feedbackFor(i) : p.because;
      verdict.textContent = (right ? "Yes — " : "Not quite — ") + (coaching || p.because);
      verdict.classList.add(right ? "is-right" : "is-wrong");
      // Open the tool either way. The model is where the thinking continues;
      // withholding it from a student who guessed wrong punishes the guess.
      setTimeout(
        () => {
          card.remove();
          reveal();
        },
        right ? 1100 : 2600,
      );
    });
    list.append(b);
  });

  card.append(list, verdict);
  host.append(card);
  return true;
}
