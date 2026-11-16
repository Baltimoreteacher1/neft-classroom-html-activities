// shared/motion render + scene + tokens: structure, text size, containment, token parity, scene scheduling. jsdom, no browser.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { exponentModel, LIMITS } from "../shared/motion/exponent-copies.mjs";
import { exponentScene } from "../shared/motion/exponent-copies-motion.mjs";
import { renderExponent } from "../shared/motion/exponent-copies-render.mjs";
import { fadesOnly, timeline, windows } from "../shared/motion/motion.mjs";
import { COLOR, COPY_FILLS, CSS_VARS, MOTION } from "../shared/motion/tokens.mjs";

const doc = (svg) => new JSDOM(`<body>${svg}</body>`).window.document;
const SAMPLES = [
  [1, 1],
  [1, 8],
  [2, 2],
  [2, 8],
  [3, 4],
  [4, 4],
  [5, 5],
  [12, 1],
  [12, 8],
];

test("tokens mirror engine/design/tokens.json (one source of truth)", () => {
  const t = JSON.parse(readFileSync("engine/design/tokens.json", "utf8"));
  assert.deepEqual(
    { ...MOTION },
    {
      fastMs: t.motion.fastMs,
      baseMs: t.motion.baseMs,
      slowMs: t.motion.slowMs,
      celebrateMs: t.motion.celebrateMs,
      easing: t.motion.easing,
    },
  );
  for (const k of ["navy", "teal", "amber", "canvas", "text", "white", "success", "error"])
    assert.equal(COLOR[k], t.palette[k].toLowerCase(), k);
  assert.equal(COLOR.ink, t.palette.diagramInk.toLowerCase());
  const css = readFileSync("engine/styles/ds-tokens.generated.css", "utf8");
  assert.ok(css.includes(`--ds-color-teal-ink: ${COLOR.tealInk}`));
  assert.ok(css.includes(`--ds-color-muted: ${COLOR.muted}`));
  for (const f of COPY_FILLS) assert.ok(f in CSS_VARS, f);
});

