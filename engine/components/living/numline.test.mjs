// numline.test.mjs — the shared number-line helpers and stage of the integers
// cluster: formatting, equal spacing, tick positions, and a jsdom mount of every
// authored scene (the four lessons' real configs) including a resume replay.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import {
  betweenInts,
  count,
  fracText,
  geometry,
  near,
  num,
  pairOf,
  placeCorrect,
  slotFor,
  tickValues,
  withUnit,
} from "./numline-model.js";

const MINUS = "−";

test("num: a real minus sign, no float noise, no negative zero", () => {
  assert.equal(num(-2.5), `${MINUS}2.5`);
  assert.equal(num(0.75), "0.75");
  assert.equal(num(0), "0");
  assert.equal(num(-0), "0");
  assert.equal(num(0.1 + 0.2), "0.3");
  assert.equal(num(-86), `${MINUS}86`);
  assert.equal(withUnit(-9, "°C"), `${MINUS}9°C`);
  assert.equal(withUnit(86, " m"), "86 m");
});

test("fracText: reduced improper fractions of values on a grid", () => {
  assert.equal(fracText(2.5, 2), "5/2");
  assert.equal(fracText(-2.5, 2), `${MINUS}5/2`);
  assert.equal(fracText(-0.5, 4), `${MINUS}1/2`);
  assert.equal(fracText(0.75, 4), "3/4");
  assert.equal(fracText(3, 1), "3");
  assert.equal(fracText(2, 4), "2");
  assert.equal(fracText(0.3, 4), "0.3", "off-grid falls back to the decimal");
});

test("betweenInts and count", () => {
  assert.deepEqual(betweenInts(-2.5), [-3, -2]);
  assert.deepEqual(betweenInts(0.75), [0, 1]);
  assert.equal(betweenInts(4), null);
  const w = { en: "degrees", es: "grados" };
  assert.deepEqual(count(9, w), { en: "9 degrees", es: "9 grados" });
  assert.deepEqual(count(-1, w), { en: "1 degree", es: "1 grado" });
  assert.deepEqual(count(1, { en: "units", es: "unidades" }), { en: "1 unit", es: "1 unidad" });
  assert.deepEqual(count(2.5, { en: "units", es: "unidades" }), {
    en: "2.5 units",
    es: "2.5 unidades",
  });
});

test("placeCorrect and slotFor keep the right answer off the first slot", () => {
  for (let seed = 0; seed < 60; seed++) {
    for (const n of [3, 4]) {
      const opts = [
        { id: "ok", correct: true },
        ...Array.from({ length: n - 1 }, (_, i) => ({ id: i })),
      ];
      const placed = placeCorrect(opts, slotFor(seed, n));
      assert.notEqual(placed[0].id, "ok", `seed ${seed}, n ${n}`);
      assert.equal(placed.length, n);
    }
  }
});

test("pairOf: strings serve both languages; empty is refused", () => {
  assert.deepEqual(pairOf("Toronto", 20), { en: "Toronto", es: "Toronto" });
  assert.deepEqual(pairOf({ en: "Faro" }, 20), { en: "Faro", es: "Faro" });
  assert.equal(pairOf({ en: " " }), null);
  assert.equal(pairOf(null), null);
  assert.equal(pairOf({ en: "x".repeat(50) }, 10).en.length, 10);
});

test("tickValues: index-based, no float drift", () => {
  assert.equal(tickValues(-8, 8, 1).length, 17);
  assert.deepEqual(tickValues(-1, 1, 0.25), [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]);
  const t = tickValues(-100, 100, 10);
  assert.equal(t.length, 21);
  assert.ok(t.includes(0) && t.includes(-100) && t.includes(100));
});

test("geometry: equal spacing, 0 in the right place, up and right are positive", () => {
  for (const axis of ["h", "v"]) {
    const g = geometry({ axis, min: -8, max: 8, W: 420, H: 340, at: 100, pad: 30 });
    const step = g.pos(1) - g.pos(0);
    for (let v = -8; v < 8; v++) {
      assert.ok(near(g.pos(v + 1) - g.pos(v), step), `${axis} step at ${v}`);
    }
    assert.ok(near(g.pos(0), (g.pos(-8) + g.pos(8)) / 2), "0 is in the middle of a symmetric line");
    assert.ok(near(Math.abs(step), g.unit));
    if (axis === "h") assert.ok(step > 0, "greater is to the right");
    else assert.ok(step < 0, "greater is higher up (smaller y)");
  }
  const h = geometry({ axis: "h", min: -10, max: 5, W: 420, H: 200, at: 90, pad: 30 });
  assert.ok(near(h.pos(-10), 30) && near(h.pos(5), 390));
  assert.ok(near(h.pos(-2.5) - h.pos(-3), (h.pos(-2) - h.pos(-3)) / 2), "−2.5 is halfway");
  const at = h.at(3, 20);
  assert.ok(near(at.x, h.pos(3)) && near(at.y, 70));
});

// ---------------------------------------------------------------- jsdom stage

