// The contract every motion figure must meet (docs/motion-figure-contract.md), enforced on all registered figures at every legal
// setting of every control. FIG=<id> checks one figure; MOTION_COVERAGE=1 also requires a figure for every lab model of Units 2-9.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { controls as labControls } from "../curriculum/learning-labs/shared/math.mjs";
import { registered } from "../curriculum/learning-labs/shared/models/index.mjs";
import { parse } from "../shared/motion/exact.mjs";
import { FIGURES, figureFor } from "../shared/motion/figures/index.mjs";
import { figureSvg } from "../shared/motion/figures/mount.mjs";
import { newProblem, problemAt } from "../shared/motion/figures/think-logic.mjs";
import { CSS_VARS } from "../shared/motion/tokens.mjs";
import { blueprints } from "./learning-labs/blueprints.mjs";

const only = process.env.FIG;
// one DOM for the whole file: a JSDOM per setting exhausted the heap once 43 figures were registered
const DOM = new JSDOM("<body></body>").window.document;
const docOf = (svg) => {
  DOM.body.innerHTML = svg;
  return DOM;
};
const figs = FIGURES.filter((f) => !only || f.id === only);
const ALLOWED = new Set(Object.keys(CSS_VARS));
// a key is a standalone lab's model (blueprints) or a registered model a Practice bench uses (curriculum/learning-labs/shared/models)
const startOf = (key) => {
  const bp = blueprints.find((b) => `${b.model.kind}:${b.model.mode}` === key)?.model;
  if (bp) return bp;
  const [kind, mode] = key.split(":");
  const reg = registered({ kind, mode });
  return reg ? { kind, mode, values: reg.values } : undefined;
};
const benchKeys = () => {
  const keys = new Set();
  for (const dir of ["data/practice-studio", "data/practice-studio-u4"]) {
    for (const f of readdirSync(dir)) {
      if (!/^[2-9]-\d+\.json$/.test(f)) continue;
      const m = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")).bench?.model;
      if (m) keys.add(`${m.kind}:${m.mode}`);
    }
  }
  return keys;
};
const settings = (c) => {
  const steps = Math.round((c.max - c.min) / c.step);
  const every = Math.max(1, Math.ceil(steps / 12));
  const s = new Set([0, steps]);
  for (let i = 0; i <= steps; i += every) s.add(i);
  return [...s].sort((a, b) => a - b).map((i) => Number((c.min + i * c.step).toFixed(6)));
};

test("a figure exists for every lab model of Units 2-9 (MOTION_COVERAGE=1)", {
  skip: !process.env.MOTION_COVERAGE,
}, () => {
  const keys = [
    ...new Set(
      blueprints
        .filter((b) => b.lessons.some((l) => /^[2-9]-/.test(l)))
        .map((b) => `${b.model.kind}:${b.model.mode}`),
    ),
  ];
  const missing = keys.filter((k) => !figureFor(k));
  assert.deepEqual(missing, [], `no motion figure for: ${missing.join(", ")}`);
});

test("every figure supports Think it through: headline, wrong move, a new equivalent problem (MOTION_COVERAGE=1)", {
  skip: !process.env.MOTION_COVERAGE,
}, () => {
  for (const fig of FIGURES) {
    assert.equal(typeof fig.headline, "function", `${fig.id}: headline`);
    for (const key of fig.keys) {
      const start = startOf(key);
      for (const lang of ["en", "es"]) {
        const p = problemAt(fig, key, start.values, lang);
        assert.ok(p, `${fig.id} ${key}: no problem at the starting values`);
        assert.ok(
          p.head.label && parse(p.head.value),
          `${fig.id} ${key}: headline ${JSON.stringify(p.head)}`,
        );
        if (p.wrong) {
          assert.ok(parse(p.wrong.value), `${fig.id} ${key}: wrong value ${p.wrong.value}`);
          assert.notEqual(
            parse(p.wrong.value).toString(),
            parse(p.head.value).toString(),
            `${fig.id} ${key}: wrong equals right`,
          );
          assert.ok(p.wrong.say.length > 8, `${fig.id} ${key}: wrong say`);
        }
      }
      const n = newProblem(fig, key, start.values, "check|1", { avoid: [] });
      assert.ok(n, `${fig.id} ${key}: no new equivalent problem can be generated`);
      if (fig.thinkWrong !== false)
        assert.ok(
          newProblem(fig, key, start.values, "check|2", { needWrong: true }),
          `${fig.id} ${key}: no setting has a wrong move to analyse`,
        );
    }
  }
});