test("no violet, purple or magenta anywhere in the palette (validate:palette hue band 255-335)", () => {
  for (const hex of [...Object.values(COLOR), ...COPY_FILLS]) {
    const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const d = mx - mn;
    if (d === 0) continue;
    const h = (mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    const hue = (h + 360) % 360;
    const sat = d / (1 - Math.abs(mx + mn - 1));
    assert.ok(!(hue >= 255 && hue <= 335 && sat > 0.15), `${hex} hue ${hue}`);
  }
});

test("every sample renders one svg with computed numbers, no NaN, no text under 13px, in all languages", () => {
  for (const [b, e] of SAMPLES) {
    const m = exponentModel(b, e);
    for (const lang of ["en", "es"]) {
      for (const width of [360, 400, 600]) {
        const r = renderExponent(m, { lang, width });
        assert.ok(r.svg.startsWith("<svg") && r.svg.endsWith("</svg>"));
        assert.ok(!/NaN|undefined|Infinity|\[object|>null</.test(r.svg), `${b}^${e} ${lang}`);
        for (const s of r.svg.matchAll(/font-size="([\d.]+)"/g))
          assert.ok(Number(s[1]) >= 13, `${b}^${e} font ${s[1]}`);
        const d = doc(r.svg);
        assert.equal(d.querySelectorAll(".mc-card").length, e, "one card per step");
        assert.equal(d.querySelectorAll(".mc-arrow").length, e - 1, "an arrow between cards");
        assert.ok(r.svg.includes(m.valueText), "the value appears");
        assert.ok(
          r.svg.includes(`>${m.notation} = `) || r.svg.includes(`${m.notation} = ${m.valueText}`),
          "notation = value",
        );
        assert.equal(d.querySelectorAll(".mc-check").length, m.misconception ? 1 : 0);
        // every dot belongs to exactly one copy group, and group count per step is the base
        for (let n = 1; n <= e; n++)
          assert.equal(d.querySelectorAll(`.mc-copy[data-step="${n}"]`).length, b);
      }
    }
  }
});

test("every placed element stays inside the viewBox", () => {
  for (const [b, e] of SAMPLES) {
    for (const width of [360, 600]) {
      const r = renderExponent(exponentModel(b, e), { lang: "es", width });
      for (const m of r.svg.matchAll(
        /<(?:circle|rect|text)\b[^>]*?\b(?:cx|x)="(-?[\d.]+)"[^>]*?\b(?:cy|y)="(-?[\d.]+)"/g,
      )) {
        assert.ok(
          Number(m[1]) >= -1 && Number(m[1]) <= r.width + 1,
          `${b}^${e}@${width} x=${m[1]}`,
        );
        assert.ok(
          Number(m[2]) >= -1 && Number(m[2]) <= r.height + 1,
          `${b}^${e}@${width} y=${m[2]}`,
        );
      }
    }
  }
});

test("css token mode emits no literal colour and still has every colour as a variable", () => {
  for (const [b, e] of SAMPLES) {
    const r = renderExponent(exponentModel(b, e), { tokens: "css", width: 400 });
    assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/.test(r.svg), `${b}^${e}`);
    assert.ok(r.svg.includes("var(--mc-ink)"));
  }
});

test("meaning never rests on colour alone: dashed vs solid boxes, symbols, numbered copies", () => {
  const r = renderExponent(exponentModel(3, 4));
  const d = doc(r.svg);
  assert.ok(
    d.querySelector(".mc-check rect").getAttribute("stroke-dasharray"),
    "misconception box is dashed",
  );
  assert.ok(
    !d.querySelector(".mc-answer rect").getAttribute("stroke-dasharray"),
    "answer box is solid",
  );
  assert.ok(
    d.querySelector(".mc-answer path") && d.querySelector(".mc-check path"),
    "check and cross symbols",
  );
  assert.ok(
    d.querySelectorAll('.mc-copy[data-step="4"] rect[stroke-dasharray]').length >= 1,
    "odd copies are dashed",
  );
  assert.match(r.svg, /exponent: how many factors/);
  assert.match(r.svg, /base: the factor/);
});

test("windows and timeline schedule by fraction", () => {
  assert.deepEqual(
    windows(4).map((w) => [w.from, w.to]),
    [
      [0, 0.25],
      [0.25, 0.5],
      [0.5, 0.75],
      [0.75, 1],
    ],
  );
  assert.deepEqual(
    timeline(2000, [
      { from: 0, to: 0.5 },
      { from: 0.25, to: 1 },
    ]),
    [
      { delay: 0, duration: 1000 },
      { delay: 500, duration: 1500 },
    ],
  );
  assert.deepEqual(timeline(4000, [{ from: 0.25, to: 0.5 }]), [{ delay: 1000, duration: 1000 }]);
  assert.throws(() => timeline(1000, [{ from: 0.6, to: 0.4 }]), RangeError);
  assert.throws(() => timeline(1000, [{ from: -0.1, to: 0.4 }]), RangeError);
  assert.throws(() => timeline(1000, [{ from: 0.1, to: 1.2 }]), RangeError);
});

test("reduced motion keeps opacity and drops movement", () => {
  assert.deepEqual(
    fadesOnly([
      { opacity: 0, transform: "scale(0.8)" },
      { opacity: 1, transform: "none" },
    ]),
    [{ opacity: 0 }, { opacity: 1 }],
  );
});

test("the exponent scene covers every card, copy and the closing block, within 0..1, in order", () => {
  for (const [b, e] of [
    [3, 4],
    [2, 8],
    [12, 2],
  ]) {
    const d = doc(renderExponent(exponentModel(b, e)).svg);
    const sc = exponentScene(d, e);
    for (const t of sc.tracks)
      assert.ok(t.from >= 0 && t.to <= 1 && t.to >= t.from, `${b}^${e} ${t.from}-${t.to}`);
    const animated = new Set(sc.tracks.flatMap((t) => t.els));
    for (const sel of [".mc-card", ".mc-copy", ".mc-arrow", ".mc-final > g"])
      for (const el of d.querySelectorAll(sel)) assert.ok(animated.has(el), `${sel} is animated`);
    const cardStarts = sc.tracks
      .filter((t) => t.els[0]?.classList.contains("mc-card"))
      .map((t) => t.from);
    assert.deepEqual(
      [...cardStarts].sort((x, y) => x - y),
      cardStarts,
      "cards enter in order",
    );
    assert.ok(sc.durationMs >= 1800 && sc.durationMs <= 7500);
    const only = exponentScene(d, e, { only: e });
    assert.ok(
      only.tracks.every((t) =>
        t.els.every((el) => !el.dataset.step || el.dataset.step === String(e)),
      ),
      "only the new step enters",
    );
    assert.equal(only.durationMs, 1400);
  }
});

test("scene is deterministic", () => {
  const key = () =>
    JSON.stringify(
      exponentScene(doc(renderExponent(exponentModel(3, 4)).svg), 4).tracks.map((t) => [
        t.from,
        t.to,
        t.els.length,
      ]),
    );
  assert.equal(key(), key());
});

test("limits match the brief", () =>
  assert.deepEqual({ ...LIMITS }, { baseMin: 1, baseMax: 12, expMin: 1, expMax: 8, dotCap: 256 }));
