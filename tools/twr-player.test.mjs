// TWR through the real views in JSDOM: the hub for every band, a strategy page, then EVERY shipped set walked the way
// a learner walks it (learn, practice each question with the right answer, write, finish) plus the failure paths:
// a wrong answer never marks the unpicked right answer, a second miss reveals it, writing needs its checklist or
// the model, and progress is saved.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const win = new JSDOM(
  "<main id='app'></main><div id='labLive'></div><div id='labToast' hidden></div>",
  {
    url: "https://lab.test/access-practice-lab/twr",
  },
).window;
for (const key of [
  "window",
  "document",
  "localStorage",
  "location",
  "history",
  "navigator",
  "HTMLElement",
  "Node",
])
  Object.defineProperty(globalThis, key, { value: win[key], configurable: true, writable: true });
globalThis.CSS = { escape: (s) => String(s) };
globalThis.matchMedia = () => ({ matches: false });
globalThis.innerHeight = 800;
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(await readFile(new URL(String(url).replace(/^\//, ""), ROOT), "utf8")),
});

const view = await import("../access-practice-lab/src/views/twr.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const { BAND_TOKEN, STRATEGY_LIST, TWR_BANDS, setIdFor, strategiesFor } = await import(
  "../access-practice-lab/src/twr/registry.js"
);
const M = await import("../access-practice-lab/src/twr/model.js");

const app = document.getElementById("app");
const ctx = {
  band: "3-5",
  prefs: { lang: "en" },
  route: {},
  setPrefs(p) {
    ctx.prefs = { ...ctx.prefs, ...p };
  },
  rerender: () => draw(),
};
async function draw() {
  const out = await view.render(ctx);
  app.innerHTML = toHtml(out.html);
  return out;
}
const go = async (band, id = "", setId = "") => {
  ctx.band = band;
  ctx.route = { view: "twr", id, setId };
  return draw();
};
const settle = () => new Promise((r) => setTimeout(r, 0));
const click = async (sel) => {
  const el = app.querySelector(sel);
  assert.ok(el, `found ${sel}`);
  view.onClick({ target: el }, ctx);
  await settle();
};
const change = async (sel, value) => {
  const el = app.querySelector(sel);
  assert.ok(el, `found ${sel}`);
  if (el.type === "radio" || el.type === "checkbox") el.checked = value !== false;
  else el.value = value;
  view.onChange({ target: el }, ctx);
  await settle();
};
const stepTitle = () => app.querySelector("#prepStepH")?.textContent.replace(/\s+/g, " ").trim();
const content = (band, slug) =>
  JSON.parse(
    readFileSync(new URL(`access-practice-lab/content/twr/${band}/${slug}.json`, ROOT), "utf8"),
  );

async function answer(it, n, right = true) {
  const k = `i${n}`;
  if (it.kind === "choice") {
    const pick = right ? it.answer : it.options.find((o) => o.id !== it.answer).id;
    await change(`input[data-prep-pick="${k}"][value="${pick}"]`);
  } else if (it.kind === "blanks") {
    let b = 0;
    for (let i = 0; i < it.parts.length; i++) {
      if (typeof it.parts[i] === "string") continue;
      const wrong = it.parts[i].options.find((o) => o !== it.parts[i].answer);
      await change(
        `select[data-prep-blank="${k}:${i}"]`,
        right || b > 0 ? it.parts[i].answer : wrong,
      );
      b += 1;
    }
  } else if (it.kind === "pick") {
    for (const o of it.options)
      if (o.right) await change(`input[data-prep-box="${k}"][value="${o.id}"]`);
  } else {
    for (let i = 0; i < it.lines.length; i++)
      await change(
        `select[data-prep-blank="${k}:${i}"]`,
        right ? i + 1 : ((i + 1) % it.lines.length) + 1,
      );
  }
}

test("the hub shows one start card and the right strategies for every band", async () => {
  for (const band of TWR_BANDS) {
    await go(band);
    const want = strategiesFor(band);
    assert.equal(app.querySelectorAll(".twr-card").length, want.length, `${band}: cards`);
    assert.ok(app.querySelector(".twr-start a.btn-primary"), `${band}: start here`);
    assert.equal(app.querySelectorAll(".twr-band").length, TWR_BANDS.length, "band row");
    assert.equal(
      app.querySelector(".twr-band[aria-current]")?.getAttribute("href").includes("grades="),
      true,
    );
    assert.equal(app.querySelectorAll("h1").length, 1, "one h1");
  }
  await go("K");
  assert.ok(!app.textContent.includes("Appositive"), "K has no appositives");
});

test("a strategy page lists three sets and opens the first", async () => {
  await go("3-5", "because-but-so");
  assert.equal(app.querySelectorAll(".prep-set").length, 3);
  assert.ok(
    app
      .querySelector(".prep-path-bar a.btn-primary")
      .getAttribute("href")
      .includes("g35-because-but-so-1"),
  );
  await go("K", "appositives");
  assert.ok(app.querySelector(".twr-hero"), "a strategy the band lacks falls back to the hub");
});

test("an unknown set falls back to its strategy page", async () => {
  await go("3-5", "because-but-so", "nope");
  assert.equal(app.querySelectorAll(".prep-set").length, 3);
});

test("wrong answers never mark the right one; the second miss reveals it", async () => {
  const set = content("3-5", "because-but-so").sets[0];
  const n = set.items.findIndex((i) => i.kind === "choice");
  assert.ok(n >= 0, "has a choice item");
  M.resetState(set.id);
  await go("3-5", "because-but-so", set.id);
  await click('[data-prep-act="next"]');
  for (let i = 0; i < n; i++) {
    await answer(set.items[i], i);
    await click('[data-prep-act="check-item"]');
    await click('[data-prep-act="item-next"]');
  }
  const it = set.items[n];
  await answer(it, n, false);
  await click('[data-prep-act="check-item"]');
  assert.ok(app.querySelector(".feedback.is-hint"), "hint after a miss");
  assert.ok(!app.querySelector(".choice.is-answer"), "right answer not marked after one miss");
  assert.ok(!app.querySelector('[data-prep-act="item-next"]'), "cannot move on");
  await change(
    `input[data-prep-pick="i${n}"][value="${it.options.filter((o) => o.id !== it.answer)[1]?.id || it.options.find((o) => o.id !== it.answer).id}"]`,
  );
  await click('[data-prep-act="check-item"]');
  assert.ok(app.querySelector(".choice.is-answer"), "revealed after the second miss");
  await answer(it, n, true);
  await click('[data-prep-act="check-item"]');
  assert.ok(app.querySelector(".feedback.is-right"), "right answer accepted");
  assert.ok(M.loadState(set.id).tries[`i${n}`] === 2, "tries saved");
  M.resetState(set.id);
});

for (const band of TWR_BANDS) {
  test(`every ${band} set can be finished: learn, practice, write, finish`, async () => {
    ctx.prefs = { lang: "en" };
    for (const strat of strategiesFor(band)) {
      const data = content(band, strat.slug);
      for (let s = 0; s < data.sets.length; s++) {
        const set = data.sets[s];
        const where = `${band}/${strat.slug}#${s + 1}`;
        assert.equal(set.id, setIdFor(band, strat.slug, s + 1), where);
        M.resetState(set.id);
        await go(band, strat.slug, set.id);
        assert.equal(app.querySelectorAll(".prep-rail li").length, 4, `${where}: four steps`);
        assert.match(stepTitle(), /Learn/, where);
        assert.ok(app.querySelector(".twr-model [data-say]"), `${where}: model can be heard`);
        await click('[data-prep-act="next"]');
        assert.match(stepTitle(), /Practice/, where);
        for (let n = 0; n < set.items.length; n++) {
          assert.ok(app.querySelector(".twr-item"), `${where}: item ${n + 1} drawn`);
          await answer(set.items[n], n);
          await click('[data-prep-act="check-item"]');
          assert.ok(
            app.querySelector(".feedback.is-right"),
            `${where}: item ${n + 1} accepts its own key`,
          );
          await click('[data-prep-act="item-next"]');
        }
        assert.match(stepTitle(), /Write/, where);
        const w = set.write;
        if (w.say) {
          for (let i = 0; i < w.checks.length; i++)
            await change(`input[data-prep-box="say"][value="${i}"]`);
        } else {
          const ta = app.querySelector("#twrWrite");
          ta.value = w.model;
          view.onInput({ target: ta }, ctx);
          assert.ok(
            [...app.querySelectorAll(".twr-checks li")].every((li) =>
              li.classList.contains("is-met"),
            ),
            `${where}: model meets the live checklist`,
          );
          assert.equal(
            app
              .querySelector('.prep-steps-nav [data-prep-act="next"]')
              .getAttribute("aria-disabled"),
            "false",
            where,
          );
        }
        await click('[data-prep-act="next"]');
        assert.match(stepTitle(), /Finish/, where);
        assert.equal(app.querySelectorAll(".twr-star.is-on").length >= 1, true, `${where}: stars`);
        assert.ok(app.querySelector(".prep-adults"), `${where}: family and teacher notes`);
        assert.ok(M.isDone(set.id), `${where}: saved as done`);
        M.resetState(set.id);
      }
    }
  });
}

test("typed writing is gated by the checklist or a model", async () => {
  const set = content("6-8", "because-but-so").sets[0];
  M.resetState(set.id);
  await go("6-8", "because-but-so", set.id);
  const st = M.loadState(set.id);
  st.step = 2;
  st.i = set.items.length;
  M.saveState(set.id, st);
  view.unmount();
  await go("6-8", "because-but-so", set.id);
  assert.equal(
    app.querySelector('.prep-steps-nav [data-prep-act="next"]').getAttribute("aria-disabled"),
    "true",
  );
  const ta = app.querySelector("#twrWrite");
  ta.value = "Too short.";
  view.onInput({ target: ta }, ctx);
  assert.ok(app.querySelector('[data-prep-act="model"]').disabled, "model needs three words");
  ta.value = "This is a draft that misses the checklist items entirely";
  view.onInput({ target: ta }, ctx);
  assert.equal(
    app.querySelector('.prep-steps-nav [data-prep-act="next"]').getAttribute("aria-disabled"),
    "true",
    "draft alone does not pass",
  );
  await click('[data-prep-act="model"]');
  assert.ok(app.querySelector(".twr-model-box"), "model shown");
  assert.notEqual(
    app.querySelector('.prep-steps-nav [data-prep-act="next"]').getAttribute("aria-disabled"),
    "true",
    "model unlocks the finish",
  );
  ctx.prefs = { lang: "es" };
  M.resetState(set.id);
});

test("model rules: stars, order and pick checks, set problems", () => {
  assert.equal(M.starsFor({ tries: {} }), 3);
  assert.equal(M.starsFor({ tries: { i0: 1 } }), 3);
  assert.equal(M.starsFor({ tries: { i0: 2, i1: 1 } }), 2);
  assert.equal(M.starsFor({ tries: { i0: 5, i1: 3 } }), 1);
  assert.equal(M.checkOrder({ lines: ["a", "b", "c"] }, { 0: "1", 1: "2", 2: "3" }).ok, true);
  assert.equal(M.checkOrder({ lines: ["a", "b", "c"] }, { 0: "2", 1: "1", 2: "3" }).ok, false);
  assert.equal(M.ruleMet({ any: ["because"] }, "It is cold because it is winter."), true);
  assert.equal(M.ruleMet({ any: ["so"] }, "Something happened."), false);
  assert.equal(M.ruleMet({ re: ",[^,]{3,}," }, "Maya, my neighbor, plays drums."), true);
  assert.equal(M.ruleMet({ end: true }, "Does it end?"), true);
  assert.ok(M.setProblems({ id: "x" }).length > 0);
  assert.ok(STRATEGY_LIST.length === 12 && Object.keys(BAND_TOKEN).length === 5);
});