for (const fig of figs) {
  test(`${fig.id}: registry shape`, () => {
    assert.ok(
      fig.id && fig.keys.length && fig.title.en && fig.title.es && fig.title.en !== fig.title.es,
    );
    for (const f of ["controls", "build", "render", "scene", "describe"])
      assert.equal(typeof fig[f], "function", f);
    for (const k of fig.keys)
      assert.ok(startOf(k), `${k} is not a lab blueprint or registered bench model`);
  });

  for (const key of fig.keys) {
    test(`${fig.id} ${key}: controls match the lab's, every setting renders to the contract`, () => {
      const start = startOf(key);
      const lab = labControls({ kind: start.kind, mode: start.mode, values: start.values });
      const mine = fig.controls(key);
      assert.equal(mine.length, lab.length, "same number of controls as the lab");
      mine.forEach((c, i) => {
        assert.equal(c.min, lab[i].min, `control ${i} min`);
        assert.equal(c.max, lab[i].max, `control ${i} max`);
        assert.equal(c.step, lab[i].step, `control ${i} step`);
        assert.ok(c.label && c.labelEs && c.label !== c.labelEs, `control ${i} labels`);
      });
      const seen = new Set();
      for (const [i, c] of mine.entries()) {
        if (c.min === c.max) continue;
        for (const v of settings(c)) {
          const values = start.values.map((x, j) => (j === i ? v : x));
          const where = `${key} control ${i}=${v}`;
          let first = null;
          for (const lang of ["en", "es"]) {
            for (const width of [300, 400, 600]) {
              const sig = `${lang}${width}${JSON.stringify(values)}`;
              if (seen.has(sig)) continue;
              seen.add(sig);
              const r = figureSvg(fig, key, values, { lang, width });
              assert.ok(r.svg.startsWith("<svg") && r.svg.endsWith("</svg>"), where);
              assert.ok(
                !/NaN|undefined|Infinity|\[object|>null</.test(r.svg),
                `${where}: prints NaN/undefined/null`,
              );
              for (const m of r.svg.matchAll(/font-size="([\d.]+)"/g))
                assert.ok(Number(m[1]) >= 13, `${where}: font ${m[1]} under 13`);
              for (const m of r.svg.matchAll(/#[0-9a-fA-F]{6}\b/g))
                assert.ok(
                  ALLOWED.has(m[0].toLowerCase()),
                  `${where}: colour ${m[0]} is not a palette token`,
                );
              assert.ok(r.width >= 300 && r.height > 20, where);
              for (const t of r.svg.matchAll(/<text\b[^>]*>([^<]*)</g))
                assert.ok(t[1].length <= 80, `${where}: a label is ${t[1].length} characters`);
              for (const m of r.svg.matchAll(
                /<(?:circle|rect|text|line)\b[^>]*?\b(?:cx|x|x1)="(-?[\d.]+)"[^>]*?\b(?:cy|y|y1)="(-?[\d.]+)"/g,
              )) {
                assert.ok(
                  Number(m[1]) >= -1 &&
                    Number(m[1]) <= r.width + 1 &&
                    Number(m[2]) >= -1 &&
                    Number(m[2]) <= r.height + 1,
                  `${where}@${width}: element at ${m[1]},${m[2]} is outside ${r.width}x${r.height}`,
                );
              }
              assert.ok(r.svg.length < 120000, `${where}: ${r.svg.length} bytes`);
              if (lang === "en" && width === 400) first = r;
              if (lang === "es" && width === 400 && first) {
                assert.notEqual(first.svg, r.svg, `${where}: Spanish picture is the English one`);
                assert.notEqual(
                  fig.describe(first.model, "en"),
                  fig.describe(r.model, "es"),
                  `${where}: description not translated`,
                );
              }
              const css = figureSvg(fig, key, values, { lang, width, tokens: "css" });
              assert.ok(
                !/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/.test(css.svg),
                `${where}: css mode still has a literal colour`,
              );
              if (lang === "en" && width === 400) {
                const sum = (t) =>
                  JSON.stringify(t.tracks.map((x) => [x.from, x.to, x.els.length]));
                const sc = fig.scene(docOf(r.svg), r.model);
                assert.ok(
                  sc.durationMs >= 600 && sc.durationMs <= 9000,
                  `${where}: scene ${sc.durationMs}ms`,
                );
                assert.ok(
                  sc.tracks.length > 0 && sc.tracks.some((t) => t.els.length),
                  `${where}: scene animates nothing`,
                );
                for (const t of sc.tracks)
                  assert.ok(
                    t.from >= 0 && t.to <= 1 && t.to >= t.from && t.keyframes.length >= 2,
                    `${where}: bad track ${t.from}-${t.to}`,
                  );
                const first = sum(sc);
                assert.equal(
                  sum(fig.scene(docOf(r.svg), r.model)),
                  first,
                  `${where}: scene is not deterministic`,
                );
              }
            }
          }
          const d = fig.describe(fig.build(key, values), "en");
          assert.ok(d.length > 40 && !/NaN|undefined/.test(d), `${where}: description`);
        }
      }
    });
  }
}
