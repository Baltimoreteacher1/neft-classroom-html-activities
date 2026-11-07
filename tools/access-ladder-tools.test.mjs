// Reading Ladder reading tools (Language Page #12 levelled texts + Spanish parallel, #13 tap-a-word + words I
// know) and the adaptive placement staircase (#14).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, LAB), "utf8"));
const { passages } = read("content/ladder/passages.json");
const leveled = read("content/ladder/leveled.json").passages;
const glossary = read("content/glossary.json");
const tools = await import("../access-practice-lab/src/ladder-tools.js");
const place = await import("../access-practice-lab/src/ladder-placement.js");
const ladder = await import("../access-practice-lab/src/ladder.js");

test("every ladder passage has an easier, a richer and a Spanish version", () => {
  assert.deepEqual(Object.keys(leveled).sort(), passages.map((p) => p.id).sort());
  for (const p of passages) {
    const v = leveled[p.id];
    const n = (t) => t.split(/\s+/).length;
    assert.ok(
      n(v.easier) < n(p.text) && n(p.text) < n(v.richer),
      `${p.id} levels must grow in length`,
    );
    assert.ok(v.es && v.es !== p.text, `${p.id} Spanish`);
    for (const q of p.questions) {
      const quoted = q.q.match(/"([^"]+)"/)?.[1];
      if (q.kind === "word" && quoted)
        for (const level of ["easier", "richer"])
          assert.ok(
            v[level].toLowerCase().includes(quoted.toLowerCase()),
            `${p.id} ${level} must keep "${quoted}"`,
          );
    }
  }
});

test("the Spanish version never contains a question or an answer choice", () => {
  for (const p of passages)
    for (const q of p.questions) {
      assert.ok(!leveled[p.id].es.includes(q.q));
      for (const c of q.choices) if (c.length > 15) assert.ok(!leveled[p.id].es.includes(c));
    }
});

test("textAt picks the version and falls back to the passage", () => {
  const p = passages[0];
  assert.equal(tools.textAt(p, leveled, "easier"), leveled[p.id].easier);
  assert.equal(tools.textAt(p, leveled, "on"), p.text);
  assert.equal(tools.textAt(p, {}, "richer"), p.text);
});

test("tap-a-word: words with offsets, glossary lookup by base form, known words counted", () => {
  const w = tools.wordsOf("The bee's dance, well-known.");
  assert.deepEqual(
    w.map((x) => x.word),
    ["The", "bee's", "dance", "well-known"],
  );
  assert.equal(tools.lookup(glossary, "Absorbs")?.term, "absorb");
  assert.equal(tools.lookup(glossary, "zzzz"), null);
  let known = tools.normalizeKnown(["Dance", 4, "<b>"]);
  assert.deepEqual(known, ["dance"]);
  known = tools.toggleKnown(known, "bee's");
  assert.deepEqual(known, ["bee", "dance"]);
  assert.deepEqual(tools.knownIn("The bee dance. The bee.", known), { known: 2, total: 3 });
  assert.deepEqual(tools.toggleKnown(known, "dance"), ["bee"]);
});

test("the Spanish parallel version is a teacher control set by a teacher link", () => {
  assert.equal(tools.controlsFromUrl("?grades=6-8", {}), null);
  assert.deepEqual(tools.controlsFromUrl("?spanish=on", {}), { ladderSpanish: true });
  assert.deepEqual(tools.controlsFromUrl("?spanish=off", { ladderSpanish: true }), {
    ladderSpanish: false,
  });
  assert.deepEqual(tools.normalizeControls("x"), { ladderSpanish: false });
});

test("placement staircase: up on 3/3, down on 0-1, places on 2/3, on a reversal, at the ends and after 5 texts", () => {
  const run = (band, scores) => {
    let p = place.newPlacement(band);
    for (const c of scores) {
      if (p.result) break;
      p = place.recordProbe(p, { correct: c, total: 3 });
    }
    return p;
  };
  assert.equal(run("6-8", [2]).result, 4);
  assert.equal(run("6-8", [3, 2]).result, 5);
  assert.equal(run("6-8", [3, 3, 1]).result, 5);
  assert.equal(run("6-8", [0, 3]).result, 3);
  assert.equal(run("6-8", [3, 3, 3]).result, 6);
  assert.equal(run("3-5", [0, 0]).result, 1);
  const long = run("3-5", [3, 3, 3, 3, 3]);
  assert.equal(long.result, 6);
  assert.ok(long.probes.length <= place.MAX_PROBES);
  assert.equal(place.normalizePlacement("x"), null);
  assert.equal(
    place.normalizePlacement({ step: 99, probes: [{}], result: 2.5 }).step,
    ladder.LADDER_STEPS,
  );
});

test("a round read with a tool is saved as read with help", () => {
  const p = passages[0];
  const state = ladder.normalizeLadder({
    step: 1,
    open: { id: p.id, picks: [], level: "easier", help: true },
  });
  assert.equal(state.open.level, "easier");
  const done = ladder.finishRound(state, p, [0, 1, 2], "2026-11-06", { help: true });
  assert.equal(done.history.at(-1).help, true);
  assert.equal(ladder.normalizeLadder(done).history.at(-1).help, true);
});

test("the ladder view renders the tools, hides them during placement, and keeps questions in English", async () => {
  const dom = new JSDOM("<body></body>", {
    url: "https://example.test/access-practice-lab/ladder?grades=6-8",
  });
  for (const k of ["window", "document", "location"])
    globalThis[k] = k === "window" ? dom.window : dom.window[k];
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () => read(`content/${String(url).split("/content/")[1].split("?")[0]}`),
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: dom.window.localStorage,
    configurable: true,
  });
  dom.window.localStorage.setItem(tools.TEACHER_KEY, JSON.stringify({ ladderSpanish: true }));
  const view = await import("../access-practice-lab/src/views/ladder.js");
  const { toHtml } = await import("../access-practice-lab/src/util.js");
  for (const lang of ["en", "es", "bi"]) {
    const out = await view.render({ prefs: { lang }, band: "6-8", route: { view: "ladder" } });
    document.body.innerHTML = toHtml(out.html);
    assert.equal(document.querySelectorAll("[data-ld-level]").length, 3, lang);
    assert.ok(document.querySelectorAll(".gm-passage span.lw").length > 20, lang);
    assert.ok(document.querySelector("[data-ld-spanish] [lang=es]"), lang);
    assert.ok(
      !document.querySelector(".gm-questions [lang=es] legend"),
      "questions never translated",
    );
    assert.ok(document.querySelector("[data-ld-place-start]"));
  }
  dom.window.localStorage.setItem(
    "accessPracticeLab:v1:reading-ladder-placement",
    JSON.stringify({ "6-8": place.newPlacement("6-8") }),
  );
  const out = await view.render({ prefs: { lang: "en" }, band: "6-8", route: { view: "ladder" } });
  document.body.innerHTML = toHtml(out.html);
  assert.ok(document.querySelector(".ld-placement-banner"));
  assert.equal(document.querySelectorAll("span.lw, [data-ld-level], [data-ld-spanish]").length, 0);
  assert.doesNotMatch(document.body.textContent, /Lexile (level|measure) of|your WIDA level is/i);
});