function installDom() {
  const dom = new JSDOM('<!doctype html><html lang="en"><body><div id="host"></div></body></html>', {
    url: "http://localhost/",
  });
  const g = globalThis;
  g.window = dom.window;
  g.document = dom.window.document;
  g.localStorage = dom.window.localStorage;
  return dom;
}

test("stage: every tick sits at geometry.pos, equally spaced, labels where asked", async () => {
  installDom();
  const { createStage } = await import("./numline-stage.js");
  for (const [axis, cfg] of [
    ["h", { min: -8, max: 8, labelEvery: 2, tickEvery: 1 }],
    ["v", { min: -100, max: 100, labelEvery: 50, tickEvery: 10 }],
  ]) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const ctx = { svg, tween: () => Promise.resolve() };
    const stage = createStage(ctx, { axis });
    const geo = stage.scale(cfg);
    const ticks = [...svg.querySelectorAll("line[data-tick]")];
    const want = tickValues(cfg.min, cfg.max, cfg.tickEvery);
    assert.equal(ticks.length, want.length);
    const coord = (el) =>
      axis === "h"
        ? (Number(el.getAttribute("x1")) + Number(el.getAttribute("x2"))) / 2
        : (Number(el.getAttribute("y1")) + Number(el.getAttribute("y2"))) / 2;
    want.forEach((v, i) => assert.ok(near(coord(ticks[i]), geo.pos(v)), `${axis} tick ${v}`));
    const gaps = ticks.slice(1).map((t, i) => Math.abs(coord(t) - coord(ticks[i])));
    for (const gap of gaps) assert.ok(near(gap, gaps[0]), `${axis}: equal tick spacing`);
    const labels = [...svg.querySelectorAll("text[data-tick]")].map((t) => t.textContent);
    const labelled = want.filter((v) => Math.round(v / cfg.labelEvery) * cfg.labelEvery === v);
    assert.deepEqual(labels, labelled.map(num));
  }
});

test("stage: a mark lands on the dot of its value", async () => {
  installDom();
  const { createStage } = await import("./numline-stage.js");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const ctx = {
    svg,
    tween: (moves) => {
      for (const [el, attrs] of moves)
        for (const [k, v] of Object.entries(attrs))
          if (k === "text") el.textContent = String(v);
          else el.setAttribute(k, String(v));
      return Promise.resolve();
    },
  };
  const stage = createStage(ctx, { axis: "h" });
  const geo = stage.scale({ min: -4, max: 4, labelEvery: 1 });
  stage.mark("a");
  await stage.show(ctx, { a: { v: -2.5, label: "x", bar: true, barLabel: "2.5" } }, 0);
  const dot = svg.querySelector("circle[r='9']");
  assert.ok(near(Number(dot.getAttribute("cx")), geo.pos(-2.5)));
  assert.ok(near(Number(dot.getAttribute("cy")), geo.at(0).y));
  const bar = svg.querySelector("line[stroke-linecap='round']");
  assert.ok(near(Number(bar.getAttribute("x1")), geo.pos(0)));
  assert.ok(near(Number(bar.getAttribute("x2")), geo.pos(-2.5)));
});

// ------------------------------------------------ every authored scene, resumed

const authored = (id) =>
  JSON.parse(readFileSync(new URL(`../../../lessons/${id}/config.json`, import.meta.url), "utf8"))
    .launch.conceptIntro.livingScene;

for (const id of ["7-2", "7-3", "7-4"]) {
  test(`${id}: the authored scene builds and every scene replays on resume`, async () => {
    installDom();
    const cfg = authored(id);
    const { LIVING_PLAYS } = await import("./index.js");
    const { mountLivingScene } = await import("../../core/living-scene.js");
    const build = await LIVING_PLAYS[cfg.play]();
    const play = build(cfg);
    assert.ok(play, `${id}: play refused its authored config`);
    assert.ok(play.scenes.length >= 5 && play.scenes.length <= 7);
    const gates = play.scenes.filter((s) => s.gate).length;
    assert.ok(gates >= 2, "at least a predict and a manipulate gate");
    for (const lang of ["en", "es"]) {
      document.documentElement.lang = lang;
      const key = `${id}-${lang}`;
      const last = play.scenes.length - 1;
      localStorage.setItem(
        `nt-living:v1:${key}`,
        JSON.stringify({ scene: last, done: play.scenes.map((s) => s.id), scenes: {} }),
      );
      const host = document.createElement("div");
      document.body.appendChild(host);
      const p = build(cfg);
      mountLivingScene(host, p, { storeKey: key });
      await new Promise((r) => setTimeout(r, 80));
      assert.ok(host.querySelector(".lsx-stage"), "stage mounted");
      assert.ok(host.querySelectorAll(".lsx-stage text").length > 5, "stage drew ticks");
      assert.ok(host.querySelector(".lsx-panel").children.length > 0, "last scene built its panel");
      assert.ok(!host.querySelector(".lsx-stage").innerHTML.includes("NaN"), "no NaN in the stage");
    }
  });
}
